/**
 * Financial Invariants Test Suite
 *
 * Tests that core financial invariants hold across all scenarios.
 * These are property-based tests that should pass regardless of input profile.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic.js';
import defaultProfile from '../data/defaultProfile.json';
import {
    assertNoInvalidNumbers,
    assertBalanceEquality,
    assertWithdrawalsIdentity,
    assertTaxTotalIdentity,
    assertEffectiveTaxRateSanity,
    assertFICAOnlyOnEarned,
    assertRMDLogic,
    assertSocialSecurityTaxableBounds,
    detectNegativeBalances,
    runAllInvariants
} from './helpers/financialAsserts.js';
import { clearAnomalies, getAnomalies, exportAnomalies } from './helpers/anomalyReporter.js';

describe('Financial Invariants', () => {
    beforeEach(() => {
        // Clear anomalies before each test
        clearAnomalies();
    });

    describe('Ledger Integrity', () => {
        it('should have no NaN or Infinity values', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            // This should not throw
            assertNoInvalidNumbers(ledger, 'default profile');
        });

        it('should maintain totalBalance = sum(accounts)', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            // Check every year
            ledger.forEach(year => {
                assertBalanceEquality(year);
            });
        });

        it('should maintain withdrawals.total = sum(by account)', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            // Check years with withdrawals
            ledger.filter(y => y.withdrawals?.total > 0).forEach(year => {
                assertWithdrawalsIdentity(year);
            });
        });

        it('should not have negative account balances', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            // This uses anomaly reporter, so check anomalies
            ledger.forEach(year => {
                detectNegativeBalances(year);
            });

            const anomalies = getAnomalies();
            const negativeBalances = anomalies.filter(a => a.type === 'negative_balance');

            if (negativeBalances.length > 0) {
                console.error('Negative balances detected:', negativeBalances);
                throw new Error(`Found ${negativeBalances.length} years with negative balances`);
            }
        });
    });

    describe('Tax Integrity', () => {
        it('should maintain totalTax = sum(components)', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            // Check every year with taxes
            ledger.filter(y => y.taxes?.totalTax > 0).forEach(year => {
                assertTaxTotalIdentity(year);
            });
        });

        it('should have effective tax rate < 70%', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            // Check every year
            ledger.forEach(year => {
                assertEffectiveTaxRateSanity(year);
            });
        });

        it('should only apply FICA to earned income', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            profile.salary = 100000;
            profile.currentAge = 50;

            const ledger = generateLedger(profile);

            // Check all years
            ledger.forEach(year => {
                assertFICAOnlyOnEarned(year);
            });
        });
    });

    describe('Domain Rules', () => {
        it('should calculate RMDs starting at age 73 with traditional balance', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            profile.assets.traditional.client = 1000000;
            profile.currentAge = 70;

            const ledger = generateLedger(profile);

            // Check years 73+
            const rmdYears = ledger.filter(y => y.age >= 73);
            rmdYears.forEach(year => {
                assertRMDLogic(year);
            });

            // Should have at least one RMD
            const hasRMD = rmdYears.some(y => (y.metrics?.detailedCashFlow?.inflows?.rmd || 0) > 0);
            expect(hasRMD).toBe(true);
        });

        it('should keep taxable SS within [0, 0.85 * benefits]', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            // Make sure there's SS income
            const ledger = generateLedger(profile);

            // Check years with SS
            const ssYears = ledger.filter(y => (y.income?.socialSecurity || 0) > 0);
            ssYears.forEach(year => {
                assertSocialSecurityTaxableBounds(year);
            });
        });
    });

    describe('Comprehensive Invariant Sweep', () => {
        it('should pass all invariants for default profile', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            const ledger = generateLedger(profile);

            const results = runAllInvariants(ledger);

            console.log('Invariant results:', results);
            console.log('Anomalies detected:', getAnomalies().length);

            // Export anomalies for review
            const anomalyReport = exportAnomalies();
            if (anomalyReport.totalCount > 0) {
                console.log('Anomaly summary:', anomalyReport.bySeverity);
            }

            // Test should pass even with warnings, but fail on errors
            expect(results.failed).toBe(0);
        });

        it('should pass all invariants for high-income scenario', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            profile.salary = 300000;
            profile.assets.traditional.client = 5000000;
            profile.currentAge = 55;

            const ledger = generateLedger(profile);
            const results = runAllInvariants(ledger);

            expect(results.failed).toBe(0);
        });

        it('should pass all invariants for early-retirement scenario', () => {
            const profile = JSON.parse(JSON.stringify(defaultProfile));
            profile.people[0].retirementAge = 50;
            profile.currentAge = 48;
            profile.assets.brokerage = 2000000;

            const ledger = generateLedger(profile);
            const results = runAllInvariants(ledger);

            expect(results.failed).toBe(0);
        });
    });
});
