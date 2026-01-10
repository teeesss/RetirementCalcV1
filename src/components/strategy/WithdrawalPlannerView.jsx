/**
 * Withdrawal Planner View
 *
 * High-fidelity visualization of multi-year withdrawals from all asset buckets.
 * Provides dynamic breakdown and tax impact analysis.
 */

import { useState, useMemo } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import WealthFlowChart from './WealthFlowChart';
import SourceAndFlowChart from './SourceAndFlowChart';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WithdrawalPlannerView({ darkMode = false }) {
  const { ledger } = usePlan();
  const [viewMode, setViewMode] = useState('chart'); // 'chart', 'flow', 'table'

  const ages = useMemo(() => ledger?.map((y) => y.age) || [], [ledger]);

  const chartData = useMemo(() => {
    if (!ledger) return { labels: [], datasets: [] };

    const datasets = [
      {
        label: 'Traditional IRA/401k',
        data: ledger.map((y) => y.withdrawals?.traditional || 0),
        backgroundColor: darkMode ? '#3b82f6aa' : '#3b82f6', // blue
      },
      {
        label: 'Brokerage',
        data: ledger.map((y) => y.withdrawals?.brokerage || 0),
        backgroundColor: darkMode ? '#f59e0baa' : '#f59e0b', // amber
      },
      {
        label: 'Crypto',
        data: ledger.map((y) => y.withdrawals?.crypto || 0),
        backgroundColor: darkMode ? '#d97706aa' : '#d97706', // amber-600
      },
      {
        label: 'Cash',
        data: ledger.map((y) => y.withdrawals?.cash || 0),
        backgroundColor: darkMode ? '#9ca3afaa' : '#9ca3af', // gray-400
      },
      {
        label: 'HSA',
        data: ledger.map((y) => y.withdrawals?.hsa || 0),
        backgroundColor: darkMode ? '#06b6d4aa' : '#06b6d4', // cyan-500
      },
      {
        label: 'Roth IRA/401k',
        data: ledger.map((y) => y.withdrawals?.roth || 0),
        backgroundColor: darkMode ? '#10b981aa' : '#10b981', // green-500
      },
    ];

    return {
      labels: ages,
      datasets: datasets.filter((ds) => ds.data.some((val) => val > 0)),
    };
  }, [ledger, ages, darkMode]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#f3f4f6' : '#1f2937',
          font: { size: 10 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Age', color: darkMode ? '#f3f4f6' : '#1f2937' },
        ticks: { color: darkMode ? '#9ca3af' : '#4b5563' },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Withdrawal Amount ($)',
          color: darkMode ? '#f3f4f6' : '#1f2937',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#4b5563',
          callback: (value) => `$${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  if (!ledger || ledger.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400 italic">
          Run calculation to visualize your multi-year withdrawal plan...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>🗓️</span> Multi-Year Withdrawal Planner
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Year-by-year optimized withdrawal sequence across all asset buckets.
          </p>
        </div>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'chart' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            Source
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'flow' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            Flow
          </button>
          <button
            onClick={() => setViewMode('combined')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'combined' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            Source + Flow
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            Table
          </button>
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'chart' && (
          <div className="h-[400px]">
            <Bar data={chartData} options={options} />
          </div>
        )}

        {viewMode === 'flow' && (
          <div className="h-[500px]">
            <WealthFlowChart ledger={ledger} darkMode={darkMode} />
          </div>
        )}

        {viewMode === 'combined' && (
          <div className="h-[500px]">
            <SourceAndFlowChart ledger={ledger} darkMode={darkMode} />
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="sticky top-0 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-left">Age</th>
                  <th className="px-3 py-2 text-right">Trad IRA</th>
                  <th className="px-3 py-2 text-right">Brokerage</th>
                  <th className="px-3 py-2 text-right">Crypto</th>
                  <th className="px-3 py-2 text-right">Cash</th>
                  <th className="px-3 py-2 text-right">HSA</th>
                  <th className="px-3 py-2 text-right">Roth</th>
                  <th className="px-3 py-2 text-right text-gray-900 dark:text-white">Total</th>
                  <th className="px-3 py-2 text-right">Tax Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ledger.map((year, idx) => {
                  const w = year.withdrawals || {};
                  const total = w.total || 0;
                  const taxRate = total > 0 ? (year.taxes?.totalTax / total) * 100 : 0;

                  if (total <= 0) return null;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="px-3 py-2 font-bold">{year.age}</td>
                      <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-medium">
                        {w.traditional > 0 ? `$${Math.round(w.traditional).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400">
                        {w.brokerage > 0 ? `$${Math.round(w.brokerage).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-500">
                        {w.crypto > 0 ? `$${Math.round(w.crypto).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                        {w.cash > 0 ? `$${Math.round(w.cash).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-cyan-600 dark:text-cyan-400">
                        {w.hsa > 0 ? `$${Math.round(w.hsa).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 font-medium">
                        {w.roth > 0 ? `$${Math.round(w.roth).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-black text-gray-900 dark:text-white">
                        ${Math.round(total).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${taxRate <= 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'}`}
                        >
                          {taxRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="text-blue-500">🛡️</span> Tax-Optimized Ordering
            </h4>
            <ol className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1 list-decimal ml-4">
              <li>
                <strong>Standard Deduction Check:</strong> Fills Bucket #1 (Traditional) up to SD
                amount ($0 Tax).
              </li>
              <li>
                <strong>0% Capital Gains:</strong> Sells Brokerage/Crypto to realize gains up to 0%
                bracket limit.
              </li>
              <li>
                <strong>Gap Filling:</strong> Uses Roth assets to cover any remaining expenses
                (Invisible to IRS).
              </li>
              <li>
                <strong>Last Resort:</strong> If Roth is exhausted, pulls from Traditional (Subject
                to Ordinary Tax).
              </li>
            </ol>
          </div>
          <div className="flex flex-col justify-center">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Lifetime Withdrawal Efficiency
                </span>
                <span className="text-xs font-black text-green-600 dark:text-green-400">HIGH</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-green-600 h-full w-[94%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-2 italic text-center">
                * Your strategy currently avoids IRMAA surcharges and minimizes &quot;Tax
                Torpedo&quot; effects on Social Security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
