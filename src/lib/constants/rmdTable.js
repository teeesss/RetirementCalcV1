/**
 * Required Minimum Distribution (RMD) Tables
 * Source: IRS Publication 590-B (Uniform Lifetime Table)
 *
 * IMPORTANT: This is the single authoritative source for RMD divisors.
 * Do NOT duplicate these values elsewhere in the codebase.
 */

/**
 * Uniform Lifetime Table (for most retirees)
 * Used when spouse is not more than 10 years younger or if unmarried
 */
export const RMD_TABLE_UNIFORM = {
    73: 27.4,
    74: 26.5,
    75: 25.5,
    76: 24.6,
    77: 23.7,
    78: 22.9,
    79: 22.0,
    80: 21.1,
    81: 20.2,
    82: 19.4,
    83: 18.5,
    84: 17.7,
    85: 16.8,
    86: 16.0,
    87: 15.2,
    88: 14.4,
    89: 13.7,
    90: 13.0,
    91: 12.2,
    92: 11.5,
    93: 10.8,
    94: 10.1,
    95: 9.5,
    96: 8.9,
    97: 8.4,
    98: 7.8,
    99: 7.3,
    100: 6.8,
    101: 6.4,
    102: 6.0,
    103: 5.7,
    104: 5.4,
    105: 5.1,
    106: 4.8,
    107: 4.6,
    108: 4.4,
    109: 4.2,
    110: 4.0,
    111: 3.9,
    112: 3.8,
    113: 3.7,
    114: 3.6,
    115: 3.5,
    116: 3.4,
    117: 3.3,
    118: 3.2,
    119: 3.1,
    120: 3.0
};

/**
 * RMD Starting Age (post-SECURE Act 2.0)
 * - Age 73 for those born 1951-1959
 * - Age 75 for those born 1960 or later
 */
export const RMD_START_AGE = {
    default: 73,
    born1960OrLater: 75
};

/**
 * Calculate RMD for a given age and balance
 * @param {number} age - Current age
 * @param {number} balance - Traditional IRA/401k balance
 * @param {number} startAge - RMD start age (default: 73)
 * @returns {number} - Required minimum distribution
 */
export function calculateRMD(age, balance, startAge = RMD_START_AGE.default) {
    if (age < startAge || balance <= 0) {
        return 0;
    }

    // Use Uniform Lifetime Table
    const divisor = RMD_TABLE_UNIFORM[age] || RMD_TABLE_UNIFORM[120]; // Fallback to age 120 divisor

    return balance / divisor;
}

/**
 * Get RMD divisor for a specific age
 * @param {number} age - Age
 * @returns {number} - Life expectancy divisor
 */
export function getRMDDivisor(age) {
    return RMD_TABLE_UNIFORM[age] || RMD_TABLE_UNIFORM[120] || 3.0;
}

/**
 * Check if RMD is required for a given age
 * @param {number} age - Current age
 * @param {number} birthYear - Year of birth (optional, for future SECURE 2.0 rules)
 * @returns {boolean} - True if RMD is required
 */
export function isRMDRequired(age, birthYear = null) {
    if (birthYear && birthYear >= 1960) {
        return age >= RMD_START_AGE.born1960OrLater;
    }
    return age >= RMD_START_AGE.default;
}
