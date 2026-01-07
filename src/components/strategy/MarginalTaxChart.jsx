
import React, { useMemo } from 'react';
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
import { usePlan } from '../../contexts/PlanContext';
import { calculateTotalTax, calculateMedicarePremiums } from '../../lib/taxEngine';

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

export default function MarginalTaxChart({ darkMode = false }) {
    const { planData } = usePlan();

    const chartData = useMemo(() => {
        if (!planData) return null;

        const filingStatus = planData.profile?.filingStatus || 'single';
        const ss = (planData.socialSecurity?.primary?.annualAmount || 0) + (planData.socialSecurity?.spouse?.annualAmount || 0);
        // Default to current year logic
        const year = new Date().getFullYear();
        const age = planData.people[0].age;

        // Simulation Range: $0 to $250k Ordinary Income
        // Step size: $1000
        const step = 2000;
        const maxIncome = 300000;
        const points = [];

        for (let income = 0; income <= maxIncome; income += step) {
            // Base Tax
            const taxBase = calculateTotalTax({
                ordinaryIncome: income,
                capitalGains: 0,
                ssBenefits: ss,
                filingStatus,
                age,
                year,
                enableTCJASunset: planData.assumptions?.enableTCJASunset
            });

            // Next Dollar Tax (Delta)
            // Use $100 delta for precision
            const delta = 100;
            const taxNext = calculateTotalTax({
                ordinaryIncome: income + delta,
                capitalGains: 0,
                ssBenefits: ss,
                filingStatus,
                age,
                year,
                enableTCJASunset: planData.assumptions?.enableTCJASunset
            });

            // IRMAA Logic isn't in calculateTotalTax fully?
            // calculateTotalTax returns `totalTax` but IRMAA is usually separate premium?
            // Actually taxEngine.js calculateTotalTax DOES NOT include IRMAA in "federalIncomeTax" usually.
            // Let's check calculateTotalTax source.
            // It calls calculateMedicarePremiums? No.
            // It calls calculateNIIT, FICA.
            // IRMAA is usually a "stealth tax" premium.
            // To visualize true marginal cost, we must add IRMAA spike.

            // Manual IRMAA check
            // IRMAA looks at MAGI from 2 years prior. We simulate "Steady State".
            const magiBase = taxBase.agi; // Approx
            const magiNext = taxNext.agi;

            const premiumsBase = calculateMedicarePremiums(magiBase, filingStatus);
            const premiumsNext = calculateMedicarePremiums(magiNext, filingStatus);

            // If premiums jumped, it's a huge tax spike
            const irmaaCostBase = premiumsBase.totalAnnual;
            const irmaaCostNext = premiumsNext.totalAnnual;

            const totalCostBase = taxBase.totalTax + irmaaCostBase;
            const totalCostNext = taxNext.totalTax + irmaaCostNext;

            const marginalRate = ((totalCostNext - totalCostBase) / delta) * 100;

            points.push({
                income,
                rate: marginalRate
            });
        }

        return {
            labels: points.map(p => `$${(p.income / 1000).toFixed(0)}k`),
            datasets: [
                {
                    label: 'Marginal Tax Rate (Fed + State + IRMAA)',
                    data: points.map(p => p.rate),
                    borderColor: 'rgb(239, 68, 68)', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.1, // Sharp lines for cliffs
                    pointRadius: 0
                }
            ]
        };
    }, [planData]);

    if (!chartData) return null;

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
            title: {
                display: true,
                text: 'The "Tax Torpedo": Marginal Rate Analysis',
                color: darkMode ? '#e5e7eb' : '#374151'
            },
            tooltip: {
                callbacks: {
                    label: (context) => `Marginal Rate: ${context.parsed.y.toFixed(1)}%`
                }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 100, // Cap at 100% (IRMAA cliffs can be infinite theoretically on $1, but smoothed over $100 is ~high)
                title: { display: true, text: 'Marginal Rate (%)', color: darkMode ? '#9ca3af' : '#6b7280' },
                ticks: { color: darkMode ? '#9ca3af' : '#6b7280' },
                grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            },
            x: {
                title: { display: true, text: 'Ordinary Income (Withdrawals + Wages)', color: darkMode ? '#9ca3af' : '#6b7280' },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    maxTicksLimit: 10
                },
                grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            }
        }
    };

    return (
        <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <Line options={options} data={chartData} />
            <p className="mt-2 text-xs text-center text-gray-500">
                Shows the effective tax rate on the <b>next $100 withdrawn</b>. Note the "Tax Torpedo" effect where Social Security becomes taxable, followed by IRMAA cliffs.
            </p>
        </div>
    );
}
