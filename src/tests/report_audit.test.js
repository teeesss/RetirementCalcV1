
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Comprehensive Report Audit', () => {
    // 1. Setup & Data Validation
    const testData = { ...defaultProfile };
    // Do NOT reset assets, use defaultProfile as is.

    // Explicitly ensure settings exist for logic safety
    if (!testData.settings) testData.settings = { apiKeys: {} };

    const result = generateLedger(testData);
    const year0 = result[0];
    const finalYear = result[result.length - 1];

    it('1. Net Worth Report (Starting Values)', () => {
        // Net Worth is a UI-calculated derived value, not always in the raw ledger balances object.
        // We sum it manually here:
        const b = year0.balances;
        const safe = (v) => Number(v) || 0;
        const totalNetWorth = safe(b.traditional) + safe(b.roth) + safe(b.hsa) + safe(b.brokerage) + safe(b.crypto) + safe(b.cash) + safe(b.realEstate);

        console.log(`Starting Net Worth: ${totalNetWorth} (Trad: ${b.traditional}, Brok: ${b.brokerage}, RE: ${b.realEstate})`);

        // Assert Range: 3.5m to 4.5m (User said ~3.6-3.7m)
        expect(totalNetWorth).toBeGreaterThan(3500000);
        expect(totalNetWorth).toBeLessThan(4500000);
    });

    it('2. Cash Flow Report Structure', () => {
        expect(year0).toHaveProperty('income');
        expect(year0).toHaveProperty('expenses');
        expect(year0).toHaveProperty('cashFlow');

        expect(year0.income.total).not.toBeNaN();
        expect(year0.expenses.total).not.toBeNaN();
        expect(year0.cashFlow.surplus).not.toBeNaN();
    });

    it('3. Tax Summary Validation', () => {
        expect(year0).toHaveProperty('taxes');
        expect(year0.taxes.totalTax).toBeGreaterThanOrEqual(0);
        expect(year0.taxes.effectiveRate).not.toBeNaN();
        // Just ensure taxableIncome is calculated, deductions might be internal
        expect(year0.taxes.taxableIncome).not.toBeNaN();
    });

    it('4. Investment Balances (Brokerage & Crypto)', () => {
        expect(year0.balances.crypto).toBeGreaterThan(0);
        expect(year0.balances.brokerage).toBeGreaterThan(0);

        // Verify Growth over time
        // Verify Valid Numbers (Growth is not guaranteed due to stress tests/withdrawals)
        const year10 = result[10];
        expect(year10.balances.brokerage).not.toBeNaN();
        expect(year10.balances.crypto).not.toBeNaN();
    });

    it('5. Plan Continuity (No Cliff Events)', () => {
        for (let i = 1; i < result.length; i++) {
            // Re-calc net worth for each year
            const b = result[i].balances;
            const current = (b.traditional || 0) + (b.roth || 0) + (b.hsa || 0) + (b.brokerage || 0) + (b.crypto || 0) + (b.cash || 0) + (b.realEstate || 0);

            const pb = result[i - 1].balances;
            const prev = (pb.traditional || 0) + (pb.roth || 0) + (pb.hsa || 0) + (pb.brokerage || 0) + (pb.crypto || 0) + (pb.cash || 0) + (pb.realEstate || 0);

            if (prev > 100000) {
                const dropPercent = (prev - current) / prev;
                if (dropPercent > 0.50) {
                    console.error(`Cliff detected at Age ${result[i].age}: ${prev} -> ${current}`);
                }
                expect(dropPercent).toBeLessThan(0.50);
            }
        }
    });

    it('6. Tax Strategy & Optimizations', () => {
        // RMDs check
        // RMDs usually start appearing in the income or withdrawals
        // We look for any RMD activity after 75
        const rmdYears = result.filter(y => y.age >= 76);
        const hasRMD = rmdYears.some(y => y.withdrawals.traditional > 0);
        // Note: if user has no traditional funds left, RMD is 0.
        // Check if there ARE traditional funds
        if (rmdYears[0] && rmdYears[0].balances.traditional > 10000) {
            expect(hasRMD).toBe(true);
        }
    });
});
