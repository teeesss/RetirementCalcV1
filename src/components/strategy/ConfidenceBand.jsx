import React from 'react';
import { Line } from 'react-chartjs-2';
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
 * ConfidenceBand - Shows percentile ranges (10th, 25th, 50th, 75th, 90th) of portfolio balance over time
 * Creates a "cone of uncertainty" visualization for Monte Carlo results
 */
export default function ConfidenceBand({ percentiles, years, darkMode = false }) {
    if (!percentiles || !percentiles.p50 || percentiles.p50.length === 0) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                    Run Monte Carlo simulation to see confidence intervals
                </p>
            </div>
        );
    }

    // Generate labels array - use years if provided, otherwise create from percentile length
    const numYears = percentiles.p50.length;
    const labels = years && Array.isArray(years) && years.length === numYears
        ? years.map(year => `${year}`)
        : Array.from({ length: numYears }, (_, idx) => `Year ${idx + 1}`);

    const data = {
        labels,
        datasets: [
            {
                label: '90th Percentile',
                data: percentiles.p90,
                borderColor: 'rgba(34, 197, 94, 0.3)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: '+1',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1
            },
            {
                label: '75th Percentile',
                data: percentiles.p75,
                borderColor: 'rgba(34, 197, 94, 0.5)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                fill: '+1',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1
            },
            {
                label: 'Median (50th)',
                data: percentiles.p50,
                borderColor: 'rgba(59, 130, 246, 0.8)',
                backgroundColor: 'rgba(59, 130, 246, 0)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            },
            {
                label: '25th Percentile',
                data: percentiles.p25,
                borderColor: 'rgba(239, 68, 68, 0.5)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                fill: '-1',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1
            },
            {
                label: '10th Percentile',
                data: percentiles.p10,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1
            }
        ]
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
                    usePointStyle: true,
                    boxWidth: 6
                }
            },
            title: {
                display: true,
                text: 'Portfolio Balance - Confidence Intervals',
                color: darkMode ? '#d1d5db' : '#374151',
                font: { size: 14, weight: 'bold' }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: $${(context.parsed.y / 1000).toFixed(0)}k`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    callback: function (value) {
                        return '$' + (value / 1000000).toFixed(1) + 'M';
                    }
                },
                grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                }
            },
            x: {
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="h-96">
                <Line data={data} options={options} />
            </div>
            <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center">
                The shaded area represents the range of likely outcomes. Wider bands indicate more uncertainty.
            </div>
        </div>
    );
}
