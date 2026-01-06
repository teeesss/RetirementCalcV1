/**
 * Line of Credit (LOC) Engine
 *
 * Determines borrowing capacity and "Borrow vs Sell" recommendations
 * based on asset volatility and interest rates.
 *
 * Decision Framework:
 * IF (expected_asset_return - after_tax_interest) > hurdle
 *    AND Probability(MarginCall) < userTolerance
 * THEN borrow
 * ELSE liquidate
 *
 * @module lineOfCreditEngine
 */

/**
 * Calculate available credit based on collateral and LTV
 * @param {Object} params
 * @param {string} params.type - 'brokerage' | 'crypto' | 'reverseMortgage'
 * @param {number} params.collateralValue - Current asset balance
 * @param {number} params.ltv - Loan-to-Value ratio (e.g., 0.50)
 * @param {number} params.rate - Annual interest rate (decimal)
 * @returns {Object} { maxDraw, rate }
 */
export function getLOCOffer({ collateralValue, ltv, rate }) {
    const maxDraw = collateralValue * ltv;
    return { maxDraw, rate };
}

/**
 * Determine if borrowing is mathematically superior to selling
 * @param {Object} params
 * @param {number} params.expectedReturn - Expected annual return of the asset (decimal, e.g., 0.08)
 * @param {number} params.rateAfterTax - Effective borrowing cost after tax deduction (if applicable)
 * @param {number} params.marginProb - Probability of a margin call (0-1)
 * @param {number} params.tolerance - User's risk tolerance for margin calls (0-1, default 0.05)
 * @param {number} params.hurdle - Minimum arbitrage spread required (default 0.02)
 * @returns {boolean} True if borrowing is recommended
 */
export function shouldBorrow({
    expectedReturn,
    rateAfterTax,
    marginProb,
    tolerance = 0.05,
    hurdle = 0.02
}) {
    // 1. Check Arbitrage Spread
    const spread = expectedReturn - rateAfterTax;
    const isProfitable = spread > hurdle;

    // 2. Check Risk
    const isSafe = marginProb < tolerance;

    return isProfitable && isSafe;
}

/**
 * Estimate probability of a margin call
 * Uses a simplified localized drawdown estimator based on volatility.
 * In a real Monte Carlo, this would be stochastic. Here we use a heuristic.
 *
 * Heuristic: If (1 - Volatility*2) < RequiredCollateralRatio, risk is high.
 *
 * @param {number} volatility - Annual volatility (sigma)
 * @param {number} currentLTV - Current Loan-to-Value
 * @param {number} maintenanceMargin - Margin call threshold (e.g. 0.70)
 * @returns {number} Estimated Probability (0-1)
 */
export function estimateMarginRisk(volatility, currentLTV, maintenanceMargin = 0.70) {
    if (currentLTV === 0) return 0;

    // Simple Z-score approximation for 1-year horizon
    // Use conservative estimate: How likely is asset to drop such that LTV > Maintenance?
    // Asset_Drop_Limit = Current_Asset * (1 - Drawdown)
    // Debt / Asset_Drop_Limit = Maintenance
    // Drawdown = 1 - (Debt / (Maintenance * Asset))
    // Drawdown = 1 - (LTV / Maintenance)

    const maxSafeDrawdown = 1 - (currentLTV / maintenanceMargin);

    if (maxSafeDrawdown < 0) return 1.0; // Already margin called

    // Assume Normal Distribution of returns ~ N(0, vol)
    // Z = Drawdown / Volatility
    // This is a rough approximation.
    const zScore = maxSafeDrawdown / volatility;

    // Convert Z to Probability (Cumulative Normal Distribution)
    // For Z=1 (1 sigma event), Prob ~ 16%. Z=2 ~ 2.5%.
    if (zScore > 3) return 0;
    if (zScore > 2) return 0.02;
    if (zScore > 1) return 0.16;
    return 0.50; // High risk
}
