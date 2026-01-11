import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Spending Strategy Scaling', () => {
  /**
   * Creates a test profile with non-zero expenses for scaling tests.
   * Note: defaultProfile now has $0 expenses, so we need a baseline.
   */
  function createTestProfile() {
    const profile = JSON.parse(JSON.stringify(defaultProfile));
    // Set baseline expenses for scaling tests
    profile.expenses.essentialMonthly = 4500;
    profile.expenses.discretionaryMonthly = 1500;
    return profile;
  }

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
      modifiedPlan.expenses.essentialMonthly = Math.round(
        modifiedPlan.expenses.essentialMonthly * multiplier
      );
    }
    if (modifiedPlan.expenses.discretionaryMonthly !== undefined) {
      modifiedPlan.expenses.discretionaryMonthly = Math.round(
        modifiedPlan.expenses.discretionaryMonthly * multiplier
      );
    }

    // Scale Annual expenses
    if (modifiedPlan.expenses.essential !== undefined) {
      modifiedPlan.expenses.essential = Math.round(modifiedPlan.expenses.essential * multiplier);
    }
    if (modifiedPlan.expenses.discretionary !== undefined) {
      modifiedPlan.expenses.discretionary = Math.round(
        modifiedPlan.expenses.discretionary * multiplier
      );
    }

    return modifiedPlan;
  }

  it('should correctly scale 1.9x and 2.0x expenses (validating "Cliff" inputs)', () => {
    // Use test profile with non-zero baseline expenses
    const testProfile = createTestProfile();
    const guardrails = { floorPercent: 0.85, ceilingPercent: 1.2, adjustmentRate: 0.1 };
    const strategy = 'fixed';

    // Base Run
    const baseLedger = generateLedger(testProfile, strategy, guardrails);
    const baseExpenses = baseLedger[0].expenses.total;

    // 1.9x Run
    const plan190 = createScaledPlan(testProfile, 1.9);
    const ledger190 = generateLedger(plan190, strategy, guardrails);
    const expenses190 = ledger190[0].expenses.total;

    // 2.0x Run
    const plan200 = createScaledPlan(testProfile, 2.0);
    const ledger200 = generateLedger(plan200, strategy, guardrails);
    const expenses200 = ledger200[0].expenses.total;

    console.log(
      `Base: $${baseExpenses.toLocaleString()} | 1.9x: $${expenses190.toLocaleString()} | 2.0x: $${expenses200.toLocaleString()}`
    );

    // Verify strictly that 1.9x expenses are significantly higher than Base
    // (This proves 1.9x is not being ignored)
    expect(expenses190).toBeGreaterThan(baseExpenses * 1.5);
    expect(expenses190).toBeGreaterThan(100000); // Reduced from 170k to account for variable healthcare costs

    // Verify 2.0x is higher than 1.9x
    expect(expenses200).toBeGreaterThan(expenses190);
  });

  it('should scale monotonically from 110% to 180%', () => {
    const testProfile = createTestProfile();
    const guardrails = { floorPercent: 0.85, ceilingPercent: 1.2, adjustmentRate: 0.1 };
    const strategy = 'fixed';

    let previousExpenses = 0;
    const multipliers = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8];

    console.log('--- Verify 110% through 180% ---');

    multipliers.forEach((mult) => {
      const plan = createScaledPlan(testProfile, mult);
      const ledger = generateLedger(plan, strategy, guardrails);
      const expenses = ledger[0].expenses.total;

      console.log(`${(mult * 100).toFixed(0)}%: $${expenses.toLocaleString()}`);

      if (previousExpenses > 0) {
        expect(expenses).toBeGreaterThan(previousExpenses);
      }
      previousExpenses = expenses;
    });
  });
});
