# Quick Start Guide

## Windows PowerShell Setup (5 minutes)

### 1. Check Node.js
```powershell
node --version
```
If not installed: Download from https://nodejs.org/ (LTS version)

### 2. Install Dependencies
```powershell
cd "C:\Users\rayjo\OneDrive\Documents\Downloads\!Retirement Calc AI\RP1v1a"
npm install
```

### 3. Run Development Server
```powershell
npm run dev
```

Browser opens automatically at `http://localhost:3000`

### 4. Build for Production (Optional)
```powershell
npm run build
npx serve dist
```

## First Use

1. **Review Default Profile**: The app loads with sample data (Age 49, Brokerage Basis 50%, Dual Income).
2. **Update Your Info**: Modify age, assets, cost basis, and spouse details in left sidebar.
3. **Set Property Tax**: Enter annual property tax in Profile → "5. Housing" (deductible with SALT cap).
4. **Configure Spending**: Set Essential vs Discretionary expenses.
5. **Spending Phases**: Adjust Go-Go/Slow-Go/No-Go spending levels by age in "9. Expenses".
6. **Custom Withdrawal Rules** (Optional): Strategy → "🎯 Custom Withdrawal Rules" for age-based account sequences.
7. **One-Time/Recurring Expenses** (Optional): Strategy → "📅 Expense Planning" for car purchases, travel budgets, etc.
8. **Calculate**: Plan calculates automatically (Unspent income flows to Brokerage).
9. **Run Monte Carlo**: Click "🎲 Run Monte Carlo" button to see probability of success.
10. **Optimize Social Security**: Click "✨ Optimize Strategy" to find best claiming age.

## 🏆 NEW: Tax-Free Retirement Engine (v2.0)

**Goal:** Achieve 0-5% effective tax rate in retirement!

### Quick Start
1. **Access:** Click "Strategy" tab → "🏆 Tax-Free Engine" subtab
2. **View KPI Dashboard:** See your lifetime effective tax rate and tax savings vs. traditional strategy
3. **Check Three Buckets:** Review Pre-Tax, After-Tax, Tax-Free allocation
4. **Optimize Roth Conversions:** Use  calculator to build "invisible money" bucket
5. **Monitor Withdrawals:** Use year-by-year viewer to see tax-free strategy in action
6. **Harvest Gains:** Check for 0% capital gains harvest opportunities
7. **Watch MAGI:** Ensure ACA subsidy qualification and avoid IRMAA cliffs

### The Three-Bucket Strategy
- **Bucket #1 (Traditional IRA):** Withdraw up to Standard Deduction ($30k married) = $0 tax
- **Bucket #2 (Brokerage):** Realize gains at 0% LTCG rate ($96k married) = $0 tax
- **Bucket #3 (Roth):** Unlimited "invisible" withdrawals = $0 tax
- **Total:** $126k+/year completely tax-free!

### Key Features
✅ **Real-Time MAGI Tracking** - Avoid losing ACA subsidies or triggering IRMAA surcharges
✅ **Tax-Gain Harvesting** - Reset cost basis annually at 0% LTCG
✅ **2-Year Lookback** - Plan Medicare premiums 2 years ahead
✅ **November 15th Alerts** - Automated year-end planning reminders
✅ **KPI Dashboard** - Track lifetime tax rate, savings, portfolio success

## 🚀 HNW Alpha Features (Phase 7)
Advanced tools for Net Worth >$2M:
- **TCJA Sunset**: Toggle "Legislative Risk" in Tax Strategy to see 2026 impact.
- **Tax Torpedo**: View Marginal Rate chart to avoid 50%+ tax spikes (IRMAA + SS).
- **DAF Bunching**: Toggle Charitable Bunching to front-load deductions.
- **Mega-Backdoor**: Enter After-Tax 401k contributions in Profile.
- **Survivor Plan**: Modeling step-up in basis and single-filer tax traps.

---

## v1.4 Features

### Custom Withdrawal Rules
Define age-based withdrawal sequences:
- Example: "Ages 60-65: Drain brokerage → Roth → Traditional"
- Location: Strategy → "💰 Spending Plans" → "🎯 Custom Withdrawal Rules"

### Expense Planning
- **One-time**: "$50k car at age 65"
- **Recurring**: "$5k/year travel from 60-75" (with inflation toggle)
- Location: Strategy → "📅 Expense Planning"

### Spending Phases
Automatic spending reduction by age:
- Go-Go: 100% (until Slow-Go age)
- Slow-Go: 85% at age 75+
- No-Go: 75% at age85+
- Location: Profile → "9. Expenses" → bottom section

## Explore Tabs

Switch between Cash Flow, Tax Summary, Net Worth, and Strategy views.

## Expected Results

With default profile:
- **Probability of Success**: ~80% ± 5%
- **Final Balance**: Should be positive
- **Lifetime Tax**: ~$500k - $800k range

## Troubleshooting

**Port in use?** Vite will auto-select next available port.

**Module errors?**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

**Build fails?**
```powershell
npm run build -- --force
```

## Need Help?

See `README.md` for full documentation.
