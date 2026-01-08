/**
 * Federal Poverty Level (FPL) Guidelines
 * Source: HHS Poverty Guidelines
 *
 * IMPORTANT: This is the single authoritative source for FPL values.
 * Do NOT duplicate these values elsewhere in the codebase.
 *
 * Used for:
 * - ACA subsidy eligibility (100%-400% FPL)
 * - Medicaid eligibility
 * - Other means-tested benefits
 */

/**
 * 2025 Federal Poverty Level (Continental US)
 * Updates annually, typically in January
 */
export const FPL_2025 = {
    base: 15060,        // For 1 person
    perAdditional: 5380 // For each additional person
};

/**
 * Alaska and Hawaii have higher FPL values
 */
export const FPL_2025_ALASKA = {
    base: 18830,
    perAdditional: 6730
};

export const FPL_2025_HAWAII = {
    base: 17310,
    perAdditional: 6190
};

/**
 * ACA Subsidy Eligibility Thresholds
 */
export const ACA_SUBSIDY_THRESHOLDS = {
    minimumPercent: 100,  // 100% FPL (Medicaid gap states)
    maximumPercent: 400   // 400% FPL (was temporarily removed but reinstated)
};

/**
 * Calculate FPL for household size
 * @param {number} householdSize - Number of people in household
 * @param {string} state - 'continental', 'alaska', or 'hawaii'
 * @returns {number} - Annual FPL for household
 */
export function calculateFPL(householdSize, state = 'continental') {
    let fpl;

    switch (state.toLowerCase()) {
        case 'alaska':
            fpl = FPL_2025_ALASKA;
            break;
        case 'hawaii':
            fpl = FPL_2025_HAWAII;
            break;
        default:
            fpl = FPL_2025;
    }

    if (householdSize <= 0) return 0;
    if (householdSize === 1) return fpl.base;

    return fpl.base + (fpl.perAdditional * (householdSize - 1));
}

/**
 * Calculate percentage of FPL
 * @param {number} income - Annual household income
 * @param {number} householdSize - Number of people
 * @param {string} state - State for FPL calculation
 * @returns {number} - Percentage of FPL (e.g., 250 for 250% FPL)
 */
export function calculateFPLPercent(income, householdSize, state = 'continental') {
    const fpl = calculateFPL(householdSize, state);
    if (fpl === 0) return 0;
    return (income / fpl) * 100;
}

/**
 * Check ACA subsidy eligibility
 * @param {number} income - Modified Adjusted Gross Income
 * @param {number} householdSize - Number of people
 * @param {string} state - State for FPL calculation
 * @returns {Object} - { eligible, fplPercent, reason }
 */
export function checkACAEligibility(income, householdSize, state = 'continental') {
    const fplPercent = calculateFPLPercent(income, householdSize, state);

    if (fplPercent < ACA_SUBSIDY_THRESHOLDS.minimumPercent) {
        return {
            eligible: false,
            fplPercent,
            reason: `Income below ${ACA_SUBSIDY_THRESHOLDS.minimumPercent}% FPL - may qualify for Medicaid`
        };
    }

    if (fplPercent > ACA_SUBSIDY_THRESHOLDS.maximumPercent) {
        return {
            eligible: false,
            fplPercent,
            reason: `Income above ${ACA_SUBSIDY_THRESHOLDS.maximumPercent}% FPL - not eligible for subsidies`
        };
    }

    return {
        eligible: true,
        fplPercent,
        reason: `Income between ${ACA_SUBSIDY_THRESHOLDS.minimumPercent}-${ACA_SUBSIDY_THRESHOLDS.maximumPercent}% FPL`
    };
}

/**
 * Standard ACA household size (for retirement planning)
 * Typically 1 for single, 2 for married
 */
export function getACAHouseholdSize(filingStatus, dependents = 0) {
    const baseSize = filingStatus === 'married' ? 2 : 1;
    return baseSize + dependents;
}
