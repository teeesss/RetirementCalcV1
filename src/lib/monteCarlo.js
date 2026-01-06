/**
 * Monte Carlo Simulation Engine
 *
 * Implements multi-asset Monte Carlo simulation with correlation matrix
 * for retirement planning. Supports configurable iterations, asset classes,
 * and correlation between assets.
 *
 * @module monteCarlo
 */

/**
 * Generate correlated random returns using Cholesky decomposition
 * @param {number[][]} correlationMatrix - Correlation matrix (must be positive definite)
 * @returns {number[]} Array of correlated random returns (standard normal)
 */
function generateCorrelatedReturns(correlationMatrix) {
  const n = correlationMatrix.length;

  // Cholesky decomposition (simplified for 2x2 case)
  // For larger matrices, use a proper Cholesky library
  if (n === 2) {
    const b = correlationMatrix[0][1]; // Correlation coefficient
    const z1 = generateStandardNormal();
    const z2 = generateStandardNormal();

    // Cholesky: L = [[1, 0], [b, sqrt(1-b^2)]]
    // y1 = z1
    // y2 = b*z1 + sqrt(1-b^2)*z2

    return [
      z1,
      b * z1 + Math.sqrt(1 - b * b) * z2
    ];
  }

  // Fallback: independent returns
  return correlationMatrix.map(() => generateStandardNormal());
}

/**
 * Generate a standard normal random variable (Box-Muller transform)
 * @returns {number} Standard normal random variable
 */
function generateStandardNormal() {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Run a single Monte Carlo simulation year
 * @param {Object} params - Simulation parameters
 * @param {number} params.equityReturn - Expected equity return (μ)
 * @param {number} params.equityVolatility - Equity volatility (σ)
 * @param {number} params.cryptoReturn - Expected crypto return (μ)
 * @param {number} params.cryptoVolatility - Crypto volatility (σ)
 * @param {number} params.correlation - Correlation between equity and crypto
 * @returns {Object} {equityReturn, cryptoReturn}
 */
function simulateYear({ equityReturn, equityVolatility, cryptoReturn, cryptoVolatility, correlation }) {
  // Correlation matrix (2x2)
  const corrMatrix = [
    [1, correlation],
    [correlation, 1]
  ];

  const [z1, z2] = generateCorrelatedReturns(corrMatrix);

  // Apply returns: r = μ + σ * z
  return {
    equityReturn: equityReturn + equityVolatility * z1,
    cryptoReturn: cryptoReturn + cryptoVolatility * z2
  };
}

/**
 * Run a full Monte Carlo simulation for retirement planning
 * @param {Object} params - Simulation parameters
 * @param {number} params.startAge - Starting age
 * @param {number} params.endAge - Ending age (life expectancy)
 * @param {number} params.iterations - Number of Monte Carlo iterations (default 10000)
 * @param {number} params.equityReturn - Expected equity return (default 0.08)
 * @param {number} params.equityVolatility - Equity volatility (default 0.15)
 * @param {number} params.cryptoReturn - Expected crypto return (default 0.10)
 * @param {number} params.cryptoVolatility - Crypto volatility (default 0.40)
 * @param {number} params.correlation - Correlation between assets (default 0.1)
 * @param {Function} params.cashFlowFn - Function(year, equityReturn, cryptoReturn) => {balances, success}
 * @param {Function} params.progressCallback - Optional progress callback (iteration, total)
 * @returns {Object} Simulation results with percentiles and success rate
 */
export function runMonteCarlo({
  startAge,
  endAge,
  iterations = 10000,
  equityReturn = 0.08,
  equityVolatility = 0.15,
  cryptoReturn = 0.10,
  cryptoVolatility = 0.40,
  correlation = 0.1,
  enableCAPE = false,
  cashFlowFn,
  progressCallback
}) {
  if (!cashFlowFn) {
    throw new Error('cashFlowFn is required for Monte Carlo simulation');
  }

  const years = endAge - startAge + 1;
  const results = [];
  const finalBalances = [];
  const successFlags = [];

  // CAPE Adjustment: 2% drag for first 10 years if enabled
  const capeDrag = 0.02;

  // Run iterations
  for (let iter = 0; iter < iterations; iter++) {
    if (progressCallback && iter % 100 === 0) {
      progressCallback(iter, iterations);
    }

    const yearResults = [];
    let balances = null;
    let success = true;

    // Simulate each year
    for (let year = 0; year < years; year++) {
      const age = startAge + year;

      // Generate correlated returns for this year
      // Phase 7: CAPE Adjustment (Mean Reversion)
      let currentEquityReturn = equityReturn;
      if (enableCAPE && year < 10) {
        currentEquityReturn -= capeDrag;
      }

      const { equityReturn: eqRet, cryptoReturn: crRet } = simulateYear({
        equityReturn: currentEquityReturn,
        equityVolatility,
        cryptoReturn,
        cryptoVolatility,
        correlation
      });

      // Run cash flow calculation for this year
      const result = cashFlowFn(age, eqRet, crRet, balances);
      balances = result.balances;
      success = success && result.success;

      yearResults.push({
        age,
        equityReturn: eqRet,
        cryptoReturn: crRet,
        balances: { ...balances }
      });
    }

    results.push(yearResults);
    finalBalances.push(balances?.totalBalance || 0);
    successFlags.push(success);
  }

  // Calculate percentiles for each year
  const percentiles = calculatePercentiles(results);

  // Calculate probability of success
  const successRate = successFlags.filter(s => s).length / iterations;

  return {
    iterations,
    successRate,
    percentiles,
    finalBalances: {
      mean: finalBalances.reduce((a, b) => a + b, 0) / finalBalances.length,
      median: percentile(finalBalances, 0.5),
      p10: percentile(finalBalances, 0.1),
      p90: percentile(finalBalances, 0.9)
    },
    initialBalance: results[0]?.[0]?.balances?.totalBalance || 0,
    years: years
  };
}

/**
 * Calculate percentiles for each year across all iterations
 * @param {Array<Array>} results - Array of year-by-year results for each iteration
 * @returns {Object} Percentile data by year
 */
function calculatePercentiles(results) {
  const years = results[0]?.length || 0;
  const percentiles = {
    p5: [],
    p10: [],
    p25: [],
    p50: [],
    p75: [],
    p90: [],
    p95: []
  };

  for (let year = 0; year < years; year++) {
    const yearBalances = results.map(iter => iter[year]?.balances?.totalBalance || 0);

    percentiles.p5.push(percentile(yearBalances, 0.05));
    percentiles.p10.push(percentile(yearBalances, 0.1));
    percentiles.p25.push(percentile(yearBalances, 0.25));
    percentiles.p50.push(percentile(yearBalances, 0.5));
    percentiles.p75.push(percentile(yearBalances, 0.75));
    percentiles.p90.push(percentile(yearBalances, 0.9));
    percentiles.p95.push(percentile(yearBalances, 0.95));
  }

  return percentiles;
}

/**
 * Calculate percentile of an array
 * @param {number[]} arr - Array of numbers
 * @param {number} p - Percentile (0-1)
 * @returns {number} Percentile value
 */
function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, index)] || 0;
}

/**
 * Generate cone of uncertainty data for Chart.js
 * @param {Object} percentiles - Percentile data from Monte Carlo
 * @param {number} startAge - Starting age
 * @returns {Object} Chart.js dataset configuration
 */
export function generateConeData(percentiles, startAge) {
  const years = percentiles.p50.length;
  const ages = Array.from({ length: years }, (_, i) => startAge + i);

  return {
    labels: ages,
    datasets: [
      {
        label: '90th Percentile',
        data: percentiles.p90,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: '+1',
        tension: 0.4
      },
      {
        label: '75th Percentile',
        data: percentiles.p75,
        borderColor: 'rgba(59, 130, 246, 0.4)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: '+1',
        tension: 0.4
      },
      {
        label: 'Median (50th)',
        data: percentiles.p50,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: '25th Percentile',
        data: percentiles.p25,
        borderColor: 'rgba(59, 130, 246, 0.4)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: '-1',
        tension: 0.4
      },
      {
        label: '10th Percentile',
        data: percentiles.p10,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: '-1',
        tension: 0.4
      }
    ]
  };
}
