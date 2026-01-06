/**
 * Bucket Strategy Engine
 *
 * Manages the "Cash Bucket" logic to mitigate Sequence of Returns Risk.
 *
 * Strategy:
 * 1. Maintain X years of essential expenses in safe liquid assets (Cash/HYSA).
 * 2. Only refill the bucket when portfolio performance is positive (or above a threshold).
 * 3. In down years, spend from the bucket to avoid selling depressed assets.
 *
 * @module bucketStrategy
 */

/**
 * Determine if the bucket should be refilled this year.
 * @param {Object} params
 * @param {number} params.currentCash - Current balance in the Cash Bucket
 * @param {number} params.targetCash - Target balance (e.g., 2 years of expenses)
 * @param {number} params.portfolioReturn - This year's portfolio return (decimal, e.g. -0.05 or 0.10)
 * @param {string} params.refillConditions - 'always' | 'market_up' | 'threshold'
 * @returns {boolean} True if refill is recommended
 */
export function shouldRefillBucket({ currentCash, targetCash, portfolioReturn, refillConditions = 'market_up' }) {
    // If bucket is full, no need (allow some drift? usually drift is okay).
    if (currentCash >= targetCash) return false;

    // Force refill if critical (e.g. less than 3 months cash)?
    // For now, adhere to strategy.

    switch (refillConditions) {
        case 'always':
            return true;
        case 'market_up':
            return portfolioReturn > 0;
        case 'threshold':
            return portfolioReturn > 0.05; // Only refill on strong years
        default:
            return portfolioReturn > 0;
    }
}

/**
 * Calculate the refill amount required.
 * @param {number} currentCash
 * @param {number} targetCash
 * @returns {number} Amount needed to restore target
 */
export function getRefillAmount(currentCash, targetCash) {
    return Math.max(0, targetCash - currentCash);
}
