
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';

describe('Golden Master Logic Verification', () => {
    // "Kitchen Sink" Scenario: Complex enough to touch most logic paths
    const KITCHEN_SINK_SCENARIO = {
        people: [
            { id: 'client', age: 50, lifeExpectancy: 90, retirementAge: 65 },
            { id: 'spouse', age: 48, lifeExpectancy: 92 }
        ],
        profile: { filingStatus: 'married', stateOfResidence: 'CA' }, // High tax state
        assets: {
            traditional: { client: 500000, spouse: 100000 },
            roth: { client: 50000, spouse: 50000 },
            brokerage: { joint: 200000 },
            brokerageBasis: { joint: 150000 },
            hsa: { client: 20000, spouse: 0 },
            crypto: { btc: { quantity: 2, price: 60000 } }, // $120k Crypto
            cash: { total: 50000 },
            realEstate: 800000 // Home
        },
        mortgage: {
            balance: 400000,
            paymentPI: 2500,
            rate: 3.5,
            targetAge: 75
        },
        expenses: {
            essential: 80000,
            discretionary: 20000,
            spendingPhases: {
                slowGoAge: 75, slowGoReduction: 0.9,
                noGoAge: 85, noGoReduction: 0.8
            }
        },
        socialSecurity: {
            primary: { startAge: 70, annualAmount: 35000 },
            spouse: { startAge: 67, annualAmount: 20000 }
        },
        assumptions: {
            inflation: 2.5,
            growthRate: 7,
            cryptoReturn: 7, // Fixed standard growth
            startYear: 2025
        },
        taxOptimization: {
            enableRothConversion: true,
            rothConversionTargetBracket: 0.22,
            enableTaxLossHarvesting: true
        }
    };

    it('should match the regression snapshot for the Kitchen Sink scenario', () => {
        const ledger = generateLedger(KITCHEN_SINK_SCENARIO);

        // Snapshot the typically unstable fields carefully or snapshot the whole thing if deterministic
        // We will snapshot the whole ledger for maximum safety, assuming logic is deterministic.
        // If IDs or Dates fluctuate, we might need a serializer, but current logic seems pure.

        expect(ledger).toMatchSnapshot();
    });
});
