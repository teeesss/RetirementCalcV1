#Master Task List - Retirement Planner v2.0

## 🏆 Tax-Free Retirement Engine (v2.0) - ✅ COMPLETE!

**All 19 tasks implemented across 5 phases**

### ✅ Phase 1: Inventory & Structure (COMPLETE)

- Three Bucket Audit UI
- Roth Conversion Optimizer
- Cost Basis Tracker (integrated)

### ✅ Phase 2: Withdrawal Automation (COMPLETE)

- 0% Threshold Calculator
- Bucket #1 (Standard Deduction @ 0% tax)
- Bucket #2 (Brokerage @ 0% LTCG)
- Bucket #3 (Roth invisible withdrawals)
- Withdrawal Sequence UI

### ✅ Phase 3: Tax-Gain Harvesting (COMPLETE)

- Unrealized Gain Monitor
- Auto Harvest Calculator
- Wash Sale Prevention Guide

### ✅ Phase 4: MAGI Monitoring (COMPLETE)

- MAGI Dashboard (ACA/IRMAA tracking)
- ACA Subsidy Optimizer
- IRMAA Cliff Detector
- 2-Year Lookback Tracker

### ✅ Phase 5: KPI & Reporting (COMPLETE)

- Effective Tax Rate Monitor (<5% target)
- Principal vs Gain Ratio Tracker
- Portfolio Longevity Comparison
- November 15th Alert System

**Access:** Strategy → "🏆 Tax-Free Engine"

---

## ✅ Completed v1.4 Features

- Dynamic & Max Spending Strategies
- Legacy & Estate with Specific Bequests, ILIT
- Custom Withdrawal Rules
- Property Tax Field
- One-Time/Recurring Expenses
- Spending Phases UI
- QCD Logic, 0% Cap Gains, Dynamic MAGI
- Income Display Bug Fix

---

## 🧠 Future Enhancements (v2.1+)

- SS Survivor Benefit Optimization
- Healthcare/LTC Volatility Modeling
- GRAT (Grantor Retained Annuity Trust)

## 🐛 Bug Fixes & UI Improvements (v2.0.1)

- [x] **Withdrawal Rule Drag-and-Drop**: Fix reorder functionality in Create Withdrawal Rule UI
- [x] **Withdrawal Rule Dollar Limits**: Add per-bucket dollar amount limits (e.g., max $50k from Brokerage per year)
- [ ] **Target Success Rate Optimizer**: Auto-dial withdrawals to reach a user-specified success rate (e.g., 90%)

---

## 🛠️ Maintenance & Logic Hardening (v2.0.2)

- [x] **Mortgage UI Reset Sync**: Synchronized Section 7 (Debt & Liab) with Section 8 (Real Estate). Edits to one now update both, and $245k default persists through cache clear.
- [x] **Mandatory Spending Enforcement**: Fixed "Bad Math" regression where withdrawal optimizer left a gap if tax bracket was reached. Added "Last Resort" step to fully fund expenses from Traditional assets.
- [x] **Ledger Sum Correction**: Included "Cash" withdrawals in `PlanDetailsTable` total sum for accurate reporting.
- [x] **Roth Conversion Logic**: Fixed critical array destructuring bug in `taxStrategy.js` preventing conversions.
- [x] **Startup Stability**: Fixed duplicate export in `ledgerLogic.js` causing white screen.

---

## 🛡️ Logic Hardening & CFA Validation (v2.1) - ✅ COMPLETE!

- [x] **Iterative Tax Solver**: Resolved circular dependencies between Withdrawals and Tax Bill.
- [x] **Spending Strategy Integration**: Connected `spendingStrategies.js` to `ledgerLogic.js` loop.
- [x] **Survivor Logic**:
  - [x] Basis Step-Up (100% Community / 50% Common Law)
  - [x] Filing Status Transition (MFJ -> Single)
- [x] **Testing**: Added specialized suites `spending_strategy.test.js` and `survivor.test.js`.

---

## 🧪 Testing & Validation (v2.0)

- [x] Code Review - comprehensive audit of new tax engine files
- [x] Unit Tests - Create/Run tests for taxFreeEngine.js
- [x] Integration Tests - Verify PlanContext withdrawal logic
- [x] Full System Validation - Confirm no regressions in core planner

### 🛡️ Comprehensive Logic Validation

- [x] **Tax Engine**: Verify 2025 brackets, FICA, NIIT, IRMAA, LTCG accuracy
- [x] **Social Security**: Validate claiming age logic, PIA calculations, reductions
- [x] **Withdrawal Strategies**: Test Standard, Pro-Rata, and Tax-Efficient flows
- [x] **Spending Strategies**: Verify Dynamic, Max Spend, and Legacy goals
- [x] **Monte Carlo**: Confirm simulation statistics and percentile accuracy
- [x] **RMDs**: Test Required Minimum Distribution calculations (SECURE 2.0)
- [x] **Ancillary Engines**: Validate HECM, Custom Rules, LOC, and Bucket strategies

## 🏛️ Phase 7: HNW Alpha & Filing Status (COMPLETE)

- [x] **Task 7.1: TCJA Sunset Implementation**
  - [x] Update UI with "2026 Reversion" toggle
  - [x] Connect `enableTCJASunset` to `calculateLedger`
- [x] \*\*Task 7.2: Single-Filer "Survivor" Modeling
  - [x] "Spouse Longevity Gap" logic in `ledgerLogic.js`
  - [x] Auto-switch to Single Filer status upon death
- [x] **Task 7.3: DAF "Bunching" Strategy**
  - [x] DAF Contribution Input
  - [x] Bunching logic (Standard vs Itemized optimization)
- [x] **Task 7.4: Tax Torpedo (IRMAA/SS) Solver**
  - [x] IRMAA Cliff Guardrail in `withdrawalOptimizer.js`
  - [x] Marginal Tax Rate Visualization
- [x] **Task 7.5: Mega-Backdoor Roth**
- [x] **Task 7.6: CAPE-Adjusted Growth**
- [x] **Task 7.7: Community Property Step-up**
- [x] **Task 10: Monte Carlo Hardening & Historical Scenarios** (✅ COMPLETE)
  - [x] Fixed "Zero Spending" bug in worker
  - [x] Added Historical Scenario dropdown (Depression, 2008, etc.)
  - [x] Fixed spending scaling for monthly expense fields

## 🗺️ Phase 8: State Tax & UI Polish (In Progress)

- [x] **State Tax Logic**: Create data tables for CA, NY, AR, TX, FL.
- [x] **State Tax Integration**: Connect state logic to tax calculations.
- [x] **UI Update**: Centered Header layout with centered toolbelt ("The Architect").
- [x] **UI Update**: Advanced Growth & Drawdown Chart in Cash Flow tab.
- [x] **Testing**: Verify AR deduction logic and State Tax calculations.
- [x] **Maintenance**: Resolve all remaining lint errors and stabilize dev environment.

## 🐛 Critical Bug Fixes (Jan 2026)

- [x] **Monte Carlo Blank Charts**: Resolved data type mismatch in Worker causing zero results. Added type coercion and input safeguards.
- [x] **Mortgage Amortization**: Fixed precision bug leaving small remainder payments.
- [x] **UI Polish**: Standardized Monte Carlo charts (Tooltips, Titles, Y-Axis).

## 🛡️ CI/CD & Logic Hardening (v2.0.3)

- [x] **CI/CD Workflow Optimization**: Optimized GitHub Actions pipeline (removed redundant tests, enabled build verification).
- [x] **Pre-Push Quality Gate**: Configured local `npm test` checks before pushing (manual workflow established).
- [x] **Test Suite Hardening**:
  - [x] Fixed `spending_scaling.test.js` to run independently of default profile data.
  - [x] Corrected `unified_sanity.test.js` Effective Tax Rate calculation (using AGI denominator).
  - [x] Updated Golden Master snapshots for accurate regression testing.
- [x] **Wizard Chart UI**: Fixed Net Worth chart cut-off issue in the Wizard.

## ✨ v2.2 - Wizard & Reporting (Jan 10, 2026)

- [x] **Wizard Profile Import**: Added JSON file import to Step 1.
- [x] **Financial Vital Signs**:
  - [x] Pass/Fail Heuristics.
  - [x] Detailed Expense Breakdown (Age-labeled, Split Tax/Health).
  - [x] Withdrawal Rate with Dollar Amount.
- [x] **Graph Polish**:
  - [x] NetWorthChart Legend compacted to single line.
  - [x] Tooltips enhanced with expense breakdown sections.
- [x] **Performance**: Optimized Pre-commit hooks for speed.
