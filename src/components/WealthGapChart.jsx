
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
import { useTaxStrategy } from '../contexts/TaxStrategyContext';

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

export default function WealthGapChart({ darkMode = false }) {
    const { comparisonData } = useTaxStrategy();
    const chartRef = useRef(null);

    if (!comparisonData || comparisonData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                Run strategy to see wealth projection
            </div>
        );
    }

    const labels = comparisonData.map(y => y.age);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Status Quo Net Worth',
                data: comparisonData.map(y => y.baseline.netWorth),
                borderColor: 'rgba(107, 114, 128, 0.8)', // Gray
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Strategic Plan Net Worth',
                data: comparisonData.map(y => y.strategic.netWorth),
                borderColor: 'rgba(34, 197, 94, 1)', // Green
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
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
                    footer: (items) => {
                        const idx = items[0].dataIndex;
                        const diff = comparisonData[idx].delta.netWorth;
                        return `Difference: ${diff >= 0 ? '+' : ''}$${Math.round(diff).toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Age', color: darkMode ? '#9ca3af' : '#6b7280' },
                ticks: { color: darkMode ? '#9ca3af' : '#6b7280' },
                grid: { display: false }
            },
            y: {
                title: { display: true, text: 'Net Worth ($)', color: darkMode ? '#9ca3af' : '#6b7280' },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    callback: val => '$' + (val / 1000000).toFixed(1) + 'M'
                },
                grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            }
        }
    };

    return (
        <div className="h-64 w-full">
            <Line ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
