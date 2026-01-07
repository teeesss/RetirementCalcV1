
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Quick Ledger Check', () => {
    it('should generate valid numeric ledger with default profile', () => {
        const profile = JSON.parse(JSON.stringify(defaultProfile));
        const ledger = generateLedger(profile);

        console.log('Ledger Length:', ledger.length);
        console.log('Year 0 Net Worth:', ledger[0].netWorth);
        console.log('Final Year Net Worth:', ledger[ledger.length - 1].netWorth);

        // check for NaNs
        let nanFound = false;
        ledger.forEach((y, i) => {
            if (Number.isNaN(y.netWorth)) {
                console.error(`NaN NetWorth at Year ${i}`);
                nanFound = true;
            }
            if (Number.isNaN(y.balances.mortgageBalance)) {
                console.error(`NaN Mortgage Balance at Year ${i}`);
                nanFound = true;
            }
        });

        expect(nanFound).toBe(false);
        expect(ledger.length).toBeGreaterThan(0);
        expect(ledger[0].netWorth).toBeGreaterThan(0);
    });
});
