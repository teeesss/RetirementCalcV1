

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { usePlan } from './PlanContext';

const TaxStrategyContext = createContext();

export function TaxStrategyProvider({ children }) {
    const { planData, calculateLedger, ledger: baselineLedger } = usePlan();

    // Strategy Settings
    // 'rothStrategy': 'manual', '12', '22', '24'
    const [rothStrategy, setRothStrategy] = useState('manual');

    // 'ssDeferral': boolean (Force Primary to 70)
    const [ssDeferral, setSsDeferral] = useState(false);

    // v2.1: TCJA Sunset Toggle (Now in planData.assumptions)

    // 'strategicLedger': The result of the hypothetical run
    const [strategicLedger, setStrategicLedger] = useState(null);
    const [isCalculatingStrategy, setIsCalculatingStrategy] = useState(false);

    // Scenario Comparison State (v1.4)
    const [comparisonBaseline, setComparisonBaseline] = useState(null);
    const [comparisonProposed, setComparisonProposed] = useState(null);

    // Run the hypothetical simulation
    const runStrategy = useCallback(() => {
        if (!planData || !planData.assets) return;

        setIsCalculatingStrategy(true);

        // Deep clone planData to avoid mutating the baseline
        const hypotheticalData = JSON.parse(JSON.stringify(planData));

        // Apply Roth Strategy
        if (!hypotheticalData.taxOptimization) hypotheticalData.taxOptimization = {};
        hypotheticalData.taxOptimization.rothStrategy = rothStrategy;

        // Apply SS Deferral
        if (ssDeferral && hypotheticalData.socialSecurity && hypotheticalData.socialSecurity.primary) {
            // Force Primary to 70, leave Spouse as is (or optimize spouse too? video said "Bridging" usually implies delaying the big check)
            hypotheticalData.socialSecurity.primary.startAge = 70;
        }

        try {
            // Calculate without saving to global state (pass dataOverride)
            const result = calculateLedger(hypotheticalData);
            setStrategicLedger(result);
        } catch (e) {
            console.error("Strategic Calculation Failed", e);
        } finally {
            setIsCalculatingStrategy(false);
        }
    }, [planData, rothStrategy, ssDeferral, calculateLedger]);

    // Re-run strategy when settings change or baseline changes
    // Debounce this to avoid crushing the CPU
    useEffect(() => {
        const timer = setTimeout(() => {
            if (rothStrategy !== 'manual' || ssDeferral || planData.assumptions?.enableTCJASunset) {
                runStrategy();
            } else {
                setStrategicLedger(null); // Clear strategy if disabled
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [rothStrategy, ssDeferral, planData.assumptions?.enableTCJASunset, runStrategy]); // Fixed dependency array

    // Comparison Data Generators
    const comparisonData = useMemo(() => {
        if (!strategicLedger || !baselineLedger) return null;

        // Align years
        return baselineLedger.map((baseYear, index) => {
            const stratYear = strategicLedger[index];
            if (!stratYear) return null;

            return {
                age: baseYear.age,
                year: baseYear.year,
                baseline: {
                    netWorth: baseYear.netWorth,
                    totalTax: baseYear.taxes.totalTax,
                    taxableIncome: baseYear.taxes.taxableIncome,
                    rmd: baseYear.income.rmd,
                    legacy: baseYear.netWorth // Simplified legacy view
                },
                strategic: {
                    netWorth: stratYear.netWorth,
                    totalTax: stratYear.taxes.totalTax,
                    taxableIncome: stratYear.taxes.taxableIncome,
                    rmd: stratYear.income.rmd,
                    legacy: stratYear.netWorth
                },
                delta: {
                    netWorth: stratYear.netWorth - baseYear.netWorth,
                    taxSavings: baseYear.taxes.totalTax - stratYear.taxes.totalTax // Positive = Savings
                }
            };
        }).filter(Boolean);
    }, [baselineLedger, strategicLedger]);

    const value = {
        rothStrategy,
        setRothStrategy,
        ssDeferral,
        setSsDeferral,
        strategicLedger,
        comparisonData,
        isCalculatingStrategy,
        runStrategy,
        comparisonBaseline,
        setComparisonBaseline,
        comparisonProposed,
        setComparisonProposed
    };

    return <TaxStrategyContext.Provider value={value}>{children}</TaxStrategyContext.Provider>;
}

export function useTaxStrategy() {
    const context = useContext(TaxStrategyContext);
    if (!context) {
        throw new Error('useTaxStrategy must be used within TaxStrategyProvider');
    }
    return context;
}
