/**
 * Custom Withdrawal Strategy Engine
 *
 * Allows users to define age-based rules for withdrawal sequences
 * Example: "Ages 60-65: Drain brokerage first, then Roth, then Traditional"
 */

/**
 * Apply a custom withdrawal rule
 * @param {Object} rule - The withdrawal rule to apply
 * @param {Object} balances - Current account balances
 * @param {number} gap - Amount needed to withdraw
 * @returns {Object} Withdrawal result { traditional, roth, hsa, brokerage, crypto }
 */
export function applyCustomWithdrawalRule(rule, balances, gap) {
    const result = {
        traditional: 0,
        roth: 0,
        hsa: 0,
        brokerage: 0,
        crypto: 0
    };

    let remainingGap = gap;

    // Process each account in the specified sequence
    for (const accountType of rule.sequence) {
        if (remainingGap <= 0) break;

        const amountConfig = rule.amounts[accountType];
        if (!amountConfig) continue;

        const availableBalance = balances[accountType] || 0;
        if (availableBalance <= 0) continue;

        let withdrawAmount = 0;

        switch (amountConfig.type) {
            case 'percentage':
                // Withdraw a percentage of the account
                const percentAmount = availableBalance * ((amountConfig.maxPercent || amountConfig.value) / 100);

                // If a dollar cap exists, clamp it
                if (amountConfig.maxDollarCap && amountConfig.maxDollarCap > 0) {
                    withdrawAmount = Math.min(percentAmount, amountConfig.maxDollarCap, remainingGap);
                } else {
                    withdrawAmount = Math.min(percentAmount, remainingGap);
                }
                break;

            case 'fixed':
                // Withdraw a fixed dollar amount
                withdrawAmount = Math.min(
                    (amountConfig.maxAmount || amountConfig.value),
                    availableBalance,
                    remainingGap
                );
                break;

            case 'remainder':
                // Withdraw whatever is needed to fill the gap
                withdrawAmount = Math.min(availableBalance, remainingGap);
                break;

            default:
                // Default to remainder behavior
                withdrawAmount = Math.min(availableBalance, remainingGap);
        }

        result[accountType] = withdrawAmount;
        remainingGap -= withdrawAmount;
    }

    return result;
}

/**
 * Find the applicable withdrawal rule for the current age
 * @param {Array} rules - Array of withdrawal rules
 * @param {number} age - Current age
 * @returns {Object|null} The applicable rule, or null if none found
 */
export function findApplicableWithdrawalRule(rules, age) {
    if (!rules || !Array.isArray(rules)) return null;

    // Find the first rule where age falls within the range
    for (const rule of rules) {
        if (age >= rule.ageStart && age <= rule.ageEnd) {
            return rule;
        }
    }

    return null;
}

/**
 * Validate a withdrawal rule
 * @param {Object} rule - The rule to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateWithdrawalRule(rule) {
    const errors = [];

    if (!rule.name || rule.name.trim() === '') {
        errors.push('Rule name is required');
    }

    if (!rule.ageStart || rule.ageStart < 0) {
        errors.push('Start age must be a positive number');
    }

    if (!rule.ageEnd || rule.ageEnd < rule.ageStart) {
        errors.push('End age must be greater than or equal to start age');
    }

    if (!rule.sequence || !Array.isArray(rule.sequence) || rule.sequence.length === 0) {
        errors.push('Withdrawal sequence must contain at least one account type');
    }

    if (!rule.amounts || typeof rule.amounts !== 'object') {
        errors.push('Amounts configuration is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
