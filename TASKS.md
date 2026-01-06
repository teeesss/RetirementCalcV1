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
- [ ] **Withdrawal Rule Dollar Limits**: Add per-bucket dollar amount limits (e.g., max $50k from Brokerage per year)
- [ ] **Target Success Rate Optimizer**: Auto-dial withdrawals to reach a user-specified success rate (e.g., 90%)

---

## 🛠️ Maintenance & Logic Hardening (v2.0.2)
- [x] **Mortgage UI Reset Sync**: Synchronized Section 7 (Debt & Liab) with Section 8 (Real Estate). Edits to one now update both, and $245k default persists through cache clear.
- [x] **Mandatory Spending Enforcement**: Fixed "Bad Math" regression where withdrawal optimizer left a gap if tax bracket was reached. Added "Last Resort" step to fully fund expenses from Traditional assets.
- [x] **Ledger Sum Correction**: Included "Cash" withdrawals in `PlanDetailsTable` total sum for accurate reporting.
- [x] **Roth Conversion Logic**: Fixed critical array destructuring bug in `taxStrategy.js` preventing conversions.
- [x] **Startup Stability**: Fixed duplicate export in `ledgerLogic.js` causing white screen.

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
- [x] **Task 7.2: Single-Filer "Survivor" Modeling
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

See artifact `c:\Users\rayjo\.gemini\antigravity\brain\68553c37-43f9-41b7-a214-ae3ab10053e2\task.md` for detailed breakdown.
