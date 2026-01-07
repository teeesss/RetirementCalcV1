/**
 * Tax-Free Dashboard - Three Bucket Inventory
 *
 * Displays current allocation across Pre-Tax, After-Tax, and Tax-Free buckets
 * with recommendations for optimal tax-free retirement strategy
 */

import { usePlan } from '../../contexts/PlanContext';
import { calculateBucketInventory, calculate0PercentThresholds } from '../../lib/taxFreeEngine';
import RothConversionOptimizer from './RothConversionOptimizer';
import WithdrawalSequenceUI from './WithdrawalSequenceUI';
import TaxGainHarvestMonitor from './TaxGainHarvestMonitor';
import MAGIMonitor from './MAGIMonitor';
import TaxFreeKPIDashboard from './TaxFreeKPIDashboard';
import WithdrawalSimulator from './WithdrawalSimulator';
import WithdrawalPlannerView from './WithdrawalPlannerView';

export default function TaxFreeDashboard() {
    const { planData } = usePlan();

    const buckets = calculateBucketInventory(planData.assets);
    const thresholds = calculate0PercentThresholds(planData.profile?.filingStatus || 'married');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 p-6 rounded-lg text-white">
                <h2 className="text-2xl font-bold mb-2">🏆 Tax-Free Retirement Engine</h2>
                <p className="text-green-100">Target: 0-5% Effective Tax Rate</p>
            </div>

            {/* KPI Dashboard - Show results first! */}
            <TaxFreeKPIDashboard />

            {/* Three Bucket Inventory */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    📊 Three Bucket Inventory
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Bucket #1: Pre-Tax */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-blue-900 dark:text-blue-300">Bucket #1: Pre-Tax</h4>
                            <span className="text-2xl">🏦</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            ${buckets.preTax.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {buckets.preTax.percentage.toFixed(1)}% of total
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                            {buckets.preTax.accounts.join(', ')}
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">Strategy:</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Withdraw up to ${thresholds.bucket1Max.toLocaleString()} annually (Standard Deduction) = $0 tax
                            </div>
                        </div>
                    </div>

                    {/* Bucket #2: After-Tax */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-amber-900 dark:text-amber-300">Bucket #2: After-Tax</h4>
                            <span className="text-2xl">📈</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                            ${buckets.afterTax.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {buckets.afterTax.percentage.toFixed(1)}% of total
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 mb-2 truncate">
                            Basis: ${buckets.afterTax.basis.toLocaleString()} • Gain: ${buckets.afterTax.unrealizedGains.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                            {buckets.afterTax.accounts.join(', ')}
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                            <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">Strategy:</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Realize up to ${thresholds.bucket2Max.toLocaleString()} in gains annually at 0% LTCG rate
                            </div>
                        </div>
                    </div>

                    {/* Bucket #3: Tax-Free */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-green-900 dark:text-green-300">Bucket #3: Tax-Free</h4>
                            <span className="text-2xl">💎</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            ${buckets.taxFree.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {buckets.taxFree.percentage.toFixed(1)}% of total
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                            {buckets.taxFree.accounts.join(', ')}
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                            <div className="text-xs font-semibold text-green-700 dark:text-green-300">Strategy:</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Maintain maximum growth. Tap Roth Contributions first for early retirements.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total and Balance Status */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Portfolio Value</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${buckets.total.toLocaleString()}
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${buckets.balance.isBalanced
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            }`}>
                            {buckets.balance.isBalanced ? '✅ Well Balanced' : '⚠️ Needs Rebalancing'}
                        </div>
                    </div>

                    {!buckets.balance.isBalanced && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                                💡 Recommendation:
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                {buckets.balance.recommendation}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Roth Conversion Optimizer */}
            <RothConversionOptimizer />

            {/* Withdrawal Planner View (Multi-Year) */}
            <WithdrawalPlannerView />

            {/* Withdrawal Sequence UI (Single Year Focus) */}
            <WithdrawalSequenceUI />

            {/* Withdrawal Logic Simulator */}
            <WithdrawalSimulator />

            {/* Tax-Gain Harvesting Monitor */}
            <TaxGainHarvestMonitor />

            {/* MAGI Monitor & Optimizer */}
            <MAGIMonitor />

            {/* Annual Tax-Free Capacity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    🎯 Annual Tax-Free Withdrawal Capacity
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div>
                            <div className="font-semibold text-blue-900 dark:text-blue-300">Bucket #1 (Standard Deduction)</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Traditional IRA withdrawal</div>
                        </div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            ${thresholds.bucket1Max.toLocaleString()}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
                        <div>
                            <div className="font-semibold text-amber-900 dark:text-amber-300">Bucket #2 (0% LTCG)</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Brokerage capital gains</div>
                        </div>
                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            ${thresholds.bucket2Max.toLocaleString()}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <div>
                            <div className="font-semibold text-green-900 dark:text-green-300">Bucket #3 (Roth)</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Tax-free, invisible to IRS</div>
                        </div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            Unlimited
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 rounded text-white">
                        <div>
                            <div className="font-bold text-lg">Total Annual Tax-Free Capacity</div>
                            <div className="text-sm text-green-100">Before touching Roth bucket</div>
                        </div>
                        <div className="text-2xl font-bold">
                            ${thresholds.totalTaxFree.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    📚 How the Tax-Free Engine Works
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="text-2xl">1️⃣</div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Fill the Standard Deduction</div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Withdraw ${thresholds.bucket1Max.toLocaleString()} from Traditional IRA. This income is completely offset by your standard deduction = <span className="font-semibold text-green-600">$0 federal tax</span>.
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-2xl">2️⃣</div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Harvest 0% Capital Gains</div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Sell brokerage assets to realize up to ${thresholds.bucket2Max.toLocaleString()} in gains. These gains are taxed at <span className="font-semibold text-green-600">0% LTCG rate</span>. Immediately reinvest to reset cost basis.
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-2xl">3️⃣</div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Use &quot;Invisible Money&quot;</div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Take all remaining needs from Roth IRA. This money is <span className="font-semibold text-green-600">completely invisible to the IRS</span> - doesn&apos;t count as income, doesn&apos;t affect ACA subsidies, doesn&apos;t trigger IRMAA surcharges.
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-2xl">🎯</div>
                        <div>
                            <div className="font-semibold text-green-600 dark:text-green-400">Result</div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Live on ${(thresholds.totalTaxFree + 50000).toLocaleString()}+ per year with an effective tax rate under 5%.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
