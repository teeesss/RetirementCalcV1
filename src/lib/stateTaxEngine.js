import { STATE_BRACKETS, STATE_DEDUCTIONS } from '../data/stateTaxBrackets';

/**
 * Calculate State Income Tax
 * Uses data from stateTaxBrackets.js for progressive calculations.
 *
 * @param {Object} params
 * @param {string} params.state - State Code (e.g. 'FL', 'AR', 'CA')
 * @param {number} params.taxableIncome - Federal AGI (Used as proxy for State Taxable Income base)
 * @param {string} params.filingStatus - 'single', 'married', 'head'
 * @returns {number} Estimated state tax liability
 */
export const calculateStateTaxModel = ({ state, taxableIncome, filingStatus }) => {
    if (!state) return 0;
    const code = state.toUpperCase();
    const stateData = STATE_BRACKETS[code];

    // Unknown state: Return 0 (Caller 'taxEngine.js' falls back to flat rate override if this returns 0?
    // Actually, taxEngine uses this result if enabled. If 0, it is 0.)
    if (!stateData) return 0;

    // 1. Flat Tax Logic (TX, FL, WA, etc.)
    if (Object.prototype.hasOwnProperty.call(stateData, 'flat')) {
        return Math.max(0, taxableIncome * stateData.flat);
    }

    // 2. Progressive Tax Logic
    // Step A: Apply State Standard Deduction
    const deductions = STATE_DEDUCTIONS[code];
    // Simple mapping: 'married'/'joint' -> married, else single. Head of Household usually follows Single or Married depending on state, mapping to Single for MVP safety.
    const isMarried = filingStatus === 'married' || filingStatus === 'joint';
    const stdDeduction = deductions ? (isMarried ? deductions.married : deductions.single) : 0;

    const stateTaxable = Math.max(0, taxableIncome - stdDeduction);

    // Step B: Apply Brackets
    const brackets = isMarried ? stateData.married : stateData.single;

    if (!brackets) return 0;

    let tax = 0;
    let prevLimit = 0;

    for (const [rate, limit] of brackets) {
        if (stateTaxable > prevLimit) {
            const inBracket = Math.min(stateTaxable, limit) - prevLimit;
            tax += inBracket * rate;
            prevLimit = limit;
        }
    }

    // 3. Specific State Surcharges
    // California Mental Health Services Act: 1% on income > $1M
    if (code === 'CA' && stateTaxable > 1000000) {
        tax += (stateTaxable - 1000000) * 0.01;
    }

    return tax;
};
