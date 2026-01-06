import { describe, it, expect } from 'vitest';
import {
    calculate0PercentThresholds,
    optimizeTaxFreeWithdrawal,
    calculateBucketInventory,
    calculateOptimalRothConversion
} from '../lib/taxFreeEngine';

describe('Tax-Free Retirement Engine', () => {

    describe('calculate0PercentThresholds', () => {
        it('should return correct thresholds for single filer (2025)', () => {
            const result = calculate0PercentThresholds('single');
            expect(result.bucket1Max).toBe(15000); // Standard Deduction
            expect(result.bucket2Max).toBe(48350); // 0% LTCG
            expect(result.totalTaxFree).toBe(63350);
        });

        it('should return correct thresholds for married filer (2025)', () => {
            const result = calculate0PercentThresholds('married');
            expect(result.bucket1Max).toBe(30000);
            expect(result.bucket2Max).toBe(96700);
            expect(result.totalTaxFree).toBe(126700);
        });

        it('should return correct thresholds for head of household (2025)', () => {
            const result = calculate0PercentThresholds('head');
            expect(result.bucket1Max).toBe(22500);
            expect(result.bucket2Max).toBe(64750);
        });
    });

    describe('optimizeTaxFreeWithdrawal', () => {
        const balances = {
            traditional: { client: 500000, spouse: 500000 },
            brokerage: { joint: 200000 },
            brokerageBasis: { joint: 100000 }, // 50% gain ratio
            roth: { client: 100000, spouse: 100000 }
        };

        it('should fill Bucket #1 (Standard Deduction) first', () => {
            // Needed: $25,000. Income: $0. Application: Married ($30k SD)
            const gap = 25000;
            const currentIncome = 0;
            const filingStatus = 'married';

            const result = optimizeTaxFreeWithdrawal(gap, balances, currentIncome, filingStatus);

            expect(result.traditional).toBe(25000);
            expect(result.brokerage).toBe(0);
            expect(result.roth).toBe(0);
            // $25k income is < $30k SD, so tax should be 0
        });

        it('should overflow to Bucket #2 (0% LTCG) when Bucket #1 is full', () => {
            // Needed: $50,000. Income: $0. Married ($30k SD, $96.7k LTCG limit)
            const gap = 50000;
            const currentIncome = 0;
            const filingStatus = 'married';

            const result = optimizeTaxFreeWithdrawal(gap, balances, currentIncome, filingStatus);

            expect(result.traditional).toBe(30000); // Maxes out bucket 1
            expect(result.brokerage).toBe(20000); // Remaining from brokerage
            expect(result.roth).toBe(0);
        });

        it('should overflow to Bucket #3 (Roth) when Bucket #2 is capped', () => {
            // Needed: $150,000. Income: $0. Married.
            // Bucket 1: $30k
            // Taxable Income = $30k.
            // Bucket 2 Room = $96.7k - $30k = $66.7k
            // Brokerage gain ratio is 0.5 (Available: $200k, Gain: $100k)
            // Realizing $66.7k gain means selling $133.4k principal

            const gap = 170000;
            const currentIncome = 0;
            const filingStatus = 'married';

            const result = optimizeTaxFreeWithdrawal(gap, balances, currentIncome, filingStatus);

            expect(result.traditional).toBe(30000);

            // Bucket 2 Logic:
            // 0% LTCG Limit: 96700
            // Taxable Income from Trad: 30000
            // Room: 66700
            // Gain Ratio: 0.5
            // Max Gain to Realize: 66700
            // Sale Amount: 66700 / 0.5 = 133400
            expect(result.brokerage).toBe(133400);

            // Total covered so far: 30000 + 133400 = 163400
            // Remaining needed: 170000 - 163400 = 6600
            expect(result.roth).toBe(6600);
        });

        it('should use Roth if brokerage room is limited by income', () => {
            // High Income: $80,000 (SS/Pension)
            // Needed: $20,000
            // Married. SD: $30k. LTCG Limit: $96.7k

            const gap = 20000;
            const currentIncome = 80000;
            const filingStatus = 'married';

            // Bucket 1 Room: 30000 - 80000 = 0 (Income > SD)
            // Bucket 2 Room: 96700 - 80000 = 16700

            const result = optimizeTaxFreeWithdrawal(gap, balances, currentIncome, filingStatus);

            expect(result.traditional).toBe(0);

            // Brokerage:
            // Gain Ratio: 0.5
            // Max Gain: 16700
            // Sale Amount: 16700 / 0.5 = 33400
            // Available to withdraw: min(33400, gap) -> 20000
            // If we withdraw 20000 from brokerage -> 10000 gain.
            // 10000 gain < 16700 room. OK.

            expect(result.brokerage).toBe(20000);
            expect(result.roth).toBe(0);
        });

        it('should include Crypto and Cash in Bucket #2', () => {
            const testBalances = {
                traditional: { client: 0, spouse: 0 },
                brokerage: { joint: 10000 },
                brokerageBasis: { joint: 5000 }, // 50% gain
                crypto: { btc: { quantity: 1, price: 5000 } }, // $5000 crypto
                cash: 5000,
                roth: { client: 50000, spouse: 50000 }
            };

            const gap = 15000;
            const currentIncome = 40000; // Single. SD: 15k. LTCG Limit: 48350.
            // SD filled by income.
            // LTCG Room: 48350 - 40000 = 8350

            const result = optimizeTaxFreeWithdrawal(gap, testBalances, currentIncome, 'single');

            // 1. Brokerage: Room 8350. Max gain to realize: 8350.
            // Sale amount: 8350 / 0.5 = 16700. Available: 10000.
            // Withdrawals: 10000. Realized Gain: 5000. Remaining Room: 8350 - 5000 = 3350.
            expect(result.brokerage).toBe(10000);

            // 2. Crypto: Remaining Gap 5000. Remaining Room: 3350. Crypto Available: 5000.
            // Withdrawal: min(5000, 5000, 3350) = 3350
            expect(result.crypto).toBe(3350);

            // 3. Cash: Remaining Gap: 15000 - 10000 - 3350 = 1650. Cash Available: 5000.
            // Withdrawal: min(1650, 5000) = 1650
            expect(result.cash).toBe(1650);

            expect(result.gap).toBe(0);
        });

        it('should use Crypto and Cash to fill gap when Brokerage is empty', () => {
            const balances = {
                traditional: { client: 100000, spouse: 0 },
                brokerage: { joint: 0 },
                crypto: 20000, // Numeric input validation
                cash: 20000,
                roth: { client: 0, spouse: 0 }
            };

            const gap = 50000;
            const currentIncome = 0;
            const filingStatus = 'single'; // Std Ded $15k

            const result = optimizeTaxFreeWithdrawal(gap, balances, currentIncome, filingStatus);

            // Bucket 1: $15,000 Traditional (Tax Free)
            expect(result.traditional).toBe(15000);

            // Remaining Gap: $35,000
            // Bucket 2 (0% LTCG): Limit $48,350. Taxable Income $0. Room $48,350.
            // Priority: Brokerage -> Crypto -> Cash

            // Crypto: $20,000 available. Fully within LTCG room.
            expect(result.crypto).toBe(20000);

            // Remaining Gap: $15,000
            // Cash: $20,000 available.
            expect(result.cash).toBe(15000);

            expect(result.gap).toBe(0);
        });
    });

    describe('calculateBucketInventory', () => {
        const assets = {
            traditional: { client: 100, spouse: 100 },
            hsa: { client: 50, spouse: 50 },
            brokerage: { joint: 200 },
            brokerageBasis: { joint: 150 },
            roth: { client: 300, spouse: 0 }
        };

        it('should correctly sum up buckets', () => {
            const result = calculateBucketInventory(assets);

            expect(result.preTax.total).toBe(300); // 100+100+50+50
            expect(result.afterTax.total).toBe(200);
            expect(result.afterTax.unrealizedGains).toBe(50); // 200-150
            expect(result.taxFree.total).toBe(300);
            expect(result.total).toBe(800);
        });

        it('should provide reasonable recommendations', () => {
            const result = calculateBucketInventory(assets);
            // TaxFree is 300/800 = 37.5% (>15%)
            // AfterTax is 200/800 = 25% (>20%)
            // PreTax is 300/800 = 37.5% (>30%)
            expect(result.balance.recommendation).toBe('Buckets are well-balanced for tax-free retirement strategy');
        });
    });

    describe('calculateOptimalRothConversion', () => {
        it('should calculate conversion to fill 12% bracket', () => {
            // Married. 12% top is 96950.
            // Current Income: 50000.
            // Room: 46950.

            const result = calculateOptimalRothConversion(100000, 50000, '12', 'married');

            expect(result.amount).toBe(46950);
            expect(result.taxCost).toBeCloseTo(46950 * 0.12);
        });

        it('should cap conversion at available balance', () => {
            // Room: 46950. Balance: 10000.
            const result = calculateOptimalRothConversion(10000, 50000, '12', 'married');
            expect(result.amount).toBe(10000);
        });
    });

});
