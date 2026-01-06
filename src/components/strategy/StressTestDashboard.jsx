import { useState } from 'react';
import NetWorthChart from '../NetWorthChart';

/**
 * StressTestDashboard - Interactive stress testing module
 * Allows users to apply shocks (market drop, SS cut, longevity) and see impact
 */
export default function StressTestDashboard({ onRunStressTest, isRunning, results }) {
    const [shocks, setShocks] = useState({
        marketDrop: 0,
        ssCut: 0,
        longevityYears: 0,
        inflationIncrease: 0
    });

    const handleSliderChange = (key, value) => {
        setShocks(prev => ({ ...prev, [key]: Number(value) }));
    };

    const handleRunTest = () => {
        if (onRunStressTest) {
            onRunStressTest(shocks);
        }
    };

    const handleReset = () => {
        setShocks({
            marketDrop: 0,
            ssCut: 0,
            longevityYears: 0,
            inflationIncrease: 0
        });
    };

    return (
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    🧪 Stress Test Your Plan
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Apply hypothetical shocks to see how resilient your retirement plan is
                </p>
            </div>

            {/* Shock Controls */}
            <div className="space-y-4">
                {/* Market Drop */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            📉 Market Drop (Equity %)
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">-</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={shocks.marketDrop}
                                onChange={(e) => handleSliderChange('marketDrop', e.target.value)}
                                className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">%</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={shocks.marketDrop}
                        onChange={(e) => handleSliderChange('marketDrop', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        <span>No Crash</span>
                        <span>-25%</span>
                        <span>-50% (2008 Bear)</span>
                    </div>
                </div>

                {/* Social Security Cut */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            🏛️ Social Security Cut (%)
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">-</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={shocks.ssCut}
                                onChange={(e) => handleSliderChange('ssCut', e.target.value)}
                                className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">%</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="30"
                        step="5"
                        value={shocks.ssCut}
                        onChange={(e) => handleSliderChange('ssCut', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        <span>Full Benefits</span>
                        <span>-15%</span>
                        <span>-30%</span>
                    </div>
                </div>

                {/* Longevity Extension */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            ⏳ Longevity Extension (Years)
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">+</span>
                            <input
                                type="number"
                                min="0"
                                max="30"
                                value={shocks.longevityYears}
                                onChange={(e) => handleSliderChange('longevityYears', e.target.value)}
                                className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">yrs</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="15"
                        step="1"
                        value={shocks.longevityYears}
                        onChange={(e) => handleSliderChange('longevityYears', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        <span>Base Plan</span>
                        <span>+7 years</span>
                        <span>+15 years</span>
                    </div>
                </div>

                {/* Inflation Increase */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            📈 Inflation Increase (%)
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">+</span>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.1"
                                value={shocks.inflationIncrease}
                                onChange={(e) => handleSliderChange('inflationIncrease', e.target.value)}
                                className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">%</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={shocks.inflationIncrease}
                        onChange={(e) => handleSliderChange('inflationIncrease', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        <span>2.5% (Base)</span>
                        <span>5%</span>
                        <span>7.5% (1970s)</span>
                    </div>
                </div>
            </div>

            {/* LTC Health Shock */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        🚑 Health Shock (LTC Event)
                    </label>
                    <div className="flex items-center gap-2">
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={shocks.ltcEvent?.enabled || false}
                                onChange={(e) => setShocks(prev => ({
                                    ...prev,
                                    ltcEvent: {
                                        ...(prev.ltcEvent || { monthlyCost: 8000, years: 3, startAge: 85 }),
                                        enabled: e.target.checked
                                    }
                                }))}
                            />
                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                        </label>
                        {shocks.ltcEvent?.enabled && (
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">Active</span>
                        )}
                    </div>
                </div>

                {shocks.ltcEvent?.enabled ? (
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-800/30 text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-gray-500 mb-1">Monthly Cost</label>
                                <input
                                    type="number"
                                    value={shocks.ltcEvent.monthlyCost}
                                    onChange={(e) => setShocks(prev => ({ ...prev, ltcEvent: { ...prev.ltcEvent, monthlyCost: Number(e.target.value) } }))}
                                    className="w-full px-2 py-1 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-500 mb-1">Duration (Yrs)</label>
                                <input
                                    type="number"
                                    value={shocks.ltcEvent.years}
                                    onChange={(e) => setShocks(prev => ({ ...prev, ltcEvent: { ...prev.ltcEvent, years: Number(e.target.value) } }))}
                                    className="w-full px-2 py-1 border rounded"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Start Age</label>
                            <input
                                type="range"
                                min="70"
                                max="95"
                                value={shocks.ltcEvent.startAge}
                                onChange={(e) => setShocks(prev => ({ ...prev, ltcEvent: { ...prev.ltcEvent, startAge: Number(e.target.value) } }))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right text-gray-600 font-medium">Age {shocks.ltcEvent.startAge}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 pl-1">
                        Simulate a significant Long-Term Care expense event.
                    </div>
                )}
            </div>


            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleRunTest}
                    disabled={isRunning}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                >
                    {isRunning ? (
                        <>
                            <span className="inline-block animate-spin mr-2">⚙️</span>
                            Running Stress Test...
                        </>
                    ) : (
                        '🧪 Run Stress Test'
                    )}
                </button>
                <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-semibold"
                >
                    Reset
                </button>
            </div>

            {/* Results Display */}
            {
                results && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Stress Test Results
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-lg border-2 ${results.successRate >= results.baselineSuccessRate ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Success Rate Impact</div>
                                <div className={`text-xl font-bold ${results.successRate >= results.baselineSuccessRate ? 'text-green-600' : 'text-red-600'}`}>
                                    {((results.successRate - results.baselineSuccessRate) * 100).toFixed(1)}%
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    {results.successRate >= results.baselineSuccessRate ? '✅ Plan holds up' : '⚠️ Plan stressed'}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">New Success Rate</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {(results.successRate * 100).toFixed(1)}%
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    vs {(results.baselineSuccessRate * 100).toFixed(1)}% baseline
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Wealth at Risk</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    ${((results.baselineWealth - results.endingWealth) / 1000000).toFixed(1)}M
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    Potential loss from shocks
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-xs text-blue-800 dark:text-blue-200">
                                <strong>Recommendation:</strong> {results.successRate >= 0.90
                                    ? 'Your plan is resilient to these shocks! ✅'
                                    : 'Consider building more safety margins or reducing expenses. ⚠️'}
                            </div>
                        </div>

                        {results.ledger && (
                            <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Projected Impact (Stressed vs Baseline)</h4>
                                <div className="h-48">
                                    <NetWorthChart ledger={results.ledger} darkMode={false} />
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Info Box */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>💡 Tip:</strong> Stress testing helps you understand your plan&apos;s resilience.
                    A robust plan should maintain &gt;80% success rate even with moderate shocks (market -20%, SS -10%).
                </div>
            </div>
        </div >
    );
}
