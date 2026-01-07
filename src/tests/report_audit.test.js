
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Comprehensive Report Audit', () => {
    const testData = { ...defaultProfile };
    if (!testData.settings) testData.settings = { apiKeys: {} };

    const result = generateLedger(testData);
    const year0 = result[0];

    it('1. Net Worth Report (Starting Values)', () => {
        const b = year0.balances;
        const safe = (v) => Number(v) || 0;
        const totalNetWorth = safe(b.traditional) + safe(b.roth) + safe(b.hsa) + safe(b.brokerage) + safe(b.crypto) + safe(b.cash) + safe(b.realEstate);
        expect(totalNetWorth).toBeGreaterThan(3500000);
        expect(totalNetWorth).toBeLessThan(4500000);
    });

    it('2. Cash Flow Report Structure', () => {
        expect(year0).toHaveProperty('income');
        expect(year0).toHaveProperty('expenses');
        expect(year0).toHaveProperty('cashFlow');
    });

    it('3. Tax Summary Validation', () => {
        expect(year0).toHaveProperty('taxes');
        expect(year0.taxes.totalTax).toBeGreaterThanOrEqual(0);
    });
});
