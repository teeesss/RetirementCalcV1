import { useMemo } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import { FEDERAL_BRACKETS } from '../../lib/taxEngine';

/**
 * TaxBracketHeatmap - Visualizes tax bracket utilization over time
 * Shows which tax brackets are filled and how much "room" is left in the current highest bracket.
 */
export default function TaxBracketHeatmap({ darkMode = false }) {
    const { ledger, planData } = usePlan();

    // Get brackets for the current filing status (using first year's status or profile default)
    // Assuming status doesn't change for now, or we check year-by-year if we were advanced.
    const filingStatus = planData.profile?.filingStatus || 'married';
    const brackets = FEDERAL_BRACKETS[filingStatus] || FEDERAL_BRACKETS.single;

    // Process data for the heatmap
    const heatmapData = useMemo(() => {
        if (!ledger) return [];
        const inflationRate = planData?.assumptions?.inflation || 3.0;

        return ledger.map((year, index) => {
            const taxableIncome = year.taxes.taxableIncome || 0;
            const marginalRate = year.taxes.marginalRate || 0;

            // Adjust brackets for inflation
            const inflationFactor = Math.pow(1 + inflationRate / 100, index);
            const currentYearBrackets = brackets.map(([rate, limit]) => [rate, limit * inflationFactor]);

            // Determine which brackets are filled
            // For each bracket, we calculate % filled
            const bracketStatus = currentYearBrackets.map(([rate, limit], bIndex) => {
                const prevLimit = bIndex === 0 ? 0 : currentYearBrackets[bIndex - 1][1];
                const bracketSize = limit - prevLimit;

                let filledAmount = 0;
                let isFull = false;
                let isCurrent = false;

                if (taxableIncome > limit) {
                    filledAmount = bracketSize;
                    isFull = true;
                } else if (taxableIncome > prevLimit) {
                    filledAmount = taxableIncome - prevLimit;
                    isCurrent = true;
                }

                return {
                    rate,
                    limit,
                    prevLimit,
                    filledAmount,
                    isFull,
                    isCurrent,
                    fillPercentage: Math.min(100, (filledAmount / bracketSize) * 100)
                };
            });

            // Calculate "Green Room" (Headroom to next cliff)
            // If strictly inside a bracket, room is (limit - taxableIncome)
            // If at top bracket, room is Infinity
            let currentBracketIndex = bracketStatus.findIndex(b => b.isCurrent);
            if (currentBracketIndex === -1 && taxableIncome > 0) {
                // If income > max limit, we are in top bracket
                if (taxableIncome > currentYearBrackets[currentYearBrackets.length - 1][1]) {
                    currentBracketIndex = currentYearBrackets.length - 1;
                }
            }
            if (currentBracketIndex === -1) currentBracketIndex = 0; // Income 0

            const currentBracket = bracketStatus[currentBracketIndex];
            const roomToNext = currentBracket ? (currentBracket.limit - taxableIncome) : 0;

            return {
                year: year.year,
                age: year.age,
                taxableIncome,
                bracketStatus,
                currentRate: marginalRate,
                roomToNext
            };
        });
    }, [ledger, brackets, planData]);

    if (!ledger || ledger.length === 0) return null;

    // Fixed colors for brackets (Green -> Red)
    // 10, 12, 22, 24, 32, 35, 37
    const getBracketColor = (rate, isFilled, isCurrent) => {
        if (!isFilled && !isCurrent) return darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.5)'; // Empty

        // Base colors for rates
        const colors = {
            0.10: 'bg-green-400',
            0.12: 'bg-green-500',
            0.22: 'bg-blue-400',
            0.24: 'bg-blue-600',
            0.32: 'bg-yellow-500',
            0.35: 'bg-orange-500',
            0.37: 'bg-red-600'
        };

        return colors[rate] || 'bg-gray-400';
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Tax Bracket Heatmap (Green Room Analysis)</h3>

            <div className="min-w-[800px]">
                {/* Grid Layout */}
                <div className="flex">
                    {/* Y-Axis Labels (Tax Rates) - Reversed order (Top bracket at top) */}
                    <div className="flex flex-col-reverse justify-center mr-2 pb-6 space-y-1 space-y-reverse">
                        {brackets.map(([rate]) => (
                            <div key={rate} className="h-8 flex items-center justify-end text-xs font-mono text-gray-500">
                                {(rate * 100).toFixed(0)}%
                            </div>
                        ))}
                    </div>

                    {/* Columns (Years) */}
                    <div className="flex-1 flex space-x-1 items-end pb-6 overflow-x-auto">
                        {heatmapData.map((data) => (
                            <div key={data.year} className="flex flex-col-reverse space-y-1 space-y-reverse group relative">
                                {/* Year Label (Bottom) */}
                                <div className="absolute -bottom-6 w-full text-center text-[10px] text-gray-500 dark:text-gray-400 transform -rotate-0 text-xs font-medium">
                                    {data.age}
                                </div>

                                {/* Hover Tooltip */}
                                <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none border border-gray-700">
                                    <div className="font-bold text-sm mb-2 border-b border-gray-700 pb-1">Age {data.age} Breakdown</div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Taxable Income:</span>
                                            <span className="font-mono font-bold">${Math.round(data.taxableIncome).toLocaleString()}</span>
                                        </div>

                                        <div className="border-t border-gray-700 pt-1 mt-1">
                                            <div className="text-gray-400 mb-1 text-[10px] uppercase tracking-wider">Bracket Utilization</div>
                                            {data.bracketStatus.map((b, i) => (
                                                <div key={i} className="flex justify-between items-center text-[10px]">
                                                    <div className="flex items-center">
                                                        <span className={`w-2 h-2 rounded-full mr-1 ${b.isFull ? 'bg-green-500' : b.isCurrent ? 'bg-blue-400' : 'bg-gray-600'}`}></span>
                                                        <span className="text-gray-300">{(b.rate * 100).toFixed(0)}% Bracket:</span>
                                                    </div>
                                                    <span className={b.isFull ? 'text-green-400' : b.isCurrent ? 'text-blue-300' : 'text-gray-600'}>
                                                        {b.isFull ? 'Full' : b.isCurrent ? `${Math.round(b.fillPercentage)}% Filled` : 'Empty'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {data.roomToNext > 0 && (
                                            <div className="mt-2 p-2 bg-blue-900/30 rounded border border-blue-800/50">
                                                <div className="text-green-400 font-bold mb-0.5">Green Room: ${Math.round(data.roomToNext).toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-400 leading-tight">
                                                    You can recognize this much more income before hitting the next tax rate.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stacked Bracket Cells */}
                                {data.bracketStatus.map((b, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-8 rounded-sm transition-all duration-200 ${getBracketColor(b.rate, b.isFull, b.isCurrent)} ${b.isCurrent ? 'border-2 border-white dark:border-gray-600' : ''}`}
                                        style={{
                                            opacity: b.isFull ? 1 : b.isCurrent ? 0.8 : 0.2,
                                            height: '32px' // Fixed height for grid alignment
                                        }}
                                    >
                                        {/* Show fill level for current bracket? */}
                                        {b.isCurrent && (
                                            <div
                                                className="bg-white dark:bg-gray-900 w-full absolute bottom-0 opacity-20"
                                                style={{ height: `${100 - b.fillPercentage}%` }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-8 flex justify-center space-x-4 text-xs">
                    <div className="flex items-center"><span className="w-3 h-3 bg-green-500 mr-1 rounded"></span> Low Tax (10-12%)</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 mr-1 rounded"></span> Mid Tax (22-24%)</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-red-600 mr-1 rounded"></span> High Tax (32%+)</div>
                    <div className="flex items-center ml-4 text-gray-500">
                        <span className="w-3 h-3 border-2 border-gray-400 mr-1 rounded"></span> Current Marginal Bracket
                    </div>
                </div>
            </div>
        </div>
    );
}
