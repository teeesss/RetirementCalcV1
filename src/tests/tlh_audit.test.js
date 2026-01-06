
import { describe, test, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('TLH Persistence Audit', () => {
    test('Loss Bank Decrements correctly (The Stick & Carrot)', () => {
        const profile = JSON.parse(JSON.stringify(defaultProfile));
        profile.monteCarlo = { enabled: false };
        profile.assumptions.growthRate = 0;
        profile.people[0].age = 50;

        // Year 1: Harvest $10,000. No Gains.
        // Should use $3,000 against Ordinary Income.
        // Remaining Bank should be $7,000.

        profile.taxOptimization.taxLossHarvesting = {
            crypto: 10000,
            brokerage: 0,
            startAge: 50
        };

        const ledger = generateLedger(profile);
        const y1 = ledger[0];
        const y2 = ledger[1];

        // Logic:
        // Start Year 1: Bank = 0.
        // + Harvest 10k -> Bank = 10k.
        // Used 3k (Standard Limit against Ordinary).
        // End Year 1 Bank = 7k.

        expect(y1.balances.lossBank).toBe(7000);

        // Year 2: Harvest another $10,000.
        // Bank starts at 7k. + 10k = 17k.
        // Used 3k.
        // End Year 2 Bank = 14k.

        expect(y2.balances.lossBank).toBe(14000);
    });
});
