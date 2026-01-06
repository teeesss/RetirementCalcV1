# Consolidated Technical Architecture & Logic State

## 1. System Core ("The Physics")
- **God Object**: `src/contexts/PlanContext.jsx` holds `planData` and executes `calculateLedger()`.
- **Simulation**: `src/lib/monteCarlo.js` (and worker) runs 10k iterations using Geometric Brownian Motion.
- **Tax Engine**: `src/lib/taxEngine.js` implements 2025 Federal Tax Code (Brackets, FICA, NIIT, IRMAA, LTCG).
- **Withdrawal Brain**: `src/lib/withdrawalOptimizer.js` determines asset liquidation order.

## 2. The Financial Loop (`calculateLedger`)
The loop runs annually from `currentAge` to `lifeExpectancy` (Dual-Life/Survivor logic applied).
1.  **Inflation**: Indexes expenses and tax brackets (default 2.5%).
2.  **RMDs**: Calculated via IRS Uniform Lifetime Table 2024 (Age 73 start).
3.  **Expense Resolution**:
    - Essential vs. Discretionary (phased by Age: Go-Go, Slow-Go, No-Go).
    - Mortgage Amortization (floating point precision handled).
    - Healthcare (Medicare Part B/D + IRMAA cliffs).
4.  **Income Layer**: Wages + SS (Provisional Income Logic) + Pensions.
5.  **Gap Analysis & Withdrawal**:
    - **Surplus**: Flows to Brokerage.
    - **Deficit**: Triggers `withdrawalOptimizer.js`.
6.  **Tax Calculation**: Final tax bill computed on AGI. *Warning: Circular dependency potential (Withdrawals create Tax, Tax creates Withdrawals).*

## 3. Current Logic Implementation Status
- **Spending Strategies**: `spendingStrategies.js` exists (Blanchett, Guardrails) but is **NOT yet integrated** into the main ledger loop.
- **Tax-Free Engine (v2.0)**:
    - Bucket 1: Standard Deduction (Trad IRA).
    - Bucket 2: 0% LTCG (Brokerage).
    - Bucket 3: Roth (Invisible).
    - *Status*: "Bump Zone" avoidance and Standard Deduction filling are implemented.
- **Estate**: Step-up in basis implemented for Brokerage/Crypto.
- **Survivor**: "Widow's Tax Trap" logic exists (switching to Single filer status).

## 4. Known Logic Risks & Constraints
- **State Tax**: Currently a flat rate input. No specific state bracket logic.
- **Roth Optimization**: Currently a simple "Fill to Bracket" toggle. No NPV solver.
- **Persistence**: `planData` is in-memory only (resets on reload); only Scenarios persist to localStorage.
- **Floating Point**: Strict rules in place (`|| 0` defaults, small balance clamping) to prevent NaN propagation.

## 5. Critical Data Schema (Simplified)
- **People**: `[{id: 'client', birthDate: ...}, {id: 'spouse', ...}]`
- **Assets**: `{ traditional, roth, brokerage, hsa, crypto, realEstate }`
- **Liabilities**: `{ mortgage, credit (LOC, Reverse) }`
- **Tax Strategy**: `{ rothConversions: [], withdrawalOrder: 'optimal' }`
