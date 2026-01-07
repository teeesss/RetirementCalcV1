
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Unified Sanity & Business Logic Audit (The Watchdog)', () => {
    // Single Authoritative Source
    const ledger = generateLedger(JSON.parse(JSON.stringify(defaultProfile)));

    it('should respect authoritative inputs from Default Profile', () => {
        // Pension Check (User explicitly said "I do not have a pension")
        // Profile says 0 (or undefined). Logic must output 0.
        // We use the new pension variable we fixed in metrics
        const totalPension = ledger.reduce((sum, year) => sum + (year.metrics.detailedCashFlow?.inflows?.pension || 0), 0);
        expect(totalPension).toBe(0);

        // Social Security Check
        // Profile has SS. Logic must output > 0 eventually.
        const totalSS = ledger.reduce((sum, year) => sum + (year.metrics.detailedCashFlow?.inflows?.socialSecurity || 0), 0);
        expect(totalSS).toBeGreaterThan(0);

        // Mortgage Check
        // Profile has Mortgage. Logic must output > 0 payments initially.
        const totalMortgage = ledger.reduce((sum, year) => sum + (year.metrics.detailedCashFlow?.outflows?.mortgage || 0), 0);
        expect(totalMortgage).toBeGreaterThan(0);
    });

    it('should maintain strict business logic invariants', () => {
        ledger.forEach((year, index) => {
            // 1. Tax Rate Cap Sanity
            // Effective Tax Rate shouldn't exceed 55% even in worst case (fed + state + fica + niit)
            if (year.taxes.totalTax > 0) {
                // Use Gross Income from tax calculation (includes withdrawals/conversions)
                // If missing, fall back to income.total + withdrawals
                const denominator = year.taxes.grossIncome || (year.income.total + (year.withdrawals?.total || 0));

                if (denominator > 0) {
                    const effectiveRate = year.taxes.totalTax / denominator;
                    if (effectiveRate > 0.55) {
                        console.log(`ANOMALY DEBUG Age ${year.age}:`, {
                            income: year.income,
                            taxes: year.taxes,
                            withdrawals: year.withdrawals,
                            metrics: year.metrics
                        });
                        throw new Error(`Sanity Fail: Effective Tax Rate ${effectiveRate.toFixed(2)} exceeds 55% at age ${year.age}`);
                    }
                }
            }

            // 2. Non-Negative Assets (unless explicitly debt)
            if (year.totalBalance < 0) {
                expect(year.totalBalance).toBeGreaterThanOrEqual(0);
            }

            // 3. RMDs
            // RMDs must start by age 75 (Secure 2.0 uses 73-75).
            if (year.age >= 75 && year.balances.traditional > 0) {
                const rmd = year.metrics.detailedCashFlow?.inflows?.rmd || 0;
                expect(rmd).toBeGreaterThan(0);
            }
        });
    });
});
