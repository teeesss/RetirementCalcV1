/**
 * TaxSummary - Component displaying tax breakdown and heatmap
 *
 * Shows annual taxes, effective rates, and lifetime tax summary
 *
 * @module TaxSummary
 */

import { usePlan } from '../contexts/PlanContext';
import { calculateRMD } from '../lib/taxEngine';
import { formatCurrency, formatCompactCurrency, formatPercent } from '../utils/formatters';

export default function TaxSummary() {
  const { ledger } = usePlan();

  if (!ledger || ledger.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Calculate plan to see tax summary
      </div>
    );
  }

  const lifetimeTax = ledger.reduce((sum, year) => sum + (year.taxes?.totalTax || 0), 0);
  const avgEffectiveRate = ledger.reduce((sum, year) => {
    const rate = year.taxes?.effectiveRate || 0;
    return sum + rate;
  }, 0) / ledger.length;

  // Find years with highest taxes for heatmap
  const maxTax = Math.max(...ledger.map(y => y.taxes?.totalTax || 0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Lifetime Tax</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(lifetimeTax)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Effective Rate</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatPercent(avgEffectiveRate * 100)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Peak Tax Year</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {ledger.reduce((max, y, i) =>
              (y.taxes?.totalTax || 0) > (ledger[max].taxes?.totalTax || 0) ? i : max, 0
            ) + ledger[0]?.age || 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tax Heatmap by Age</h3>
        <div className="grid grid-cols-10 gap-1">
          {ledger.map((year, idx) => {
            const tax = year.taxes?.totalTax || 0;
            const intensity = maxTax > 0 ? tax / maxTax : 0;
            const color = intensity > 0.7 ? 'bg-red-600' :
              intensity > 0.4 ? 'bg-orange-500' :
                intensity > 0.2 ? 'bg-yellow-400' :
                  'bg-green-300';

            return (
              <div
                key={idx}
                className={`${color} h-8 rounded text-xs flex items-center justify-center text-white font-medium`}
                title={`Age ${year.age}: ${formatCurrency(tax)}`}
                role="img"
                aria-label={`Age ${year.age} tax: ${formatCurrency(tax)}`}
              >
                {year.age % 5 === 0 ? year.age : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* User Guidance Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📘 Understanding Your Tax Breakdown</h4>
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
          <p className="font-medium">Column Definitions:</p>
          <ul className="space-y-1 ml-4 grid grid-cols-2 gap-x-4">
            <li><strong>RMD:</strong> Required distributions from Traditional IRA (age 73+)</li>
            <li><strong>Trad:</strong> Voluntary Traditional IRA withdrawals (fully taxable)</li>
            <li><strong>Roth:</strong> Tax-free Roth IRA withdrawals</li>
            <li><strong>Brok:</strong> Brokerage/crypto sales (capital gains)</li>
            <li><strong>Tax SS:</strong> Taxable portion of Social Security</li>
            <li><strong>AGI:</strong> Adjusted Gross Income</li>
            <li><strong>CG Tax:</strong> Capital Gains Tax (0-20%)</li>
            <li><strong>Fed Tax:</strong> Federal Income Tax</li>
            <li><strong>FICA:</strong> Payroll taxes on wages</li>
            <li><strong>Med+:</strong> Additional Medicare Tax (0.9%)</li>
            <li><strong>NIIT:</strong> Net Investment Income Tax (3.8%)</li>
            <li><strong>Total:</strong> All taxes combined</li>
          </ul>
          <p className="text-xs text-blue-700 dark:text-blue-400 italic mt-2">💡 Watch for the "tax torpedo" when Social Security becomes taxable, spiking marginal rates to 40%+</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tax Breakdown by Year</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Age</th>
                <th className="text-center py-2 text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">RMD</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Trad</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Roth</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Brok</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cryp</th>
                <th className="text-center py-2 text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wider">Tax SS</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Divs</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">AGI</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider" title="Cap Gains Tax">CG Tax</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fed Tax</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">FICA</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Med+</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">NIIT</th>
                <th className="text-center py-2 text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wider">ACA</th>
                <th className="text-center py-2 text-[10px] text-gray-900 dark:text-gray-100 font-bold uppercase tracking-wider">Total</th>
                <th className="text-center py-2 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rate</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((year, idx) => {
                const prevBalance = idx > 0 ? (ledger[idx - 1].balances?.traditional || 0) : (year.balances?.traditional || 0);
                const rmd = year.age >= 73 ? calculateRMD(prevBalance, year.age) : 0;

                return (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-1 text-[10px] text-gray-900 dark:text-gray-100 font-bold">{year.age}</td>
                    <td className="text-center py-1 text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                      {rmd > 0 ? formatCompactCurrency(rmd) : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.withdrawals?.traditional || 0) > 0 ? formatCompactCurrency(year.withdrawals.traditional || 0) : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.withdrawals?.roth || 0) > 0 ? formatCompactCurrency(year.withdrawals.roth || 0) : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.withdrawals?.brokerage || 0) > 0 ? formatCompactCurrency(year.withdrawals.brokerage || 0) : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.withdrawals?.crypto || 0) > 0 ? formatCompactCurrency(year.withdrawals.crypto || 0) : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                      {(year.taxes?.taxableSS || 0) > 0 ? formatCompactCurrency(year.taxes.taxableSS || 0) : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {/* Divs */}
                      {(year.income?.dividends?.total || 0) > 0 ? `${((year.income.dividends.total || 0) / 1000).toFixed(1)}k` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {formatCompactCurrency(year.taxes?.agi || 0)}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.taxes?.capGainsTax || 0) > 0 ? `${(year.taxes.capGainsTax || 0).toFixed(0)}` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.taxes?.federalIncomeTax || 0) > 0 ? `${(year.taxes.federalIncomeTax || 0).toFixed(0)}` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.taxes?.fica?.total || 0) > 0 ? `${(year.taxes.fica.total || 0).toFixed(0)}` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.taxes?.fica?.addlMedicare || 0) > 0 ? `${(year.taxes.fica.addlMedicare || 0).toFixed(0)}` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {(year.taxes?.niit || 0) > 0 ? `${(year.taxes.niit || 0).toFixed(0)}` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-green-600 dark:text-green-400">
                      {(year.aca?.subsidy || 0) > 0 ? `-${(year.aca.subsidy || 0).toFixed(0)}` : '-'}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-900 dark:text-gray-100 font-bold">
                      {formatCurrency(year.taxes?.totalTax || 0)}
                    </td>
                    <td className="text-center py-1 text-[10px] text-gray-700 dark:text-gray-300">
                      {formatPercent(year.taxes?.effectiveRate * 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
}
