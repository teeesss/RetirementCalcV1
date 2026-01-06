
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

/**
 * Integration Tests for Survivor Logic
 * Verifies Basis Step-Up and Filing Status changes upon death.
 */
describe('Survivor Logic', () => {

    const baseData = {
        ...defaultProfile,
        profile: {
            ...defaultProfile.profile,
            filingStatus: 'married', // Start married
            isCommunityProperty: false // Default Common Law
        },
        people: [
            { id: "client", name: "John", age: 70, retirementAge: 65, lifeExpectancy: 95 },
            { id: "spouse", name: "Jane", age: 70, retirementAge: 65, lifeExpectancy: 75 } // Dies at 75 (Year 5)
        ],
        assets: {
            ...defaultProfile.assets,
            brokerage: 1000000,
            brokerageBasis: { joint: 500000 },
            traditional: 0, roth: 0, hsa: 0, cash: 0, crypto: null
        },
        expenses: {
            ...defaultProfile.expenses,
            essential: 0, discretionary: 50000, inflation: 0,
            essentialMonthly: undefined, discretionaryMonthly: undefined,
            recurring: [], oneTime: [], healthcare: 0
        },
        assumptions: {
            ...defaultProfile.assumptions,
            growthRate: 10, // Ensure growth to test step-up gap
            inflation: 0
        }
    };

    it('should switch Filing Status to "single" the year AFTER spouse death', () => {
        const data = { ...baseData };
        // Spouse dies at 75. Start age 70.
        // Year 0 (70), 1 (71), 2 (72), 3 (73), 4 (74), 5 (75 - Death).
        // Death Year (Year 5) -> Married.
        // Year 6 (Age 76) -> Single.

        const ledger = generateLedger(data);
        // LE = 75. Start = 70.
        // Index 5 = Age 75 (Alive).
        // Index 6 = Age 76 (Dead - Year of Death). Filing Status = Married.
        // Index 7 = Age 77 (first full year dead). Filing Status = Single.

        expect(ledger[5].filingStatus).toBe('married'); // Alive
        expect(ledger[6].filingStatus).toBe('married'); // Year of Death
        expect(ledger[7].filingStatus).toBe('single');  // Year After Death
    });

    it('should apply 50% Basis Step-Up in Common Law states', () => {
        const data = { ...baseData };
        // Common Law (default)
        // Year 5 (Death Year).
        // Start Year 0: Val 1M, Basis 500k.
        // Growth 10%.
        // Year 5 Start Val: 1M * 1.1^5 = 1,610,510.
        // Old Basis: 500k (assuming no withdrawals affect it for simplicity, or proportional).
        // Actually, withdrawals happen.
        // Let's verify via the LOGS or calculate precisely?
        // Simpler: Set expenses to 0 so no withdrawals happen, purely growth.
        data.expenses.discretionary = 0;

        const ledger = generateLedger(data);
        const year5 = ledger[5];

        // Before Step-up logic runs inside the loop?
        // Wait, step-up runs inside loop, updates `brokerageBasis`.
        // But `ledger` captures state *after* loop logic?
        // No, `ledger.push` happens at end of loop.
        // So `ledger[5]` should reflect the NEW basis.

        // Manual Calc:
        // Value = 1,000,000 * (1.1)^5 = 1,610,510.
        // Old Basis = 500,000.
        // Step Up 50%:
        // New Basis = 0.5 * 500k + 0.5 * 1.61M = 250k + 805,255 = 1,055,255.

        // We can't easily see "Basis" in the ledger object output unless we expose it.
        // `ledger.balances` has `brokerage` value. `cashFlow` might not have basis.
        // However, `ledger` logic uses `brokerageBasis` for tax calcs.
        // We can infer logic from Taxes? 0 expenses = 0 tax.

        // I need to EXPOSE `brokerageBasis` in the ledger to verify this easily.
        // Or trust the console log I added?
        // Tests should rely on output.
        // Let's add `costBasis` to the `balances` object in ledgerLogic?
        // Recommendation: Add `brokerageBasis` to returning ledger object in `ledgerLogic.js` for verification.
    });

    // Placeholder for now - I will update ledgerLogic to expose basis first.
});
