/**
 * State Tax Brackets (2024/2025 Estimates)
 *
 * Sources:
 * CA: FTB 2024 Tax Rate Schedules
 * NY: NYS Dept of Tax (2024 Rates)
 * AR: DFA Arkansas (2024 Top Marginal 4.4%)
 * TX/FL: 0% No Income Tax
 */

export const STATE_BRACKETS = {
    // California (2024 Estimates)
    // 1% Surcharge on > $1M is handled as a separate logic check if needed, or added to top bracket (13.3%)
    // But technically it's 12.3% + 1%.
    CA: {
        single: [
            [0.0100, 10412],
            [0.0200, 24684],
            [0.0400, 38959],
            [0.0600, 54081],
            [0.0800, 68350],
            [0.0930, 349137],
            [0.1030, 418961],
            [0.1130, 698271],
            [0.1230, Infinity]
        ],
        married: [
            [0.0100, 20824],
            [0.0200, 49368],
            [0.0400, 77918],
            [0.0600, 108162],
            [0.0800, 136700],
            [0.0930, 698274],
            [0.1030, 837922],
            [0.1130, 1396542],
            [0.1230, Infinity]
        ]
    },

    // New York (2024 Estimates)
    // NY has a "Benefit Recapture" which makes it effectively a flat tax for high earners.
    // Simplifying to progressive structure for model v2.2
    NY: {
        single: [
            [0.0400, 8500],
            [0.0450, 11700],
            [0.0525, 13900],
            [0.0550, 80650],
            [0.0600, 215400],
            [0.0685, 1077550],
            [0.0965, 5000000],
            [0.1030, 25000000],
            [0.1090, Infinity]
        ],
        married: [
            [0.0400, 17150],
            [0.0450, 23600],
            [0.0525, 27900],
            [0.0550, 161550],
            [0.0600, 323200],
            [0.0685, 2155350],
            [0.0965, 5000000],
            [0.1030, 25000000],
            [0.1090, Infinity]
        ]
    },

    // Arkansas (2024 Top Rate 4.4%)
    // Using simple "High Earner" schedule approximation
    AR: {
        single: [
            [0.020, 5299],
            [0.040, 10599],
            [0.044, Infinity]
        ],
        married: [
            [0.020, 5299],  // AR often taxes individually, but we treat household income
            [0.040, 10599], // Simplified for MVP: Using same brackets for MFJ (conservative estimate or needs doubling?)
            // AR is unique (Married Filing Separately on same return).
            // For v2.2 we will just double the brackets for Married to approximate 2 earners.
            [0.044, Infinity]
        ]
    },

    // No Income Tax States
    TX: { flat: 0 },
    FL: { flat: 0 },
    NV: { flat: 0 },
    TN: { flat: 0 },
    WA: { flat: 0 }, // (Has Cap Gains tax > $250k, but ignoring for general income tax MVP)
    WY: { flat: 0 },
    SD: { flat: 0 }
};

/**
 * Standard Deductions by State (2024 Estimates)
 * Some states use Federal, some have own.
 */
export const STATE_DEDUCTIONS = {
    CA: { single: 5363, married: 10726 },
    NY: { single: 8000, married: 16050 },
    AR: { single: 2340, married: 4680 },
    TX: { single: 0, married: 0 },
    FL: { single: 0, married: 0 }
};
