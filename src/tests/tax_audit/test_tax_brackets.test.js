import { describe, test, expect } from 'vitest';
import { calculateFederalTax, getStandardDeduction } from '../../lib/taxEngine';

// AUDIT: US-001 Tax Brackets (2025)
// Source: IRS Rev. Proc. 2024-40
// Single Standard Deduction: $15,000
// Single Bracket Top 12%: $48,475

describe('Tax Audit: Federal Brackets (2025)', () => {
  test('Uses 2025 Standard Deduction (Single: $15,000)', () => {
    // Current Code has 14,600 (2024)
    expect(getStandardDeduction('single', 50)).toBe(15000);
  });

  test('Uses 2025 Tax Brackets (Single 12% limit: $48,475)', () => {
    // We test the "Cross-over" point.
    // Income of $48,475 should be taxed at max 12% effectively.
    // Income of $48,476 puts $1 into 22% bracket.

    // Bracket 1 (10%): $0 - $11,925 (Tax = $1,192.50)
    // Bracket 2 (12%): $11,925 - $48,475

    // Let's just check the tax on exactly $48,475 (Taxable Income)
    // 10% on 11,925 = 1192.5
    // 12% on (48,475 - 11,925 = 36,550) = 4386
    // Total = 5578.5

    const taxableIncome = 48475;
    const tax = calculateFederalTax(taxableIncome, 'single');

    // If code uses 2024 brackets (Top 12% = 47,150), then (48,475 - 47,150) = 1325 is taxed at 22%.
    // 2024: 10% on 11,600 = 1160
    //       12% on (47,150 - 11,600 = 35,550) = 4266
    //       22% on (48,475 - 47,150 = 1,325) = 291.5
    // Total 2024 Tax = 1160 + 4266 + 291.5 = 5717.5

    // 2025 Tax (Expected) = 5578.5

    expect(tax).toBeCloseTo(5578.5, 0);
  });
});
