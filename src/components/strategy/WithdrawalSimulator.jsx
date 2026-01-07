import { useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import { optimizeTaxFreeWithdrawal } from '../../lib/taxFreeEngine';

export default function WithdrawalSimulator() {
    const { planData, ledger } = usePlan();
    const [simAmount, setSimAmount] = useState(125000);
    const [selectedYear, setSelectedYear] = useState(0);

    const filingStatus = planData.profile?.filingStatus || 'married';
    // const thresholds = calculate0PercentThresholds(filingStatus);

    // Get situational data for the selected year
    const yearData = ledger?.[selectedYear] || {};
    const age = yearData?.age || 50;
    const currentIncome = (yearData?.income?.salary || 0) + (yearData?.income?.ss || 0) + (yearData?.income?.rent || 0);
    const balances = yearData?.balances || {};

    const result = optimizeTaxFreeWithdrawal(
        simAmount,
        {
            traditional: { client: balances.traditionalClient || 0, spouse: balances.traditionalSpouse || 0 },
            roth: { client: balances.rothClient || 0, spouse: balances.rothSpouse || 0 },
            brokerage: { joint: balances.brokerage || 0 },
            brokerageBasis: { joint: (balances.brokerage || 0) * 0.7 }, // Est basis 70%
            hsa: { client: balances.hsaClient || 0, spouse: balances.hsaSpouse || 0 }
        },
        currentIncome,
        filingStatus
    );

    const taxImpact = result.taxImpact || {};
    // const totalOut = (result.traditional || 0) + (result.brokerage || 0) + (result.roth || 0) + (result.hsa || 0);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    🧪 Withdrawal Logic Simulator
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">EXPERIMENTAL</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Inputs */}
                <div className="md:col-span-1 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                            Simulated Goal
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={simAmount}
                                onChange={(e) => setSimAmount(Number(e.target.value))}
                                className="w-full pl-7 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 italic">What if you needed this additional cash one year?</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                            Projection Year (Age)
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                        >
                            {ledger?.map((year, idx) => (
                                <option key={idx} value={idx}>Year {idx + 1} (Age {year.age})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Visualization */}
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Optimal Draw Plan</span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                            {taxImpact.effectiveRate < 3 ? '✅ Tax Optimized' : '⚠ Limited Options'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {/* Trad Row */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">1. Bucket #1 (Traditional)</span>
                            <span className="font-mono font-bold text-blue-600">${(result.traditional || 0).toLocaleString()}</span>
                        </div>
                        {/* Brokerage Row */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">2. Bucket #2 (Taxable)</span>
                            <span className="font-mono font-bold text-amber-600">${(result.brokerage || 0).toLocaleString()}</span>
                        </div>
                        {/* Roth Row */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">3. Bucket #3 (Roth)</span>
                            <span className="font-mono font-bold text-green-600">${(result.roth || 0).toLocaleString()}</span>
                        </div>
                        {/* HSA Row */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">4. Extra Relief (HSA)</span>
                            <span className="font-mono font-bold text-cyan-600">${(result.hsa || 0).toLocaleString()}</span>
                        </div>

                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                            <div className="flex items-center justify-between text-base font-bold">
                                <span className="">Estimated Tax Bill</span>
                                <span className="text-red-500">${(taxImpact.federalTax || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 italic mt-1">
                                <span>Effective Tax Rate on this draw</span>
                                <span>{taxImpact.effectiveRate?.toFixed(1) || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="flex gap-3">
                    <div className="text-xl">💡</div>
                    <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        <span className="font-bold underline">Simulator Analysis:</span> To take out <strong>${simAmount.toLocaleString()}</strong> at age {age},
                        our engine recommends drawing from <strong>Bucket #1</strong> first (up to the standard deduction),
                        then harvesting <strong>0% Capital Gains</strong> from Bucket #2, using <strong>Roth</strong> money for the remainder.
                        This strategy keeps your total tax to <strong>${(taxImpact.federalTax || 0).toLocaleString()}</strong>.
                    </div>
                </div>
            </div>
        </div>
    );
}
