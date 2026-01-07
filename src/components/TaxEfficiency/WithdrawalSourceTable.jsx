
import React from 'react';

/**
 * Renders a year-by-year table of withdrawal sources and tax details.
 * @param {Object} props
 * @param {Array} props.ledger - The financial ledger array
 */
export default function WithdrawalSourceTable({ ledger }) {
    if (!ledger || ledger.length === 0) return null;

    const formatMoney = (val) => {
        if (!val) return '-';
        // Compact notation for tight column
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val.toFixed(0)}`;
    };

    const formatMoneyFull = (val) => val ? `$${Math.round(val).toLocaleString()}` : '-';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Year</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Age</th>
                            <th className="px-3 py-3 text-right font-medium text-gray-900 uppercase tracking-wider bg-gray-100" title="Total Annual Expenses Including Taxes">Total Spend</th>
                            {/* Tax Free Section */}
                            <th className="px-3 py-3 text-right font-medium text-green-600 uppercase tracking-wider" title="Withdrawals from Cash Bucket">Cash (Draw)</th>
                            <th className="px-3 py-3 text-right font-medium text-green-600 uppercase tracking-wider" title="Withdrawals from Roth IRA">Roth (Free)</th>
                            <th className="px-3 py-3 text-right font-medium text-green-600 uppercase tracking-wider" title="Withdrawals from HSA">HSA (Qual)</th>
                            {/* Tax Deferred/Oridnary Section */}
                            <th className="px-3 py-3 text-right font-medium text-blue-600 uppercase tracking-wider" title="Withdrawals from Traditional IRA/401k">Trad IRA</th>
                            <th className="px-3 py-3 text-right font-medium text-blue-600 uppercase tracking-wider" title="Wages and Social Security Benefits">Salary/SS</th>
                            <th className="px-3 py-3 text-right font-medium text-blue-600 uppercase tracking-wider" title="Roth Conversions (Taxable Event)">Conv.</th>
                            {/* Taxable Section */}
                            <th className="px-3 py-3 text-right font-medium text-orange-600 uppercase tracking-wider" title="Brokerage Sales (Basis + Gains)">Brokerage</th>
                            {/* Logic */}
                            <th className="px-3 py-3 text-right font-medium text-gray-900 uppercase tracking-wider bg-gray-50" title="Adjusted Gross Income">AGI</th>
                            <th className="px-3 py-3 text-right font-medium text-red-600 uppercase tracking-wider" title="Total Tax Liability">Total Tax</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ledger.map((year, index) => {
                            const drawdowns = year.metrics?.detailedCashFlow?.drawdowns || year.withdrawals || {};
                            const inflows = year.metrics?.detailedCashFlow?.inflows || {};
                            const taxes = year.taxes || {};

                            // Combine Cash sources (Cash + Roth + HSA + Basis portion of Brokerage? No just buckets)
                            const cash = drawdowns.cash || 0;
                            const roth = drawdowns.roth || 0;
                            const hsa = drawdowns.hsa || 0;
                            const trad = drawdowns.traditional || 0;
                            const income = (inflows.salary || 0) + (inflows.socialSecurity || 0) + (inflows.pension || 0);
                            const conversion = drawdowns.rothConversion || drawdowns.conversion || 0;
                            const brokerage = (drawdowns.brokerage || 0) + (drawdowns.crypto || 0);
                            const spend = year.expenses?.total || 0;

                            // Conversion adds to AGI but is not "Spendable Cash" in the same way (internal transfer).
                            // But here 'Total Spend' is Expenses.

                            return (
                                <tr key={year.year} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                    <td className="px-3 py-2 text-gray-900">{year.year}</td>
                                    <td className="px-3 py-2 text-gray-500">{year.age}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900 bg-gray-50 border-x border-gray-100">{formatMoneyFull(Math.round(spend))}</td>

                                    <td className="px-3 py-2 text-right text-gray-600" title="Cash Bucket Drawdown">{formatMoneyFull(cash)}</td>
                                    <td className="px-3 py-2 text-right text-green-700" title="Tax-Free Roth Withdrawals">{formatMoneyFull(roth)}</td>
                                    <td className="px-3 py-2 text-right text-green-700" title="Qualified HSA Distributions">{formatMoneyFull(hsa)}</td>

                                    <td className="px-3 py-2 text-right text-blue-700" title="Taxable Traditional IRA Withdrawals">{formatMoneyFull(trad)}</td>
                                    <td className="px-3 py-2 text-right text-blue-700" title="Social Security & Salary Income">{formatMoneyFull(income)}</td>
                                    <td className="px-3 py-2 text-right text-purple-600 italic" title="Roth Conversion Amount (Not Spendable)">{conversion > 0 ? formatMoneyFull(conversion) : '-'}</td>

                                    <td className="px-3 py-2 text-right text-orange-700" title="Brokerage Sales (Basis + Gains)">{formatMoneyFull(brokerage)}</td>

                                    <td className="px-3 py-2 text-right font-medium text-gray-900 bg-gray-50 border-l border-gray-100" title="Adjusted Gross Income">{formatMoneyFull(taxes.agi)}</td>
                                    <td className="px-3 py-2 text-right font-bold text-red-600" title="Total Federal + State + FICA Tax">{formatMoneyFull(taxes.totalTax)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
