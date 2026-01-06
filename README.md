# Retirement Planner v2.0 - Professional Tax-Free Retirement Planning

A high-fidelity retirement planning application built with React, Vite, and Tailwind CSS.

## 🏆 NEW in v2.0: Tax-Free Retirement Engine

Achieve **0-5% effective tax rate** in retirement through intelligent withdrawal sequencing!

### Three-Bucket Strategy
- **Bucket #1:** Fill Standard Deduction from Traditional IRA ($30k/yr @ 0% tax)
- **Bucket #2:** Harvest capital gains from Brokerage ($96k/yr @ 0% LTCG rate)
- **Bucket #3:** Use "invisible money" from Roth IRA (unlimited @ 0% tax)
- **Result:** $126k+/year tax-free withdrawals for married couples!

### Complete Feature Set (19 Tasks)
✅ **Three Bucket Inventory** - Visual audit of Pre-Tax, After-Tax, Tax-Free accounts
✅ **Roth Conversion Optimizer** - Auto-calculate optimal annual conversions
✅ **Year-by-Year Withdrawal Visualizer** - See bucket breakdown for each year
✅ **Tax-Gain Harvesting Monitor** - Reset cost basis at 0% LTCG annually
✅ **MAGI Optimizer** - Maximize ACA subsidies, avoid IRMAA surcharges
✅ **2-Year Lookback Tracker** - Plan Medicare premiums 2 years ahead
✅ **KPI Dashboard** - Track lifetime effective tax rate, tax savings, portfolio longevity
✅ **November 15th Alerts** - Automated year-end planning reminders

**Access:** Strategy → "🏆 Tax-Free Engine"

---

## 🛡️ NEW in v2.1: Logic Hardening & CFA Validation

**Professional Grade Verification**
- **Survivor Logic**: Automatic Filing Status switching (MFJ -> Single) & Basis Step-Up (Community Property vs Common Law).
- **Spending Strategies**: Guyton-Klinger & Blanchett Smile mathematically verified.
- **Iterative Tax Solver**: "Penny-perfect" tax calculations resolving circular dependencies.

---

## ✨ v1.4 Features

### 🎯 Advanced Spending Strategies
- **Dynamic Actuarial (ARVA Method)** - Optimizes spending to reach exactly $0 at life expectancy
- **Max Spending (Die With Zero)** - Front-load spending during "Go-Go" years (e.g., ages 60-70)
- **Custom Withdrawal Rules** - Define age-based withdrawal sequences with flexible account preferences
- Blanchett Smile, Guyton-Klinger Guardrails, Floor & Ceiling strategies

### 🏛️ Legacy & Estate Planning
- **Specific Bequests** - Define cash gifts to specific beneficiaries
- **ILIT Support** - Irrevocable Life Insurance Trust modeling
- **Legacy Waterfall Chart** - Visualize estate flow from gross assets to net heirs
- Estate tax & IRD (Income in Respect of Decedent) calculations

### 💡 Tax Optimization
- QCD (Qualified Charitable Distributions) for RMD optimization
- 0% Capital Gains Harvesting
- Dynamic MAGI Management for ACA/IRMAA
- Asset Location Tax Optimization
- TCJA Sunset Modeling (2026+ brackets)

### 🔧 Bug Fixes
- Fixed dividend income display (ages 60-68 showing inflated income)
- Improved ledger calculation accuracy

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## 🧪 Testing

The application includes a comprehensive test suite using Vitest.

```bash
npm test
```

### Coverage
- **Tax Engine**: 2025 Brackets, NIIT, IRMAA, FICA
- **Financial Engines**: Tax-Free Withdrawals, Roth Conversion logic
- **Stress Tests**: Market crashes, sequence of returns risk

## 📖 Documentation

- **[TASKS.md](./TASKS.md)** - Current development status
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Detailed technical overview
- **[QUICKSTART.md](./QUICKSTART.md)** - User guide

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Chart.js** - Data visualization
- **React Query** - State management

## 📊 Core Features

### Financial Projections
- Monte Carlo simulations with correlated asset returns
- Tax-optimized withdrawal strategies
- RMD calculations
- Social Security optimization

### Tax Planning
- Complete 2025 US tax code implementation
- ACA subsidy calculations
- IRMAA surcharge modeling
- Roth conversion optimization

### Advanced Strategies
- Line of Credit (LOC) modeling
- Reverse Mortgage (HECM) integration
- Bucket strategy for volatility management
- Healthcare & LTC cost modeling

## 🎨 UI Components

Navigate via tabs:
- 📊 **Dashboard** - Overview & key metrics
- 👤 **Profile** - Personal & financial setup
- 📈 **Cash Flow** - Detailed year-by-year ledger
- 🎲 **Monte Carlo** - Probability analysis
- ⚙️ **Strategy** - Advanced planning tools
- ⚖️ **Tax & Legacy** - Tax optimization & estate planning

## 💼 Professional-Grade Features

This app rivals tools like **RightCapital**, **eMoney**, and **ProjectionLab** with:
- CFA/CFP-level accuracy
- Real-time recalculation
- Scenario comparison
- Stress testing
- Interactive visualizations

## 📝 License

MIT

## 🤝 Contributing

See `TASKS.md` for current development priorities.
