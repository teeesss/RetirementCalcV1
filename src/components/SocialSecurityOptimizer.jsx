import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { usePlan } from '../contexts/PlanContext';
import { formatCurrency } from '../utils/formatters';
import { compareClaimingStrategies, simulateJointStrategy } from '../lib/ssOptimizer';
import SmartInput from './SmartInput';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SocialSecurityOptimizer() {
    const { planData, updatePlan } = usePlan();
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [viewMode, setViewMode] = useState('single'); // 'single' | 'joint'

    // Extract necessary data from plan
    const pia = planData.income?.socialSecurity?.pia || 2500;
    const spousePia = planData.income?.socialSecurity?.spousePia || 1500;

    // Ages
    const currentAge = planData.profile?.age || 50;
    const spouseAge = planData.profile?.spouseAge || 48;
    const fra = 67;
    const longevity = 95;

    // 1. Single Analysis (Existing)
    const singleAnalysis = useMemo(() => {
        return compareClaimingStrategies(pia, fra, longevity);
    }, [pia, fra, longevity]);

    // 2. Joint Analysis (New)
    const jointAnalysis = useMemo(() => {
        // Strategy A: Both Early (62/62)
        const bothEarly = simulateJointStrategy({
            primaryPia: pia, spousePia, primaryClaimAge: 62, spouseClaimAge: 62,
            primaryAge: currentAge, spouseAge, fra
        });

        // Strategy B: Both FRA (67/67)
        const bothFra = simulateJointStrategy({
            primaryPia: pia, spousePia, primaryClaimAge: 67, spouseClaimAge: 67,
            primaryAge: currentAge, spouseAge, fra
        });

        // Strategy C: Split (Primary 70, Spouse 62) - Maximize Survivor
        const splitStrat = simulateJointStrategy({
            primaryPia: pia, spousePia, primaryClaimAge: 70, spouseClaimAge: 62,
            primaryAge: currentAge, spouseAge, fra
        });

        return { bothEarly, bothFra, splitStrat };
    }, [pia, spousePia, currentAge, spouseAge, fra]);

    // Toggle Logic
    const isJoint = viewMode === 'joint';
    const activeData = isJoint ? jointAnalysis : singleAnalysis;

    // Chart Data Preparation
    const chartData = useMemo(() => {
        if (!isJoint) {
            return {
                labels: singleAnalysis.curve.map(p => p.age),
                datasets: [
                    {
                        label: 'Claim at 62 (Early)',
                        data: singleAnalysis.curve.map(p => p.strat62),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                        tension: 0.1
                    },
                    {
                        label: `Claim at ${fra} (FRA)`,
                        data: singleAnalysis.curve.map(p => p[`strat${fra}`]),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        tension: 0.1
                    },
                    {
                        label: 'Claim at 70 (Max)',
                        data: singleAnalysis.curve.map(p => p.strat70),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                        tension: 0.1
                    }
                ]
            };
        } else {
            // Joint Chart (Cumulative Household Benefit over Primary's Age)
            // Use 'splitStrat' stream as X-axis reference
            const labels = jointAnalysis.splitStrat.monthlyStream.map(p => p.pAge);

            // Generate cumulative arrays
            const getCumulative = (stream) => {
                let sum = 0;
                return stream.map(p => {
                    sum += p.total * 12;
                    return sum;
                });
            };

            return {
                labels,
                datasets: [
                    {
                        label: 'Both Early (62/62)',
                        data: getCumulative(jointAnalysis.bothEarly.monthlyStream),
                        borderColor: 'rgb(239, 68, 68)',
                        tension: 0.1
                    },
                    {
                        label: 'Both FRA (67/67)',
                        data: getCumulative(jointAnalysis.bothFra.monthlyStream),
                        borderColor: 'rgb(59, 130, 246)',
                        tension: 0.1
                    },
                    {
                        label: 'Survivor Max (Primary 70 / Spouse 62)',
                        data: getCumulative(jointAnalysis.splitStrat.monthlyStream),
                        borderColor: 'rgb(147, 51, 234)', // Purple
                        backgroundColor: 'rgba(147, 51, 234, 0.5)',
                        tension: 0.1
                    }
                ]
            };
        }
    }, [isJoint, singleAnalysis, jointAnalysis, fra]);

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: isJoint ? 'Cumulative Household Benefit (Joint)' : 'Cumulative Lifetime Benefit (Individual)' },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            y: { ticks: { callback: (val) => '$' + val.toLocaleString() } }
        }
    };

    if (!showOptimizer) {
        return (
            <button
                onClick={() => setShowOptimizer(true)}
                className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded border border-indigo-200 transition-colors w-full mt-2"
            >
                ✨ Optimize Strategy
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Social Security Maximizer</h2>
                        <p className="text-sm text-gray-500">Compare claiming strategies to maximize lifetime value and survivor protection.</p>
                    </div>
                    <button onClick={() => setShowOptimizer(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl">
                        &times;
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
                    <button
                        onClick={() => setViewMode('single')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'single' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                        👤 Individual Analysis
                    </button>
                    <button
                        onClick={() => setViewMode('joint')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'joint' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                        👥 Joint / Survivor Analysis
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Inputs & Stats - Left Column */}
                    <div className="md:col-span-4 space-y-6">

                        {/* Inputs */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 border-b pb-2">Plan Assumptions</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Primary PIA (Age 67)</label>
                                    <SmartInput
                                        value={pia}
                                        onChange={(v) => updatePlan({ income: { ...planData.income, socialSecurity: { ...planData.income?.socialSecurity, pia: v } } })}
                                        className="w-full mt-1 border-gray-300 rounded text-sm"
                                    />
                                </div>
                                {isJoint && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Spouse PIA (Age 67)</label>
                                        <SmartInput
                                            value={spousePia}
                                            onChange={(v) => updatePlan({ income: { ...planData.income, socialSecurity: { ...planData.income?.socialSecurity, spousePia: v } } })}
                                            className="w-full mt-1 border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis Cards */}
                        {isJoint ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-purple-900 dark:text-purple-200">Survivor Protection</h3>
                                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Split Strategy</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                        If Primary delays to 70, the surviving spouse is guaranteed <strong>${(pia * 1.24).toLocaleString()}</strong>/mo (plus COLAs) for life.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white/50 p-2 rounded">
                                            <span className="block text-gray-500">Both Early (62)</span>
                                            <span className="block font-bold mt-1 text-red-600">${(jointAnalysis.bothEarly.totalLifetimeBenefit / 1000).toFixed(0)}k Lifetime</span>
                                        </div>
                                        <div className="bg-white/50 p-2 rounded border border-purple-200">
                                            <span className="block text-gray-500">Survivor Max (70/62)</span>
                                            <span className="block font-bold mt-1 text-purple-600">${(jointAnalysis.splitStrat.totalLifetimeBenefit / 1000).toFixed(0)}k Lifetime</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 italic">
                                    &quot;Split Strategy&quot; (Primary waits to 70, lower earner claims early) often maximizes household longevity insurance.
                                </div>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Break-Even Analysis</h3>
                                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <p>Wait to <strong>FRA ({fra})</strong> vs 62: Break-even age <strong className="text-indigo-600">{singleAnalysis.breakEven.fraBeats62}</strong>.</p>
                                    <p>Wait to <strong>70</strong> vs FRA: Break-even age <strong className="text-indigo-600">{singleAnalysis.breakEven['70BeatsFra']}</strong>.</p>
                                </div>
                            </div>
                        )}

                        {/* Apply Button */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Apply Strategy to Plan</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500">Primary Age</span>
                                    <input
                                        type="number"
                                        value={planData.income?.socialSecurity?.startAge || 67}
                                        onChange={(e) => updatePlan({ income: { ...planData.income, socialSecurity: { ...planData.income?.socialSecurity, startAge: parseInt(e.target.value) } } })}
                                        className="w-full px-2 py-1.5 border rounded text-sm"
                                    />
                                </div>
                                {isJoint && (
                                    <div>
                                        <span className="text-[10px] uppercase text-gray-500">Spouse Age</span>
                                        <input
                                            type="number"
                                            value={planData.income?.socialSecurity?.spouseStartAge || 67}
                                            onChange={(e) => updatePlan({ income: { ...planData.income, socialSecurity: { ...planData.income?.socialSecurity, spouseStartAge: parseInt(e.target.value) } } })}
                                            className="w-full px-2 py-1.5 border rounded text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Chart - Right Column */}
                    <div className="md:col-span-8 h-[500px] bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        <Line options={options} data={chartData} />
                    </div>

                </div>
            </div>
        </div>
    );
}
