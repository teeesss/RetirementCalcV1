
import { describe, test, expect } from 'vitest';
import { calculateStateTaxModel } from '../lib/stateTaxEngine';

describe('State Tax Engine (Progressive)', () => {
    test('Florida (No Income Tax)', () => {
        const result = calculateStateTaxModel({
            state: 'FL',
            taxableIncome: 1000000,
            filingStatus: 'married'
        });
        expect(result).toBe(0);
    });

    test('California (Progressive + Deduction)', () => {
        const income = 100000;
        const result = calculateStateTaxModel({
            state: 'CA',
            taxableIncome: income,
            filingStatus: 'single'
        });
        expect(result).toBeGreaterThan(5400);
        expect(result).toBeLessThan(5500);
    });
});
