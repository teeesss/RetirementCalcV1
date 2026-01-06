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
  const { ledger } = usePlan();

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

  if (rmdYears.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">RMD Schedule</h3>
      <div className="space-y-1 text-xs">
        {rmdYears.map((rmd, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Age {rmd.age}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ${rmd.rmd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
