/**
 * Federal Tax Brackets for 2025
 * Source: IRS Publication 15-T (projected)
 *
 * IMPORTANT: This is the single authoritative source for tax brackets.
 * Do NOT duplicate these values elsewhere in the codebase.
 */

export const TAX_YEAR = 2025;

/**
 * Federal Income Tax Brackets (Standard Rates)
 */
export const FEDERAL_TAX_BRACKETS = {
    single: [
        { rate: 0.10, limit: 11600 },
        { rate: 0.12, limit: 47150 },
        { rate: 0.22, limit: 100525 },
        { rate: 0.24, limit: 191950 },
        { rate: 0.32, limit: 243725 },
        { rate: 0.35, limit: 609350 },
        { rate: 0.37, limit: Infinity }
    ],
    married: [
        { rate: 0.10, limit: 23200 },
        { rate: 0.12, limit: 94300 },
        { rate: 0.22, limit: 201050 },
        { rate: 0.24, limit: 383900 },
        { rate: 0.32, limit: 487450 },
        { rate: 0.35, limit: 731200 },
        { rate: 0.37, limit: Infinity }
    ],
    head: [
        { rate: 0.10, limit: 16550 },
        { rate: 0.12, limit: 63100 },
        { rate: 0.22, limit: 100500 },
        { rate: 0.24, limit: 191950 },
        { rate: 0.32, limit: 243700 },
        { rate: 0.35, limit: 609350 },
        { rate: 0.37, limit: Infinity }
    ]
};

/**
 * Long-Term Capital Gains Tax Brackets
 */
export const LTCG_BRACKETS = {
    single: [
        { rate: 0.00, limit: 47025 },   // 0% bracket
        { rate: 0.15, limit: 518900 },  // 15% bracket
        { rate: 0.20, limit: Infinity } // 20% bracket
    ],
    married: [
        { rate: 0.00, limit: 94050 },
        { rate: 0.15, limit: 583750 },
        { rate: 0.20, limit: Infinity }
    ],
    head: [
        { rate: 0.00, limit: 63000 },
        { rate: 0.15, limit: 551350 },
        { rate: 0.20, limit: Infinity }
    ]
};

/**
 * Standard Deductions
 */
export const STANDARD_DEDUCTION = {
    single: 14600,
    married: 29200,
    head: 21900
};

/**
 * Additional Standard Deduction for Age 65+
 */
export const ADDITIONAL_DEDUCTION_AGE_65 = {
    single: 1950,
    married: 1550,  // Per person
    head: 1950
};

/**
 * Helper: Get bracket ceiling for a specific rate
 * @param {string} filingStatus - 'single', 'married', or 'head'
 * @param {number} targetRate - Target tax rate (e.g., 0.12, 0.22)
 * @returns {number} - Income limit for that bracket
 */
export function getBracketCeiling(filingStatus, targetRate = 0.22) {
    const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.single;
    const bracket = brackets.find(b => b.rate === targetRate);
    return bracket ? bracket.limit : brackets[brackets.length - 2].limit; // Fallback to second-highest bracket
}

/**
 * Helper: Get LTCG bracket ceiling
 * @param {string} filingStatus - 'single', 'married', or 'head'
 * @param {number} targetRate - Target LTCG rate (0.00, 0.15, 0.20)
 * @returns {number} - Income limit for that bracket
 */
export function getLTCGLimit(filingStatus, targetRate = 0.00) {
    const brackets = LTCG_BRACKETS[filingStatus] || LTCG_BRACKETS.single;
    const bracket = brackets.find(b => b.rate === targetRate);
    return bracket ? bracket.limit : 0;
}

/**
 * Calculate federal income tax using marginal rates
 * @param {number} taxableIncome - Taxable income
 * @param {string} filingStatus - Filing status
 * @returns {number} - Federal income tax
 */
export function calculateFederalTax(taxableIncome, filingStatus) {
    if (taxableIncome <= 0) return 0;

    const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.single;
    let tax = 0;
    let previousLimit = 0;

    for (const bracket of brackets) {
        if (taxableIncome > previousLimit) {
            const taxableInBracket = Math.min(taxableIncome - previousLimit, bracket.limit - previousLimit);
            tax += taxableInBracket * bracket.rate;
            previousLimit = bracket.limit;
        } else {
            break;
        }
    }

    return tax;
}

/**
 * Calculate LTCG tax
 * @param {number} ltcg - Long-term capital gains
 * @param {number} ordinaryIncome - Ordinary taxable income (stacks on top)
 * @param {string} filingStatus - Filing status
 * @returns {number} - LTCG tax
 */
export function calculateLTCGTax(ltcg, ordinaryIncome, filingStatus) {
    if (ltcg <= 0) return 0;

    const brackets = LTCG_BRACKETS[filingStatus] || LTCG_BRACKETS.single;
    let tax = 0;
    let income = ordinaryIncome; // LTCG stacks on top of ordinary income

    for (const bracket of brackets) {
        const bracketStart = Math.max(0, bracket.limit - ordinaryIncome);
        if (income + ltcg > bracket.limit) {
            const amountInBracket = Math.min(ltcg, bracket.limit - income);
            if (amountInBracket > 0) {
                tax += amountInBracket * bracket.rate;
                income += amountInBracket;
                ltcg -= amountInBracket;
            }
        } else {
            tax += ltcg * bracket.rate;
            break;
        }
    }

    return tax;
}
