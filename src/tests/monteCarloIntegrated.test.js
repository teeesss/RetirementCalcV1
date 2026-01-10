import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

// Simulated Worker logic for integration testing
// This version is more rigorous and matches the worker's transformation logic
function runMonteCarloIntegrated(planData, iterations = 100) {
  const ledger = generateLedger(planData);
  if (!ledger || ledger.length === 0) throw new Error('Ledger generation failed');

  const startAgeNum = ledger[0].age;
  const endAgeNum = Math.max(
    ledger[ledger.length - 1].age || planData.people[0].lifeExpectancy || 90,
    planData.people[1]?.lifeExpectancy || 0
  );
  const years = endAgeNum - startAgeNum + 1;

  const initialBalances = ledger[0].balances;
  const initialB = ledger[0].totalBalance || 0;

  const successFlags = [];
  const finalBalances = [];

  for (let iter = 0; iter < iterations; iter++) {
    let currentBalances = { ...initialBalances };
    let trialSuccess = true;

    for (let y = 0; y < years; y++) {
      const baseYearData = ledger[Math.min(y, ledger.length - 1)];

      // Returns (Fixed for validation consistency)
      const eqRet = 0.07;
      const crRet = 0.1;

      const annualSpending =
        (baseYearData.expenses?.total || 0) + (baseYearData.expenses?.taxes || 0);
      const totalIncome = (baseYearData.income?.salary || 0) + (baseYearData.income?.ss || 0);
      const netCashFlow = totalIncome - annualSpending;

      if (netCashFlow < 0) {
        const withdrawalNeeded = Math.abs(netCashFlow);
        const totalAssets = Object.keys(currentBalances)
          .filter((k) => typeof currentBalances[k] === 'number')
          .reduce((sum, k) => sum + currentBalances[k], 0);

        if (totalAssets > 0) {
          Object.keys(currentBalances).forEach((k) => {
            if (typeof currentBalances[k] === 'number') {
              const ratio = currentBalances[k] / totalAssets;
              currentBalances[k] = Math.max(0, currentBalances[k] - withdrawalNeeded * ratio);
            }
          });
        }
      } else {
        currentBalances.brokerage = (currentBalances.brokerage || 0) + netCashFlow;
      }

      // Apply Returns
      const equityKeys = [
        'traditionalClient',
        'traditionalSpouse',
        'rothClient',
        'rothSpouse',
        'brokerage',
        'hsaClient',
        'hsaSpouse',
      ];
      equityKeys.forEach((key) => {
        if (currentBalances[key]) currentBalances[key] *= 1 + eqRet;
      });
      if (currentBalances.crypto) currentBalances.crypto *= 1 + crRet;
      if (currentBalances.cash) currentBalances.cash *= 1.04;

      let total = Object.keys(currentBalances)
        .filter((k) => typeof currentBalances[k] === 'number')
        .reduce((sum, k) => sum + currentBalances[k], 0);

      if (total <= 0) {
        trialSuccess = false;
        break;
      }
    }
    successFlags.push(trialSuccess);

    // Final Balance Calc
    let finalBack = Object.keys(currentBalances)
      .filter((k) => typeof currentBalances[k] === 'number')
      .reduce((sum, k) => sum + currentBalances[k], 0);
    finalBalances.push(finalBack);
  }

  return {
    successRate: successFlags.filter((s) => s).length / iterations,
    meanFinalBalance: finalBalances.reduce((a, b) => a + b, 0) / iterations,
    initialBalance: initialB,
  };
}

describe('Monte Carlo Integration Tests', () => {
  it('should calculate success rate for Ray profile correctly', () => {
    const results = runMonteCarloIntegrated(defaultProfile, 1); // 1 iter for speed
    expect(results.successRate).toBe(1); // Ray's profile is very successful
    expect(results.initialBalance).toBeGreaterThan(3000000);
    expect(results.meanFinalBalance).toBeGreaterThan(results.initialBalance);
    console.log('Integrated MC Result:', results);
  });

  it('should fail for a blank profile with high spending', () => {
    const modifiedProfile = JSON.parse(JSON.stringify(defaultProfile));
    modifiedProfile.assets.traditional.client = 100000;
    modifiedProfile.expenses.essentialMonthly = 20000; // $240k/yr

    const results = runMonteCarloIntegrated(modifiedProfile, 1);
    expect(results.successRate).toBe(0); // Should go bust
    console.log('Integrated MC (Failure Case) Result:', results);
  });
});
