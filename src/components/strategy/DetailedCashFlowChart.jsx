import { useRef, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import defaultProfile from '../../data/defaultProfile.json';
import { getStripePattern } from '../../utils/chartPatterns';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

/**
 * DetailedCashFlowChart - Comprehensive visualization of all financial flows
 *
 * Stacks inputs (Sources) and outputs (Uses).
 *
 * Sources (Positive):
 * - Salary, SS, Pension, RMD
 * - Drawdowns (Trad, Roth, Brok, Crypto, HSA, Cash)
 *
 * Uses (Negative):
 * - Expenses (Essential, Disc, Health, Housing)
 * - Liability (Mortgage)
 * - Taxes (Fed, State, FICA)
 *
 * Overlay:
 * - Real Estate Appreciation (Line)
 */
export default function DetailedCashFlowChart({ ledger, darkMode = false }) {
    const colors = defaultProfile.uiTheme?.colors || {};
    const chartData = useMemo(() => {
        if (!ledger || ledger.length === 0) return null;

        const labels = ledger.map(entry => `Age ${entry.age}`);

        const cf = ledger.map(entry => entry.metrics?.detailedCashFlow);

        // Helper to get array of values for a key path
        const get = (keyPath) => cf.map(item => {
            if (!item) return 0;
            const keys = keyPath.split('.');
            let val = item;
            for (const k of keys) val = val?.[k];
            return val || 0;
        });

        // Helper to get negative array
        const getNeg = (keyPath) => get(keyPath).map(v => -v);

        // Real Estate Appreciation (Derived from Ledger Real Estate Value diff)
        // Note: Ledger has totalRealEstateValue in netWorth calc, but maybe not explicit diff?
        // We can approximate or calculate it on the fly.
        // Or better: Use `metrics.yearlyAssetGrowth` - `net flows`? No.
        // Let's calculate from balance changes if we can, or just omit if not robust.
        // User asked for it. We have `balances.realEstate`.
        const reValues = ledger.map(entry => entry.balances?.realEstate || 0);
        const reAppreciation = reValues.map((val, i) => {
            if (i === 0) return 0;
            return Math.max(0, val - reValues[i - 1]); // Simple diff, assumes no purchases/sales for now
        });


        const allDatasets = [
            // --- SOURCES (Stacked Positive) ---
            {
                label: 'Salary',
                data: get('inflows.salary'),
                backgroundColor: colors.salary,
                stack: 'stack0',
            },
            {
                label: 'Social Security',
                data: get('inflows.socialSecurity'),
                backgroundColor: colors.socialSecurity,
                borderColor: colors.socialSecurity,
                borderWidth: 1,
                stack: 'stack0',
                // Use circle point style for legend
                pointStyle: 'circle'
            },
            {
                label: 'Other Income (Pension)',
                data: get('inflows.pension'),
                backgroundColor: colors.pension,
                stack: 'stack0',
            },
            {
                label: 'RMD',
                data: get('inflows.rmd'),
                backgroundColor: colors.rmd,
                stack: 'stack0',
            },
            // Drawdowns
            {
                label: 'Traditional W/D',
                data: get('drawdowns.traditional'),
                backgroundColor: getStripePattern(colors.traditional, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.traditional,
                borderWidth: 1,
                stack: 'stack0',
            },
            {
                label: 'Roth W/D',
                data: get('drawdowns.roth'),
                backgroundColor: getStripePattern(colors.roth, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.roth,
                borderWidth: 1,
                stack: 'stack0',
            },
            {
                label: 'Brokerage W/D',
                data: get('drawdowns.brokerage'),
                backgroundColor: getStripePattern(colors.brokerage, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.brokerage,
                borderWidth: 1,
                stack: 'stack0',
            },
            {
                label: 'Crypto W/D',
                data: get('drawdowns.crypto'),
                backgroundColor: getStripePattern(colors.crypto, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.crypto,
                borderWidth: 1,
                stack: 'stack0',
            },
            {
                label: 'HSA W/D',
                data: get('drawdowns.hsa'),
                backgroundColor: getStripePattern(colors.hsa, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.hsa,
                borderWidth: 1,
                stack: 'stack0',
            },
            {
                label: 'Cash W/D',
                data: get('drawdowns.cash'),
                backgroundColor: getStripePattern(colors.cash, 'rgba(255, 255, 255, 0.2)'),
                borderColor: colors.cash,
                borderWidth: 1,
                stack: 'stack0',
            },

            // --- USES (Stacked Negative) ---
            {
                label: 'Taxes (Fed)',
                data: getNeg('outflows.taxes.federal'),
                backgroundColor: colors.taxFederal,
                stack: 'stack0',
            },
            {
                label: 'Taxes (State)',
                data: getNeg('outflows.taxes.state'),
                backgroundColor: colors.taxState,
                stack: 'stack0',
            },
            {
                label: 'FICA',
                data: getNeg('outflows.taxes.fica'),
                backgroundColor: colors.taxFica,
                stack: 'stack0',
            },
            {
                label: 'Essential Exp',
                data: getNeg('outflows.essential'),
                backgroundColor: colors.essential,
                stack: 'stack0',
            },
            {
                label: 'Discretionary Exp',
                data: getNeg('outflows.discretionary'),
                backgroundColor: colors.discretionary,
                stack: 'stack0',
            },
            {
                label: 'Health/Insurance',
                data: getNeg('outflows.healthcare'),
                backgroundColor: colors.healthcare,
                stack: 'stack0',
            },
            {
                label: 'Property Tax & Ins (+ Maint)',
                data: getNeg('outflows.housing'),
                backgroundColor: colors.housing,
                stack: 'stack0',
            },
            {
                label: 'Mortgage',
                data: getNeg('outflows.mortgage'),
                backgroundColor: colors.mortgage,
                stack: 'stack0',
            },

            // --- LINE OVERLAYS ---
            // Removed RE Appreciation per user feedback (confusing in Cash Flow context)
        ]; // Close allDatasets array

        // Filter out empty datasets to clean up the legend
        const nonEmptyDatasets = allDatasets.filter(ds => {
            const total = ds.data.reduce((acc, val) => acc + Math.abs(val), 0);
            return total > 0;
        });

        return {
            labels,
            datasets: nonEmptyDatasets
        };
    }, [ledger]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: darkMode ? '#d1d5db' : '#374151',
                    usePointStyle: true,
                    padding: 15,
                    font: { size: 11 }
                }
            },
            tooltip: {
                backgroundColor: darkMode ? defaultProfile.uiTheme.tooltip.backgroundColor.dark : defaultProfile.uiTheme.tooltip.backgroundColor.light,
                titleColor: darkMode ? defaultProfile.uiTheme.tooltip.titleColor.dark : defaultProfile.uiTheme.tooltip.titleColor.light,
                bodyColor: darkMode ? defaultProfile.uiTheme.tooltip.bodyColor.dark : defaultProfile.uiTheme.tooltip.bodyColor.light,
                borderColor: darkMode ? defaultProfile.uiTheme.tooltip.borderColor.dark : defaultProfile.uiTheme.tooltip.borderColor.light,
                borderWidth: defaultProfile.uiTheme.tooltip.borderWidth,
                padding: defaultProfile.uiTheme.tooltip.padding,
                titleFont: defaultProfile.uiTheme.tooltip.titleFont,
                bodyFont: defaultProfile.uiTheme.tooltip.bodyFont,
                displayColors: defaultProfile.uiTheme.tooltip.displayColors,
                boxPadding: defaultProfile.uiTheme.tooltip.boxPadding,
                filter: function (tooltipItem) {
                    // Only show items with non-zero values
                    return Math.abs(tooltipItem.raw) > 0.01;
                },
                itemSort: (a, b) => {
                    const aVal = a.raw;
                    const bVal = b.raw;

                    // Both positive or both negative: sort by absolute value descending
                    if ((aVal >= 0 && bVal >= 0) || (aVal < 0 && bVal < 0)) {
                        return Math.abs(bVal) - Math.abs(aVal);
                    }
                    // One positive, one negative: positive first
                    return bVal - aVal;
                },
                callbacks: {
                    title: (ctx) => `Age ${ctx[0].label}`,
                    label: (ctx) => {
                        const label = ctx.dataset.label || '';
                        const value = ctx.parsed.y;
                        return `${label}: ${formatCurrency(value)}`;
                    },
                    afterBody: function (tooltipItems) {
                        if (!tooltipItems || tooltipItems.length === 0) return [];

                        // Calculate totals from the tooltip items
                        let totalIn = 0;
                        let totalOut = 0;

                        tooltipItems.forEach(item => {
                            if (item.raw > 0) {
                                totalIn += item.raw;
                            } else if (item.raw < 0) {
                                totalOut += Math.abs(item.raw);
                            }
                        });

                        const netFlow = totalIn - totalOut;

                        return [
                            '─────────────────────────',
                            `💵 Total In: ${formatCurrency(totalIn)}`,
                            `📉 Total Out: ${formatCurrency(totalOut)}`,
                            '─────────────────────────',
                            `📊 Net Flow: ${netFlow >= 0 ? '+' : ''}${formatCurrency(netFlow)}`
                        ];
                    }
                }
            },
            title: {
                display: true,
                text: 'Detailed Cash Flow Analysis (Inflows vs Outflows)',
                color: darkMode ? '#d1d5db' : '#374151',
                font: { size: 14, weight: 'bold' }
            }
        },
        scales: {
            y: {
                stacked: true,
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Annual Cash Flow ($)',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { size: 10 },
                    // Force standard formatting to show negative signs as requested
                    callback: (value) => {
                        const abs = Math.abs(value);
                        if (abs >= 1000000) return (value < 0 ? '-' : '') + '$' + (abs / 1000000).toFixed(1) + 'm';
                        return (value < 0 ? '-' : '') + '$' + (abs / 1000).toFixed(0) + 'k';
                    }
                },
                grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)',
                    zeroLineColor: darkMode ? '#9ca3af' : '#4b5563',
                    zeroLineWidth: 2
                }
            },
            y1: {
                stacked: true,
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Annual Cash Flow ($)',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { size: 10 },
                    callback: (value) => {
                        const abs = Math.abs(value);
                        if (abs >= 1000000) return (value < 0 ? '-' : '') + '$' + (abs / 1000000).toFixed(1) + 'm';
                        return (value < 0 ? '-' : '') + '$' + (abs / 1000).toFixed(0) + 'k';
                    }
                },
                grid: {
                    drawOnChartArea: false
                },
                // Link to y axis to mirror its scale
                min: function (context) {
                    const yScale = context.chart.scales.y;
                    return yScale ? yScale.min : undefined;
                },
                max: function (context) {
                    const yScale = context.chart.scales.y;
                    return yScale ? yScale.max : undefined;
                }
            },
            x: {
                stacked: true,
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { size: 9 },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    display: false
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        }
    };

    if (!chartData) return null;

    return (
        <div className="w-full h-full p-2">
            <Bar data={chartData} options={options} />
        </div>
    );
}
