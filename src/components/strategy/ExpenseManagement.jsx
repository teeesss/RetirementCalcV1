/**
 * ExpenseManagement - UI for managing one-time and recurring expenses
 *
 * Allows users to define:
 * - One-time expenses (e.g., "$50k car purchase at age 65")
 * - Recurring expenses (e.g., "$5k/year travel from age 60-75")
 */

import { useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import SmartInput from '../SmartInput';

export default function ExpenseManagement() {
    const { planData, updatePlan } = usePlan();
    const [editingOneTime, setEditingOneTime] = useState(null);
    const [editingRecurring, setEditingRecurring] = useState(null);

    const oneTimeExpenses = planData.expenses?.oneTime || [];
    const recurringExpenses = planData.expenses?.recurring || [];

    const addOneTime = () => {
        setEditingOneTime({
            id: crypto.randomUUID(),
            name: 'New Expense',
            amount: 10000,
            age: 65
        });
    };

    const saveOneTime = (expense) => {
        const existing = oneTimeExpenses.find(e => e.id === expense.id);
        let updated;

        if (existing) {
            updated = oneTimeExpenses.map(e => e.id === expense.id ? expense : e);
        } else {
            updated = [...oneTimeExpenses, expense];
        }

        updatePlan({
            expenses: {
                ...planData.expenses,
                oneTime: updated
            }
        });
        setEditingOneTime(null);
    };

    const deleteOneTime = (id) => {
        updatePlan({
            expenses: {
                ...planData.expenses,
                oneTime: oneTimeExpenses.filter(e => e.id !== id)
            }
        });
    };

    const addRecurring = () => {
        setEditingRecurring({
            id: crypto.randomUUID(),
            name: 'New Recurring',
            amount: 5000,
            ageStart: 60,
            ageEnd: 75,
            inflationAdjusted: true
        });
    };

    const saveRecurring = (expense) => {
        const existing = recurringExpenses.find(e => e.id === expense.id);
        let updated;

        if (existing) {
            updated = recurringExpenses.map(e => e.id === expense.id ? expense : e);
        } else {
            updated = [...recurringExpenses, expense];
        }

        updatePlan({
            expenses: {
                ...planData.expenses,
                recurring: updated
            }
        });
        setEditingRecurring(null);
    };

    const deleteRecurring = (id) => {
        updatePlan({
            expenses: {
                ...planData.expenses,
                recurring: recurringExpenses.filter(e => e.id !== id)
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* One-Time Expenses */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">💰 One-Time Expenses</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Define one-time expenses that occur at specific ages (e.g., car purchase, home renovation)
                </p>

                {oneTimeExpenses.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        <p className="text-gray-400 dark:text-gray-500 mb-3">No one-time expenses defined</p>
                        <button
                            onClick={addOneTime}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                            + Add One-Time Expense
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 mb-3">
                            {oneTimeExpenses.map((expense) => (
                                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex-grow">
                                        <div className="font-semibold text-gray-900 dark:text-white">{expense.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            ${expense.amount.toLocaleString()} at age {expense.age}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingOneTime(expense)}
                                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteOneTime(expense.id)}
                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addOneTime}
                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm rounded transition-colors"
                        >
                            + Add Another
                        </button>
                    </>
                )}
            </div>

            {/* Recurring Expenses */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🔄 Recurring Expenses</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Define recurring expenses for specific age ranges (e.g., travel during retirement, healthcare premiums)
                </p>

                {recurringExpenses.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        <p className="text-gray-400 dark:text-gray-500 mb-3">No recurring expenses defined</p>
                        <button
                            onClick={addRecurring}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                            + Add Recurring Expense
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 mb-3">
                            {recurringExpenses.map((expense) => (
                                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex-grow">
                                        <div className="font-semibold text-gray-900 dark:text-white">{expense.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            ${expense.amount.toLocaleString()}/year • Ages {expense.ageStart}-{expense.ageEnd}
                                            {expense.inflationAdjusted && <span className="ml-2 text-xs">(inflation-adjusted)</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingRecurring(expense)}
                                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteRecurring(expense.id)}
                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addRecurring}
                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm rounded transition-colors"
                        >
                            + Add Another
                        </button>
                    </>
                )}
            </div>

            {/* Mortgage Strategy */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-red-200 dark:border-red-900/50">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            🏠 Mortgage Strategy
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage your primary mortgage payoff plan.
                        </p>
                    </div>
                    {(planData.realEstate?.[0]?.mortgage?.balance || 0) <= 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Paid Off</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Current Balance</label>
                        <SmartInput
                            value={planData.realEstate?.[0]?.mortgage?.balance || planData.mortgage?.balance || 0}
                            onChange={(val) => {
                                const updates = { mortgage: { ...(planData.mortgage || {}), balance: val } };
                                const newRE = [...(planData.realEstate || [])];
                                if (newRE[0]) {
                                    newRE[0].mortgage = { ...newRE[0].mortgage, balance: val };
                                    updates.realEstate = newRE;
                                }
                                updatePlan(updates);
                            }}
                            className="w-full text-lg font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                            step="1000"
                        />
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Interest Rate %</label>
                        <SmartInput
                            value={planData.realEstate?.[0]?.mortgage?.rate || planData.mortgage?.rate || 0}
                            onChange={(val) => {
                                const updates = { mortgage: { ...(planData.mortgage || {}), rate: val } };
                                const newRE = [...(planData.realEstate || [])];
                                if (newRE[0]) {
                                    newRE[0].mortgage = { ...newRE[0].mortgage, rate: val };
                                    updates.realEstate = newRE;
                                }
                                updatePlan(updates);
                            }}
                            className="w-full text-lg font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                            step="0.125"
                        />
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Monthly Payment (P&I)</label>
                        <SmartInput
                            value={planData.realEstate?.[0]?.mortgage?.paymentPI || planData.mortgage?.paymentPI || 0}
                            onChange={(val) => {
                                const updates = { mortgage: { ...(planData.mortgage || {}), paymentPI: val } };
                                const newRE = [...(planData.realEstate || [])];
                                if (newRE[0]) {
                                    newRE[0].mortgage = { ...newRE[0].mortgage, paymentPI: val };
                                    updates.realEstate = newRE;
                                }
                                updatePlan(updates);
                            }}
                            className="w-full text-lg font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                            step="100"
                        />
                    </div>
                </div>
            </div>

            {/* One-Time Expense Editor Modal */}
            {editingOneTime && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {oneTimeExpenses.find(e => e.id === editingOneTime.id) ? 'Edit' : 'Add'} One-Time Expense
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingOneTime.name}
                                    onChange={(e) => setEditingOneTime({ ...editingOneTime, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., New Car"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    value={editingOneTime.amount}
                                    onChange={(e) => setEditingOneTime({ ...editingOneTime, amount: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    step="1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                                <input
                                    type="number"
                                    value={editingOneTime.age}
                                    onChange={(e) => setEditingOneTime({ ...editingOneTime, age: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setEditingOneTime(null)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveOneTime(editingOneTime)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recurring Expense Editor Modal */}
            {editingRecurring && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {recurringExpenses.find(e => e.id === editingRecurring.id) ? 'Edit' : 'Add'} Recurring Expense
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingRecurring.name}
                                    onChange={(e) => setEditingRecurring({ ...editingRecurring, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., Travel Budget"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Amount ($)</label>
                                <input
                                    type="number"
                                    value={editingRecurring.amount}
                                    onChange={(e) => setEditingRecurring({ ...editingRecurring, amount: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    step="1000"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Age</label>
                                    <input
                                        type="number"
                                        value={editingRecurring.ageStart}
                                        onChange={(e) => setEditingRecurring({ ...editingRecurring, ageStart: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Age</label>
                                    <input
                                        type="number"
                                        value={editingRecurring.ageEnd}
                                        onChange={(e) => setEditingRecurring({ ...editingRecurring, ageEnd: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingRecurring.inflationAdjusted}
                                        onChange={(e) => setEditingRecurring({ ...editingRecurring, inflationAdjusted: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Adjust for inflation</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-6">If checked, amount increases with inflation each year</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setEditingRecurring(null)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveRecurring(editingRecurring)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
