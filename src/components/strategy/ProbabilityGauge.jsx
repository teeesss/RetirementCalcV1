import React from 'react';

/**
 * ProbabilityGauge - Circular visual showing Monte Carlo success rate
 * Uses pure CSS/SVG for a clean, animated gauge display
 */
export default function ProbabilityGauge({ successRate = 0, iterations = 0 }) {
    const percentage = Math.round(successRate * 100);

    // Calculate SVG arc path for the gauge
    const radius = 90;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (successRate * circumference);

    // Color coding based on success rate
    const getColor = (rate) => {
        if (rate >= 0.90) return 'text-green-500';
        if (rate >= 0.75) return 'text-yellow-500';
        if (rate >= 0.60) return 'text-orange-500';
        return 'text-red-500';
    };

    const getFillColor = (rate) => {
        if (rate >= 0.90) return '#10b981'; // green-500
        if (rate >= 0.75) return '#eab308'; // yellow-500
        if (rate >= 0.60) return '#f97316'; // orange-500
        return '#ef4444'; // red-500
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Probability of Success
            </h3>

            {/* Circular Gauge */}
            <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                    {/* Background circle */}
                    <circle
                        cx="96"
                        cy="96"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                    />

                    {/* Progress circle */}
                    <circle
                        cx="96"
                        cy="96"
                        r={radius}
                        stroke={getFillColor(successRate)}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-bold ${getColor(successRate)}`}>
                        {percentage}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {iterations?.toLocaleString() || 0} runs
                    </div>
                </div>
            </div>

            {/* Success Rate Interpretation */}
            <div className="mt-4 text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                    {successRate >= 0.90 && '🎯 Excellent Plan'}
                    {successRate >= 0.75 && successRate < 0.90 && '✅ Good Plan'}
                    {successRate >= 0.60 && successRate < 0.75 && '⚠️ Moderate Risk'}
                    {successRate < 0.60 && '🚨 High Risk'}
                </div>
            </div>
        </div>
    );
}
