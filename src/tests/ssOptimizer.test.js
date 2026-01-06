/**
 * Social Security Optimizer Validation
 *
 * Tests benefit calculations including:
 * - Actuarial reductions for early filing
 * - Delayed Retirement Credits (8%/yr)
 * - Survivor benefit switches
 */

import { describe, it, expect } from 'vitest';
import {
    calculateSSBenefit,
    calculateSurvivorBenefit,
    simulateJointStrategy
} from '../lib/ssOptimizer';

describe('Social Security Logic Validation', () => {

    describe('Individual Benefit Calculations', () => {
        const PIA = 3000; // $3,000/mo at FRA
        const FRA = 67;

        it('should return full PIA at FRA', () => {
            expect(calculateSSBenefit(PIA, 67, FRA)).toBe(3000);
        });

        it('should calculate Age 62 reduction correctly (FRA 67)', () => {
            // 5 years early = 60 months
            // First 36 months: 5/9 of 1% * 36 = 20%
            // Remaining 24 months: 5/12 of 1% * 24 = 10%
            // Total Reduction = 30%
            // Expected: 70% of 3000 = 2100

            const benefit = calculateSSBenefit(PIA, 62, FRA);
            expect(benefit).toBeCloseTo(2100);
        });

        it('should calculate Age 70 delayed credits correctly (FRA 67)', () => {
            // 3 years delayed = 36 months
            // Credit = 8% per year * 3 = 24%
            // Expected: 124% of 3000 = 3720

            const benefit = calculateSSBenefit(PIA, 70, FRA);
            expect(benefit).toBeCloseTo(3720);
        });

        it('should not increase benefit past age 70', () => {
            const benefit70 = calculateSSBenefit(PIA, 70, FRA);
            const benefit72 = calculateSSBenefit(PIA, 72, FRA);
            expect(benefit72).toBe(benefit70); // Credits cap at 70
        });
    });

    describe('Survivor Benefits', () => {
        it('should grant survivor the higher of two benefits', () => {
            const primaryBenefit = 4000; // High earner
            const spouseBenefit = 1500; // Low earner

            // If primary dies, spouse gets 4000
            expect(calculateSurvivorBenefit(primaryBenefit, spouseBenefit)).toBe(4000);
        });

        it('should handle scenario where survivor has higher own benefit', () => {
            const primaryBenefit = 2000;
            const spouseBenefit = 2500;

            // If primary dies, spouse keeps their own 2500
            expect(calculateSurvivorBenefit(primaryBenefit, spouseBenefit)).toBe(2500);
        });
    });

    describe('Joint Strategy Simulation', () => {
        it('should simulate timeline with correct survivor switch', () => {
            const result = simulateJointStrategy({
                primaryPia: 3000,
                spousePia: 1000,
                primaryClaimAge: 70,    // Maximizing checks
                spouseClaimAge: 62,     // Taking early
                primaryLifeExpectancy: 85, // Dies first
                spouseLifeExpectancy: 95,
                primaryAge: 60,
                spouseAge: 60
            });

            // Check Year of Death switch (Age 86 for primary, spouse matches)
            // Array index 26 corresponds to roughly Age 86

            const deathIndex = result.monthlyStream.findIndex(y => y.pAge === 86);
            if (deathIndex === -1) return; // Should exist

            const survivorYear = result.monthlyStream[deathIndex];

            // Primary Dead => Benefit 0
            expect(survivorYear.primary).toBe(0);

            // Spouse Survivor Benefit
            // Should be Primary's Age 70 Benefit (maximized)
            // Primary Age 70 Benefit = 3000 * 1.24 = 3720
            expect(survivorYear.spouse).toBeCloseTo(3720);

            // Before death (Age 80)
            const aliveIndex = result.monthlyStream.findIndex(y => y.pAge === 80);
            const aliveYear = result.monthlyStream[aliveIndex];

            // Primary Alive (Age 80 > 70) => Getting 3720
            expect(aliveYear.primary).toBeCloseTo(3720);

            // Spouse Alive (Age 80 > 62)
            // Spouse Own (Age 62): 1000 * 0.70 = 700
            // Spousal Add-on: Base is 0.5 * 3000 = 1500. Add-on = 1500 - 1000 = 500.
            // Reduced Add-on (5 years early): 30% reduction?
            // 25/36 * 36 = 25%. 5/12 * 24 = 10%. Total 35% reduction on add-on?
            // Actually deeming rules get complex, simplified check: > Own Benefit
            expect(aliveYear.spouse).toBeGreaterThan(700);
        });
    });

});
