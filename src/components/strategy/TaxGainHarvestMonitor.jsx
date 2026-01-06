/**
 * Tax-Gain Harvesting Monitor
 *
 * Tracks unrealized gains and suggests optimal tax-gain harvesting opportunities
 * to reset cost basis at 0% LTCG rate
 */

import { usePlan } from '../../contexts/PlanContext';
import { calculate0PercentThresholds } from '../../lib/taxFreeEngine';

export default function TaxGainHarvestMonitor() {
    const { planData, ledger } = usePlan();

    // Get current year data
    const currentYear = ledger?.[0] || {};
    const currentAge = planData.people?.[0]?.age || 0;
    const isRetired = currentAge >= (planData.people?.[0]?.retirementAge || 67);

    // Brokerage account details
    const brokerageBalance = planData.assets?.brokerage?.joint || 0;
    const brokerageBasis = planData.assets?.brokerageBasis?.joint || 0;
    const unrealizedGains = brokerageBalance - brokerageBasis;
    const gainPercentage = brokerageBalance > 0 ? (unrealizedGains / brokerageBalance) * 100 : 0;

    // Calculate 0% LTCG room
    const thresholds = calculate0PercentThresholds(planData.profile?.filingStatus || 'married');
    const currentIncome = currentYear.income?.total || 0;
    const bucket2Room = Math.max(0, thresholds.bucket2Max - currentIncome);

    // Calculate optimal harvest amount
    const optimalHarvest = Math.min(unrealizedGains, bucket2Room);
    const futureTaxSavings = optimalHarvest * 0.15; // 15% LTCG rate avoided

    // Generate replacement fund suggestions (avoid wash sale)
    const suggestions = [
        { from: 'VTI (Vanguard Total Stock)', to: 'VTSAX (Vanguard Total Stock Admiral)' },
        { from: 'SPY (S&P 500 ETF)', to: 'VOO (Vanguard S&P 500)' },
        { from: 'QQQ (Nasdaq 100)', to: 'QQQM (Nasdaq 100 Mini)' },
        { from: 'Individual Stock', to: 'Similar Sector ETF' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    📈 Tax-Gain Harvesting Monitor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reset your cost basis at 0% tax to eliminate future capital gains liability
                </p>
            </div>

            {!isRetired ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                    <div className="text-4xl mb-3">⏳</div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Available After Retirement</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Tax-gain harvesting is most effective in retirement when your income is low enough to qualify for the 0% LTCG rate.
                    </p>
                </div>
            ) : (
                <>
                    {/* Current Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Brokerage Balance</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${brokerageBalance.toLocaleString()}
                            </div>
                            <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                Basis: ${brokerageBasis.toLocaleString()}
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Unrealized Gains</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                ${unrealizedGains.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {gainPercentage.toFixed(1)}% of portfolio
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">0% LTCG Room Available</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${bucket2Room.toLocaleString()}
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Tax-free harvest capacity
                            </div>
                        </div>
                    </div>

                    {/* Harvest Recommendation */}
                    {optimalHarvest > 0 ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border-2 border-green-300 dark:border-green-700">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">💡</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-green-900 dark:text-green-300 mb-2 text-lg">
                                        Harvest Opportunity Detected!
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Recommended Harvest</div>
                                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                ${optimalHarvest.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Future Tax Savings (15% LTCG avoided)</div>
                                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                                ${futureTaxSavings.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-200 dark:border-green-800">
                                        <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">📋 Action Plan:</div>
                                        <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
                                            <li>Sell ${optimalHarvest.toLocaleString()} of appreciated assets before Dec 31</li>
                                            <li>Realize ${optimalHarvest.toLocaleString()} in gains at 0% LTCG rate</li>
                                            <li>Immediately reinvest in similar (but not identical) fund to avoid wash sale</li>
                                            <li>New cost basis = today&apos;s high price, eliminating future tax liability!</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-4xl mb-2">✅</div>
                            <div className="font-semibold text-gray-900 dark:text-white mb-1">No Harvest Needed</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {unrealizedGains <= 0
                                    ? 'No unrealized gains to harvest'
                                    : 'Income too high for 0% LTCG rate this year'}
                            </div>
                        </div>
                    )}

                    {/* Wash Sale Prevention Guide */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Wash Sale Prevention</span>
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            To avoid triggering the wash sale rule, replace sold securities with similar (but not identical) investments:
                        </p>
                        <div className="space-y-2">
                            {suggestions.map((suggestion, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center gap-3">
                                        <div className="text-red-600 dark:text-red-400 font-mono text-sm">❌ {suggestion.from}</div>
                                        <div className="text-gray-400">→</div>
                                        <div className="text-green-600 dark:text-green-400 font-mono text-sm">✅ {suggestion.to}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 italic">
                            * Wait 31 days before repurchasing the original security to avoid wash sale disallowance
                        </div>
                    </div>

                    {/* December Reminder */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 p-4 rounded-lg text-white text-center">
                        <div className="font-bold mb-1">🗓️ Annual Reminder</div>
                        <div className="text-sm text-purple-100">
                            Review tax-gain harvesting opportunities by November 15th each year to maximize 0% LTCG benefit
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
