
import { describe, it, expect } from 'vitest';
import { generateLedger as calculateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Jan 7 Regression Fixes', () => {

    it('should NOT duplicate Salary into Pension', () => {
        const profile = JSON.parse(JSON.stringify(defaultProfile));
        profile.salary = 100000;
        profile.pension = {
            primary: { amount: 0, startAge: 65, inflationAdjusted: false }
        }; // Force explicit 0 pension

        const ledger = calculateLedger(profile);
        const year0 = ledger[0];

        // Before fix: inflows.pension was taking 'income' (salary) -> 100000
        // After fix: pension should be 0 (the actual pension amount, not the config)
        expect(year0.metrics.detailedCashFlow.inflows.salary).toBe(100000);
        // The fix stores actual pension amount (0), not the salary value
        const pensionValue = typeof year0.metrics.detailedCashFlow.inflows.pension === 'number'
            ? year0.metrics.detailedCashFlow.inflows.pension
            : 0;
        expect(pensionValue).toBe(0);
        expect(pensionValue).not.toBe(100000); // Key assertion: NOT duplicating salary
    });

    it('should calculate FICA taxes when earning Salary', () => {
        const profile = JSON.parse(JSON.stringify(defaultProfile));
        profile.salary = 100000;
        profile.currentAge = 50;

        const ledger = calculateLedger(profile);
        const year0 = ledger[0];

        // FICA is ~7.65% of 100k = 7650
        // Before fix: earnedIncome default was 0 -> FICA 0
        expect(year0.taxes.fica.total).toBeGreaterThan(7000);
    });

    it('should correctly prioritize Roth Conversions if enabled', () => {
        // This validates the engine logic, ensuring the "Apply to Plan" actually does something logic-wise
        const profile = JSON.parse(JSON.stringify(defaultProfile));
        profile.taxOptimization.enableRothConversion = true;
        profile.taxOptimization.rothConversionTargetBracket = 0.24; // Aggressive
        profile.assets.traditional.client = 1000000;
        profile.salary = 50000; // Low income to allow room

        const ledger = calculateLedger(profile);
        const conversionYear = ledger.find(y => y.withdrawals.rothConversion > 0);

        expect(conversionYear).toBeDefined();
        expect(conversionYear.withdrawals.rothConversion).toBeGreaterThan(0);
    });
});
