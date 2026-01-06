
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Regression Reproduction', () => {
    it('should run generateLedger with defaultProfile without crashing', () => {
        // Create a deep copy to avoid mutation artifacts
        const planData = JSON.parse(JSON.stringify(defaultProfile));

        // Ensure settings.apiKeys exists as per PlanContext migration logic
        if (!planData.settings) planData.settings = {};
        if (!planData.settings.apiKeys) planData.settings.apiKeys = { rentcast: '' };

        try {
            const ledger = generateLedger(planData, 'fixed', {});
            expect(ledger).toBeDefined();
            expect(ledger.length).toBeGreaterThan(0);

            // Check final values
            const final = ledger[ledger.length - 1];
            console.log('Final Net Worth:', final.netWorth);
        } catch (error) {
            console.error('CRASH REPRODUCED:', error);
            throw error;
        }
    });
});
