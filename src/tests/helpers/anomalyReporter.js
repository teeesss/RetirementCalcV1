/**
 * Anomaly Reporter for Financial Test Suite
 *
 * Structured reporting of anomalies that don't necessarily fail tests
 * but warrant investigation or tracking over time.
 */

const anomalies = [];

/**
 * Severity levels for anomalies
 */
export const SEVERITY = {
    INFO: 'info',       // Informational, no action needed
    WARN: 'warn',       // Worth noting, may need attention
    ERROR: 'error',     // Likely a bug, should be investigated
    CRITICAL: 'critical' // Definitely a bug or serious issue
};

/**
 * Report an anomaly
 * @param {Object} anomaly - Anomaly details
 * @param {string} anomaly.type - Type of anomaly (e.g., 'discontinuity', 'spike', 'negative_balance')
 * @param {string} anomaly.severity - Severity level
 * @param {string} anomaly.testName - Name of test that detected it
 * @param {string} anomaly.description - Human-readable description
 * @param {Object} anomaly.data - Relevant data (year, values, etc.)
 * @param {string} anomaly.suggestedAction - What should be done about it
 */
export function reportAnomaly({ type, severity, testName, description, data, suggestedAction }) {
    const anomaly = {
        timestamp: new Date().toISOString(),
        type,
        severity,
        testName,
        description,
        data,
        suggestedAction
    };

    anomalies.push(anomaly);

    // Also log to console for immediate visibility
    const prefix = severity === SEVERITY.CRITICAL ? '🚨' :
        severity === SEVERITY.ERROR ? '❌' :
            severity === SEVERITY.WARN ? '⚠️' : 'ℹ️';

    console.warn(`${prefix} ANOMALY [${type}]: ${description}`);
    if (data) {
        console.warn('  Data:', JSON.stringify(data, null, 2));
    }
    if (suggestedAction) {
        console.warn(`  → ${suggestedAction}`);
    }
}

/**
 * Get all reported anomalies
 */
export function getAnomalies() {
    return [...anomalies];
}

/**
 * Get anomalies by severity
 */
export function getAnomaliesBySeverity(severity) {
    return anomalies.filter(a => a.severity === severity);
}

/**
 * Clear all anomalies (call at start of each test run)
 */
export function clearAnomalies() {
    anomalies.length = 0;
}

/**
 * Export anomalies to JSON file (for CI/CD artifacts)
 */
export function exportAnomalies() {
    return {
        runDate: new Date().toISOString(),
        totalCount: anomalies.length,
        bySeverity: {
            critical: getAnomaliesBySeverity(SEVERITY.CRITICAL).length,
            error: getAnomaliesBySeverity(SEVERITY.ERROR).length,
            warn: getAnomaliesBySeverity(SEVERITY.WARN).length,
            info: getAnomaliesBySeverity(SEVERITY.INFO).length
        },
        anomalies: getAnomalies()
    };
}

/**
 * Check if there are any critical/error anomalies
 * Tests can use this to decide whether to fail
 */
export function hasCriticalAnomalies() {
    return getAnomaliesBySeverity(SEVERITY.CRITICAL).length > 0 ||
        getAnomaliesBySeverity(SEVERITY.ERROR).length > 0;
}

/**
 * Common anomaly detection helpers
 */

/**
 * Detect sudden spikes in a time series
 * @param {Array} values - Array of values over time
 * @param {number} threshold - Multiplier threshold (e.g., 3 for 3x increase)
 * @returns {Array} - Array of indices where spikes occur
 */
export function detectSpikes(values, threshold = 3) {
    const spikes = [];

    for (let i = 1; i < values.length; i++) {
        const prev = values[i - 1];
        const curr = values[i];

        if (prev > 0 && curr > prev * threshold) {
            spikes.push({
                index: i,
                previousValue: prev,
                currentValue: curr,
                multiple: curr / prev
            });
        }
    }

    return spikes;
}

/**
 * Detect negative values (usually indicates an error)
 * @param {Object} obj - Object to check (recursively)
 * @param {string} path - Current path (for error messages)
 * @returns {Array} - Array of paths where negative values found
 */
export function detectNegativeValues(obj, path = '') {
    const negatives = [];

    for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'number') {
            if (value < 0) {
                negatives.push({
                    path: currentPath,
                    value
                });
            }
        } else if (typeof value === 'object' && value !== null) {
            negatives.push(...detectNegativeValues(value, currentPath));
        }
    }

    return negatives;
}

/**
 * Detect NaN or Infinity values
 * @param {Object} obj - Object to check
 * @param {string} path - Current path
 * @returns {Array} - Array of paths with invalid values
 */
export function detectInvalidNumbers(obj, path = '') {
    const invalid = [];

    for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                invalid.push({
                    path: currentPath,
                    value,
                    type: Number.isNaN(value) ? 'NaN' : 'Infinity'
                });
            }
        } else if (typeof value === 'object' && value !== null) {
            invalid.push(...detectInvalidNumbers(value, currentPath));
        }
    }

    return invalid;
}
