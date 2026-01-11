import { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import defaultProfile from '../../data/defaultProfile.json';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * WealthFlowChart - Comprehensive visualization of wealth dynamics
 *
 * Shows:
 * 1. Value In (Positive Stack): Income + Asset Growth
 * 2. Value Out (Negative Stack): Expenses + Taxes
 * 3. Portfolio Drawdown (Line): Reliance on assets
 */
export default function WealthFlowChart({ ledger, darkMode = false }) {
  const chartData = useMemo(() => {
    if (!ledger || ledger.length === 0) return null;

    const labels = ledger.map((entry) => `Age ${entry.age}`);

    // Data Extractors
    const income = ledger.map(
      (y) =>
        (y.metrics?.detailedCashFlow?.inflows?.salary || 0) +
        (y.metrics?.detailedCashFlow?.inflows?.socialSecurity || 0) +
        (y.metrics?.detailedCashFlow?.inflows?.pension || 0)
    );

    const assetGrowth = ledger.map((y) => y.metrics?.yearlyAssetGrowth || 0);

    const withdrawals = ledger.map((y) => y.withdrawals?.total || 0);

    const expenses = ledger.map((y) => -(y.expenses?.total || 0)); // Negative for stack
    const taxes = ledger.map((y) => -(y.taxes?.totalTax || 0)); // Negative for stack

    return {
      labels,
      datasets: [
        // --- INFLOWS (Positive Stack) ---
        {
          type: 'bar',
          label: 'Asset Growth',
          data: assetGrowth,
          backgroundColor: 'rgba(147, 51, 234, 0.7)', // Purple
          stack: 'stack0',
          order: 2,
        },
        {
          type: 'bar',
          label: 'Income (Salary/SS)',
          data: income,
          backgroundColor: 'rgba(34, 197, 94, 0.7)', // Green
          stack: 'stack0',
          order: 2,
        },

        // --- OUTFLOWS (Negative Stack) ---
        {
          type: 'bar',
          label: 'Expenses',
          data: expenses,
          backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
          stack: 'stack0',
          order: 2,
        },
        {
          type: 'bar',
          label: 'Taxes',
          data: taxes,
          backgroundColor: 'rgba(185, 28, 28, 0.7)', // Dark Red
          stack: 'stack0',
          order: 2,
        },

        // --- OVERLAYS ---
        {
          type: 'line',
          label: 'Portfolio Withdrawal',
          data: withdrawals,
          borderColor: 'rgb(59, 130, 246)', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
          order: 1,
        },
      ],
    };
  }, [ledger]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Wealth Flow: Growth vs Consumption',
        color: darkMode ? '#d1d5db' : '#374151',
        font: { size: 16, weight: 'bold' },
      },
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: darkMode
          ? defaultProfile.uiTheme?.tooltip?.backgroundColor?.dark || 'rgba(17, 24, 39, 0.98)'
          : defaultProfile.uiTheme?.tooltip?.backgroundColor?.light || 'rgba(255, 255, 255, 0.98)',
        titleColor: darkMode
          ? defaultProfile.uiTheme?.tooltip?.titleColor?.dark || '#f3f4f6'
          : defaultProfile.uiTheme?.tooltip?.titleColor?.light || '#111827',
        bodyColor: darkMode
          ? defaultProfile.uiTheme?.tooltip?.bodyColor?.dark || '#e5e7eb'
          : defaultProfile.uiTheme?.tooltip?.bodyColor?.light || '#374151',
        borderColor: darkMode
          ? defaultProfile.uiTheme?.tooltip?.borderColor?.dark || '#4b5563'
          : defaultProfile.uiTheme?.tooltip?.borderColor?.light || '#d1d5db',
        borderWidth: defaultProfile.uiTheme?.tooltip?.borderWidth ?? 1,
        callbacks: {
          title: (ctx) => (ctx?.[0]?.label ? `Age ${ctx[0].label}` : ''),
          label: (context) => {
            const label = context.dataset?.label || '';
            const value = context.parsed?.y;
            return `${label}: ${formatCurrency(value)}`;
          },
          afterBody: (items) => {
            // const yearData = ledger[idx];
            // Unused variables removed

            const totalIn = items.filter((i) => i.parsed.y > 0).reduce((a, b) => a + b.parsed.y, 0);
            const totalOut = items
              .filter((i) => i.parsed.y < 0 && i.dataset.type === 'bar')
              .reduce((a, b) => a + Math.abs(b.parsed.y), 0);

            return [
              '────────────────',
              `Total Creation: ${formatCurrency(totalIn)}`,
              `Total Consumption: ${formatCurrency(totalOut)}`,
              `Net Change: ${formatCurrency(totalIn - totalOut)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: darkMode ? '#9ca3af' : '#6b7280' },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: 'Annual Value ($)', color: darkMode ? '#9ca3af' : '#6b7280' },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          callback: (val) => formatCompactCurrency(val),
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          zeroLineColor: darkMode ? '#9ca3af' : '#4b5563',
          zeroLineWidth: 2,
        },
      },
    },
  };

  if (!chartData)
    return <div className="text-center p-10 text-gray-500">Run calculation to see wealth flow</div>;

  return (
    <div
      className={`p-4 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
    >
      <div className="h-96">
        <Chart type="bar" data={chartData} options={options} />
      </div>
      <p className="text-xs text-center text-gray-500 mt-2 italic">
        Positive bars show value creation (Income + Growth). Negative bars show consumption
        (Expenses + Taxes). The blue line tracks portfolio withdrawals.
      </p>
    </div>
  );
}
