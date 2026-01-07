
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Mortgage Strategy Logic', () => {

    it('should amortize a standard mortgage correctly to zero', () => {
        // Setup: $100,000 mortgage at 5% over 10 years (simplified)
        // Monthly P&I for $100k, 5%, 10yr is ~$1060.66
        const monthlyPayment = 1060.66;

        const profile = JSON.parse(JSON.stringify(defaultProfile));
        profile.people[0].age = 50;

        // Ensure Real Estate setup (ledgerLogic loops over currentRealEstate)
        // Note: ledgerLogic copies profile data into internal state
        profile.realEstate = [{
            id: 'home',
            currentValue: 500000,
            appreciationRate: 0,
            mortgage: {
                balance: 100000,
                paymentPI: monthlyPayment,
                rate: 5.0,
                targetAge: null // Standard amortization
            }
        }];

        // Remove other logic noise
        profile.assets.brokerage.joint = 1000000;

        // Run Ledger
        const ledger = generateLedger(profile);

        // Check balance at Year 0 (Start)
        // Actually ledgerLogic updates balance *during* the year loop.
        // So ledger[0].assets.realEstate[0].mortgageBalance is the END of Year 0 balance.

        let prevBalance = 100000;

        // Expect payoff in roughly 10 years
        for (let i = 0; i < 11; i++) {
            const year = ledger[i];
            const balance = year.balances.mortgageBalance;
            console.log(`Year ${i}: Balance $${balance.toFixed(2)} (Payment: $${(monthlyPayment * 12).toFixed(2)})`);

            if (i < 10) {
                expect(balance).toBeLessThan(prevBalance);
                // In year 10 it might be 0 if paid off early in year
            }

            if (i === 10) {
                // Should be zero or very close
                expect(balance).toBe(0);
            }
            prevBalance = balance;
        }
    });

    it('should accelerate payoff when Target Age is set', () => {
        // Setup: $100,000 mortgage, standard 30yr payment, but Target Age 55 (5 years)
        // Standard 30yr 4% payment on $100k is ~$477.
        // Target 5 years requires ~$1841/mo.

        const standardPayment = 477.42;
        const profile = JSON.parse(JSON.stringify(defaultProfile));
        profile.people[0].age = 50;
        profile.realEstate = [{
            id: 'home',
            currentValue: 500000,
            appreciationRate: 0,
            mortgage: {
                balance: 100000,
                paymentPI: standardPayment,
                rate: 4.0,
                targetAge: 55 // Pay off in 5 years (Age 50 -> 55)
            }
        }];

        const ledger = generateLedger(profile);

        // Check balances
        for (let i = 0; i < 6; i++) {
            const year = ledger[i];
            const balance = year.balances.mortgageBalance;
            const mortgagePaid = year.expenses.mortgage;
            console.log(`Year ${i} (Age ${year.age}): Balance $${balance.toFixed(2)}, Paid: $${mortgagePaid.toFixed(2)}`);

            if (i < 4) {
                // Should be paying MORE than standard ($477 * 12 = $5729)
                expect(mortgagePaid).toBeGreaterThan(6000);
            }

            if (year.age === 55) {
                expect(balance).toBe(0);
            }
        }
    });

});
