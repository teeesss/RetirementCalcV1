


/**
 * Calculate available room for Roth Conversion within a target bracket.
 *
 * @param {Object} params
 * @param {number} params.taxableIncome - Current Taxable Income (after deductions)
 * @param {string} params.filingStatus - 'single', 'married', 'head'
 * @param {number} params.targetBracket - The tax rate to fill up to (e.g., 0.12, 0.22, 0.24)
 * @param {number} params.year - Current calendar year (for inflation adjustments if needed, though passed bracket likely inflation adjusted?)
 * @param {Object} params.bracketStructure - The current year's tax brackets (passed from taxEngine or constructed)
 *
 * @returns {number} The maximum amount that can be converted without exceeding the target bracket.
 */
export function calculateRothConversionUtils({
    taxableIncome,
    filingStatus,
    targetBracket,
    bracketStructure
}) {
    if (!targetBracket) return 0;

    // Safety check: specific allowed brackets to prevent converting to 37% by accident
    const allowedBrackets = [0.10, 0.12, 0.22, 0.24, 0.32];
    if (!allowedBrackets.includes(targetBracket)) {
        console.warn(`Warning: Target bracket ${targetBracket} is not a standard breakpoint. Using nearest upper limit.`);
    }

    // Identify the Ceiling of the target bracket
    // bracketStructure format: { single: [[limit, rate], [limit, rate]], married: ... }
    const brackets = bracketStructure[filingStatus];
    if (!brackets) return 0;

    let ceiling = Infinity;

    // Find the limit where the rate EXCEEDS the targetBracket
    // Example: Target 0.12. We want the limit of the 12% bracket.
    // Brackets: [[23200, 0.10], [94300, 0.12], [201050, 0.22]] (Example limits)
    // Actually typically taxEngine uses "limit IS the top of the bracket"

    for (const [rate, limit] of brackets) {
        if (rate <= targetBracket + 0.001) { // Float safety
            ceiling = limit;
        } else {
            break;
        }
    }

    // Room = Ceiling - Current Taxable
    const room = Math.max(0, ceiling - taxableIncome);

    return room;
}
