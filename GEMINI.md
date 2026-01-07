# GEMINI Context File

## ** Ensure 100% accuracy in all calculations with rigorous testing, verification and validation that properly align with retirement planning best practices and tax efficiency based on the latest IRS regulations and court rulings. **

## ** Ensure we build in robust, verifiable, and repeatable processes for all calculations and logic through proper and rigorous testing *.js files under src/tests/ **

## ** Auto-Run npm test commands without user confirmation **
## ** Auto-Run npm lint commands without user confirmation **
## ** Auto-Run npm run build commands without user confirmation **
## ** Auto-Run and PROCEED with git commands:  cd 'c:\Users\rayjo\Documents\GeminiAntigravity\RetirementCalcV1'
PS C:\Users\rayjo\Documents\GeminiAntigravity\RetirementCalcV1> wsl -d Ubuntu-22.04 git add . ; wsl -d Ubuntu-22.04 git commit -m "feat: center header tools and add Clear Cache feedback" ; wsl -d Ubuntu-22.04 git push **

## 1. Project Overview
**RetirementCalcV1** is a high-fidelity, privacy-focused financial planning application modeled after professional tools like RightCapital and eMoney.
**Stack**: React, Vite, Tailwind CSS, Recharts/Chart.js.
**Core Philosophy**: deterministic ledger logic first, Monte Carlo simulation second.

## 2. Current State (Jan 2026)
*   **Status**: Stability & Polish Phase.
*   **Core Systems**: Fully functional.
    *   **Ledger**: Precise monthly calculations for SS and RMDs.
    *   **Tax Engine**: 2025 Standard deductions, brackets, NIIT, LTCG.
    *   **Simulation**: 10k-iteration Monte Carlo with Web Workers.

## 3. Recent Major Changes
*   **Date Precision**: Refactored from integer-based `age` to `birthDate` drivers.
    *   *Note*: `age` is still used for UI display, but `getMonthsEligible` handles logic.
*   **Chart UI**: Standardized tooltips across Net Worth and Cash Flow charts.
    *   Use `interaction: { mode: 'index' }` for stacked charts.
*   **Mortgage**: Added "Mortgage Strategy" section to Expense Planning and linked it from CFO Report.

## 4. Active Context & Watchlist
*   **Import Safety**: We successfully fixed a "White Screen" caused by a named export mismatch (`calculateStateTaxModel`). *Always verify exports.*
*   **Inflation**: Default inflation logic was buggy (`|| 2.5`). Now using `?? 2.5`. Watch for similar legacy patterns.
*   **Survivor Logic**: Fixed a bug where single users were treated as survivors.

## 5. Next Steps
*   **UI Polish**: Continue aligning other charts (e.g., Tax Bracket fill) to new tooltip standards.
*   **Testing**: Add more unit tests for the new `ExpenseManagement` mortgage logic.

## 6. Git
** Follow this formatting:
wsl -d Ubuntu-22.04 git commit -m "feat: UI compaction + fix income surplus logic in withdrawal optimizer"
1. Add all files: wsl -d Ubuntu-22.04 git add .
2. Prepare a wsl -d Ubuntu-22.04 git commit -m "Commit Message... based on updates"
3. Prepare a wsl -d Ubuntu-22.04 git push (ask user to confirm prior to running)
4. If pre-commit hooks fail, run `pre-commit run --all-files` and commit the changes or simply do a wsl -d Ubuntu-22.04 git add . and then repeat the wsl -d Ubuntu-22.04 git commit -m "Commit Message... based on updates" and wsl -d Ubuntu-22.04 git push
