
import { useState } from 'react';

/**
 * CashFlowWaterfall - Detailed breakdown of cash flows for a specific year
 * Shows all inflows (salary, SS, withdrawals) and outflows (expenses, taxes) as a waterfall
 */
export default function CashFlowWaterfall({ ledger, selectedYear }) {
    const [year, setYear] = useState(selectedYear || 0);

    if (!ledger || ledger.length === 0) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                    No ledger data available. Run a calculation first.
                </p>
            </div>
        );
    }

    const yearData = ledger[year] || {};
    const {
        income = {},
        expenses = {},
        taxes = {},
        withdrawals = {},
        balances = {}
    } = yearData;

    // Calculate waterfall sections
    const inflows = [
        { label: 'Salary', value: income.salary || 0, color: 'bg-blue-500' },
        { label: 'Social Security', value: income.ss || 0, color: 'bg-green-500' },
        { label: 'Pension', value: income.pension || 0, color: 'bg-purple-500' },
        { label: 'W/D Traditional', value: withdrawals.traditional || 0, color: 'bg-yellow-500' },
        { label: 'W/D Roth', value: withdrawals.roth || 0, color: 'bg-orange-500' },
        { label: 'W/D Brokerage', value: withdrawals.brokerage || 0, color: 'bg-pink-500' },
        { label: 'W/D HSA', value: withdrawals.hsa || 0, color: 'bg-indigo-500' },
        { label: 'W/D Crypto', value: withdrawals.crypto || 0, color: 'bg-amber-500' },
        { label: 'W/D Cash', value: withdrawals.cash || 0, color: 'bg-emerald-500' }
    ];

    const outflows = [
        { label: 'Expenses (Base)', value: expenses.essential || 0, color: 'bg-red-500' },
        { label: 'Housing/RE', value: expenses.housing || 0, color: 'bg-red-400' },
        { label: 'Healthcare', value: expenses.healthcare || 0, color: 'bg-red-300' },
        { label: 'Mortgage', value: expenses.mortgage || 0, color: 'bg-orange-500' },
        { label: 'Federal Tax', value: taxes.federal || 0, color: 'bg-gray-600' },
        { label: 'State Tax', value: taxes.state || 0, color: 'bg-gray-500' },
        { label: 'FICA', value: taxes.fica?.total || 0, color: 'bg-gray-400' }
    ];

    const totalInflows = (income.total || 0) + (withdrawals.total || 0);
    const totalOutflows = outflows.reduce((sum, item) => sum + item.value, 0);
    const netCashFlow = totalInflows - totalOutflows;

    return (
        <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Cash Flow Breakdown
                </h3>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Year:</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        {ledger.map((item, idx) => (
                            <option key={idx} value={idx}>
                                Year {idx + 1} ({item.age})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Inflows */}
            <div>
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">💰 Inflows</h4>
                <div className="space-y-2">
                    {inflows.filter(item => item.value > 0).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <div className={`w-3 h-3 rounded ${item.color}`}></div>
                                <span className="text-[10px] text-gray-700 dark:text-gray-300">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`${item.color} h-2 rounded-full`}
                                        style={{ width: `${(item.value / totalInflows) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 w-24 text-right">
                                    ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between font-bold text-sm">
                        <span className="text-green-700 dark:text-green-400">Total Inflows</span>
                        <span className="text-gray-900 dark:text-gray-100">${totalInflows.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>

            {/* Outflows */}
            <div>
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">💸 Outflows</h4>
                <div className="space-y-2">
                    {outflows.filter(item => item.value > 0).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <div className={`w-3 h-3 rounded ${item.color}`}></div>
                                <span className="text-[10px] text-gray-700 dark:text-gray-300">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`${item.color} h-2 rounded-full`}
                                        style={{ width: `${(item.value / totalOutflows) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 w-24 text-right">
                                    ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between font-bold text-sm">
                        <span className="text-red-700 dark:text-red-400">Total Outflows</span>
                        <span className="text-gray-900 dark:text-gray-100">${totalOutflows.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>

            {/* Net Cash Flow */}
            <div className={`p-4 rounded-lg border-2 ${netCashFlow >= 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Net Cash Flow</span>
                    <span className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString('en-US')}
                    </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {netCashFlow >= 0
                        ? '✅ Surplus - Reinvested into portfolio'
                        : '⚠️ Deficit - Funded by withdrawals'}
                </div>
            </div>

            {/* Portfolio Balance */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">End of Year Portfolio</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${(balances.totalBalance || 0).toLocaleString('en-US')}
                </div>
            </div>
        </div>
    );
}
