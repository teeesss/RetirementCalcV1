
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Deep Dive Diagnostic Suite', () => {

    it('should generate valid ledger with corrupt STRING inputs (commas)', () => {
        const planData = JSON.parse(JSON.stringify(defaultProfile));

        // CORRUPTION: Inject strings with commas
        planData.assets.traditional.client = "2,250,000";
        planData.assets.brokerage.joint = "50,000";
        planData.expenses.essential = "4,500";

        const ledger = generateLedger(planData);
        expect(ledger).toBeDefined();
        expect(ledger.length).toBeGreaterThan(0);

        const yr1 = ledger[0];

        // Verify Type Safety
        expect(typeof yr1.balances.traditionalClient).toBe('number');
        expect(typeof yr1.balances.brokerage).toBe('number');

        // Verify Value Parsing (2,250,000 growing at assumption rate)
        // We just check it's approx 2.25M+, strict equality depends on growth logic
        expect(yr1.balances.traditionalClient).toBeGreaterThan(2000000);
        expect(yr1.balances.brokerage).toBeGreaterThan(40000);

        // Verify output is NOT NaN
        expect(isNaN(yr1.netWorth)).toBe(false);
        expect(yr1.netWorth).toBeGreaterThan(0);
    });

    it('should handle missing people array gracefully', () => {
        const planData = JSON.parse(JSON.stringify(defaultProfile));
        planData.people = []; // Empty

        const ledger = generateLedger(planData);
        expect(ledger).toEqual([]); // Should return empty array, NOT crash
    });

    it('should handle missing settings/apiKeys', () => {
        const planData = JSON.parse(JSON.stringify(defaultProfile));
        delete planData.settings; // Nuke settings

        // Should default comfortably
        const ledger = generateLedger(planData);
        expect(ledger.length).toBeGreaterThan(0);
    });
});
