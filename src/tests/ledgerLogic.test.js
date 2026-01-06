/**
 * Ledger Logic Validation
 *
 * Tests the extracted 'generateLedger' function for:
 * - Estate Tax Logic
 * - Spending Strategy Logic
 * - Ancillary Logic Integration
 */

import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';

describe('Ledger Logic Engine', () => {

    const mockPlanData = {
        people: [{ id: 'client', age: 60, retirementAge: 65, lifeExpectancy: 90 }],
        assets: {
            traditional: { client: 1000000, spouse: 0 },
            roth: { client: 500000, spouse: 0 },
            brokerage: { joint: 2000000 }, // High assets for Estate Tax
            cash: { total: 100000 }
        },
        realEstate: [
            { id: '1', currentValue: 20000000, appreciationRate: 5, mortgageBalance: 0, propertyTax: 0, insurance: 0, maintenance: 0 }
        ],
        expenses: { essential: 100000, discretionary: 50000 },
        assumptions: { inflation: 2.5, growthRate: 7 },
        profile: { filingStatus: 'single' },
        taxOptimization: { enableGainHarvesting: false }
    };

    it('should calculate Estate Tax correctly for high net worth', () => {
        const ledger = generateLedger(mockPlanData);
        const finalYear = ledger[ledger.length - 1]; // Age 90

        // Check final year estate report
        expect(finalYear.estateReport).toBeDefined();
        // 20M Home growing at 5% for 30 years -> ~86M
        // Exemption 13.6M growing at 2.5% -> ~28M
        // Taxable ~58M * 40% = ~23M Tax

        const estateTax = finalYear.estateReport.taxes.estate;
        expect(estateTax).toBeGreaterThan(10000000); // Should be massive
        expect(finalYear.legacyValue).toBeGreaterThan(0);
    });

    it('should respect Life Expectancy duration', () => {
        const ledger = generateLedger(mockPlanData);
        // Age 60 to 90 = 31 years
        expect(ledger.length).toBe(31);
        expect(ledger[ledger.length - 1].age).toBe(90);
    });
});
