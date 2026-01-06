import { describe, it, expect } from 'vitest';
import { generateLedger } from './ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Ledger Logic - Date Precision', () => {
    it('should calculate partial year SS benefits for age 66.5', () => {
        // Setup Plan Data
        const planData = JSON.parse(JSON.stringify(defaultProfile));

        // Born Jan 1, 1960.
        // 2026: turns 66.
        // Start Age: 66.5 (July 1, 2026)

        planData.people = [{
            id: 'client',
            name: 'TestClient',
            birthDate: '1960-01-01',
            age: 64, // 2024
            lifeExpectancy: 85
        }];

        // Disable spouse
        planData.people = [planData.people[0]];
        planData.socialSecurity = {
            primary: {
                annualAmount: 30000, // $2500/mo
                startAge: 66.5
            },
            spouse: { annualAmount: 0, startAge: 70 }
        };

        // Assumptions
        planData.assumptions.inflation = 0; // Simplify math
        planData.assumptions.growthRate = 0;

        // Mock Assets
        planData.assets = {
            traditional: { client: 1000000, spouse: 0 },
            roth: { client: 0, spouse: 0 },
            brokerage: 0,
            cash: { total: 0 }
        };

        const ledger = generateLedger(planData);

        // Find year 2026 (Age 66)
        // 1960 + 66 = 2026
        const year66 = ledger.find(y => y.age === 66);
        const year67 = ledger.find(y => y.age === 67);

        // Expected:
        // Monthly Benefit = 30000 / 12 = 2500
        // (Note: ACTUALLY calculateSSBenefit adjusts for Claim Age vs FRA)
        // FRA for 1960 is 67.
        // Claiming at 66.5 is 6 months early.
        // Reduction: 6 * (5/9 of 1%) = 3.33% reduction.
        // Benefit = 2500 * (1 - 0.03333) = ~2416.66

        // Year 66: 6 months of payments (July-Dec)
        // Total = 2416.66 * 6 = ~14,500

        const monthlyBase = 2500;
        const reduction = 6 * (5 / 9 * 0.01);
        const monthlyAdjusted = monthlyBase * (1 - reduction);

        const expectedYear66 = monthlyAdjusted * 6;
        const expectedYear67 = monthlyAdjusted * 12;

        console.log('Year 66 SS:', year66.income.ss);
        console.log('Expected:', expectedYear66);

        // Allow slight float variance
        expect(year66.income.ss).toBeCloseTo(expectedYear66, 0);
        expect(year67.income.ss).toBeCloseTo(expectedYear67, 0);
    });
});
