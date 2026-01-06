/**
 * CustomWithdrawalRules - UI for configuring flexible withdrawal strategies
 *
 * Allows users to create age-based rules for account withdrawal sequences
 */

import { useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import { calculate0PercentThresholds } from '../../lib/taxFreeEngine';

export default function CustomWithdrawalRules() {
    const { planData, updatePlan } = usePlan();
    const customWithdrawal = planData.strategy?.customWithdrawal || { enabled: false, rules: [] };
    const [editingRule, setEditingRule] = useState(null);

    // Get filing status from plan for dynamic tax thresholds
    const filingStatus = planData.profile?.filingStatus || 'single';
    const taxThresholds = calculate0PercentThresholds(filingStatus);

    const toggleEnabled = () => {
        updatePlan({
            strategy: {
                ...planData.strategy,
                customWithdrawal: {
                    ...customWithdrawal,
                    enabled: !customWithdrawal.enabled
                }
            }
        });
    };

    const addRule = () => {
        // Tax-efficient defaults based on FILING STATUS
        // Use actual IRS thresholds from taxFreeEngine
        const newRule = {
            id: crypto.randomUUID(),
            name: `Rule ${customWithdrawal.rules.length + 1}`,
            ageStart: planData.people?.[0]?.retirementAge || 60,
            ageEnd: planData.people?.[0]?.lifeExpectancy || 90,
            sequence: ['traditional', 'brokerage', 'crypto', 'hsa', 'roth'],
            amounts: {
                traditional: { type: 'fixed', maxAmount: taxThresholds.bucket1Max }, // Fill 0% bracket (Standard Deduction)
                brokerage: { type: 'fixed', maxAmount: taxThresholds.bucket2Max }, // 0% LTCG limit
                crypto: { type: 'remainder' },
                hsa: { type: 'remainder' },
                roth: { type: 'remainder' } // Tax-free - use last
            }
        };
        setEditingRule(newRule);
    };

    const saveRule = (rule) => {
        const existingIndex = customWithdrawal.rules.findIndex(r => r.id === rule.id);
        let updatedRules;

        if (existingIndex >= 0) {
            updatedRules = [...customWithdrawal.rules];
            updatedRules[existingIndex] = rule;
        } else {
            updatedRules = [...customWithdrawal.rules, rule];
        }

        updatePlan({
            strategy: {
                ...planData.strategy,
                customWithdrawal: {
                    ...customWithdrawal,
                    rules: updatedRules
                }
            }
        });
        setEditingRule(null);
    };

    const deleteRule = (ruleId) => {
        updatePlan({
            strategy: {
                ...planData.strategy,
                customWithdrawal: {
                    ...customWithdrawal,
                    rules: customWithdrawal.rules.filter(r => r.id !== ruleId)
                }
            }
        });
    };

    const accountTypes = [
        { id: 'brokerage', name: 'Brokerage (Taxable)', color: 'blue' },
        { id: 'traditional', name: 'Traditional IRA/401k', color: 'orange' },
        { id: 'roth', name: 'Roth IRA/401k', color: 'purple' },
        { id: 'hsa', name: 'HSA', color: 'green' },
        { id: 'crypto', name: 'Crypto', color: 'yellow' }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            🎯 Custom Withdrawal Rules
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Define age-based withdrawal sequences to optimize tax efficiency
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={customWithdrawal.enabled}
                            onChange={toggleEnabled}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {customWithdrawal.enabled && (
                    <div className="space-y-4">
                        {/* Rules List */}
                        {customWithdrawal.rules.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                <p className="text-gray-400 dark:text-gray-500 mb-3">No custom rules defined yet</p>
                                <button
                                    onClick={addRule}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                >
                                    + Create First Rule
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {customWithdrawal.rules.map((rule) => (
                                        <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ages {rule.ageStart}-{rule.ageEnd}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingRule(rule)}
                                                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRule(rule.id)}
                                                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                Sequence: {rule.sequence.map(acc => accountTypes.find(a => a.id === acc)?.name || acc).join(' → ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addRule}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm rounded transition-colors"
                                >
                                    + Add Another Rule
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Rule Editor Modal */}
            {editingRule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {customWithdrawal.rules.find(r => r.id === editingRule.id) ? 'Edit' : 'Create'} Withdrawal Rule
                            </h3>

                            {/* Rule Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    value={editingRule.name}
                                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., Early Retirement Strategy"
                                />
                            </div>

                            {/* Age Range */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Age</label>
                                    <input
                                        type="number"
                                        value={editingRule.ageStart}
                                        onChange={(e) => setEditingRule({ ...editingRule, ageStart: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Age</label>
                                    <input
                                        type="number"
                                        value={editingRule.ageEnd}
                                        onChange={(e) => setEditingRule({ ...editingRule, ageEnd: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Account Sequence */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Withdrawal Sequence</label>
                                <p className="text-xs text-gray-500 mb-2">Use arrows to reorder. First = withdraw first.</p>
                                <div className="space-y-2">
                                    {editingRule.sequence.map((accId, idx) => {
                                        const acc = accountTypes.find(a => a.id === accId);
                                        const limit = editingRule.amounts?.[accId] || { type: 'remainder', maxAmount: null };
                                        return (
                                            <div
                                                key={accId}
                                                className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded cursor-move hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.dataTransfer.setData('text/plain', idx);
                                                    e.currentTarget.classList.add('opacity-50', 'border-2', 'border-blue-500');
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.classList.remove('opacity-50', 'border-2', 'border-blue-500');
                                                }}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = 'move';
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                                                    const toIdx = idx;

                                                    if (fromIdx === toIdx) return;

                                                    const newSeq = [...editingRule.sequence];
                                                    // Remove from old pos
                                                    const parsedFromIdx = parseInt(fromIdx, 10);
                                                    const item = newSeq[parsedFromIdx];
                                                    newSeq.splice(parsedFromIdx, 1);
                                                    // Insert at new pos
                                                    newSeq.splice(toIdx, 0, item);

                                                    setEditingRule({ ...editingRule, sequence: newSeq });
                                                }}
                                            >
                                                {/* Move Buttons (accessible fallback) */}
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => {
                                                            if (idx > 0) {
                                                                const newSeq = [...editingRule.sequence];
                                                                [newSeq[idx - 1], newSeq[idx]] = [newSeq[idx], newSeq[idx - 1]];
                                                                setEditingRule({ ...editingRule, sequence: newSeq });
                                                            }
                                                        }}
                                                        disabled={idx === 0}
                                                        className={`text-xs px-1 py-0.5 rounded ${idx === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
                                                    >▲</button>
                                                    <button
                                                        onClick={() => {
                                                            if (idx < editingRule.sequence.length - 1) {
                                                                const newSeq = [...editingRule.sequence];
                                                                [newSeq[idx], newSeq[idx + 1]] = [newSeq[idx + 1], newSeq[idx]];
                                                                setEditingRule({ ...editingRule, sequence: newSeq });
                                                            }
                                                        }}
                                                        disabled={idx === editingRule.sequence.length - 1}
                                                        className={`text-xs px-1 py-0.5 rounded ${idx === editingRule.sequence.length - 1 ? 'text-gray-300 dark:text-gray-600' : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
                                                    >▼</button>
                                                </div>
                                                <span className="text-gray-400 w-6">#{idx + 1}</span>
                                                <span className="flex-grow font-medium text-gray-900 dark:text-white text-sm">{acc?.name}</span>
                                                {/* Limit Input */}
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={limit.type}
                                                        onChange={(e) => {
                                                            const newAmounts = { ...editingRule.amounts, [accId]: { ...limit, type: e.target.value } };
                                                            setEditingRule({ ...editingRule, amounts: newAmounts });
                                                        }}
                                                        className="text-xs px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="remainder">All Remaining</option>
                                                        <option value="fixed">Max $/yr</option>
                                                        <option value="percent">Max %</option>
                                                    </select>
                                                    {limit.type === 'fixed' && (
                                                        <input
                                                            type="number"
                                                            value={limit.maxAmount || ''}
                                                            onChange={(e) => {
                                                                const newAmounts = { ...editingRule.amounts, [accId]: { ...limit, maxAmount: Number(e.target.value) } };
                                                                setEditingRule({ ...editingRule, amounts: newAmounts });
                                                            }}
                                                            placeholder="50000"
                                                            className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    )}
                                                    {limit.type === 'percent' && (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={limit.maxPercent || ''}
                                                                onChange={(e) => {
                                                                    const newAmounts = { ...editingRule.amounts, [accId]: { ...limit, maxPercent: Number(e.target.value) } };
                                                                    setEditingRule({ ...editingRule, amounts: newAmounts });
                                                                }}
                                                                placeholder="10"
                                                                className="w-14 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            />
                                                            <span className="text-xs text-gray-500">%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newSeq = editingRule.sequence.filter((_, i) => i !== idx);
                                                        setEditingRule({ ...editingRule, sequence: newSeq });
                                                    }}
                                                    className="text-red-600 hover:text-red-700 text-xs"
                                                >✕</button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Add Account Dropdown */}
                                {editingRule.sequence.length < accountTypes.length && (
                                    <div className="mt-2">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setEditingRule({
                                                        ...editingRule,
                                                        sequence: [...editingRule.sequence, e.target.value],
                                                        amounts: { ...editingRule.amounts, [e.target.value]: { type: 'remainder' } }
                                                    });
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            defaultValue=""
                                        >
                                            <option value="">+ Add Account...</option>
                                            {accountTypes.filter(a => !editingRule.sequence.includes(a.id)).map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setEditingRule(null)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => saveRule(editingRule)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                >
                                    Save Rule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
