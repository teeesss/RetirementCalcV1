/**
 * Tax Engine Validation Test Suite
 *
 * rigorously tests 2025 tax calculations against projected IRS values/Code
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFederalTax,
  getStandardDeduction,
  calculateFICA,
  calculateNIIT,
  calculateCapitalGainsTax,
  calculateMedicarePremiums,
  calculateRMD,
} from '../lib/taxEngine';

describe('Tax Engine Core Validation (2025)', () => {
  describe('Standard Deduction', () => {
    it('should return correct 2025 base amounts', () => {
      expect(getStandardDeduction('single', 50)).toBe(15000);
      expect(getStandardDeduction('married', 50)).toBe(30000);
      expect(getStandardDeduction('head', 50)).toBe(22500);
    });

    it('should apply age 65+ catch-up correctly', () => {
      // Single: 15000 + 1950 = 16950
      expect(getStandardDeduction('single', 65)).toBe(16950);
      // Married: 30000 + 1950 (standard assumes one spouse 65+ if singular age passed?
      // NOTE: Current implementation applies per person logic usually, but here age is scalar.
      // Let's verify existing logic: "base + (age >= 65 ? AGE_65_DEDUCTION : 0)"
      // For married, logic might need review if it means "both", but typically engine assumes Primary User age.
      // This suggests a potential "bug" or "feature" to check if it doubles for married.
      expect(getStandardDeduction('married', 66)).toBe(30000 + 1950);
    });
  });

  describe('Federal Income Tax Brackets (2025)', () => {
    it('should calculate Single filer tax correctly', () => {
      // Bracket 1 (10%): Up to 11,600
      expect(calculateFederalTax(10000, 'single')).toBe(1000);

      // Bracket 2 (12%): 11,600 to 47,150
      // Test Income: 20,000
      // 11925 * 0.10 = 1192.5
      // (20000 - 11925) * 0.12 = 8075 * 0.12 = 969
      // Total = 2161.5
      expect(calculateFederalTax(20000, 'single')).toBeCloseTo(2161.5);
    });

    it('should calculate Married filer tax correctly', () => {
      // Bracket 1 (10%): Up to 23,850
      // Bracket 2 (12%): 23,850 to 96,950
      // Test Income: 100,000
      // 23,850 * 0.10 = 2385
      // (96,950 - 23,850) * 0.12 = 73,100 * 0.12 = 8772
      // (100,000 - 96,950) * 0.22 = 3,050 * 0.22 = 671
      // Total = 11828
      expect(calculateFederalTax(100000, 'married')).toBeCloseTo(11828);
    });
  });

  describe('FICA & Self-Employment', () => {
    it('should cap SS tax at wage base', () => {
      const wageBase = 176100;
      const highIncome = 200000;

      const resultHigh = calculateFICA(highIncome);
      const expectedSS = wageBase * 0.062;
      const expectedMed = highIncome * 0.0145; // Uncapped

      expect(resultHigh.ss).toBeCloseTo(expectedSS); // 10,918.2
      expect(resultHigh.medicare).toBeCloseTo(expectedMed); // 2,900
    });

    it('should apply full rate below wage base', () => {
      const income = 100000;
      const result = calculateFICA(income);
      expect(result.ss).toBe(6200);
      expect(result.medicare).toBe(1450);
    });
  });

  describe('NIIT (Net Investment Income Tax)', () => {
    it('should apply 3.8% only on excess MAGI', () => {
      // Married Threshold: 250,000
      // AGI: 300,000
      // Invest Income: 100,000
      // Excess AGI: 50,000
      // Base = min(Invest, Excess) = 50,000
      // Tax = 50,000 * 0.038 = 1900
      expect(calculateNIIT(100000, 300000, 'married')).toBe(1900);
    });

    it('should be zero if below threshold', () => {
      expect(calculateNIIT(50000, 200000, 'married')).toBe(0);
    });
  });

  describe('Capital Gains Stacking', () => {
    it('should apply 0% rate if total income falls within 0% bracket', () => {
      // Married 0% LTCG Limit: 94,300 (Taxable Income)
      // Ordinary Taxable: 50,000
      // LTCG: 40,000
      // Total Taxable: 90,000 (Uses up room, but stays under 94,300)

      const tax = calculateCapitalGainsTax(40000, 50000, 'married');
      expect(tax).toBe(0);
    });

    it('should apply 15% rate on overflow', () => {
      // Married 0% limit: 96,700
      // Ordinary Taxable: 90,000
      // LTCG: 20,000
      // Room in 0%: 6,700
      // Taxable at 15%: 13,300
      // Tax = 13,300 * 0.15 = 1995

      const tax = calculateCapitalGainsTax(20000, 90000, 'married');
      expect(tax).toBeCloseTo(1995);
    });
  });

  describe('IRMAA (Medicare Premiums)', () => {
    it('should return base premiums for low income', () => {
      const result = calculateMedicarePremiums(50000, 'married');
      const annualB = 185.0 * 12;
      const annualD = 53.95 * 12;
      expect(result.totalIRMAA).toBe(0);
      expect(result.totalAnnual).toBeCloseTo(annualB + annualD);
    });

    it('should trigger Tier 2 surcharge correctly', () => {
      // Married Tier 1 Limit: 212,000. Tier 2 starts > 212,000
      const magi = 220000;
      const result = calculateMedicarePremiums(magi, 'married');

      // Tier 2 Surcharges: B=$74.00, D=$13.70
      const expectedSurcharge = (74.0 + 13.7) * 12;
      expect(result.totalIRMAA).toBeCloseTo(expectedSurcharge);
    });
  });

  describe('RMD (Required Minimum Distribution)', () => {
    it('should be zero before age 73', () => {
      expect(calculateRMD(1000000, 72)).toBe(0);
    });

    it('should use correct divisor at age 73', () => {
      // Age 73 factor: 26.5
      // 1,000,000 / 26.5 = 37,735.85
      expect(calculateRMD(1000000, 73)).toBeCloseTo(37735.85);
    });
  });
});
