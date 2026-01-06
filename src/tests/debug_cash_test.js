
import { optimizeWithdrawals } from '../lib/withdrawalOptimizer.js';

const balances = {
    traditional: 10000,
    roth: 10000,
    brokerage: 10000,
    crypto: 0,
    hsa: 0,
    cash: 10000
};

// Gap 12k.
// Expected: Cash 10k. Brokerage 2k.
// Remaining balances: Cash 0. Brok 8k. Trad 10k. Roth 10k.

console.log("Running Cash Priority Debug with:", balances);

const result = optimizeWithdrawals({
    age: 50,
    gap: 12000,
    balances: balances,
    filingStatus: 'single',
    ordinaryIncome: 0,
    ssBenefits: 0,
    strategy: { order: 'optimal' }
});

console.log("Withdrawals:", result.withdrawals);
console.log("Result Balances:", result.balances);
console.log("Remaining Gap:", result.remainingGap);
