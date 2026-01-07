
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Spending Strategy Integration', () => {
    const baseData = {
        ...defaultProfile,
        assets: { ...defaultProfile.assets, brokerage: 1000000 },
        expenses: { ...defaultProfile.expenses, spendingPhases: null }
    };

    it('should run generateLedger without errors', () => {
        const data = { ...baseData };
        generateLedger(data);
        expect(true).toBe(true);
    });
});
