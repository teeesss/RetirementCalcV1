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
export default function NetWorthChart({ ledger, darkMode = false }) {
  const chartRef = useRef(null);

  if (!ledger || ledger.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Calculate plan to see net worth trajectory
      </div>
    );
  }

  // Show all years
  const labels = ledger.map(y => y.age);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'FI Target (25x Expenses)',
        data: ledger.map(y => (y.expenses?.total || 0) * 25),
        borderColor: darkMode ? 'rgba(34, 197, 94, 0.8)' : 'rgba(22, 163, 74, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.4,
        order: 0 // Draw on top
      },
      {
        type: 'bar',
        label: 'Mortgage',
        data: ledger.map(y => -(y.balances?.mortgageBalance || 0)),
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'Brokerage',
        data: ledger.map(y => y.balances?.brokerage || 0),
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'HSA',
        data: ledger.map(y => y.balances?.hsa || 0),
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'Roth',
        data: ledger.map(y => y.balances?.roth || 0),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'Traditional',
        data: ledger.map(y => y.balances?.traditional || 0),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'Crypto',
        data: ledger.map(y => y.balances?.crypto || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'Cash',
        data: ledger.map(y => y.balances?.cash || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        order: 1
      },
      {
        type: 'bar',
        label: 'Real Estate',
        data: ledger.map(y => y.balances?.realEstate || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
        order: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#e5e7eb' : '#374151',
        borderColor: darkMode ? '#4b5563' : '#d1d5db',
        borderWidth: 2,
        padding: 16,
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        displayColors: true,
        boxPadding: 8,
        callbacks: {
          title: function (context) {
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

            return [
              '',
              '─────────────────────────',
              `💰 Financial: ${formatCurrency(financialAssets)}`,
              `🏠 Real Estate: ${formatCurrency(realEstate)}`,
              `🏦 Mortgage: -${formatCurrency(mortgageBalance)}`,
              '─────────────────────────',
              `🎯 FI Target: ${formatCurrency(fiTarget)}`,
              `📊 Net Worth: ${formatCurrency(netWorth)}`
            ];
          },
          footer: function () {
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Age',
          color: darkMode ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Net Worth ($)',
          color: darkMode ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          callback: function (value) {
            return formatCompactCurrency(value);
          }
        }
      }
    }
  };

  // Chart will be managed by react-chartjs-2

  return (
    <div className="h-96 w-full" role="img" aria-label="Net worth trajectory chart">
      <Chart type='bar' ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
