/**
 * RMDTracker - Track Required Minimum Distributions
 *
 * Shows RMD amounts by age starting at 73
 *
 * @module RMDTracker
 */

import { usePlan } from '../contexts/PlanContext';
import { calculateRMD } from '../lib/taxEngine';

export default function RMDTracker() {
  const { ledger, darkMode } = usePlan(); // Ensure darkMode is available in context

  if (!ledger || ledger.length === 0) {
    return null;
  }

  // Find first RMD year (age 73+)
  const rmdYears = ledger
    .filter(year => year.age >= 73)
    .slice(0, 10) // Show next 10 years
    .map(year => ({
      age: year.age,
      balance: year.balances?.traditional || 0,
      rmd: calculateRMD(year.balances?.traditional || 0, year.age)
    }));

  if (rmdYears.length === 0) return null;

  // Simple Inline Bar Chart Data (using simple CSS for lightness, or we could import Chart.js)
  // Let's use a simple CSS bar visualization to keep it lightweight and "smaller" as requested.
  const maxRMD = Math.max(...rmdYears.map(r => r.rmd));

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <span>📉</span> RMD Schedule
      </h3>

      <div className="flex gap-4">
        {/* Left: Table */}
        <div className="space-y-1 text-xs w-1/2">
          {rmdYears.map((rmd, idx) => (
            <div key={idx} className="flex justify-between items-center group hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 transition-colors">
              <span className="text-gray-500 dark:text-gray-400 w-12">Age {rmd.age}</span>
              <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                ${rmd.rmd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Micro Bar Chart */}
        <div className="w-1/2 flex items-end gap-1 h-32 border-b border-gray-200 dark:border-gray-700 pb-1">
          {rmdYears.map((rmd, idx) => {
            const height = maxRMD > 0 ? (rmd.rmd / maxRMD) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end group relative">
                <div
                  className="w-full bg-cyan-500/80 hover:bg-cyan-400 transition-all rounded-t-sm"
                  style={{ height: `${height}%` }}
                ></div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 bg-gray-900 text-white text-[10px] px-1 py-0.5 rounded whitespace-nowrap">
                  ${(rmd.rmd / 1000).toFixed(0)}k
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
