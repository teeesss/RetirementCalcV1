
import React from 'react';
import { useTaxStrategy } from '../contexts/TaxStrategyContext';
import { usePlan } from '../contexts/PlanContext';
import TaxBracketChart from './TaxBracketChart';
import WealthGapChart from './WealthGapChart';
import TaxBracketHeatmap from './strategy/TaxBracketHeatmap';
import MarginalTaxChart from './strategy/MarginalTaxChart';
import RothBreakEvenCalculator from './strategy/RothBreakEvenCalculator';

export default function TaxStrategyPanel({ darkMode = false }) {
    const {
        rothStrategy, setRothStrategy,
        ssDeferral, setSsDeferral,
        isCalculatingStrategy,
        comparisonData
    } = useTaxStrategy();
    const { planData, updatePlan } = usePlan();

    const isHarvestingEnabled = planData?.taxOptimization?.enableGainHarvesting || false;

    // Calculate Summary Metrics
    const metrics = comparisonData && comparisonData.length > 0 ? {
        finalDiff: comparisonData[comparisonData.length - 1].delta.netWorth,
        totalTaxSavings: comparisonData.reduce((sum, yr) => sum + yr.delta.taxSavings, 0),
        hasConvergenceIssue: comparisonData.some(yr => yr.strategic.hasConverged === false)
    } : null;

    return (
        <div className={`p-4 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🏛️ Strategic Tax Optimization
                        {metrics?.hasConvergenceIssue && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200" title="Some years did not fully converge on exact tax calc. Estimate may be off by >$1.">
                                ⚠️ Convergence Warning
                            </span>
                        )}
                    </h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Compare &quot;Status Quo&quot; vs &quot;Strategic Plan&quot;
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Roth Conversions (Fill Bracket)
                        </label>
                        <select
                            value={rothStrategy}
                            onChange={(e) => setRothStrategy(e.target.value)}
                            className={`p-2 rounded border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                        >
                            <option value="manual">No Strategy (Status Quo)</option>
                            <option value="12">Fill 12% Bracket</option>
                            <option value="22">Fill 22% Bracket</option>
                            <option value="24">Fill 24% Bracket</option>
                            <option value="32">Fill 32% Bracket</option>
                            <option value="irmaa1">Fill to IRMAA Tier 1 Limit</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Social Security Bridge
                        </label>
                        <button
                            onClick={() => setSsDeferral(!ssDeferral)}
                            className={`p-2 rounded border text-sm font-medium transition-colors ${ssDeferral
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                : (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100')
                                }`}
                        >
                            {ssDeferral ? '✅ Delay Primary to 70' : '❌ Use Default Age'}
                        </button>
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Legislative Risk (2026 TCJA Sunset)
                        </label>
                        <button
                            onClick={() => updatePlan('assumptions', { ...planData.assumptions, enableTCJASunset: !planData.assumptions?.enableTCJASunset })}
                            title="Reverts to pre-2018 brackets (15%/25%/28%...) and halves standard deduction starting in 2026."
                            className={`p-2 rounded border text-sm font-medium transition-colors ${planData.assumptions?.enableTCJASunset
                                ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'
                                : (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100')
                                }`}
                        >
                            {planData.assumptions?.enableTCJASunset ? '⚠️ Sunset Active (High Tax)' : 'Current Law Forever'}
                        </button>
                    </div>


                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            0% Cap Gains Harvesting
                        </label>
                        <button
                            onClick={() => updatePlan('taxOptimization', { ...planData.taxOptimization, enableGainHarvesting: !isHarvestingEnabled })}
                            title="Automatically realizes gains up to the 0% federal bracket limit (~$94k MFJ) to step-up basis tax-free."
                            className={`p-2 rounded border text-sm font-medium transition-colors ${isHarvestingEnabled
                                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                                : (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100')
                                }`}
                        >
                            {isHarvestingEnabled ? '🌾 Harvesting Active' : '😴 Harvesting Off'}
                        </button>
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Dynamic MAGI (Cliff Guard)
                        </label>
                        <button
                            onClick={() => updatePlan('taxOptimization', { ...planData.taxOptimization, enableDynamicMAGI: !planData.taxOptimization?.enableDynamicMAGI })}
                            title="Prevents withdrawals from spiking income over IRMAA/SS cliffs. Excess need spills over to Roth/Cash."
                            className={`p-2 rounded border text-sm font-medium transition-colors ${planData.taxOptimization?.enableDynamicMAGI
                                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                                : (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100')
                                }`}
                        >
                            {planData.taxOptimization?.enableDynamicMAGI ? '🛡️ Guard Active' : '🛡️ Guard Off'}
                        </button>
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Asset Location (Tax Alpha)
                        </label>
                        <button
                            onClick={() => updatePlan('taxOptimization', { ...planData.taxOptimization, enableAssetLocation: !planData.taxOptimization?.enableAssetLocation })}
                            title="Simulates placing high-growth assets in Roth (Target +0.5%) and Bonds in Traditional (Target -0.2%) for tax efficiency."
                            className={`p-2 rounded border text-sm font-medium transition-colors ${planData.taxOptimization?.enableAssetLocation
                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                : (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100')
                                }`}
                        >
                            {planData.taxOptimization?.enableAssetLocation ? '🚀 Optimal Location' : '😐 Standard Alloc'}
                        </button>
                    </div>
                    <div className="flex flex-col">
                        <label className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Charitable Bunching (DAF)
                        </label>
                        <button
                            onClick={() => {
                                const newDafState = !planData.strategy?.daf?.enabled;
                                updatePlan('strategy', {
                                    ...planData.strategy,
                                    daf: {
                                        ...(planData.strategy?.daf || { yearsToBunch: 5, startYear: new Date().getFullYear() }),
                                        enabled: newDafState
                                    }
                                });
                            }}
                            title="Bundles 5 years of charitable giving into the current year to max out itemized deductions."
                            className={`p-2 rounded border text-sm font-medium transition-colors ${planData.strategy?.daf?.enabled
                                ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                                : (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100')
                                }`}
                        >
                            {planData.strategy?.daf?.enabled ? '🎁 Bunching Active' : 'Standard Giving'}
                        </button>
                    </div>
                </div >
            </div >

            {/* Metrics Cards */}
            {
                metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-green-50 border-green-100'}`}>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Lifetime Tax Savings</div>
                            <div className={`text-2xl font-bold ${metrics.totalTaxSavings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {metrics.totalTaxSavings >= 0 ? '+' : ''}${Math.round(metrics.totalTaxSavings).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">Cumulative difference in taxes paid</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Projected Ending Net Worth Gap</div>
                            <div className={`text-2xl font-bold ${metrics.finalDiff >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {metrics.finalDiff >= 0 ? '+' : ''}${Math.round(metrics.finalDiff).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">Extra wealth generated by strategy</div>
                        </div>
                    </div>
                )
            }

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Taxable Income Trajectory
                    </h3>
                    <TaxBracketChart darkMode={darkMode} />
                </div>
                <div>
                    <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Wealth Gap Analysis
                    </h3>
                    <WealthGapChart darkMode={darkMode} />
                </div>
            </div>

            <div className="mt-6">
                <MarginalTaxChart darkMode={darkMode} />
            </div>

            <div className="mt-6">
                <TaxBracketHeatmap darkMode={darkMode} />
            </div>

            <div className="mt-6">
                <RothBreakEvenCalculator darkMode={darkMode} />
            </div>

            {
                isCalculatingStrategy && (
                    <div className="mt-4 text-center text-xs text-blue-500 animate-pulse">
                        Running simulation...
                    </div>
                )
            }
        </div >
    );
}
