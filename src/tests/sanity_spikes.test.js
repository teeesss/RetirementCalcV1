import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Expense Spike Detection', () => {
  it('should not have unexplained massive expense spikes', () => {
    // 1. Setup specific profile that mimics the user's data
    const profile = JSON.parse(JSON.stringify(defaultProfile));
    profile.expenses.essentialMonthly = 6500; // $78k/yr
    profile.expenses.discretionaryMonthly = 0;

    // Ensure no hidden defaults
    profile.expenses.oneTime = [];
    profile.goals = [];

    // 2. Run Ledger
    const guardrails = { floorPercent: 0.85, ceilingPercent: 1.2, adjustmentRate: 0.1 };
    const ledger = generateLedger(profile, 'fixed', guardrails);

    // 3. Scan for anomalies
    let previousExpense = 0;
    let maxExpense = 0;

    ledger.forEach((year) => {
      const expense = year.expenses.total;

      if (expense > maxExpense) maxExpense = expense;

      // Spike Check: > 3x previous year AND > $100k difference
      if (year.age > profile.people[0].currentAge + 1) {
        // Skip first year transition
        const isSpike =
          previousExpense > 0 &&
          expense > previousExpense * 3 &&
          expense > previousExpense + 100000;
        if (isSpike) {
          console.log(
            `ANOMALY: Expense Value ${expense} at age ${year.age} vs prev ${previousExpense}`
          );
        }
        expect(isSpike, `Massive unexplained expense spike at age ${year.age}`).toBe(false);
      }

      // Absolute Cap Check: > $2M (unless specifically high net worth)
      expect(expense, `Expenses exceeded $2M at age ${year.age}`).toBeLessThan(2000000);

      previousExpense = expense;
    });

    console.log(`Max Expense Found: $${maxExpense.toLocaleString()}`);
  });
});
