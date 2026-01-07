
import { usePlan } from '../contexts/PlanContext';

export default function HeritageCard({ darkMode = false }) {
    const { ledger } = usePlan();

    if (!ledger || ledger.length === 0) return null;

    // Show value at longevity (last year of plan)
    const finalYear = ledger[ledger.length - 1];
    const legacyValue = finalYear.legacyValue || 0;
    const totalBalance = finalYear.totalBalance || 0;
    const taxBurden = totalBalance - legacyValue;

    return (
        <div className={`p-4 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🏰 Estate Value
                </h3>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-200">
                    Net to Heirs
                </span>
            </div>

            <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ${Math.round(legacyValue).toLocaleString()}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
                Estimated tax burden: <span className="text-red-500">-${Math.round(taxBurden).toLocaleString()}</span>
            </div>
            <div className="mt-2 text-[10px] text-gray-400 italic">
                Assumes step-up basis on brokerage/crypto & marginal tax rate on IRA.
            </div>
        </div>
    );
}
