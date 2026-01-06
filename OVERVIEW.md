# Retirement Calculator AI - System Deep Dive

## ⚠️ For LLM Agents
This document provides High-Level Architecture. For **Strict Rules, Data Schema, and SOPs**, refer to **`.cursorrules`** (The Bible).

---

## 1. Core Architecture
- **Framework**: React 18 + Vite (ES Modules).
- **Styling**: Tailwind CSS (Dark Mode enabled via `dark:` classes).
- **State Management**: `src/contexts/PlanContext.jsx` holds the "God Object" `planData` and the calculation results `ledger`.
- **Persistence**: Currently purely in-memory (resets on reload). Relies on `src/data/defaultProfile.json` for initial state.
- **Charts**: `react-chartjs-2` used for deterministic charting.
- **Worker**: `src/workers/monteCarlo.worker.js` handles simulation (Isolated Thread).

---

## 2. The Financial Engine (`src/contexts/PlanContext.jsx`)
The calculation engine supports **Dual-Life Households**. The annual loop (`calculateLedger`) projects cash flows through the `lifeExpectancy` of the longest-living member.

### Core Data Structure:
- **`people` Array**: Replaces flat profile fields. Contains objects: `[{id: 'client', ...}, {id: 'spouse', ...}]`.
- **Longevity Handling**: The loop runs until *everyone* is deceased, allowing for realistic survivor modeling (SS step-ups, tax filing status shifts).

### Step-by-Step Annual Loop:
1.  **Inflation**: All expenses and tax brackets are indexed by `inflation` (default 2.5%).
2.  **RMDs**: Compulsory withdrawals calculated from Traditional balances starting at age 73 (using IRS Uniform Lifetime Table 2024).
3.  **Expenses**:
    *   **Base**: `Essential` + `Discretionary`.
    *   **Phases**: "Go-Go" (100%), "Slow-Go" (85%), "No-Go" (70%) multipliers applied to real-dollar spend.
    *   **Liabilities**: Mortgage principal/interest tracked with precision (floating point tails eliminated).
    *   **Healthcare**: Medicare Premiums (Part B + D) added automatically at age 65.
4.  **Income**:
    *   **Wages**: Taxable as Ordinary Income.
    *   **Social Security**: Taxability depends on "Provisional Income" (0%, 50%, or 85% taxable).
    *   **Pensions**: Fully taxable.
5.  **Withdrawal Strategy** (`src/lib/withdrawalOptimizer.js`):
    *   **Standard Order**: RMDs -> Brokerage -> Traditional -> Roth.
    *   **Tax Efficient (Smart Strategy 2026)**:
        1.  **Standard Deduction (Traditional)**: Fill the 0% Ordinary Income bucket first (~$29k).
        2.  **Brokerage (0% LTCG)**: Fill the 0% Capital Gains bucket (~$94k).
        3.  **Bump Zone Avoidance**: Priority given to Brokerage (15%) over Ordinary (10/12%) when filling gaps prevents displacing 0% LTCG (effective 25% rate).
        4.  **HSA**: Stealth IRA / Ordinary Income buffer.
        5.  **Crypto**: Long-Term Capital Gains.
        6.  **Roth**: **LAST**. Strategic preservation for tax-free growth.
    *   **Optimization**: "Bump Zone" logic ensures we don't spike into high effective rates unnecessarily.
    *   **Guardrails**: If portfolio drops >20% from peak, Discretionary spending is cut by 10-30% (Guyton-Klinger style).
6.  **Taxation** (`src/lib/taxEngine.js`):
    *   Calculates final tax bill *after* withdrawals are determined.
    *   Iterative solve might be required (currently linear approximation).

---

## 2a. Strategic Tax Optimization ("The Architect") 🏛️
*New in v1.2*: We now support "Hypothetical Scenario" modeling to maximize lifetime wealth.
*   **Gap Analysis**: Compares "Status Quo" (do nothing) vs "Strategic Plan" (Torching the IRA).
*   **Roth Conversions**: Automatically fills up to user-selected bracket (22% or 24%) during low-income years (2026-2032).
*   **Social Security Bridge**: Delaying benefits to Age 70 while spending down Traditional balances to 1) avoid Torpedo Tax and 2) Maximize guaranteed income.
*   **IRMAA Awareness**: Strategy engine avoids crossing Medicare surcharge cliffs.

## 2b. Strategic Philosophy ("Stealth IRA") 🚀
We follow the **Mathematical Optimal Order** provided by financial doctrine (HSA Triple Tax Advantage):

### Contribution Priority ("Accumulation")
1.  **401(k) Match**: "Free Money".
2.  **HSA (Max)**: The "Stealth IRA". Deducitble In, Tax-Free Growth, Tax-Free Out (Medical).
3.  **Roth IRA**: Tax-free growth + Flexibility.
4.  **Traditional 401(k)**: Fill remaining tax-deferred space. (Includes Employer Match).
5.  **Brokerage**: Unlimited overflow (Surplus Savings).

### Withdrawal Priority ("Decumulation")
1.  **Brokerage**: Stop tax drag immediately.
2.  **Traditional**: Burn Ordinary Income first to suppress RMDs.
3.  **HSA (Non-Medical)**: Use as Ordinary Income buffer (before Roth) to preserve the "Golden Egg".
4.  **Crypto**: Long-Term Capital Gains (Deferral).
5.  **Roth**: **LAST**. The ultimate legacy asset (Tax-Free Inheritance).

---

## 3. Tax Fidelity (`src/lib/taxEngine.js`)

### Federal Income Tax (2025 Law)
- **Brackets**: 7-tier progressive system (10% to 37%).
- **Standard Deduction**: Single ($14,600), MFJ ($29,200).
- **Age 65+ Bump**: Additional standardized deduction amount added.

### Capital Gains & Dividends
- **Buckets**: 0%, 15%, 20%.
- **Stacking**: Gains sit *on top* of Ordinary Income to determine rate.
- **NIIT**: 3.8% Surtax on lesser of (Net Investment Income) or (MAGI - $200k/$250k).

### FICA (Payroll Taxes)
- **Social Security**: 6.2% up to Wage Base ($168,600).
- **Medicare**: 1.45% unlimited + 0.9% Additional Medicare Tax over $200k/$250k.

### Healthcare / ACA
- **Pre-65**: ACA Premium Tax Credits derived from FPL (Federal Poverty Level).
    - Sliding scale contribution (0% to 8.5% of income).
    - "Cliff" removed (Inflation Reduction Act logic).
- **Post-65**: IRMAA (Income-Related Monthly Adjustment Amount).
    - 2-Year Lookback on MAGI.
    - Surcharge tiers for Part B & D.

---

## 4. Monte Carlo Simulation (`src/lib/monteCarlo.js`)
Uses **Geometric Brownian Motion (GBM)** with Cholesky Decomposition for correlated assets.

### Algorithm
- **Inputs**: `equityReturn` (μ), `equityVolatility` (σ), `cryptoReturn`, `cryptoVolatility`, `correlation` (ρ).
- **Math**:
    - Generates correlated standard normal variables ($z_1, z_2$) using Box-Muller transform.
    - Applies Cholesky matrix to correlate returns.
    - $Return = \mu + \sigma \cdot z$
- **Performance**:
    - Runs 1,000 to 10,000 iterations in-browser.
    - Calculates P10, P50, P90 percentiles for "Cone of Uncertainty".

---

## 5. UI Components

### Interactive Elements
- **`SocialSecurityOptimizer.jsx`**:
    - Visualizes cumulative benefits (Age 62 vs 67 vs 70).
    - Calculates "Break-Even Age".
- **`TaxSummary.jsx`**:
    - Heatmap of tax pressure by age.
    - Detailed table: Federal, State, FICA, Cap Gains, NIIT, ACA Credits.
- **`CashFlowChart.jsx`**:
    - Stacked Bar Chart showing source of funds (Wages vs Withdrawals) vs Uses (Expenses vs Taxes).

### Input Handling
- **`SmartInput.jsx`**: Handles currency formatting (k/m suffixes) and parsing to prevent string/number type errors.

### Advanced Strategy Tools (`src/components/strategy/`)
*New in v1.3*: Comprehensive suite of visualization and stress testing tools for retirement plan analysis.

- **`ProbabilityGauge.jsx`**:
    - Animated circular gauge displaying Monte Carlo success rate
    - Color-coded risk levels (Green/Yellow/Orange/Red)
    - Real-time updates from simulation results

- **`ConfidenceBand.jsx`**:
    - Chart.js "cone of uncertainty" visualization
    - Shows 5th, 10th, 25th, 50th, 75th, 90th, 95th percentiles
    - Projects portfolio balance trajectories over time

- **`SpendingSettings.jsx`**:
    - UI for selecting dynamic withdrawal strategies
    - Strategies: Fixed Dollar, Fixed %, Blanchett Smile, Guyton-Klinger Guardrails, Floor & Ceiling
    - Configurable guardrail parameters (floor/ceiling percentages, adjustment rates)
    - Settings persist to localStorage via PlanContext

- **`ScenarioComparisonChart.jsx`**:
    - Side-by-side bar chart comparison of retirement scenarios
    - Metrics: Ending Wealth, Total Taxes, Success Rate, Net Worth Growth
    - Visual difference indicators (better/worse highlighting)

- **`CashFlowWaterfall.jsx`**:
    - Detailed year-by-year cash flow breakdown
    - Inflows: Salary, Social Security, Pension, Withdrawals by account type
    - Outflows: Expenses (Essential/Discretionary/Healthcare), Taxes (Federal/State/FICA)
    - Net cash flow calculation with surplus/deficit indicators

- **`StressTestDashboard.jsx`**:
    - Interactive stress testing with real-time sliders
    - Shocks: Market Drop (-50%), Social Security Cut (-30%), Longevity (+15 years), Inflation (+5%)
    - Recalculates Monte Carlo with applied shocks
    - Shows success rate impact and wealth at risk

---

## 6. Known Limitations & Roadmap

### Missing / TODO
1.  **Roth Conversion Optimizer**: Currently we have a simple "Fill Bracket" toggle. A true optimizer would solve for the "Wait vs Pay Now" equilibrium over 30 years.
2.  **Local Storage**: Scenarios are persisted, but main planData is not persisted between reloads.
3.  **Specific State Tax**: Only detailed Federal logic exists. State tax is a flat rate input.
4.  **Annuities**: No specific module for SPIA/DIA products.

### Performance
- **Monte Carlo**: High iteration counts (>10k) are handled by Web Worker to prevent UI freezing.

---

## 7. Development Guidelines
- **Modifying Tax Logic**: always check `src/lib/taxEngine.js`.
- **Adding specific laws**: Use 2025 IRS Publications as reference.
- **Unit Tests**: Comprehensive Vitest suite exists (`src/tests/`). Validity of financial engines relies on `golden_master` and specific logic tests (`roth_conversion.test.js`, `taxFreeEngine.test.js`).
