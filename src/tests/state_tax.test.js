
import { describe, test, expect } from 'vitest';
import { calculateStateTaxModel } from '../lib/stateTaxEngine';
import { STATE_DEDUCTIONS } from '../data/stateTaxBrackets';

describe('State Tax Engine (Progressive)', () => {

    test('Florida (No Income Tax)', () => {
        const result = calculateStateTaxModel({
            state: 'FL',
            taxableIncome: 1000000,
            filingStatus: 'married'
        });
        expect(result).toBe(0);
    });

    test('Texas (No Income Tax)', () => {
        const result = calculateStateTaxModel({
            state: 'TX',
            taxableIncome: 500000,
            filingStatus: 'single'
        });
        expect(result).toBe(0);
    });

    test('California (Progressive + Deduction)', () => {
        // Single Filer, $100,000 Income
        // Deduction: 5363
        // Taxable: 94637
        const income = 100000;
        const result = calculateStateTaxModel({
            state: 'CA',
            taxableIncome: income,
            filingStatus: 'single'
        });

        // Manual calc: ~5454.09
        expect(result).toBeGreaterThan(5400);
        expect(result).toBeLessThan(5500);
    });

    test('California (Mental Health Surcharge > 1M)', () => {
        // Single Filer, $2,000,000 Income
        // Taxable Base ~1.99M
        const income = 2000000;
        const result = calculateStateTaxModel({
            state: 'CA',
            taxableIncome: income,
            filingStatus: 'single'
        });

        // Base Tax (Max bracket 12.3% above ~700k) + 1% Surcharge on > 1M (which is ~1M * 0.01 = 10k)
        // High level check:
        // 12.3% of 2M is ~246k.
        // Surcharge is 10k.
        // Total ~256k.

        expect(result).toBeGreaterThan(230000);
        expect(result).toBeLessThan(250000);
    });

    test('New York (Progressive)', () => {
        // Married, $200,000 Income
        // Deduction: 16050
        // Taxable: 183950
        // Rates: 4% to 5.5% mostly.
        const result = calculateStateTaxModel({
            state: 'NY',
            taxableIncome: 200000,
            filingStatus: 'married'
        });

        // Rough Calc: 5.5% effective on 184k is ~10k.
        expect(result).toBeGreaterThan(9000);
        expect(result).toBeLessThan(12000);
    });

    test('Unknown State Returns 0', () => {
        const result = calculateStateTaxModel({
            state: 'XX', // Unknown code
            taxableIncome: 100000,
            filingStatus: 'single'
        });
        expect(result).toBe(0);
    });
});
