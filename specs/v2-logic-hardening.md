# Feature Spec: Logic Hardening & CFA Validation (v2.1)

## The Goal
Transition from "Functional" to **"CFA-Grade Rigor."** The math must be bulletproof, handling circular tax dependencies and complex IRS rules (IRMAA/NIIT cliffs) with <$1 variance.

## 1. The "Death Spiral" (Circular Tax Logic)
**Decision: Iterative Solver (Convergence Method).**
- **Problem**: Withdrawing from Pre-Tax to pay taxes increases AGI, which increases Tax, which requires more Withdrawal.
- **Requirement**: Implement `solveForTax()` loop.
    - **Max Iterations**: 10.
    - **Convergence Threshold**: $1.00.
    - **Logic**: `NewWithdrawal = NetNeeded + CalculatedTax`. Recap tax based on `NewWithdrawal`. Repeat until `delta < $1`.

## 2. Spending Strategy Timing
**Decision: Beginning of Year (BOY) Valuation.**
- **Problem**: Spending rules (Guyton-Klinger) depend on Portfolio Value, but Portfolio Value depends on Taxes (which depend on Spending).
- **Requirement**: Break the circularity.
    1.  **Snaphsot**: Get `PortfolioValue_BOY` (End of Prev Year).
    2.  **Rule Check**: Calculate `AllowedSpending` based on `PortfolioValue_BOY`.
    3.  **Lock**: Fix `DiscretionarySpending` for the year.
    4.  **Execute**: Run Tax/Withdrawal engine with fixed spending.

## 3. The Widow's Step-Up (Tax Alpha)
**Decision: Explicit Basis Reset.**
- **Requirement**: In `yearOfDeath` (for 1st spouse), BEFORE any withdrawals:
    - **Brokerage & Crypto**: Set `asset.costBasis = asset.currentValue`.
    - **Impact**: Widow can sell assets for immediate cash flow (funeral, debts) at 0% Capital Gains tax.

## 4. Roth Optimization (The Scalpel)
**Decision: Capacity-Fill Model.**
- **Old Logic**: "Convert $50k."
- **New Requirement**: `ConversionAmount = max(0, TargetBracketTop - CurrentTaxableIncome)`.
- **Constraint**: Fill exactly to the rim. Do not spill over into the next bracket.

## 5. Smart Withdrawal Order (Strict Waterfall)
**Requirement**: The engine must adhere to this specific order to minimize lifetime tax:
1.  **Gap Filling**: Traditional IRA -> Fill Standard Deduction (0% Tax).
2.  **LTCG Floor**: Brokerage -> Fill 0% LTCG Bucket (~$96k MFJ). Avoid "Bump Zone."
3.  **Buffer**: HSA -> Use as Ordinary Income if needed.
4.  **Marginal Cap**: Traditional IRA -> Fill to user's Cap (e.g., 22%).
5.  **Last Resort**: Roth IRA -> Preserves tax-free growth for legacy.
