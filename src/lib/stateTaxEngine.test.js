import { describe, it, expect } from 'vitest';
import { calculateStateTaxModel } from './stateTaxEngine';

describe('State Tax Engine', () => {
    describe('Florida (FL)', () => {
        it('should return 0 tax for FL', () => {
            const result = calculateStateTaxModel({ state: 'FL', taxableIncome: 100000 });
            expect(result).toBe(0);
        });
    });

    describe('Arkansas (AR)', () => {
        // Brackets:
        // 0-5299: 2%
        // 5300-10599: 4%
        // >10599: 4.4%

        it('should calculate correct tax for low income (Bucket 1)', () => {
            // $5,000 * 0.02 = $100
            const result = calculateStateTaxModel({ state: 'AR', taxableIncome: 5000 });
            expect(result).toBeCloseTo(100, 2);
        });

        it('should calculate correct tax for mid income (Bucket 2)', () => {
            // First $5,299 * 0.02 = $105.98
            // Next $701 (6000 - 5299) * 0.04 = $28.04
            // Total: 134.02
            const result = calculateStateTaxModel({ state: 'AR', taxableIncome: 6000 });
            expect(result).toBeCloseTo(134.02, 2);
        });

        it('should calculate correct tax for high income (Bucket 3)', () => {
            // First $5,299 * 0.02 = $105.98
            // Next $5,300 (10599 - 5299) * 0.04 = $212.00
            // Remaining $89,401 (100000 - 10599) * 0.044 = $3,933.644
            // Total: ~4251.62

            const result = calculateStateTaxModel({ state: 'AR', taxableIncome: 100000 });

            const b1 = 5299 * 0.02;
            const b2 = (10599 - 5299) * 0.04;
            const b3 = (100000 - 10599) * 0.044;
            const expected = b1 + b2 + b3;

            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('Unknown State', () => {
        it('should return 0 for unknown state', () => {
            const result = calculateStateTaxModel({ state: 'XX', taxableIncome: 100000 });
            expect(result).toBe(0);
        });

        it('should return 0 if state is missing', () => {
            const result = calculateStateTaxModel({ taxableIncome: 100000 });
            expect(result).toBe(0);
        });
    });
});
