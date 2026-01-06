import React, { useState, useEffect } from 'react';
import { calculateBreakEvenRate } from '../../lib/financialMetrics';
import { usePlan } from '../../contexts/PlanContext';

export default function RothBreakEvenCalculator({ darkMode }) {
    const { planData } = usePlan();

    // State for inputs
    const [conversionAmount, setConversionAmount] = useState(10000);
    const [currentTaxRate, setCurrentTaxRate] = useState(24);
    const [yearsToGrowth, setYearsToGrowth] = useState(20);
    const [growthRate, setGrowthRate] = useState(7);
    const [capGainsRate, setCapGainsRate] = useState(15);

    const [breakEvenRate, setBreakEvenRate] = useState(0);

    // Calculate on change
    useEffect(() => {
        const rate = calculateBreakEvenRate({
            conversionAmount,
            currentTaxCost: conversionAmount * (currentTaxRate / 100),
            yearsToGrowth,
            growthRate: growthRate / 100,
            capitalGainsRate: capGainsRate / 100
        });
        setBreakEvenRate(rate * 100);
    }, [conversionAmount, currentTaxRate, yearsToGrowth, growthRate, capGainsRate]);

    const isFavorable = breakEvenRate < currentTaxRate;

    return (
        <div className={`p-4 rounded-lg border flex flex-col gap-4 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-purple-50 border-purple-100'}`}>
            <div className="flex justify-between items-center">
                <h3 className={`text-sm font-bold ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                    🧪 Roth Break-Even Lab
                </h3>
                <span className="text-xs text-gray-500">Solve for Future Tax Rate</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Conversion Amount</label>
                    <div className="relative">
                        <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                        <input
                            type="number"
                            className={`w-full p-1 pl-4 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            value={conversionAmount}
                            onChange={e => setConversionAmount(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Current Tax Rate</label>
                    <div className="relative">
                        <input
                            type="number"
                            className={`w-full p-1 pr-4 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            value={currentTaxRate}
                            onChange={e => setCurrentTaxRate(Number(e.target.value))}
                        />
                        <span className="absolute right-2 top-1 text-gray-500 text-xs">%</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Years to Grow</label>
                    <input
                        type="number"
                        className={`w-full p-1 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        value={yearsToGrowth}
                        onChange={e => setYearsToGrowth(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Growth Rate</label>
                    <div className="relative">
                        <input
                            type="number"
                            className={`w-full p-1 pr-4 rounded text-xs border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            value={growthRate}
                            onChange={e => setGrowthRate(Number(e.target.value))}
                        />
                        <span className="absolute right-2 top-1 text-gray-500 text-xs">%</span>
                    </div>
                </div>
            </div>

            <div className={`p-3 rounded border text-center ${isFavorable ? 'bg-green-100 border-green-200 text-green-800' : 'bg-yellow-100 border-yellow-200 text-yellow-800'}`}>
                <div className="text-xs opacity-70 mb-1">Break-Even Future Tax Rate</div>
                <div className="text-2xl font-bold">{breakEvenRate.toFixed(1)}%</div>
                <div className="text-[10px] leading-tight mt-1">
                    {isFavorable
                        ? "✅ Convert! paying from outside funds beats holding."
                        : "⚠️ Caution. You need high future taxes to justify this."
                    }
                </div>
            </div>

            <p className="text-[10px] text-gray-400 italic">
                *Assumes taxes paid from 15% cap-gains brokerage account.
            </p>
        </div>
    );
}
