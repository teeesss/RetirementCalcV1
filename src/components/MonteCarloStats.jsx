/**
 * MonteCarloStats - Detailed statistics display for Monte Carlo results
 *
 * Shows number of runs, average return, high/low, median, etc.
 *
 * @module MonteCarloStats
 */

export default function MonteCarloStats({ results, darkMode = false }) {
  if (!results) {
    return null;
  }

  const { iterations, successRate, finalBalances } = results;

  return (
    <div className="space-y-6">
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
              * "Failure" means the portfolio hit $0 before the end of the plan (Age {90}).
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

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">🎯 Target Success Rate Optimizer</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Auto-adjust spending to reach your target success rate.
          </p>
          <div className="flex items-center gap-3 mb-3">
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
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <li><strong>Reduce discretionary spending</strong> to increase success rate</li>
            <li><strong>Enable "Needs Based"</strong> withdrawals to cut spending in bad years</li>
            <li><strong>Delay retirement</strong> by 1-2 years for significant improvement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
