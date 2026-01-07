/**
 * Roth Conversion Optimizer Component
 *
 * Helps users optimize annual Roth conversions to build the "invisible money" bucket
 * while staying within preferred tax brackets
 */

import { useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import { calculateOptimalRothConversion } from '../../lib/taxFreeEngine';

export default function RothConversionOptimizer() {
    const { planData, updatePlan } = usePlan();
    const [targetBracket, setTargetBracket] = useState('12');
    const [showFeedback, setShowFeedback] = useState(false);
    const isEnabled = planData.taxOptimization?.enableRothConversion || false;

    // Calculate current income (salary + SS if applicable)
    const currentAge = planData.people?.[0]?.age || 50;
    const salary = planData.salary || 0;
    const ssIncome = currentAge >= (planData.socialSecurity?.primary?.startAge || 67)
        ? (planData.socialSecurity?.primary?.annualAmount || 0)
        : 0;
    const currentIncome = salary + ssIncome;

    // Get traditional IRA balance
    const traditionalBalance = (planData.assets?.traditional?.client || 0) +
        (planData.assets?.traditional?.spouse || 0);

    // Calculate optimal conversion (Grossed up with Standard Deduction)
    const filingStatus = planData.profile?.filingStatus || 'married';
    const standardDeduction = filingStatus === 'married' ? 30000 : (filingStatus === 'head' ? 22500 : 15000);

    const conversion = calculateOptimalRothConversion(
        traditionalBalance,
        Math.max(0, currentIncome - standardDeduction), // Taxable income approx
        targetBracket,
        filingStatus
    );

    const handleApplyConversion = () => {
        updatePlan({
            taxOptimization: {
                ...planData.taxOptimization,
                enableRothConversion: true,
                rothConversionTargetBracket: parseFloat(targetBracket) / 100
            }
        });

        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
    };

    const handleToggleStrategy = () => {
        updatePlan({
            taxOptimization: {
                ...planData.taxOptimization,
                enableRothConversion: !isEnabled
            }
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    💎 Roth Conversion Optimizer
                </h3>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                        onClick={handleToggleStrategy}
                        className={`px-3 py-1 rounded text-xs font-semibold ${isEnabled ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                        {isEnabled ? 'Disable' : 'Enable'}
                    </button>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Build your "invisible money" bucket by converting Traditional IRA funds to Roth annually
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Situation
                        </label>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Traditional IRA Balance:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${traditionalBalance.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Current Annual Income:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${currentIncome.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Target Tax Bracket
                        </label>
                        <select
                            value={targetBracket}
                            onChange={(e) => setTargetBracket(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="12">12% - Conservative (Maximize conversions at low rate)</option>
                            <option value="22">22% - Balanced (Common choice)</option>
                            <option value="24">24% - Aggressive (Higher rate, more conversion)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            We&apos;ll convert up to the top of this bracket each year
                        </p>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3">
                        📊 Recommended Annual Conversion
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Optimal Conversion Amount</div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                ${conversion.amount.toLocaleString()}
                            </div>
                        </div>

                        {conversion.amount === 0 && (
                            <div className="p-2 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-200">
                                <strong>Why $0?</strong> Your current income (${currentIncome.toLocaleString()}) combined with the standard deduction (${standardDeduction.toLocaleString()}) likely already fills or exceeds the {targetBracket}% bracket. Consider raising the target bracket to finding conversion room.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Tax Cost ({targetBracket}%)</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    ${conversion.taxCost.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Effective Rate</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {conversion.effectiveRate.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-green-200 dark:border-green-800">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net Benefit</div>
                            <div className="text-xs text-green-700 dark:text-green-300">
                                {conversion.benefit}
                            </div>
                        </div>

                        <button
                            onClick={handleApplyConversion}
                            disabled={showFeedback}
                            className={`w-full mt-3 px-4 py-2 rounded-md font-medium transition-colors ${showFeedback
                                ? 'bg-green-100 text-green-800'
                                : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {showFeedback ? '✅ Plan Updated!' : 'Apply to Plan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Strategy Explanation */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    💡 Strategy:
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <p>
                        <strong>The Goal:</strong> Move money from your Pre-Tax bucket (Traditional IRA) to your Tax-Free bucket (Roth IRA).
                    </p>
                    <p>
                        <strong>Why Now:</strong> If you're in a low tax bracket now, pay {targetBracket}% tax today to avoid potentially
                        22-37% tax in retirement when Required Minimum Distributions (RMDs) kick in.
                    </p>
                    <p>
                        <strong>The Magic:</strong> Once in the Roth, this money grows tax-free forever and withdrawals are "invisible"
                        to the IRS - they don't count as income, don't affect ACA subsidies, and don't trigger IRMAA Medicare surcharges.
                    </p>
                    <p className="text-green-700 dark:text-green-300 font-semibold">
                        Convert ${conversion.amount.toLocaleString()} annually and you'll build a substantial "invisible money" war chest
                        for tax-free retirement living!
                    </p>
                </div>
            </div>
        </div>
    );
}
