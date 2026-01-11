import STATE_DATA from '../data/state_tax_2025.json';

/**
 * State Tax Engine
 * Calculates progressive state income tax.
 */

/**
 * Calculate state tax for a specific state
 * @param {Object} params
 * @param {string} params.state - State code (e.g. 'CA', 'NY')
 * @param {number} params.taxableIncome - Federal AGI (used as proxy for State Taxable)
 * @param {string} params.filingStatus - 'single' | 'married' | 'head'
 * @returns {number} Calculated State Tax
 */
export function calculateStateTaxModel({ state, taxableIncome, filingStatus }) {
  if (!state || !STATE_DATA.states[state]) return 0;

  const stateConfig = STATE_DATA.states[state];

  // 1. Determine Standard Deduction
  // Fallback: If 'head' not defined, use 'single' (common simplification)
  const deduction =
    stateConfig.standard_deduction[filingStatus] || stateConfig.standard_deduction.single || 0;

  // 2. Adjust Taxable Income
  // Many states have different AGI definitions, but for MVP we start with Fed AGI minus State Deduction
  const stateTaxable = Math.max(0, taxableIncome - deduction);

  // 3. Apply Brackets
  // If no brackets (e.g. FL), return 0
  const brackets = stateConfig.brackets[filingStatus] || stateConfig.brackets.single;
  if (!brackets || brackets.length === 0) return 0;

  let tax = 0;
  let prevLimit = 0;

  for (const { rate, limit } of brackets) {
    // Current Bracket Range: [prevLimit, limit ?? Infinity]
    const effectiveLimit = limit === null ? Infinity : limit;

    if (stateTaxable > prevLimit) {
      const taxableInBracket = Math.min(stateTaxable, effectiveLimit) - prevLimit;
      tax += taxableInBracket * rate;
      prevLimit = effectiveLimit;
    }
  }

  return tax;
}
