import { describe, it, expect } from 'vitest';
import { calculateTotalTax } from '../lib/taxEngine';

describe('FICA Leak Test', () => {
    it('should only apply FICA to earned income, not retirement withdrawals', () => {
        // Case A: $100k Salary, $0 Withdrawals
        const taxA = calculateTotalTax({
            ordinaryIncome: 100000,
            earnedIncome: 100000,
            isRetired: false,
            filingStatus: 'single',
            age: 50
        });

        // Case B: $100k Salary, $50k Withdrawals (Total Ordinary = 150k)
        const taxB = calculateTotalTax({
            ordinaryIncome: 150000,
            earnedIncome: 100000,
            isRetired: false,
            filingStatus: 'single',
            age: 50
        });

        // FICA should be IDENTICAL because earned income hasn't changed
        expect(taxA.fica.total).toBe(taxB.fica.total);
        expect(taxA.fica.ss).toBe(6200); // 6.2% of 100k
    });

    it('should have zero FICA for a retiree with only withdrawals', () => {
        const tax = calculateTotalTax({
            ordinaryIncome: 80000,
            earnedIncome: 0,
            isRetired: true,
            filingStatus: 'single',
            age: 70
        });

        expect(tax.fica.total).toBe(0);
        expect(tax.fica.ss).toBe(0);
        expect(tax.fica.medicare).toBe(0);
    });
});
