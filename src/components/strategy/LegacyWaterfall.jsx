import { formatCurrency } from '../../utils/formatters';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const LegacyWaterfall = ({ finalLedgerEntry }) => {
    if (!finalLedgerEntry || !finalLedgerEntry.estateReport) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Run simulation to see Legacy Analysis</p>
            </div>
        );
    }

    const report = finalLedgerEntry.estateReport;
    const { gross, deductions, taxes, net, config } = report;

    // Format currency
    const fmt = (val) => formatCurrency(val);

    // Heir Chart Data
    const pieData = {
        labels: ['Spouse/Heirs', 'Specific Gifts', 'Charity', 'IRS (Estate + Income Tax)', 'Creditors (Debt)'],
        datasets: [
            {
                data: [
                    net.heirs,
                    net.specific || 0, // v2.2
                    net.charity,
                    taxes.estate + taxes.ird,
                    deductions.mortgage + deductions.hecm
                ],
                backgroundColor: [
                    '#10B981', // Emerald 500 (Heirs)
                    '#F59E0B', // Amber 500 (Specific)
                    '#3B82F6', // Blue 500 (Charity)
                    '#EF4444', // Red 500 (IRS)
                    '#6B7280', // Gray 500 (Debt)
                ],
                borderColor: [
                    '#059669',
                    '#D97706',
                    '#2563EB',
                    '#DC2626',
                    '#4B5563',
                ],
                borderWidth: 1,
            },
        ],
    };

    const grossTotal = gross.portfolio + gross.realEstate + gross.insurance;
    const totalDeductions = deductions.mortgage + deductions.hecm;
    const totalTaxes = taxes.estate + taxes.ird;

    return (
        <div className="space-y-6">
            {/* High Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Gross Estate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(grossTotal)}</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                        {config.isILIT ? 'Includes ILIT Assets' : 'Includes Insurance'}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Total Taxes</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">-{fmt(totalTaxes)}</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                        Estate: {fmt(taxes.estate)} | IRD: {fmt(taxes.ird)}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Debts & Expenses</p>
                    <p className="text-xl font-bold text-gray-600 dark:text-gray-400">-{fmt(totalDeductions)}</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                        Mortgage & HECM
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Total Net Legacy</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{fmt(net.heirs + net.charity + (net.specific || 0))}</p>
                    <div className="text-[10px] text-emerald-600/70 mt-1">
                        Efficiency: {((net.heirs + net.charity + (net.specific || 0)) / grossTotal * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Flow Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Distribution Breakdown</h3>
                    <div className="h-48 flex justify-center">
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Asset Composition (at Passing)</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Portfolio Assets</span>
                            <span className="font-semibold dark:text-gray-200">{fmt(gross.portfolio)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(gross.portfolio / grossTotal) * 100}%` }}></div>
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Real Estate</span>
                            <span className="font-semibold dark:text-gray-200">{fmt(gross.realEstate)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(gross.realEstate / grossTotal) * 100}%` }}></div>
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Life Insurance {config.isILIT && '(ILIT)'}</span>
                            <span className="font-semibold dark:text-gray-200">{fmt(gross.insurance)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(gross.insurance / grossTotal) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegacyWaterfall;
