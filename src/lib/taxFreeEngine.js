/**
 * Tax-Free Retirement Engine
 *
 * Core logic for implementing the three-bucket withdrawal strategy
 * to achieve 0-5% effective tax rate
 */

/**
 * Calculate 0% tax thresholds for the three-bucket strategy
 * @param {string} filingStatus - 'single', 'married', or 'head'
 * @param {number} year - Tax year
 * @returns {Object} Bucket thresholds
 */
export function calculate0PercentThresholds(filingStatus) {
    // Standard Deduction (Bucket #1 - Traditional IRA withdrawal)
    const standardDeduction = {
        single: 15000,
        married: 30000,
        head: 22500
    }[filingStatus] || 15000;

    // 0% Long-Term Capital Gains Threshold (Bucket #2 - Brokerage)
    const ltcgThreshold = {
        single: 48350,   // 2025 estimate
        married: 96700,  // 2025 estimate
        head: 64750      // 2025 estimate
    }[filingStatus] || 48350;

    return {
        bucket1Max: standardDeduction,    // Max Traditional IRA withdrawal at 0% tax
        bucket2Max: ltcgThreshold,        // Max capital gain realization at 0% tax
        bucket3: Infinity,                 // Roth (unlimited, invisible to IRS)
        totalTaxFree: standardDeduction + ltcgThreshold // The 0% LTCG threshold is applied to taxable income after standard deduction
    };
}

/**
 * Optimize withdrawals using three-bucket tax-free strategy
 * @param {number} gap - Amount needed to cover expenses
 * @param {Object} balances - Current account balances
 * @param {number} currentIncome - Current year income (salary, SS, etc.)
 * @param {string} filingStatus - Filing status
 * @returns {Object} Optimized withdrawal amounts by account
 */
export function optimizeTaxFreeWithdrawal(gap, balances, currentIncome, filingStatus) {
    const thresholds = calculate0PercentThresholds(filingStatus);
    let remaining = gap;

    const withdrawals = {
        traditional: 0,
        brokerage: 0,
        roth: 0,
        hsa: 0,
        crypto: 0,
        cash: 0,
        taxImpact: {
            federalTax: 0,
            effectiveRate: 0,
            bucket1Tax: 0,  // Should be 0
            bucket2Tax: 0,  // Should be 0
            bucket3Tax: 0   // Should be 0
        }
    };

    // Bucket #1: Fill Standard Deduction from Traditional IRA
    // This income is offset by the standard deduction, so $0 federal tax
    const bucket1Room = Math.max(0, thresholds.bucket1Max - currentIncome);

    if (bucket1Room > 0 && remaining > 0) {
        const traditionalAvailable = (balances.traditional?.client || 0) + (balances.traditional?.spouse || 0);
        withdrawals.traditional = Math.min(remaining, bucket1Room, traditionalAvailable);
        remaining -= withdrawals.traditional;
    }

    // Bucket #2: Realize capital gains at 0% LTCG rate
    // Gains are taxed at 0% if total income stays below threshold
    if (remaining > 0) {
        const currentTaxableIncome = currentIncome + withdrawals.traditional;
        const bucket2Room = Math.max(0, thresholds.bucket2Max - currentTaxableIncome);

        if (bucket2Room > 0) {
            // Priority: Brokerage -> Crypto -> Cash

            // 2a. Brokerage
            const brokerageAvailable = balances.brokerage?.joint || 0;
            const brokerageBasis = balances.brokerageBasis?.joint || 0;
            const brokBasisRatio = brokerageAvailable > 0 ? brokerageBasis / brokerageAvailable : 0.5;
            const brokGainRatio = 1 - brokBasisRatio;

            if (brokerageAvailable > 0 && remaining > 0) {
                const gainToRealize = Math.min(remaining * brokGainRatio, bucket2Room);
                const saleAmount = brokGainRatio > 0 ? gainToRealize / brokGainRatio : remaining;
                const actualWithdrawal = Math.min(saleAmount, brokerageAvailable, remaining);
                withdrawals.brokerage = actualWithdrawal;
                remaining -= actualWithdrawal;
            }

            // 2b. Crypto
            if (remaining > 0) {
                const cryptoAvailable = calculateCryptoBalance(balances.crypto);
                // Assume 0 basis for crypto (conservative tax estimate) or use a default if available
                // const cryptoGainRatio = 1.0;
                const currentGainRealized = withdrawals.brokerage * brokGainRatio;
                const remainingBucket2Room = Math.max(0, bucket2Room - currentGainRealized);

                if (cryptoAvailable > 0 && remainingBucket2Room > 0) {
                    const cryptoWithdrawal = Math.min(remaining, cryptoAvailable, remainingBucket2Room);
                    withdrawals.crypto = cryptoWithdrawal;
                    remaining -= cryptoWithdrawal;
                }
            }

            // 2c. Cash (Post-Tax, always 0% tax, no threshold impact)
            if (remaining > 0) {
                const cashAvailable = balances.cash || 0;
                const cashWithdrawal = Math.min(remaining, cashAvailable);
                withdrawals.cash = cashWithdrawal;
                remaining -= cashWithdrawal;
            }

            // Track that this gain is at 0% tax
            withdrawals.taxImpact.bucket2Tax = 0;
        }
    }

    // Bucket #3: Fill remaining gap from Roth (invisible to IRS)
    if (remaining > 0) {
        const rothAvailable = (balances.roth?.client || 0) + (balances.roth?.spouse || 0);
        withdrawals.roth = Math.min(remaining, rothAvailable);
        remaining -= withdrawals.roth;
    }

    // Bucket #3.5: HSA (Tax-free if used for medical, but here we treat it as tax-free gap filler - LAST tax-free resort)
    if (remaining > 0) {
        const hsaAvailable = (balances.hsa?.client || 0) + (balances.hsa?.spouse || 0);
        withdrawals.hsa = Math.min(remaining, hsaAvailable);
        remaining -= withdrawals.hsa;
    }

    // Bucket #4: Last Resort (Taxable Traditional IRA)
    if (remaining > 0) {
        const currentTradUsed = (withdrawals.traditional || 0);
        const traditionalAvailable = (balances.traditional?.client || 0) + (balances.traditional?.spouse || 0);
        const lastResort = Math.min(remaining, traditionalAvailable - currentTradUsed);
        withdrawals.traditional += lastResort;
        remaining -= lastResort;
    }

    // Calculate effective tax rate
    const totalWithdrawn = (withdrawals.traditional || 0) +
        (withdrawals.brokerage || 0) +
        (withdrawals.roth || 0) +
        (withdrawals.hsa || 0) +
        (withdrawals.crypto || 0) +
        (withdrawals.cash || 0);

    withdrawals.taxImpact.effectiveRate = totalWithdrawn > 0
        ? (withdrawals.taxImpact.federalTax / totalWithdrawn) * 100
        : 0;

    return { ...withdrawals, gap: remaining };
}

/**
 * Calculate three-bucket inventory summary
 * @param {Object} assets - Current asset balances
 * @returns {Object} Bucket summary
 */
export function calculateBucketInventory(assets) {
    const preTax = (assets.traditional?.client || 0) +
        (assets.traditional?.spouse || 0) +
        (assets.hsa?.client || 0) +
        (assets.hsa?.spouse || 0);

    const afterTax = (assets.brokerage?.joint || 0) + (assets.cash || 0) + (calculateCryptoBalance(assets.crypto) || 0);
    const afterTaxBasis = assets.brokerageBasis?.joint || 0;
    const unrealizedGains = Math.max(0, (assets.brokerage?.joint || 0) - afterTaxBasis);

    const taxFree = (assets.roth?.client || 0) + (assets.roth?.spouse || 0);

    const total = preTax + afterTax + taxFree;

    return {
        preTax: {
            total: preTax,
            percentage: total > 0 ? (preTax / total) * 100 : 0,
            accounts: ['Traditional IRA', 'Traditional 401k', 'HSA']
        },
        afterTax: {
            total: afterTax,
            basis: afterTaxBasis,
            unrealizedGains: unrealizedGains,
            gainPercentage: afterTax > 0 ? (unrealizedGains / afterTax) * 100 : 0,
            percentage: total > 0 ? (afterTax / total) * 100 : 0,
            accounts: ['Taxable Brokerage', 'Crypto', 'Cash']
        },
        taxFree: {
            total: taxFree,
            percentage: total > 0 ? (taxFree / total) * 100 : 0,
            accounts: ['Roth IRA', 'Roth 401k']
        },
        total,
        balance: {
            isBalanced: preTax > 0 && afterTax > 0 && taxFree > 0,
            recommendation: getBucketRecommendation(preTax, afterTax, taxFree, total)
        }
    };
}

function calculateCryptoBalance(crypto) {
    if (typeof crypto === 'number') return crypto;
    if (!crypto) return 0;
    const safeNum = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const clean = val.replace(/,/g, '').trim();
            if (clean === '') return 0;
            const parsed = Number(clean);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };
    return (
        safeNum(crypto.btc?.quantity) * safeNum(crypto.btc?.price) +
        safeNum(crypto.eth?.quantity) * safeNum(crypto.eth?.price) +
        safeNum(crypto.sol?.quantity) * safeNum(crypto.sol?.price)
    );
}

/**
 * Get recommendation for bucket rebalancing
 */
function getBucketRecommendation(preTax, afterTax, taxFree, total) {
    if (total === 0) return 'Start by funding all three buckets';

    const prePercent = (preTax / total) * 100;
    const afterPercent = (afterTax / total) * 100;
    const taxFreePercent = (taxFree / total) * 100;

    if (taxFreePercent < 15) {
        return 'Consider Roth conversions to build "invisible money" bucket';
    }
    if (afterPercent < 20) {
        return 'Build taxable brokerage for 0% capital gains harvesting';
    }
    if (prePercent < 30) {
        return 'Increase pre-tax contributions for current tax savings';
    }

    return 'Buckets are well-balanced for tax-free retirement strategy';
}

/**
 * Calculate optimal Roth conversion amount
 * @param {number} traditionalBalance - Current traditional IRA balance
 * @param {number} currentIncome - Current year income
 * @param {string} targetBracket - Target tax bracket ('12', '22', '24')
 * @param {string} filingStatus - Filing status
 * @returns {Object} Optimal conversion details
 */
export function calculateOptimalRothConversion(traditionalBalance, currentIncome, targetBracket, filingStatus) {
    const bracketTops = {
        single: { '12': 48475, '22': 103350, '24': 197300 },
        married: { '12': 96950, '22': 206700, '24': 394600 },
        head: { '12': 72750, '22': 113000, '24': 197300 }
    };

    const bracketTop = bracketTops[filingStatus]?.[targetBracket] || bracketTops.single['22'];
    const roomInBracket = Math.max(0, bracketTop - currentIncome);
    const optimalConversion = Math.min(roomInBracket, traditionalBalance);

    const taxOnConversion = optimalConversion * (parseInt(targetBracket) / 100);

    return {
        amount: optimalConversion,
        taxCost: taxOnConversion,
        newTaxFreeBalance: optimalConversion,
        benefit: `Builds "invisible money" for tax-free withdrawals in retirement`,
        effectiveRate: optimalConversion > 0 ? (taxOnConversion / optimalConversion) * 100 : 0
    };
}
