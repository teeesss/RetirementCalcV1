# GEMINI Context File

## ** Ensure 100% accuracy in all calculations with rigorous testing, verification and validation that properly align with retirement planning best practices and tax efficiency based on the latest IRS regulations and court rulings. **

## ** Auto-Run npm test commands without user confirmation **

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
1. Add all files: git add .
2. Prepare a git commit -m "Commit Message... based on updates"
3. Prepare a git push (ask user to confirm prior to running)
4. If pre-commit hooks fail, run `pre-commit run --all-files` and commit the changes or simply do a git add . and then repeat the git commit -m "Commit Message... based on updates" and git push
