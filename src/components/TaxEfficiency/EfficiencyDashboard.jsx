
import { useMemo, useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

import WithdrawalSourceTable from './WithdrawalSourceTable';

export default function EfficiencyDashboard() {
    const { ledger, planData } = usePlan();
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

    // --- Metrics Calculation ---
    const metrics = useMemo(() => {
        if (!ledger || ledger.length === 0) return null;

        let totalWithdrawals = 0;
        let totalTax = 0;
        let totalTaxableIncome = 0; // AGI
        let totalRoth = 0;
        let totalTrad = 0;
        let totalBrokerage = 0;
        let totalFica = 0;

        // Calculate Lifetime Totals
        ledger.forEach(year => {
            const w = year.metrics?.detailedCashFlow?.drawdowns || year.withdrawals || {};
            totalWithdrawals += (year.metrics?.totalWithdrawals || 0);
            totalTax += (year.taxes?.totalTax || 0);
            totalTaxableIncome += (year.taxes?.agi || 0);

            totalRoth += (w.roth || 0);
            totalTrad += (w.traditional || 0);
            totalBrokerage += (w.brokerage || 0) + (w.crypto || 0);
            totalFica += (year.taxes?.fica?.total || 0);
        });

        const effectiveRate = totalTaxableIncome > 0 ? (totalTax / totalTaxableIncome) : 0;
        const withdrawalRate = totalWithdrawals > 0 ? (totalTax / totalWithdrawals) : 0; // Tax Drag

        return {
            totalWithdrawals,
            totalTax,
            effectiveRate,
            withdrawalRate,
            sources: {
                roth: totalRoth,
                traditional: totalTrad,
                brokerage: totalBrokerage
            }
        };
    }, [ledger]);

    if (!ledger || !metrics) return <div className="p-8 text-center text-gray-500">No plan data available.</div>;

    // --- Chart Data ---
    const sourceData = {
        labels: ['Tax-Free (Roth/HSA)', 'Tax-Deferred (Trad)', 'Taxable (Brokerage/Crypto)'],
        datasets: [
            {
                data: [metrics.sources.roth, metrics.sources.traditional, metrics.sources.brokerage],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)', // Green
                    'rgba(59, 130, 246, 0.8)', // Blue
                    'rgba(249, 115, 22, 0.8)', // Orange
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(249, 115, 22, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right' },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#374151',
                bodyColor: '#6b7280',
                borderColor: '#d1d5db',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${label}: $${Math.round(value).toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '70%'
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Tax Efficiency & Withdrawal Strategy</h2>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'chart' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Detailed Table
                    </button>
                </div>
            </div>

            {viewMode === 'chart' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Metric Cards */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <MetricCard
                            label="Lifetime Tax Paid"
                            value={`$${Math.round(metrics.totalTax).toLocaleString()}`}
                            subvalue={`${(metrics.withdrawalRate * 100).toFixed(1)}% of Withdrawals`}
                            color="text-red-600"
                        />
                        <MetricCard
                            label="Effective Tax Rate"
                            value={`${(metrics.effectiveRate * 100).toFixed(1)}%`}
                            subvalue="on AGI"
                            color="text-blue-600"
                        />
                        <MetricCard
                            label="Roth/Tax-Free Usage"
                            value={`$${Math.round(metrics.sources.roth).toLocaleString()}`}
                            subvalue={`${(metrics.sources.roth / metrics.totalWithdrawals * 100).toFixed(1)}% of Total`}
                            color="text-green-600"
                        />
                        <MetricCard
                            label="Total Withdrawals"
                            value={`$${Math.round(metrics.totalWithdrawals).toLocaleString()}`}
                            subvalue="Lifetime"
                            color="text-gray-900"
                        />
                    </div>

                    {/* Source Breakdown */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lifetime Withdrawal Mix</h3>
                        <div className="h-64 flex justify-center">
                            <Doughnut data={sourceData} options={donutOptions} />
                        </div>
                    </div>

                    {/* Tax Bracket Fill (Placeholder for now, complex to visualize aggregate) */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tax Efficiency Notes</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                                <span className="mr-2 mt-1 text-green-500">✔</span>
                                <span>Your strategy prioritizes <strong>Standard Deduction</strong> filling first (0% tax).</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 mt-1 text-green-500">✔</span>
                                <span>Capital Gains are harvested up to the 0% bracket limit where possible.</span>
                            </li>
                            {planData.taxOptimization?.enableRothConversion && (
                                <li className="flex items-start">
                                    <span className="mr-2 mt-1 text-blue-500">ℹ</span>
                                    <span><strong>Roth Conversions</strong> are active, filling up to the {((planData.taxOptimization.rothConversionTargetBracket || 0.12) * 100).toFixed(0)}% bracket.</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {viewMode === 'table' && (
                <WithdrawalSourceTable ledger={ledger} />
            )}
        </div>
    );
}

function MetricCard({ label, value, subvalue, color }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {subvalue && <p className="text-xs text-gray-400 mt-1">{subvalue}</p>}
        </div>
    );
}
