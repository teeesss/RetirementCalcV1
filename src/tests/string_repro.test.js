
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Regression Reproduction: Data Corruption', () => {
    it('should handle string inputs for assets without concatenating', () => {
        // Create a plan with STRING values matching what might be in localStorage
        const planData = JSON.parse(JSON.stringify(defaultProfile));

        // Corrupt the data with strings with COMMAS (The killer)
        planData.assets.traditional.client = "2,250,000"; // Comma!
        planData.assets.brokerage.joint = "50,000";     // Comma!

        // Ensure settings exist
        if (!planData.settings) planData.settings = {};
        if (!planData.settings.apiKeys) planData.settings.apiKeys = { rentcast: '' };

        const ledger = generateLedger(planData, 'fixed', {});

        const firstYear = ledger[0];
        // If string concat happened: "2250000" + 0 = "22500000" (maybe?)
        // Or if logic involves addition: "2250000" + "50000" = "225000050000"

        // Check if initial balance is reasonable (number) vs string
        console.log('Trad Balance Type:', typeof firstYear.balances.traditional);
        console.log('Trad Balance Value:', firstYear.balances.traditional);

        // Expect strict number type
        expect(typeof firstYear.balances.traditional).toBe('number');
        expect(firstYear.balances.traditional).toBe(2407500); // Should be number, not string
    });
});
