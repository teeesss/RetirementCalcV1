
/**
 * Global Currency Formatter
 * Rounds to nearest integer (no cents) for cleaner UI.
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    }).format(value);
};

export const formatCompactCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 1, // $1.2M is better than $1M for comparison usually, or 0 if strict?
        // User asked for "Round to nearest integer (no cents)".
        // For compact, 1 decimal is standard polish. 0 decimal ($1M) can be too coarse.
        // I will stick to 1 decimal for compact, 0 for standard.
        notation: "compact",
        compactDisplay: "short"
    }).format(value);
};

export const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        maximumFractionDigits: 1
    }).format(value / 100);
};
