/**
 * Global Currency Formatter
 * Rounds to nearest integer (no cents) for cleaner UI.
 */
export function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    // Round to nearest dollar (no cents)
    const rounded = Math.round(abs);
    return `${sign}$${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCompactCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);

    // Use M for millions, K for thousands, round to nearest dollar
    if (abs >= 1000000) {
        return `${sign}${(abs / 1000000).toFixed(1)}m`;
    } else if (abs >= 1000) {
        return `${sign}${(abs / 1000).toFixed(0)}k`;
    }
    return `${sign}$${Math.round(abs)}`;
}

export const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        maximumFractionDigits: 1
    }).format(value / 100);
};
