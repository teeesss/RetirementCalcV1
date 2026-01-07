
import { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTaxStrategy } from '../contexts/TaxStrategyContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function TaxBracketChart({ darkMode = false }) {
    const { comparisonData } = useTaxStrategy();
    const chartRef = useRef(null);

    if (!comparisonData || comparisonData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                Run strategy to see tax comparison
            </div>
        );
    }

    const labels = comparisonData.map(y => y.age);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Status Quo (Taxable Income)',
                data: comparisonData.map(y => y.baseline.taxableIncome),
                backgroundColor: 'rgba(107, 114, 128, 0.5)', // Gray
                borderColor: 'rgba(107, 114, 128, 1)',
                borderWidth: 1,
            },
            {
                label: 'Strategic Plan (Taxable Income)',
                data: comparisonData.map(y => y.strategic.taxableIncome),
                backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
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
                position: 'top',
                labels: { color: darkMode ? '#e5e7eb' : '#374151' }
            },
            tooltip: {
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: darkMode ? '#f3f4f6' : '#111827',
                bodyColor: darkMode ? '#e5e7eb' : '#374151',
                padding: 10,
                callbacks: {
                    afterBody: (items) => {
                        const idx = items[0].dataIndex;
                        const savings = comparisonData[idx].delta.taxSavings;
                        return `Annual Tax Savings: $${savings.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Age', color: darkMode ? '#9ca3af' : '#6b7280' },
                ticks: { color: darkMode ? '#9ca3af' : '#6b7280' },
                grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            },
            y: {
                title: { display: true, text: 'Taxable Income ($)', color: darkMode ? '#9ca3af' : '#6b7280' },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    callback: val => '$' + (val / 1000).toFixed(0) + 'k'
                },
                grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            }
        }
    };

    return (
        <div className="h-64 w-full">
            <Bar ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
