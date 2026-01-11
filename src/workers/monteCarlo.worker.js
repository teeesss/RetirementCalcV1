/**
 * Monte Carlo Simulation Worker
 */
import SeedRandom from 'seedrandom';

// INLINE HISTORICAL SCENARIOS (Workers have import issues with ES modules)
const HISTORICAL_SCENARIOS = {
  random: { name: 'Random (Default)', years: [] },
  greatDepression: {
    name: 'Great Depression (1929-1933)',
    years: [
      { year: 0, equityReturn: -0.43, cryptoReturn: -0.65 },
      { year: 1, equityReturn: -0.34, cryptoReturn: -0.5 },
      { year: 2, equityReturn: -0.53, cryptoReturn: -0.7 },
      { year: 3, equityReturn: -0.05, cryptoReturn: -0.1 },
      { year: 4, equityReturn: 0.46, cryptoReturn: 0.6 },
    ],
  },
  dotComCrash: {
    name: 'Dot-Com Crash (2000-2002)',
    years: [
      { year: 0, equityReturn: -0.1, cryptoReturn: -0.15 },
      { year: 1, equityReturn: -0.13, cryptoReturn: -0.2 },
      { year: 2, equityReturn: -0.23, cryptoReturn: -0.35 },
      { year: 3, equityReturn: 0.26, cryptoReturn: 0.35 },
    ],
  },
  financialCrisis2008: {
    name: '2008 Financial Crisis',
    years: [
      { year: 0, equityReturn: -0.38, cryptoReturn: -0.55 },
      { year: 1, equityReturn: 0.23, cryptoReturn: 0.3 },
      { year: 2, equityReturn: 0.13, cryptoReturn: 0.2 },
      { year: 3, equityReturn: 0.0, cryptoReturn: 0.05 },
    ],
  },
  lostDecade: {
    name: 'Lost Decade (2000-2010)',
    years: [
      { year: 0, equityReturn: -0.1, cryptoReturn: -0.15 },
      { year: 1, equityReturn: -0.13, cryptoReturn: -0.2 },
      { year: 2, equityReturn: -0.23, cryptoReturn: -0.35 },
      { year: 3, equityReturn: 0.26, cryptoReturn: 0.35 },
      { year: 4, equityReturn: 0.09, cryptoReturn: 0.12 },
      { year: 5, equityReturn: 0.03, cryptoReturn: 0.05 },
      { year: 6, equityReturn: 0.14, cryptoReturn: 0.18 },
      { year: 7, equityReturn: -0.38, cryptoReturn: -0.55 },
      { year: 8, equityReturn: 0.23, cryptoReturn: 0.3 },
      { year: 9, equityReturn: 0.13, cryptoReturn: 0.2 },
    ],
  },
  bearMarketStart: {
    name: 'Bear Market Start (5yr)',
    years: [
      { year: 0, equityReturn: -0.2, cryptoReturn: -0.35 },
      { year: 1, equityReturn: -0.1, cryptoReturn: -0.2 },
      { year: 2, equityReturn: 0.05, cryptoReturn: 0.08 },
      { year: 3, equityReturn: -0.05, cryptoReturn: -0.1 },
      { year: 4, equityReturn: 0.15, cryptoReturn: 0.2 },
    ],
  },
  bullMarketStart: {
    name: 'Bull Market Start (5yr)',
    years: [
      { year: 0, equityReturn: 0.15, cryptoReturn: 0.25 },
      { year: 1, equityReturn: 0.12, cryptoReturn: 0.2 },
      { year: 2, equityReturn: 0.1, cryptoReturn: 0.18 },
      { year: 3, equityReturn: 0.08, cryptoReturn: 0.15 },
      { year: 4, equityReturn: 0.07, cryptoReturn: 0.12 },
    ],
  },
  stagflation: {
    name: 'Stagflation (1970s)',
    years: [
      { year: 0, equityReturn: -0.17, cryptoReturn: -0.25 },
      { year: 1, equityReturn: -0.3, cryptoReturn: -0.45 },
      { year: 2, equityReturn: 0.31, cryptoReturn: 0.4 },
      { year: 3, equityReturn: 0.19, cryptoReturn: 0.25 },
      { year: 4, equityReturn: -0.12, cryptoReturn: -0.18 },
      { year: 5, equityReturn: 0.01, cryptoReturn: 0.02 },
      { year: 6, equityReturn: 0.12, cryptoReturn: 0.18 },
      { year: 7, equityReturn: 0.26, cryptoReturn: 0.35 },
      { year: 8, equityReturn: -0.1, cryptoReturn: -0.15 },
      { year: 9, equityReturn: 0.15, cryptoReturn: 0.2 },
    ],
  },
  covid2020: {
    name: 'COVID Crash (2020)',
    years: [
      { year: 0, equityReturn: 0.16, cryptoReturn: 0.3 },
      { year: 1, equityReturn: 0.27, cryptoReturn: 0.6 },
      { year: 2, equityReturn: -0.19, cryptoReturn: -0.65 },
    ],
  },
};

let rng = SeedRandom('default');

function generateStandardNormal() {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

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
    requestId,
    scenarioId = 'random',
    seed, // New param
  } = e.data;

  // Initialize RNG with specific seed or fallback
  // If request has a seed, use it. Otherwise use a predictable sequence based on scenario/params if desired, OR completely random if not specified.
  // For now, let's default to a random seed if none provided, unless we want strict existing behavior which was Math.random (effectively random seed).
  // Using string 'random' + Date might mitigate if we want randomness by default.
  // But for "Determinism", we likely want call sites to control it.
  rng = SeedRandom(seed || Math.random().toString());

  // Ensure types are numbers to prevent logic errors
  const startAgeNum = Number(startAge);
  const endAgeNum = Number(endAge);
  const years = endAgeNum - startAgeNum + 1;
  const iterationsNum = Number(iterations);
  // console.log(`DIAGNOSTIC: MC Worker Params...`);

  const results = [];
  const finalBalances = [];
  const successFlags = [];
  const ruinAges = [];

  for (let iter = 0; iter < iterationsNum; iter++) {
    if (iter % 100 === 0) {
      self.postMessage({ type: 'progress', progress: (iter / iterationsNum) * 100 });
    }

    // Initialize with START-OF-YEAR 0 balances (before any flows)
    // Ledger balances include: traditionalClient, traditionalSpouse, rothClient, rothSpouse, hsaClient, hsaSpouse, brokerage, crypto, cash
    let currentBalances = {
      traditionalClient:
        initialBalances?.traditionalClient || ledger[0]?.balances?.traditionalClient || 0,
      traditionalSpouse:
        initialBalances?.traditionalSpouse || ledger[0]?.balances?.traditionalSpouse || 0,
      rothClient: initialBalances?.rothClient || ledger[0]?.balances?.rothClient || 0,
      rothSpouse: initialBalances?.rothSpouse || ledger[0]?.balances?.rothSpouse || 0,
      hsaClient: initialBalances?.hsaClient || ledger[0]?.balances?.hsaClient || 0,
      hsaSpouse: initialBalances?.hsaSpouse || ledger[0]?.balances?.hsaSpouse || 0,
      brokerage: initialBalances?.brokerage || ledger[0]?.balances?.brokerage || 0,
      crypto: initialBalances?.crypto || ledger[0]?.balances?.crypto || 0,
      cash: initialBalances?.cash || ledger[0]?.balances?.cash || 0,
    };

    let trialSuccess = true;
    let ruinAgeRecorded = false;
    const trialYearResults = [];

    for (let y = 0; y < years; y++) {
      const age = startAgeNum + y;
      const yearIndex = Math.min(y, ledger.length - 1);
      const baseYearData = ledger[yearIndex];

      // Asset keys for calculations (granular only - no aggregates)
      const assetKeys = [
        'traditionalClient',
        'traditionalSpouse',
        'rothClient',
        'rothSpouse',
        'hsaClient',
        'hsaSpouse',
        'brokerage',
        'crypto',
        'cash',
      ];

      // 1. Generate Returns (with CAPE Adjustment)
      let capedEquityReturn = equityReturn;
      if (enableCAPE && y < 10) {
        capedEquityReturn -= 0.02; // Mean Reversion Drag
      }

      const { eqRet: simEq, crRet: simCr } = simulateYear(
        capedEquityReturn,
        equityVolatility,
        cryptoReturn,
        cryptoVolatility,
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

      // HISTORICAL SCENARIO: Override returns for specified years
      if (scenarioId && scenarioId !== 'random') {
        const scenario = HISTORICAL_SCENARIOS[scenarioId];
        if (scenario?.years) {
          const yearOverride = scenario.years.find((yd) => yd.year === y);
          if (yearOverride) {
            eqRet = yearOverride.equityReturn;
            crRet = yearOverride.cryptoReturn;
          }
        }
      }

      if (iter === 0 && y === 0) {
        // Diagnostic removed
      }

      // 2. Get reference data from ledger but DON'T re-apply flows
      // CRITICAL FIX: ledger[y].balances already HAS flows applied
      // We only use ledger for spending amounts and metadata
      // CRITICAL FIX: Spending MUST include taxes!
      // expenses.total in ledger excludes taxes.
      const rawExpenses = baseYearData.expenses?.total || baseYearData.annualExpenses || 0;
      const annualTaxes = baseYearData.expenses?.taxes || 0;
      const annualSpending = rawExpenses + annualTaxes;

      const withdrawals = baseYearData.withdrawals || {};

      if (iter === 0 && y === 0) {
        console.log(
          `DIAGNOSTIC MC Year 0: Expense=${rawExpenses}, Tax=${annualTaxes}, TotalSpending=${annualSpending}`
        );
      }

      // --- Dynamic Spending Adjustment ---
      const totalAssetsAtStart = Object.values(currentBalances).reduce((a, b) => a + b, 0);

      let targetSpending = annualSpending;

      // Only adjust if we have a strategy and it's retirement years
      if (spendingStrategy && spendingStrategy !== 'fixed' && baseYearData.isRetired) {
        if (spendingStrategy === 'percentage') {
          const rate = (spendingParams?.percentage || 4) / 100;
          targetSpending = totalAssetsAtStart * rate;
        } else if (spendingStrategy === 'guytonKlinger') {
          const initialRate = (spendingParams?.guytonKlinger?.initialRate || 4) / 100;
          targetSpending = totalAssetsAtStart * initialRate;
        }
      }

      // Apply spending as withdrawal from accounts (proportional to ledger's withdrawal pattern)
      // CRITICAL FIX: Account for income vs spending net cash flow
      // During working years: salary + ss > spending = surplus (add to brokerage)
      // During retirement: spending > salary + ss = deficit (withdraw from portfolio)

      // Read income from ledger NESTED income object: baseYearData.income.{salary, ss}
      const salary = baseYearData.income?.salary || 0;
      const ssIncome = baseYearData.income?.ss || 0;
      const totalIncome = salary + ssIncome;
      const netCashFlow = totalIncome - targetSpending; // Positive = surplus, Negative = deficit

      // DIAGNOSTIC: Log net cash flow for first iteration, first year
      if (iter === 0 && y === 0) {
        console.log(
          `DIAGNOSTIC MC Year 0: Income=${totalIncome}, Spending=${targetSpending}, NetCashFlow=${netCashFlow}`
        );
      }

      if (netCashFlow < 0) {
        // DEFICIT: Need to withdraw from portfolio to cover expenses
        const withdrawalNeeded = Math.abs(netCashFlow);

        const ledgerTotalWithdrawal =
          (withdrawals.traditional || 0) +
          (withdrawals.roth || 0) +
          (withdrawals.brokerage || 0) +
          (withdrawals.hsa || 0) +
          (withdrawals.crypto || 0) +
          (withdrawals.cash || 0);

        if (ledgerTotalWithdrawal > 0) {
          // Use ledger's tax-efficient withdrawal pattern
          const withdrawalRatios = {
            traditionalClient:
              ((withdrawals.traditional || 0) * (baseYearData.balances?.traditionalClient || 0.5)) /
              (baseYearData.balances?.traditional || 1) /
              ledgerTotalWithdrawal,
            traditionalSpouse:
              ((withdrawals.traditional || 0) * (baseYearData.balances?.traditionalSpouse || 0.5)) /
              (baseYearData.balances?.traditional || 1) /
              ledgerTotalWithdrawal,
            rothClient: ((withdrawals.roth || 0) * 0.5) / ledgerTotalWithdrawal,
            rothSpouse: ((withdrawals.roth || 0) * 0.5) / ledgerTotalWithdrawal,
            brokerage: (withdrawals.brokerage || 0) / ledgerTotalWithdrawal,
            crypto: (withdrawals.crypto || 0) / ledgerTotalWithdrawal,
            hsaClient: ((withdrawals.hsa || 0) * 0.5) / ledgerTotalWithdrawal,
            hsaSpouse: ((withdrawals.hsa || 0) * 0.5) / ledgerTotalWithdrawal,
            cash: (withdrawals.cash || 0) / ledgerTotalWithdrawal,
          };

          Object.keys(withdrawalRatios).forEach((key) => {
            if (currentBalances[key] !== undefined) {
              const withdrawal = withdrawalNeeded * withdrawalRatios[key];
              currentBalances[key] = Math.max(0, currentBalances[key] - withdrawal);
            }
          });
        } else {
          // No ledger pattern - withdraw proportionally from available accounts
          const available = totalAssetsAtStart;
          if (available > 0) {
            Object.keys(currentBalances).forEach((key) => {
              const ratio = currentBalances[key] / available;
              currentBalances[key] = Math.max(0, currentBalances[key] - withdrawalNeeded * ratio);
            });
          }
        }
      } else if (netCashFlow > 0) {
        // SURPLUS: Add to portfolio (working years - income > expenses)
        // Add to brokerage account (after-tax savings)
        currentBalances.brokerage = (currentBalances.brokerage || 0) + netCashFlow;
      }
      // If netCashFlow === 0, no change needed

      // Apply Returns (Stochastic)
      // Note: Ledger uses effectiveROI = 1 + growthRate.

      // Asset Mapping for Returns
      // Equity-like: Traditional, Roth, Brokerage, HSA
      const equityKeys = [
        'traditionalClient',
        'traditionalSpouse',
        'rothClient',
        'rothSpouse',
        'brokerage',
        'hsaClient',
        'hsaSpouse',
      ];
      equityKeys.forEach((key) => {
        if (currentBalances[key]) {
          currentBalances[key] *= 1 + eqRet;
        }
      });

      // Crypto
      if (currentBalances.crypto) {
        currentBalances.crypto *= 1 + crRet;
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
      assetKeys.forEach((k) => {
        total += currentBalances[k] || 0;
      });

      if (isNaN(total) && !self.hasLoggedNaN) {
        self.hasLoggedNaN = true;
        // Silent catch, logic below handles it
      }

      if (total <= 0 || isNaN(total)) {
        trialSuccess = false;
        total = 0;
        // Zero out balances to prevent zombie recovery
        assetKeys.forEach((k) => (currentBalances[k] = 0));
      }

      // Track ruin
      if (total <= 0 && !ruinAgeRecorded) {
        ruinAges.push(age);
        ruinAgeRecorded = true;
      }

      trialYearResults.push({
        age,
        totalBalance: Math.max(0, total),
      });

      if (!trialSuccess) {
        // Fill remaining years with 0
        for (let r = y + 1; r < years; r++) {
          trialYearResults.push({ age: startAgeNum + r, totalBalance: 0 });
        }
        break; // STRICT EXIT
      }

      // 3. Dynamic Rebalancing (Annual)
      // Revert allocation to initial target weights (Equity vs Crypto)
      // "Sell Winners, Buy Losers"
      if (total > 0 && e.data.rebalance !== false) {
        // Default enabled
        // Calculate Target Allocation from base ledger (Year 0)
        // NOTE: We do this once outside loop ideally, but here for safety
        // Let's assume initial weights from Year 0 of THIS trial (which matches ledger[0])
        const initBal = ledger[0].balances.details || ledger[0].balances;
        const initTotal = Object.values(initBal).reduce(
          (a, b) => a + (typeof b === 'number' ? b : 0),
          0
        );
        const targetCryptoRatio = (initBal.crypto || 0) / (initTotal || 1);

        const currCrypto = currentBalances.crypto;
        const targetCrypto = total * targetCryptoRatio;
        const diff = targetCrypto - currCrypto; // If positive, buy crypto. If negative, sell.

        // Apply adjustment
        if (Math.abs(diff) > 1) {
          // Threshold
          currentBalances.crypto += diff;

          // Distribute -diff across others (Equity) pro-rata
          const equityKeys = [
            'traditionalClient',
            'traditionalSpouse',
            'rothClient',
            'rothSpouse',
            'brokerage',
            'hsaClient',
            'hsaSpouse',
          ];
          const totalEquity = equityKeys.reduce((sum, k) => sum + (currentBalances[k] || 0), 0);

          if (totalEquity > 0) {
            equityKeys.forEach((k) => {
              const share = (currentBalances[k] || 0) / totalEquity;
              currentBalances[k] -= diff * share;
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
  const successRate = successFlags.filter((s) => s).length / iterationsNum;

  // Failure Stats
  const failureStats = {
    count: ruinAges.length,
    averageAgeOfRuin:
      ruinAges.length > 0 ? ruinAges.reduce((a, b) => a + b, 0) / ruinAges.length : 0,
    minAgeOfRuin: ruinAges.length > 0 ? Math.min(...ruinAges) : 0,
    maxAgeOfRuin: ruinAges.length > 0 ? Math.max(...ruinAges) : 0,
  };

  // Calculate initial balance for Stats
  const initialB = ledger[0].totalBalance || 0;

  console.log('DIAGNOSTIC MC FINISHED - Final Balances (First 10):', finalBalances.slice(0, 10));

  self.postMessage({
    type: 'result',
    requestId,
    results: {
      iterations: iterationsNum,
      successRate,
      percentiles,
      initialBalance: initialB,
      finalBalances: {
        mean: finalBalances.reduce((a, b) => a + b, 0) / finalBalances.length,
        median: percentile(finalBalances, 0.5),
        p10: percentile(finalBalances, 0.1),
        p90: percentile(finalBalances, 0.9),
      },
      years,
      failureStats,
    },
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
  crRet = Math.max(-0.9, Math.min(5.0, crRet)); // Crypto more volatile

  return { eqRet, crRet };
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
    const balances = results.map((r) => r[y].totalBalance).sort((a, b) => a - b);
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
