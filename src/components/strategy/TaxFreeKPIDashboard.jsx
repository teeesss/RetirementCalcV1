/**
 * Tax-Free KPI Dashboard
 *
 * Tracks key performance indicators for tax-free retirement strategy
 * - Effective Tax Rate (target < 5%)
 * - Principal vs Gain Ratio
 * - Portfolio Longevity
 * - Year-End Alerts
 */

import { useMemo } from 'react';
import { usePlan } from '../../contexts/PlanContext';

export default function TaxFreeKPIDashboard() {
    const { ledger, planData } = usePlan();

    // 1. Lifetime metrics (Memoized)
    const metrics = useMemo(() => {
        if (!ledger || ledger.length === 0) return null;
        const retirementAge = planData.people?.[0]?.retirementAge || 67;
        const retirementYears = ledger.filter(year => year.age >= retirementAge);

        // ... existing metrics logic ...
        const totalWithdrawals = retirementYears.reduce((sum, year) => sum + (year.withdrawals?.total || 0), 0);

        const totalTaxesPaid = retirementYears.reduce((sum, year) =>
            sum + (year.taxes?.totalTax || 0), 0
        );

        const lifetimeETR = totalWithdrawals > 0 ? (totalTaxesPaid / totalWithdrawals) * 100 : 0;

        // 2. Principal vs Gain Ratio
        const initialBrokerage = planData.assets?.brokerage?.joint || 0;
        const initialBasis = planData.assets?.brokerageBasis?.joint || 0;
        const currentYear = ledger[0] || {};
        const currentBrokerage = currentYear.balances?.brokerage || initialBrokerage;
        const currentBasis = currentYear.balances?.brokerageBasis || initialBasis;

        const initialGainRatio = initialBrokerage > 0 ? ((initialBrokerage - initialBasis) / initialBrokerage) * 100 : 0;
        const currentGainRatio = currentBrokerage > 0 ? ((currentBrokerage - currentBasis) / currentBrokerage) * 100 : 0;
        const gainReduction = initialGainRatio - currentGainRatio;

        // 3. Portfolio Longevity
        const finalBalance = ledger[ledger.length - 1]?.totalBalance || 0;
        const portfolioSuccess = finalBalance > 0;
        const yearsOfFunding = ledger.length;

        // 4. Tax Savings vs Traditional Strategy
        const estimatedTraditionalTax = totalWithdrawals * 0.15;
        const taxSavings = estimatedTraditionalTax - totalTaxesPaid;

        return {
            lifetimeETR,
            totalWithdrawals,
            totalTaxesPaid,
            taxSavings,
            initialGainRatio,
            currentGainRatio,
            gainReduction,
            portfolioSuccess,
            yearsOfFunding,
            finalBalance,
            retirementYears: retirementYears.length
        };
    }, [ledger, planData]);

    // 2. Planning Dates (Memoized)
    const dateMetrics = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const isNovember = month === 10;

        const nov15 = new Date(year, 10, 15);
        if (now > nov15) {
            nov15.setFullYear(year + 1);
        }
        const diffTime = nov15.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { isNovember, daysUntilNov15: diffDays };
    }, []); // Run once on mount

    if (!ledger || ledger.length === 0 || !metrics) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Run calculation to see KPI metrics...</p>
            </div>
        );
    }

    const { isNovember, daysUntilNov15 } = dateMetrics;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    📈 Tax-Free Strategy KPIs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track performance of your tax-free retirement strategy vs. traditional approach
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Effective Tax Rate */}
                <div className={`p-4 rounded-lg border-2 ${metrics.lifetimeETR <= 5
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                    : metrics.lifetimeETR <= 10
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
                    }`}>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lifetime Effective Tax Rate</div>
                    <div className={`text-4xl font-bold ${metrics.lifetimeETR <= 5 ? 'text-green-600 dark:text-green-400' :
                        metrics.lifetimeETR <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                        }`}>
                        {metrics.lifetimeETR.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {metrics.lifetimeETR <= 5 ? '🎯 Target Met!' :
                            metrics.lifetimeETR <= 10 ? '⚠️ Close' :
                                '❌ Needs Optimization'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Target: &lt; 5%
                    </div>
                </div>

                {/* Tax Savings */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-lg border-2 border-emerald-400 dark:border-emerald-600">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lifetime Tax Savings</div>
                    <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${(metrics.taxSavings / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        vs. Traditional Strategy (15% ETR)
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                        ${metrics.totalTaxesPaid.toLocaleString()} paid vs ${(metrics.totalWithdrawals * 0.15).toLocaleString()} estimated
                    </div>
                </div>

                {/* Principal vs Gain Ratio */}
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-2 border-amber-400 dark:border-amber-600">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gain Ratio Reduction</div>
                    <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                        {metrics.gainReduction >= 0 ? '-' : '+'}{Math.abs(metrics.gainReduction).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {metrics.initialGainRatio.toFixed(1)}% → {metrics.currentGainRatio.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {metrics.gainReduction > 0 ? '✅ Tax basis improved' : '⚠️ Gains accumulating'}
                    </div>
                </div>

                {/* Portfolio Longevity */}
                <div className={`p-4 rounded-lg border-2 ${metrics.portfolioSuccess
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
                    }`}>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Portfolio Longevity</div>
                    <div className={`text-4xl font-bold ${metrics.portfolioSuccess
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {metrics.yearsOfFunding}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {metrics.portfolioSuccess ? 'Years Funded' : 'Years Until Depletion'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {metrics.portfolioSuccess ? `✅ $${(metrics.finalBalance / 1000).toFixed(0)}k remaining` : '❌ Portfolio depleted'}
                    </div>
                </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tax Strategy Comparison */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                        💰 Tax-Free vs Traditional Strategy
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawals ({metrics.retirementYears} years)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                ${(metrics.totalWithdrawals / 1000).toFixed(0)}k
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Taxes Paid (Tax-Free Strategy)</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                ${(metrics.totalTaxesPaid / 1000).toFixed(0)}k
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Est. Taxes (Traditional 15% ETR)</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                                ${((metrics.totalWithdrawals * 0.15) / 1000).toFixed(0)}k
                            </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Savings</span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    ${(metrics.taxSavings / 1000).toFixed(0)}k
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 text-right">
                                {((metrics.taxSavings / metrics.totalWithdrawals) * 100).toFixed(1)}% of total withdrawals saved
                            </div>
                        </div>
                    </div>
                </div>

                {/* Year-End Planning Alert */}
                <div className={`p-6 rounded-lg border-2 ${isNovember || daysUntilNov15 <= 30
                    ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-400 dark:border-orange-600'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
                    }`}>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        {isNovember || daysUntilNov15 <= 30 ? '🔔' : '📅'}
                        <span>Year-End Planning Alert</span>
                    </h4>

                    {isNovember || daysUntilNov15 <= 30 ? (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                                ⏰ {daysUntilNov15} days until November 15th deadline!
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-orange-200 dark:border-orange-800">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    📋 Year-End Checklist:
                                </div>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
                                    <li>Review unrealized gains in brokerage account</li>
                                    <li>Execute tax-gain harvesting if room in 0% LTCG bracket</li>
                                    <li>Calculate optimal Roth conversion for current year</li>
                                    <li>Verify MAGI stays below ACA/IRMAA thresholds</li>
                                    <li>Complete conversions/harvesting by December 31st</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-3xl mb-2">✅</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Next year-end planning reminder in {daysUntilNov15} days
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Mark your calendar for November 15th
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Summary */}
            {metrics.lifetimeETR <= 5 && metrics.portfolioSuccess && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 p-6 rounded-lg text-white text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="font-bold text-2xl mb-2">Tax-Free Strategy Success!</div>
                    <div className="text-green-100">
                        You&apos;ve achieved a {metrics.lifetimeETR.toFixed(1)}% lifetime effective tax rate,
                        saving ${(metrics.taxSavings / 1000).toFixed(0)}k in taxes over {metrics.retirementYears} years of retirement.
                        Your portfolio is projected to last the full {metrics.yearsOfFunding} years with ${(metrics.finalBalance / 1000).toFixed(0)}k remaining!
                    </div>
                </div>
            )}
        </div>
    );
}
