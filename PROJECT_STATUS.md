# LLM Review Guide - Retirement Planner v2.1

## 📋 Purpose
This document helps LLMs (or new developers) quickly understand what's been implemented, what's working, and what still needs work in the Retirement Planner application.

## 🏆 Major Milestone: Logic Hardening & CFA Validation (v2.1) COMPLETE!
**Professional Grade Verification & Regression Fixes**

**Key Achievements:**
- **Tax Loss Harvesting Persistence**: Created "Loss Bank" that persists carryforward losses across years, allowing for robust tax offsetting in future years (`tlh_audit.test.js` validated).
- **CFO Automation**: Implemented "Optimal" withdrawal ordering (Brokerage -> HSA -> Trad -> Roth) and "Fill 12% Bracket" logic correctly.
- **Crypto Rebalancing**: Automated rebalancing logic to prevent "Age 95 Anomaly" (crypto growing to 100% of portfolio). Now sells down to 20% cap.
- **Survivor Logic Verified**: Fixed critical Filing Status regression. Widows correctly transition to Single status the year AFTER death.
- **Monte Carlo Hardening (v2.1)**:
  - **Historical Scenario Stress Test**: Added 8 scenarios (Great Depression, 2008, etc.) to test plan robustness.
  - **Spending Fix**: Resolved critical bug where worker ignored spending (incorrect field name).
  - **Scaling Fix**: Fixed "Spend More/Less" logic to correctly scale monthly expense fields.
- **Regressions Fixed**:
  - **Sanity Growth**: Fixed crypto growth calculations to respect rebalancing caps.
  - **Waterfall Validation**: Fixed withdrawal order expectations to account for HSA prioritization.
  - **Roth Conversion**: Fixed bug preventing conversion deposits into empty Roth accounts.
  - **Lint Clean**: Fixed undefined variables (`calendarYear`) and missing imports in test suite.

**Tests**:
- Full Regression Suite (`npm test`) -> **GREEN** (32 Files, 168 Tests Passed).
- Build Verification (`npm run build`) -> **SUCCESS**.

---

## 🎯 Quick Start - Essential Files to Review

### 1. **Project Rules & Architecture** (READ FIRST)
- **`.cursorrules`** - The "Bible" - Strict rules, data schema, SOPs
- **`OVERVIEW.md`** - High-level architecture and technical deep dive
- **`README.md`** - User-facing documentation and setup instructions

### 2. **Core Application Files**
- **`src/App.jsx`** - Main application component
- **`src/contexts/PlanContext.jsx`** - "God Object" managing `ledger` calculation loop

### 3. **Financial Logic Libraries**
- **`src/lib/ledgerLogic.js`** - **The Heart**. Contains the annual simulation loop, rebalancing, death logic, and cash flow tracking.
- **`src/lib/taxEngine.js`** - 2025 US Tax Code implementation (Federal, FICA, NIIT, IRMAA).
- **`src/lib/withdrawalOptimizer.js`** - "CFO" logic for optimal extraction ordering.

### 4. **Tests (The Safety Net)**
- **`src/tests/sanity_growth.test.js`** - Verifies compounding math.
- **`src/tests/waterfall_validation.test.js`** - Verifies correct asset liquidation order.
- **`src/tests/survivor.test.js`** - Verifies death/step-up/status logic.
- **`src/tests/tlh_audit.test.js`** - Verifies Tax Loss Harvesting carryovers.

---

## 🧠 PROJECT STATUS - Retirement Planner

> **Last Updated:** January 6, 2026 (v2.1 Logic Hardening)
> **Purpose:** Comprehensive status guide for LLM review and onboarding
> **Quick Start:** Read `.cursorrules` first, then this file, then dive into code

---

## ✅ What's Working (Fully Implemented)

### Core Functionality
- ✅ Dual-life household modeling (Client + Spouse)
- ✅ Annual ledger calculation with inflation
- ✅ RMD calculations (IRS Uniform Lifetime Table 2024)
- ✅ Spending phases (Go-Go, Slow-Go, No-Go)
- ✅ Complete 2025 US tax code fidelity
- ✅ Monte Carlo simulation with Web Worker
- ✅ **Logic Hardening**: Robust checking of growth, tax, and survival edge cases.

### Advanced Features
- ✅ **CFO Automation**: Dynamic tax-bracket filling and optimal withdrawal sourcing.
- ✅ **Tax Loss Harvesting**: Carryforward losses tracked indefinitely.
- ✅ **Crypto Management**: Rebalancing caps prevents unrealistic portfolio concentration.
- ✅ **Estate Planning**: Step-up in basis (50% or 100%) and Estate Tax exemption inflation.

---

## 🐛 Known Bugs / Issues

### Recently Fixed (v2.1)
- ✅ **Testing Regressions**: Fixed 5 failing test suites caused by new logic (Rebalancing, HSA Priority).
- ✅ **Roth Conversion**: Fixed bug where conversions into empty accounts failed.
- ✅ **Filing Status**: Fixed logic where widows remained "Married" indefinitely.
- ✅ **Lint/Build**: Cleaned up undefined variables and build warnings.

### Active Issues
- None. Application is stable and production-ready.

---

## 🚀 Next Steps (Phase 7 - Future)
- **State-Specific Tax Brackets**: Currently uses flat rate. Need bracket models for CA, NY, etc.
- **Annuity Modeling**: SPIA/DIA product support.
- **UI Refinement**: Enhance mobile responsiveness for complex charts.

---

**Last Updated**: 2026-01-06 (v2.1 Logic Hardening COMPLETE)
**Status**: ✅ **STABLE & VERIFIED** - Ready for Release.
