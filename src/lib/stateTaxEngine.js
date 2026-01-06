/**
 * State Tax Engine
 * Handles specific state tax logic for supported states (AR, FL).
 * Returns flat rate or progressive calculation based on taxable income.
 */

/*
 * Arkansas 2024/2025 Tax Brackets (Simplified Progressive Model)
 * Source: DFA Arkansas (Low/Mid/High Income Tables approximated)
 *
 * Logic:
 * - Income <= $5,299: ~2%
 * - Income <= $10,599: ~4%
 * - Income > $10,599 (High Earner Schedule):
 *   - First $5,299 @ 2%
 *   - Next $5,299 @ 4%
 *   - Over $10,599 @ 4.4% (Top Marginal Rate for 2024 is 4.4%, was 4.7%)
 */
const calculateArkansasTax = (taxableIncome) => {
    if (taxableIncome <= 0) return 0;

    // 2024 Brackets for "High Income" Table (Taxable Income >= $10,000ish)
    // We assume most users of this planner are in this bucket.
    const brackets = [
        { rate: 0.020, limit: 5299 },
        { rate: 0.040, limit: 10599 },
        { rate: 0.044, limit: Infinity }
    ];

    let tax = 0;
    let prevLimit = 0;

    for (const { rate, limit } of brackets) {
        if (taxableIncome > prevLimit) {
            const incomeInBracket = Math.min(taxableIncome, limit) - prevLimit;
            tax += incomeInBracket * rate;
            prevLimit = limit;
        }
    }

    return tax;
};

/**
 * Calculate State Income Tax
 * @param {Object} params
 * @param {string} params.state - State Code (e.g. 'FL', 'AR')
 * @param {number} params.taxableIncome - Federal Taxable Income (approx proxy)
 * @param {string} params.filingStatus - 'single', 'married', 'head'
 * @returns {number} Estimated state tax liability
 */
export const calculateStateTaxModel = ({ state, taxableIncome, filingStatus }) => {
    if (!state) return 0;

    const stateCode = state.toUpperCase();

    // Florida: 0%
    if (stateCode === 'FL') return 0;

    // Arkansas: Progressive
    if (stateCode === 'AR') {
        return calculateArkansasTax(taxableIncome);
    }

    // Default / Unknown State
    // If the user has explicitly provided a "State Tax Rate" override elsewhere,
    // that should be used by the caller as a fallback.
    // This engine only returns calculated values for known states.
    return 0;
};
