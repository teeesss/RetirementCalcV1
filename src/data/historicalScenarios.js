/**
 * Historical Market Scenarios for Monte Carlo Simulation
 *
 * Each scenario defines a sequence of annual returns that override
 * the stochastic returns for the specified years.
 *
 * Sources:
 * - S&P 500 historical data
 * - NBER recession dating
 * - Academic research on market cycles
 */

export const HISTORICAL_SCENARIOS = {
    random: {
        name: 'Random (Default)',
        description: 'Standard Monte Carlo with stochastic returns',
        years: [],
        icon: '🎲'
    },

    greatDepression: {
        name: 'Great Depression (1929-1933)',
        description: 'Worst market crash in US history: -89% over 4 years',
        icon: '📉',
        years: [
            { year: 0, equityReturn: -0.43, cryptoReturn: -0.65 }, // 1929: -43%
            { year: 1, equityReturn: -0.34, cryptoReturn: -0.50 }, // 1930: -34%
            { year: 2, equityReturn: -0.53, cryptoReturn: -0.70 }, // 1931: -53%
            { year: 3, equityReturn: -0.05, cryptoReturn: -0.10 }, // 1932: -5%
            { year: 4, equityReturn: 0.46, cryptoReturn: 0.60 }    // 1933: +46% recovery
        ]
    },

    dotComCrash: {
        name: 'Dot-Com Crash (2000-2002)',
        description: 'Tech bubble burst: -49% over 2.5 years',
        icon: '💻',
        years: [
            { year: 0, equityReturn: -0.10, cryptoReturn: -0.15 }, // 2000: -10%
            { year: 1, equityReturn: -0.13, cryptoReturn: -0.20 }, // 2001: -13%
            { year: 2, equityReturn: -0.23, cryptoReturn: -0.35 }, // 2002: -23%
            { year: 3, equityReturn: 0.26, cryptoReturn: 0.35 }    // 2003: +26% recovery
        ]
    },

    financialCrisis2008: {
        name: '2008 Financial Crisis',
        description: 'Global financial crisis: -56% in 18 months',
        icon: '🏦',
        years: [
            { year: 0, equityReturn: -0.38, cryptoReturn: -0.55 }, // 2008: -38%
            { year: 1, equityReturn: 0.23, cryptoReturn: 0.30 },   // 2009: +23%
            { year: 2, equityReturn: 0.13, cryptoReturn: 0.20 },   // 2010: +13%
            { year: 3, equityReturn: 0.00, cryptoReturn: 0.05 }    // 2011: 0%
        ]
    },

    lostDecade: {
        name: 'Lost Decade (2000-2010)',
        description: 'Zero real return over 10 years',
        icon: '📊',
        years: [
            { year: 0, equityReturn: -0.10, cryptoReturn: -0.15 },
            { year: 1, equityReturn: -0.13, cryptoReturn: -0.20 },
            { year: 2, equityReturn: -0.23, cryptoReturn: -0.35 },
            { year: 3, equityReturn: 0.26, cryptoReturn: 0.35 },
            { year: 4, equityReturn: 0.09, cryptoReturn: 0.12 },
            { year: 5, equityReturn: 0.03, cryptoReturn: 0.05 },
            { year: 6, equityReturn: 0.14, cryptoReturn: 0.18 },
            { year: 7, equityReturn: -0.38, cryptoReturn: -0.55 },
            { year: 8, equityReturn: 0.23, cryptoReturn: 0.30 },
            { year: 9, equityReturn: 0.13, cryptoReturn: 0.20 }
        ]
    },

    bearMarketStart: {
        name: 'Bear Market Start (5yr)',
        description: 'Retire into a bear market: -20% Y1, volatile Y2-5',
        icon: '🐻',
        years: [
            { year: 0, equityReturn: -0.20, cryptoReturn: -0.35 },
            { year: 1, equityReturn: -0.10, cryptoReturn: -0.20 },
            { year: 2, equityReturn: 0.05, cryptoReturn: 0.08 },
            { year: 3, equityReturn: -0.05, cryptoReturn: -0.10 },
            { year: 4, equityReturn: 0.15, cryptoReturn: 0.20 }
        ]
    },

    bullMarketStart: {
        name: 'Bull Market Start (5yr)',
        description: 'Retire into a bull market: +15% Y1, steady growth Y2-5',
        icon: '🐂',
        years: [
            { year: 0, equityReturn: 0.15, cryptoReturn: 0.25 },
            { year: 1, equityReturn: 0.12, cryptoReturn: 0.20 },
            { year: 2, equityReturn: 0.10, cryptoReturn: 0.18 },
            { year: 3, equityReturn: 0.08, cryptoReturn: 0.15 },
            { year: 4, equityReturn: 0.07, cryptoReturn: 0.12 }
        ]
    },

    stagflation: {
        name: 'Stagflation (1970s)',
        description: 'High inflation + low growth: like 1973-1982',
        icon: '📈',
        years: [
            { year: 0, equityReturn: -0.17, cryptoReturn: -0.25 }, // 1973
            { year: 1, equityReturn: -0.30, cryptoReturn: -0.45 }, // 1974
            { year: 2, equityReturn: 0.31, cryptoReturn: 0.40 },   // 1975
            { year: 3, equityReturn: 0.19, cryptoReturn: 0.25 },   // 1976
            { year: 4, equityReturn: -0.12, cryptoReturn: -0.18 }, // 1977
            { year: 5, equityReturn: 0.01, cryptoReturn: 0.02 },   // 1978
            { year: 6, equityReturn: 0.12, cryptoReturn: 0.18 },   // 1979
            { year: 7, equityReturn: 0.26, cryptoReturn: 0.35 },   // 1980
            { year: 8, equityReturn: -0.10, cryptoReturn: -0.15 }, // 1981
            { year: 9, equityReturn: 0.15, cryptoReturn: 0.20 }    // 1982
        ]
    },

    covid2020: {
        name: 'COVID Crash (2020)',
        description: 'Sharp crash + rapid recovery: -34% to +68% in months',
        icon: '🦠',
        years: [
            { year: 0, equityReturn: 0.16, cryptoReturn: 0.30 },   // 2020: Net positive after V-recovery
            { year: 1, equityReturn: 0.27, cryptoReturn: 0.60 },   // 2021: Strong bull
            { year: 2, equityReturn: -0.19, cryptoReturn: -0.65 }  // 2022: Bear market
        ]
    },

    last10Years: {
        name: 'Last 10 Years (2015-2024)',
        description: 'Recent decade including COVID, crypto boom/bust',
        icon: '📅',
        years: [
            { year: 0, equityReturn: -0.01, cryptoReturn: 0.35 },  // 2015
            { year: 1, equityReturn: 0.10, cryptoReturn: 1.25 },   // 2016
            { year: 2, equityReturn: 0.19, cryptoReturn: 13.50 },  // 2017 (crypto boom)
            { year: 3, equityReturn: -0.06, cryptoReturn: -0.73 }, // 2018
            { year: 4, equityReturn: 0.29, cryptoReturn: 0.95 },   // 2019
            { year: 5, equityReturn: 0.16, cryptoReturn: 3.00 },   // 2020
            { year: 6, equityReturn: 0.27, cryptoReturn: 0.60 },   // 2021
            { year: 7, equityReturn: -0.19, cryptoReturn: -0.65 }, // 2022
            { year: 8, equityReturn: 0.24, cryptoReturn: 1.20 },   // 2023
            { year: 9, equityReturn: 0.23, cryptoReturn: 1.50 }    // 2024
        ]
    },

    last20Years: {
        name: 'Last 20 Years (2005-2024)',
        description: '2008 crisis + recovery + COVID era',
        icon: '📆',
        years: [
            { year: 0, equityReturn: 0.03, cryptoReturn: 0.05 },   // 2005
            { year: 1, equityReturn: 0.14, cryptoReturn: 0.18 },   // 2006
            { year: 2, equityReturn: 0.04, cryptoReturn: 0.06 },   // 2007
            { year: 3, equityReturn: -0.38, cryptoReturn: -0.55 }, // 2008
            { year: 4, equityReturn: 0.23, cryptoReturn: 0.30 },   // 2009
            { year: 5, equityReturn: 0.13, cryptoReturn: 0.20 },   // 2010
            { year: 6, equityReturn: 0.00, cryptoReturn: 0.05 },   // 2011
            { year: 7, equityReturn: 0.13, cryptoReturn: 0.18 },   // 2012
            { year: 8, equityReturn: 0.30, cryptoReturn: 0.40 },   // 2013
            { year: 9, equityReturn: 0.11, cryptoReturn: 0.15 },   // 2014
            { year: 10, equityReturn: -0.01, cryptoReturn: 0.35 }, // 2015
            { year: 11, equityReturn: 0.10, cryptoReturn: 1.25 },  // 2016
            { year: 12, equityReturn: 0.19, cryptoReturn: 13.50 }, // 2017
            { year: 13, equityReturn: -0.06, cryptoReturn: -0.73 },// 2018
            { year: 14, equityReturn: 0.29, cryptoReturn: 0.95 },  // 2019
            { year: 15, equityReturn: 0.16, cryptoReturn: 3.00 },  // 2020
            { year: 16, equityReturn: 0.27, cryptoReturn: 0.60 },  // 2021
            { year: 17, equityReturn: -0.19, cryptoReturn: -0.65 },// 2022
            { year: 18, equityReturn: 0.24, cryptoReturn: 1.20 },  // 2023
            { year: 19, equityReturn: 0.23, cryptoReturn: 1.50 }   // 2024
        ]
    },

    last30Years: {
        name: 'Last 30 Years (1995-2024)',
        description: 'Dot-com + 2008 + COVID: full modern era',
        icon: '🗓️',
        years: [
            { year: 0, equityReturn: 0.34, cryptoReturn: 0.45 },   // 1995
            { year: 1, equityReturn: 0.20, cryptoReturn: 0.28 },   // 1996
            { year: 2, equityReturn: 0.31, cryptoReturn: 0.40 },   // 1997
            { year: 3, equityReturn: 0.27, cryptoReturn: 0.35 },   // 1998
            { year: 4, equityReturn: 0.20, cryptoReturn: 0.28 },   // 1999
            { year: 5, equityReturn: -0.10, cryptoReturn: -0.15 }, // 2000
            { year: 6, equityReturn: -0.13, cryptoReturn: -0.20 }, // 2001
            { year: 7, equityReturn: -0.23, cryptoReturn: -0.35 }, // 2002
            { year: 8, equityReturn: 0.26, cryptoReturn: 0.35 },   // 2003
            { year: 9, equityReturn: 0.09, cryptoReturn: 0.12 },   // 2004
            { year: 10, equityReturn: 0.03, cryptoReturn: 0.05 },  // 2005
            { year: 11, equityReturn: 0.14, cryptoReturn: 0.18 },  // 2006
            { year: 12, equityReturn: 0.04, cryptoReturn: 0.06 },  // 2007
            { year: 13, equityReturn: -0.38, cryptoReturn: -0.55 },// 2008
            { year: 14, equityReturn: 0.23, cryptoReturn: 0.30 },  // 2009
            { year: 15, equityReturn: 0.13, cryptoReturn: 0.20 },  // 2010
            { year: 16, equityReturn: 0.00, cryptoReturn: 0.05 },  // 2011
            { year: 17, equityReturn: 0.13, cryptoReturn: 0.18 },  // 2012
            { year: 18, equityReturn: 0.30, cryptoReturn: 0.40 },  // 2013
            { year: 19, equityReturn: 0.11, cryptoReturn: 0.15 },  // 2014
            { year: 20, equityReturn: -0.01, cryptoReturn: 0.35 }, // 2015
            { year: 21, equityReturn: 0.10, cryptoReturn: 1.25 },  // 2016
            { year: 22, equityReturn: 0.19, cryptoReturn: 13.50 }, // 2017
            { year: 23, equityReturn: -0.06, cryptoReturn: -0.73 },// 2018
            { year: 24, equityReturn: 0.29, cryptoReturn: 0.95 },  // 2019
            { year: 25, equityReturn: 0.16, cryptoReturn: 3.00 },  // 2020
            { year: 26, equityReturn: 0.27, cryptoReturn: 0.60 },  // 2021
            { year: 27, equityReturn: -0.19, cryptoReturn: -0.65 },// 2022
            { year: 28, equityReturn: 0.24, cryptoReturn: 1.20 },  // 2023
            { year: 29, equityReturn: 0.23, cryptoReturn: 1.50 }   // 2024
        ]
    },

    userDefined: {
        name: 'User-Defined Range',
        description: 'Custom return range (e.g., -20% to +40%)',
        icon: '⚙️',
        years: [] // Populated dynamically based on user input
    }
};

/**
 * Get scenario by ID
 */
export function getScenario(scenarioId) {
    return HISTORICAL_SCENARIOS[scenarioId] || HISTORICAL_SCENARIOS.random;
}

/**
 * Get all scenario options for dropdown
 */
export function getScenarioOptions() {
    return Object.entries(HISTORICAL_SCENARIOS).map(([id, scenario]) => ({
        id,
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon
    }));
}
