
import { describe, it, expect } from 'vitest';
import { calculateBucketInventory } from '../lib/taxFreeEngine';

describe('TaxFreeEngine Data Type Safety', () => {
    it('should correctly sum liquid assets when cash is an object', () => {
        const assets = {
            traditional: { client: 1000, spouse: 0 },
            roth: { client: 500, spouse: 0 },
            brokerage: { joint: 2000 },
            brokerageBasis: { joint: 1000 },
            cash: { total: 5000 }, // Object format causing bug
            crypto: { btc: { quantity: 1, price: 1000 } } // 1000
        };

        const result = calculateBucketInventory(assets);

        // afterTax = brokerage (2000) + cash (5000) + crypto (1000) = 8000
        expect(result.afterTax.total).toBe(8000);

        // Should NOT be NaN or contain "[object Object]"
        expect(typeof result.afterTax.total).toBe('number');
        expect(result.total).toBe(1000 + 500 + 2000 + 5000 + 1000);
    });

    it('should correctly sum liquid assets when cash is a number', () => {
        const assets = {
            traditional: { client: 0, spouse: 0 },
            roth: { client: 0, spouse: 0 },
            brokerage: { joint: 0 },
            cash: 5000, // Number format
            crypto: null
        };

        const result = calculateBucketInventory(assets);
        expect(result.afterTax.total).toBe(5000);
    });
});
