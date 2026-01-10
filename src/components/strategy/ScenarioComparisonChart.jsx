import { formatCompactCurrency } from '../../utils/formatters';
import { Bar, Line } from 'react-chartjs-2';
import { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * ScenarioComparisonChart - Side-by-side comparison of two retirement scenarios
 * Compares key metrics: Ending Wealth, Total Taxes Paid, Success Rate, etc.
 */
import { usePlan } from '../../contexts/PlanContext';
import { useTaxStrategy } from '../../contexts/TaxStrategyContext';

export default function ScenarioComparisonChart({ darkMode = false }) {
  const { scenarios, ledger, monteCarloResults, planData } = usePlan();
  const { comparisonBaseline, setComparisonBaseline, comparisonProposed, setComparisonProposed } =
    useTaxStrategy();

  const allOptions = useMemo(() => {
    // Helper inline to avoid exhaustive-deps warning
    const getActiveMetrics = () => {
      const final = ledger[ledger.length - 1];
      return {
        id: 'active',
        name: 'Current Active Plan',
        endingWealth: final?.totalBalance || 0,
        cumulativeTax: ledger.reduce((sum, year) => sum + (year.taxes?.totalTax || 0), 0),
        successRate: monteCarloResults?.successRate || 0,
        legacyValue: final?.legacyValue || 0,
        annualTaxRates: ledger.map((y) => y.taxes?.effectiveRate || 0),
      };
    };
    return [
      getActiveMetrics(),
      ...scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        endingWealth: s.kpis?.endingWealth || s.kpis?.finalBalance || 0,
        cumulativeTax: s.kpis?.cumulativeTax || s.kpis?.lifetimeTax || 0,
        successRate: s.kpis?.successRate || s.kpis?.success ? 1 : 0,
        legacyValue: s.kpis?.annualLegacy
          ? s.kpis.annualLegacy[s.kpis.annualLegacy.length - 1]
          : s.kpis?.finalBalance * 0.95,
        annualTaxRates: s.kpis?.annualTaxRates || [],
      })),
    ];
  }, [scenarios, ledger, monteCarloResults?.successRate]);

  useEffect(() => {
    // Default to Active vs First Saved if available
    if (!comparisonBaseline && allOptions.length > 0) setComparisonBaseline(allOptions[0]);
    if (!comparisonProposed && allOptions.length > 1) setComparisonProposed(allOptions[1]);
  }, [
    scenarios,
    comparisonBaseline,
    comparisonProposed,
    setComparisonBaseline,
    setComparisonProposed,
    allOptions,
  ]); // Logic to init

  const currentPlan = comparisonBaseline;
  const proposedPlan = comparisonProposed;

  if (!currentPlan || !proposedPlan) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Create at least one scenario to enable comparison.
        </p>
      </div>
    );
  }

  const labels = ['Ending Wealth', 'Net Legacy Value', 'Total Tax Drag', 'Success Rate'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Current Plan',
        data: [
          currentPlan.endingWealth || 0,
          currentPlan.legacyValue || 0,
          currentPlan.cumulativeTax || currentPlan.totalTaxes || 0,
          (currentPlan.successRate || 0) * 100000, // Scale to be visible
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Proposed Plan',
        data: [
          proposedPlan.endingWealth || 0,
          proposedPlan.legacyValue || 0,
          proposedPlan.cumulativeTax || proposedPlan.totalTaxes || 0,
          (proposedPlan.successRate || 0) * 100000,
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: darkMode ? '#d1d5db' : '#374151',
          font: { size: 12, weight: 'bold' },
        },
      },
      title: {
        display: true,
        text: 'Metrics Comparison',
        color: darkMode ? '#d1d5db' : '#374151',
        font: { size: 16, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const metric = context.label;

            if (metric === 'Success Rate') {
              return `${label}: ${(value / 1000).toFixed(1)}%`;
            }
            return `${label}: ${formatCompactCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          callback: function (value) {
            return formatCompactCurrency(value);
          },
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
      },
      x: {
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
      },
    },
  };

  // --- Line Chart for Tax Trajectory ---
  const taxLabels = Array.from({ length: 50 }, (_, i) => (planData?.people?.[0]?.age || 49) + i);
  const taxLineData = {
    labels: taxLabels,
    datasets: [
      {
        label: 'Baseline Tax Rate',
        data: currentPlan.annualTaxRates || [],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Proposed Tax Rate',
        data: proposedPlan.annualTaxRates || [],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const taxLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Effective Tax Rate Trajectory ("The Widow Spike")',
        color: darkMode ? '#d1d5db' : '#374151',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val) => (val * 100).toFixed(0) + '%',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: { color: darkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(209, 213, 219, 0.5)' },
      },
      x: {
        ticks: { color: darkMode ? '#9ca3af' : '#6b7280' },
        grid: { display: false },
      },
    },
  };

  // Calculate differences
  const currentTaxVal = currentPlan.cumulativeTax || currentPlan.totalTaxes || 0;
  const proposedTaxVal = proposedPlan.cumulativeTax || proposedPlan.totalTaxes || 0;

  const wealthDiff = (proposedPlan.endingWealth || 0) - (currentPlan.endingWealth || 0);
  const taxDiff = proposedTaxVal - currentTaxVal;
  const legacyDiff = (proposedPlan.legacyValue || 0) - (currentPlan.legacyValue || 0);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Baseline Plan
          </label>
          <select
            className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
            value={comparisonBaseline?.id || ''}
            onChange={(e) => {
              const selected = allOptions.find((o) => o.id === e.target.value);
              setComparisonBaseline(selected);
            }}
          >
            {allOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Proposed Plan
          </label>
          <select
            className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
            value={comparisonProposed?.id || ''}
            onChange={(e) => {
              const selected = allOptions.find((o) => o.id === e.target.value);
              setComparisonProposed(selected);
            }}
          >
            {allOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Chart */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="h-64">
          <Bar data={data} options={options} />
        </div>
      </div>

      {/* Tax Trajectory Chart (v1.5) */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="h-64">
          <Line data={taxLineData} options={taxLineOptions} />
        </div>
        <div className="mt-2 text-[10px] text-gray-500 text-center italic">
          Visualizes the &quot;Widow Spike&quot; where tax rates may jump after a spouse passes
          away.
        </div>
      </div>

      {/* Difference Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-lg border ${wealthDiff >= 0 ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}
        >
          <div className="text-[10px] text-gray-500 uppercase font-bold">Wealth Delta</div>
          <div
            className={`text-lg font-mono font-bold ${wealthDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {wealthDiff >= 0 ? '+' : ''}
            {formatCompactCurrency(wealthDiff)}
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border ${taxDiff <= 0 ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}
        >
          <div className="text-[10px] text-gray-500 uppercase font-bold">Tax Alpha (Savings)</div>
          <div
            className={`text-lg font-mono font-bold ${taxDiff <= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}
          >
            {taxDiff <= 0 ? 'Saved ' : 'Extra '}
            {formatCompactCurrency(Math.abs(taxDiff))}
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border ${legacyDiff >= 0 ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}
        >
          <div className="text-[10px] text-gray-500 uppercase font-bold">Legacy Value</div>
          <div
            className={`text-lg font-mono font-bold ${legacyDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {legacyDiff >= 0 ? '+' : ''}
            {formatCompactCurrency(legacyDiff)}
          </div>
        </div>
      </div>
    </div>
  );
}
