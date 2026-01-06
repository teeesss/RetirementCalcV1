/**
 * Monte Carlo Validation
 *
 * Verifies statistical accuracy of simulations:
 * - Geometric Brownian Motion properties (roughly)
 * - Percentile sorting
 * - Success Rate calculation
 */

import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../lib/monteCarlo';

describe('Monte Carlo Simulation', () => {

    // Mock Cash Flow Function: Grow by return, withdraw fixed amount
    const createMockCashFlow = (withdrawalAmount = 0, startBalance = 100000) => {
        return (age, eqRet, crRet, balances) => {
            const currentTotal = balances ? balances.totalBalance : startBalance;

            // Simple model: 100% Equity for testing
            const growth = currentTotal * eqRet;
            const newTotal = currentTotal + growth - withdrawalAmount;

            return {
                balances: { totalBalance: Math.max(0, newTotal) },
                success: newTotal >= 0
            };
        };
    };

    it('should run the requested number of simulations', () => {
        const result = runMonteCarlo({
            startAge: 60,
            endAge: 90,
            iterations: 500,
            equityReturn: 0.07,
            equityVolatility: 0.15,
            cashFlowFn: createMockCashFlow(40000, 1000000)
        });

        // The result object has 'iterations' property, but assumes internal loop worked
        expect(result.iterations).toBe(500);
        // Can check percentiles lengths to confirm simulated years
        // EndAge 90 - StartAge 60 + 1 = 31 years
        expect(result.percentiles.p50.length).toBe(31);
    });

    it('should calculate percentiles correctly (Deterministic)', () => {
        // Zero volatility, zero withdrawal -> deterministic FV
        const startBalance = 100000;
        const years = 10;
        const r = 0.05;

        const result = runMonteCarlo({
            startAge: 60,
            endAge: 60 + years - 1, // 10 years inclusive
            iterations: 100, // Speed
            equityReturn: r,
            equityVolatility: 0, // Deterministic
            cashFlowFn: createMockCashFlow(0, startBalance)
        });

        // FV = PV * (1+r)^n roughly?
        // Note: simulation applies return year by year.
        // Year 1 end = Start * (1+r).
        // 10 years loop.
        const expectedFV = startBalance * Math.pow(1 + r, years);

        // Check final median
        expect(result.finalBalances.median).toBeCloseTo(expectedFV, 0);
        expect(result.finalBalances.p10).toBeCloseTo(expectedFV, 0);
        expect(result.finalBalances.p90).toBeCloseTo(expectedFV, 0);
    });

    it('should report failure rate', () => {
        // Guaranteed failure: Withdraw 200k/yr from 100k
        const result = runMonteCarlo({
            startAge: 60,
            endAge: 70,
            iterations: 50,
            equityReturn: 0.05,
            equityVolatility: 0,
            cashFlowFn: createMockCashFlow(200000, 100000)
        });

        expect(result.successRate).toBe(0);
    });

    it('should reflect volatility in spread', () => {
        const result = runMonteCarlo({
            startAge: 60,
            endAge: 80,
            iterations: 1000,
            equityReturn: 0.07,
            equityVolatility: 0.20,
            cashFlowFn: createMockCashFlow(0, 100000)
        });

        // 90th percentile should be significantly > 10th percentile
        expect(result.finalBalances.p90).toBeGreaterThan(result.finalBalances.p10);

        // Median should be between them
        expect(result.finalBalances.median).toBeGreaterThan(result.finalBalances.p10);
        expect(result.finalBalances.median).toBeLessThan(result.finalBalances.p90);
    });

});
