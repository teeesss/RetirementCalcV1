/**
 * Tolerance Management for Financial Tests
 *
 * Provides smart tolerance checking for monetary values and rates.
 * RULE: LLMs may NOT widen tolerances without written justification + new invariant.
 */

/**
 * Check if two monetary values are close within absolute and/or relative tolerance
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {Object} options - Tolerance options
 * @param {number} options.abs - Absolute tolerance (e.g., $50)
 * @param {number} options.rel - Relative tolerance (e.g., 0.01 for 1%)
 * @returns {boolean} - True if values are within tolerance
 */
export function isClose(actual, expected, { abs = 0, rel = 0 } = {}) {
    if (actual === expected) return true;

    const diff = Math.abs(actual - expected);

    // Check absolute tolerance
    if (abs > 0 && diff <= abs) return true;

    // Check relative tolerance
    if (rel > 0 && expected !== 0) {
        const relDiff = diff / Math.abs(expected);
        if (relDiff <= rel) return true;
    }

    return false;
}

/**
 * Assert that two monetary values are close (for use in tests)
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {Object} options - Tolerance options
 * @param {number} options.abs - Absolute tolerance (default: $1 for rounding)
 * @param {number} options.rel - Relative tolerance (default: 0.0001 or 0.01%)
 * @param {string} options.message - Custom error message
 * @throws {Error} - If values are not within tolerance
 */
export function expectMoneyClose(actual, expected, { abs = 1, rel = 0.0001, message = '' } = {}) {
    if (isClose(actual, expected, { abs, rel })) {
        return; // Pass
    }

    const diff = Math.abs(actual - expected);
    const relDiff = expected !== 0 ? (diff / Math.abs(expected)) * 100 : Infinity;

    const errorMsg = message ||
        `Expected ${actual} to be close to ${expected}\n` +
        `  Difference: $${diff.toFixed(2)} (${relDiff.toFixed(4)}%)\n` +
        `  Tolerances: abs=$${abs}, rel=${(rel * 100).toFixed(4)}%`;

    throw new Error(errorMsg);
}

/**
 * Assert that a percentage/rate is close (uses absolute percentage point tolerance)
 * @param {number} actual - Actual rate (0-100 or 0-1, auto-detected)
 * @param {number} expected - Expected rate
 * @param {Object} options - Tolerance options
 * @param {number} options.absPct - Absolute tolerance in percentage points (default: 0.1)
 * @param {string} options.message - Custom error message
 */
export function expectRateClose(actual, expected, { absPct = 0.1, message = '' } = {}) {
    // Auto-detect if values are 0-1 or 0-100
    const isDecimal = actual <= 1 && expected <= 1;
    const actualPct = isDecimal ? actual * 100 : actual;
    const expectedPct = isDecimal ? expected * 100 : expected;

    const diff = Math.abs(actualPct - expectedPct);

    if (diff <= absPct) {
        return; // Pass
    }

    const errorMsg = message ||
        `Expected rate ${actualPct.toFixed(2)}% to be close to ${expectedPct.toFixed(2)}%\n` +
        `  Difference: ${diff.toFixed(4)} percentage points\n` +
        `  Tolerance: ${absPct} percentage points`;

    throw new Error(errorMsg);
}

/**
 * Recommended tolerances for common financial values
 */
export const TOLERANCE_PRESETS = {
    // Tax calculations - allow small rounding errors
    taxTotal: { abs: 50, rel: 0.001 },      // $50 or 0.1%
    taxComponent: { abs: 10, rel: 0.005 },  // $10 or 0.5%

    // Portfolio balances - relative error matters more
    portfolioBalance: { abs: 100, rel: 0.0001 }, // $100 or 0.01%
    smallBalance: { abs: 10, rel: 0.01 },        // $10 or 1%

    // Rates and percentages
    effectiveRate: { absPct: 0.1 },  // 0.1 percentage points
    marginalRate: { absPct: 0.5 },   // 0.5 percentage points

    // Strict equality (for logic checks)
    exact: { abs: 0.01, rel: 0 }
};

/**
 * Validate that tolerance hasn't been weakened without justification
 * This should be called in test setup to prevent "auto-fixing by loosening"
 *
 * @param {string} testName - Name of the test
 * @param {Object} currentTolerance - Current tolerance being used
 * @param {Object} baseline - Baseline tolerance from TOLERANCE_PRESETS
 * @throws {Error} - If tolerance has been weakened
 */
export function validateToleranceNotWeakened(testName, currentTolerance, baseline) {
    if (currentTolerance.abs && baseline.abs && currentTolerance.abs > baseline.abs) {
        throw new Error(
            `TOLERANCE VIOLATION in "${testName}":\n` +
            `  Absolute tolerance widened from $${baseline.abs} to $${currentTolerance.abs}\n` +
            `  This is not allowed without written justification + new invariant.\n` +
            `  If this is intentional, document why and add a compensating test.`
        );
    }

    if (currentTolerance.rel && baseline.rel && currentTolerance.rel > baseline.rel) {
        throw new Error(
            `TOLERANCE VIOLATION in "${testName}":\n` +
            `  Relative tolerance widened from ${baseline.rel * 100}% to ${currentTolerance.rel * 100}%\n` +
            `  This is not allowed without written justification + new invariant.`
        );
    }
}
