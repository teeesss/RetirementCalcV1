
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Asset Summation Logic', () => {
    it('should sum client and spouse assets correctly and apply ONLY market growth', () => {
        const testData = {
            ...defaultProfile,
            people: [
                { id: 'client', age: 50, retirementAge: 65, lifeExpectancy: 90 },
                { id: 'spouse', age: 50, retirementAge: 65, lifeExpectancy: 90 }
            ],
            // Ensure salary is high enough to generate potential surplus if logic wasn't disabled
            salary: 200000,
            assets: {
                traditional: { client: 100000, spouse: 50000 },
                roth: { client: 50000, spouse: 50000 },
                hsa: { client: 10000, spouse: 10000 },
                brokerage: { joint: 20000, client: 10000, spouse: 10000 },
                crypto: { btc: { quantity: 1, price: 50000 } }, // 50k
                cash: { total: 5000 }
            }
        };

        const result = generateLedger(testData);
        const year0 = result[0];

        // Growth is applied in Year 1 (which is index 0 of output)
        // Rate = 7% (default)

        // Traditional: 150k * 1.07 = 160,500
        expect(year0.balances.traditional).toBeCloseTo(160500);

        // Roth: 100k * 1.07 = 107,000
        expect(year0.balances.roth).toBeCloseTo(107000);

        // HSA: 20k * 1.07 = 21,400
        expect(year0.balances.hsa).toBeCloseTo(21400);

        // Brokerage: 40k * 1.07 = 42,800
        // Surplus should NOT be added.
        expect(year0.balances.brokerage).toBeCloseTo(42800);

        // Crypto: 50k * 1.10 (Crypto Default 10%) = 55,000
        expect(year0.balances.crypto).toBeCloseTo(55000);
    });
});
