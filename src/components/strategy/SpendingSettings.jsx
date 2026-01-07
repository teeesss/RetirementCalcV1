import NetWorthChart from '../NetWorthChart';
import CustomWithdrawalRules from './CustomWithdrawalRules';

/**
 * SpendingSettings - UI controls for dynamic spending strategies
 * Allows users to toggle between different withdrawal/spending approaches
 */
// Helper to get spending params safely
const getSpendingParams = (planData) => planData.spending || {};

export default function SpendingSettings({
    currentStrategy,
    onStrategyChange,
    guardrails,
    onGuardrailsChange,
    expenses,
    onUpdateExpenses,
    ledger,
    planData,
    onUpdatePlan
}) {
    const strategies = [
        { id: 'fixed', name: 'Fixed Dollar', description: 'Withdraw the same inflation-adjusted amount each year' },
        { id: 'percentage', name: 'Fixed %', description: 'Withdraw a fixed percentage of portfolio each year' },
        { id: 'blanchett', name: 'Blanchett Smile', description: 'U-shaped spending: high early, low middle, rises late' },
        { id: 'guardrails', name: 'Guyton-Klinger', description: 'Adjust spending based on portfolio performance' },
        { id: 'floor-ceiling', name: 'Floor & Ceiling', description: 'Percentage-based with hard min/max limits' },
        { id: 'max-spend', name: 'Max Spending', description: 'Front-load spending in early retirement years (Die With Zero)' },
        { id: 'dynamic', name: 'Dynamic Actuarial', description: 'Optimize for exactly $0 at life expectancy (ARVA Method)' }
    ];

    const spendingParams = getSpendingParams(planData);
    const updateSpendingParams = (updates) => {
        onUpdatePlan({ spending: { ...spendingParams, ...updates } });
    };

    return (
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Spending Strategy
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Choose how your retirement spending will adjust over time
                </p>

                <div className="space-y-2">
                    {strategies.map(strategy => (
                        <label
                            key={strategy.id}
                            className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${currentStrategy === strategy.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                        >
                            <input
                                type="radio"
                                name="spending-strategy"
                                value={strategy.id}
                                checked={currentStrategy === strategy.id}
                                onChange={(e) => onStrategyChange(e.target.value)}
                                className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {strategy.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {strategy.description}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Strategy Configuration Inputs */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {currentStrategy === 'fixed' && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Fixed Strategy Settings</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                Standard: Uses your &quot;Essential&quot; and &quot;Discretionary&quot; expenses adjusted for inflation.
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                <span>Calculated Base Spend:</span>
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                    ${((expenses?.essentialMonthly || 0) + (expenses?.discretionaryMonthly || 0)) * 12} / yr
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Override Base Annual Spend ($)
                            </label>
                            <input
                                type="number"
                                placeholder="Leave empty to use calculated amount"
                                value={spendingParams.fixedAmount || ''}
                                onChange={(e) => updateSpendingParams({ fixedAmount: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                step="1000"
                            />
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                If set, this amount replaces the calculated spend (adjusted for inflation).
                            </p>
                        </div>
                    </div>
                )}

                {currentStrategy === 'percentage' && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Fixed Percentage Settings</h4>
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Annual Withdrawal Rate (%)
                            </label>
                            <input
                                type="number"
                                value={(spendingParams.percentageRate || 0.04) * 100}
                                onChange={(e) => updateSpendingParams({ percentageRate: Number(e.target.value) / 100 })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                step="0.1"
                                min="0.1"
                                max="20"
                            />
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                Percentage of portfolio balance withdrawn each year.
                            </p>
                        </div>
                    </div>
                )}

                {currentStrategy === 'guardrails' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Floor (%)</label>
                            <input
                                type="number"
                                value={(guardrails?.floorPercent || 0.85) * 100}
                                onChange={(e) => onGuardrailsChange({ ...guardrails, floorPercent: Number(e.target.value) / 100 })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ceiling (%)</label>
                            <input
                                type="number"
                                value={(guardrails?.ceilingPercent || 1.20) * 100}
                                onChange={(e) => onGuardrailsChange({ ...guardrails, ceilingPercent: Number(e.target.value) / 100 })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Adjustment (%)</label>
                            <input
                                type="number"
                                value={(guardrails?.adjustmentRate || 0.10) * 100}
                                onChange={(e) => onGuardrailsChange({ ...guardrails, adjustmentRate: Number(e.target.value) / 100 })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            />
                        </div>
                    </div>
                )}

                {currentStrategy === 'floor-ceiling' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Rate (%)</label>
                            <input
                                type="number"
                                value={(spendingParams.percentageRate || 0.04) * 100}
                                onChange={(e) => updateSpendingParams({ percentageRate: Number(e.target.value) / 100 })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                step="0.1"
                                min="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Floor ($)</label>
                            <input
                                type="number"
                                value={spendingParams.floorAmount || 50000}
                                onChange={(e) => updateSpendingParams({ floorAmount: Number(e.target.value) })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                step="1000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ceiling ($)</label>
                            <input
                                type="number"
                                value={spendingParams.ceilingAmount || 200000}
                                onChange={(e) => updateSpendingParams({ ceilingAmount: Number(e.target.value) })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                step="1000"
                            />
                        </div>
                    </div>
                )}

                {currentStrategy === 'max-spend' && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg space-y-4 border border-amber-100 dark:border-amber-900/30">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Max Spending Settings</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Maximize spending during your &quot;Go-Go&quot; years (the Window). Spending will deplete the portfolio down to your Legacy Goal by the End Age.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Age</label>
                                <input
                                    type="number"
                                    placeholder="Retirement Age"
                                    value={spendingParams.maxSpendStart || ''}
                                    onChange={(e) => updateSpendingParams({ maxSpendStart: Number(e.target.value) })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Age (Window Close)</label>
                                <input
                                    type="number"
                                    value={spendingParams.maxSpendEnd || 75}
                                    onChange={(e) => updateSpendingParams({ maxSpendEnd: Number(e.target.value) })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Legacy Goal ($)</label>
                                <input
                                    type="number"
                                    value={spendingParams.maxSpendLegacy || 0}
                                    onChange={(e) => updateSpendingParams({ maxSpendLegacy: Number(e.target.value) })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    step="10000"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStrategy === 'dynamic' && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Dynamic Actuarial Strategy</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            This strategy calculates the maximum safe annual spend by dividing your current portfolio by your remaining life expectancy each year (Actuarial Method). This ensures you never run out of money, though spending varies annually.
                        </p>
                    </div>
                )}
            </div>

            {/* Charity Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Philanthropy & Gifting</h4>
                <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Annual Charitable Intent ($)</label>
                    <input
                        type="number"
                        value={expenses?.charity || 0}
                        onChange={(e) => onUpdateExpenses && onUpdateExpenses({ ...expenses, charity: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        min="0"
                        step="1000"
                    />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        Entered amount is adjusted for inflation. For ages 70.5+, this is satisfied via QCDs.
                    </p>
                </div>
            </div>

            {/* Custom Withdrawal Rules */}
            <CustomWithdrawalRules />

            {/* Projection Chart */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                    <div className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</div>
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> The chart below shows the projected Net Worth based on the selected strategy.
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 h-64">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Projected Impact</h4>
                    {ledger && ledger.length > 0 ? (
                        <NetWorthChart ledger={ledger} darkMode={false} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center">
                            Run simulation to view projection
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
