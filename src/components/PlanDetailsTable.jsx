/**
 * PlanDetailsTable - Detailed year-by-year ledger
 *
 * Shows: Age, Status, Expenses, Mortgage, Income, Withdrawals, Balances (Total + Breakdown)
 *
 * @module PlanDetailsTable
 */

import { usePlan } from '../contexts/PlanContext';
import { formatCurrency } from '../utils/formatters';

export default function PlanDetailsTable() {
    const { ledger, planData } = usePlan();

    if (!ledger || ledger.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Calculate plan to see details
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-900">Age</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 text-right">Expenses</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 text-right">Healthcare</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 text-right">Mortgage</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 text-right text-cyan-600">RMD</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 text-right">Income</th>
                            <th className="py-1 px-1 font-semibold text-gray-700 dark:text-gray-300 text-right">Withdrawals</th>
                            <th className="py-1 px-1 font-semibold text-gray-900 dark:text-gray-100 text-right border-l border-gray-200 dark:border-gray-700">Total Bal</th>
                            <th className="py-1 px-1 font-semibold text-gray-500 dark:text-gray-400 text-right text-[10px] uppercase tracking-tighter">Trad</th>
                            <th className="py-1 px-1 font-semibold text-gray-500 dark:text-gray-400 text-right text-[10px] uppercase tracking-tighter">Roth</th>
                            <th className="py-1 px-1 font-semibold text-gray-500 dark:text-gray-400 text-right text-[10px] uppercase tracking-tighter">HSA</th>
                            <th className="py-1 px-1 font-semibold text-gray-500 dark:text-gray-400 text-right text-[10px] uppercase tracking-tighter">Brok</th>
                            <th className="py-1 px-1 font-semibold text-gray-500 dark:text-gray-400 text-right text-[10px] uppercase tracking-tighter">Crypto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {ledger.map((row, idx) => {
                            const healthcare = row.expenses?.healthcare || 0;
                            const mortgagePayment = row.expenses?.mortgage || 0;
                            const livingExpenses = (row.expenses?.total || 0) - mortgagePayment - healthcare;
                            const totalWithdrawals = row.withdrawals?.total || 0;

                            const isWorking = row.age < (planData.people?.[0]?.retirementAge || 65);

                            return (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-1 px-1 font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800">
                                        <div className="flex gap-1.5">
                                            <span>{row.age}</span>
                                            <span className="text-gray-400 dark:text-gray-500 text-[10px] self-center">
                                                ({row.spouseAge > 0 ? row.spouseAge : '†'})
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-1 px-1">
                                        <span className={`px-1.5 py-0.5 rounded-sm ${isWorking ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
                                            {isWorking ? 'Work' : 'Ret'}
                                        </span>
                                    </td>
                                    <td className="py-1 px-1 text-right text-gray-700 dark:text-gray-300">
                                        {formatCurrency(livingExpenses)}
                                    </td>
                                    <td className="py-1 px-1 text-right text-rose-600 dark:text-rose-400">
                                        {healthcare > 0 ? formatCurrency(healthcare) : '-'}
                                    </td>
                                    <td className="py-1 px-1 text-right text-orange-600 dark:text-orange-400">
                                        {mortgagePayment > 0 ? formatCurrency(mortgagePayment) : '-'}
                                    </td>
                                    <td className="py-1 px-1 text-right text-cyan-600 dark:text-cyan-400">
                                        {row.metrics?.detailedCashFlow?.inflows?.rmd > 0 ? formatCurrency(row.metrics.detailedCashFlow.inflows.rmd) : '-'}
                                    </td>
                                    <td className="py-1 px-1 text-right text-teal-600 dark:text-teal-400">
                                        {row.income?.total > 0 ? formatCurrency(row.income.total || 0) : '-'}
                                    </td>
                                    <td className="py-1 px-1 text-right text-red-600 dark:text-red-400">
                                        {totalWithdrawals > 0 ? formatCurrency(totalWithdrawals) : '-'}
                                    </td>
                                    <td className="py-1 px-1 text-right font-bold text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700">
                                        {formatCurrency(row.totalBalance || 0)}
                                    </td>
                                    <td className="py-1 px-1 text-right text-gray-500 dark:text-gray-400 text-[10px]">
                                        {formatCurrency(row.balances?.traditional || 0)}
                                    </td>
                                    <td className="py-1 px-1 text-right text-gray-500 dark:text-gray-400 text-[10px]">
                                        {formatCurrency(row.balances?.roth || 0)}
                                    </td>
                                    <td className="py-1 px-1 text-right text-gray-500 dark:text-gray-400 text-[10px]">
                                        {formatCurrency(row.balances?.hsa || 0)}
                                    </td>
                                    <td className="py-1 px-1 text-right text-gray-500 dark:text-gray-400 text-[10px]">
                                        {formatCurrency(row.balances?.brokerage || 0)}
                                    </td>
                                    <td className="py-1 px-1 text-right text-gray-500 dark:text-gray-400 text-[10px]">
                                        {formatCurrency(row.balances?.crypto || 0)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
