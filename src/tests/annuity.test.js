import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import DEFAULT_PROFILE from '../data/defaultProfile.json';

describe('Annuity Logic', () => {
  const baseProfile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  // Ensure sufficient assets
  baseProfile.assets.cash.total = 100000;
  // Fix: Ledger uses birthDate for age calc, so we must sync it.
  const currentYear = new Date().getFullYear();
  baseProfile.people[0].birthDate = `${currentYear - 60}-01-01`; // Age 60
  baseProfile.people[0].retirementAge = 65;

  it('calculates fixed annuity income starting at startAge', () => {
    const profile = JSON.parse(JSON.stringify(baseProfile));
    profile.annuities = [
      {
        name: 'Fixed',
        monthlyPayout: 1000,
        startAge: 65,
        inflationAdjusted: false,
      },
    ];

    const ledger = generateLedger(profile);

    // Debug
    const yr64 = ledger.find((y) => y.age === 64);
    const yr65 = ledger.find((y) => y.age === 65);
    console.log('Age 64 Income:', yr64?.income);
    console.log('Age 65 Income:', yr65?.income);
    console.log('Annuities Config:', profile.annuities);

    const preRetirement = ledger.find((y) => y.age === 64);
    const atRetirement = ledger.find((y) => y.age === 65);

    // Pre-retirement: Should be 0 annuity income
    expect(preRetirement.metrics.detailedCashFlow.inflows.annuity).toBe(0);

    // At retirement: $12,000/yr
    expect(atRetirement.metrics.detailedCashFlow.inflows.annuity).toBe(12000);

    // Check year 70 (still 12000)
    const year70 = ledger.find((y) => y.age === 70);
    expect(year70.metrics.detailedCashFlow.inflows.annuity).toBe(12000);
  });

  it('calculates inflation-adjusted annuity income', () => {
    const profile = JSON.parse(JSON.stringify(baseProfile));
    profile.assumptions.inflation = 3; // 3% inflation
    profile.annuities = [
      {
        name: 'COLA',
        monthlyPayout: 1000,
        startAge: 65,
        inflationAdjusted: true,
      },
    ];

    const ledger = generateLedger(profile);
    const atRetirement = ledger.find((y) => y.age === 65);
    const year66 = ledger.find((y) => y.age === 66);

    // Year 0 of payout (Age 65): Base amount $12,000
    expect(atRetirement.metrics.detailedCashFlow.inflows.annuity).toBe(12000); // 12000 * 1.03^0

    // Year 1 of payout (Age 66): $12,000 * 1.03 = 12,360
    expect(year66.metrics.detailedCashFlow.inflows.annuity).toBeCloseTo(12360, 0); // Allow small float drift
  });

  it('deducts purchase cost from assets in purchase year', () => {
    const profile = JSON.parse(JSON.stringify(baseProfile));
    const purchaseYear = new Date().getFullYear() + 2; // 2 years from now
    const cost = 50000;

    profile.annuities = [
      {
        name: 'Future Purchase',
        monthlyPayout: 500,
        startAge: 70,
        purchaseYear: purchaseYear,
        purchaseAmount: cost,
      },
    ];

    // Mock Assets clearly
    profile.assets.cash.total = 100000;
    profile.assets.brokerage.joint = 0;
    profile.assets.traditional = { client: 0, spouse: 0 };
    profile.assets.roth = { client: 0, spouse: 0 };
    profile.assets.hsa = { client: 0, spouse: 0 };
    profile.assets.crypto = {
      btc: { quantity: 0, price: 0 },
      eth: { quantity: 0, price: 0 },
      sol: { quantity: 0, price: 0 },
    };
    profile.assets.realEstate = [];
    profile.realEstate = [];

    // const ledger = generateLedger(profile); // Unused

    // Find Ledger Year corresponding to purchase
    // generateLedger starts at current year
    // const year0 = ledger[0]; // Current Year
    // const year2 = ledger[2]; // Purchase Year

    // Year 2 Balance should be significantly lower than Year 1 + Growth - Expenses
    // Hard to test exact dollar due to expenses/growth noise.
    // Best way: Check console log or isolated math?
    // Let's create a profile with 0 expenses and 0 growth to isolate the drop.
    profile.expenses.essential = 0;
    profile.expenses.discretionary = 0;
    profile.assumptions.growthRate = 0;
    profile.assumptions.inflation = 0;
    profile.assumptions.cashReturn = 0;
    // Zero out income to isolate cost deduction
    profile.salary = 0;
    profile.socialSecurity = { primary: { annualAmount: 0 }, spouse: { annualAmount: 0 } };
    profile.pension = 0;
    profile.income = { pension: 0 };

    const cleanLedger = generateLedger(profile);
    const ly1 = cleanLedger[1];
    const ly2 = cleanLedger[2]; // Purchase happens here

    // ly1 Balance: Should be ~100k
    // ly2 Balance: Should be ~50k

    expect(ly1.totalBalance).toBeGreaterThan(90000);
    expect(ly2.totalBalance).toBeLessThan(55000);
    expect(ly2.totalBalance).toBeCloseTo(ly1.totalBalance - cost, -3); // Within 1000 drift
  });

  it('calculates partial year income for annuity starting mid-year', () => {
    const profile = JSON.parse(JSON.stringify(baseProfile));
    // Client born Jan 1st.
    // Start Age 65.5 -> Starts in July.
    // Expect 6 months of income in first year.

    profile.annuities = [
      {
        name: 'Partial Year',
        monthlyPayout: 1000,
        startAge: 65.5, // 65 years and 6 months
        inflationAdjusted: false,
      },
    ];

    const ledger = generateLedger(profile);

    // Age 65 is the year they turn 65.
    // If born Jan 1, turn 65 on Jan 1.
    // 65.5 is July 1.
    // So in the year they turn 65, they get July-Dec (6 months).

    const yr65 = ledger.find((y) => y.age === 65);

    // 1000 * 6 = 6000
    expect(yr65.metrics.detailedCashFlow.inflows.annuity).toBe(6000);

    // Next year (Age 66) should be full 12000
    const yr66 = ledger.find((y) => y.age === 66);
    expect(yr66.metrics.detailedCashFlow.inflows.annuity).toBe(12000);
  });
});
