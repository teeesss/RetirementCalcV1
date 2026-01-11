import { describe, test, expect } from 'vitest';
import { generateLedger } from '../../lib/ledgerLogic';
import defaultProfile from '../../data/defaultProfile.json';

// AUDIT: US-002 Contribution Limits
// Source: IRS Notice 2023-75 (2024 Limits), IRS Notice 2024-80 (2025 Limits)
// 2025: 401k $23,500 | Catch-up $7,500 (Total $31,000)
// 2025: IRA $7,000 | Catch-up $1,000 (Total $8,000)

describe('Tax Audit: Contribution Limits (2025)', () => {
  const baseData = {
    ...defaultProfile,
    people: [{ ...defaultProfile.people[0], age: 40, birthDate: null }], // Force Age 40 (Young, no catch-up). Start Year 2026.
    contributions: {
      traditional: 100, // Attempt max %
      roth: 100000, // Attempt huge fixed amount
      afterTax401k: 0,
      hsa: 100000, // Attempt huge fixed amount
    },
    salary: 200000,
  };

  test('Enforces 2025 401(k) Employee Limit ($23,500)', () => {
    // We implicitly test this via the ledger generation for Year 1.
    // generateLedger loop logic starts at current year.

    // Use Zero Growth to be safe, but now we can inspect cashFlow directly.
    const zeroGrowthData = {
      ...baseData,
      assets: { ...baseData.assets, traditional: { client: 0, spouse: 0 }, roth: { client: 0 } },
      expenses: { ...baseData.expenses, essential: 0, discretionary: 0 },
      assumptions: { inflation: 0, preRetirementReturn: 0, retirementReturn: 0 },
    };

    const ledgerZero = generateLedger(zeroGrowthData);

    // We expect the *contribution* to be exactly the limit.
    // LedgerLogic records contributions in trackedCashFlow.
    // However, verify if 'cashFlow' property is exposed in the final ledger object.
    // Usually ledger.push({ ... balances, cashFlow: { byAccount: trackedCashFlow } ... })

    // CORRECTION: Ledger structure is cashFlow.byAccount.traditionalClient
    const contribution = ledgerZero[0].cashFlow?.byAccount?.traditionalClient || 0;

    // 2025 Limit is 23,500. Code should now use TAX_DATA.limits['401k'].
    expect(contribution).toBe(23500);
  });

  test('Enforces 2025 IRA Limit ($7,000)', () => {
    const zeroGrowthData = {
      ...baseData,
      assets: { ...baseData.assets, traditional: { client: 0 }, roth: { client: 0 } },
      assumptions: { inflation: 0, preRetirementReturn: 0 },
      contributions: { roth: 100000 }, // Try over-contribute
    };

    const ledger = generateLedger(zeroGrowthData);
    const contribution = ledger[0].cashFlow?.byAccount?.rothClient || 0;

    // 2025 Limit is 7,000.
    expect(contribution).toBe(7000);
  });

  test('Enforces 50+ Catch-up Logic (Total $31,000 for 401k)', () => {
    const oldData = {
      ...baseData,
      people: [{ ...baseData.people[0], age: 55, birthDate: null, retirementAge: 70 }],
      contributions: { traditional: 100 },
    };
    oldData.assets = { ...baseData.assets, traditional: { client: 0, spouse: 0 } };
    oldData.assumptions = { inflation: 0, preRetirementReturn: 0 };
    oldData.expenses = { baseMonthly: 0, essential: 0 };

    const ledger = generateLedger(oldData);

    // DEBUG:
    console.log('DEBUG Test 3 - Age:', ledger[0].age);
    console.log('DEBUG Test 3 - isRetired:', ledger[0].isRetired);
    console.log('DEBUG Test 3 - CashFlow:', JSON.stringify(ledger[0].cashFlow));

    const contribution = ledger[0].cashFlow?.byAccount?.traditionalClient || 0;

    // 2025: 23500 + 7500 = 31000.
    expect(contribution).toBe(31000);
  });
});
