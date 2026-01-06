/**
 * Dashboard - Main dashboard with KPI cards and summary
 *
 * @module Dashboard
 */

import { usePlan } from '../contexts/PlanContext';
import { useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const { planData, calculateLedger, calculateSuccess, ledger, isCalculating } = usePlan();

  // Auto-calculate on mount and when plan data changes
  useEffect(() => {
    if (planData) {
      calculateLedger();
    }
  }, [planData, calculateLedger]);

  const success = calculateSuccess;

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Calculating...</div>
        </div>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Click "Calculate Plan" to see results
      </div>
    );
  }

  const finalYear = ledger[ledger.length - 1];
  const lifetimeTax = ledger.reduce((sum, year) => sum + (year.taxes?.totalTax || 0), 0);

  // Estate Metrics
  const estateReport = finalYear?.estateReport || { net: { total: 0 }, taxes: { estate: 0 } };
  const netToHeirs = estateReport.net.total;
  const estateTax = estateReport.taxes.estate;
  const grossEstate = (finalYear?.totalBalance || 0) + (finalYear?.balances?.realEstate || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Outcome</div>
          <div className={`text-lg font-bold ${success.success ? 'text-green-600' : 'text-red-600'}`}>
            {success.success ? 'Solvent (95+)' : `Depleted (Age ${success.depletionAge || '??'})`}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Final Balance</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(success.finalBalance || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net Worth</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(finalYear?.netWorth || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lifetime Tax</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(lifetimeTax || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lifetime SS</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(ledger.reduce((sum, year) => sum + (year.income?.ss || 0), 0))}
          </div>
        </div>

        {/* Heritage Value */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mb-1 font-semibold">Net to Heirs</div>
          <div className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(netToHeirs)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">🏰 Estate Value</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(grossEstate)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Estate Tax</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            -{formatCurrency(estateTax)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Asset Allocation Over Time</h3>
        <div className="grid grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Traditional</div>
            <div className="text-sm font-bold text-blue-600">
              {formatCurrency(finalYear?.balances?.traditional || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Roth</div>
            <div className="text-sm font-bold text-purple-600">
              {formatCurrency(finalYear?.balances?.roth || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">HSA</div>
            <div className="text-sm font-bold text-pink-600">
              {formatCurrency(finalYear?.balances?.hsa || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Brokerage</div>
            <div className="text-sm font-bold text-cyan-600">
              {formatCurrency(finalYear?.balances?.brokerage || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Crypto</div>
            <div className="text-sm font-bold text-amber-600">
              {formatCurrency(finalYear?.balances?.crypto || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Real Estate</div>
            <div className="text-sm font-bold text-indigo-600">
              {formatCurrency(finalYear?.balances?.realEstate || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
