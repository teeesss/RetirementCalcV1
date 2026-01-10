import { useMemo } from 'react';
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

export default function SourceAndFlowChart({ ledger, darkMode = false }) {
  const chartData = useMemo(() => {
    if (!ledger || ledger.length === 0) return null;

    const labels = ledger.map((item) => item.age);

    // Helper to safely get nested values from detailedCashFlow
    const getFlow = (item, path) => {
      const flow = item.metrics?.detailedCashFlow;
      return path.split('.').reduce((obj, key) => obj?.[key] || 0, flow);
    };

    const datasets = [
      // --- POSITIVE STACK (Value In) ---

      // 1. Asset Growth (Top of positive stack)
      {
        label: 'Asset Growth',
        data: ledger.map((item) => item.metrics?.yearlyAssetGrowth || 0),
        backgroundColor: darkMode ? '#8b5cf6' : '#7c3aed', // violet-600
        stack: 'flow',
        order: 1,
      },

      // 2. Income Sources (Use detailedCashFlow pointers)
      {
        label: 'Salary',
        data: ledger.map((item) => getFlow(item, 'inflows.salary')),
        backgroundColor: '#10b981', // emerald-500
        stack: 'flow',
        order: 2,
      },
      {
        label: 'Social Security',
        data: ledger.map((item) => getFlow(item, 'inflows.socialSecurity')),
        backgroundColor: '#34d399', // emerald-400
        stack: 'flow',
        order: 2,
      },
      {
        label: 'Pension/Other',
        data: ledger.map(
          (item) => getFlow(item, 'inflows.pension') + getFlow(item, 'inflows.other')
        ),
        backgroundColor: '#6ee7b7', // emerald-300
        stack: 'flow',
        order: 2,
      },

      // 3. Detailed Withdrawal Sources (The "Source" part)
      {
        label: 'Traditional W/D',
        data: ledger.map((item) => getFlow(item, 'drawdowns.traditional')),
        backgroundColor: darkMode ? '#3b82f6' : '#2563eb', // blue-600
        stack: 'flow',
        order: 3,
      },
      {
        label: 'Roth W/D',
        data: ledger.map((item) => getFlow(item, 'drawdowns.roth')),
        backgroundColor: darkMode ? '#10b981' : '#059669', // emerald-600
        stack: 'flow',
        order: 3,
      },
      {
        label: 'Brokerage W/D',
        data: ledger.map((item) => getFlow(item, 'drawdowns.brokerage')),
        backgroundColor: darkMode ? '#f59e0b' : '#d97706', // amber-600
        stack: 'flow',
        order: 3,
      },
      {
        label: 'Crypto W/D',
        data: ledger.map((item) => getFlow(item, 'drawdowns.crypto')),
        backgroundColor: darkMode ? '#d97706' : '#b45309', // amber-700
        stack: 'flow',
        order: 3,
      },
      {
        label: 'HSA W/D',
        data: ledger.map((item) => getFlow(item, 'drawdowns.hsa')),
        backgroundColor: darkMode ? '#06b6d4' : '#0891b2', // cyan-600
        stack: 'flow',
        order: 3,
      },
      {
        label: 'Cash W/D',
        data: ledger.map((item) => getFlow(item, 'drawdowns.cash')),
        backgroundColor: darkMode ? '#9ca3af' : '#6b7280', // gray-500
        stack: 'flow',
        order: 3,
      },

      // --- NEGATIVE STACK (Value Out) ---
      {
        label: 'Taxes',
        data: ledger.map((item) => -(getFlow(item, 'outflows.taxes.total') || 0)),
        backgroundColor: darkMode ? '#ef4444' : '#dc2626', // red-600
        stack: 'flow',
        order: 4,
      },
      {
        label: 'Expenses',
        // Sum generic expense categories for cleaner high-level view
        data: ledger.map((item) => {
          const out = item.metrics?.detailedCashFlow?.outflows || {};
          const totalExTaxes =
            (out.essential || 0) +
            (out.discretionary || 0) +
            (out.healthcare || 0) +
            (out.housing || 0) +
            (out.mortgage || 0);
          return -totalExTaxes;
        }),
        // PINK as requested
        backgroundColor: darkMode ? '#f472b6' : '#db2777', // pink-400 / pink-600
        stack: 'flow',
        order: 5,
      },
    ];

    return {
      labels,
      datasets: datasets.filter((ds) => ds.data.some((v) => Math.abs(v) > 1)), // Filter empty
    };
  }, [ledger, darkMode]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#f3f4f6' : '#1f2937',
          usePointStyle: true,
          font: { size: 10 },
          boxWidth: 8,
        },
      },
      title: {
        display: true,
        text: 'Unified Source + Flow Analysis',
        color: darkMode ? '#f3f4f6' : '#1f2937',
        font: { size: 14 },
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
              }).format(Math.abs(context.parsed.y));
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
        grid: { display: false },
      },
      y: {
        stacked: true,
        title: { display: true, text: 'Annual Flow ($)', color: darkMode ? '#f3f4f6' : '#1f2937' },
        ticks: {
          color: darkMode ? '#9ca3af' : '#4b5563',
          callback: (value) => `$${(value / 1000).toFixed(0)}k`,
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  if (!ledger || ledger.length === 0) return null;

  return (
    <div className="w-full h-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
