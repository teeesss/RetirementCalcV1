# Tax Compliance & Logic Audit Report

**Date:** Jan 10, 2026
**Status:** 🔴 High Priority Issues Found

## Executive Summary

The static analysis of `src/lib/` revealed that while the core financial engines (`taxEngine`, `ssOptimizer`, `ledgerLogic`) are structurally sound, they are heavily reliant on **hard-coded 2024 tax constants** that are mislabeled as 2025. Additionally, key legislative updates from **SECURE Act 2.0** (specifically RMD age rising to 75) are missing.

## 🚨 Critical Findings (High Severity)

|        Component        | Issue                                                                                    | IRS Reference                                                                                               | Impact                                           |
| :---------------------: | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
|    **Tax Brackets**     | `FEDERAL_BRACKETS` uses **2024** limits (Top of 12% = $47,150) but claims to be 2025.    | [Rev. Proc. 2024-40](https://www.irs.gov/pub/irs-drop/rp-24-40.pdf)                                         | Incorrect tax projections for 2025+.             |
| **Standard Deduction**  | Uses **2024** Single ($14,600) instead of 2025 ($15,000).                                | [Rev. Proc. 2024-40](https://www.irs.gov/pub/irs-drop/rp-24-40.pdf)                                         | Underestimates disposable income.                |
|    **SS Wage Base**     | Hardcoded to **$168,600** (2024) instead of $176,100 (2025).                             | [SSA Fact Sheet 2025](https://www.ssa.gov/news/press/factsheets/colafacts2025.pdf)                          | Overestimates FICA tax for high earners.         |
|       **RMD Age**       | Logic uses `if (age < 73) return 0`. Sec 2.0 raises this to **75** for those born 1960+. | [SECURE 2.0 Act Sec. 107](https://www.irs.gov/pub/irs-pdf/p590b.pdf)                                        | RMDs triggered 2 years too early for many users. |
| **Contribution Limits** | 401(k) capped at **$23,000** (2024). 2025 limit is **$23,500**.                          | [IRS COLA 2025](https://www.irs.gov/newsroom/401k-limit-increases-to-23500-for-2025-ira-limit-remains-7000) | Limits savings potential in projections.         |
|      **QCD Limit**      | Hardcoded at **$100,000**. Indexed to inflation starting 2024 ($105k+).                  | [Notice 2023-75](https://www.irs.gov/pub/irs-drop/n-23-75.pdf)                                              | Caps charitable tax strategy incorrectly.        |

## ⚠️ Logic Warnings (Medium Severity)

- **Uniform Lifetime Table**: `taxEngine.js` uses a simplified object/interpolation (`calculateRMD`) that doesn't strictly match the full IRS Table III.
- **Rounding**: JavaScript float math is used throughout. IRS requires implicit rounding to nearest dollar for forms, but cents are allowed for calculations. We should ensure no "penny drift" accumulates.
- **SS Taxation**: `calculateTaxableSS` lacks specific logic for "Married Filing Separately" (live together vs apart rules), though MVP usually omits this.

## Code Mapping

| File             | Function              | Logic Implemented               | Status                    |
| ---------------- | --------------------- | ------------------------------- | ------------------------- |
| `taxEngine.js`   | `calculateFederalTax` | Progressive Brackets (Sec 1(j)) | ⚠️ Outdated (2024 values) |
| `taxEngine.js`   | `calculateFICA`       | FICA (Sec 3101)                 | ⚠️ Outdated Wage Base     |
| `taxEngine.js`   | `calculateNIIT`       | 3.8% Surtax (Sec 1411)          | ✅ Structurally Correct   |
| `taxEngine.js`   | `calculateTotalTax`   | Form 1040 logic aggregation     | ✅ Good Flow              |
| `taxEngine.js`   | `calculateRMD`        | RMD (Sec 401(a)(9))             | 🔴 Missing Age 75 Rule    |
| `ledgerLogic.js` | `generateLedger`      | Withdrawal Sequencing           | ✅ Looks standard         |
| `ssOptimizer.js` | `calculateSSBenefit`  | Actuarial Reductions            | ✅ Correct 5/9 rule       |

## Recommendations

1.  **Phase 2 Testing**: The upcoming test suite is **critical**. It will explicitly fail against the current 2024 hardcoded values, forcing an update.
2.  **Externalize Constants**: Move all `FEDERAL_BRACKETS`, `STANDARD_DEDUCTION`, etc. to `src/data/tax_2025.json` to prevent regression.
3.  **Refactor RMD**: Rewrite `calculateRMD` to check birth year for the 73/75 toggle.
