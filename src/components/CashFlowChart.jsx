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

export default function CashFlowChart({ ledger, darkMode = false }) {
    const chartRef = useRef(null);

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
                label: 'Total Expenses + Tax',
                data: ledger.map(y => (y.expenses?.total || 0) + (y.taxes?.totalTax || 0)),
                borderColor: 'rgba(239, 68, 68, 1)', // Red 500
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            },
            {
                type: 'bar',
                label: 'Ordinary Income (Salary+SS)',
                data: ledger.map(y => (y.income?.total || 0)),
                backgroundColor: 'rgba(75, 85, 99, 0.8)', // Gray 600
                borderColor: 'rgba(75, 85, 99, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
            },
            {
                type: 'bar',
                label: 'RMD / Trad W/D',
                data: ledger.map(y => y.withdrawals?.traditional || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue 500
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
            },
            {
                type: 'bar',
                label: 'Roth W/D',
                data: ledger.map(y => y.withdrawals?.roth || 0),
                backgroundColor: 'rgba(168, 85, 247, 0.8)', // Purple 500
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
            },
            {
                type: 'bar',
                label: 'Brokerage W/D',
                data: ledger.map(y => y.withdrawals?.brokerage || 0),
                backgroundColor: 'rgba(236, 72, 153, 0.8)', // Pink 500
                borderColor: 'rgba(236, 72, 153, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
            },
            {
                type: 'bar',
                label: 'Cash W/D',
                data: ledger.map(y => y.withdrawals?.cash || 0),
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald 500
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
            },
            {
                type: 'bar',
                label: 'Crypto W/D',
                data: ledger.map(y => y.withdrawals?.crypto || 0),
                backgroundColor: 'rgba(249, 115, 22, 0.8)', // Orange 500
                borderColor: 'rgba(249, 115, 22, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
            },
            {
                type: 'bar',
                label: 'HSA W/D',
                data: ledger.map(y => y.withdrawals?.hsa || 0),
                backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo 500
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                stack: 'Stack 0',
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
                    font: { size: 11 }
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
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${formatCurrency(value)}`;
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
                            '',
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
                    callback: (value) => '$' + (value / 1000).toFixed(0) + 'k'
                }
            }
        }
    };

    return (
        <div className="h-96 w-full" role="img" aria-label="Cash flow chart">
            <Chart type='bar' ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
