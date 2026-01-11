/**
 * NetWorthChart - Stacked bar chart showing asset allocation over time
 *
 * Displays all asset types (Traditional, Roth, HSA, Brokerage, Crypto, Mortgage)
 * with interactive tooltips showing detailed breakdown
 *
 * @module NetWorthChart
 */

import { useRef } from 'react';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement, // Added
  PointElement, // Added
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2'; // Change Bar to Chart for mixed type

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement, // Added
  PointElement, // Added
  Title,
  Tooltip,
  Legend
);

/**
 * NetWorthChart Component
 * @param {Object} props
 * @param {Array} props.ledger - Year-by-year ledger data
 * @param {boolean} props.darkMode - Dark mode flag
 */
import defaultProfile from '../data/defaultProfile.json';

export default function NetWorthChart({ ledger, darkMode = false, showFITarget = true }) {
  const chartRef = useRef(null);
  const colors = defaultProfile.uiTheme?.colors || {};

  if (!ledger || ledger.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Calculate plan to see net worth trajectory
      </div>
    );
  }

  // Show all years
  const labels = ledger.map((y) => y.age);

  const chartData = {
    labels,
    datasets: [
      ...(ledger[0]?.expenses
        ? [
            {
              type: 'line',
              label: 'Annual Expenses',
              data: ledger.map((y) => y.expenses.total),
              borderColor: 'rgba(239, 68, 68, 0.8)', // Red
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
              tension: 0.4,
              yAxisID: 'y1', // Explicitly map to right axis
              order: 0,
            },
          ]
        : []),
      ...(showFITarget
        ? [
            {
              type: 'line',
              label: 'Financial Independence Target',
              data: ledger.map((y) => (y.expenses?.total || 0) * 25),
              borderColor: 'rgba(59, 130, 246, 0.9)', // Blue
              borderWidth: 2,
              borderDash: [5, 5], // Dashed line
              pointRadius: 0,
              fill: false,
              tension: 0.4,
              order: 0, // Draw on top
            },
          ]
        : []),
      {
        type: 'bar',
        label: 'Mortgage',
        data: ledger.map((y) => -(y.balances?.mortgageBalance || 0)),
        backgroundColor: colors.mortgage || 'rgba(220, 38, 38, 0.8)',
        borderColor: colors.mortgage || 'rgba(220, 38, 38, 1)',
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'Brokerage',
        data: ledger.map((y) => y.balances?.brokerage || 0),
        backgroundColor: colors.brokerage,
        borderColor: colors.brokerage,
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'HSA',
        data: ledger.map((y) => y.balances?.hsa || 0),
        backgroundColor: colors.hsa,
        borderColor: colors.hsa,
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'Roth',
        data: ledger.map((y) => y.balances?.roth || 0),
        backgroundColor: colors.roth,
        borderColor: colors.roth,
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'Traditional',
        data: ledger.map((y) => y.balances?.traditional || 0),
        backgroundColor: colors.traditional,
        borderColor: colors.traditional,
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'Crypto',
        data: ledger.map((y) => y.balances?.crypto || 0),
        backgroundColor: colors.crypto,
        borderColor: colors.crypto,
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'Cash',
        data: ledger.map((y) => y.balances?.cash || 0),
        backgroundColor: colors.cash,
        borderColor: colors.cash,
        borderWidth: 1,
        order: 1,
      },
      {
        type: 'bar',
        label: 'Real Estate',
        data: ledger.map((y) => y.balances?.realEstate || 0),
        backgroundColor: colors.realEstate,
        borderColor: colors.realEstate,
        borderWidth: 1,
        order: 1,
      },
    ],
  };

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
        text: 'Net Worth Trajectory',
        align: 'center',
        color: darkMode ? '#d1d5db' : '#374151',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          boxWidth: 8, // Smaller box
          padding: 10, // Tighter padding
          font: {
            size: 10, // Smaller font to fit single line
          },
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
        borderWidth: defaultProfile.uiTheme?.tooltip?.borderWidth ?? 2,
        padding: defaultProfile.uiTheme?.tooltip?.padding ?? 16,
        titleFont: defaultProfile.uiTheme?.tooltip?.titleFont || { size: 16, weight: 'bold' },
        bodyFont: defaultProfile.uiTheme?.tooltip?.bodyFont || { size: 13 },
        displayColors: defaultProfile.uiTheme?.tooltip?.displayColors ?? true,
        boxPadding: defaultProfile.uiTheme?.tooltip?.boxPadding ?? 4,
        filter: function (tooltipItem) {
          // Only show items with non-zero values
          return Math.abs(tooltipItem.raw) > 0.01;
        },
        itemSort: (a, b) => {
          // Sort by absolute value descending (largest bars first)
          return Math.abs(b.raw) - Math.abs(a.raw);
        },
        callbacks: {
          title: function (context) {
            if (!context || !context[0]) return '';
            return `Age ${context[0].label}`;
          },
          label: function (context) {
            // Show color-coded labels for each asset
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const sign = value < 0 ? '-' : '';
            const formattedValue = `${sign}${formatCurrency(Math.abs(value))}`;
            return `${label}: ${formattedValue}`;
          },
          afterBody: function (tooltipItems) {
            if (!tooltipItems || !tooltipItems[0]) return '';
            const yearData = ledger[tooltipItems[0].dataIndex];
            if (!yearData) return '';

            const traditional = yearData.balances?.traditional || 0;
            const roth = yearData.balances?.roth || 0;
            const hsa = yearData.balances?.hsa || 0;
            const brokerage = yearData.balances?.brokerage || 0;
            const crypto = yearData.balances?.crypto || 0;
            const cash = yearData.balances?.cash || 0;
            const realEstate = yearData.balances?.realEstate || 0;
            const mortgageBalance = yearData.balances?.mortgageBalance || 0;

            const financialAssets = traditional + roth + hsa + brokerage + crypto + cash;
            const totalAssets = financialAssets + realEstate;
            const netWorth = totalAssets - mortgageBalance;

            const fiTarget = (yearData.expenses?.total || 0) * 25;

            const mortgageDisplay =
              mortgageBalance > 0 ? `-${formatCurrency(mortgageBalance)}` : '$0';

            return [
              '─────────────────────────',
              `💰 Financial: ${formatCurrency(financialAssets)}`,
              `🏠 Real Estate: ${formatCurrency(realEstate)}`,
              `🏦 Mortgage: ${mortgageDisplay}`,
              '─────────────────────────',
              ...(showFITarget ? [`🎯 FI Target: ${formatCurrency(fiTarget)}`] : []),
              `📊 Net Worth: ${formatCurrency(netWorth)}`,
            ];
          },
          footer: function () {
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Age',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Net Worth ($)',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          callback: function (value) {
            return formatCompactCurrency(value);
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        stacked: false,
        title: {
          display: true,
          text: 'Expenses ($)',
          color: 'rgba(239, 68, 68, 0.8)',
        },
        ticks: {
          color: 'rgba(239, 68, 68, 0.8)',
          callback: function (value) {
            return formatCompactCurrency(value);
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Chart will be managed by react-chartjs-2

  return (
    <div className="h-96 w-full" role="img" aria-label="Net worth trajectory chart">
      <Chart type="bar" ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
