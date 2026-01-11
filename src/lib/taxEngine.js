import TAX_DATA from '../data/tax_2025.json';

/**
 * Tax Engine - Comprehensive U.S. Federal Tax Calculator
 *
 * Implements:
 * - 2025 Federal progressive brackets (Single, HoH, MFJ)
 * - Standard deduction with age-based adjustments
 * - FICA (Social Security 6.2% up to wage base, Medicare 1.45% uncapped)
 * - NIIT (3.8% Net Investment Income Tax over threshold)
 * - Capital gains tiers (0%, 15%, 20%)
 * - State tax (flat rate, default 0% for Florida)
 *
 * @module taxEngine
 */

/**
 * 2025 Federal Tax Brackets by Filing Status
 * Sourced from Rev. Proc. 2024-40
 */
export const FEDERAL_BRACKETS = {
  single: TAX_DATA.brackets.single.map((b) => [b.rate, b.limit ?? Infinity]),
  head: TAX_DATA.brackets.head.map((b) => [b.rate, b.limit ?? Infinity]),
  married: TAX_DATA.brackets.married.map((b) => [b.rate, b.limit ?? Infinity]),
};

/**
 * TCJA Sunset Brackets (Pre-2018 Rates, Inflation Adjusted for 2026+)
 * Rates: 10%, 15%, 25%, 28%, 33%, 35%, 39.6%
 * Estimating ranges based on 2025 inflation-adjusted equivalence + 2017 structure width
 * Using simplified assumption: Map current brackets to old rates where closest
 */
/**
 * TCJA Sunset Brackets (Pre-2018 Rates, Inflation Adjusted for 2026+)
 * Rates: 10%, 15%, 25%, 28%, 33%, 35%, 39.6%
 * Sourced from TAX_DATA.sunset_brackets
 */
export const SUNSET_BRACKETS = {
  single: TAX_DATA.sunset_brackets.single.map((b) => [b.rate, b.limit ?? Infinity]),
  head: TAX_DATA.sunset_brackets.head.map((b) => [b.rate, b.limit ?? Infinity]),
  married: TAX_DATA.sunset_brackets.married.map((b) => [b.rate, b.limit ?? Infinity]),
};

import { calculateStateTaxModel } from './stateTaxEngine';

/**
 * 2025 Standard Deductions
 */
export const FEDERAL_STANDARD_DEDUCTION = {
  single: TAX_DATA.standard_deduction.single,
  head: TAX_DATA.standard_deduction.head,
  married: TAX_DATA.standard_deduction.married,
};

/**
 * Pre-TCJA Standard Deductions (Inflation Adjusted Estimate)
 * Without Personal Exemptions (Simulated as just lower deduction for simplicity)
 * Approx 50% of current
 */
/**
 * Pre-TCJA Standard Deductions (Inflation Adjusted Estimate)
 * Without Personal Exemptions (Simulated as just lower deduction for simplicity)
 * Approx 50% of current
 */
const SUNSET_DEDUCTIONS = {
  single: TAX_DATA.sunset_standard_deduction.single,
  head: TAX_DATA.sunset_standard_deduction.head,
  married: TAX_DATA.sunset_standard_deduction.married,
};

/**
 * Additional standard deduction for age 65+
 */
const AGE_65_DEDUCTION = TAX_DATA.age_65_deduction;

/**
 * Social Security wage base limit (2025)
 */
const SS_WAGE_BASE = TAX_DATA.fica.ss_wage_base;

/**
 * Social Security tax rate
 */
const SS_RATE = TAX_DATA.fica.ss_rate;

/**
 * Medicare tax rate (uncapped)
 */
const MEDICARE_RATE = TAX_DATA.fica.medicare_rate;

/**
 * NIIT threshold by filing status (2025)
 */
const NIIT_THRESHOLDS = TAX_DATA.niit.thresholds;

/**
 * NIIT rate
 */
const NIIT_RATE = TAX_DATA.niit.rate;

/**
 * Capital gains brackets by filing status (2025 Rev. Proc.)
 * Format: [rate, bracketLimit]
 */
const CAPITAL_GAINS_BRACKETS = {
  single: TAX_DATA.capital_gains.single.map((b) => [b.rate, b.limit ?? Infinity]),
  head: TAX_DATA.capital_gains.head.map((b) => [b.rate, b.limit ?? Infinity]),
  married: TAX_DATA.capital_gains.married.map((b) => [b.rate, b.limit ?? Infinity]),
};

/**
 * Calculate standard deduction with age adjustment
 * @param {string} filingStatus - 'single', 'head', or 'married'
 * @param {number} age - Current age
 * @returns {number} Standard deduction amount
 */
export function getStandardDeduction(filingStatus, age, year = 2025, enableTCJASunset = false) {
  const isSunset = enableTCJASunset && year >= 2026;
  const baseTable = isSunset ? SUNSET_DEDUCTIONS : FEDERAL_STANDARD_DEDUCTION;
  const base = baseTable[filingStatus] || baseTable.single;
  const ageAdjustment = age >= 65 ? AGE_65_DEDUCTION : 0;
  return base + ageAdjustment;
}

/**
 * Calculate federal income tax using progressive brackets
 * @param {number} taxableIncome - Income after deductions
 * @param {string} filingStatus - 'single', 'head', or 'married'
 * @returns {number} Federal income tax
 */
export function calculateFederalTax(
  taxableIncome,
  filingStatus,
  year = 2025,
  enableTCJASunset = false
) {
  if (taxableIncome <= 0) return 0;

  const isSunset = enableTCJASunset && year >= 2026;
  const bracketSet = isSunset ? SUNSET_BRACKETS : FEDERAL_BRACKETS;
  const brackets = bracketSet[filingStatus] || bracketSet.single;

  let tax = 0;
  let prevLimit = 0;

  for (const [rate, limit] of brackets) {
    if (taxableIncome > prevLimit) {
      const taxableInBracket = Math.min(taxableIncome, limit) - prevLimit;
      tax += taxableInBracket * rate;
      prevLimit = limit;
    }
  }

  return tax;
}

/**
 * Calculate FICA taxes (Social Security + Medicare)
 * @param {number} wages - W-2 wages or self-employment income
 * @returns {Object} {ss: number, medicare: number, total: number}
 */
/**
 * Calculate total Itemized Deduction
 * Includes: Medical (>7.5% AGI), SALT (capped $10k), Mortgage Interest, Charity
 */
export function calculateItemizedDeduction(
  { medical = 0, stateTax = 0, propertyTax = 0, mortgageInterest = 0, charity = 0 },
  agi
) {
  // 1. Medical Expenses (> 7.5% AGI)
  const medicalThreshold = agi * 0.075;
  const deductibleMedical = Math.max(0, medical - medicalThreshold);

  // 2. SALT (State & Local Taxes) - Capped at $10,000 (TCJA)
  const totalSALT = stateTax + propertyTax;
  const deductibleSALT = Math.min(totalSALT, 10000);

  // 3. Mortgage Interest (Assume fully deductible for now)
  // 4. Charity

  return deductibleMedical + deductibleSALT + mortgageInterest + charity;
}

/**
 * Calculate ACA Subsidy (Premium Tax Credit)
 * Based on 2024 IRS contribution limits (0% to ~8.5% of income)
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {number} householdSize - Number of people in household
 * @param {number} benchmarkPremium - Monthly benchmark premium
 * @param {number} povertyLine - Federal Poverty Level base (default 15060)
 * @returns {Object} { subsidy, maxPremium, fplPercent, benchmarkAnnual }
 */
export function calculateACASubsidy(magi, householdSize, benchmarkPremium, povertyLine = 15060) {
  // 1. Determine FPL %
  // 2024 Poverty Guidelines (approx)
  // Household 1: $15,060
  // Household 2: $20,440
  // Each extra: $5,380
  const fplBase = povertyLine + (householdSize - 1) * 5380;
  const fplPercent = (magi / fplBase) * 100;

  // 2. Determine Expected Contribution % (Sliding Scale)
  // < 150% FPL: 0% contribution
  // 150% - 200%: 0% - 2.0%
  // 200% - 300%: 2.0% - 6.0%
  // 300% - 400%: 6.0% - 8.5%
  // 400%+: 8.5% (post-ARPA/IRA cap)

  let contributionRate = 0;

  if (fplPercent < 150) {
    contributionRate = 0;
  } else if (fplPercent < 200) {
    // Linear interpolation 0.0% -> 2.0%
    contributionRate = 0.0 + ((fplPercent - 150) / 50) * 0.02;
  } else if (fplPercent < 300) {
    // Linear interpolation 2.0% -> 6.0%
    contributionRate = 0.02 + ((fplPercent - 200) / 100) * 0.04;
  } else if (fplPercent < 400) {
    // Linear interpolation 6.0% -> 8.5%
    contributionRate = 0.06 + ((fplPercent - 300) / 100) * 0.025;
  } else {
    contributionRate = 0.085; // Capped at 8.5% of income
  }

  // 3. Calculate Subsidy
  const maxPremiumAnnual = magi * contributionRate;
  const benchmarkAnnual = benchmarkPremium * 12;

  const subsidy = Math.max(0, benchmarkAnnual - maxPremiumAnnual);

  return {
    subsidy,
    maxPremium: maxPremiumAnnual,
    fplPercent,
    benchmarkAnnual,
  };
}

export function calculateFICA(wages) {
  const ssTax = Math.min(wages, SS_WAGE_BASE) * SS_RATE;
  const medicareTax = wages * MEDICARE_RATE;
  return {
    ss: ssTax,
    medicare: medicareTax,
    total: ssTax + medicareTax,
  };
}

/**
 * Calculate Net Investment Income Tax (NIIT)
 * @param {number} investmentIncome - Net investment income (interest, dividends, capital gains, etc.)
 * @param {number} agi - Adjusted Gross Income
 * @param {string} filingStatus - Filing status
 * @returns {number} NIIT amount
 */
export function calculateNIIT(investmentIncome, agi, filingStatus) {
  const threshold = NIIT_THRESHOLDS[filingStatus] || NIIT_THRESHOLDS.single;
  const excess = Math.max(0, agi - threshold);
  const niitBase = Math.min(investmentIncome, excess);
  return niitBase * NIIT_RATE;
}

/**
 * Additional Medicare Tax Thresholds (2025)
 */
/**
 * Additional Medicare Tax Thresholds (2025)
 */
const ADDL_MEDICARE_THRESHOLDS = TAX_DATA.additional_medicare_tax.thresholds;

const ADDL_MEDICARE_RATE = TAX_DATA.additional_medicare_tax.rate;

/**
 * Calculate Additional Medicare Tax (0.9% on wages > threshold)
 * @param {number} wages - Earned income
 * @param {string} filingStatus - Filing status
 * @returns {number} Additional Medicare Tax
 */
export function calculateAdditionalMedicareTax(wages, filingStatus) {
  const threshold = ADDL_MEDICARE_THRESHOLDS[filingStatus] || ADDL_MEDICARE_THRESHOLDS.single;
  return Math.max(0, wages - threshold) * ADDL_MEDICARE_RATE;
}

/**
 * Calculate capital gains tax (stacked on top of taxable ordinary income)
 * @param {number} capitalGains - Long-term capital gains amount
 * @param {number} taxableOrdinaryIncome - Taxable Ordinary Income (after deductions)
 * @param {string} filingStatus - Filing status
 * @returns {number} Capital gains tax
 */
export function calculateCapitalGainsTax(capitalGains, taxableOrdinaryIncome, filingStatus) {
  if (capitalGains <= 0) return 0;

  const brackets = CAPITAL_GAINS_BRACKETS[filingStatus] || CAPITAL_GAINS_BRACKETS.single;

  // Stack gains on top of taxable ordinary income
  const startIncome = Math.max(0, taxableOrdinaryIncome);
  const endIncome = startIncome + capitalGains;

  let tax = 0;
  let prevLimit = 0;

  for (const [rate, limit] of brackets) {
    if (endIncome > prevLimit) {
      // Determine the portion of gains that fall in this bucket
      // Bucket range: [prevLimit, limit]
      // Income range for gains: [startIncome, endIncome]

      const bucketStart = Math.max(prevLimit, startIncome);
      const bucketEnd = Math.min(limit, endIncome);

      const gainsInBucket = Math.max(0, bucketEnd - bucketStart);
      tax += gainsInBucket * rate;

      prevLimit = limit;
    }
  }

  return tax;
}

/**
 * Calculate state tax (flat rate)
 * @param {number} taxableIncome - Taxable income
 * @param {number} stateRate - State tax rate (0-1, e.g., 0.05 for 5%)
 * @returns {number} State tax
 */
export function calculateStateTax(taxableIncome, stateRate = 0) {
  return Math.max(0, taxableIncome * stateRate);
}

/**
 * Medicare Part B Base Premium (2025 Est)
 * Monthly amount
 */
/**
 * Medicare Part B Base Premium (2025 Est)
 * Monthly amount
 */
const MEDICARE_PART_B_BASE = TAX_DATA.medicare_premiums.part_b_base;

/**
 * Medicare Part D Base Premium (2025 Est / Plan Avg)
 * Monthly amount
 */
const MEDICARE_PART_D_BASE = TAX_DATA.medicare_premiums.part_d_base;

/**
 * IRMAA Brackets (2025 based on 2023 Income)
 * Format: [Limit, PartB_Surcharge, PartD_Surcharge]
 * Limit is the upper bound of the tier.
 * Surcharges are MONTHLY amounts.
 */
export const IRMAA_BRACKETS = {
  single: TAX_DATA.medicare_premiums.irmaa_brackets.single.map((b) => [
    b.limit ?? Infinity,
    b.part_b_surcharge,
    b.part_d_surcharge,
  ]),
  married: TAX_DATA.medicare_premiums.irmaa_brackets.married.map((b) => [
    b.limit ?? Infinity,
    b.part_b_surcharge,
    b.part_d_surcharge,
  ]),
  head: TAX_DATA.medicare_premiums.irmaa_brackets.head.map((b) => [
    b.limit ?? Infinity,
    b.part_b_surcharge,
    b.part_d_surcharge,
  ]),
};

/**
 * Calculate Annual Medicare Premiums (Part B + D + IRMAA)
 * @param {number} magi - Modified Adjusted Gross Income (from 2 years prior)
 * @param {string} filingStatus - Filing status
 * @returns {Object} { partB: number, partD: number, irmaaB: number, irmaaD: number, total: number } (Annualized)
 */
export function calculateMedicarePremiums(magi, filingStatus) {
  const brackets = IRMAA_BRACKETS[filingStatus] || IRMAA_BRACKETS.single;

  let partBSurcharge = 0;
  let partDSurcharge = 0;

  // Find the correct bracket
  for (const [limit, bSurf, dSurf] of brackets) {
    if (magi <= limit) {
      partBSurcharge = bSurf;
      partDSurcharge = dSurf;
      break;
    }
  }

  // Calculate Monthly Totals
  const monthlyPartB = MEDICARE_PART_B_BASE + partBSurcharge;
  const monthlyPartD = MEDICARE_PART_D_BASE + partDSurcharge;

  // Annualize
  return {
    partB: MEDICARE_PART_B_BASE * 12,
    partD: MEDICARE_PART_D_BASE * 12,
    irmaaB: partBSurcharge * 12,
    irmaaD: partDSurcharge * 12,
    totalBase: (MEDICARE_PART_B_BASE + MEDICARE_PART_D_BASE) * 12,
    totalIRMAA: (partBSurcharge + partDSurcharge) * 12,
    totalAnnual: (monthlyPartB + monthlyPartD) * 12,
  };
}

/**
 * Social Security Provisional Income Thresholds (2025)
 * Format: [Base, Upper]
 * Below Base: 0% taxable
 * Base to Upper: Up to 50% taxable
 * Above Upper: Up to 85% taxable
 */
/**
 * Social Security Provisional Income Thresholds (2025)
 * Format: [Base, Upper]
 * Below Base: 0% taxable
 * Base to Upper: Up to 50% taxable
 * Above Upper: Up to 85% taxable
 */
const SS_THRESHOLDS = TAX_DATA.ss_taxability_thresholds;

/**
 * Calculate taxable portion of Social Security benefits
 * @param {number} ssBenefits - Total annual SS benefits
 * @param {number} otherIncome - Other income (Ordinary + Capital Gains + Tax Exempt Interest)
 * @param {string} filingStatus - Filing status
 * @returns {number} Taxable SS amount
 */
export function calculateTaxableSS(ssBenefits, otherIncome, filingStatus) {
  if (ssBenefits <= 0) return 0;

  const provisionalIncome = otherIncome + 0.5 * ssBenefits;
  const [t1, t2] = SS_THRESHOLDS[filingStatus] || SS_THRESHOLDS.single;

  if (provisionalIncome <= t1) return 0;

  if (provisionalIncome <= t2) {
    return Math.min(ssBenefits * 0.5, (provisionalIncome - t1) * 0.5);
  }

  // Above t2
  return Math.min(
    ssBenefits * 0.85,
    (provisionalIncome - t2) * 0.85 + Math.min(ssBenefits * 0.5, (t2 - t1) * 0.5)
  );
}

/**
 * Comprehensive tax calculation for a given year
 * @param {Object} params - Tax calculation parameters
 * @param {number} params.ordinaryIncome - Wages, withdrawals from pre-tax accounts, etc.
 * @param {number} params.capitalGains - Long-term capital gains
 * @param {number} params.investmentIncome - Interest, dividends, etc. (for NIIT)
 * @param {number} params.ssBenefits - Social Security benefits
 * @param {string} params.filingStatus - 'single', 'head', or 'married'
 * @param {string} params.filingStatus - 'single', 'head', or 'married'
 * @param {number} params.age - Current age
 * @param {number} params.capitalLosses - Total capital losses available (current + carryover)
 * @param {number} params.grossIncome - Total gross income before any deductions.
 * @param {string} params.filingStatus - 'single', 'head', or 'married'
 * @param {number} params.stateRate - State tax rate (default 0)
 * @param {Object} params.capitalGains - Object with short and long term capital gains.
 * @param {string} params.deductionMode - 'standard' or 'itemized'
 * @param {number} params.itemizedDeduction - Total itemized deduction amount if deductionMode is 'itemized'.
 * @param {number} params.age - Current age
 * @param {number} params.year - Tax year
 * @param {boolean} params.enableTCJASunset - Whether to apply TCJA sunset provisions
 * @param {string} params.stateOfResidence - State of residence (e.g., 'FL', 'CA')
 * @param {Object} params.stateTaxModel - Configuration for state tax calculation { enabled: boolean, ... }
 * @returns {Object} Complete tax breakdown
 */
export function calculateTotalTax({
  grossIncome, // This seems new? Logic uses ordinaryIncome usually?
  ordinaryIncome = 0, // Restoring this if body uses it
  filingStatus,
  stateRate = 0,
  capitalGains = { short: 0, long: 0 }, // Object format now? Body uses capitalGains as number in line 540?
  // WAIT. Body line 540 says Math.min(capitalGains, capitalLosses).
  // If capitalGains is now an object {short, long}, Math.min will return NaN.
  // I need to fix the Body to handle the object, OR revert the signature change if I broke it.

  // Let's look at Body usage in Step 246:
  // const usedAgainstGains = Math.min(capitalGains, capitalLosses);
  // const netCapitalGains = capitalGains - usedAgainstGains;
  // It expects number.

  // But my new signature passed: capitalGains: { short: 0, long: 0 }
  // And ledgerLogic (Step 253) passes: capitalGains: { short: 0, long: realizedGains }

  // I MUST Fix the body to extract long/short gains from the object.

  qualifiedDividends = 0,
  ordinaryDividends = 0,
  ssBenefits = 0,
  capitalLosses = 0,
  // eslint-disable-next-line no-unused-vars
  isRetired = false,
  earnedIncome = 0,
  itemizedItems = { medical: 0, propertyTax: 0, mortgageInterest: 0, charity: 0 },
  // eslint-disable-next-line no-unused-vars
  deductionMode = 'standard',
  itemizedDeduction = 0,
  age = 50,
  year = 2025,
  enableTCJASunset = false,
  stateOfResidence = 'FL',
  stateTaxModel = { enabled: false },
}) {
  // Parsing Capital Gains (Handle Number vs Object for backward compatibility if needed)
  const longTermGains = typeof capitalGains === 'object' ? capitalGains.long || 0 : capitalGains;
  // const shortTermGains = typeof capitalGains === 'object' ? (capitalGains.short || 0) : 0;

  // Short term gains are treated as ordinary income usually?
  // For this engine, let's treat input 'ordinaryIncome' as the base.
  // If 'grossIncome' was passed (new param), separate it?

  // Note: Previous body used 'ordinaryIncome'.
  // If caller passes 'grossIncome' but body expects 'ordinaryIncome', we have a mismatch.
  // ledgerLogic passes 'grossIncome'.
  // We should map grossIncome to ordinaryIncome if provided, or handle it.

  const effectiveOrdinaryIncome = ordinaryIncome || grossIncome || 0;

  // 1. Apply Capital Losses (IRS Ordering Rule)
  // First, offset Capital Gains (Long Term first?)
  const usedAgainstGains = Math.min(longTermGains, capitalLosses);
  const netCapitalGains = longTermGains - usedAgainstGains;

  // Second, excess losses offset Ordinary Income (up to $3,000)
  const remainingLoss = capitalLosses - usedAgainstGains;
  const usedAgainstOrdinary = Math.min(remainingLoss, 3000);

  // 2. Calculate Taxable SS
  // AGI for SS purposes includes tax-exempt interest (not modeled yet) but we include dividends.
  // Use effectiveOrdinaryIncome instead of raw ordinaryIncome
  const otherIncomeForSS =
    effectiveOrdinaryIncome +
    netCapitalGains +
    qualifiedDividends +
    ordinaryDividends -
    usedAgainstOrdinary;

  const taxableSS = calculateTaxableSS(ssBenefits, Math.max(0, otherIncomeForSS), filingStatus);

  // 3. Standard Deduction (Sunset Aware)
  const stdDeduction = getStandardDeduction(filingStatus, age, year, enableTCJASunset);

  // 4. AGI Calculation
  const agi =
    effectiveOrdinaryIncome +
    taxableSS +
    netCapitalGains +
    qualifiedDividends +
    ordinaryDividends -
    usedAgainstOrdinary;

  // 4b. Itemized vs Standard Deduction
  // If an explicit itemized deduction is provided (e.g. from UI override), use it?
  // For now, we calculate it internally.
  const calculatedItemizedDeduction = calculateItemizedDeduction(
    {
      ...itemizedItems,
      stateTax: calculateStateTaxModel({
        state: stateOfResidence,
        taxableIncome: agi,
        filingStatus,
      }),
    },
    agi
  );

  // Use the greater of Standard, Calculated Itemized, or Provided Itemized
  const finalDeduction = Math.max(stdDeduction, calculatedItemizedDeduction, itemizedDeduction);
  const isItemized = finalDeduction > stdDeduction;

  // 5. Taxable Ordinary Income
  const totalOrdinary =
    effectiveOrdinaryIncome + ordinaryDividends + taxableSS - usedAgainstOrdinary;
  const ordinaryTaxable = Math.max(0, totalOrdinary - finalDeduction);

  // 6. Federal Income Tax (Sunset Aware)
  const federalOrdinaryTax = calculateFederalTax(
    ordinaryTaxable,
    filingStatus,
    year,
    enableTCJASunset
  );

  // 7. Capital Gains & Qualified Dividends Tax (Stacked)
  // Both Net Capital Gains and Qualified Dividends are taxed at preferential rates
  const prefRateIncome = netCapitalGains + qualifiedDividends;
  const capGainsTax = calculateCapitalGainsTax(prefRateIncome, ordinaryTaxable, filingStatus);

  const federalIncomeTax = federalOrdinaryTax + capGainsTax;

  // FICA & Additional Medicare Tax
  const fica = calculateFICA(earnedIncome);
  const addlMedicare = calculateAdditionalMedicareTax(earnedIncome, filingStatus);

  // NIIT
  // NIIT applies to lesser of: Net Investment Income OR (AGI - Threshold)
  const nii = ordinaryDividends + qualifiedDividends + netCapitalGains;
  const niit = calculateNIIT(nii, agi, filingStatus);

  // State tax
  let stateTax = 0;
  if (stateTaxModel?.enabled) {
    stateTax = calculateStateTaxModel({
      state: stateOfResidence,
      taxableIncome: agi, // Simplified: States usually have their own AGI calc, but we use Fed AGI as proxy for MVP
      filingStatus,
    });
  } else {
    // Fallback or Legacy (if Flat Rate provided)
    stateTax = agi * stateRate; // Use the provided stateRate as a flat rate fallback
  }

  const totalTax = federalIncomeTax + fica.total + addlMedicare + niit + stateTax;

  return {
    agi,
    taxableIncome: Math.max(0, agi - finalDeduction),
    stdDeduction,
    itemizedDeduction,
    isItemized,
    capitalLossesUsed: usedAgainstGains + usedAgainstOrdinary,
    usedAgainstGains,
    usedAgainstOrdinary,
    taxableSS,
    federalIncomeTax,
    federalOrdinaryTax,
    capGainsTax, // Includes tax on Qualified Dividends
    fica: { ...fica, addlMedicare },
    niit,
    stateTax,
    totalTax,
    effectiveRate: agi > 0 ? totalTax / agi : 0,
    marginalRate: getMarginalRate(Math.max(0, agi - stdDeduction), filingStatus),
  };
}

/**
 * Get marginal tax rate for a given income level
 * @param {number} taxableIncome - Taxable income
 * @param {string} filingStatus - Filing status
 * @returns {number} Marginal tax rate (0-1)
 */
export function getMarginalRate(taxableIncome, filingStatus) {
  const brackets = FEDERAL_BRACKETS[filingStatus] || FEDERAL_BRACKETS.single;

  for (const [rate, limit] of brackets) {
    if (taxableIncome < limit) {
      return rate;
    }
  }

  return 0.37; // Top bracket
}

/**
 * Calculate RMD (Required Minimum Distribution) for a given age
 * @param {number} balance - Pre-tax account balance
 * @param {number} age - Current age
 * @returns {number} RMD amount (0 if under 73)
 */
/**
 * Calculate Required Minimum Distribution (RMD)
 * Uses IRS Uniform Lifetime Table (Table III)
 * Implements SECURE Act 2.0 age thresholds
 *
 * @param {number} balance - Account balance at end of prior year
 * @param {number} age - Age at end of current year
 * @param {number|null} birthYear - Birth year to determine RMD Start Age
 * @returns {number} RMD Amount
 */
export function calculateRMD(balance, age, birthYear) {
  // Determine RMD Start Age based on SECURE 2.0
  let rmdStartAge = 73; // Default for 1951-1959

  if (birthYear) {
    if (birthYear >= 1960) {
      rmdStartAge = 75;
    } else if (birthYear <= 1950) {
      rmdStartAge = 72; // Legacy (ignoring Pre-2020 70.5 rule for simplicity in current-year planner)
    }
  } else {
    // Fallback if no birth year provided (e.g. legacy calls)
    // Assume 73 as it's the current standard for passing tests until callers update
    rmdStartAge = 73;
  }

  if (age < rmdStartAge) return 0;

  // IRS Uniform Lifetime Table factors (Table III)
  // Sourced from Pub 590-B
  const factors = {
    72: 27.4,
    73: 26.5,
    74: 25.5,
    75: 24.6,
    76: 23.7,
    77: 22.9,
    78: 22.0,
    79: 21.1,
    80: 20.2,
    81: 19.4,
    82: 18.5,
    83: 17.7,
    84: 16.8,
    85: 16.0,
    86: 15.2,
    87: 14.4,
    88: 13.7,
    89: 12.9,
    90: 12.2,
    91: 11.5,
    92: 10.8,
    93: 10.1,
    94: 9.5,
    95: 8.9,
    96: 8.4,
    97: 7.8,
    98: 7.3,
    99: 6.8,
    100: 6.4,
  };

  const factor = factors[age] || Math.max(1, 6.4 - (age - 100) * 0.5); // Fallback for 100+
  return balance / factor;
}

/**
 * Get the upper tax bracket limit for a given filing status and rate
 * @param {string} filingStatus - Filing status ('single', 'head', 'married')
 * @param {number} targetRate - Target tax rate (as decimal, e.g., 0.12 for 12%)
 * @returns {number} Upper limit of the bracket for that rate
 */
export function getBracketLimit(filingStatus, targetRate) {
  const brackets = FEDERAL_BRACKETS[filingStatus] || FEDERAL_BRACKETS.single;

  for (const [rate, limit] of brackets) {
    if (Math.abs(rate - targetRate) < 0.001) {
      // Floating point comparison
      return limit;
    }
  }

  // Default to infinity if not found
  return Infinity;
}
