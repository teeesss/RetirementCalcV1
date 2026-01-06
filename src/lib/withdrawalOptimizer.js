/**
 * Withdrawal Optimizer - Tax-Aware Withdrawal Strategy
 *
 * Implements optimal withdrawal ordering to minimize lifetime taxes:
 * 1. RMDs (Required Minimum Distributions) - mandatory
 * 2. Taxable Brokerage (LIFO - Last In First Out, capital gains)
 * 3. Traditional/Pre-Tax (fill tax brackets efficiently)
 * 4. Roth (tax-free, preserve for later)
 * 5. Crypto (last resort, capital gains treatment)
 *
 * Also supports:
 * - Roth conversion ladder suggestions
 * - QCD (Qualified Charitable Distribution) checks
 * - Tax-loss harvesting integration
 *
 * @module withdrawalOptimizer
 */

import { calculateRMD, calculateTotalTax, calculateTaxableSS, IRMAA_BRACKETS, getStandardDeduction } from './taxEngine.js';

/**
 * Optimize withdrawals for a given year using Iterative Solver
 * @param {Object} params - Withdrawal parameters
 */
export function optimizeWithdrawals({
  age,
  gap,
  balances,
  filingStatus,
  ordinaryIncome = 0,
  ssBenefits = 0,
  qualifiedDividends = 0,
  ordinaryDividends = 0,
  brokerageBasis = 0,
  taxLossHarvesting = 0,
  strategy = {},
  year = 2025,
  enableTCJASunset = false,
}) {
  // Destructure mutable balances (we will work with copies inside solver)
  const initialBalances = { ...balances };

  const {
    order = 'optimal',
    allowRothConversion = false, // Default false to avoid phantom tax
    rothConversionBracket = 0.12,
    shouldPayTaxes = true,
    targetBracket = 0.22
  } = strategy;

  // RMDs are mandatory and happen BEFORE the gap analysis usually,
  // but for the solver, we treat them as "Forced Withdrawals" that reduce the gap first.

  // 1. Calculate RMD
  const rmd = calculateRMD(initialBalances.traditional, age);

  // The Solver Loop
  // We need to solve for: withdrawals st. (withdrawals after tax) >= gap.
  // Equation: TotalWithdrawal = Gap + Tax(TotalWithdrawal)

  let currentTax = 0;
  let iterationLimit = 10;
  let finalResult = null;
  let lastDelta = 0;

  for (let i = 0; i < iterationLimit; i++) {
    // 1. Determine Total Needed Cash
    const totalNeeded = gap + currentTax;

    // 2. Run Withdrawal Waterfall
    // We pass a fresh copy of balances because each iteration simulates from the start state
    const simulation = executeWaterfall({
      needed: totalNeeded,
      balances: { ...initialBalances },
      rmd,
      ordinaryIncome,
      ssBenefits,
      qualifiedDividends,
      ordinaryDividends,
      brokerageBasis,
      age,
      filingStatus,
      taxLossHarvesting,
      targetBracket,
      order,
      year,
      allowRothConversion,
      rothConversionBracket
    });

    // 3. Calculate Tax on this Scenario
    const taxCalculation = calculateTotalTax({
      ordinaryIncome: simulation.totalOrdinaryIncome,
      capitalGains: simulation.totalCapitalGains,
      qualifiedDividends: simulation.qualifiedDividends,
      ordinaryDividends,
      ssBenefits,
      filingStatus,
      age,
      capitalLosses: taxLossHarvesting,
      stateRate: 0,
      isRetired: age >= 60,
      itemizedItems: strategy.itemizedItems,
      year,
      enableTCJASunset
    });

    const newTax = taxCalculation.totalTax;
    const delta = newTax - currentTax;

    // Check Convergence
    if (Math.abs(delta) < 1.0) {
      // Converged!
      finalResult = { ...simulation, taxes: taxCalculation, iterations: i + 1 };
      break;
    }

    // Update for next loop
    currentTax = newTax;
    lastDelta = delta;

    // If we hit the limit, we use the last result
    if (i === iterationLimit - 1) {
      finalResult = { ...simulation, taxes: taxCalculation, iterations: iterationLimit, converged: false };
      // console.warn('Tax Solver did not converge fully', { delta, age });
    }
  }

  // Apply the final tax payment to the balances
  // In the simulation, we withdrew enough to COVER the tax (stored in cash/pocket).
  // But we need to logically deduct it from the "Portfolio" view?
  // Actually, 'withdrawals' includes the tax portion.
  // The 'balances' in finalResult are the POST-WITHDRAWAL balances.
  // We just need to ensure the user understands that 'withdrawals' went to Expense + Tax.

  // However, payTaxes logic in previous version deducted tax from Brokerage/Crypto specifically?
  // No, the solver withdrawals ALREADY took the money out of the accounts.
  // If we withdrew $120k to pay $100k expenses + $20k tax, the $120k is gone from IRA/Brokerage.
  // So we don't need a separate "payTaxes" step that reduces balances further.
  // We just need to verify that (TotalWithdrawn - Tax) >= Gap.

  // One edge case: If the solver determined we need $120k, but we only have $110k total assets.
  // The waterfall would settle for $110k.
  // Then Tax calculation might be lower.
  // Logic holds.

  return {
    withdrawals: finalResult.withdrawals,
    balances: finalResult.balances, // These already have RMD + Gap + Tax withdrawn
    taxes: finalResult.taxes,
    remainingGap: Math.max(0, gap + finalResult.taxes.totalTax - finalResult.totalWithdrawn), // Did we fail to cover?
    meta: {
      iterations: finalResult.iterations,
      converged: finalResult.converged !== false
    }
  };
}

/**
 * Execute The Strict Withdrawal Waterfall
 * Returns: { withdrawals, balances, totalOrdinaryIncome, totalCapitalGains, totalWithdrawn }
 */
function executeWaterfall({
  needed,
  balances,
  rmd,
  ordinaryIncome,
  ssBenefits,
  qualifiedDividends,
  ordinaryDividends,
  brokerageBasis,
  age,
  filingStatus,
  targetBracket,
  allowRothConversion,
  rothConversionBracket
}) {
  let remainingNeed = Math.max(0, needed);

  // Trackers
  const w = {
    traditional: 0,
    roth: 0,
    brokerage: 0,
    crypto: 0,
    hsa: 0,
    cash: 0,
    rothConversion: 0
  };

  let currentOrdinary = ordinaryIncome;
  let currentLTCG = 0;

  // 0. Forced RMD (Mandatory)
  // RMDs must be taken first. They count as Ordinary Income.
  if (rmd > 0 && balances.traditional > 0) {
    const amount = Math.min(rmd, balances.traditional);
    balances.traditional -= amount;
    w.traditional += amount;
    currentOrdinary += amount;

    // RMDs reduce the need
    remainingNeed = Math.max(0, remainingNeed - amount);
  }

  // 0.5 Cash (Tax Free, Drag Free)
  if (remainingNeed > 0 && balances.cash > 0) {
    const amount = Math.min(remainingNeed, balances.cash);
    balances.cash -= amount;
    w.cash += amount;
    remainingNeed -= amount;
  }

  // 1. Standard Deduction Gap (Traditional IRA)
  // Strategy: Fill up to Standard Deduction with Traditional IRA (0% Effective Tax).
  if (remainingNeed > 0 && balances.traditional > 0) {
    const stdDed = getStandardDeduction(filingStatus, age);
    const headroom = Math.max(0, stdDed - currentOrdinary);

    if (headroom > 0) {
      const amount = Math.min(remainingNeed, balances.traditional, headroom);
      balances.traditional -= amount;
      w.traditional += amount;
      currentOrdinary += amount;
      remainingNeed -= amount;
    }
  }

  // 2. 0% LTCG Bucket (Brokerage)
  // Strategy: Fill the 0% Capital Gains bucket.
  // Limit: Taxable Income (Ordinary + LTCG) < Limit.
  // Note: Ordinary Income "pushes" LTCG up the brackets.
  if (remainingNeed > 0 && balances.brokerage > 0) {
    const ltcgCap = getLTCGLimit(filingStatus, 0.0); // Limit for 0%
    const stdDed = getStandardDeduction(filingStatus, age);

    // Taxable Ordinary (AGI - Deduction)
    const taxableOrdinary = Math.max(0, currentOrdinary - stdDed);

    // Room in 0% Bucket
    const room = Math.max(0, ltcgCap - taxableOrdinary - currentLTCG);

    if (room > 0) {
      const amount = Math.min(remainingNeed, balances.brokerage, room);
      balances.brokerage -= amount;
      w.brokerage += amount;
      remainingNeed -= amount;
      // Calculate Gain portion
      const gainRatio = getGainRatio(balances.brokerage + amount, brokerageBasis);
      // Note: Basis logic is tricky as we withdraw.
      // Simplified: Assume average cost basis for the account
      // Or LIFO if tracked? Let's use average basis calculation passed in?
      // Re-calculating gain based on global ratio for the account
      // Need total original balance to calc ratio correctly?
      // Approximation: Use current gain ratio
      // But brokerageBasis is an absolute amount?
      // Let's assume brokerageBasis is the total basis for the starting balance.
      // Gain Ratio = (Balance - Basis) / Balance.
      // We apply this ratio to the withdrawal.

      const totalBrok = balances.brokerage + amount; // Restoration to pre-withdrawal step state
      const ratio = (totalBrok > 0) ? Math.max(0, (totalBrok - brokerageBasis) / totalBrok) : 0;
      currentLTCG += (amount * ratio);

      // Update basis strictly? If we withdraw $10k and 1k is gain, 9k is basis.
      // brokerageBasis -= (amount * (1 - ratio));
      // For this function scope, we just track the Gain $ for tax.
    }
  }

  // 3. HSA (Buffer / Ordinary)
  // Using HSA as "Stealth IRA" or buffer before hitting higher brackets
  if (remainingNeed > 0 && balances.hsa > 0) {
    const amount = Math.min(remainingNeed, balances.hsa);
    balances.hsa -= amount;
    w.hsa += amount;
    // HSA withdrawals for non-medical are ordinary income + penalty if < 65.
    // Assuming 65+ for retirement withdrawals or medical reimbursement (tax free).
    // If medical, 0 tax. If not, Ordinary.
    // Logic Assumption: If used here in waterfall, likely Ordinary (retirement income).
    // But if treating as Medical reimbursement?
    // Let's conservatively assume Ordinary Income if Age > 65, else Penalty?
    // V2 Spec: "Use as Ordinary buffer".
    if (age >= 65) {
      currentOrdinary += amount;
    }
    remainingNeed -= amount;
  }

  // 4. Marginal Cap (Traditional IRA)
  if (remainingNeed > 0 && balances.traditional > 0) {
    const bracketLimit = getBracketCeiling(filingStatus, targetBracket);
    const stdDed = getStandardDeduction(filingStatus, age);
    const taxableOrdinary = Math.max(0, currentOrdinary - stdDed);
    const room = Math.max(0, bracketLimit - taxableOrdinary);

    console.log(`[WaterfallStep4] Need=${remainingNeed} Bal=${balances.traditional} Ord=${currentOrdinary} Taxable=${taxableOrdinary} Limit=${bracketLimit} Room=${room}`);

    if (room > 0) {
      const amount = Math.min(remainingNeed, balances.traditional, room);
      balances.traditional -= amount;
      w.traditional += amount;
      currentOrdinary += amount;
      remainingNeed -= amount;
    }
  }

  // 5. Roth IRA (Last Resort / Tax Free)
  // Preserve for legacy, but use if needed to avoid spiking tax rate.
  if (remainingNeed > 0 && balances.roth > 0) {
    const amount = Math.min(remainingNeed, balances.roth);
    balances.roth -= amount;
    w.roth += amount;
    remainingNeed -= amount;
  }

  // 6. Spillover (Brokerage - Pay Capital Gains)
  if (remainingNeed > 0 && balances.brokerage > 0) {
    const amount = Math.min(remainingNeed, balances.brokerage);
    balances.brokerage -= amount;
    w.brokerage += amount;
    remainingNeed -= amount;

    // Calc Gain
    const totalBrokStart = balances.brokerage + amount + w.brokerage; // Rough approx of starting
    // Better: We calculated ratio earlier.
    // Let's perform a clean ratio calc at top of function?
    // See Helper below.
    const ratio = getGainRatio(balances.brokerage + amount + w.brokerage, brokerageBasis);
    // Wait, w.brokerage includes step 2.
    // Ideally we define one ratio for the year.
    currentLTCG += (amount * ratio);
  }

  // 7. Spillover (Traditional - Blow the Bracket)
  if (remainingNeed > 0 && balances.traditional > 0) {
    const amount = Math.min(remainingNeed, balances.traditional);
    balances.traditional -= amount;
    w.traditional += amount;
    currentOrdinary += amount;
    remainingNeed -= amount;
  }

  // 8. Spillover (Crypto - High Vol/Tax)
  if (remainingNeed > 0 && balances.crypto > 0) {
    const amount = Math.min(remainingNeed, balances.crypto);
    balances.crypto -= amount;
    w.crypto += amount;
    remainingNeed -= amount;
    currentLTCG += amount; // Assume 100% gain or 0 basis for simplicity / conservative
  }

  // Roth Conversion (Constraint: Only if strict gap is met and no spillover? Or parallel?)
  // Spec: "Capacity Fill".
  if (allowRothConversion && remainingNeed === 0 && balances.traditional > 0) {
    const stdDed = getStandardDeduction(filingStatus, age);
    const taxableOrdinary = Math.max(0, currentOrdinary - stdDed);

    // Target Limit (e.g. top of 12% or 22%)
    const limit = getBracketCeiling(filingStatus, rothConversionBracket);

    // Capacity
    const capacity = Math.max(0, limit - taxableOrdinary);

    if (capacity > 0) {
      const amount = Math.min(capacity, balances.traditional);
      balances.traditional -= amount;
      balances.roth += amount;
      w.rothConversion += amount;
      currentOrdinary += amount;
    }
  }

  // Recalculate Total Capital Gains based on total brokerage withdrawn
  // To avoid the fractional mess above, let's do it cleanly here.
  const totalBrokerageWithdrawn = w.brokerage;
  const initialBrokBalance = balances.brokerage + totalBrokerageWithdrawn;
  const ratio = initialBrokBalance > 0 ? Math.max(0, (initialBrokBalance - brokerageBasis) / initialBrokBalance) : 0;

  const finalLTCG = (totalBrokerageWithdrawn * ratio) + w.crypto; // Crypto assumed 100% gain for now or need basis

  return {
    withdrawals: w,
    balances,
    totalOrdinaryIncome: currentOrdinary,
    totalCapitalGains: finalLTCG,
    qualifiedDividends, // Pass through
    totalWithdrawn: Object.values(w).reduce((sum, v) => sum + v, 0) - w.rothConversion // Conversion is not a "withdrawal" from portfolio
  };
}


// --- Helpers ---

function getGainRatio(currentBalance, basis) {
  if (currentBalance <= 0) return 0;
  return Math.max(0, (currentBalance - basis) / currentBalance);
}

function getBracketCeiling(filingStatus, targetBracket = 0.22) {
  const brackets = {
    single: { 0.12: 47150, 0.22: 100525, 0.24: 191950, 0.32: 243725 },
    head: { 0.12: 63100, 0.22: 100500, 0.24: 191950, 0.32: 243700 },
    married: { 0.12: 94300, 0.22: 201050, 0.24: 383900, 0.32: 487450 }
  };
  const limits = brackets[filingStatus] || brackets.single;
  return limits[targetBracket] || limits[0.22];
}

function getLTCGLimit(filingStatus, rate = 0.0) {
  // 0% LTCG Cap (Taxable Income)
  const caps = {
    single: 47150,
    head: 63100,
    married: 94300
  };
  return caps[filingStatus] || caps.single;
}

export function checkQCD(age, rmd, charitableIntent) {
  if (age < 70.5 || rmd <= 0) return { beneficial: false, reason: 'Age or RMD requirement not met' };
  const qcdAmount = Math.min(rmd, charitableIntent, 100000);
  if (qcdAmount > 0) {
    return {
      beneficial: true,
      qcdAmount,
      taxSavings: qcdAmount * 0.22,
      recommendation: `Consider QCD of $${qcdAmount.toLocaleString()} to reduce taxable RMD`
    };
  }
  return { beneficial: false, reason: 'No charitable intent or QCD not applicable' };
}
