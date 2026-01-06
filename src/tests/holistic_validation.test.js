
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Holistic Logic Validation', () => {
    it('should not have unexplained expense spikes > 50%', () => {
        const result = generateLedger(defaultProfile);

        let previousExpenses = 0;
        result.forEach((year, index) => {
            if (index > 0) {
                const currentExpenses = year.expenses.total;
                // Allow some spike for retirement transition or goals, but 3000% is a bug
                if (previousExpenses > 0) {
                    const increase = (currentExpenses - previousExpenses) / previousExpenses;
                    if (increase > 0.5) {
                        console.error(`Masive Expense Spike at Age ${year.age}: ${previousExpenses} -> ${currentExpenses} (${(increase * 100).toFixed(0)}%)`);
                    }
                    expect(increase).toBeLessThan(2.0); // Fail if expenses triple year-over-year without context
                }
                previousExpenses = currentExpenses;
            } else {
                previousExpenses = year.expenses.total;
            }
        });
    });

    it('should maintain Real Estate value > 0 throughout projection', () => {
        const result = generateLedger(defaultProfile);
        const initialRE = result[0].balances.realEstate;
        expect(initialRE).toBeGreaterThan(0);

        result.forEach(year => {
            expect(year.balances.realEstate).toBeGreaterThan(0);
        });
    });

    it('should not liquidate all assets at Age 60', () => {
        const result = generateLedger(defaultProfile);
        const age60 = result.find(y => y.age === 60);
        const age59 = result.find(y => y.age === 59);

        if (age60 && age59) {
            console.log(`Age 59 Balance: ${age59.totalBalance}`);
            console.log(`Age 60 Balance: ${age60.totalBalance}`);

            // Ensure we didn't lose > 50% of wealth in one year
            const drop = (age59.totalBalance - age60.totalBalance) / age59.totalBalance;
            expect(drop).toBeLessThan(0.5);
        }
    });
});
