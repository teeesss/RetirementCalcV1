/**
 * spendingStrategies.js - Dynamic withdrawal and spending strategies
 *
 * Implements:
 * - Blanchett "Spending Smile" (U-shaped spending)
 * - Floor & Ceiling guardrails (Guyton-Klinger style)
 * - Percentage-based dynamic spending
 */

/**
 * Calculate Blanchett Smile spending factor
 * Spending is highest early in retirement (go-go), lowest in middle (slow-go), rises slightly late (no-go healthcare)
 *
 * @param {number} age - Current age
 * @param {number} retirementAge - Age at retirement start
 * @param {number} baselineSpending - Starting annual spending
 * @returns {number} Adjusted spending for the year
 */
export function calculateBlanchettSmile(age, retirementAge, baselineSpending) {
    const yearsIntoRetirement = age - retirementAge;

    // Default parameters for the "smile"
    const goGoPhase = 10; // First 10 years: 100-110% of baseline
    const slowGoPhase = 25; // Years 11-25: 85-90% of baseline
    // No-Go Phase: Years 26+: 70-75% baseline + healthcare spike

    if (yearsIntoRetirement < 0) return baselineSpending;

    if (yearsIntoRetirement <= goGoPhase) {
        // Go-Go years: Gradually decline from 110% to 100%
        const factor = 1.10 - (yearsIntoRetirement / goGoPhase) * 0.10;
        return baselineSpending * factor;
    } else if (yearsIntoRetirement <= slowGoPhase) {
        // Slow-Go years: 85-90% of baseline
        const yearsSinceGoGo = yearsIntoRetirement - goGoPhase;
        const phaseLength = slowGoPhase - goGoPhase;
        const factor = 1.00 - (yearsSinceGoGo / phaseLength) * 0.15; // Decline from 100% to 85%
        return baselineSpending * factor;
    } else {
        // No-Go plus healthcare: Minimum around 75%, but add healthcare bump
        const yearsSinceSlowGo = yearsIntoRetirement - slowGoPhase;
        const healthcareFactor = Math.min(0.10, yearsSinceSlowGo * 0.01); // Up to 10% extra for healthcare
        const factor = 0.75 + healthcareFactor;
        return baselineSpending * factor;
    }
}

/**
 * Apply Guyton-Klinger style guardrails
 * If portfolio drops below floor, cut spending. If above ceiling, increase.
 *
 * @param {number} currentPortfolioValue - Current total portfolio value
 * @param {number} peakPortfolioValue - Highest portfolio value ever achieved
 * @param {number} currentSpending - Current annual spending
 * @param {Object} guardrails - {floorPercent, ceilingPercent, adjustmentRate}
 * @returns {number} Adjusted spending
 */
export function applyGuardrails(
    currentPortfolioValue,
    peakPortfolioValue,
    currentSpending,
    guardrails = { floorPercent: 0.85, ceilingPercent: 1.20, adjustmentRate: 0.10 }
) {
    if (peakPortfolioValue === 0) return currentSpending;

    const currentRatio = currentPortfolioValue / peakPortfolioValue;

    // Below floor: Cut spending
    if (currentRatio < guardrails.floorPercent) {
        return currentSpending * (1 - guardrails.adjustmentRate);
    }

    // Above ceiling: Increase spending
    if (currentRatio > guardrails.ceilingPercent) {
        return currentSpending * (1 + guardrails.adjustmentRate);
    }

    // Within guardrails: No change
    return currentSpending;
}

/**
 * Percentage-based dynamic spending (fixed % of portfolio)
 *
 * @param {number} portfolioValue - Current portfolio value
 * @param {number} withdrawalRate - Annual withdrawal rate (e.g., 0.04 for 4%)
 * @returns {number} Annual spending amount
 */
export function calculatePercentageBased(portfolioValue, withdrawalRate = 0.04) {
    return portfolioValue * withdrawalRate;
}

/**
 * Floor & Ceiling spending (hybrid approach)
 * Spend a percentage of portfolio, but never below floor or above ceiling
 *
 * @param {number} portfolioValue - Current portfolio value
 * @param {number} withdrawalRate - Target withdrawal rate
 * @param {number} floor - Minimum annual spending
 * @param {number} ceiling - Maximum annual spending
 * @returns {number} Constrained spending amount
 */
export function calculateFloorCeiling(portfolioValue, withdrawalRate, floor, ceiling) {
    const targetSpending = portfolioValue * withdrawalRate;
    return Math.max(floor, Math.min(ceiling, targetSpending));
}

/**
 * Actuarial / Dynamic Strategy
 * Spending = Portfolio / Remaining Years of Life
 * Ensures portfolio hits exactly $0 at life expectancy
 *
 * @param {number} portfolioValue - Current portfolio value
 * @param {number} age - Current age
 * @param {number} lifeExpectancy - Target end age (e.g. 95)
 * @returns {number} Spending amount
 */
export function calculateActuarial(portfolioValue, age, lifeExpectancy) {
    const remainingYears = Math.max(1, lifeExpectancy - age);
    // Simple division (RMD style)
    return portfolioValue / remainingYears;
}

/**
 * Max Spending (Front-Loaded) Strategy
 * Maximizes spending during a specific window (e.g. 60-75) by amortizing the portfolio.
 * After the window, falls back to a minimal level (or user defined essential).
 *
 * @param {number} portfolioValue - Current portfolio
 * @param {number} age - Current age
 * @param {number} windowEndAge - Age to stop max spending (e.g. 75)
 * @param {number} assumedGrowthRate - Assumed annual growth (decimal, e.g. 0.05)
 * @param {number} legacyGoal - Amount to leave remaining at windowEndAge
 * @returns {number} Annual usage amount (PMT)
 */
export function calculateMaxSpend(portfolioValue, age, windowEndAge, assumedGrowthRate = 0.05, legacyGoal = 0) {
    const yearsRemaining = windowEndAge - age;

    if (yearsRemaining <= 0) return 0; // Should fallback to essential outside this function

    // PV = PMT * (1 - (1+r)^-n) / r + FV / (1+r)^n
    // Rearranged for PMT:
    // PMT = (PV - FV/(1+r)^n) * (r / (1 - (1+r)^-n))

    const r = assumedGrowthRate;
    const n = yearsRemaining;
    const pv = portfolioValue;
    const fv = legacyGoal;

    if (r === 0) {
        return (pv - fv) / n;
    }

    const presentValueFV = fv / Math.pow(1 + r, n);
    const availablePrincipal = pv - presentValueFV;

    // PMT Formula
    const pmt = availablePrincipal * (r / (1 - Math.pow(1 + r, -n)));

    return Math.max(0, pmt);
}
