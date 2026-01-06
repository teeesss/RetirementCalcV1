/**
 * Withdrawal Logic Validation
 *
 * Tests the "Engine Room" of the planner:
 * - RMD Handling
 * - Optimal Bucket Sequencing
 * - Roth Conversion logic integration
 */

import { describe, it, expect } from 'vitest';
import { optimizeWithdrawals } from '../lib/withdrawalOptimizer';

describe('Withdrawal Optimizer Strategy', () => {

    const baseBalances = {
        traditional: 500000,
        roth: 100000,
        brokerage: 200000,
        crypto: 0,
        hsa: 20000
    };

    describe('RMD (Required Minimum Distributions)', () => {
        it('should force RMD withdrawal at age 73+', () => {
            // Age 73, Gap $0 (Expenses covered). RMD must still happen.

            const result = optimizeWithdrawals({
                age: 73,
                gap: 0,
                balances: { ...baseBalances },
                filingStatus: 'single',
                ordinaryIncome: 30000
            });

            // RMD for 500k at 73 (factor 26.5) ≈ 18,867
            expect(result.withdrawals.traditional).toBeGreaterThan(18000);

            // Surplus logic (Gap was 0, so RMD is surplus -> goes to Brokerage or Cash flow)
            // Solver: "needed = 0".
            // Waterfall: RMD forced. "remainingNeed" stays 0.
            // Withdrawals = RMD.
            // Balances reduced by RMD.
            expect(result.withdrawals.traditional).toBeGreaterThan(0);
        });

        it('should ignore RMD before age 73', () => {
            const result = optimizeWithdrawals({
                age: 72,
                gap: 0,
                balances: { ...baseBalances },
                filingStatus: 'single',
                ordinaryIncome: 0,
                ssBenefits: 0
            });
            expect(result.withdrawals.traditional).toBe(0);
        });
    });

    describe('Standard Withdrawal Order', () => {
        it('should prioritize Traditional for Standard Deduction, then Brokerage', () => {
            // Need 50k
            // Brokerage has 200k.
            // New "Smart" Logic: Uses Trad for Std Deduction (Effectively Tax Free), then Brokerage.

            const result = optimizeWithdrawals({
                age: 65,
                gap: 50000,
                balances: { ...baseBalances },
                filingStatus: 'single',
                strategy: { order: 'standard' }
            });

            // Std Deduction (Single 65+) approx 15k.
            expect(result.withdrawals.traditional).toBeGreaterThan(10000); // Filling Std Ded
            expect(result.withdrawals.brokerage).toBeLessThan(50000); // Remainder
            expect(result.withdrawals.brokerage).toBeGreaterThan(20000); // Majority

            const total = result.withdrawals.traditional + result.withdrawals.brokerage;
            expect(total).toBeGreaterThanOrEqual(50000);
        });

        it('should overflow to Traditional if Brokerage empty', () => {
            const result = optimizeWithdrawals({
                age: 65,
                gap: 50000,
                balances: { ...baseBalances, brokerage: 10000, hsa: 0 }, // Zero HSA to isolate Trad
                filingStatus: 'single',
                strategy: { order: 'standard' }
            });

            // 1. Trad fills Std Ded (~15k).
            // 2. Brokerage (10k).
            // 3. Trad remainder (25k).
            // Total Trad ~ 40k.

            expect(result.withdrawals.brokerage).toBe(10000);
            expect(result.withdrawals.traditional).toBeGreaterThan(30000);
            expect(result.withdrawals.roth).toBe(0);
        });
    });

    describe('Tax-Optimal Strategy (Alpha)', () => {
        it('should prioritize Traditional up to bracket limit', () => {
            // Optimal Strategy:
            // 1. Trad (Std Ded)
            // 2. Brokerage (0% LTCG)
            // 3. Brokerage (Buffer)
            // 4. Trad (Target Bracket)

            const result = optimizeWithdrawals({
                age: 65,
                gap: 50000,
                balances: { ...baseBalances, brokerage: 200000, hsa: 0 }, // Zero HSA
                filingStatus: 'single',
                strategy: { order: 'optimal' }
            });

            const total = result.withdrawals.traditional + result.withdrawals.brokerage;
            // Solver grosses up for tax (though tax should be 0 here ideally due to Smart Waterfall)
            expect(total).toBeGreaterThanOrEqual(50000);

            // Should have used some Traditional for Standard Deduction
            expect(result.withdrawals.traditional).toBeGreaterThan(14000);

            // Should use Brokerage for the rest (LTCG 0%)
            expect(result.withdrawals.brokerage).toBeGreaterThan(20000);
        });

        it('should fill bracket gaps with Traditional if Brokerage is exhausted', () => {
            const result = optimizeWithdrawals({
                age: 65,
                gap: 150000, // Large gap
                balances: { ...baseBalances, brokerage: 0, hsa: 0 }, // Zero HSA
                filingStatus: 'single',
                ordinaryIncome: 0,
                strategy: { order: 'optimal', targetBracket: 0.12 }
            });

            // Expect Taxable Income to be filled.
            // Then Roth.

            expect(result.withdrawals.traditional).toBeGreaterThan(50000); // Std Ded + Bracket fill
            expect(result.withdrawals.roth).toBeGreaterThan(50000); // Overflow
            expect(result.withdrawals.hsa).toBe(0);
        });
    });

    describe('Roth Conversions', () => {
        it('should convert Traditional to Roth if room in bracket', () => {
            // Gap 0 (Expenses met).
            // Income 0.
            // Target Bracket 12% (Limit 47,150).
            // Should convert ~47k + Std Ded

            const result = optimizeWithdrawals({
                age: 65,
                gap: 0,
                balances: { ...baseBalances },
                filingStatus: 'single',
                ordinaryIncome: 0,
                strategy: {
                    allowRothConversion: true,
                    rothConversionBracket: 0.12
                }
            });

            expect(result.withdrawals.rothConversion).toBeGreaterThan(40000);
            expect(result.balances.roth).toBeGreaterThan(baseBalances.roth + 40000);
        });
    });

});
