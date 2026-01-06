# Current Project State (Context for Agent)

## Project Status
- **Version**: v2.0 (Tax-Free Engine Complete)
- **Tech**: React 18, Vite, Tailwind, Web Workers for Monte Carlo.
- **Key Logic Files**:
  - `PlanContext.jsx`: Main state/ledger loop.
  - `taxEngine.js`: 2025 Federal Tax implementation.
  - `withdrawalOptimizer.js`: Logic for pulling funds.
  - `monteCarlo.worker.js`: Simulation engine.

## Current Data Structure
(Refer to `defaultProfile.json` structure: People array, Assets object, Expenses with phases).

## What Works
- Dual-life modeling.
- Basic 2025 Tax Code (Brackets, Std Deduction).
- Monte Carlo (Geometric Brownian Motion).
- Real Estate tracking.

## What is Missing / Needs Review
- **True Integration of Spending Strategies**: Strategies exist in `spendingStrategies.js` but aren't fully integrated into the `calculateLedger` loop.
- **State Tax Brackets**: Currently only flat rate.
- **Annuity Modeling**: Non-existent.
- **Persistence**: `planData` resets on reload.
