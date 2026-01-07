/**
 * CashFlowChart - Stacked bar chart showing income sources vs expenses
 *
 * Displays sources of funds (Income, Withdrawals) vs Uses (Expenses, Taxes)
 *
 * @module CashFlowChart
 */

import { useRef } from 'react';
import { formatCurrency } from '../utils/formatters';
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
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

import defaultProfile from '../data/defaultProfile.json';
import { getStripePattern } from '../utils/chartPatterns';

export default function CashFlowChart({ ledger, darkMode = false }) {
    const chartRef = useRef(null);
    const colors = defaultProfile.uiTheme?.colors || {};

    if (!ledger || ledger.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                Calculate plan to see cash flow details
            </div>
        );
    }

    const labels = ledger.map(y => y.age);

    const chartData = {
        labels,
        datasets: [
            {
                type: 'line',
                label: 'Yearly Drawdown',
                data: ledger.map(y => (y.expenses?.total || 0) + (y.taxes?.totalTax || 0)),
                borderColor: colors.essential || 'rgba(220, 38, 38, 1)',
                backgroundColor: getStripePattern(colors.essential || 'rgba(220, 38, 38, 0.9)', 'rgba(255, 255, 255, 0.2)'),
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.1,
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'Ordinary Income (Salary+SS)',
                data: ledger.map(y => (y.income?.total || 0)),
                backgroundColor: colors.salary,
                borderColor: colors.salary,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'RMD / Trad W/D',
                data: ledger.map(y => y.withdrawals?.traditional || 0),
                backgroundColor: getStripePattern(colors.traditional, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.traditional,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'Roth W/D',
                data: ledger.map(y => y.withdrawals?.roth || 0),
                backgroundColor: getStripePattern(colors.roth, 'rgba(255, 255, 255, 0.2)'), // Pattern fill
                borderColor: colors.roth,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'Brokerage W/D',
                data: ledger.map(y => y.withdrawals?.brokerage || 0),
                backgroundColor: getStripePattern(colors.brokerage, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.brokerage,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'Cash W/D',
                data: ledger.map(y => y.withdrawals?.cash || 0),
                backgroundColor: getStripePattern(colors.cash, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.cash,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'Crypto W/D',
                data: ledger.map(y => y.withdrawals?.crypto || 0),
                backgroundColor: getStripePattern(colors.crypto, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.crypto,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'HSA W/D',
                data: ledger.map(y => y.withdrawals?.hsa || 0),
                backgroundColor: getStripePattern(colors.hsa, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.hsa,
                borderWidth: 1,
                stack: 'Stack 0',
                yAxisID: 'y'
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
            title: {
                display: true,
                text: 'Cash Flow Analysis',
                align: 'center',
                color: darkMode ? '#d1d5db' : '#374151',
                font: { size: 16, weight: 'bold' },
                padding: { top: 10, bottom: 20 }
            },
            legend: {
                position: 'bottom',
                labels: {
                    color: darkMode ? '#e5e7eb' : '#374151',
                    usePointStyle: true,
                    padding: 15,
                    font: { size: 11 }
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
                itemSort: (a, b) => {
                    // Filter will happen in beforeBody, but sort by absolute value descending
                    return Math.abs(b.raw) - Math.abs(a.raw);
                },
                filter: function (tooltipItem) {
                    // Only show items with non-zero values
                    return Math.abs(tooltipItem.raw) > 0.01;
                },
                callbacks: {
                    title: function (context) {
                        return `Age ${context[0].label}`;
                    },
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
                    beforeBody: function (tooltipItems) {
                        // Sort items: positive values first (high to low), then negative (most negative to least)
                        tooltipItems.sort((a, b) => {
                            const aVal = a.raw;
                            const bVal = b.raw;

                            // Both positive or both negative: sort by absolute value descending
                            if ((aVal >= 0 && bVal >= 0) || (aVal < 0 && bVal < 0)) {
                                return Math.abs(bVal) - Math.abs(aVal);
                            }
                            // One positive, one negative: positive first
                            return bVal - aVal;
                        });
                        return [];
                    },
                    afterBody: function (tooltipItems) {
                        const index = tooltipItems[0].dataIndex;
                        const year = ledger[index];

                        const totalIncome = (year.income?.total || 0) +
                            (year.withdrawals?.traditional || 0) +
                            (year.withdrawals?.roth || 0) +
                            (year.withdrawals?.brokerage || 0) +
                            (year.withdrawals?.crypto || 0) +
                            (year.withdrawals?.hsa || 0) +
                            (year.withdrawals?.cash || 0);

                        const totalExpenses = (year.expenses?.total || 0) + (year.taxes?.totalTax || 0);
                        const net = totalIncome - totalExpenses;

                        return [
                            '─────────────────────────',
                            `💵 Total In: ${formatCurrency(totalIncome)}`,
                            `📉 Total Out: ${formatCurrency(totalExpenses)}`,
                            '─────────────────────────',
                            `📊 Net Flow: ${net >= 0 ? '+' : ''}${formatCurrency(net)}`
                        ];
                    },
                    footer: () => ''
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
                grid: { color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)' },
                ticks: { color: darkMode ? '#9ca3af' : '#6b7280' }
            },
            y: {
                title: {
                    display: true,
                    text: 'Annual Cash Flow ($)',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                },
                grid: { color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)' },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    callback: (value) => {
                        const abs = Math.abs(value);
                        if (abs >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'm';
                        return '$' + (value / 1000).toFixed(0) + 'k';
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Annual Cash Flow ($)',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    callback: (value) => {
                        const abs = Math.abs(value);
                        if (abs >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'm';
                        return '$' + (value / 1000).toFixed(0) + 'k';
                    }
                },
                grid: {
                    drawOnChartArea: false
                },
                // Link to y axis to mirror its scale
                min: function (context) {
                    const yScale = context.chart.scales.y;
                    return yScale ? yScale.min : undefined;
                },
                max: function (context) {
                    const yScale = context.chart.scales.y;
                    return yScale ? yScale.max : undefined;
                }
            }
        }
    };

    return (
        <div className="h-96 w-full" role="img" aria- label="Cash flow chart" >
            <Chart type='bar' ref={chartRef} data={chartData} options={options} />
        </div >
    );
}
