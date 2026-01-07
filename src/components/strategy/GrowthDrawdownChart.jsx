import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    LineController,
    BarController
} from 'chart.js';
import { formatCurrency } from '../../utils/formatters';
import defaultProfile from '../../data/defaultProfile.json';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    LineController,
    BarController
);

/**
 * GrowthDrawdownChart - Visualizes the relationship between asset growth and withdrawals
 *
 * Data source: ledger[].metrics
 */
export default function GrowthDrawdownChart({ ledger, darkMode = false }) {
    const chartData = useMemo(() => {
        if (!ledger || ledger.length === 0) return null;

        const labels = ledger.map(entry => `Age ${entry.age}`);

        return {
            labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Total Asset Growth (Cumulative)',
                    // Now using the pre-calculated single source of truth from ledgerLogic
                    data: ledger.map(entry => entry.metrics?.cumulativeAssetGrowth || 0),
                    borderColor: 'rgb(147, 51, 234)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.4,
                    yAxisID: 'y1', // Use secondary axis
                    hidden: false // Visible by default
                },
                {
                    type: 'line',
                    label: 'Yearly Asset Growth',
                    data: ledger.map(entry => entry.metrics?.yearlyAssetGrowth || 0),
                    borderColor: 'rgb(34, 197, 94)', // Green
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    yAxisID: 'y',
                },
                {
                    type: 'bar',
                    label: 'Yearly Drawdown',
                    data: ledger.map(entry => entry.metrics?.totalWithdrawals || 0),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    type: 'bar',
                    label: 'Net Cash Flow (+/-)',
                    data: ledger.map(entry => entry.metrics?.yearlyNetDifference || 0),
                    backgroundColor: (ctx) => {
                        const val = ctx.raw;
                        return val >= 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(249, 115, 22, 0.6)';
                    },
                    borderColor: (ctx) => {
                        const val = ctx.raw;
                        return val >= 0 ? 'rgb(59, 130, 246)' : 'rgb(249, 115, 22)';
                    },
                    borderWidth: 1,
                    yAxisID: 'y',
                }
            ]
        };
    }, [ledger]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: darkMode ? '#d1d5db' : '#374151',
                    usePointStyle: true,
                    boxWidth: 6,
                    font: { size: 10 }
                }
            },
            tooltip: {
                backgroundColor: darkMode ? defaultProfile.uiTheme.tooltip.backgroundColor.dark : defaultProfile.uiTheme.tooltip.backgroundColor.light,
                titleColor: darkMode ? defaultProfile.uiTheme.tooltip.titleColor.dark : defaultProfile.uiTheme.tooltip.titleColor.light,
                bodyColor: darkMode ? defaultProfile.uiTheme.tooltip.bodyColor.dark : defaultProfile.uiTheme.tooltip.bodyColor.light,
                borderColor: darkMode ? defaultProfile.uiTheme.tooltip.borderColor.dark : defaultProfile.uiTheme.tooltip.borderColor.light,
                borderWidth: defaultProfile.uiTheme.tooltip.borderWidth,
                padding: defaultProfile.uiTheme.tooltip.padding,
                titleFont: defaultProfile.uiTheme.tooltip.titleFont,
                bodyFont: defaultProfile.uiTheme.tooltip.bodyFont,
                displayColors: defaultProfile.uiTheme.tooltip.displayColors,
                boxPadding: defaultProfile.uiTheme.tooltip.boxPadding,
                mode: 'index',
                intersect: false,
                filter: function (tooltipItem) {
                    // Filter out zero values and the cumulative line (shown in summary)
                    if (Math.abs(tooltipItem.raw) <= 0.01) return false;
                    if (tooltipItem.dataset.label === 'Total Asset Growth (Cumulative)') return false;
                    return true;
                },
                itemSort: (a, b) => {
                    const aVal = a.raw;
                    const bVal = b.raw;

                    // Both positive or both negative: sort by absolute value descending
                    if ((aVal >= 0 && bVal >= 0) || (aVal < 0 && bVal < 0)) {
                        return Math.abs(bVal) - Math.abs(aVal);
                    }
                    // One positive, one negative: positive first
                    return bVal - aVal;
                },
                callbacks: {
                    title: (ctx) => `Age ${ctx[0].label}`,
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    },
                    afterBody: function (tooltipItems) {
                        if (!tooltipItems || tooltipItems.length === 0) return [];

                        const index = tooltipItems[0].dataIndex;
                        const yearData = ledger[index];

                        // Get cumulative growth from the data
                        const cumulativeGrowth = yearData.metrics?.cumulativeAssetGrowth || 0;

                        return [
                            '─────────────────────────',
                            `📈 Total Asset Growth (Cumulative): ${formatCurrency(cumulativeGrowth)}`
                        ];
                    }
                }
            },
            title: {
                display: true,
                text: 'Asset Growth vs. Drawdown Dynamics',
                color: darkMode ? '#d1d5db' : '#374151',
                font: { size: 14, weight: 'bold' }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Yearly Flow'
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { size: 10 },
                    callback: (value) => {
                        const abs = Math.abs(value);
                        if (abs >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'm';
                        return '$' + (value / 1000).toFixed(0) + 'k';
                    }
                },
                // PUSH BARS DOWN: Set max to 3x the highest yearly value so bars only take up bottom 33%
                suggestedMax: (ctx) => {
                    // Try to find max of visible datasets on this axis
                    // This creates visual separation between Yearly (Low) and Cumulative (High)
                    const max = ctx.chart.data.datasets
                        .filter(d => d.yAxisID === 'y' && !d.hidden)
                        .reduce((acc, d) => Math.max(acc, Math.max(...d.data)), 0);
                    return max * 3;
                },
                grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Total Cumulative Growth'
                },
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                ticks: {
                    color: 'rgb(147, 51, 234)', // Purple-600 to match line
                    font: { size: 10, weight: 'bold' },
                    callback: (value) => '$' + (value / 1000000).toFixed(0) + 'M'
                },
                suggestedMax: (ctx) => {
                    // Find max of the Cumulative Growth line (yAxisID 'y1') to add dynamic headroom
                    const cumulativeDS = ctx.chart.data.datasets.find(d => d.yAxisID === 'y1');
                    if (cumulativeDS && cumulativeDS.data.length > 0) {
                        const maxVal = Math.max(...cumulativeDS.data);
                        return maxVal * 1.1; // 10% buffer allows it to go just "over"
                    }
                    return undefined;
                }
            },
            x: {
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { size: 9 },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    display: false
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        }
    };

    if (!chartData) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs italic">
                Calculate plan to see growth dynamics
            </div>
        );
    }

    return (
        <div className="w-full h-full p-2">
            <Bar data={chartData} options={options} />
        </div>
    );
}
