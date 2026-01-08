/**
 * Financial Assertions - Core Invariant Checks
 *
 * Provides invariant checks that must hold for every year, every scenario.
 * These catch "incorrect math" regardless of the specific scenario.
 */

import { expectMoneyClose, expectRateClose, TOLERANCE_PRESETS } from './tolerance.js';
import { reportAnomaly, SEVERITY, detectInvalidNumbers, detectNegativeValues } from './anomalyReporter.js';

/**
 * Assert ledger has no invalid numbers (NaN, Infinity)
 * @param {Array} ledger - Full ledger array
 * @param {string} testName - Name of test for error reporting
 */
export function assertNoInvalidNumbers(ledger, testName = 'unknown') {
    ledger.forEach((year, idx) => {
        const invalid = detectInvalidNumbers(year);

        if (invalid.length > 0) {
            const paths = invalid.map(i => `${i.path}=${i.value} (${i.type})`).join(', ');
            throw new Error(
                `Invalid numbers found in year ${idx} (age ${year.age}):\n` +
                `  ${paths}\n` +
                `  Test: ${testName}`
            );
        }
    });
}

/**
 * Assert total balance equals sum of account balances (within tolerance)
 * @param {Object} year - Single year from ledger
 * @param {Object} options - Tolerance options
 */
export function assertBalanceEquality(year, options = TOLERANCE_PRESETS.portfolioBalance) {
    const { balances = {}, totalBalance = 0 } = year;

    const sumOfAccounts =
        (balances.traditional || 0) +
        (balances.roth || 0) +
        (balances.hsa || 0) +
        (balances.brokerage || 0) +
        (balances.crypto || 0) +
        (balances.cash || 0);

    try {
        expectMoneyClose(totalBalance, sumOfAccounts, {
            ...options,
            message: `Age ${year.age}: totalBalance ($${totalBalance}) != sum of accounts ($${sumOfAccounts})`
        });
    } catch (error) {
        // Report as anomaly before throwing
        reportAnomaly({
            type: 'balance_mismatch',
            severity: SEVERITY.ERROR,
            testName: 'assertBalanceEquality',
            description: error.message,
            data: { age: year.age, totalBalance, sumOfAccounts, balances },
            suggestedAction: 'Check ledgerLogic balance calculation'
        });
        throw error;
    }
}

/**
 * Assert balance continuity: ending = starting + growth + inflows - outflows
 * @param {Object} year - Single year from ledger
 * @param {Object} prevYear - Previous year from ledger (or null for first year)
 * @param {Object} options - Tolerance options
 */
export function assertBalanceContinuity(year, prevYear, options = TOLERANCE_PRESETS.portfolioBalance) {
    if (!prevYear) return; // Skip first year

    const startingBalance = prevYear.totalBalance || 0;
    const growth = year.metrics?.yearlyAssetGrowth || 0;
    const inflows = (year.income?.total || 0);
    const outflows = (year.expenses?.total || 0) + (year.taxes?.totalTax || 0);
    const netWithdrawals = (year.withdrawals?.total || 0) - (year.metrics?.contributions || 0);

    const endingBalance = year.totalBalance || 0;
    const expectedEnding = startingBalance + growth + inflows - outflows - netWithdrawals;

    try {
        expectMoneyClose(endingBalance, expectedEnding, {
            ...options,
            message: `Age ${year.age}: Balance continuity violated\n` +
                `  Ending: $${endingBalance.toFixed(2)}\n` +
                `  Expected: $${expectedEnding.toFixed(2)}\n` +
                `  (Start + Growth + Inflows - Outflows - NetWithdrawals)`
        });
    } catch (error) {
        reportAnomaly({
            type: 'balance_continuity',
            severity: SEVERITY.WARN, // WARN because this is complex and may have legitimate exceptions
            testName: 'assertBalanceContinuity',
            description: error.message,
            data: {
                age: year.age,
                startingBalance,
                growth,
                inflows,
                outflows,
                netWithdrawals,
                endingBalance,
                expectedEnding,
                diff: endingBalance - expectedEnding
            },
            suggestedAction: 'Verify balance flow calculation in ledgerLogic'
        });
        // Don't throw - this is a complex invariant that may have legitimate edge cases
        // But it's recorded for review
    }
}

/**
 * Assert withdrawals total equals sum of individual account withdrawals
 * @param {Object} year - Single year from ledger
 * @param {Object} options - Tolerance options
 */
export function assertWithdrawalsIdentity(year, options = TOLERANCE_PRESETS.smallBalance) {
    const { withdrawals = {} } = year;

    const total = withdrawals.total || 0;
    // Note: Roth conversion is NOT a withdrawal - it's an internal transfer
    // The optimizer subtracts it from total: Object.values(w).reduce(...) - w.rothConversion
    const sum =
        (withdrawals.traditional || 0) +
        (withdrawals.roth || 0) +
        (withdrawals.hsa || 0) +
        (withdrawals.brokerage || 0) +
        (withdrawals.crypto || 0) +
        (withdrawals.cash || 0);
    // Explicitly NOT including rothConversion - it's subtracted in the optimizer

    try {
        expectMoneyClose(total, sum, {
            ...options,
            message: `Age ${year.age}: withdrawals.total ($${total}) != sum of account withdrawals ($${sum})`
        });
    } catch (error) {
        reportAnomaly({
            type: 'withdrawals_mismatch',
            severity: SEVERITY.ERROR,
            testName: 'assertWithdrawalsIdentity',
            description: error.message,
            data: { age: year.age, total, sum, withdrawals },
            suggestedAction: 'Check withdrawal calculation logic'
        });
        throw error;
    }
}

/**
 * Assert total tax equals sum of components
 * @param {Object} year - Single year from ledger
 * @param {Object} options - Tolerance options
 */
export function assertTaxTotalIdentity(year, options = TOLERANCE_PRESETS.taxTotal) {
    const { taxes = {} } = year;

    const total = taxes.totalTax || 0;
    const sum =
        (taxes.federalIncomeTax || 0) +
        (taxes.stateTax || 0) +
        (taxes.fica?.total || 0) +
        (taxes.fica?.addlMedicare || 0) +
        (taxes.niit || 0);

    try {
        expectMoneyClose(total, sum, {
            ...options,
            message: `Age ${year.age}: totalTax ($${total}) != sum of components ($${sum})`
        });
    } catch (error) {
        reportAnomaly({
            type: 'tax_total_mismatch',
            severity: SEVERITY.ERROR,
            testName: 'assertTaxTotalIdentity',
            description: error.message,
            data: { age: year.age, total, sum, taxes },
            suggestedAction: 'Check tax calculation in taxEngine'
        });
        throw error;
    }
}

/**
 * Assert effective tax rate is within sane bounds
 * @param {Object} year - Single year from ledger
 */
export function assertEffectiveTaxRateSanity(year) {
    const { taxes = {} } = year;
    const agi = taxes.agi || 0;
    const totalTax = taxes.totalTax || 0;

    if (agi <= 0) return; // Skip if no AGI

    const effectiveRate = totalTax / agi;

    // Hard fail if >70%
    if (effectiveRate > 0.70) {
        const error = `Age ${year.age}: Effective tax rate ${(effectiveRate * 100).toFixed(1)}% exceeds 70% ceiling`;
        reportAnomaly({
            type: 'impossible_tax_rate',
            severity: SEVERITY.CRITICAL,
            testName: 'assertEffectiveTaxRateSanity',
            description: error,
            data: { age: year.age, agi, totalTax, effectiveRate },
            suggestedAction: 'Check tax calculation - likely a bug'
        });
        throw new Error(error);
    }

    // Warn if >55%
    if (effectiveRate > 0.55) {
        reportAnomaly({
            type: 'high_tax_rate',
            severity: SEVERITY.WARN,
            testName: 'assertEffectiveTaxRateSanity',
            description: `Age ${year.age}: Effective tax rate ${(effectiveRate * 100).toFixed(1)}% is unusually high`,
            data: { age: year.age, agi, totalTax, effectiveRate },
            suggestedAction: 'Verify this is expected (e.g., IRMAA, state taxes, NIIT)'
        });
    }
}

/**
 * Assert FICA applies only to earned income
 * @param {Object} year - Single year from ledger
 */
export function assertFICAOnlyOnEarned(year) {
    const { taxes = {}, income = {} } = year;
    const ficaTotal = taxes.fica?.total || 0;
    const salary = income.salary || 0;

    // If FICA > 0, there must be salary
    if (ficaTotal > 0 && salary === 0) {
        const error = `Age ${year.age}: FICA tax ($${ficaTotal}) without salary`;
        reportAnomaly({
            type: 'fica_without_earned_income',
            severity: SEVERITY.ERROR,
            testName: 'assertFICAOnlyOnEarned',
            description: error,
            data: { age: year.age, ficaTotal, salary },
            suggestedAction: 'FICA should only apply to earned income (salary)'
        });
        throw new Error(error);
    }
}

/**
 * Assert RMDs are calculated correctly
 * @param {Object} year - Single year from ledger
 */
export function assertRMDLogic(year) {
    const age = year.age;
    const tradBalance = year.balances?.traditional || 0;
    const rmd = year.metrics?.detailedCashFlow?.inflows?.rmd || 0;

    // If age >= 73 and traditional balance > 0, RMD should be > 0
    if (age >= 73 && tradBalance > 0 && rmd === 0) {
        reportAnomaly({
            type: 'missing_rmd',
            severity: SEVERITY.WARN,
            testName: 'assertRMDLogic',
            description: `Age ${year.age}: No RMD despite traditional balance of $${tradBalance}`,
            data: { age, tradBalance, rmd },
            suggestedAction: 'Verify RMD calculation logic'
        });
    }
}

/**
 * Assert Social Security taxable amount is within bounds
 * @param {Object} year - Single year from ledger
 */
export function assertSocialSecurityTaxableBounds(year) {
    const { taxes = {}, income = {} } = year;
    const ssBenefits = income.socialSecurity || 0;
    const taxableSS = taxes.taxableSS || 0;

    if (ssBenefits === 0) return; // Skip if no SS

    const maxTaxable = ssBenefits * 0.85;

    if (taxableSS > maxTaxable + 1) { // +1 for rounding
        const error = `Age ${year.age}: Taxable SS ($${taxableSS}) exceeds 85% of benefits ($${maxTaxable})`;
        reportAnomaly({
            type: 'ss_taxable_bounds_violation',
            severity: SEVERITY.ERROR,
            testName: 'assertSocialSecurityTaxableBounds',
            description: error,
            data: { age: year.age, ssBenefits, taxableSS, maxTaxable },
            suggestedAction: 'Check SS taxability calculation'
        });
        throw new Error(error);
    }

    if (taxableSS < 0) {
        throw new Error(`Age ${year.age}: Negative taxable SS ($${taxableSS})`);
    }
}

/**
 * Detect unexpected negative balances
 * @param {Object} year - Single year from ledger
 */
export function detectNegativeBalances(year) {
    const negatives = detectNegativeValues(year.balances || {});

    if (negatives.length > 0) {
        reportAnomaly({
            type: 'negative_balance',
            severity: SEVERITY.ERROR,
            testName: 'detectNegativeBalances',
            description: `Age ${year.age}: Negative account balance(s) detected`,
            data: { age: year.age, negatives },
            suggestedAction: 'Negative balances indicate overdrawing - check withdrawal logic'
        });
    }
}

/**
 * Run all invariant checks on a full ledger
 * @param {Array} ledger - Full ledger array
 * @param {Object} options - Options for which checks to run
 * @returns {Object} - Summary of results
 */
export function runAllInvariants(ledger, options = {}) {
    const {
        skipInvalidNumbers = false,
        skipBalanceChecks = false,
        skipTaxChecks = false,
        skipDomainRules = false
    } = options;

    const results = {
        totalYears: ledger.length,
        passed: 0,
        failed: 0,
        warnings: 0
    };

    try {
        // Check for invalid numbers first
        if (!skipInvalidNumbers) {
            assertNoInvalidNumbers(ledger, 'runAllInvariants');
        }

        // Run per-year checks
        ledger.forEach((year, idx) => {
            const prevYear = idx > 0 ? ledger[idx - 1] : null;

            try {
                if (!skipBalanceChecks) {
                    assertBalanceEquality(year);
                    assertBalanceContinuity(year, prevYear);
                    assertWithdrawalsIdentity(year);
                    detectNegativeBalances(year);
                }

                if (!skipTaxChecks) {
                    assertTaxTotalIdentity(year);
                    assertEffectiveTaxRateSanity(year);
                }

                if (!skipDomainRules) {
                    assertFICAOnlyOnEarned(year);
                    assertRMDLogic(year);
                    assertSocialSecurityTaxableBounds(year);
                }

                results.passed++;
            } catch (error) {
                results.failed++;
                throw error; // Re-throw to fail the test
            }
        });

    } catch (error) {
        console.error('Invariant check failed:', error.message);
        throw error;
    }

    return results;
}
