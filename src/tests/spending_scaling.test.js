
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Spending Strategy Scaling', () => {

    /**
     * Replicates the exact logic used in App.jsx (handleSpendingSimulation)
     * to scale expenses by a multiplier.
     */
    function createScaledPlan(basePlan, multiplier) {
        const modifiedPlan = JSON.parse(JSON.stringify(basePlan));

        // Ensure expenses object exists
        if (!modifiedPlan.expenses) modifiedPlan.expenses = {};

        // Scale Monthly expenses
        if (modifiedPlan.expenses.essentialMonthly !== undefined) {
            modifiedPlan.expenses.essentialMonthly = Math.round(modifiedPlan.expenses.essentialMonthly * multiplier);
        }
        if (modifiedPlan.expenses.discretionaryMonthly !== undefined) {
            modifiedPlan.expenses.discretionaryMonthly = Math.round(modifiedPlan.expenses.discretionaryMonthly * multiplier);
        }

        // Scale Annual expenses
        if (modifiedPlan.expenses.essential !== undefined) {
            modifiedPlan.expenses.essential = Math.round(modifiedPlan.expenses.essential * multiplier);
        }
        if (modifiedPlan.expenses.discretionary !== undefined) {
            modifiedPlan.expenses.discretionary = Math.round(modifiedPlan.expenses.discretionary * multiplier);
        }

        return modifiedPlan;
    }

    it('should correctly scale 1.9x and 2.0x expenses (validating "Cliff" inputs)', () => {
        // Defaults from PlanContext
        const guardrails = { floorPercent: 0.85, ceilingPercent: 1.20, adjustmentRate: 0.10 };
        const strategy = 'fixed';

        // Base Run
        const baseLedger = generateLedger(defaultProfile, strategy, guardrails);
        const baseExpenses = baseLedger[0].expenses.total;

        // 1.9x Run
        const plan190 = createScaledPlan(defaultProfile, 1.9);
        const ledger190 = generateLedger(plan190, strategy, guardrails);
        const expenses190 = ledger190[0].expenses.total;

        // 2.0x Run
        const plan200 = createScaledPlan(defaultProfile, 2.0);
        const ledger200 = generateLedger(plan200, strategy, guardrails);
        const expenses200 = ledger200[0].expenses.total;

        console.log(`Base: $${baseExpenses.toLocaleString()} | 1.9x: $${expenses190.toLocaleString()} | 2.0x: $${expenses200.toLocaleString()}`);

        // Verify strictly that 1.9x expenses are significantly higher than Base
        // (This proves 1.9x is not being ignored)
        expect(expenses190).toBeGreaterThan(baseExpenses * 1.5);
        expect(expenses190).toBeGreaterThan(170000); // Specific check based on $180k expectation

        // Verify 2.0x is higher than 1.9x
        expect(expenses200).toBeGreaterThan(expenses190);
    });
});
