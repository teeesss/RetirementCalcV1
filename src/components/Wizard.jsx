import { useState, useEffect, useMemo, useRef } from 'react';
import { generateLedger } from '../lib/ledgerLogic';
import NetWorthChart from './NetWorthChart';

export default function Wizard({ onComplete, onClose, initialData }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [useAutoSS, setUseAutoSS] = useState(true);
  const fileInputRef = useRef(null);

  const handleImportProfile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        // Basic Validation
        if (!imported.people || !imported.assets || !imported.expenses) {
          alert('Invalid profile format. JSON must contain people, assets, and expenses.');
          return;
        }

        // Data Migration/Cleanup (Ensure compatibility)
        // Similar to PlanContext migration but lightweight
        if (!imported.liabilities) imported.liabilities = { mortgage: 0 };
        if (!imported.assets.realEstate) imported.assets.realEstate = 0;

        setData({ ...initialData, ...imported }); // Merge with clean slate to ensure missing fields exist
        alert('Profile imported successfully!');
      } catch (err) {
        console.error('Import failed', err);
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const isMarried = data.profile.filingStatus === 'married';

  const handleChange = (path, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let curr = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = value;
      // Special case: If updating assets.realEstate, also sync to root realEstate array for compatibility
      if (path === 'assets.realEstate') {
        // simplified logic: simple wizard assumes 1 property
        // We won't deep sync here to avoid complexity, rely on generateLedger handling 'assets.realEstate' fallback if added
      }
      return newData;
    });
  };

  // Ensure data structure exists for Wizard specific fields
  useEffect(() => {
    setData((prev) => {
      const d = { ...prev };
      if (!d.liabilities) d.liabilities = { mortgage: 0 };
      if (!d.assets.realEstate) d.assets.realEstate = 0;
      return d;
    });
  }, []);

  const handleReset = () => {
    if (confirm('Reset all wizard inputs to blank?')) {
      setData(initialData);
      setStep(1);
    }
  };

  // SS Estimation Logic (Simplified for Wizard)
  useEffect(() => {
    if (useAutoSS && data.salary > 0) {
      // Primary
      const startAge = data.socialSecurity.primary.startAge || 67;
      let baseAt67 = data.salary * 0.35;
      if (baseAt67 > 48000) baseAt67 = 48000;

      let multiplier = 1;
      if (startAge < 67) multiplier = 1 - (67 - startAge) * 0.065;
      if (startAge > 67) multiplier = 1 + (startAge - 67) * 0.08;

      const estimated = Math.round(baseAt67 * Math.max(0.5, multiplier));
      handleChange('socialSecurity.primary.annualAmount', estimated);

      // Spouse (if applicable)
      if (isMarried) {
        const spouseStartAge = data.socialSecurity.spouse?.startAge || 67;
        let spouseBase = data.salary * 0.2; // Proxy for now
        if (spouseBase > 48000) spouseBase = 48000;

        let sMult = 1;
        if (spouseStartAge < 67) sMult = 1 - (67 - spouseStartAge) * 0.065;
        if (spouseStartAge > 67) sMult = 1 + (spouseStartAge - 67) * 0.08;

        const sEst = Math.round(spouseBase * Math.max(0.5, sMult));
        handleChange('socialSecurity.spouse.annualAmount', sEst);
      }
    }
  }, [
    data.salary,
    data.socialSecurity.primary.startAge,
    data.socialSecurity.spouse?.startAge,
    useAutoSS,
    isMarried,
  ]);

  // REMOVED: Default Expenses Initialization
  // Previously forced $5k/mo even for blank profiles. Now respects user's 0 input.
  // useEffect(() => {
  //   if (data.expenses.essentialMonthly === 0 && data.expenses.discretionaryMonthly === 0) {
  //     setData((prev) => ({
  //       ...prev,
  //       expenses: { ...prev.expenses, essentialMonthly: 5000 },
  //     }));
  //   }
  // }, []);

  // REMOVED: Default Goals Initialization
  // Previously created phantom $1M goals that inflated expense totals.
  // useEffect(() => {
  //   if (!data.goals || data.goals.length === 0) { ... }
  // }, []);

  const handleAddGoal = () => {
    setData((prev) => ({
      ...prev,
      goals: [...(prev.goals || []), { type: 'net_worth_at_age', amount: 1000000, age: 65 }],
    }));
  };

  const handleRemoveGoal = (index) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleGoalUpdate = (index, field, value) => {
    setData((prev) => {
      const newGoals = [...(prev.goals || [])];
      newGoals[index] = { ...newGoals[index], [field]: value };
      return { ...prev, goals: newGoals };
    });
  };

  const handleAddAnnuity = () => {
    setData((prev) => ({
      ...prev,
      annuities: [
        ...(prev.annuities || []),
        { name: 'Fixed Annuity', monthlyPayout: 1000, startAge: 65, inflationAdjusted: false },
      ],
    }));
  };

  const handleRemoveAnnuity = (index) => {
    setData((prev) => ({
      ...prev,
      annuities: (prev.annuities || []).filter((_, i) => i !== index),
    }));
  };

  const handleAnnuityUpdate = (index, field, value) => {
    setData((prev) => {
      const newAnnuities = [...(prev.annuities || [])];
      newAnnuities[index] = { ...newAnnuities[index], [field]: value };
      return { ...prev, annuities: newAnnuities };
    });
  };

  const handleFinish = () => {
    const finalData = JSON.parse(JSON.stringify(data));
    if (finalData.people[0]) {
      delete finalData.people[0].isNewProfile;
    }
    onComplete(finalData);
  };

  /**
   * Real-Time Plan Verification (Fast Deterministic Check)
   */
  const simulationResult = useMemo(() => {
    if (step !== 4) return null;
    try {
      // Create a temporary data object to run the ledger
      // Ensure we have defaults if minimal data is entered
      const calcData = JSON.parse(JSON.stringify(data));

      // Safety: Ensure people array exists
      if (!calcData.people || !calcData.people[0]) return null;

      const ledger = generateLedger(calcData);
      const finalYear = ledger[ledger.length - 1];

      // Sanity Check: Expenses > 0
      // If someone enters $0 expenses, they "win" automatically, which is a false positive.
      const totalAnnualExpense =
        (calcData.expenses.essentialMonthly + calcData.expenses.discretionaryMonthly) * 12;
      const insaneExpenses = totalAnnualExpense < 12000; // < $1k/month is suspicious

      const success = finalYear.totalBalance > 0 && !insaneExpenses;
      const failureYear = ledger.find((y) => y.totalBalance <= 0);
      const failureAge = failureYear ? failureYear.age : null;

      // Net Worth Goal Validation
      const retAge = calcData.people[0].retirementAge || 65;
      const targetGoal =
        calcData.goals?.find((g) => g.type === 'net_worth_at_age')?.amount || 1000000;
      const yearAtRet = ledger.find((y) => y.age === retAge);
      const nwAtRet = yearAtRet ? yearAtRet.netWorth : 0;
      const hitGoal = nwAtRet >= targetGoal;

      // Calculate annual income and expense for display
      const totalAnnualIncome =
        calcData.salary +
        calcData.socialSecurity.primary.annualAmount +
        (calcData.socialSecurity.spouse?.annualAmount || 0);
      // totalAnnualExpense already calculated above

      return {
        success,
        failureAge,
        insaneExpenses, // Pass this out for UI warning
        finalBalance: finalYear.totalBalance,
        totalAnnualIncome,
        totalAnnualExpense,
        lifeExpectancy: calcData.people[0].lifeExpectancy,
        finalAge: finalYear.age,
        nwAtRet,
        hitGoal, // Keeps compatibility for singular check if needed, but we rely on new array below
        targetGoal,
        retAge,
        ledger, // Pass full ledger for Chart
        goalsStatus: (calcData.goals || [])
          .map((g) => {
            if (g.type !== 'net_worth_at_age') return null;
            // If goal age is beyond ledger (e.g. success case where ledger ends at 100 but goal is 95, it works).
            // If fail case, ledger ends early.
            let y = ledger.find((year) => year.age === g.age);

            // Fallback: If we succeeded and passed the goal age, but maybe the ledger is yearly and we missed it?
            // Actually ledger is comprehensive. If y is missing, it means goal age > max age in ledger.
            // If successful, that implies we likely have money at the end?
            // Let's stick to: if we haven't reached that age, we can't say for sure, but likely 0 if failed.

            const actual = y
              ? y.netWorth
              : success && g.age <= finalYear.age
                ? finalYear.netWorth
                : 0;
            return { ...g, actual, passed: actual >= g.amount };
          })
          .filter(Boolean),
      };
    } catch (e) {
      console.warn('Wizard Simulation Failed', e);
      return null;
    }
  }, [step, data]);

  return (
    <div
      id="wizard-v3-container"
      className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="relative p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {step === 1 && 'Welcome'}
              {step === 2 && 'Assets & Real Estate'}
              {step === 3 && 'Income & SS'}
              {step === 4 && 'Finalize'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest border border-gray-200 dark:border-gray-700 rounded-lg transition-all"
              >
                Skip Wizard
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-start -mt-4 mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Let&apos;s build your retirement master plan. Start with the basics.
                </p>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Import Profile
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportProfile}
                    className="hidden"
                    accept=".json"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={data.people[0].name}
                    onChange={(e) => handleChange('people.0.name', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={data.people[0].birthDate}
                    onChange={(e) => handleChange('people.0.birthDate', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Filing Status
                  </label>
                  <select
                    value={data.profile.filingStatus}
                    onChange={(e) => handleChange('profile.filingStatus', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="single">Single</option>
                    <option value="head">Head of Household</option>
                    <option value="married">Married (Joint)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Residency
                  </label>
                  <select
                    value={data.profile.stateOfResidence}
                    onChange={(e) => handleChange('profile.stateOfResidence', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="FL">Florida (FL)</option>
                    <option value="TX">Texas (TX)</option>
                    <option value="CA">California (CA)</option>
                    <option value="NY">New York (NY)</option>
                    <option value="WA">Washington (WA)</option>
                    <option value="NV">Nevada (NV)</option>
                    <option value="TN">Tennessee (TN)</option>
                    <option value="NC">North Carolina (NC)</option>
                    <option value="GA">Georgia (GA)</option>
                    <option value="OTHER">Other / Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    State of Residence
                  </label>
                  <select
                    value={data.profile.stateOfResidence || 'FL'}
                    onChange={(e) => handleChange('profile.stateOfResidence', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="FL">Florida (0%)</option>
                    <option value="TX">Texas (0%)</option>
                    <option value="WA">Washington (0%)</option>
                    <option value="TN">Tennessee (0%)</option>
                    <option value="NV">Nevada (0%)</option>
                    <option value="CA">California (Brackets)</option>
                    <option value="NY">New York (Brackets)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                    Current Market Value ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={data.assets?.realEstate || ''}
                      onChange={(e) => handleChange('assets.realEstate', Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-7 pr-3 font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g. 500000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                    Remaining Mortgage Balance ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={data.liabilities?.mortgage || ''}
                      onChange={(e) => handleChange('liabilities.mortgage', Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-7 pr-3 font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="e.g. 350000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Retirement Age
                  </label>
                  <input
                    type="number"
                    value={data.people[0].retirementAge || ''}
                    onChange={(e) => handleChange('people.0.retirementAge', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Life Expectancy
                  </label>
                  <input
                    type="number"
                    value={data.people[0].lifeExpectancy || ''}
                    onChange={(e) =>
                      handleChange('people.0.lifeExpectancy', Number(e.target.value))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">
                    Traditional
                  </label>
                  <input
                    type="number"
                    value={data.assets.traditional.client}
                    onChange={(e) =>
                      handleChange('assets.traditional.client', Number(e.target.value))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">
                    Roth
                  </label>
                  <input
                    type="number"
                    value={data.assets.roth.client}
                    onChange={(e) => handleChange('assets.roth.client', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">
                    Brokerage
                  </label>
                  <input
                    type="number"
                    value={data.assets.brokerage.joint}
                    onChange={(e) => handleChange('assets.brokerage.joint', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">
                    Cash
                  </label>
                  <input
                    type="number"
                    value={data.assets.cash.total}
                    onChange={(e) => handleChange('assets.cash.total', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">
                    HSA
                  </label>
                  <input
                    type="number"
                    value={data.assets.hsa.client}
                    onChange={(e) => handleChange('assets.hsa.client', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 col-span-2 md:col-span-1">
                  <div className="flex flex-col">
                    <label className="text-[8px] font-black text-blue-500 uppercase">BTC</label>
                    <input
                      type="number"
                      step="0.001"
                      value={data.assets.crypto?.btc?.quantity || ''}
                      onChange={(e) =>
                        handleChange('assets.crypto.btc.quantity', Number(e.target.value))
                      }
                      className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[8px] font-black text-purple-500 uppercase">ETH</label>
                    <input
                      type="number"
                      step="0.01"
                      value={data.assets.crypto?.eth?.quantity || ''}
                      onChange={(e) =>
                        handleChange('assets.crypto.eth.quantity', Number(e.target.value))
                      }
                      className="bg-purple-50 dark:bg-purple-900/10 border-purple-200 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[8px] font-black text-green-500 uppercase">SOL</label>
                    <input
                      id="sol-wizard-input"
                      type="number"
                      step="0.1"
                      value={data.assets.crypto?.sol?.quantity || ''}
                      onChange={(e) =>
                        handleChange('assets.crypto.sol.quantity', Number(e.target.value))
                      }
                      className="bg-green-50 dark:bg-green-900/10 border-green-200 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="col-span-full pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <h4 className="text-[10px] uppercase font-black text-gray-400">
                    🏠 Primary Residence (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Address"
                      value={data.realEstate?.[0]?.address || ''}
                      onChange={(e) => {
                        if (!data.realEstate) data.realEstate = [];
                        if (data.realEstate.length === 0)
                          data.realEstate.push({
                            id: 'primary',
                            name: 'Home',
                            address: e.target.value,
                            currentValue: 0,
                            mortgage: { balance: 0, rate: 3.5, paymentPI: 0 },
                          });
                        else data.realEstate[0].address = e.target.value;
                        setData({ ...data });
                      }}
                      className="col-span-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Value"
                      value={data.realEstate?.[0]?.currentValue || ''}
                      onChange={(e) => {
                        if (data.realEstate?.[0]) {
                          data.realEstate[0].currentValue = Number(e.target.value);
                          setData({ ...data });
                        }
                      }}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Mortgage"
                      value={data.realEstate?.[0]?.mortgage?.balance || ''}
                      onChange={(e) => {
                        if (data.realEstate?.[0]) {
                          data.realEstate[0].mortgage.balance = Number(e.target.value);
                          setData({ ...data });
                        }
                      }}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                    Annual Salary (Gross)
                  </label>
                  <input
                    type="number"
                    value={data.salary || ''}
                    onChange={(e) => handleChange('salary', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-black text-blue-600"
                  />
                </div>

                <div className="bg-blue-500/5 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">
                      Social Security
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[9px] font-black text-gray-400 uppercase">
                        Auto-Calc
                      </span>
                      <input
                        type="checkbox"
                        checked={useAutoSS}
                        onChange={(e) => setUseAutoSS(e.target.checked)}
                        className="rounded border-blue-200 text-blue-600"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Claim Age</label>
                      <select
                        value={data.socialSecurity.primary.startAge}
                        onChange={(e) =>
                          handleChange('socialSecurity.primary.startAge', Number(e.target.value))
                        }
                        className="w-full bg-white dark:bg-gray-800 rounded-lg text-xs font-bold border-none"
                      >
                        {[62, 63, 64, 65, 66, 67, 68, 69, 70].map((a) => (
                          <option key={a} value={a}>
                            {a}
                            {a === 67 ? ' (Full)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Annual Est</label>
                      <input
                        type="number"
                        disabled={useAutoSS}
                        value={data.socialSecurity.primary.annualAmount || ''}
                        onChange={(e) =>
                          handleChange(
                            'socialSecurity.primary.annualAmount',
                            Number(e.target.value)
                          )
                        }
                        className={`w-full bg-white dark:bg-gray-800 rounded-lg text-xs font-black border-none ${useAutoSS ? 'text-blue-600' : ''}`}
                      />
                    </div>
                  </div>

                  {isMarried && (
                    <div className="pt-3 border-t border-blue-200/30 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Spouse Age</label>
                        <select
                          value={data.socialSecurity.spouse?.startAge || 67}
                          onChange={(e) =>
                            handleChange('socialSecurity.spouse.startAge', Number(e.target.value))
                          }
                          className="w-full bg-white dark:bg-gray-800 rounded-lg text-xs font-bold border-none"
                        >
                          {[62, 63, 64, 65, 66, 67, 68, 69, 70].map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Spouse Est</label>
                        <input
                          type="number"
                          disabled={useAutoSS}
                          value={data.socialSecurity.spouse?.annualAmount || ''}
                          onChange={(e) =>
                            handleChange(
                              'socialSecurity.spouse.annualAmount',
                              Number(e.target.value)
                            )
                          }
                          className={`w-full bg-white dark:bg-gray-800 rounded-lg text-xs font-black border-none ${useAutoSS ? 'text-blue-400' : ''}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-purple-500/5 dark:bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-600 uppercase tracking-tighter">
                      Annuities & Pensions
                    </span>
                    <button
                      onClick={handleAddAnnuity}
                      className="text-[9px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                    >
                      + Add New
                    </button>
                  </div>

                  {(!data.annuities || data.annuities.length === 0) && (
                    <div className="text-[10px] text-gray-400 font-bold text-center py-2">
                      No annuities added.
                    </div>
                  )}

                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {data.annuities?.map((ann, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <input
                            type="text"
                            placeholder="Name"
                            value={ann.name || ''}
                            onChange={(e) => handleAnnuityUpdate(idx, 'name', e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 w-full outline-none"
                          />
                          <button
                            onClick={() => handleRemoveAnnuity(idx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] uppercase font-bold text-gray-400">
                              Monthly ($)
                            </label>
                            <input
                              type="number"
                              value={ann.monthlyPayout || ''}
                              onChange={(e) =>
                                handleAnnuityUpdate(idx, 'monthlyPayout', Number(e.target.value))
                              }
                              className="w-full bg-gray-50 dark:bg-gray-900 rounded px-2 py-1 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] uppercase font-bold text-gray-400">
                              Start Age
                            </label>
                            <input
                              type="number"
                              value={ann.startAge || 65}
                              onChange={(e) =>
                                handleAnnuityUpdate(idx, 'startAge', Number(e.target.value))
                              }
                              className="w-full bg-gray-50 dark:bg-gray-900 rounded px-2 py-1 text-xs font-bold"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ann.inflationAdjusted || false}
                            onChange={(e) =>
                              handleAnnuityUpdate(idx, 'inflationAdjusted', e.target.checked)
                            }
                            className="rounded border-gray-300 text-purple-600 w-3 h-3"
                          />
                          <span className="text-[9px] font-bold text-gray-500">
                            Inflation Adjusted (COLA)
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                      Essential Monthly
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={
                        data.expenses.essentialMonthly === 0
                          ? '0'
                          : data.expenses.essentialMonthly || ''
                      }
                      onChange={(e) =>
                        handleChange('expenses.essentialMonthly', Number(e.target.value))
                      }
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                      Fun Monthly
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={
                        data.expenses.discretionaryMonthly === 0
                          ? '0'
                          : data.expenses.discretionaryMonthly || ''
                      }
                      onChange={(e) =>
                        handleChange('expenses.discretionaryMonthly', Number(e.target.value))
                      }
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] uppercase font-black text-gray-400">
                      Net Worth Milestones (Pass/Fail)
                    </label>
                    <button
                      onClick={handleAddGoal}
                      className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100"
                    >
                      + Add Goal
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {data.goals?.map((goal, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg px-2 py-1 border border-gray-200 dark:border-gray-700 flex-1">
                          <span className="text-[9px] font-bold text-gray-400">At Age</span>
                          <input
                            type="number"
                            value={goal.age}
                            onChange={(e) => handleGoalUpdate(idx, 'age', Number(e.target.value))}
                            className="w-12 bg-transparent text-xs font-black text-gray-800 dark:text-white border-none p-0 focus:ring-0"
                          />
                          <span className="text-[9px] font-bold text-gray-400">Target</span>
                          <span className="text-xs font-bold text-gray-500">$</span>
                          <input
                            type="number"
                            value={goal.amount}
                            onChange={(e) =>
                              handleGoalUpdate(idx, 'amount', Number(e.target.value))
                            }
                            className="w-full bg-transparent text-xs font-black text-blue-600 border-none p-0 focus:ring-0"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveGoal(idx)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {(!data.goals || data.goals.length === 0) && (
                      <p className="text-[10px] text-gray-400 italic">
                        No goals set. Defaults will be added.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 text-center py-10">
              <div className="text-6xl animate-bounce">🚀</div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                Plan Architected.
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Click below to launch your interactive dashboard and run 10,000 simulations.
              </p>
              <div
                className={`p-6 rounded-3xl text-left border ${simulationResult?.success ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'}`}
              >
                {simulationResult?.success ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🏆</span>
                      <div>
                        <h4 className="text-sm font-black text-green-700 dark:text-green-400 uppercase">
                          Plan Looks Healthy!
                        </h4>
                        <p className="text-[10px] text-green-600 dark:text-green-300 font-medium max-w-sm">
                          Your money is projected to last through age{' '}
                          <span className="font-bold">{simulationResult.lifeExpectancy}</span>.
                          Based on your inputs, here is your financial outlook:
                        </p>
                      </div>
                    </div>

                    {/* KEY METRICS GRID */}
                    {simulationResult?.ledger && simulationResult.ledger.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-green-200 dark:border-green-800 pt-4">
                        {/* 1. PROJECTED LEGACY */}
                        <div>
                          <p className="text-[10px] font-bold text-green-800 dark:text-green-200 uppercase opacity-60">
                            Projected Legacy
                          </p>
                          <p className="text-lg font-black text-green-700 dark:text-green-300">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              notation: 'compact',
                            }).format(
                              simulationResult.ledger[simulationResult.ledger.length - 1].netWorth
                            )}
                          </p>
                          <p className="text-[9px] text-green-600 dark:text-green-400">
                            at age {simulationResult.lifeExpectancy}
                          </p>
                        </div>

                        {/* 2. EXPENSE BREAKDOWN (Explicit Age) */}
                        <div>
                          <p className="text-[10px] font-bold text-green-800 dark:text-green-200 uppercase opacity-60 mb-1">
                            Age {simulationResult.ledger[0].age} Expenses
                          </p>
                          <div className="space-y-0.5 text-[10px] font-medium text-green-800 dark:text-green-100">
                            <div className="flex justify-between">
                              <span>Essential</span>
                              <span className="font-bold">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  notation: 'compact',
                                }).format(simulationResult.ledger[0].expenses.essential)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Discret.</span>
                              <span className="font-bold">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  notation: 'compact',
                                }).format(simulationResult.ledger[0].expenses.discretionary)}
                              </span>
                            </div>
                            {/* Explicit Split: Taxes vs Healthcare */}
                            {(simulationResult.ledger[0].expenses.taxes || 0) > 0 && (
                              <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                <span>Taxes</span>
                                <span className="font-bold">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    notation: 'compact',
                                  }).format(simulationResult.ledger[0].expenses.taxes)}
                                </span>
                              </div>
                            )}
                            {(simulationResult.ledger[0].expenses.healthcare || 0) > 0 && (
                              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                <span>Health</span>
                                <span className="font-bold">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    notation: 'compact',
                                  }).format(simulationResult.ledger[0].expenses.healthcare)}
                                </span>
                              </div>
                            )}
                            <div className="border-t border-green-200 dark:border-green-700 pt-0.5 mt-0.5 flex justify-between font-black text-xs">
                              <span>Total</span>
                              <span>
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  maximumFractionDigits: 0,
                                }).format(simulationResult.ledger[0].expenses.total)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. WITHDRAWAL RATE */}
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-green-800 dark:text-green-200 uppercase opacity-60">
                            Withdrawal Rate
                          </p>
                          <p className="text-lg font-black text-green-700 dark:text-green-300">
                            {(
                              (simulationResult.ledger[0].expenses.total /
                                (simulationResult.ledger[0].netWorth + 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-[9px] text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              notation: 'compact',
                            }).format(simulationResult.ledger[0].expenses.total)}
                            /yr
                          </p>
                          <p className="text-[8px] text-green-800/50 dark:text-green-200/50 italic mt-1">
                            Year 1 Stress Test
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">📉</span>
                      <div>
                        <h4 className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase">
                          Plan Needs Adjustment
                        </h4>
                        <p className="text-[10px] text-orange-600 dark:text-orange-300 font-medium">
                          {simulationResult?.failureAge ? (
                            <>
                              Ran out of money at age{' '}
                              <span className="font-bold underline">
                                {simulationResult.failureAge}
                              </span>
                              .
                            </>
                          ) : (
                            'Data missing or insufficient.'
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Failure Diagnostics */}
                    <div className="pl-11 mb-4 space-y-1">
                      {simulationResult?.insaneExpenses && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600/80">
                          <span>
                            • ⚠️ Expenses Too Low? You entered $
                            {Math.round(simulationResult.totalAnnualExpense / 12)}/mo. This might
                            generate a false &quot;Pass&quot;.
                          </span>
                        </div>
                      )}
                      {simulationResult &&
                        simulationResult.totalAnnualExpense > simulationResult.totalAnnualIncome &&
                        data.assets.traditional.client < 100000 && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600/80">
                            <span>
                              • ⚠️ Expenses ($
                              {Math.round(simulationResult.totalAnnualExpense / 1000)}k/yr) exceed
                              Income (${Math.round(simulationResult.totalAnnualIncome / 1000)}k/yr)
                            </span>
                          </div>
                        )}
                      {data.salary === 0 && data.socialSecurity.primary.annualAmount === 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600/80">
                          <span>• ⚠️ No Income Source Detected</span>
                        </div>
                      )}
                      {simulationResult?.failureAge &&
                        simulationResult.failureAge < data.people[0].retirementAge && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600/80">
                            <span>• ⚠️ Out of money before retirement begins!</span>
                          </div>
                        )}
                    </div>
                  </>
                )}

                {/* VISUALIZATION */}
                <div className="h-96 w-full mb-8 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <NetWorthChart
                    ledger={simulationResult?.ledger}
                    darkMode={false}
                    showFITarget={false}
                    goals={simulationResult?.goalsStatus} // Pass goals for tooltip
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between gap-4">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all"
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-100 transition-all"
              >
                Reset
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
              >
                Continue
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all"
                >
                  Review Inputs
                </button>
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-green-700 shadow-xl shadow-green-500/30 transition-all active:scale-95"
                >
                  Launch Planner
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
