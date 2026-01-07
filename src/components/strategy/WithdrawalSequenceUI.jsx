/**
 * Withdrawal Sequence Visualizer
 *
 * Shows year-by-year breakdown of withdrawals using the three-bucket strategy
 */

import { useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import { calculate0PercentThresholds } from '../../lib/taxFreeEngine';

export default function WithdrawalSequenceUI() {
    const { ledger, planData } = usePlan();
    const [selectedYear, setSelectedYear] = useState(0);

    if (!ledger || ledger.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Run calculation to see withdrawal sequence...</p>
            </div>
        );
    }

    // eslint-disable-next-line no-unused-vars
    const thresholds = calculate0PercentThresholds(planData.profile?.filingStatus || 'married');
    const yearData = ledger[selectedYear];
    const clientAge = yearData?.age || 0;
    const isRetired = clientAge >= (planData.people?.[0]?.retirementAge || 67);

    // Extract withdrawal data
    const withdrawals = yearData?.withdrawals || {};
    const traditional = withdrawals.traditional || 0;
    const brokerage = withdrawals.brokerage || 0;
    const roth = withdrawals.roth || 0;
    const hsa = withdrawals.hsa || 0;
    const crypto = withdrawals.crypto || 0;
    const cash = withdrawals.cash || 0;
    const totalWithdrawals = withdrawals.total || (traditional + brokerage + roth + hsa + crypto + cash);

    // Bucket Assignments (Visual mapping)
    const bucket1Used = traditional; // Includes Std Ded + excess Trad
    const bucket2Used = brokerage + crypto + cash;
    const bucket3Used = roth;
    const hsaUsed = hsa;

    const taxPaid = yearData?.taxes?.totalTax || 0;
    const effectiveRate = totalWithdrawals > 0 ? (taxPaid / totalWithdrawals) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        📅 Annual Withdrawal Sequence
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedYear(Math.max(0, selectedYear - 1))}
                            disabled={selectedYear === 0}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                        >
                            ←
                        </button>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[100px] text-center">
                            Age {clientAge} (Year {selectedYear + 1}/{ledger.length})
                        </span>
                        <button
                            onClick={() => setSelectedYear(Math.min(ledger.length - 1, selectedYear + 1))}
                            disabled={selectedYear === ledger.length - 1}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                </div>

                <input
                    type="range"
                    min="0"
                    max={ledger.length - 1}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full"
                />
            </div>

            {!isRetired ? (
                /* Pre-Retirement Message */
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                        <div className="text-4xl mb-3">💼</div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Pre-Retirement Years</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            The Tax-Free Retirement Engine activates after retirement (age {planData.people?.[0]?.retirementAge || 67}).
                            During working years, surplus income fills your portfolio buckets.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Three Bucket Visual Breakdown */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                                💰 Withdrawal Breakdown
                            </h4>
                            <div className="text-xs text-gray-500 italic">
                                Optimized for {planData.profile?.filingStatus || 'married'} filing status
                            </div>
                        </div>

                        {totalWithdrawals > 1 ? (
                            <div className="space-y-6">
                                {/* Visual Bar */}
                                <div className="h-12 flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
                                    {bucket1Used > 0 && (
                                        <div
                                            style={{ width: `${(bucket1Used / totalWithdrawals) * 100}%` }}
                                            className="bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold border-r border-white/20"
                                            title={`Bucket #1 (Traditional): $${bucket1Used.toLocaleString()}`}
                                        >
                                            {bucket1Used / totalWithdrawals >= 0.1 && `Bucket #1`}
                                        </div>
                                    )}
                                    {bucket2Used > 0 && (
                                        <div
                                            style={{ width: `${(bucket2Used / totalWithdrawals) * 100}%` }}
                                            className="bg-amber-500 dark:bg-amber-600 flex items-center justify-center text-white text-[10px] font-bold border-r border-white/20"
                                            title={`Bucket #2 (Taxable+Crypto+Cash): $${bucket2Used.toLocaleString()}`}
                                        >
                                            {bucket2Used / totalWithdrawals >= 0.1 && `Bucket #2`}
                                        </div>
                                    )}
                                    {hsaUsed > 0 && (
                                        <div
                                            style={{ width: `${(hsaUsed / totalWithdrawals) * 100}%` }}
                                            className="bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center text-white text-[10px] font-bold border-r border-white/20"
                                            title={`HSA: $${hsaUsed.toLocaleString()}`}
                                        >
                                            {hsaUsed / totalWithdrawals >= 0.1 && `HSA`}
                                        </div>
                                    )}
                                    {bucket3Used > 0 && (
                                        <div
                                            style={{ width: `${(bucket3Used / totalWithdrawals) * 100}%` }}
                                            className="bg-green-500 dark:bg-green-600 flex items-center justify-center text-white text-[10px] font-bold"
                                            title={`Bucket #3 (Roth): $${bucket3Used.toLocaleString()}`}
                                        >
                                            {bucket3Used / totalWithdrawals >= 0.1 && `Bucket #3`}
                                        </div>
                                    )}
                                </div>

                                {/* Source Detail Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-left">
                                                <th className="pb-2 font-semibold">Source Account</th>
                                                <th className="pb-2 font-semibold text-right">Amount</th>
                                                <th className="pb-2 font-semibold text-right">Tax Rate</th>
                                                <th className="pb-2 font-semibold text-right">Category</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {traditional > 0 && (
                                                <tr>
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        Traditional IRA/401k
                                                    </td>
                                                    <td className="py-2 text-right font-medium">${traditional.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-500">Ordinary</td>
                                                    <td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">BUCKET 1</span></td>
                                                </tr>
                                            )}
                                            {brokerage > 0 && (
                                                <tr>
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                        Taxable Brokerage
                                                    </td>
                                                    <td className="py-2 text-right font-medium">${brokerage.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-500">0-15% LTCG</td>
                                                    <td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">BUCKET 2</span></td>
                                                </tr>
                                            )}
                                            {crypto > 0 && (
                                                <tr>
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                                                        Crypto Holdings
                                                    </td>
                                                    <td className="py-2 text-right font-medium">${crypto.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-500">0-15% LTCG</td>
                                                    <td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">BUCKET 2</span></td>
                                                </tr>
                                            )}
                                            {cash > 0 && (
                                                <tr>
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                        Cash Reserves
                                                    </td>
                                                    <td className="py-2 text-right font-medium">${cash.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-gray-500">0% (Post-Tax)</td>
                                                    <td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">BUCKET 2</span></td>
                                                </tr>
                                            )}
                                            {hsa > 0 && (
                                                <tr>
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                                        HSA (Health Savings)
                                                    </td>
                                                    <td className="py-2 text-right font-medium">${hsa.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-green-600 font-medium">0% (Medical)</td>
                                                    <td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px]">TAX-FREE</span></td>
                                                </tr>
                                            )}
                                            {roth > 0 && (
                                                <tr>
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        Roth IRA/401k
                                                    </td>
                                                    <td className="py-2 text-right font-medium">${roth.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-green-600 font-medium">0% (Invisible)</td>
                                                    <td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px]">BUCKET 3</span></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tax Impact Summary */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Total Outflow</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                ${totalWithdrawals.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Est. Federal Tax</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                ${taxPaid.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Effective Rate</div>
                                            <div className={`text-lg font-bold ${effectiveRate <= 5 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                                {effectiveRate.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Net Spendable</div>
                                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                                ${Math.max(0, totalWithdrawals - taxPaid).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <div className="text-4xl mb-2">💰</div>
                                <p>No withdrawals needed this year</p>
                                <p className="text-sm">Incomes (Salary/SS/Rent) cover all expenses</p>
                            </div>
                        )}
                    </div>

                    {/* Strategy Effectiveness Gauge */}
                    {effectiveRate <= 5 && totalWithdrawals > 0 && (
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 p-4 rounded-lg text-white text-center">
                            <div className="text-3xl mb-2">🎯</div>
                            <div className="font-bold text-lg">Tax-Free Strategy Working!</div>
                            <div className="text-sm text-green-100">
                                Effective tax rate of {effectiveRate.toFixed(1)}% on ${totalWithdrawals.toLocaleString()} withdrawn
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
