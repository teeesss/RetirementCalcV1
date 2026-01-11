import React, { useState, useEffect, useCallback, useRef } from 'react';
import { STATE_BRACKETS } from './data/stateTaxBrackets';
import { PlanProvider, usePlan } from './contexts/PlanContext';
import { TaxStrategyProvider } from './contexts/TaxStrategyContext';

import TaxStrategyPanel from './components/TaxStrategyPanel';
import ProbabilityGauge from './components/strategy/ProbabilityGauge';
import ConfidenceBand from './components/strategy/ConfidenceBand';
import ConeChart from './components/ConeChart';
import CashFlowChart from './components/CashFlowChart';
import NetWorthChart from './components/NetWorthChart';
import MonteCarloStats from './components/MonteCarloStats';
import GoalProbability from './components/GoalProbability';
import CFORecommendations from './components/CFORecommendations';
import TaxSummary from './components/TaxSummary';
import AssetInputForm from './components/AssetInputForm';
import ScenarioManager from './components/ScenarioManager';
import PlanDetailsTable from './components/PlanDetailsTable';
import SmartInput from './components/SmartInput';
import SpendingSettings from './components/strategy/SpendingSettings';
import ScenarioComparisonChart from './components/strategy/ScenarioComparisonChart';
import CashFlowWaterfall from './components/strategy/CashFlowWaterfall';
const StressTestDashboard = React.lazy(() => import('./components/strategy/StressTestDashboard'));
const EstateSettings = React.lazy(() => import('./components/strategy/EstateSettings'));
const ExpenseManagement = React.lazy(() => import('./components/strategy/ExpenseManagement'));
const TaxFreeDashboard = React.lazy(() => import('./components/strategy/TaxFreeDashboard'));
const AllGraphsView = React.lazy(() => import('./components/strategy/AllGraphsView'));
import GrowthDrawdownChart from './components/strategy/GrowthDrawdownChart';
import DetailedCashFlowChart from './components/strategy/DetailedCashFlowChart';
import EfficiencyDashboard from './components/TaxEfficiency/EfficiencyDashboard';
import Wizard from './components/Wizard';

// DIAGNOSTIC: Robust Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 GLOBAL ERROR CAUGHT:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-red-50 text-red-900 p-10 overflow-auto">
          <div className="max-w-4xl mx-auto bg-white border-4 border-red-600 rounded-xl shadow-2xl p-8">
            <h1 className="text-3xl font-black text-red-600 mb-4 flex items-center gap-3">
              <span>💣</span> APPLICATION CRASHED
            </h1>
            <p className="text-lg font-semibold mb-2">The simulator encountered a fatal error.</p>

            <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm mb-6 overflow-x-auto shadow-inner">
              <p className="font-bold text-red-400 text-base mb-2">
                {this.state.error?.toString()}
              </p>
              <pre className="whitespace-pre-wrap opacity-75">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg transition-transform active:scale-95"
              >
                🔄 Restart Application
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold shadow-lg transition-transform active:scale-95"
              >
                🧹 Clear Data & Restart
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Common Fix: &quot;Clear Data&quot; resets corrupted Plan State.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const {
    planData,
    updatePlan,
    calculateLedger,
    ledger,
    monteCarloResults,
    setMonteCarloResults,
    isCalculating,
    spendingStrategy,
    setSpendingStrategy,
    guardrails,
    setGuardrails,
  } = usePlan();

  const [fetchingRE, setFetchingRE] = useState(null); // idx of fetching property
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [showWizard, setShowWizard] = useState(false);
  const [mcProgress, setMcProgress] = useState(0);
  const [isCalculatingMC, setIsCalculatingMC] = useState(false);

  // Strategy feature states
  const [strategySubTab, setStrategySubTab] = useState('tax');
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressTestResults, setStressTestResults] = useState(null);

  // Comparison state from TaxStrategyContext
  // Comparison state from TaxStrategyContext removed unused

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Schema Migration for Dual-Life Support
  useEffect(() => {
    if (!planData || typeof planData !== 'object') return;

    let updates = {};

    // Migrate legacy profile fields to people array
    if (!planData.people || planData.people.length === 0) {
      console.log('Migrating legacy profile to people array...');
      const clientAge = planData.profile?.age || 50;
      const spouseAge = planData.profile?.spouseAge || clientAge - 2;

      updates.people = [
        {
          id: 'client',
          name: 'Client',
          age: clientAge,
          retirementAge: planData.profile?.retirementAge || 65,
          lifeExpectancy: planData.profile?.lifeExpectancy || 90,
        },
        {
          id: 'spouse',
          name: 'Spouse',
          age: spouseAge,
          retirementAge: planData.profile?.spouseRetirementAge || 65,
          lifeExpectancy: planData.profile?.lifeExpectancy || 95,
        },
      ];

      // Move salary to top level if it was in profile
      if (planData.profile?.salary) {
        updates.salary = planData.profile.salary;
      }

      // Keep only household settings in profile
      updates.profile = {
        filingStatus: planData.profile?.filingStatus || 'married',
        stateOfResidence: planData.profile?.stateOfResidence || 'TX',
        stateTaxRate: planData.profile?.stateTaxRate || 0,
      };
    }

    // Migrate Social Security (if still legacy)
    if (planData?.socialSecurity && typeof planData.socialSecurity.startAge === 'number') {
      console.log('Migrating legacy Social Security schema...');
      updates.socialSecurity = {
        primary: {
          annualAmount: planData.socialSecurity.annualAmount || 0,
          startAge: planData.socialSecurity.startAge || 62,
        },
        spouse: {
          annualAmount: 0,
          startAge: 67,
        },
      };
    }

    // Migrate Expenses
    if (planData?.expenses?.annual !== undefined && planData?.expenses?.essential === undefined) {
      console.log('Migrating legacy Expenses schema...');
      const annual = planData.expenses.annual;
      updates.expenses = {
        ...planData.expenses,
        essential: annual * 0.75,
        discretionary: annual * 0.25,
        spendingPhases: {
          startAge: planData.people?.[0]?.retirementAge || 65,
          slowGoAge: 75,
          slowGoReduction: 0.85,
          noGoAge: 85,
          noGoReduction: 0.75,
        },
      };
      delete updates.expenses.annual;
    }

    // Migrate Assets to Ownership Schema
    if (planData?.assets && typeof planData.assets.traditional === 'number') {
      console.log('Migrating assets to ownership schema...');
      updates.assets = {
        ...planData.assets,
        traditional: { client: planData.assets.traditional || 0, spouse: 0 },
        roth: { client: planData.assets.roth || 0, spouse: 0 },
        hsa: { client: planData.assets.hsa || 0, spouse: 0 },
        brokerage: { joint: planData.assets.brokerage || 0 },
        brokerageBasis: { joint: planData.assets.brokerageBasis || 0 },
      };

      // Also migrate crypto if items don't have owner
      if (planData.assets.crypto) {
        const crypto = { ...planData.assets.crypto };
        Object.keys(crypto).forEach((key) => {
          if (!crypto[key].owner) {
            crypto[key].owner = 'client';
          }
        });
        updates.assets.crypto = crypto;
      }
    }

    if (Object.keys(updates).length > 0) {
      try {
        updatePlan(updates);
      } catch (e) {
        console.error('DIAGNOSTIC: Error during plan migration:', e);
      }
    }
  }, [planData, updatePlan]);

  // Run Monte Carlo when ledger is ready

  // --- Real Estate Fetch ---
  const fetchRealEstateValue = useCallback(
    async (reIndex, manual = true) => {
      const property = planData.realEstate[reIndex];
      if (!property?.address) {
        if (manual) alert('Please enter a property address first.');
        return;
      }

      // Month-level caching check for auto-fetches
      const now = new Date();
      const currentMonthKey = now.getFullYear() + '-' + now.getMonth();
      const lastUpdateKey = property.lastUpdated
        ? new Date(property.lastUpdated).getFullYear() +
          '-' +
          new Date(property.lastUpdated).getMonth()
        : null;

      if (!manual && lastUpdateKey === currentMonthKey) {
        console.log('Skipping auto-fetch, already updated this month:', property.address);
        return;
      }

      // ---------------------------------------------------------
      // 1. Attempt Local Zillow Scraper (Prioritized)
      // ---------------------------------------------------------
      setFetchingRE(reIndex);

      try {
        const localResp = await fetch(
          `http://localhost:3001/api/zestimate?address=${encodeURIComponent(property.address)}`
        );
        if (localResp.ok) {
          const data = await localResp.json();
          if (data.success && data.value) {
            // Parse "$1,234,567" -> 1234567
            const numVal = parseFloat(data.value.replace(/[^0-9.]/g, ''));
            if (!isNaN(numVal)) {
              const newRE = [...planData.realEstate];
              newRE[reIndex].currentValue = numVal;
              newRE[reIndex].lastUpdated = new Date().toISOString();
              updatePlan({ realEstate: newRE });
              setFetchingRE(null);
              if (manual) alert(`🤖 Local Scraper Success! Value: ${data.value}`);
              return;
            }
          }
        }
      } catch (err) {
        // Local server likely not running, ignore and fall through
        console.log('Local scraper not available, falling back to API.');
      }

      // ---------------------------------------------------------
      // ---------------------------------------------------------
      // 2. Fallback: Manual Entry Only
      // ---------------------------------------------------------
      if (manual) {
        // As requested: Auto-open Zillow Search so user can find it manually
        window.open('https://www.zillow.com/how-much-is-my-home-worth/', '_blank');
      }
      setFetchingRE(null);
    },
    [planData, updatePlan]
  );

  // Auto-fetch RE on load (respects caching)
  const autoFetchRan = useRef(false);
  useEffect(() => {
    if (autoFetchRan.current) return;
    if (planData.realEstate?.length > 0 && planData.settings?.apiKeys?.rentcast) {
      planData.realEstate.forEach((_, idx) => {
        fetchRealEstateValue(idx, false);
      });
      autoFetchRan.current = true;
    }
  }, [planData.settings?.apiKeys?.rentcast, planData.realEstate, fetchRealEstateValue]);

  /*
  const handleValidateKey = async () => {
    const key = planData.settings?.apiKeys?.rentcast;
    if (!key) {
      alert("⚠️ Please enter an API key first.");
      return;
    }

    setIsValidatingKey(true);
    try {
      const result = await validateRentCastKey(key);
      if (result.valid) {
        alert("✅ Success! API Key is valid.\n\nYou can now fetch property values by:\n1. Add a property with the '+ Add Property' button below\n2. Enter the property address\n3. Click '⚡ Fetch' to get the current value\n\nNote: Property values are cached monthly to conserve your 50 API calls/month.");
      } else {
        alert(`❌ API Key validation failed.\n\n${result.message || 'The key appears to be invalid.'}\n\nGet a free key at rentcast.io/api`);
      }
    } catch (e) {
      alert(`❌ Validation Error\n\n${e.message}\n\nPlease check your internet connection and try again.`);
    } finally {
      setIsValidatingKey(false);
    }
  };
  */

  const runMonteCarloSim = useCallback(async () => {
    if (!ledger || ledger.length === 0) {
      alert('Please calculate plan first');
      return;
    }

    setIsCalculatingMC(true);
    setMcProgress(0);

    const client = planData.people?.[0] || { age: 50, lifeExpectancy: 90 };
    const spouse = planData.people?.[1];

    // SAFEGUARD: Ensure valid simulation range
    const startAge = Number(client.age) || 50;
    const endAge = Math.max(
      Number(client.lifeExpectancy) || 90,
      Number(spouse?.lifeExpectancy) || 0
    );

    if (startAge >= endAge) {
      alert(
        `Simulation Error: Start Age (${startAge}) must be less than Life Expectancy (${endAge}). Please check Profile settings.`
      );
      setIsCalculatingMC(false);
      setMcProgress(0);
      return;
    }

    const worker = new Worker(new URL('./workers/monteCarlo.worker.js', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { type, progress, results } = e.data;
      if (type === 'progress') {
        setMcProgress(progress);
      } else if (type === 'result') {
        setMonteCarloResults(results);
        setIsCalculatingMC(false);
        setMcProgress(0);
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      alert('Error running Monte Carlo simulation in worker.');
      setIsCalculatingMC(false);
      setMcProgress(0);
      worker.terminate();
    };

    worker.postMessage({
      startAge: ledger[0]?.age || client.age || 50,
      endAge: Math.max(
        ledger[ledger.length - 1]?.age || client.lifeExpectancy || 90,
        spouse?.lifeExpectancy || 0
      ),
      iterations: planData.monteCarlo?.iterations || 10000,

      equityReturn: planData.assumptions.equityReturn / 100,
      equityVolatility: planData.assumptions.equityVolatility / 100,
      cryptoReturn: planData.assumptions.cryptoReturn / 100,
      cryptoVolatility: planData.assumptions.cryptoVolatility / 100,

      correlation: planData.assumptions.correlation || 0.1,
      enableCAPE: planData.assumptions.enableCAPE,
      spendingStrategy: planData.assumptions.withdrawalStrategy || 'fixed',
      spendingParams: {
        guytonKlinger: planData.assumptions.guytonKlinger,
        guardrails: planData.assumptions.guardrails,
      },
      ledger,
      initialBalances: ledger.initialBalances, // Explicit pass to survive serialization
      seed: 'stable-seed-v1', // Deterministic RNG
    });
  }, [planData, ledger, setMonteCarloResults]);

  // Auto-fetch crypto on load
  useEffect(() => {
    const fetchPrices = async () => {
      // 1-second delay before fetching
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const [btcRes, ethRes, solRes] = await Promise.all([
          fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
          fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot'),
          fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot'),
        ]);
        const btc = await btcRes.json();
        const eth = await ethRes.json();
        const sol = await solRes.json();

        if (btc?.data?.amount || eth?.data?.amount || sol?.data?.amount) {
          console.log('Auto-updating crypto prices...');
          updatePlan({
            assets: {
              ...planData.assets,
              crypto: {
                ...planData.assets.crypto,
                // Parse float then round to nearest dollar
                btc: {
                  ...planData.assets.crypto?.btc,
                  price:
                    Math.round(parseFloat(btc.data.amount)) || planData.assets.crypto?.btc?.price,
                },
                eth: {
                  ...planData.assets.crypto?.eth,
                  price:
                    Math.round(parseFloat(eth.data.amount)) || planData.assets.crypto?.eth?.price,
                },
                sol: {
                  ...planData.assets.crypto?.sol,
                  price:
                    Math.round(parseFloat(sol.data.amount)) || planData.assets.crypto?.sol?.price,
                },
              },
            },
          });
        }
      } catch (e) {
        console.error('Auto-fetch crypto failed:', e);
      }
    };
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount explicitly

  // Helper for Async Worker - Helper to run a single simulation promise
  const runProb = useCallback(
    async (ledgerToUse, requestId, iterations = 1000, customPlan = null) => {
      const sourcePlan = customPlan || planData;
      // Worker Params
      const params = {
        startAge: ledgerToUse[0]?.age || sourcePlan.people[0].age || 50,
        endAge: Math.max(
          ledgerToUse[ledgerToUse.length - 1]?.age || sourcePlan.people[0].lifeExpectancy || 90,
          sourcePlan.people[1]?.lifeExpectancy || 0
        ),
        iterations,
        equityReturn: sourcePlan.assumptions.equityReturn / 100,
        equityVolatility: sourcePlan.assumptions.equityVolatility / 100,
        cryptoReturn: sourcePlan.assumptions.cryptoReturn / 100,
        cryptoVolatility: sourcePlan.assumptions.cryptoVolatility / 100,
        correlation: sourcePlan.assumptions.correlation || 0.1,
        enableCAPE: sourcePlan.assumptions.enableCAPE,
        stressTest: sourcePlan.stressTest, // Pass stress config
      };

      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./workers/monteCarlo.worker.js', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (e) => {
          if (e.data.type === 'result') {
            resolve(e.data.results);
            worker.terminate();
          }
        };
        worker.onerror = (err) => {
          reject(err);
          worker.terminate();
        };
        worker.postMessage({
          ...params,
          ledger: ledgerToUse,
          initialBalances: ledgerToUse.initialBalances,
          requestId,
          seed: 'stable-seed-v1', // Deterministic RNG
        });
      });
    },
    [planData]
  );

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const handleAutoOptimize = useCallback(
    async (TARGET_SUCCESS = 0.95) => {
      if (isOptimizing) return;
      setIsOptimizing(true);
      setOptimizationResult(null);

      try {
        // Strategy:
        // 1. Try cutting Discretionary (Disc) from 100% -> 0%.
        // 2. If Disc=0% fails, keep Disc=0% and cut Recurring from 100% -> 0%.
        // 3. If Rec=0% fails, keep Rec=0% and cut Essential from 100% -> 0%.

        const originalDisc =
          planData.expenses.discretionaryMonthly || planData.expenses.discretionary / 12 || 0;
        const originalRec = planData.expenses.recurring || [];
        const originalEss =
          planData.expenses.essentialMonthly || planData.expenses.essential / 12 || 0;

        let safeDisc = originalDisc;
        let safeRecFactor = 1.0;
        let safeEss = originalEss;

        let successFound = false;

        // --- STAGE 1: Discretionary ---
        console.log(
          `Optimizing for ${(TARGET_SUCCESS * 100).toFixed(0)}% success: Stage 1 (Discretionary)`
        );
        // Check if 0% Disc is enough?
        let tempPlan = JSON.parse(JSON.stringify(planData));
        tempPlan.expenses.discretionaryMonthly = 0;
        let ledger = calculateLedger(tempPlan);
        let res = await runProb(ledger, 'stage1-check', 500);

        // TARGET_SUCCESS is now passed as parameter

        if (res.successRate >= TARGET_SUCCESS) {
          // Success is possible within Discretionary cut! Find exact amount.
          let low = 0.0; // 0% spending
          let high = 1.0; // 100% spending
          let bestFactor = 0.0;

          for (let i = 0; i < 6; i++) {
            const mid = (low + high) / 2;
            tempPlan.expenses.discretionaryMonthly = Math.floor(originalDisc * mid);
            ledger = calculateLedger(tempPlan);
            // if ledger failed validation
            if (!ledger || !ledger.length) {
              low = mid;
              continue;
            }

            res = await runProb(ledger, `stage1 - ${i} `, 1000);
            if (res.successRate >= TARGET_SUCCESS) {
              bestFactor = mid;
              low = mid; // Try spending more
            } else {
              high = mid; // Spend less
            }
          }
          safeDisc = Math.floor(originalDisc * bestFactor);
          successFound = true;
        } else {
          // Stage 1 failed even at $0. Lock Disc at $0 and move to Stage 2.
          safeDisc = 0;
        }

        // --- STAGE 2: Recurring ---
        if (!successFound) {
          console.log('Optimizing: Stage 2 (Recurring)');
          if (originalRec.length === 0) {
            // Skip if no recurring
          } else {
            // Check if 0% Recurring works?
            tempPlan.expenses.discretionaryMonthly = 0;
            tempPlan.expenses.recurring = originalRec.map((r) => ({ ...r, amount: 0 }));
            ledger = calculateLedger(tempPlan);
            res = await runProb(ledger, 'stage2-check', 500);

            if (res.successRate >= TARGET_SUCCESS) {
              // Success possible in Recurring! Find factor.
              let low = 0.0;
              let high = 1.0;
              let bestFactor = 0.0;

              for (let i = 0; i < 6; i++) {
                const mid = (low + high) / 2;
                tempPlan.expenses.recurring = originalRec.map((r) => ({
                  ...r,
                  amount: Math.floor(r.amount * mid),
                }));
                ledger = calculateLedger(tempPlan);
                res = await runProb(ledger, `stage2 - ${i} `, 1000);
                if (res.successRate >= TARGET_SUCCESS) {
                  bestFactor = mid;
                  low = mid;
                } else {
                  high = mid;
                }
              }
              safeRecFactor = bestFactor;
              successFound = true;
            } else {
              // Stage 2 failed. Lock Rec at 0.
              safeRecFactor = 0.0;
            }
          }
        }

        // --- STAGE 3 REMOVED ---
        // User feedback: "Essential must be static"

        const resultObj = {
          success: successFound,
          original: { disc: originalDisc, rec: originalRec, ess: originalEss },
          safe: {
            disc: safeDisc,
            recFactor: safeRecFactor,
            ess: safeEss,
          },
          cuts: {
            disc: originalDisc - safeDisc,
            recPercentage: (1.0 - safeRecFactor) * 100,
            ess: 0, // No cuts to essential
          },
        };

        setOptimizationResult(resultObj);

        // Auto-apply if optimization found a solution
        if (successFound && resultObj.cuts.disc > 0) {
          // Construct updates
          const updates = { expenses: { ...planData.expenses } };
          updates.expenses.discretionaryMonthly = resultObj.safe.disc;

          if (resultObj.safe.recFactor < 1.0 && resultObj.original.rec.length > 0) {
            updates.expenses.recurring = resultObj.original.rec.map((r) => ({
              ...r,
              amount: Math.floor(r.amount * resultObj.safe.recFactor),
            }));
          }

          updatePlan(updates);

          // Show feedback
          const cutAmount = resultObj.cuts.disc * 12;
          console.log(
            `✅ Optimizer: Reduce discretionary by $${cutAmount.toLocaleString()}/yr to reach target success rate.`
          );
          alert(
            `Optimizer applied!\n\nReduced discretionary spending by $${cutAmount.toLocaleString()}/year.\n\nRefresh Monte Carlo to see updated success rate.`
          );

          // Re-run Monte Carlo after a short delay
          setTimeout(() => runMonteCarloSim(), 1000);
        } else if (!successFound) {
          alert(
            `Optimizer could not reach target success rate.\n\nEven with $0 discretionary spending, the plan has high risk.\n\nConsider:\n- Delaying retirement\n- Reducing essential expenses\n- Increasing income sources`
          );
        }
      } catch (e) {
        console.error('Optimization failed:', e);
        alert('Optimization failed. Check console for details.');
      } finally {
        setIsOptimizing(false);
      }
    },
    [planData, calculateLedger, isOptimizing, runMonteCarloSim, updatePlan, runProb]
  );

  // Listen for optimizer trigger from MonteCarloStats component
  useEffect(() => {
    const handleOptimizerEvent = (e) => {
      handleAutoOptimize(e.detail?.target || 0.9);
    };
    window.addEventListener('runSuccessOptimizer', handleOptimizerEvent);
    return () => window.removeEventListener('runSuccessOptimizer', handleOptimizerEvent);
  }, [handleAutoOptimize]);

  // Listen for Spend More/Less simulation trigger from MonteCarloStats component
  useEffect(() => {
    const handleSpendingSimulation = async (e) => {
      const multiplier = e.detail?.spendingMultiplier || 1.0;

      // Get original spending from current ledger (most accurate source)
      const currentLedgerSpending = ledger[0]?.expenses?.total || 0;
      const originalSpending =
        currentLedgerSpending ||
        planData.spending?.fixedAmount ||
        (planData.expenses?.essential || 0) + (planData.expenses?.discretionary || 0) ||
        100000; // Fallback to $100k if nothing found

      // Create a temporary modified plan with adjusted spending
      const modifiedPlan = JSON.parse(JSON.stringify(planData));
      const adjustedSpending = Math.round(originalSpending * multiplier);

      // Update spending amount in modifiedPlan
      if (!modifiedPlan.spending) modifiedPlan.spending = {};
      modifiedPlan.spending.fixedAmount = adjustedSpending;

      if (!modifiedPlan.expenses) modifiedPlan.expenses = {};

      // SCALE ALL EXPENSE FIELDS: calculateExpenses prioritzes Monthly if present
      if (modifiedPlan.expenses.essentialMonthly !== undefined) {
        modifiedPlan.expenses.essentialMonthly = Math.round(
          modifiedPlan.expenses.essentialMonthly * multiplier
        );
      }
      if (modifiedPlan.expenses.discretionaryMonthly !== undefined) {
        modifiedPlan.expenses.discretionaryMonthly = Math.round(
          modifiedPlan.expenses.discretionaryMonthly * multiplier
        );
      }
      if (modifiedPlan.expenses.essential !== undefined) {
        modifiedPlan.expenses.essential = Math.round(modifiedPlan.expenses.essential * multiplier);
      }
      if (modifiedPlan.expenses.discretionary !== undefined) {
        modifiedPlan.expenses.discretionary = Math.round(
          modifiedPlan.expenses.discretionary * multiplier
        );
      }
      if (modifiedPlan.expenses.baseMonthly !== undefined) {
        modifiedPlan.expenses.baseMonthly = Math.round(
          modifiedPlan.expenses.baseMonthly * multiplier
        );
      }

      // Show feedback
      const pctText = (multiplier * 100).toFixed(0);
      console.log(
        `📊 Simulating ${pctText}% spending: $${adjustedSpending.toLocaleString()}/year (original: $${originalSpending.toLocaleString()})`
      );

      // Run Monte Carlo with modified plan
      setIsCalculatingMC(true);
      setMcProgress(0);

      try {
        // Generate modified ledger
        const modifiedLedger = calculateLedger(modifiedPlan);

        // DIAGNOSTIC: Verify first year of modified ledger
        console.log(
          `📊 Modified Ledger Y0: Total Expenses: $${modifiedLedger[0]?.expenses?.total?.toLocaleString()}, Net Worth: $${modifiedLedger[0]?.netWorth?.toLocaleString()}`
        );

        const client = modifiedPlan.people?.[0] || { age: 50, lifeExpectancy: 90 };
        const spouse = modifiedPlan.people?.[1];

        const worker = new Worker(new URL('./workers/monteCarlo.worker.js', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = (msg) => {
          const { type, progress, results } = msg.data;
          if (type === 'progress') {
            setMcProgress(progress);
          } else if (type === 'result') {
            setMonteCarloResults({
              ...results,
              spendingMultiplier: multiplier,
              adjustedSpending,
            });
            setIsCalculatingMC(false);
            setMcProgress(0);
            worker.terminate();

            // Results now show in page via MonteCarloStats component
            console.log(
              `✅ ${pctText}% Spending Simulation Complete - Success Rate: ${(results.successRate * 100).toFixed(1)}%`
            );
          }
        };

        worker.onerror = (err) => {
          console.error('Worker error:', err);
          setIsCalculatingMC(false);
          setMcProgress(0);
          worker.terminate();
        };

        worker.postMessage({
          startAge: client.age,
          endAge: Math.max(client.lifeExpectancy || 90, spouse?.lifeExpectancy || 0),
          iterations: modifiedPlan.monteCarlo?.iterations || 10000,
          equityReturn: modifiedPlan.assumptions.equityReturn / 100,
          equityVolatility: modifiedPlan.assumptions.equityVolatility / 100,
          cryptoReturn: modifiedPlan.assumptions.cryptoReturn / 100,
          cryptoVolatility: modifiedPlan.assumptions.cryptoVolatility / 100,
          correlation: modifiedPlan.assumptions.correlation || 0.1,
          enableCAPE: modifiedPlan.assumptions.enableCAPE,
          spendingStrategy: modifiedPlan.assumptions.withdrawalStrategy || 'fixed',
          ledger: modifiedLedger,
          initialBalances: modifiedLedger.initialBalances, // CRITICAL: Pass to worker
          seed: 'stable-seed-v1', // Deterministic RNG
        });
      } catch (err) {
        console.error('Spending simulation error:', err);
        setIsCalculatingMC(false);
        alert('Simulation failed. Check console for details.');
      }
    };

    window.addEventListener('runSpendingSimulation', handleSpendingSimulation);
    return () => window.removeEventListener('runSpendingSimulation', handleSpendingSimulation);
  }, [planData, calculateLedger, setMonteCarloResults, ledger]);

  // Listen for Historical Scenario simulation trigger
  useEffect(() => {
    const handleScenarioSimulation = async (e) => {
      const scenarioId = e.detail?.scenarioId || 'random';

      console.log(`📜 Running historical scenario: ${scenarioId}`);

      setIsCalculatingMC(true);
      setMcProgress(0);

      try {
        // DIAGNOSTIC: Verify first year of current ledger before passing to worker
        console.log(
          `📊 Scenario Ledger Y0: Total Expenses: $${ledger[0]?.expenses?.total?.toLocaleString()}, Net Worth: $${ledger[0]?.netWorth?.toLocaleString()}`
        );

        const client = planData.people?.[0] || { age: 50, lifeExpectancy: 90 };
        const spouse = planData.people?.[1];

        const worker = new Worker(new URL('./workers/monteCarlo.worker.js', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = (msg) => {
          const { type, progress, results } = msg.data;
          if (type === 'progress') {
            setMcProgress(progress);
          } else if (type === 'result') {
            setMonteCarloResults({
              ...results,
              scenarioId,
            });
            setIsCalculatingMC(false);
            setMcProgress(0);
            worker.terminate();
            console.log(
              `✅ Scenario "${scenarioId}" Complete - Success Rate: ${(results.successRate * 100).toFixed(1)}%`
            );
          }
        };

        worker.onerror = (err) => {
          console.error('Worker error:', err);
          setIsCalculatingMC(false);
          setMcProgress(0);
          worker.terminate();
        };

        worker.postMessage({
          startAge: client.age,
          endAge: Math.max(client.lifeExpectancy || 90, spouse?.lifeExpectancy || 0),
          iterations: planData.monteCarlo?.iterations || 10000,
          equityReturn: planData.assumptions.equityReturn / 100,
          equityVolatility: planData.assumptions.equityVolatility / 100,
          cryptoReturn: planData.assumptions.cryptoReturn / 100,
          cryptoVolatility: planData.assumptions.cryptoVolatility / 100,
          correlation: planData.assumptions.correlation || 0.1,
          enableCAPE: planData.assumptions.enableCAPE,
          spendingStrategy: planData.assumptions.withdrawalStrategy || 'fixed',
          ledger,
          initialBalances: ledger.initialBalances, // CRITICAL: Pass to worker
          scenarioId, // Pass scenario to worker
          seed: 'stable-seed-v1', // Deterministic RNG
        });
      } catch (err) {
        console.error('Scenario simulation error:', err);
        setIsCalculatingMC(false);
      }
    };

    window.addEventListener('runScenarioSimulation', handleScenarioSimulation);
    return () => window.removeEventListener('runScenarioSimulation', handleScenarioSimulation);
  }, [planData, ledger, setMonteCarloResults]);

  const applyOptimization = () => {
    if (!optimizationResult) return;
    const { safe, original } = optimizationResult;

    // Construct updates
    const updates = { expenses: { ...planData.expenses } };

    // Apply Disc
    updates.expenses.discretionaryMonthly = safe.disc;

    // Apply Rec
    if (safe.recFactor < 1.0 && original.rec.length > 0) {
      updates.expenses.recurring = original.rec.map((r) => ({
        ...r,
        amount: Math.floor(r.amount * safe.recFactor),
      }));
    }

    // Apply Ess
    if (safe.ess < original.ess) {
      updates.expenses.essentialMonthly = safe.ess;
    }

    updatePlan(updates);
    setOptimizationResult(null);
    setTimeout(() => runMonteCarloSim(), 500);
  };

  // Stress Test Handler
  const handleRunStressTest = async (shocks) => {
    if (isStressTesting) return;
    setIsStressTesting(true);
    setStressTestResults(null);

    try {
      // Run baseline Monte Carlo first
      const baselineResults = monteCarloResults || (await runMonteCarloSim());

      // Apply shocks to planData temporarily
      const stressedPlan = JSON.parse(JSON.stringify(planData));

      // Apply market drop (reduce equity allocation returns)
      if (shocks.marketDrop > 0) {
        // This would modify allocation returns - for now just simulate
        console.log(`Simulating ${shocks.marketDrop}% market drop`);
      }

      // Apply SS cut
      if (shocks.ssCut > 0 && stressedPlan.socialSecurity) {
        if (stressedPlan.socialSecurity.primary) {
          stressedPlan.socialSecurity.primary.annualAmount *= 1 - shocks.ssCut / 100;
        }
        if (stressedPlan.socialSecurity.spouse) {
          stressedPlan.socialSecurity.spouse.annualAmount *= 1 - shocks.ssCut / 100;
        }
      }

      // Apply longevity extension
      if (shocks.longevityYears > 0 && stressedPlan.people) {
        stressedPlan.people.forEach((person) => {
          person.lifeExpectancy += shocks.longevityYears;
        });
      }

      // Attach stress configuration for Worker
      stressedPlan.stressTest = shocks;

      // Recalculate ledger with stressed plan
      const stressedLedger = await calculateLedger(stressedPlan);

      // Run Monte Carlo on stressed plan (pass stressedPlan as customPlan)
      const stressedResults = await runProb(stressedLedger, 'stress-test', 2000, stressedPlan);

      setStressTestResults({
        successRate: stressedResults.successRate,
        baselineSuccessRate: baselineResults?.successRate || 0,
        endingWealth: stressedResults.finalBalances?.median || 0,
        baselineWealth: baselineResults?.finalBalances?.median || 0,
        ledger: stressedLedger,
      });
    } catch (error) {
      console.error('Stress test failed:', error);
    } finally {
      setIsStressTesting(false);
    }
  };

  // Auto-run MC when tab is opened
  useEffect(() => {
    if (
      activeTab === 'montecarlo' &&
      !monteCarloResults &&
      !isCalculatingMC &&
      ledger &&
      ledger.length > 0
    ) {
      runMonteCarloSim();
    }
  }, [activeTab, monteCarloResults, isCalculatingMC, runMonteCarloSim, ledger]);

  const tabsRef = useRef(null);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {showWizard && (
        <Wizard
          initialData={planData}
          onComplete={(finalData) => {
            updatePlan(finalData);
            setShowWizard(false);
          }}
          onClose={() => {
            setShowWizard(false);
          }}
        />
      )}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 max-w-[1920px] mx-auto">
          {/* Brand/Title (Left) */}
          <div className="flex items-center gap-4 min-w-[300px]">
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white flex items-center gap-2 group cursor-default">
              <span className="text-3xl transition-transform group-hover:rotate-12">🤖</span>
              <span className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                The Architect
              </span>
            </h1>

            {planData.people[0]?.isNewProfile && (
              <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-pulse">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  New? Start Wizard →
                </span>
              </div>
            )}
          </div>

          {/* Centered Toolbelt (Center) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 bg-white/50 dark:bg-gray-900/40 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex-1 max-w-4xl shadow-sm backdrop-blur-sm">
            {/* Primary Action */}
            <button
              onClick={() => setShowWizard(true)}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black uppercase rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <span className="text-sm group-hover:animate-bounce">🪄</span>
              <span>Start Wizard</span>
            </button>

            <div className="h-6 w-px bg-gray-300/50 dark:bg-gray-600/50 mx-1" />

            {/* Quick Strategy Selector */}
            <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 rounded-xl px-3 py-1.5 border border-transparent hover:border-blue-500/30 transition-all">
              <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 mr-2">
                Spend:
              </span>
              <select
                value={spendingStrategy}
                onChange={(e) => setSpendingStrategy(e.target.value)}
                className="bg-transparent text-[11px] font-black text-gray-900 dark:text-gray-100 border-none focus:ring-0 p-0 cursor-pointer outline-none hover:text-blue-600 transition-colors"
              >
                <option value="fixed">Fixed $</option>
                <option value="percentage">Fixed %</option>
                <option value="blanchett">Blanchett</option>
                <option value="guardrails">Guyton</option>
                <option value="floor-ceiling">F & C</option>
                <option value="max-spend">Max Out</option>
                <option value="dynamic">ARVA</option>
              </select>
            </div>

            <div className="h-6 w-px bg-gray-300/50 dark:bg-gray-600/50 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('montecarlo')}
                className={`px-4 py-2 rounded-xl transition-all text-[11px] font-black uppercase flex items-center gap-2 shadow-sm active:scale-95 border ${
                  activeTab === 'montecarlo'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>🎲</span> Monte Carlo
              </button>
              <button
                onClick={() => handleTabChange('cfo')}
                className={`px-4 py-2 rounded-xl transition-all text-[11px] font-black uppercase flex items-center gap-2 shadow-sm active:scale-95 border ${
                  activeTab === 'cfo'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-purple-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>🤖</span> Report
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear local cache and reload?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase rounded-xl transition-all border border-gray-200 dark:border-gray-700 shadow-sm ml-0"
                title="Clear Local Storage"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* User Controls (Right) */}
          <div className="flex items-center gap-2 min-w-[320px] justify-end">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-1 border border-gray-200 dark:border-gray-700 shadow-inner">
              <span className="text-[9px] font-black text-gray-400 uppercase ml-1 mr-1">
                Profile
              </span>
              <select
                className="bg-transparent text-[10px] font-black outline-none cursor-pointer focus:ring-0 px-1 py-1"
                onChange={(e) => {
                  if (e.target.value === 'ray') window.location.href = '?profile=ray';
                  if (e.target.value === 'local') window.location.href = window.location.pathname;
                }}
                value={
                  new URLSearchParams(window.location.search).get('profile') === 'ray'
                    ? 'ray'
                    : 'local'
                }
              >
                <option value="local">Local Draft</option>
                {new URLSearchParams(window.location.search).get('profile') === 'ray' && (
                  <option value="ray">Ray (Template)</option>
                )}
              </select>

              <button
                onClick={() => {
                  if (
                    window.confirm('🧹 CLEAR ALL DATA and reset everything? This cannot be undone.')
                  ) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Reset/Delete All Data"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const imported = JSON.parse(event.target.result);
                      updatePlan(imported);
                      alert('Plan imported successfully!');
                    } catch (err) {
                      alert('Failed to parse plan file.');
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm active:scale-95"
              title="Import Plan from JSON"
            >
              📥 Import
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    '🧹 PERMANENTLY WIPE EVERYTHING? All local drafts, settings, and scenarios will be deleted.'
                  )
                ) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              title="Reset Everything"
            >
              <span>🗑️</span> RESET
            </button>
            <button
              onClick={() => {
                const dataStr =
                  'data:text/json;charset=utf-8,' +
                  encodeURIComponent(JSON.stringify(planData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute('href', dataStr);
                downloadAnchorNode.setAttribute(
                  'download',
                  `retirement_plan_${planData.people[0].name.toLowerCase().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
                );
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
              title="Export Plan to JSON"
            >
              📤 Export
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-90"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto p-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
          {/* Left Sidebar */}
          <div className="lg:col-span-2 space-y-2">
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-[10px] font-bold mb-1 uppercase text-gray-500">1. Profile</h2>
              <div className="space-y-1">
                {/* Compact Row 1: Filing & State */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-400 block uppercase">
                      Filing Status
                    </label>
                    <select
                      value={planData.profile?.filingStatus || 'head'}
                      onChange={(e) =>
                        updatePlan({
                          profile: { ...planData.profile, filingStatus: e.target.value },
                        })
                      }
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    >
                      <option value="head">Head of Household</option>
                      <option value="single">Single</option>
                      <option value="married">Married (Joint)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block uppercase">State of Res</label>
                    <select
                      value={planData.profile?.stateOfResidence || 'FL'}
                      onChange={(e) =>
                        updatePlan({
                          profile: { ...planData.profile, stateOfResidence: e.target.value },
                        })
                      }
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    >
                      {Object.keys(STATE_BRACKETS)
                        .sort()
                        .map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {planData.people?.map((person, idx) => (
                  <div
                    key={person.id}
                    className="p-1.5 border border-gray-100 dark:border-gray-700 rounded-md space-y-1 bg-gray-50/50 dark:bg-gray-900/50"
                  >
                    <div className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">
                      {person.name || person.id}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        {/* DOB Logic: If birthDate exists, use it. Else fallback to age */}
                        <label className="text-[9px] text-gray-400 block uppercase">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={person.birthDate || ''}
                          onChange={(e) => {
                            const newPeople = [...planData.people];
                            newPeople[idx].birthDate = e.target.value;

                            // Auto-calc age for legacy compatibility
                            if (e.target.value) {
                              const dob = new Date(e.target.value);
                              const diff = Date.now() - dob.getTime();
                              const ageDate = new Date(diff);
                              newPeople[idx].age = Math.abs(ageDate.getUTCFullYear() - 1970);
                            }
                            updatePlan({ people: newPeople });
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        />
                        <div className="text-[9px] text-gray-500 mt-0.5">Age: {person.age}</div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block uppercase">
                          Retires at
                        </label>
                        <input
                          type="number"
                          value={person.retirementAge}
                          onChange={(e) => {
                            const newPeople = [...planData.people];
                            newPeople[idx].retirementAge = parseInt(e.target.value);
                            updatePlan({ people: newPeople });
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    {/* Compact Row: Life Exp & Salary */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block uppercase">
                          Life Expectancy
                        </label>
                        <input
                          type="number"
                          value={person.lifeExpectancy}
                          onChange={(e) => {
                            const newPeople = [...planData.people];
                            newPeople[idx].lifeExpectancy = parseInt(e.target.value);
                            updatePlan({ people: newPeople });
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        />
                      </div>
                      {idx === 0 && (
                        <div>
                          <label className="text-[9px] text-gray-400 block uppercase">
                            Annual Salary
                          </label>
                          <SmartInput
                            value={planData.salary || 0}
                            onChange={(val) => updatePlan({ salary: val })}
                            className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            step="1000"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-[10px] font-bold mb-1 uppercase text-gray-400">
                2. Financial Accounts
              </h2>
              <p className="text-[8px] text-gray-400 mb-1 italic">
                Real Estate has moved to Section 8
              </p>
              <AssetInputForm />
            </div>

            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-teal-500 dark:border-teal-600 shadow-sm">
              <h2 className="text-[10px] font-bold mb-1 text-teal-600 dark:text-teal-400 uppercase">
                3. Contributions (Working Years)
              </h2>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      Trad 401k (% of Salary)
                    </label>
                    <SmartInput
                      value={planData.contributions?.traditional || 0}
                      onChange={(val) =>
                        updatePlan({
                          contributions: { ...planData.contributions, traditional: val },
                        })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      Employer Match %
                    </label>
                    <SmartInput
                      value={planData.contributions?.match || 0}
                      onChange={(val) =>
                        updatePlan({ contributions: { ...planData.contributions, match: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="0.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase">
                      Roth IRA/Yr
                    </label>
                    <SmartInput
                      value={planData.contributions?.roth || 0}
                      onChange={(val) =>
                        updatePlan({ contributions: { ...planData.contributions, roth: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase">HSA/Yr</label>
                    <SmartInput
                      value={planData.contributions?.hsa || 0}
                      onChange={(val) =>
                        updatePlan({ contributions: { ...planData.contributions, hsa: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-[10px] font-bold mb-1 uppercase text-gray-500">5. Assumptions</h2>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <label className="block text-[9px] text-gray-500 mb-0.5 uppercase font-bold flex justify-between">
                      Strategy
                      <button
                        onClick={() => {
                          handleTabChange('strategy');
                          setTimeout(() => setStrategySubTab('spending'), 50);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 underline font-normal"
                      >
                        Customize
                      </button>
                    </label>
                    <select
                      value={spendingStrategy}
                      onChange={(e) => setSpendingStrategy(e.target.value)}
                      className="w-full px-1 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="fixed">Fixed $</option>
                      <option value="percentage">Fixed %</option>
                      <option value="blanchett">Smile</option>
                      <option value="guardrails">Guardrails</option>
                      <option value="floor-ceiling">Floor/Ceil</option>
                      <option value="max-spend">Max Spend</option>
                      <option value="dynamic">Actuarial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      Inflation %
                    </label>
                    <SmartInput
                      value={planData.assumptions?.inflation || 3}
                      onChange={(val) =>
                        updatePlan({ assumptions: { ...planData.assumptions, inflation: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      Stocks Ret %
                    </label>
                    <SmartInput
                      value={planData.assumptions.equityReturn}
                      onChange={(val) =>
                        updatePlan({ assumptions: { ...planData.assumptions, equityReturn: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      Crypto Ret %
                    </label>
                    <SmartInput
                      value={planData.assumptions?.cryptoReturn || 10}
                      onChange={(val) =>
                        updatePlan({ assumptions: { ...planData.assumptions, cryptoReturn: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase">
                      Div Yield %
                    </label>
                    <SmartInput
                      value={planData.assumptions?.dividendYield || 2.0}
                      onChange={(val) =>
                        updatePlan({ assumptions: { ...planData.assumptions, dividendYield: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase group relative cursor-help">
                      Qual Ratio %
                      <span className="hidden group-hover:block absolute z-20 w-40 p-1.5 text-[10px] bg-gray-900/95 text-white rounded shadow-lg -left-10 -top-12 normal-case font-normal leading-tight backdrop-blur-sm border border-gray-700">
                        % of dividends qualifies for lower tax rates (0/15/20%). Default 85% for
                        common index funds.
                      </span>
                    </label>
                    <SmartInput
                      value={planData.assumptions?.qualifiedRatio || 85.0}
                      onChange={(val) =>
                        updatePlan({
                          assumptions: { ...planData.assumptions, qualifiedRatio: val },
                        })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* Net Worth Trajectory Chart - Moved up */}
            {ledger && ledger.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
                  Net Worth Trajectory
                </h2>
                <NetWorthChart ledger={ledger} darkMode={darkMode} />
              </div>
            )}

            {/* Goal Probability and RMD */}
            <div className="grid grid-cols-2 gap-2">
              <GoalProbability monteCarloResults={monteCarloResults} />
            </div>

            {/* Advanced Features Tabs */}
            <div
              ref={tabsRef}
              style={{ scrollMarginTop: '80px' }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-wrap justify-center border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleTabChange('cashflow')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'cashflow'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Cash Flow
                </button>
                <button
                  onClick={() => handleTabChange('tax')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'tax'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Tax Summary
                </button>
                <button
                  onClick={() => handleTabChange('tax_efficiency')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'tax_efficiency'
                      ? 'border-b-2 border-emerald-600 text-emerald-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Efficiency Dashboard
                </button>
                <button
                  onClick={() => handleTabChange('networth')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'networth'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Net Worth
                </button>
                <button
                  onClick={() => handleTabChange('scenarios')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'scenarios' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  Scenarios
                </button>
                <button
                  onClick={() => handleTabChange('graphs')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'graphs' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  📊 Graphs
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  📝 Plan Details
                </button>
                <button
                  onClick={() => setActiveTab('strategy')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'strategy' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  🏛️ Tax Strategy
                </button>
                <button
                  onClick={() => handleTabChange('montecarlo')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'montecarlo'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Monte Carlo
                </button>
                <button
                  onClick={() => handleTabChange('optimization')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'optimization'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Optimizations
                </button>
                <button
                  onClick={() => handleTabChange('cfo')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'cfo'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  CFO Report
                </button>
              </div>

              <div className="p-3">
                {activeTab === 'cashflow' && (
                  <div className="space-y-4">
                    {/* Phase 13: Detailed Cash Flow */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-[500px]">
                      <DetailedCashFlowChart ledger={ledger} darkMode={darkMode} />
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Cash Flow Analysis
                      </h3>
                      <CashFlowChart ledger={ledger} darkMode={darkMode} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                      <div className="h-96">
                        <GrowthDrawdownChart ledger={ledger} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-1.5">Age</th>
                            <th className="text-right py-1.5">Status</th>
                            <th className="text-right py-1.5">Expenses</th>
                            <th className="text-right py-1.5">Income</th>
                            <th className="text-right py-1.5">Withdrawals</th>
                            <th className="text-right py-1.5">Total Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledger.map((year, idx) => (
                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-1.5">{year.age}</td>
                              <td className="text-right py-1.5">
                                {year.age >= (planData.people?.[0]?.retirementAge || 65)
                                  ? 'Retired'
                                  : 'Working'}
                              </td>
                              <td className="text-right py-1.5">
                                $
                                {(year.expenses?.total || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="text-right py-1.5">
                                $
                                {(year.income?.total || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="text-right py-1.5">
                                $
                                {(year.withdrawals?.total || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="text-right py-1.5 font-semibold">
                                $
                                {(year.totalBalance || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'tax' && <TaxSummary />}

                {activeTab === 'tax_efficiency' && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <EfficiencyDashboard />
                  </div>
                )}

                {activeTab === 'networth' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-1.5">Age</th>
                          <th className="text-right py-1.5">Traditional</th>
                          <th className="text-right py-1.5">Roth</th>
                          <th className="text-right py-1.5">HSA</th>
                          <th className="text-right py-1.5">Brokerage</th>
                          <th className="text-right py-1.5">Crypto</th>
                          <th className="text-right py-1.5">Net Worth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((year, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-1.5">{year.age}</td>
                            <td className="text-right py-1.5">
                              $
                              {(year.balances?.traditional || 0).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                            <td className="text-right py-1.5">
                              $
                              {(year.balances?.roth || 0).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                            <td className="text-right py-1.5">
                              $
                              {(year.balances?.hsa || 0).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                            <td className="text-right py-1.5">
                              $
                              {(year.balances?.brokerage || 0).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                            <td className="text-right py-1.5">
                              $
                              {(year.balances?.crypto || 0).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                            <td className="text-right py-1.5 font-semibold">
                              $
                              {(year.netWorth || 0).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'scenarios' && <ScenarioManager />}
                {activeTab === 'graphs' && (
                  <React.Suspense
                    fallback={
                      <div className="p-8 text-center text-gray-500">Loading Graphs...</div>
                    }
                  >
                    <AllGraphsView darkMode={darkMode} />
                  </React.Suspense>
                )}
                {activeTab === 'details' && <PlanDetailsTable />}
                {activeTab === 'strategy' && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      🎯 Advanced Strategy Tools
                    </h3>

                    {/* Strategy Sub-Tabs */}
                    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                      {[
                        'tax-free',
                        'tax',
                        'spending',
                        'expenses',
                        'cashflow-detail',
                        'comparison',
                        'stress',
                        'estate',
                      ].map((subTab) => (
                        <button
                          key={subTab}
                          onClick={() => setStrategySubTab(subTab)}
                          className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                            strategySubTab === subTab
                              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          {subTab === 'tax-free' && '🏆 Tax-Free Engine'}
                          {subTab === 'tax' && '🏛️ Optimization Settings'}
                          {subTab === 'spending' && '💰 Spending Plans'}
                          {subTab === 'expenses' && '📅 Expense Planning'}
                          {subTab === 'cashflow-detail' && '📊 Cash Flow Detail'}
                          {subTab === 'comparison' && '⚖️ Scenario Compare'}
                          {subTab === 'stress' && '🧪 Stress Test'}
                          {subTab === 'estate' && '🏰 Legacy & Estate'}
                        </button>
                      ))}
                    </div>

                    {/* Strategy Content */}
                    <div className="p-2">
                      <React.Suspense
                        fallback={
                          <div className="flex items-center justify-center p-8 space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-150"></div>
                            <span className="text-gray-500 text-xs font-mono ml-2">
                              Loading Strategy Module...
                            </span>
                          </div>
                        }
                      >
                        {strategySubTab === 'tax-free' && <TaxFreeDashboard />}

                        {strategySubTab === 'tax' && <TaxStrategyPanel />}

                        {strategySubTab === 'spending' && (
                          <SpendingSettings
                            currentStrategy={spendingStrategy}
                            onStrategyChange={setSpendingStrategy}
                            guardrails={guardrails}
                            onGuardrailsChange={setGuardrails}
                            expenses={planData.expenses}
                            onUpdateExpenses={(newExp) => updatePlan({ expenses: newExp })}
                            ledger={ledger}
                            planData={planData}
                            onUpdatePlan={updatePlan}
                          />
                        )}

                        {strategySubTab === 'cashflow-detail' && (
                          <CashFlowWaterfall ledger={ledger} selectedYear={0} darkMode={darkMode} />
                        )}

                        {strategySubTab === 'comparison' && (
                          <ScenarioComparisonChart darkMode={darkMode} />
                        )}

                        {strategySubTab === 'stress' && (
                          <StressTestDashboard
                            onRunStressTest={handleRunStressTest}
                            isRunning={isStressTesting}
                            results={stressTestResults}
                          />
                        )}

                        {strategySubTab === 'estate' && <EstateSettings />}

                        {strategySubTab === 'expenses' && <ExpenseManagement />}
                      </React.Suspense>
                    </div>
                  </div>
                )}

                {activeTab === 'montecarlo' && (
                  <div className="space-y-4 min-h-[600px]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Monte Carlo Simulation
                      </h3>
                      <button
                        onClick={runMonteCarloSim}
                        disabled={
                          isCalculating || isCalculatingMC || !ledger || ledger.length === 0
                        }
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-2"
                      >
                        {isCalculatingMC ? (
                          <>
                            <svg
                              className="animate-spin h-3 w-3 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Calculating...
                          </>
                        ) : (
                          '🎲 Run Simulation'
                        )}
                      </button>
                      <button
                        onClick={handleAutoOptimize}
                        disabled={isCalculating || isCalculatingMC || isOptimizing}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-2"
                      >
                        {isOptimizing ? '✨ Optimizing...' : '✨ Auto-Optimize'}
                      </button>
                    </div>

                    {optimizationResult && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 animate-fade-in shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full shrink-0">
                            <span className="text-2xl">⚡</span>
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100">
                              Solvency Solution Found!
                            </h4>
                            <p className="text-xs text-purple-800 dark:text-purple-200 mt-1 mb-3">
                              To achieve a{' '}
                              <strong className="text-green-600 dark:text-green-400">
                                Safe Success Probability (&gt;95%)
                              </strong>
                              , the model recommends:
                            </p>

                            <div className="space-y-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-purple-100 dark:border-purple-800/50">
                              {/* Discretionary Step */}
                              {optimizationResult.cuts.disc > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    1. Discretionary Spending
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="line-through text-gray-400 decoration-red-400">
                                      ${optimizationResult.original.disc.toLocaleString()}
                                    </span>
                                    <span>→</span>
                                    <span className="font-bold text-red-500">
                                      ${optimizationResult.safe.disc.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1 rounded">
                                      (Cut 100%)
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Recurring Step */}
                              {optimizationResult.cuts.recPercentage > 0 && (
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    2. Recurring Expenses
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-orange-500">
                                      Reduce All by{' '}
                                      {optimizationResult.cuts.recPercentage.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              )}

                              {optimizationResult.cuts.disc === 0 &&
                                optimizationResult.cuts.recPercentage === 0 &&
                                optimizationResult.cuts.ess === 0 && (
                                  <div className="text-green-600 font-bold text-xs">
                                    No changes needed! You are already 100% safe.
                                  </div>
                                )}
                            </div>

                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={applyOptimization}
                                className="px-4 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 font-bold shadow-sm"
                              >
                                Apply Recommended Fixes
                              </button>
                              <button
                                onClick={() => setOptimizationResult(null)}
                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-xs"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {mcProgress > 0 && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${mcProgress}% ` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {mcProgress.toFixed(0)}% complete
                        </div>
                      </div>
                    )}
                    {monteCarloResults && (
                      <>
                        {/* New: Probability Gauge & Confidence Band */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <ProbabilityGauge
                            successRate={monteCarloResults.successRate}
                            iterations={monteCarloResults.iterations}
                          />
                          <MonteCarloStats results={monteCarloResults} />
                        </div>

                        {monteCarloResults.percentiles && (
                          <ConfidenceBand
                            percentiles={monteCarloResults.percentiles}
                            years={monteCarloResults.years}
                            darkMode={darkMode}
                          />
                        )}
                        <ConeChart
                          percentiles={monteCarloResults.percentiles}
                          startAge={planData.people?.[0]?.age || 49}
                          darkMode={darkMode}
                        />
                      </>
                    )}
                    {!monteCarloResults && (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                        Click &quot;Run Simulation&quot; to see Monte Carlo results
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'optimization' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Tax Optimization Strategies
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Roth Conversion Ladder
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          Consider converting $50k-$100k annually from Traditional to Roth between
                          ages 53-72 to fill lower tax brackets.
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2">
                          Tax-Loss Harvesting
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          Currently harvesting $55k annually. This reduces taxable income and can
                          offset capital gains.
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                          Withdrawal Order
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          Optimal: Brokerage → Traditional (fill brackets) → Roth → Crypto. This
                          minimizes lifetime taxes.
                        </p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">
                          QCD Strategy
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          At age 70.5+, consider Qualified Charitable Distributions to reduce RMD
                          tax impact.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'cfo' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      🤖 CFO Automated Recommendations
                    </h3>
                    <CFORecommendations
                      ledger={ledger}
                      planData={planData}
                      updatePlan={updatePlan}
                      onNavigate={(tab, subTab) => {
                        setActiveTab(tab);
                        if (subTab) {
                          // Add small delay to ensure tab render
                          setTimeout(() => setStrategySubTab(subTab), 50);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-2 space-y-2">
            {/* 8. Real Estate & Settings (Integrated) */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>🏠</span> 8. Real Estate
                </h2>
              </div>

              <div className="space-y-3">
                {(planData.realEstate || []).map((re, idx) => (
                  <div
                    key={re.id || idx}
                    className="p-2 border border-emerald-100 dark:border-emerald-800/50 rounded-lg space-y-2 bg-emerald-50/10 dark:bg-emerald-900/5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={re.address || ''}
                          placeholder="Property Address"
                          onChange={(e) => {
                            const newRE = [...planData.realEstate];
                            newRE[idx].address = e.target.value;
                            updatePlan({ realEstate: newRE });
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[11px] font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            onClick={() => fetchRealEstateValue(idx)}
                            disabled={fetchingRE !== null}
                            className={`text-[7px] font-bold uppercase py-0.5 px-1 rounded bg-blue-50 dark:bg-blue-900/30 ${fetchingRE === idx ? 'text-gray-400 animate-pulse' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100'}`}
                          >
                            {fetchingRE === idx ? '⏳...' : 'Fetch'}
                          </button>
                          {re.lastUpdated && (
                            <span className="text-[7px] text-gray-400 italic">
                              Updated{' '}
                              {new Date(re.lastUpdated).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newRE = planData.realEstate.filter((_, i) => i !== idx);
                          updatePlan({ realEstate: newRE });
                        }}
                        className="text-[10px] text-red-300 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 p-1.5 bg-white/50 dark:bg-gray-800/50 rounded border border-emerald-100/50 dark:border-emerald-800/30">
                      <div>
                        <label className="text-[8px] text-gray-400 block uppercase font-bold">
                          Current Mkt Value (or Zestimate)
                        </label>
                        <SmartInput
                          value={re.currentValue || 0}
                          onChange={(val) => {
                            const newRE = [...planData.realEstate];
                            newRE[idx].currentValue = val;
                            updatePlan({ realEstate: newRE });
                          }}
                          className="w-full px-1.5 py-0.5 text-[11px] border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 font-semibold text-emerald-700 dark:text-emerald-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[8px] text-gray-400 block uppercase">
                            Apprec %
                          </label>
                          <SmartInput
                            value={re.appreciationRate || 0}
                            onChange={(val) => {
                              const newRE = [...planData.realEstate];
                              newRE[idx].appreciationRate = val;
                              updatePlan({ realEstate: newRE });
                            }}
                            className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-700 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-gray-400 block uppercase">
                            Tax/Ins/Yr
                          </label>
                          <SmartInput
                            value={re.propertyTax || 0}
                            onChange={(val) => {
                              const newRE = [...planData.realEstate];
                              newRE[idx].propertyTax = val;
                              updatePlan({ realEstate: newRE });
                            }}
                            className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-700 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] text-emerald-600 dark:text-emerald-500 font-bold uppercase">
                          Debt Detail
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <div>
                          <label className="text-[7px] text-gray-400 block uppercase">
                            Balance
                          </label>
                          <SmartInput
                            value={re.mortgage?.balance || 0}
                            onChange={(val) => {
                              const newRE = [...planData.realEstate];
                              newRE[idx].mortgage = { ...newRE[idx].mortgage, balance: val };
                              const updates = { realEstate: newRE };
                              if (idx === 0)
                                updates.mortgage = { ...(planData.mortgage || {}), balance: val };
                              updatePlan(updates);
                            }}
                            className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-700 rounded font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[7px] text-gray-400 block uppercase">Rate %</label>
                          <SmartInput
                            value={re.mortgage?.rate || 0}
                            onChange={(val) => {
                              const newRE = [...planData.realEstate];
                              newRE[idx].mortgage = { ...newRE[idx].mortgage, rate: val };
                              const updates = { realEstate: newRE };
                              if (idx === 0)
                                updates.mortgage = { ...(planData.mortgage || {}), rate: val };
                              updatePlan(updates);
                            }}
                            className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-700 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[7px] text-gray-400 block uppercase">
                            P&I /Mo
                          </label>
                          <SmartInput
                            value={re.mortgage?.paymentPI || 0}
                            onChange={(val) => {
                              const newRE = [...planData.realEstate];
                              newRE[idx].mortgage = { ...newRE[idx].mortgage, paymentPI: val };
                              const updates = { realEstate: newRE };
                              if (idx === 0)
                                updates.mortgage = { ...(planData.mortgage || {}), paymentPI: val };
                              updatePlan(updates);
                            }}
                            className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-700 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[7px] text-gray-400 block uppercase">
                            Payoff Age
                          </label>
                          <SmartInput
                            value={re.mortgage?.targetAge || 0}
                            onChange={(val) => {
                              const newRE = [...planData.realEstate];
                              newRE[idx].mortgage = { ...newRE[idx].mortgage, targetAge: val };
                              updatePlan({ realEstate: newRE });
                            }}
                            className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-700 rounded"
                            placeholder="Age"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newRE = [
                      ...(planData.realEstate || []),
                      {
                        id: Date.now().toString(),
                        name: 'New Property',
                        address: '',
                        currentValue: 0,
                        appreciationRate: 2.5,
                        mortgage: { balance: 0, rate: 4.5, paymentPI: 0 },
                        propertyTax: 0,
                        insurance: 0,
                        maintenance: 0,
                      },
                    ];
                    updatePlan({ realEstate: newRE });
                  }}
                  className="w-full py-2 text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  + Add Property
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-yellow-500 dark:border-yellow-600 shadow-sm">
              <h2 className="text-xs font-bold mb-2 text-yellow-600 dark:text-yellow-400 uppercase">
                9. Goals
              </h2>
              <div className="space-y-2">
                {planData.goals?.map((goal, idx) => (
                  <div key={idx} className="grid grid-cols-[40px_1fr_20px] gap-1 items-center">
                    <SmartInput
                      value={goal.age}
                      onChange={(val) => {
                        const newGoals = [...(planData.goals || [])];
                        newGoals[idx].age = val;
                        updatePlan({ goals: newGoals });
                      }}
                      className="w-full px-1 py-0.5 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                    <SmartInput
                      value={goal.amount}
                      onChange={(val) => {
                        const newGoals = [...(planData.goals || [])];
                        newGoals[idx].amount = val;
                        updatePlan({ goals: newGoals });
                      }}
                      className="w-full px-1 py-0.5 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      step="10000"
                    />
                    <button
                      onClick={() =>
                        updatePlan({ goals: planData.goals.filter((_, i) => i !== idx) })
                      }
                      className="text-red-500 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    updatePlan({ goals: [...(planData.goals || []), { age: 75, amount: 1000000 }] })
                  }
                  className="w-full py-1 bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 border border-yellow-600/20 rounded text-[10px] font-bold uppercase"
                >
                  + Add Goal
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-indigo-500 dark:border-indigo-600 shadow-sm">
              <h2 className="text-[10px] font-bold mb-1 text-indigo-600 dark:text-indigo-400 uppercase">
                4. Income & SS
              </h2>
              <div className="space-y-1">
                {/* Primary SS */}
                <div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase">Annual SS</span>
                      <input
                        type="number"
                        value={planData.socialSecurity?.primary?.annualAmount || 0}
                        onChange={(e) =>
                          updatePlan({
                            socialSecurity: {
                              ...planData.socialSecurity,
                              primary: {
                                ...planData.socialSecurity?.primary,
                                annualAmount: parseFloat(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        step="1000"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase">Start Age</span>
                      <input
                        type="number"
                        value={planData.socialSecurity?.primary?.startAge || 62}
                        onChange={(e) =>
                          updatePlan({
                            socialSecurity: {
                              ...planData.socialSecurity,
                              primary: {
                                ...planData.socialSecurity?.primary,
                                startAge: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-purple-500 dark:border-purple-600 shadow-sm">
              <h2 className="text-[10px] font-bold mb-1 text-purple-600 dark:text-purple-400 uppercase">
                6. Optimization
              </h2>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      Roth Strategy
                    </label>
                    <select
                      value={planData.taxOptimization?.rothStrategy || 'manual'}
                      onChange={(e) =>
                        updatePlan({
                          taxOptimization: {
                            ...planData.taxOptimization,
                            rothStrategy: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="manual">Manual Only</option>
                      <option value="12">Fill 12% Bracket</option>
                      <option value="22">Fill 22% Bracket</option>
                      <option value="24">Fill 24% Bracket</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-1 uppercase">
                      TLH (Brokerage/Yr)
                    </label>
                    <SmartInput
                      value={planData.taxOptimization?.taxLossHarvesting?.brokerage || 0}
                      onChange={(val) =>
                        updatePlan({
                          taxOptimization: {
                            ...planData.taxOptimization,
                            taxLossHarvesting: {
                              ...planData.taxOptimization?.taxLossHarvesting,
                              brokerage: val,
                            },
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="1000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-xs font-bold mb-2 text-gray-500 uppercase">10. Expenses</h2>
              <div className="space-y-2">
                {/* Monthly Spending */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">
                      Monthly Essential
                    </label>
                    <SmartInput
                      value={planData.expenses?.essentialMonthly ?? 0}
                      onChange={(val) =>
                        updatePlan({ expenses: { ...planData.expenses, essentialMonthly: val } })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-gray-800"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">
                      Monthly Fun/Misc
                    </label>
                    <SmartInput
                      value={planData.expenses?.discretionaryMonthly ?? 0}
                      onChange={(val) =>
                        updatePlan({
                          expenses: { ...planData.expenses, discretionaryMonthly: val },
                        })
                      }
                      className="w-full px-2 py-1 text-[11px] border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-gray-800"
                      step="100"
                    />
                  </div>
                </div>

                {/* Health Costs */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                        Health Pre-65
                      </label>
                      <SmartInput
                        value={planData.expenses?.medicarePre65 ?? 0}
                        onChange={(val) =>
                          updatePlan({ expenses: { ...planData.expenses, medicarePre65: val } })
                        }
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                        Health Post-65
                      </label>
                      <SmartInput
                        value={planData.expenses?.medicarePost65 ?? 0}
                        onChange={(val) =>
                          updatePlan({ expenses: { ...planData.expenses, medicarePost65: val } })
                        }
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardrails */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">
                    Guardrails
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="flexEnabled"
                      checked={planData.expenses?.flexibility?.enabled || false}
                      onChange={(e) =>
                        updatePlan({
                          expenses: {
                            ...planData.expenses,
                            flexibility: {
                              ...planData.expenses.flexibility,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="h-3 w-3 text-blue-600 rounded border-gray-300"
                    />
                    <label
                      htmlFor="flexEnabled"
                      className="text-[10px] text-gray-600 dark:text-gray-400"
                    >
                      Enable Spending Cuts
                    </label>
                  </div>
                </div>

                {/* One-Time Expenses */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-1">
                    One-Time
                  </h3>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {planData.expenses?.oneTime?.map((exp, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[35px_1fr_60px_15px] gap-1 items-center"
                      >
                        <SmartInput
                          value={exp.age}
                          onChange={(val) => {
                            const newExpenses = [...(planData.expenses?.oneTime || [])];
                            newExpenses[idx].age = val;
                            updatePlan({
                              expenses: { ...planData.expenses, oneTime: newExpenses },
                            });
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <div className="truncate text-[10px] text-gray-500">{exp.name}</div>
                        <SmartInput
                          value={exp.amount}
                          onChange={(val) => {
                            const newExpenses = [...(planData.expenses?.oneTime || [])];
                            newExpenses[idx].amount = val;
                            updatePlan({
                              expenses: { ...planData.expenses, oneTime: newExpenses },
                            });
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-right"
                          step="1000"
                        />
                        <button
                          onClick={() =>
                            updatePlan({
                              expenses: {
                                ...planData.expenses,
                                oneTime: planData.expenses.oneTime.filter((_, i) => i !== idx),
                              },
                            })
                          }
                          className="text-red-500 text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      updatePlan({
                        expenses: {
                          ...planData.expenses,
                          oneTime: [
                            ...(planData.expenses?.oneTime || []),
                            { age: 60, name: 'Expense', amount: 50000 },
                          ],
                        },
                      })
                    }
                    className="w-full mt-1 py-1 bg-green-600/10 text-green-700 dark:text-green-400 border border-green-600/20 rounded text-[10px] font-bold uppercase"
                  >
                    + Add One-Time
                  </button>
                </div>

                {/* Recurring Expenses */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
                    Recurring
                  </h3>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {planData.expenses?.recurring?.map((exp, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[38px_38px_1fr_55px_15px] gap-1 items-center"
                      >
                        <SmartInput
                          value={exp.startAge}
                          onChange={(val) => {
                            const newExpenses = [...(planData.expenses?.recurring || [])];
                            newExpenses[idx].startAge = val;
                            updatePlan({
                              expenses: { ...planData.expenses, recurring: newExpenses },
                            });
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <SmartInput
                          value={exp.endAge}
                          onChange={(val) => {
                            const newExpenses = [...(planData.expenses?.recurring || [])];
                            newExpenses[idx].endAge = val;
                            updatePlan({
                              expenses: { ...planData.expenses, recurring: newExpenses },
                            });
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <div className="truncate text-[10px] text-gray-500">{exp.name}</div>
                        <SmartInput
                          value={exp.amount}
                          onChange={(val) => {
                            const newExpenses = [...(planData.expenses?.recurring || [])];
                            newExpenses[idx].amount = val;
                            updatePlan({
                              expenses: { ...planData.expenses, recurring: newExpenses },
                            });
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-right"
                          step="1000"
                        />
                        <button
                          onClick={() =>
                            updatePlan({
                              expenses: {
                                ...planData.expenses,
                                recurring: planData.expenses.recurring.filter((_, i) => i !== idx),
                              },
                            })
                          }
                          className="text-red-500 text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      updatePlan({
                        expenses: {
                          ...planData.expenses,
                          recurring: [
                            ...(planData.expenses?.recurring || []),
                            { startAge: 55, endAge: 65, name: 'Travel', amount: 20000 },
                          ],
                        },
                      })
                    }
                    className="w-full mt-1 py-1 bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20 rounded text-[10px] font-bold uppercase"
                  >
                    + Add Booster
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlanProvider>
        <TaxStrategyProvider>
          <AppContent />
        </TaxStrategyProvider>
      </PlanProvider>
    </ErrorBoundary>
  );
}
