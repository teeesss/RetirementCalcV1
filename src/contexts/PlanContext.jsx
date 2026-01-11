/* eslint-disable react-refresh/only-export-components */
/**
 * Plan Context - Global state management for retirement plan
 *
 * Uses React Context API to manage:
 * - Profile data (age, filing status, assets, etc.)
 * - Cash flow calculations
 * - Monte Carlo results
 * - Scenario management
 *
 * @module PlanContext
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import defaultProfile from '../data/defaultProfile.json';
import blankProfile from '../data/blankProfile.json';
import { generateLedger } from '../lib/ledgerLogic';

// Create the context
export const PlanContext = createContext();

// Helper functions moved to src/lib/ledgerLogic.js

/**
 * PlanProvider - Context provider component
 */
// calculateACASubsidy is now imported from taxEngine

export function PlanProvider({ children }) {
  const [isRaySession] = useState(
    () => new URLSearchParams(window.location.search).get('profile') === 'ray'
  );
  const storageKey = isRaySession ? 'retirement_planData_ray' : 'retirement_planData';

  const [planData, setPlanData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        let parsed = JSON.parse(saved);

        // Anti-Leak: If we are in a normal session but the data is Ray's template, reset to blank.
        if (!isRaySession) {
          const isRayData =
            parsed.people?.[0]?.name === 'Me' && parsed.people?.[0]?.birthDate === '1976-07-01';
          if (isRayData) {
            console.log('PlanContext: Sanitizing leaked Ray profile from local draft.');
            parsed = JSON.parse(JSON.stringify(blankProfile));
          }
        }

        if (parsed.assets && parsed.people) {
          // Migration & Sanitization
          if (!parsed.settings)
            parsed.settings = defaultProfile.settings || { apiKeys: { rentcast: '' } };
          if (!parsed.settings.apiKeys) parsed.settings.apiKeys = { rentcast: '' };

          if (Array.isArray(parsed.people) && parsed.people.length > 0) {
            parsed.people = parsed.people.map((p) => ({
              ...p,
              age: Number(p.age) || 50,
              lifeExpectancy: Number(p.lifeExpectancy) || 90,
              retirementAge: Number(p.retirementAge) || 65,
            }));
          } else {
            return isRaySession ? defaultProfile : blankProfile;
          }

          if (!parsed.mortgage) parsed.mortgage = defaultProfile.mortgage;

          // MIGRATION: Sanitize Goals
          if (parsed.goals && Array.isArray(parsed.goals)) {
            parsed.goals = parsed.goals.filter((g) => {
              const isRogue60 = g.age === 60 && g.amount === 3500000;
              const isRogue75 = g.age === 75 && g.amount === 6000000;
              return !(isRogue60 || isRogue75);
            });
          }

          // MIGRATION: Zero out legacy default expenses (Hotfix for existing sessions)
          if (parsed.expenses) {
            const {
              essentialMonthly,
              discretionaryMonthly,
              medicarePre65,
              medicarePost65,
              recurring,
              oneTime,
            } = parsed.expenses;

            // Check for exact legacy combinations or specific legacy values
            const isLegacyMonthly = essentialMonthly === 4500 && discretionaryMonthly === 1500;

            if (isLegacyMonthly) {
              parsed.expenses.essentialMonthly = 0;
              parsed.expenses.discretionaryMonthly = 0;
              parsed.expenses.oneTime = []; // Clear Rogue Spikes
              parsed.expenses.recurring = [];
              parsed.goals = []; // Clear Rogue Goals
            }

            if (medicarePre65 === 200 || medicarePre65 === undefined)
              parsed.expenses.medicarePre65 = 0;
            if (medicarePost65 === 200 || medicarePost65 === undefined)
              parsed.expenses.medicarePost65 = 0;

            // Remove legacy default recurring expense "Travel" $40k
            if (recurring && Array.isArray(recurring)) {
              parsed.expenses.recurring = recurring.filter(
                (e) => !(e.name === 'Travel' && e.amount === 40000 && e.startAge === 53)
              );
            }

            // Remove legacy default one-time expense "New Car" $60k
            if (oneTime && Array.isArray(oneTime)) {
              parsed.expenses.oneTime = oneTime.filter(
                (e) => !(e.name === 'New Car' && e.amount === 60000 && e.age === 58)
              );
            }
          }

          // MIGRATION: Fix Real Estate if corrupted
          const primaryRE = parsed.realEstate?.[0];
          if (!parsed.realEstate || (primaryRE && primaryRE.currentValue === 0 && isRaySession)) {
            if (isRaySession) parsed.realEstate = defaultProfile.realEstate;
          }

          return parsed;
        }
      }

      // Default fallback: Ray profile only if param is present, otherwise blank.
      return isRaySession ? defaultProfile : blankProfile;
    } catch (e) {
      console.warn('Failed to load planData', e);
      return isRaySession ? defaultProfile : blankProfile;
    }
  });
  const [ledger, setLedger] = useState([]);
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [scenarios, setScenarios] = useState(() => {
    try {
      const saved = localStorage.getItem('retirement_scenarios');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Spending strategy state
  const [spendingStrategy, setSpendingStrategy] = useState(() => {
    try {
      const saved = localStorage.getItem('spending_strategy');
      return saved || 'fixed';
    } catch (e) {
      return 'fixed';
    }
  });

  const [guardrails, setGuardrails] = useState(() => {
    try {
      const saved = localStorage.getItem('guardrails');
      return saved
        ? JSON.parse(saved)
        : { floorPercent: 0.85, ceilingPercent: 1.2, adjustmentRate: 0.1 };
    } catch (e) {
      return { floorPercent: 0.85, ceilingPercent: 1.2, adjustmentRate: 0.1 };
    }
  });

  // Persist scenarios to localStorage
  useEffect(() => {
    localStorage.setItem('retirement_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  // Persist planData to localStorage
  useEffect(() => {
    // Debounce slightly to avoid rapid writes
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(planData));
    }, 500);
    return () => clearTimeout(timer);
  }, [planData, storageKey]);

  /**
   * Update plan data
   */
  const updatePlan = useCallback((updates) => {
    setPlanData((prev) => {
      const updated = { ...prev };

      // Deep merge for nested objects
      Object.keys(updates).forEach((key) => {
        if (
          typeof updates[key] === 'object' &&
          !Array.isArray(updates[key]) &&
          updates[key] !== null
        ) {
          updated[key] = { ...updated[key], ...updates[key] };
        } else {
          updated[key] = updates[key];
        }
      });

      return updated;
    });
  }, []);

  /**
   * Calculate cash flow ledger for all years
   */
  const calculateLedger = useCallback(
    (dataOverride = null) => {
      setIsCalculating(true);

      // Use override data if provided, otherwise generic state
      const currentData = dataOverride || planData;
      const isHypothetical = !!dataOverride;

      console.log('DIAGNOSTIC: calculateLedger starting...', { isHypothetical });
      try {
        if (!currentData || !currentData.people || !currentData.assets) {
          console.warn('DIAGNOSTIC: planData incomplete, skipping ledger calculation', {
            currentData,
          });
          setIsCalculating(false);
          return;
        }

        const ledger = generateLedger(currentData, spendingStrategy, guardrails);

        if (!isHypothetical) {
          setLedger(ledger);
        }
        setIsCalculating(false);
        return ledger;
      } catch (error) {
        console.error('Error calculating ledger:', error);
        setIsCalculating(false);
        throw error;
      }
    },
    [planData, spendingStrategy, guardrails]
  );

  /**
   * Auto-recalculate on plan changes
   */
  useEffect(() => {
    calculateLedger();
  }, [planData, spendingStrategy, guardrails, calculateLedger, planData.realEstate]); // Fixed: Added realEstate dep for linter

  const calculateSuccess = useMemo(() => {
    if (!ledger.length) return null;
    const final = ledger[ledger.length - 1];
    return {
      success: final.totalBalance > 0,
      finalBalance: final.totalBalance,
      lifetimeTax: ledger.reduce((sum, year) => sum + (year.taxes?.totalTax || 0), 0),
    };
  }, [ledger]);

  /**
   * Save current plan as a scenario
   */
  /**
   * Helper to calculate key metrics for a scenario
   */
  const calculateScenarioMetrics = useCallback((currentLedger = [], mcResults = null) => {
    if (!currentLedger.length) return { endingWealth: 0, cumulativeTax: 0, successRate: 0 };

    const final = currentLedger[currentLedger.length - 1];
    const endingWealth = final.totalBalance || 0;

    // Sum of Federal, State, FICA, NIIT (all included in totalTax)
    const cumulativeTax = currentLedger.reduce((sum, year) => sum + (year.taxes?.totalTax || 0), 0);

    // Success rate from Monte Carlo results (if available)
    const successRate = mcResults?.successRate !== undefined ? mcResults.successRate : 0;

    // v1.5: Capture Annual Data for Charts
    const annualTaxRates = currentLedger.map((y) => y.taxes?.effectiveRate || 0);
    const annualNetWorth = currentLedger.map((y) => y.netWorth || 0);
    const annualLegacy = currentLedger.map((y) => y.legacyValue || 0);

    return {
      endingWealth,
      cumulativeTax,
      successRate,
      annualTaxRates,
      annualNetWorth,
      annualLegacy,
    };
  }, []);

  /**
   * Save current plan as a scenario
   */
  const saveScenario = useCallback(
    (name) => {
      const metrics = calculateScenarioMetrics(ledger, monteCarloResults);

      const kpis = {
        ...metrics, // endingWealth, cumulativeTax, successRate
        finalBalance: metrics.endingWealth, // Keep backward compatibility if needed
        netWorth: ledger[ledger.length - 1]?.netWorth || 0, // Keep netWorth for now
        lifetimeTax: metrics.cumulativeTax, // Aliased for backward compatibility
      };

      const newScenario = {
        id: Date.now().toString(),
        name,
        planData: JSON.parse(JSON.stringify(planData)),
        kpis,
        timestamp: new Date().toISOString(),
      };
      setScenarios((prev) => [...prev, newScenario]);
    },
    [planData, ledger, monteCarloResults, calculateScenarioMetrics]
  );

  /**
   * Load a scenario as the current plan
   */
  const loadScenario = useCallback(
    (id) => {
      const scenario = scenarios.find((s) => s.id === id);
      if (scenario) {
        setPlanData(JSON.parse(JSON.stringify(scenario.planData)));
        // Ledger will be recalculated by the component's useEffect
      }
    },
    [scenarios]
  );

  /**
   * Delete a scenario
   */
  const deleteScenario = useCallback((id) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Persist spending strategy and guardrails
  useEffect(() => {
    localStorage.setItem('spending_strategy', spendingStrategy);
  }, [spendingStrategy]);

  useEffect(() => {
    localStorage.setItem('guardrails', JSON.stringify(guardrails));
  }, [guardrails]);

  const value = {
    planData,
    updatePlan,
    calculateLedger,
    ledger,
    monteCarloResults,
    setMonteCarloResults,
    calculateSuccess,
    isCalculating,
    scenarios,
    saveScenario,
    loadScenario,
    deleteScenario,
    spendingStrategy,
    setSpendingStrategy,
    guardrails,
    setGuardrails,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

/**
 * Hook to use plan context
 */
export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}
