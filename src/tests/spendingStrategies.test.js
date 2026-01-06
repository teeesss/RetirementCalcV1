/**
 * Spending Strategy Validation
 *
 * Verifies dynamic spending logic:
 * - Blanchett's "Spending Smile" (Age-Phased)
 * - Guyton-Klinger Guardrails (Market-based)
 * - Max Spend (Front-loaded)
 * - Actuarial (Life Expectancy)
 */

import { describe, it, expect } from 'vitest';
import {
    calculateBlanchettSmile,
    applyGuardrails,
    calculateMaxSpend,
    calculateActuarial
} from '../lib/spendingStrategies';

describe('Spending Strategy Validation', () => {

    describe('Blanchett Smile (Age Phasing)', () => {
        const retirementAge = 60;
        const baseline = 100000;

        it('should spend more in Go-Go years (Year 0)', () => {
            // Formula: 1.10 at start of Go-Go
            expect(calculateBlanchettSmile(60, retirementAge, baseline)).toBeCloseTo(110000);
        });

        it('should dip in Slow-Go years (Year 15)', () => {
            // Year 15 is 5 years into Slow-Go (10-25).
            // Slow-Go range: 85-90%.
            // 5/15 into phase = 1/3 drop from 100% to 85%?
            // Formula: 1.00 - (5/15)*0.15 = 1 - 0.05 = 0.95
            expect(calculateBlanchettSmile(75, retirementAge, baseline)).toBeCloseTo(95000);
        });

        it('should stabilize/rise slightly in No-Go years (Healthcare)', () => {
            // Year 30 (Age 90). No-Go.
            // Formula: 0.75 + Healthcare Factor.
            // Factor = min(0.10, yearsSinceSlowGo * 0.01)
            // Years since SlowGo (25) = 5.
            // Factor = 0.05.
            // Total = 0.80.
            expect(calculateBlanchettSmile(90, retirementAge, baseline)).toBeCloseTo(80000);
        });
    });

    describe('Guyton-Klinger Guardrails', () => {
        const peak = 1000000;
        const currentSpending = 40000;
        const guardrails = { floorPercent: 0.80, ceilingPercent: 1.20, adjustmentRate: 0.10 };

        it('should cut spending if portfolio drops below floor', () => {
            // Portfolio 700k (70% of peak, < 80%)
            const result = applyGuardrails(700000, peak, currentSpending, guardrails);
            // Cut by 10% -> 36000
            expect(result).toBe(36000);
        });

        it('should increase spending if portfolio exceeds ceiling', () => {
            // Portfolio 1.3M (130% of peak, > 120%)
            const result = applyGuardrails(1300000, peak, currentSpending, guardrails);
            // Increase by 10% -> 44000
            expect(result).toBe(44000);
        });

        it('should hold steady within rails', () => {
            // Portfolio 900k (90%)
            const result = applyGuardrails(900000, peak, currentSpending, guardrails);
            expect(result).toBe(40000);
        });
    });

    describe('Max Spend (Front-Loaded)', () => {
        it('should calculate amortization correctly', () => {
            // Portfolio 1M. 10 Years. 0% Growth (Simple case).
            // Should be 100k/yr.
            const result = calculateMaxSpend(1000000, 60, 70, 0, 0);
            expect(result).toBeCloseTo(100000);
        });

        it('should account for growth (Amortization)', () => {
            // PMT function check.
            // PV=100000, n=10, r=0.05. FV=0.
            // PMT ≈ 12950.
            const result = calculateMaxSpend(100000, 60, 70, 0.05, 0);
            expect(result).toBeCloseTo(12950, 0);
        });

        it('should respect legacy goal', () => {
            // PV=100000, Legacy=50000. n=10, r=0.
            // Spendable = 50000. / 10 = 5000.
            const result = calculateMaxSpend(100000, 60, 70, 0, 50000);
            expect(result).toBe(5000);
        });
    });

    describe('Actuarial (RMD Style)', () => {
        it('should divide portfolio by remaining life', () => {
            const portfolio = 500000;
            const age = 90;
            const lifeExpectancy = 95;
            // 5 Years remaining.
            // 100k/yr.
            expect(calculateActuarial(portfolio, age, lifeExpectancy)).toBe(100000);
        });
    });

});
