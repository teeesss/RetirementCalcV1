
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Survivor Logic', () => {
    const baseData = {
        ...defaultProfile,
        profile: { ...defaultProfile.profile, filingStatus: 'married' },
        people: [
            { id: "client", name: "John", age: 70, retirementAge: 65, lifeExpectancy: 95 },
            { id: "spouse", name: "Jane", age: 70, retirementAge: 65, lifeExpectancy: 75 }
        ],
        assets: { ...defaultProfile.assets, brokerage: 1000000, brokerageBasis: { joint: 500000 } }
    };

    it('should switch Filing Status to "single" the year AFTER spouse death', () => {
        const data = { ...baseData };
        const ledger = generateLedger(data);
        expect(ledger[5].filingStatus).toBe('married');
        expect(ledger[6].filingStatus).toBe('married');
        expect(ledger[7].filingStatus).toBe('single');
    });

    it('should run generateLedger without errors for basis step-up', () => {
        const data = { ...baseData };
        generateLedger(data);
        expect(true).toBe(true);
    });
});
