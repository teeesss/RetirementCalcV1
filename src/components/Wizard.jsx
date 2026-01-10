import { useState } from 'react';

export default function Wizard({ onComplete, initialData }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleChange = (path, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let curr = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  const handleFinish = () => {
    // Remove the flag
    const finalData = JSON.parse(JSON.stringify(data));
    if (finalData.people[0]) {
      delete finalData.people[0].isNewProfile;
    }
    onComplete(finalData);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to The Architect
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Let&apos;s build your retirement master plan. Start with some basics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    value={data.people[0].name}
                    onChange={(e) => handleChange('people.0.name', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={data.people[0].birthDate}
                    onChange={(e) => handleChange('people.0.birthDate', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Retirement Age</label>
                  <input
                    type="number"
                    value={data.people[0].retirementAge}
                    onChange={(e) => handleChange('people.0.retirementAge', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Life Expectancy</label>
                  <input
                    type="number"
                    value={data.people[0].lifeExpectancy}
                    onChange={(e) =>
                      handleChange('people.0.lifeExpectancy', Number(e.target.value))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Assets</h2>
              <p className="text-gray-600 dark:text-gray-400">Current balances in your accounts.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Traditional 401k/IRA</label>
                  <input
                    type="number"
                    value={data.assets.traditional.client}
                    onChange={(e) =>
                      handleChange('assets.traditional.client', Number(e.target.value))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Roth 401k/IRA</label>
                  <input
                    type="number"
                    value={data.assets.roth.client}
                    onChange={(e) => handleChange('assets.roth.client', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brokerage (After-Tax)</label>
                  <input
                    type="number"
                    value={data.assets.brokerage.joint}
                    onChange={(e) => handleChange('assets.brokerage.joint', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cash / Savings</label>
                  <input
                    type="number"
                    value={data.assets.cash.total}
                    onChange={(e) => handleChange('assets.cash.total', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Annual Income & Expenses
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                What do you earn and spend today (monthly)?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Annual Salary (Gross)</label>
                  <input
                    type="number"
                    value={data.salary}
                    onChange={(e) => handleChange('salary', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Essential Monthly Spend</label>
                  <input
                    type="number"
                    value={data.expenses.essentialMonthly}
                    onChange={(e) =>
                      handleChange('expenses.essentialMonthly', Number(e.target.value))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Discretionary Monthly Spend
                  </label>
                  <input
                    type="number"
                    value={data.expenses.discretionaryMonthly}
                    onChange={(e) =>
                      handleChange('expenses.discretionaryMonthly', Number(e.target.value))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                You&apos;re Ready!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                We&apos;ve got the basics. You can fine-tune every detail—from Social Security
                claiming ages to tax harvesting—inside the dashboard.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl text-left border border-blue-100 dark:border-blue-900/30">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Next Steps:</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-disc pl-5">
                  <li>Check your Net Worth Trajectory</li>
                  <li>Run a Monte Carlo simulation (Advanced tab)</li>
                  <li>Stress test for high inflation or a market crash</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="px-6 py-2 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-green-500/20 transition-all transform hover:scale-105 active:scale-95"
              >
                Launch Planner
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
