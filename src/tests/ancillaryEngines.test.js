/**
 * Ancillary Engines Validation
 *
 * Tests secondary financial engines:
 * 1. Reverse Mortgage (HECM) - Growth and Limits
 * 2. Line of Credit - Arbitrage Logic (Borrow vs Sell)
 * 3. Custom Withdrawal Rules - User-defined sequences
 * 4. Bucket Strategy - Cash refill logic
 */

import { describe, it, expect } from 'vitest';
import { growHECM, calculateInitialPrincipalLimit } from '../lib/reverseMortgage';
import { shouldBorrow, estimateMarginRisk } from '../lib/lineOfCreditEngine';
import { applyCustomWithdrawalRule, validateWithdrawalRule } from '../lib/customWithdrawalEngine';
import { shouldRefillBucket } from '../lib/bucketStrategy';

describe('Ancillary Engines Validation', () => {

    describe('Reverse Mortgage (HECM)', () => {
        it('should calculate Principal Limit based on age and rate', () => {
            // Heuristic: Base 0.40 + Age Factor - Rate Factor
            // Age 72 (10 years > 62) -> +0.10
            // Rate 7% (2% > 5%) -> -0.10
            // Net Factor = 0.40
            // MCA 1M -> Limit 400k
            const limit = calculateInitialPrincipalLimit(72, 1000000, 0.07);
            expect(limit).toBeCloseTo(400000);
        });

        it('should grow line of credit based on interest + MIP', () => {
            const result = growHECM({
                currentLimit: 500000,
                currentBalance: 100000,
                interestRate: 0.05,
                mipRate: 0.005, // 0.5%
                draw: 0
            });

            // Growth Rate = 5.5%
            // New Limit = 500k * 1.055 = 527,500
            // New Balance = 100k * 1.055 = 105,500
            expect(result.newLimit).toBeCloseTo(527500);
            expect(result.newBalance).toBeCloseTo(105500);
            expect(result.availableCredit).toBeCloseTo(527500 - 105500);
        });
    });

    describe('Line of Credit (LOC) Arbitrage', () => {
        it('should recommend borrowing if spread is positive and risk is low', () => {
            const decision = shouldBorrow({
                expectedReturn: 0.08, // Asset Return
                rateAfterTax: 0.05,   // Borrow Cost
                marginProb: 0.01,     // 1% Risk
                tolerance: 0.05,      // 5% Tolerance
                hurdle: 0.02          // 2% Spread Req
            });
            // Spread 3% > 2% Hurdle. Risk 1% < 5%. -> Borrow
            expect(decision).toBe(true);
        });

        it('should recommend selling if spread is too low', () => {
            const decision = shouldBorrow({
                expectedReturn: 0.06,
                rateAfterTax: 0.05, // Spread 1% < 2%
                marginProb: 0.01
            });
            expect(decision).toBe(false);
        });

        it('should estimate margin risk correctly', () => {
            // LTV 0.50, Maint 0.70. Max safe drawdown = 1 - (0.5/0.7) = 28.5%
            // Volatility 0.15.
            // Z = 0.285 / 0.15 = 1.9
            // Z > 1 implies moderate risk ~16% (according to simplified engine logic)
            // Z < 2 (1.9) -> returns 0.16

            expect(estimateMarginRisk(0.15, 0.50)).toBe(0.16);
        });
    });

    describe('Custom Withdrawal Rules', () => {
        const rule = {
            name: 'Rule 55',
            ageStart: 55,
            ageEnd: 59,
            sequence: ['brokerage', 'roth'],
            amounts: {
                brokerage: { type: 'fixed', value: 50000 },
                roth: { type: 'remainder' }
            }
        };

        it('should validate correct rule structure', () => {
            expect(validateWithdrawalRule(rule).valid).toBe(true);
        });

        it('should execute rule sequence', () => {
            const balances = { brokerage: 40000, roth: 100000 };
            const gap = 60000;

            const result = applyCustomWithdrawalRule(rule, balances, gap);

            // Brokerage: Fixed 50k, but only 40k available -> Take 40k
            // Remaining Gap: 20k
            // Roth: Remainder -> Take 20k
            expect(result.brokerage).toBe(40000);
            expect(result.roth).toBe(20000);
            expect(result.traditional).toBe(0);
        });
    });

    describe('Bucket Strategy Refill', () => {
        it('should refill when market is up', () => {
            const refill = shouldRefillBucket({
                currentCash: 50000,
                targetCash: 100000,
                portfolioReturn: 0.10,
                refillConditions: 'market_up'
            });
            expect(refill).toBe(true);
        });

        it('should NOT refill when market is down', () => {
            const refill = shouldRefillBucket({
                currentCash: 50000,
                targetCash: 100000,
                portfolioReturn: -0.05,
                refillConditions: 'market_up'
            });
            expect(refill).toBe(false);
        });
    });

});
