
import { optimizeWithdrawals } from '../lib/withdrawalOptimizer.js';

// const balances = {
//     traditional: 1000000,
//     roth: 200000,
//     brokerage: 0,
//     crypto: 0,
//     hsa: 0,
//     cash: 25000 // Test case has 25k cash
// };

// Test case matches Integration Test "Tax Brackets"
// But "Tax Brackets" set explicit assets: traditional 1M. Default cash?
// createMockPlan default cash is 25000.
// But test overrides: assets: { traditional: { client: 1000000 } }
// Does override MERGE or REPLACE?
// createMockPlan implementation:
// assets: { ...defaults, ...overrides.assets }?
// Let's check integration.test.js Step 1810 Line 59: `...overrides`.
// Line 26: `assets: { ... }`.
// If I pass `assets: { traditional: ... }`, it REPLACES the `assets` object entirely?
// No, usually `createMockPlan` had deep merge?
// Line 22: `createMockPlan = (overrides = {}) => ({ ...defaults, ...overrides })`.
// So `overrides.assets` REPLACES `defaults.assets`.
// So if I passed `assets: { traditional: ... }`, then `cash` is UNDEFINED (or missing)?
// If `cash` is missing, `ledgerLogic` might default to 0?
// `ledgerLogic` Line 133: `cash: assets.cash?.total || 0`.
// So Cash is 0.
// Brokerage is 0.
// Roth is 0.
// Only Traditional is 1M.

const testBalances = {
    traditional: 1000000,
    roth: 0,
    brokerage: 0,
    crypto: 0,
    hsa: 0,
    cash: 0
};

console.log("Running optimization with balances:", testBalances);

const result = optimizeWithdrawals({
    age: 50,
    gap: 120000, // Essential 10k/mo * 12
    balances: testBalances,
    filingStatus: 'single',
    ordinaryIncome: 0,
    ssBenefits: 0,
    strategy: { order: 'optimal' }
});

console.log("Withdrawals:", result.withdrawals);
console.log("Full Taxes Object:", JSON.stringify(result.taxes, null, 2));
console.log("Taxable Income:", result.taxes.taxableIncome);

console.log("Total Tax:", result.taxes.totalTax);
console.log("Remaining Gap:", result.remainingGap);
