
import { describe, it, expect } from 'vitest';
import { applyCustomWithdrawalRule } from '../lib/customWithdrawalEngine';

describe('Custom Withdrawal Engine Limits', () => {
    const balances = {
        brokerage: 100000,
        traditional: 100000,
        roth: 100000,
        crypto: 0,
        hsa: 0
    };

    it('should respect fixed maxAmount', () => {
        const rule = {
            sequence: ['brokerage'],
            amounts: {
                brokerage: { type: 'fixed', maxAmount: 50000 }
            }
        };
        const result = applyCustomWithdrawalRule(rule, balances, 100000);
        expect(result.brokerage).toBe(50000);
    });

    it('should respect maxPercent', () => {
        const rule = {
            sequence: ['brokerage'],
            amounts: {
                brokerage: { type: 'percentage', maxPercent: 50 } // 50% of 100k = 50k
            }
        };
        const result = applyCustomWithdrawalRule(rule, balances, 100000);
        expect(result.brokerage).toBe(50000);
    });

    it('should respect maxDollarCap on percentage', () => {
        const rule = {
            sequence: ['brokerage'],
            amounts: {
                brokerage: { type: 'percentage', maxPercent: 50, maxDollarCap: 20000 } // 50% = 50k, but capped at 20k
            }
        };
        const result = applyCustomWithdrawalRule(rule, balances, 100000);
        expect(result.brokerage).toBe(20000);
    });

    it('should use remaining gap if lower than limits', () => {
        const rule = {
            sequence: ['brokerage'],
            amounts: {
                brokerage: { type: 'fixed', maxAmount: 50000 }
            }
        };
        const result = applyCustomWithdrawalRule(rule, balances, 10000); // Gap is only 10k
        expect(result.brokerage).toBe(10000);
    });
});
