/**
 * Reverse Mortgage (HECM) Engine
 *
 * Simulates a growing HECM Line of Credit.
 * Key Feature: The unused credit line grows at the same rate as the loan balance would accrue interest.
 * Rate = Interest Rate + MIP (1.25% usually).
 *
 * @module reverseMortgage
 */

/**
 * Calculate HECM Line of Credit growth for one year
 * @param {Object} params
 * @param {number} params.currentLimit - Current Principal Limit (or Line of Credit Capacity)
 * @param {number} params.currentBalance - Current loan balance (money drawn)
 * @param {number} params.interestRate - Mortgage Interest Rate (e.g. 0.05)
 * @param {number} params.mipRate - Mortgage Insurance Premium Rate (e.g. 0.005)
 * @param {number} params.draw - Amount drawn this year
 * @returns {Object} { newLimit, newBalance, availableCredit }
 */
export function growHECM({ currentLimit, currentBalance, interestRate, mipRate = 0.005, draw = 0 }) {
    // 1. Calculate Growth Rate
    const growthRate = interestRate + mipRate;

    // 2. Grow the Unused Line of Credit (and the Used Balance)
    // The Principal Limit (Total Capacity) grows at the full rate regardless of usage.
    const newLimit = currentLimit * (1 + growthRate);

    // 3. Grow the Loan Balance (Accrue Interest + MIP)
    // Interest is calculated on the average daily balance, roughly:
    // (StartBalance + Draw) * Rate ?? Or StartBalance * Rate + Draw.
    // Simplifying: Interest grows on the opening balance. Draw happens mid-year?
    // Conservative: Interest on (Balance + Draw).
    const newBalance = (currentBalance + draw) * (1 + growthRate);

    // 4. Calculate Available Credit
    const availableCredit = Math.max(0, newLimit - newBalance);

    return {
        newLimit,
        newBalance,
        availableCredit,
        growthRate
    };
}

/**
 * Calculate Initial Principal Limit (Rule of Thumb)
 * Based on Age and Interest Rate (Expected Rate).
 * Very rough approximation of HUD tables.
 * @param {number} age - Youngest borrower age
 * @param {number} homeValue - Home value (cap at $1,149,825 for 2024)
 * @param {number} expectedRate - Expected interest rate
 * @returns {number} Principal Limit
 */
export function calculateInitialPrincipalLimit(age, homeValue, expectedRate) {
    // 2024 HECM Limit
    const MCA = Math.min(homeValue, 1149825);

    // Simplified Factor Table Approximation
    // Factor ~ 0.50 at age 62 with 7% rates?
    // Factor increases with age, decreases with rates.
    // Linear regression heuristic from HUD tables (implied):
    // Base 62 @ 7% = 0.34
    // +0.01 per year of age
    // -0.05 per 1% rate increase

    let factor = 0.40; // Base baseline
    factor += (age - 62) * 0.01;
    factor -= (expectedRate - 0.05) * 5; // -5% factor for every 1% rate hike above 5%

    // Clamp factor
    factor = Math.max(0.10, Math.min(0.75, factor));

    return MCA * factor;
}
