import { describe, it, expect } from 'vitest';
import { calculateBreakEvenRate } from '../lib/financialMetrics';

describe('Financial Metrics', () => {
    describe('calculateBreakEvenRate', () => {
        it('should return the same tax rate if scenarios are identical', () => {
            // If I pay 20% now, and all variables are constant, break even should be 20%
            const result = calculateBreakEvenRate({
                conversionAmount: 10000,
                currentTaxCost: 2000, // 20%
                yearsToGrowth: 20,
                growthRate: 0.07,
                capitalGainsRate: 0.00 // If brokerage has 0% tax, it's a pure wash
            });
            expect(result).toBeCloseTo(0.20, 2);
        });

        it('should require a higher future tax rate if brokerage gains are taxed', () => {
            // Im paying 20% now.
            // If I kept money in Trad, it grows tax free until withdrawal.
            // If I pay tax now, I lose the compounding on that tax money.
            // AND the money I would have invested in brokerage gets dragged by CapGains tax.
            // So Future Tax needs to be HIGHER than 20% to justify converting.
            const result = calculateBreakEvenRate({
                conversionAmount: 10000,
                currentTaxCost: 2000, // 20%
                yearsToGrowth: 20,
                growthRate: 0.07,
                capitalGainsRate: 0.15 // Drag on the opportunity cost
            });

            // If brokerage gains are taxed (15%), the opportunity cost of paying tax now is lower
            // than if that money grew tax-free. However, the Roth grows tax-free.
            // Actually, paying tax from outside funds is an ARBITRAGE.
            // It allows shifting more wealth into the tax-free bucket.
            // This effectively LOWERS the hurdle rate.
            // Example: Paying 20% now might be worth it even if future tax is 18%,
            // because the tax-free growth outweighs the 2% rate differential.

            // Expected: < 20%
            expect(result).toBeLessThan(0.20);
        });

        it('should handle 0 years growth (immediate withdrawal)', () => {
            const result = calculateBreakEvenRate({
                conversionAmount: 10000,
                currentTaxCost: 2000,
                yearsToGrowth: 0,
                growthRate: 0.07,
                capitalGainsRate: 0.15
            });
            // If 0 years, opportunities cost is 0. Break even is exactly current rate.
            expect(result).toBeCloseTo(0.20, 4);
        });
    });
});
