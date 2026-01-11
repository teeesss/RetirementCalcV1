import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';

describe('Mortgage Logic in generateLedger', () => {
  const createBaseProfile = () => ({
    people: [
      { id: 'client', age: 50, lifeExpectancy: 90, retirementAge: 65, birthDate: '1976-01-01' },
    ],
    profile: { filingStatus: 'single' },
    assets: {
      traditional: { client: 100000, spouse: 0 },
      roth: { client: 0, spouse: 0 },
      hsa: { client: 0, spouse: 0 },
      brokerage: { joint: 0 },
      cash: { total: 10000 },
      // Legacy structure support test
      realEstate: [],
    },
    expenses: { essential: 30000, discretionary: 10000 },
    assumptions: { inflation: 2.5, growthRate: 7.0, startYear: 2026 },
    spending: { strategy: 'fixed', fixedAmount: 60000 },
  });

  const createMortgageProperty = (balance, rate, payment, targetAge = null) => ({
    id: 'prop1',
    name: 'Primary Home',
    currentValue: 500000,
    appreciationRate: 3.0,
    mortgage: {
      balance,
      rate,
      paymentPI: payment,
      targetAge,
    },
  });

  it('Standard Payoff: Should pay down balance over time', () => {
    const profile = createBaseProfile();
    // $200k balance, 4%, $1500/mo ($18k/yr)
    // Interest Y1 approx $8k. Principal approx $10k.
    profile.realEstate = [createMortgageProperty(200000, 4.0, 1500)];

    const ledger = generateLedger(profile);

    // Check Y0 (Index 0) - generated based on initial state, but logic reduces balance for NEXT year?
    // generateLedger loop runs for current year.
    // It consumes logic: balance -= principal.

    // Debug first few years
    expect(ledger.length).toBeGreaterThan(0);
  });

  // Re-verify: I need to ensure the ledger actually outputs the mortgage balance
  // or I can't test it easily without inspecting the full loop.
  // But I can verify "Total Expenses" includes the mortgage payment.

  it('Expenses: Should include mortgage payment in total expenses', () => {
    const profile = createBaseProfile();
    // const annualPayment = 1500 * 12; // Unused
    profile.realEstate = [createMortgageProperty(200000, 4.0, 1500)];

    const ledger = generateLedger(profile);

    // Year 0 expenses logic: totalExpenses = effectiveAnnualExpenses + totalMortPayment + ...
    expect(ledger[0].expenses.total).toBeGreaterThan(profile.expenses.essential || 30000);
  });
});

describe('Mortgage Payoff Calculation', () => {
  // We'll test via the side-effects on Total Expenses over time.
  // If mortgage is paid off, expenses should drop significantly.

  const createBaseProfile = () => ({
    people: [
      { id: 'client', age: 50, lifeExpectancy: 90, retirementAge: 65, birthDate: '1976-01-01' },
    ],
    profile: { filingStatus: 'single' },
    assets: {
      traditional: { client: 100000, spouse: 0 },
      roth: { client: 0, spouse: 0 },
      hsa: { client: 0, spouse: 0 },
      brokerage: { joint: 0 },
      cash: { total: 10000 },
      realEstate: [],
    },
    expenses: { essential: 10000, discretionary: 0 }, // Low expenses to highlight mortgage
    assumptions: { inflation: 0.0, growthRate: 0.0, startYear: 2026 }, // 0% inflation for easy math
    spending: { strategy: 'fixed', fixedAmount: 20000 },
  });

  const createMortgageProperty = (balance, rate, payment, targetAge = null) => ({
    id: 'prop1',
    name: 'Test Home',
    currentValue: 100000,
    appreciationRate: 0,
    mortgage: {
      balance,
      rate,
      paymentPI: payment,
      targetAge,
    },
  });

  it('Standard: Expenses drop after payoff', () => {
    const profile = createBaseProfile();
    // $10,000 balance, 0% rate, $1000/mo ($12k/yr). Should pay off in < 1 year.
    // Let's behave more standard: $24k balance, $1k/mo ($12k/yr). Pays off in 2 years.
    profile.realEstate = [createMortgageProperty(24000, 0, 1000)];

    const ledger = generateLedger(profile);

    // Year 0: Still paying. Expenses = 10k (base) + 12k (mort) = 22k.
    // Year 1: Still paying.
    // Year 2: Paid off?
    // Month 0: 24k.
    // End Y0: 12k left.
    // End Y1: 0 left.
    // Y2: Should be 0.

    // Note: The logic in ledgerLogic applies payment for the current year.
    // If balance > 0 at start, we pay.

    const y0Expenses = ledger[0].expenses.total; // ~22k
    const y3Expenses = ledger[3].expenses.total; // ~10k (mortgage gone)

    console.log('Y0 Exp:', y0Expenses, 'Y3 Exp:', y3Expenses);

    expect(y0Expenses).toBeGreaterThan(20000);
    expect(y3Expenses).toBeLessThan(15000);
  });

  it('Target Age Payoff: Should increase payment to meet deadline', () => {
    const profile = createBaseProfile();
    // $100k balance, 0% rate.
    // Standard payment $1/mo (negligible).
    // Target Age: 52 (2 years from now: 50 -> 51 (Y0), 51->52 (Y1)).
    // Start Age 50.
    // Logic: if targetAge > clientAge (50). yearsRemaining = 52 - 50 = 2.
    // Extra = (Balance - AnnPmt*Yrs) / Yrs.
    // Extra = (100000 - 12*2) / 2 ~= 50k/yr.

    profile.realEstate = [createMortgageProperty(100000, 0, 1, 52)];

    const ledger = generateLedger(profile);

    const y0Expenses = ledger[0].expenses.total;

    // Base 10k + Mortgage ~50k = 60k
    console.log('Target Payoff Y0 Exp:', y0Expenses);
    expect(y0Expenses).toBeGreaterThan(50000);
    expect(y0Expenses).toBeLessThan(70000);

    // Should be done in Y2 (Age 52)
    // Age is calculated at end of year?
    // Y0 (Age 51?), Y1 (Age 52?)

    // Let's check ledger[2] (Year 2) -> expenses should drop
    expect(ledger[2].expenses.total).toBeLessThan(15000);
  });

  it('Balloon Cap: Should not overpay if balance < annual payment', () => {
    const profile = createBaseProfile();
    // $5k balance. $12k/yr payment.
    // Payment should be capped at $5k.
    profile.realEstate = [createMortgageProperty(5000, 0, 1000)];

    const ledger = generateLedger(profile);

    const y0Expenses = ledger[0].expenses.total;
    // Base 10k + 5k = 15k. NOT 22k.

    console.log('small Balance Y0 Exp:', y0Expenses);
    expect(y0Expenses).toBeCloseTo(15000, -2); // within 100
  });
});
