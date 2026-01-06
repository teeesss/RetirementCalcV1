/**
 * Monte Carlo Simulation Worker
 */

self.onmessage = (e) => {
    const {
        startAge,
        endAge,
        iterations,
        equityReturn,
        equityVolatility,
        cryptoReturn,
        cryptoVolatility,
        correlation,
        ledger,
        initialBalances,
        spendingStrategy,
        spendingParams,
        enableCAPE = false,
        requestId
    } = e.data;

    const years = endAge - startAge + 1;
    // console.log(`DIAGNOSTIC: MC Worker Params...`);

    const results = [];
    const finalBalances = [];
    const successFlags = [];
    const ruinAges = [];

    for (let iter = 0; iter < iterations; iter++) {
        if (iter % 100 === 0) {
            self.postMessage({ type: 'progress', progress: (iter / iterations) * 100 });
        }

        // Initialize with START-OF-YEAR 0 balances (before any flows)
        // This is critical: initialBalances captures state BEFORE Year 0 flows.
        // ledger[0].balances is AFTER Year 0 flows. Using the former avoids double-counting.
        let currentBalances = { ...(initialBalances || ledger[0]?.balances?.details || ledger[0]?.balances || {}) };

        let trialSuccess = true;
        let ruinAgeRecorded = false;
        const trialYearResults = [];

        for (let y = 0; y < years; y++) {
            const age = startAge + y;
            const yearIndex = Math.min(y, ledger.length - 1);
            const baseYearData = ledger[yearIndex];

            // Asset keys for calculations (granular only - no aggregates)
            const assetKeys = ['traditionalClient', 'traditionalSpouse', 'rothClient', 'rothSpouse', 'hsaClient', 'hsaSpouse', 'brokerage', 'crypto', 'cash'];

            // 1. Generate Returns (with CAPE Adjustment)
            let capedEquityReturn = equityReturn;
            if (enableCAPE && y < 10) {
                capedEquityReturn -= 0.02; // Mean Reversion Drag
            }

            const { eqRet: simEq, crRet: simCr } = simulateYear(
                capedEquityReturn, equityVolatility,
                cryptoReturn, cryptoVolatility,
                correlation
            );

            // STRESS TEST: Market Drop Override (Year 0)
            let eqRet = simEq;
            let crRet = simCr;
            if (e.data.stressTest?.marketDrop > 0 && y === 0) {
                eqRet = -(e.data.stressTest.marketDrop / 100);
                // Assume crypto drops 1.5x of equity in a crash scenario
                crRet = -(e.data.stressTest.marketDrop / 100) * 1.5;
            }

            if (iter === 0 && y === 0) {
                // Diagnostic removed
            }

            // 2. Growth & Cash Flow
            const flow = { ...(baseYearData.cashFlow?.byAccount || {}) };

            // --- Dynamic Spending Adjustment ---
            // Calculate what the "deterministic" spending was
            const totalAssetsAtStart = Object.values(currentBalances).reduce((a, b) => a + b, 0);

            // Only adjust if we have a strategy and it's retirement years
            if (spendingStrategy && spendingStrategy !== 'fixed' && baseYearData.isRetired) {
                let targetSpending = baseYearData.annualExpenses; // Default from ledger

                if (spendingStrategy === 'percentage') {
                    const rate = (spendingParams?.percentage || 4) / 100;
                    targetSpending = totalAssetsAtStart * rate;
                } else if (spendingStrategy === 'guytonKlinger') {
                    // Simplified GK implementation for MC
                    const initialRate = (spendingParams?.guytonKlinger?.initialRate || 4) / 100;
                    // ... implementation details for GK would go here, but for now let's at least scale by percentage
                    targetSpending = totalAssetsAtStart * initialRate;
                }

                // Calculate correction factor
                const ledgerSpending = baseYearData.annualExpenses;
                const correctionFactor = ledgerSpending > 0 ? targetSpending / ledgerSpending : 1;

                // Scale withdrawals proportionally
                ['traditionalClient', 'traditionalSpouse', 'rothClient', 'rothSpouse', 'brokerage', 'crypto', 'cash'].forEach(acc => {
                    if (flow[acc] < 0) { // It's a withdrawal
                        flow[acc] *= correctionFactor;
                    }
                });
            }

            // Apply Flows (Contributions, Withdrawals, Taxes, Surplus - all netted out)
            Object.keys(flow).forEach(key => {
                if (currentBalances[key] !== undefined) {
                    currentBalances[key] += flow[key];
                }
            });

            // Apply Returns (Stochastic)
            // Note: Ledger uses effectiveROI = 1 + growthRate.

            // Asset Mapping for Returns
            // Equity-like: Traditional, Roth, Brokerage, HSA
            const equityKeys = ['traditionalClient', 'traditionalSpouse', 'rothClient', 'rothSpouse', 'brokerage', 'hsaClient', 'hsaSpouse'];
            equityKeys.forEach(key => {
                if (currentBalances[key]) {
                    currentBalances[key] *= (1 + eqRet);
                }
            });

            // Crypto
            if (currentBalances.crypto) {
                currentBalances.crypto *= (1 + crRet);
            }

            // Cash / Fixed Income (if any specific key needs low volatility)
            // Ledger logic: balances.cash *= 1.04;
            // We should probably explicitly handle cash growth if we want strict match.
            // For now, let's treat 'cash' as fixed 4% or 0 volatility equity?
            // Let's standardise: Cash gets 0% real return or strictly 4% nominal?
            // Ledger uses hardcoded 1.04.
            if (currentBalances.cash) {
                currentBalances.cash *= 1.04;
            }

            // Re-sum total
            let total = 0;
            assetKeys.forEach(k => {
                total += (currentBalances[k] || 0);
            });

            if (isNaN(total) && !self.hasLoggedNaN) {
                self.hasLoggedNaN = true;
                // Silent catch, logic below handles it
            }

            if (total <= 0 || isNaN(total)) {
                trialSuccess = false;
                total = 0;
                // Zero out balances to prevent zombie recovery
                assetKeys.forEach(k => currentBalances[k] = 0);
            }

            // Track ruin
            if (total <= 0 && !ruinAgeRecorded) {
                ruinAges.push(age);
                ruinAgeRecorded = true;
            }

            trialYearResults.push({
                age,
                totalBalance: Math.max(0, total)
            });

            if (!trialSuccess) {
                // Fill remaining years with 0
                for (let r = y + 1; r < years; r++) {
                    trialYearResults.push({ age: startAge + r, totalBalance: 0 });
                }
                break; // STRICT EXIT
            }

            // 3. Dynamic Rebalancing (Annual)
            // Revert allocation to initial target weights (Equity vs Crypto)
            // "Sell Winners, Buy Losers"
            if (total > 0 && e.data.rebalance !== false) { // Default enabled
                // Calculate Target Allocation from base ledger (Year 0)
                // NOTE: We do this once outside loop ideally, but here for safety
                // Let's assume initial weights from Year 0 of THIS trial (which matches ledger[0])
                const initBal = ledger[0].balances.details || ledger[0].balances;
                const initTotal = Object.values(initBal).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
                const targetCryptoRatio = (initBal.crypto || 0) / (initTotal || 1);

                const currCrypto = currentBalances.crypto;
                const targetCrypto = total * targetCryptoRatio;
                const diff = targetCrypto - currCrypto; // If positive, buy crypto. If negative, sell.

                // Apply adjustment
                if (Math.abs(diff) > 1) { // Threshold
                    currentBalances.crypto += diff;

                    // Distribute -diff across others (Equity) pro-rata
                    const equityKeys = ['traditionalClient', 'traditionalSpouse', 'rothClient', 'rothSpouse', 'brokerage', 'hsaClient', 'hsaSpouse'];
                    const totalEquity = equityKeys.reduce((sum, k) => sum + (currentBalances[k] || 0), 0);

                    if (totalEquity > 0) {
                        equityKeys.forEach(k => {
                            const share = (currentBalances[k] || 0) / totalEquity;
                            currentBalances[k] -= (diff * share);
                        });
                    }
                }
            }
        }

        const lastYearRes = trialYearResults[trialYearResults.length - 1];
        finalBalances.push(lastYearRes ? lastYearRes.totalBalance : 0);
        successFlags.push(trialSuccess);
        results.push(trialYearResults);
    }

    // Calculate Percentiles
    const percentiles = calculatePercentiles(results);
    const successRate = successFlags.filter(s => s).length / iterations;

    // Failure Stats
    const failureStats = {
        count: ruinAges.length,
        averageAgeOfRuin: ruinAges.length > 0 ? (ruinAges.reduce((a, b) => a + b, 0) / ruinAges.length) : 0,
        minAgeOfRuin: ruinAges.length > 0 ? Math.min(...ruinAges) : 0,
        maxAgeOfRuin: ruinAges.length > 0 ? Math.max(...ruinAges) : 0
    };

    // Calculate initial balance for Stats
    const initialB = ledger[0].totalBalance || 0;

    console.log("DIAGNOSTIC MC FINISHED - Final Balances (First 10):", finalBalances.slice(0, 10));

    self.postMessage({
        type: 'result',
        requestId,
        results: {
            iterations,
            successRate,
            percentiles,
            initialBalance: initialB,
            finalBalances: {
                mean: finalBalances.reduce((a, b) => a + b, 0) / finalBalances.length,
                median: percentile(finalBalances, 0.5),
                p10: percentile(finalBalances, 0.1),
                p90: percentile(finalBalances, 0.9)
            },
            years,
            failureStats
        }
    });
};


function simulateYear(muE, sigmaE, muC, sigmaC, rho) {
    // v2.0: Use Student's t-Distribution (Fat Tails)
    const df = 5; // Degrees of Freedom (Lower = Fatter tails. 5 is standard for markets)
    const z1 = generateStudentT(df);
    const z2 = generateStudentT(df);

    // Cholesky 2x2 for correlated returns
    let eqRet = muE + sigmaE * z1;
    let crRet = muC + sigmaC * (rho * z1 + Math.sqrt(1 - rho * rho) * z2);

    // CRITICAL: Clamp returns to realistic bounds
    // Max loss: 75% in a single year (Great Depression was ~48%)
    // Max gain: 200% in a single year (crypto can be volatile but cap it)
    eqRet = Math.max(-0.75, Math.min(2.0, eqRet));
    crRet = Math.max(-0.90, Math.min(5.0, crRet)); // Crypto more volatile

    return { eqRet, crRet };
}

function generateStandardNormal() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateStudentT(df) {
    const z = generateStandardNormal();
    const v = generateChiSquared(df);
    return z / Math.sqrt(v / df);
}

function generateChiSquared(df) {
    let sum = 0;
    for (let i = 0; i < df; i++) {
        const z = generateStandardNormal();
        sum += z * z;
    }
    return sum;
}

function calculatePercentiles(results) {
    const years = results[0].length;
    const pData = { p10: [], p25: [], p50: [], p75: [], p90: [] };

    for (let y = 0; y < years; y++) {
        const balances = results.map(r => r[y].totalBalance).sort((a, b) => a - b);
        pData.p10.push(percentileSorted(balances, 0.1));
        pData.p25.push(percentileSorted(balances, 0.25));
        pData.p50.push(percentileSorted(balances, 0.5));
        pData.p75.push(percentileSorted(balances, 0.75));
        pData.p90.push(percentileSorted(balances, 0.9));
    }
    return pData;
}

function percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    return percentileSorted(sorted, p);
}

function percentileSorted(sorted, p) {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)] || 0;
}
