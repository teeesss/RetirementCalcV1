/**
 * Standardized Chart.js Configuration Utilities
 *
 * Provides consistent tooltip formatting, Y-axis configuration,
 * and interaction patterns across all charts in the application.
 */

import { formatCurrency } from './formatters';

/**
 * Standard tooltip configuration for Chart.js
 * Uses consistent formatting for currency values
 */
export const getStandardTooltipConfig = (darkMode = false) => ({
    backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    titleColor: darkMode ? '#e5e7eb' : '#374151',
    bodyColor: darkMode ? '#d1d5db' : '#6b7280',
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
    borderWidth: 1,
    padding: 12,
    displayColors: true,
    callbacks: {
        label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                // Format as currency if value > 1000, otherwise as percentage
                if (Math.abs(context.parsed.y) > 100) {
                    label += formatCurrency(context.parsed.y);
                } else {
                    label += context.parsed.y.toFixed(1) + '%';
                }
            }
            return label;
        }
    }
});

/**
 * Standard Y-axis configuration with optional right-side mirror
 * @param {Object} options - Configuration options
 * @param {boolean} options.darkMode - Dark mode enabled
 * @param {string} options.title - Axis title
 * @param {boolean} options.mirror - Add mirrored axis on right
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.isCurrency - Format ticks as currency
 */
export const getStandardYAxisConfig = ({
    darkMode = false,
    title = '',
    mirror = true,
    min,
    max,
    isCurrency = true
} = {}) => {
    const baseConfig = {
        position: 'left',
        title: {
            display: !!title,
            text: title,
            color: darkMode ? '#9ca3af' : '#6b7280'
        },
        ticks: {
            color: darkMode ? '#9ca3af' : '#6b7280',
            callback: function (value) {
                if (isCurrency) {
                    return formatCurrency(value);
                }
                return value.toFixed(1) + '%';
            }
        },
        grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
    };

    if (min !== undefined) baseConfig.min = min;
    if (max !== undefined) baseConfig.max = max;

    if (!mirror) {
        return { y: baseConfig };
    }

    // Create mirrored right axis
    const rightConfig = {
        ...baseConfig,
        position: 'right',
        grid: { drawOnChartArea: false } // Don't redraw grid lines
    };

    return {
        y: baseConfig,
        y1: rightConfig
    };
};

/**
 * Standard X-axis configuration
 */
export const getStandardXAxisConfig = ({ darkMode = false, title = '' } = {}) => ({
    title: {
        display: !!title,
        text: title,
        color: darkMode ? '#9ca3af' : '#6b7280'
    },
    ticks: {
        color: darkMode ? '#9ca3af' : '#6b7280',
        maxTicksLimit: 10
    },
    grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
});

/**
 * Standard interaction configuration for all charts
 */
export const getStandardInteraction = () => ({
    mode: 'index',
    intersect: false
});

/**
 * Complete standard chart options
 * Combines all standard configurations
 */
export const getStandardChartOptions = ({
    darkMode = false,
    title = '',
    yAxisTitle = '',
    xAxisTitle = '',
    mirrorYAxis = true,
    yMin,
    yMax,
    isCurrency = true,
    maintainAspectRatio = true
} = {}) => ({
    responsive: true,
    maintainAspectRatio,
    interaction: getStandardInteraction(),
    plugins: {
        legend: {
            position: 'top',
            labels: { color: darkMode ? '#e5e7eb' : '#374151' }
        },
        title: {
            display: !!title,
            text: title,
            color: darkMode ? '#e5e7eb' : '#374151'
        },
        tooltip: getStandardTooltipConfig(darkMode)
    },
    scales: {
        ...getStandardYAxisConfig({
            darkMode,
            title: yAxisTitle,
            mirror: mirrorYAxis,
            min: yMin,
            max: yMax,
            isCurrency
        }),
        x: getStandardXAxisConfig({ darkMode, title: xAxisTitle })
    }
});
