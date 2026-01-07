/**
 * ConeChart - Interactive Chart.js visualization of Monte Carlo results
 *
 * Displays cone of uncertainty (10th-90th percentiles) with interactive tooltips
 *
 * @module ConeChart
 */

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ConeChart Component
 * @param {Object} props
 * @param {Object} props.percentiles - Percentile data from Monte Carlo
 * @param {number} props.startAge - Starting age
 * @param {boolean} props.darkMode - Dark mode flag
 */
export default function ConeChart({ percentiles, startAge, darkMode = false }) {
  const chartRef = useRef(null);

  if (!percentiles || !percentiles.p50) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Run Monte Carlo simulation to see cone of uncertainty
      </div>
    );
  }

  const years = percentiles.p50.length;
  const labels = Array.from({ length: years }, (_, i) => startAge + i);

  const chartData = {
    labels,
    datasets: [
      {
        label: '90th Percentile',
        data: percentiles.p90,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: '+1',
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: '75th Percentile',
        data: percentiles.p75,
        borderColor: 'rgba(59, 130, 246, 0.4)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: '+1',
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Median (50th)',
        data: percentiles.p50,
        borderColor: darkMode ? 'rgba(96, 165, 250, 1)' : 'rgba(59, 130, 246, 1)',
        backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: '25th Percentile',
        data: percentiles.p25,
        borderColor: 'rgba(59, 130, 246, 0.4)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: '-1',
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: '10th Percentile',
        data: percentiles.p10,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: '-1',
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
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
      title: {
        display: true,
        text: 'Projected Net Worth by Age',
        color: darkMode ? '#d1d5db' : '#374151',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#e5e7eb' : '#111827',
        bodyColor: darkMode ? '#e5e7eb' : '#111827',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            // Standardize tooltip format to $M for consistency if values are large
            if (Math.abs(value) >= 1000000) {
              return `${context.dataset.label}: $${(value / 1000000).toFixed(2)}M`;
            }
            return `${context.dataset.label}: $${(value / 1000).toFixed(0)}k`;
          }
        }
      }
    },
    scales: {
      x: {
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
            return '$' + (value / 1000000).toFixed(1) + 'M';
          }
        },
        beginAtZero: true
      }
    }
  };

  // Chart will be managed by react-chartjs-2

  return (
    <div className="h-80 w-full" role="img" aria-label="Monte Carlo cone of uncertainty chart">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
