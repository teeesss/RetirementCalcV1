import { describe, it, expect } from 'vitest';
import { calculateStateTaxModel } from '../lib/stateTaxEngine';

describe('State Tax Engine', () => {
  it('calculates 0% tax for Florida (FL)', () => {
    const result = calculateStateTaxModel({
      state: 'FL',
      taxableIncome: 100000,
      filingStatus: 'married',
    });
    expect(result).toBe(0);
  });

  it('calculates 0% tax for Texas (TX)', () => {
    const result = calculateStateTaxModel({
      state: 'TX',
      taxableIncome: 500000,
      filingStatus: 'single',
    });
    expect(result).toBe(0);
  });

  it('calculates progressive tax for California (CA) - Single', () => {
    // CA 2025 Estimates:
    // Std Ded: 5363
    // 1% up to 10412
    // 2% up to 24684...

    // Test income: 20000 (Low bracket)
    // Taxable: 20000 - 5363 = 14637
    // Bracket 1: 10412 * 0.01 = 104.12
    // Bracket 2: (14637 - 10412) * 0.02 = 4225 * 0.02 = 84.50
    // Total: 188.62
    const result = calculateStateTaxModel({
      state: 'CA',
      taxableIncome: 20000,
      filingStatus: 'single',
    });
    expect(result).toBeCloseTo(188.62, 1);
  });

  it('calculates progressive tax for New York (NY) - Married', () => {
    // NY 2025 Estimates
    // Std Ded: 16050
    // 4% up to 17150

    // Test income: 30000
    // Taxable: 30000 - 16050 = 13950
    // All in 4% bracket
    // Tax: 13950 * 0.04 = 558
    const result = calculateStateTaxModel({
      state: 'NY',
      taxableIncome: 30000,
      filingStatus: 'married',
    });
    expect(result).toBeCloseTo(558, 0);
  });

  it('returns 0 for unknown state', () => {
    const result = calculateStateTaxModel({
      state: 'ZZ',
      taxableIncome: 100000,
      filingStatus: 'single',
    });
    expect(result).toBe(0);
  });
});
