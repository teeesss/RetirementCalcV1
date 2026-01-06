
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Deep Dive Stress Tests', () => {

    it('should correctly execute Roth Conversions when optimal', () => {
        const input = JSON.parse(JSON.stringify(defaultProfile));
        // Setup scenarios where Roth Conversion is beneficial
        // Early retirement (low income), high Trad balance
        input.people[0].age = 60;
        input.people[0].retirementAge = 60;
        input.people[0].lifeExpectancy = 85;
        input.salary = 0;
        input.assets.traditional.client = 1_000_000;
        input.assets.roth.client = 0;
        input.expenses.essential = 40000; // Low spend to leave room in bracket
        // Zero out other assets to force Traditional usage and clear visibility
        input.assets.cash.total = 0;
        input.assets.brokerage.joint = 0;
        input.taxOptimization = {
            withdrawalOrder: 'optimal',
            enableRothConversion: true,
            rothConversionBracket: 0.12 // Filling 12% bracket
        };

        const ledger = generateLedger(input);

        // Check first year of retirement
        const year1 = ledger[0];

        // We expect some conversion because:
        // Income = 0
        // Spend = 40k
        // Gap = 40k (From Traditional)
        // Taxable = 40k - 21k (Std Ded Head) = 19k.
        // Bracket Top (12%) = 63k.
        // Room = 63k - 19k = 44k.
        // Conversion ~ 44k.
        // Roth Balance should be > 0.

        // However, optimizeWithdrawals logic calculates conversion based on gap === 0.
        // With 40k spend, gap > 0 initially.
        // optimizeWithdrawals fills gap with Trad/Brokerage.
        // Once gap = 0, check if room remains.

        // To be sure, we check if Roth balance grew.
        // Initially 0.
        // We need to check balances[key] in ledger?
        // generateLedger returns ledger array with year snapshots.
        // The snapshot doesn't explicitly show "Roth Balance" breakdown usually,
        // just "netWorth" or "totalBalance".
        // Wait, ledgerLogic.js structure:
        // ledger.push({ ..., netWorth, totalBalance })
        // It DOES NOT return account-level balances in the ledger output array in current implementation!

        // CRITICAL GAP: The ledger output doesn't expose granular balances for verification!
        // I need to update ledgerLogic.js to return detailed balances in the ledger array if I want to verify them.

        // Ideally, I should verify "Calculated Tax > 0" despite 0 RMD/Salary?
        // Or "Net Worth" continuity.

        // Let's assume for this test, checks are limited to what's exposed.
        // If I can't see separate Roth balance, I can't verify conversion explicitly without seeing tax bill increase.

        expect(year1.taxes.totalTax).toBeGreaterThan(0);
        expect(year1.balances.roth).toBeGreaterThan(0); // Explicit check for conversion content
    });

    it('should handle extreme market crash without NaN', () => {
        const input = JSON.parse(JSON.stringify(defaultProfile));
        input.stressTest = {
            marketDrop: 90, // 90% drop
            inflationIncrease: 0
        };

        const ledger = generateLedger(input);

        expect(ledger.length).toBeGreaterThan(0);
        // Check for NaN
        const hasNaN = ledger.some(y => Number.isNaN(y.netWorth) || Number.isNaN(y.taxes.totalTax));
        expect(hasNaN).toBe(false);
    });

    it('should handle zero expenses gracefully', () => {
        const input = JSON.parse(JSON.stringify(defaultProfile));
        input.expenses.essential = 0;
        input.expenses.discretionary = 0;
        input.expenses.baseMonthly = 0;

        const ledger = generateLedger(input);
        expect(ledger).toBeDefined();
        // Should accumulate wealth
        expect(ledger[ledger.length - 1].netWorth).toBeGreaterThan(ledger[0].netWorth);
    });

});
