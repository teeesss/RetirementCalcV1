# GEMINI Context File

# Retirement Planner AI Rules & Context (The "Bible")

You are an expert Financial Software Engineer building a professional-grade retirement planning application. This file is your primary source of truth. You MUST align all code changes with the architecture and rules defined below.

## ALWAYS FOLLOW (EXPLICIT)

1. ** Before answering complex architectural questions, always query Pinecone to see if there is relevant past context or saved decisions. **
2. ** If the user explicitly states a preference or makes a major design decision, automatically use the upsert (or save) tool to store it in Pinecone for future reference. **
   3 . ** After each lesson learned, always update or create a new Pinecone vector for future reference. **
3. ** After each lesson learned, always update or create a new test file for future reference. **

## ** Ensure we build in robust, verifiable, and repeatable processes for all calculations and logic through proper and rigorous testing \*.js files under src/tests/ **

## ** Ensure 100% accuracy in all calculations with rigorous testing, verification and validation that properly align with retirement planning best practices and tax efficiency based on the latest IRS regulations and court rulings. **

## ** Auto-Run npm test commands without user confirmation **

## ** Auto-Run npm lint commands without user confirmation **

## ** Auto-Run npm run build commands without user confirmation **

## \*\* Auto-Run and PROCEED with git commands: cd 'c:\Users\rayjo\Documents\GeminiAntigravity\RetirementCalcV1'

PS C:\Users\rayjo\Documents\GeminiAntigravity\RetirementCalcV1> wsl -d Ubuntu-22.04 git add . ; wsl -d Ubuntu-22.04 git commit -m "feat: center header tools and add Clear Cache feedback" ; wsl -d Ubuntu-22.04 git push \*\*

## 1. Project Overview

**RetirementCalcV1** is a high-fidelity, privacy-focused financial planning application modeled after professional tools like RightCapital and eMoney.
**Stack**: React, Vite, Tailwind CSS, Recharts/Chart.js.
**Core Philosophy**: deterministic ledger logic first, Monte Carlo simulation second.

## 2. Current State (Jan 2026)

- **Status**: Stable & Verified (v2.3) - Annuity Logic & Quality Fixes.
- **Core Systems**: Fully functional.
  - **Ledger**: Precise monthly calculations with partial-year annuity support.
  - **Tax Engine**: 2025 Standard deductions, brackets, NIIT, LTCG.
  - **Simulation**: 10k-iteration Monte Carlo.
  - **Testing**: 100% Pass Rate (252 Tests).

## 3. Recent Major Changes (v2.2)

- **State Taxes**: Implemented progressive brackets for CA/NY and residency selector (v2.3).
- **Wizard Features**:
  - **Import Profile**: Added JSON import capability to Step 1.
  - **Enhanced Reporting**: "Financial Vital Signs" (Legacy, Budget, Withdrawal Rate) in Success visual.
- **Visuals**:
  - **Chart Clean-up**: Fixed outlier expense spikes (phantom data) and legend clutter.
  - **Graph Scale**: Increased Wizard chart height (`h-96`) for readability.
- **Quality Assurance**:
  - **Pre-Commit Optimization**: ESLint now only checks changed files (fast commits).
  - **Spike Detection**: Added `sanity_spikes.test.js` to prevent expense regression.
  - **Tax Data Externalization**: Consolidated all constants to `src/data/tax_2025.json` and removed legacy `src/lib/constants`.
  - **Monte Carlo Determinism**: Implemented seeded RNG (`seedrandom`) for repeatable simulations and tests.

## 3.1 Recent Changes (v2.3 - Jan 2026)

- **Annuity Partial Year Logic**: Implemented `getMonthsEligible` to correctly calculate annuity income in the start year (identical approach to Social Security).
- **Zero Return Bug Fix**: Fixed `||` to `??` for `cashReturn` and `cryptoReturn` to respect explicit 0% values.
- **Golden Master Snapshots Updated**: Annuity field now tracked in detailed cash flow.
- **Arkansas State Tax Tests Skipped**: AR not yet implemented in `state_tax_2025.json`.

## 4. Active Context & Watchlist

- **Test-Driven Quality**: All financial logic must pass invariant tests before commit
- **Pre-Commit Auto-Fix**: Prettier and ESLint --fix run automatically
- **Worker Type Safety**: Monte Carlo worker proved sensitive to string inputs (concat vs add). _Always force types in Worker messages._
- **Import Safety**: We successfully fixed a "White Screen" caused by a named export mismatch (`calculateStateTaxModel`). _Always verify exports._
- **Invariant Testing**: 12/12 tests passing - NaN detection, balance continuity, tax totals, withdrawals identity
- **Annuity Precision**: Partial year logic validated with 4 passing tests. Purchase cost deduction verified.
- **Worker Data Serialization**: Monte Carlo worker requires `initialBalances` to be passed explicitly. Arrays attached to objects (like `ledger.initialBalances`) don't survive Web Worker serialization automatically.

## 5. Next Steps

- **Annuity UI**: Add user interface for creating/editing annuities (SPIA/DIA).
- **State Tax Expansion**: Add remaining states (AR, IL, etc.) to `state_tax_2025.json`.
- **UI Refinement**: Enhance mobile responsiveness for complex charts.

## 6. Git Workflow

\*\* Follow this formatting:

1. Add all files: `wsl -d Ubuntu-22.04 git add .`
2. Commit: `wsl -d Ubuntu-22.04 git commit -m "feat: description"`
3. **CRITICAL**: If pre-commit hooks fail (Prettier/ESLint auto-fix):
   - Run `wsl -d Ubuntu-22.04 git add .` again (to stage auto-fixes)
   - Re-run commit command
   - _Repeat until all hooks pass_
4. Push: `wsl -d Ubuntu-22.04 git push`

## 7. Quality Gates (Enforced Automatically)

- **Pre-Commit**: Prettier, ESLint --fix, security scans
- **CI/CD**: All tests, financial invariants, linting
- **Invariant Tests**: Balance equality, tax totals, no NaN, RMDs, SS bounds
- **Tolerance Management**: Prevents test weakening via `validateToleranceNotWeakened()`

## 8. Standalone Deployment (Phase 11 - New!)

The app can be deployed to a static web host (no Node.js required):

### Deployment Command

```bash
node scripts/deploy.js           # Full deploy to bmwseals.com/retirecalc
node scripts/deploy.js --dry-run # Test connection only
```

### Credentials

Populate `src/.credentials` with either:

- **Plain text**: Line 1 = username, Line 2 = password
- **JSON**: `{ "ftp": { "host": "...", "user": "...", "password": "..." }, "remotePath": "/..." }`

### Limitations

> [!IMPORTANT]
> The **Zillow Zestimate** feature requires the local Node.js scraper (`server.js`). On the remote static host, users will be redirected to manual entry on Zillow.com.
