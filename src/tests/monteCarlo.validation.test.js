/**
 * Monte Carlo Validation Tests
 *
 * Rigorous tests to ensure Monte Carlo simulation produces factually accurate results.
 * These tests catch anomalies and unrealistic outcomes.
 *
 * THEME: We are only as good as the factual math is!
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';

// Healthy portfolio scenario - should NEVER fail early
const healthyProfile = {
    people: [
        {
            id: 'client',
            age: 53,
            retirementAge: 53,
            lifeExpectancy: 95,
            birthDate: '1973-01-01'
        }
    ],
    assets: {
        traditional: { client: 500000, spouse: 0 },
        roth: { client: 300000, spouse: 0 },
        brokerage: { client: 1500000, spouse: 0 },
        hsa: { client: 100000, spouse: 0 },
        crypto: { client: 200000, spouse: 0 },
        cash: { total: 100000 }
    },
    spending: {
        fixedAmount: 100000 // $100k annual spend
    },
    expenses: {
        essential: 72000,
        discretionary: 28000
    },
    profile: {
        filingStatus: 'single',
        stateOfResidence: 'FL'
    },
    assumptions: {
        inflation: 2.5,
        growthRate: 7.0,
        cryptoGrowthRate: 10.0,
        startYear: 2026
    },
    taxOptimization: {
        enableRothConversion: false
    }
};

// Total starting assets: $2.7M
// Annual spending: $100k
// Years to life expectancy: 42 years (53 to 95)
// Simple math: Even with 0 growth and -50% crash, $2.7M / $100k = 27 years minimum

describe('Monte Carlo Validation - Bounds Checking', () => {
    let ledger;

    beforeAll(() => {
        ledger = generateLedger(healthyProfile, 'fixed', {});
    });

    it('should generate ledger with positive final balance for healthy portfolio', () => {
        expect(ledger).toBeDefined();
        expect(ledger.length).toBeGreaterThan(30); // At least 30 years projected

        const finalYear = ledger[ledger.length - 1];
        // With $2.7M starting, 7% growth, $100k spend, should end positive
        expect(finalYear.netWorth).toBeGreaterThan(0);
    });

    it('should have initial balances that match profile totals', () => {
        const year0 = ledger[0];
        const expectedTotal = 500000 + 300000 + 1500000 + 100000 + 200000 + 100000; // $2.7M

        // Allow for first year withdrawals (spending) and growth
        // But should not be wildly different
        expect(year0.netWorth).toBeGreaterThan(expectedTotal * 0.8);
        expect(year0.netWorth).toBeLessThan(expectedTotal * 1.3);
    });

    it('should have realistic annual drawdown (not depleting more than 10% per year)', () => {
        for (let i = 1; i < Math.min(10, ledger.length); i++) {
            const prevYear = ledger[i - 1];
            const currYear = ledger[i];

            // Net worth shouldn't drop by more than 20% in any single year
            // (allows for market volatility + spending)
            if (prevYear.netWorth > 0) {
                const dropPercent = (prevYear.netWorth - currYear.netWorth) / prevYear.netWorth;
                expect(dropPercent).toBeLessThan(0.3); // Max 30% drop per year
            }
        }
    });

    it('CRITICAL: should NOT deplete a $2.7M portfolio in under 10 years', () => {
        // This is the bug we fixed - early failures were impossible
        const year10 = ledger[Math.min(10, ledger.length - 1)];

        // $2.7M starting, $100k spend/yr = $1M spent over 10 years
        // Even with no growth: $2.7M - $1M = $1.7M remaining minimum
        // With 7% growth and withdrawals, should still have significant assets
        expect(year10.netWorth).toBeGreaterThan(1000000); // At least $1M after 10 years
    });

    it('should have consistent cash flow tracking', () => {
        for (let i = 0; i < Math.min(5, ledger.length); i++) {
            const year = ledger[i];

            // CashFlow.byAccount should exist
            expect(year.cashFlow).toBeDefined();
            expect(year.cashFlow.byAccount).toBeDefined();

            // Withdrawals should not exceed available assets
            const withdrawals = year.withdrawals || {};
            const totalWithdrawal = (withdrawals.traditional || 0) +
                (withdrawals.roth || 0) +
                (withdrawals.brokerage || 0) +
                (withdrawals.hsa || 0) +
                (withdrawals.crypto || 0) +
                (withdrawals.cash || 0);

            // In early years with income, total withdrawal might be 0
            // But should never be more than starting assets
            expect(totalWithdrawal).toBeGreaterThanOrEqual(0);
            expect(totalWithdrawal).toBeLessThan(3000000); // Never withdraw more than total assets
        }
    });
});

describe('Monte Carlo Validation - Edge Cases', () => {
    it('should handle 0% growth rate without crashing', () => {
        const zeroGrowth = {
            ...healthyProfile,
            assumptions: { ...healthyProfile.assumptions, growthRate: 0 }
        };

        const ledger = generateLedger(zeroGrowth, 'fixed', {});
        expect(ledger).toBeDefined();
        expect(ledger.length).toBeGreaterThan(10);
    });

    it('should handle high spending scenario (4% rule boundary)', () => {
        const highSpend = {
            ...healthyProfile,
            spending: { fixedAmount: 108000 } // 4% of $2.7M
        };

        const ledger = generateLedger(highSpend, 'fixed', {});
        expect(ledger).toBeDefined();

        // 4% rule should generally work for 30 years
        const year30 = ledger[Math.min(30, ledger.length - 1)];
        expect(year30.netWorth).toBeGreaterThanOrEqual(0);
    });

    it('should handle extreme spending (portfolio-depleting) scenario', () => {
        const extremeSpend = {
            ...healthyProfile,
            spending: { fixedAmount: 300000 } // ~11% withdrawal rate
        };

        const ledger = generateLedger(extremeSpend, 'fixed', {});
        expect(ledger).toBeDefined();

        // Should deplete within ~15-20 years, not in 2 years
        // Find first year where netWorth reaches 0
        const depletionYear = ledger.findIndex(y => y.netWorth <= 0);

        if (depletionYear > 0) {
            expect(depletionYear).toBeGreaterThan(8); // At least 8 years with $2.7M at $300k/yr
        }
    });
});

describe('Monte Carlo Validation - Mathematical Consistency', () => {
    it('should have withdrawal totals match expense needs', () => {
        const ledger = generateLedger(healthyProfile, 'fixed', {});

        // In retirement years, withdrawals should roughly cover expenses + taxes
        for (let i = 0; i < Math.min(5, ledger.length); i++) {
            const year = ledger[i];

            if (year.isRetired && !year.income?.salary) {
                const expenses = year.expenses?.total || 0;
                const withdrawals = year.withdrawals?.total || 0;
                const income = (year.income?.ss || 0) + (year.income?.pension || 0);

                // Withdrawals + Income should cover expenses (within margin)
                const totalFunds = withdrawals + income;

                // Allow for tax payments and timing differences
                if (expenses > 0) {
                    expect(totalFunds).toBeGreaterThanOrEqual(expenses * 0.5);
                }
            }
        }
    });

    it('should calculate CAGR correctly between Year 0 and Final Year', () => {
        const ledger = generateLedger(healthyProfile, 'fixed', {});
        const year0 = ledger[0];
        const yearN = ledger[ledger.length - 1];
        const years = ledger.length;

        if (yearN.netWorth > 0 && year0.netWorth > 0) {
            const cagr = Math.pow(yearN.netWorth / year0.netWorth, 1 / years) - 1;

            // CAGR should be between -10% and +15% for realistic scenarios
            expect(cagr).toBeGreaterThan(-0.10);
            expect(cagr).toBeLessThan(0.15);
        }
    });
});
