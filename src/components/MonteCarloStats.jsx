/**
 * MonteCarloStats - Detailed statistics display for Monte Carlo results
 *
 * Shows number of runs, average return, high/low, median, etc.
 *
 * @module MonteCarloStats
 */

import { getScenarioOptions } from '../data/historicalScenarios';
import { useState } from 'react';

export default function MonteCarloStats({ results }) {
  const [selectedScenario, setSelectedScenario] = useState('random');
  const [customRange, setCustomRange] = useState({
    equityMin: -20,
    equityMax: 40,
    cryptoMin: -30,
    cryptoMax: 100
  });

  if (!results) {
    return null;
  }

  const { iterations, successRate, finalBalances } = results;
  const scenarios = getScenarioOptions();

  return (
    <div className="space-y-6">
      {/* Historical Scenario Selector */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
          📜 Historical Scenario Stress Test
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Test your plan against real market history. What if you retired into these conditions?
        </p>
        <div className="flex items-center gap-3">
          <select
            id="historical-scenario"
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="flex-1 text-xs px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const scenarioId = document.getElementById('historical-scenario')?.value || 'random';
              const detail = { scenarioId };

              // If userDefined, include custom range
              if (scenarioId === 'userDefined') {
                detail.customRange = customRange;
              }

              window.dispatchEvent(new CustomEvent('runScenarioSimulation', { detail }));
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
          >
            Run Scenario
          </button>
        </div>

        {/* User-Defined Range Inputs */}
        {selectedScenario === 'userDefined' && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-indigo-200 dark:border-indigo-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ⚙️ Custom Return Range
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                  Equity Min (%)
                </label>
                <input
                  type="number"
                  value={customRange.equityMin}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, equityMin: Number(e.target.value) }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  min="-100"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                  Equity Max (%)
                </label>
                <input
                  type="number"
                  value={customRange.equityMax}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, equityMax: Number(e.target.value) }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  min="-100"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                  Crypto Min (%)
                </label>
                <input
                  type="number"
                  value={customRange.cryptoMin}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, cryptoMin: Number(e.target.value) }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  min="-100"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                  Crypto Max (%)
                </label>
                <input
                  type="number"
                  value={customRange.cryptoMax}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, cryptoMax: Number(e.target.value) }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  min="-100"
                  max="500"
                />
              </div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
              Returns will be randomly generated within these ranges for each year
            </div>
          </div>
        )}

        {results.scenarioId && results.scenarioId !== 'random' && (
          <div className="mt-2 text-xs text-indigo-700 dark:text-indigo-400">
            ⚠️ Showing results for: <strong>{scenarios.find(s => s.id === results.scenarioId)?.name || results.scenarioId}</strong>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Number of Runs</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {iterations.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Success Rate</div>
          <div className="text-sm font-bold text-green-600">
            {(successRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average Final</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            ${Math.round(finalBalances?.mean || 0).toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Median Final</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            ${Math.round(finalBalances?.median || 0).toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">10th %ile (Low)</div>
          <div className="text-sm font-bold text-red-600">
            ${Math.round(finalBalances?.p10 || 0).toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">90th %ile (High)</div>
          <div className="text-sm font-bold text-green-600">
            ${Math.round(finalBalances?.p90 || 0).toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Range</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            ${Math.round((finalBalances?.p90 || 0) - (finalBalances?.p10 || 0)).toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 group relative cursor-help">
            Net Worth Growth (CAGR)
            <span className="hidden group-hover:block absolute z-20 w-48 p-1.5 text-[10px] bg-gray-900/95 text-white rounded shadow-lg -left-10 -top-16 normal-case font-normal leading-tight backdrop-blur-sm border border-gray-700">
              Compound Annual Growth Rate of your ending balance. Lower than market return because it accounts for withdrawals draining the principal.
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {finalBalances?.median && finalBalances.median > 0 && results?.initialBalance > 0 && results?.years > 0 ?
              ((Math.pow(finalBalances.median / results.initialBalance, 1 / results.years) - 1) * 100).toFixed(1) + '%' :
              (finalBalances?.median === 0 ? '—' : 'N/A')}
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-2">
        {results?.failureStats?.count > 0 ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
              ⚠️ Failure Analysis ({((1 - results.successRate) * 100).toFixed(1)}% Risk)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Total Failed Runs</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {results.failureStats.count.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Avg Age of Depletion</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(results.failureStats.averageAgeOfRuin)} years old
                </span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Earliest Failure</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Age {results.failureStats.minAgeOfRuin}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-red-700 dark:text-red-400">
              {'* "Failure" means the portfolio hit $0 before the end of the plan (Age 90).'}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-4">
            <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
              ✅ 100% Success Rate
            </h3>
            <p className="text-xs text-green-700 dark:text-green-400">Your plan never ran out of money in {results?.iterations?.toLocaleString()} simulations.</p>
          </div>
        )}

        {/* Two-Column Spending Optimizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* SPEND LESS - Increase Success Rate */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
              📉 Spend Less → Higher Success
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Reduce spending to increase success rate.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 dark:text-gray-300">Spend:</label>
                <select
                  defaultValue="90"
                  className="text-xs px-2 py-1 border border-green-300 dark:border-green-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  id="spend-less-percent"
                >
                  <option value="50">50%</option>
                  <option value="60">60%</option>
                  <option value="70">70%</option>
                  <option value="75">75%</option>
                  <option value="80">80%</option>
                  <option value="85">85%</option>
                  <option value="90">90%</option>
                  <option value="95">95%</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const pct = parseInt(document.getElementById('spend-less-percent')?.value || '90') / 100;
                  window.dispatchEvent(new CustomEvent('runSpendingSimulation', { detail: { spendingMultiplier: pct } }));
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
              >
                Simulate
              </button>
            </div>
            <ul className="list-disc list-inside text-[10px] text-gray-600 dark:text-gray-400 space-y-0.5">
              <li>Cut discretionary spending</li>
              <li>Downsize housing</li>
              <li>Delay major purchases</li>
            </ul>
          </div>

          {/* SPEND MORE - See Impact */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              📈 Spend More → See Impact
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Explore what happens with higher lifestyle spending.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 dark:text-gray-300">Spend:</label>
                <select
                  defaultValue="110"
                  className="text-xs px-2 py-1 border border-amber-300 dark:border-amber-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  id="spend-more-percent"
                >
                  <option value="105">105%</option>
                  <option value="110">110%</option>
                  <option value="115">115%</option>
                  <option value="120">120%</option>
                  <option value="125">125%</option>
                  <option value="135">135%</option>
                  <option value="140">140%</option>
                  <option value="150">150%</option>
                  <option value="160">160%</option>
                  <option value="170">170%</option>
                  <option value="180">180%</option>
                  <option value="190">190%</option>
                  <option value="200">200%</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const pct = parseInt(document.getElementById('spend-more-percent')?.value || '110') / 100;
                  window.dispatchEvent(new CustomEvent('runSpendingSimulation', { detail: { spendingMultiplier: pct } }));
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded transition-colors"
              >
                Simulate
              </button>
            </div>
            <ul className="list-disc list-inside text-[10px] text-gray-600 dark:text-gray-400 space-y-0.5">
              <li>Upgrade lifestyle</li>
              <li>More travel & experiences</li>
              <li>Help family financially</li>
            </ul>
          </div>
        </div>

        {/* Original Target Success Rate - kept for power users */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mt-3">
          <details className="text-xs">
            <summary className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium">
              🎯 Advanced: Target Success Rate Optimizer
            </summary>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 dark:text-gray-300">Target:</label>
                <select
                  defaultValue="80"
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  id="target-success-rate"
                >
                  <option value="50">50%</option>
                  <option value="60">60%</option>
                  <option value="70">70%</option>
                  <option value="75">75%</option>
                  <option value="80">80%</option>
                  <option value="85">85%</option>
                  <option value="90">90%</option>
                  <option value="95">95%</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const target = parseInt(document.getElementById('target-success-rate')?.value || '90') / 100;
                  window.dispatchEvent(new CustomEvent('runSuccessOptimizer', { detail: { target } }));
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Optimize
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
