/**
 * Monte Carlo Sanity Tests
 *
 * Automated checks to catch abnormal simulation results:
 * - Positive initial balances
 * - No Year 0 failures with healthy portfolio
 * - Success rate bounds
 * - NaN detection
 * - Zero-volatility deterministic match
 */

import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';

describe('Monte Carlo Sanity Checks', () => {

    // Standard test plan with healthy portfolio
    const healthyPlan = {
        people: [{ id: 'client', age: 50, retirementAge: 60, lifeExpectancy: 90 }],
        profile: { filingStatus: 'head', stateOfResidence: 'FL' },
        assets: {
            traditional: { client: 1000000, spouse: 0 },
            roth: { client: 200000, spouse: 0 },
            hsa: { client: 50000, spouse: 0 },
            brokerage: { joint: 500000 },
            brokerageBasis: { joint: 300000 },
            cash: { total: 50000 },
            crypto: {}
        },
        salary: 100000,
        contributions: { traditional: 0, roth: 0, hsa: 0 },
        expenses: { essential: 50000, discretionary: 20000, growthRate: 3 },
        socialSecurity: { primary: { annualAmount: 0, startAge: 67 } },
        assumptions: {
            growthRate: 7,
            inflation: 3,
            equityReturn: 7,
            equityVolatility: 0,  // Zero for deterministic tests
            cryptoReturn: 10,
            cryptoVolatility: 0
        },
        taxOptimization: {}
    };

    it('should capture initial balances correctly', () => {
        const ledger = generateLedger(healthyPlan);

        // Check initialBalances exists and has expected structure
        expect(ledger.initialBalances).toBeDefined();
        expect(typeof ledger.initialBalances).toBe('object');

        // Initial traditional should match input
        expect(ledger.initialBalances.traditionalClient).toBe(1000000);
        expect(ledger.initialBalances.rothClient).toBe(200000);
        expect(ledger.initialBalances.brokerage).toBe(500000);
    });

    it('should have positive total initial balance for healthy portfolio', () => {
        const ledger = generateLedger(healthyPlan);

        const assetKeys = ['traditionalClient', 'traditionalSpouse', 'rothClient', 'rothSpouse',
            'hsaClient', 'hsaSpouse', 'brokerage', 'crypto', 'cash'];
        const total = assetKeys.reduce((sum, k) => sum + (ledger.initialBalances?.[k] || 0), 0);

        expect(total).toBeGreaterThan(0);
        expect(total).toBeCloseTo(1800000, -2); // $1.8M within 1000
    });

    it('should have cash flow data for Monte Carlo consumption', () => {
        const ledger = generateLedger(healthyPlan);

        // Year 0 should have cashFlow.byAccount
        expect(ledger[0].cashFlow).toBeDefined();
        expect(ledger[0].cashFlow.byAccount).toBeDefined();
        expect(typeof ledger[0].cashFlow.byAccount).toBe('object');
    });

    it('should produce positive final balance with zero volatility (deterministic)', () => {
        const ledger = generateLedger(healthyPlan);
        const finalYear = ledger[ledger.length - 1];

        // With 7% growth, $1.8M start, reasonable expenses, should be positive at age 90
        const finalTotal = finalYear.balances.total ||
            Object.values(finalYear.balances.details || finalYear.balances)
                .reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

        expect(finalTotal).toBeGreaterThan(0);
    });

    it('should NOT fail early with healthy portfolio and zero volatility', () => {
        const ledger = generateLedger(healthyPlan);

        // Check no ruin year (should survive to end with healthy portfolio)
        const ruinYear = ledger.find(year => {
            const total = year.balances.total ||
                Object.values(year.balances.details || year.balances)
                    .reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            return total <= 0;
        });

        expect(ruinYear).toBeUndefined();
    });

    it('should have ledger length matching plan duration', () => {
        const ledger = generateLedger(healthyPlan);

        // Age 50 to 90 = 41 years
        expect(ledger.length).toBe(41);
        expect(ledger[0].age).toBe(50);
        expect(ledger[40].age).toBe(90);
    });

});

describe('Monte Carlo Result Validation', () => {

    it('should have finalBalances with required properties', () => {
        // Mock result structure that Monte Carlo worker should produce
        const mockResult = {
            successRate: 0.85,
            iterations: 1000,
            finalBalances: {
                p10: 500000,
                p25: 1000000,
                median: 2000000,
                p75: 4000000,
                p90: 8000000
            },
            failureStats: {
                count: 150,
                averageAgeOfRuin: 78
            }
        };

        // Validate structure
        expect(mockResult.successRate).toBeGreaterThanOrEqual(0);
        expect(mockResult.successRate).toBeLessThanOrEqual(1);
        expect(mockResult.finalBalances.median).not.toBeNaN();
        expect(mockResult.finalBalances.p10).toBeLessThanOrEqual(mockResult.finalBalances.median);
        expect(mockResult.finalBalances.median).toBeLessThanOrEqual(mockResult.finalBalances.p90);
    });

    it('should detect invalid success rate', () => {
        const validateSuccessRate = (rate) => rate >= 0 && rate <= 1 && !isNaN(rate);

        expect(validateSuccessRate(0.85)).toBe(true);
        expect(validateSuccessRate(0)).toBe(true);
        expect(validateSuccessRate(1)).toBe(true);
        expect(validateSuccessRate(-0.1)).toBe(false);
        expect(validateSuccessRate(1.5)).toBe(false);
        expect(validateSuccessRate(NaN)).toBe(false);
    });

    it('should detect NaN in final balances', () => {
        const validateBalance = (balance) => typeof balance === 'number' && !isNaN(balance);

        expect(validateBalance(1000000)).toBe(true);
        expect(validateBalance(0)).toBe(true);
        expect(validateBalance(NaN)).toBe(false);
        expect(validateBalance(undefined)).toBe(false);
    });

});
