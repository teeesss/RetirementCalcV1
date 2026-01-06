/**
 * ScenarioManager - Manage and compare plan variations
 *
 * Allows saving snapshots, loading them, and side-by-side comparison
 *
 * @module ScenarioManager
 */

import { useState } from 'react';
import { usePlan } from '../contexts/PlanContext';

export default function ScenarioManager() {
    const { planData, scenarios, saveScenario, loadScenario, deleteScenario, calculateSuccess, ledger } = usePlan();
    const [newScenarioName, setNewScenarioName] = useState('');
    const [isComparing, setIsComparing] = useState(false);

    const handleSave = () => {
        if (!newScenarioName.trim()) return;
        saveScenario(newScenarioName);
        setNewScenarioName('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Scenario snapshots</h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newScenarioName}
                        onChange={(e) => setNewScenarioName(e.target.value)}
                        placeholder="e.g. Early Retirement, Max Roth"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    />
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Save Snapshot
                    </button>
                </div>

                {scenarios.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No saved scenarios yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scenarios.map((s) => (
                            <div key={s.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50/30 dark:bg-gray-900/30">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{s.name}</h4>
                                    <button
                                        onClick={() => deleteScenario(s.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    <div className="flex justify-between">
                                        <span>Outcome:</span>
                                        <span className={s.kpis?.success ? 'text-green-600' : 'text-red-600'}>
                                            {s.kpis?.success ? 'Success' : 'Depleted'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Final Balance:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            ${(s.kpis?.finalBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => loadScenario(s.id)}
                                        className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[11px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {scenarios.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Compare View</h3>
                        <button
                            onClick={() => setIsComparing(!isComparing)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {isComparing ? 'Close Comparison' : 'Compare All Scenarios'}
                        </button>
                    </div>

                    {isComparing && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] text-gray-500 tracking-wider">
                                        <th className="py-2 px-3">Metric</th>
                                        <th className="py-2 px-3 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 font-bold">Current Plan</th>
                                        {scenarios.map(s => (
                                            <th key={s.id} className="py-2 px-3">{s.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    <tr>
                                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Success</td>
                                        <td className={`py-3 px-3 font-bold ${calculateSuccess?.success ? 'text-green-600' : 'text-red-600'} bg-blue-50/20 dark:bg-blue-900/10`}>
                                            {calculateSuccess?.success ? '✅ Success' : '❌ Depleted'}
                                        </td>
                                        {scenarios.map(s => (
                                            <td key={s.id} className={`py-3 px-3 font-medium ${s.kpis?.success ? 'text-green-600' : 'text-red-600'}`}>
                                                {s.kpis?.success ? '✅ Success' : '❌ Depleted'}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Final Balance</td>
                                        <td className="py-3 px-3 font-bold bg-blue-50/20 dark:bg-blue-900/10">
                                            ${(calculateSuccess?.finalBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        {scenarios.map(s => (
                                            <td key={s.id} className="py-3 px-3">
                                                ${(s.kpis?.finalBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Net Worth</td>
                                        <td className="py-3 px-3 font-bold bg-blue-50/20 dark:bg-blue-900/10">
                                            ${(ledger[ledger.length - 1]?.netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        {scenarios.map(s => (
                                            <td key={s.id} className="py-3 px-3">
                                                ${(s.kpis?.netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Lifetime Tax</td>
                                        <td className="py-3 px-3 font-bold bg-blue-50/20 dark:bg-blue-900/10">
                                            ${(calculateSuccess?.lifetimeTax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        {scenarios.map(s => (
                                            <td key={s.id} className="py-3 px-3">
                                                ${(s.kpis?.lifetimeTax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Retirement Age</td>
                                        <td className="py-3 px-3 font-bold bg-blue-50/20 dark:bg-blue-900/10">
                                            {planData.people?.[0]?.retirementAge} / {planData.people?.[1]?.retirementAge}
                                        </td>
                                        {scenarios.map(s => (
                                            <td key={s.id} className="py-3 px-3">
                                                {s.planData.people?.[0]?.retirementAge} / {s.planData.people?.[1]?.retirementAge}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Annual Spending</td>
                                        <td className="py-3 px-3 font-bold bg-blue-50/20 dark:bg-blue-900/10">
                                            ${((planData.expenses?.essential || 0) + (planData.expenses?.discretionary || 0)).toLocaleString()}
                                        </td>
                                        {scenarios.map(s => (
                                            <td key={s.id} className="py-3 px-3">
                                                ${((s.planData.expenses?.essential || 0) + (s.planData.expenses?.discretionary || 0)).toLocaleString()}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
