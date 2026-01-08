/**
 * IRMAA (Income-Related Monthly Adjustment Amount) Tiers
 * Source: CMS Medicare Part B & D Premium Tables
 *
 * IMPORTANT: This is the single authoritative source for IRMAA thresholds.
 * Do NOT duplicate these values elsewhere in the codebase.
 */

/**
 * IRMAA Tier Structure (2025 projected)
 * Based on Modified Adjusted Gross Income (MAGI) from 2 years prior
 */
export const IRMAA_TIERS_2025 = {
    partB: {
        single: [
            { magiLimit: 103000, surcharge: 0 },      // Standard premium
            { magiLimit: 129000, surcharge: 69.90 },  // Tier 1
            { magiLimit: 161000, surcharge: 174.70 }, // Tier 2
            { magiLimit: 193000, surcharge: 279.50 }, // Tier 3
            { magiLimit: 500000, surcharge: 384.30 }, // Tier 4
            { magiLimit: Infinity, surcharge: 419.30 } // Tier 5
        ],
        married: [
            { magiLimit: 206000, surcharge: 0 },
            { magiLimit: 258000, surcharge: 69.90 },
            { magiLimit: 322000, surcharge: 174.70 },
            { magiLimit: 386000, surcharge: 279.50 },
            { magiLimit: 750000, surcharge: 384.30 },
            { magiLimit: Infinity, surcharge: 419.30 }
        ]
    },
    partD: {
        single: [
            { magiLimit: 103000, surcharge: 0 },
            { magiLimit: 129000, surcharge: 12.90 },
            { magiLimit: 161000, surcharge: 33.30 },
            { magiLimit: 193000, surcharge: 53.80 },
            { magiLimit: 500000, surcharge: 74.20 },
            { magiLimit: Infinity, surcharge: 81.00 }
        ],
        married: [
            { magiLimit: 206000, surcharge: 0 },
            { magiLimit: 258000, surcharge: 12.90 },
            { magiLimit: 322000, surcharge: 33.30 },
            { magiLimit: 386000, surcharge: 53.80 },
            { magiLimit: 750000, surcharge: 74.20 },
            { magiLimit: Infinity, surcharge: 81.00 }
        ]
    }
};

/**
 * Standard Medicare Premiums (before IRMAA)
 */
export const MEDICARE_STANDARD_PREMIUMS = {
    partB: 174.70,  // 2025 projected
    partD: 35.00    // Average plan cost
};

/**
 * Calculate IRMAA surcharge
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {string} filingStatus - 'single' or 'married'
 * @param {string} part - 'partB' or 'partD'
 * @returns {number} - Monthly surcharge
 */
export function calculateIRMAA(magi, filingStatus, part = 'partB') {
    const status = filingStatus === 'married' ? 'married' : 'single';
    const tiers = IRMAA_TIERS_2025[part][status];

    for (const tier of tiers) {
        if (magi <= tier.magiLimit) {
            return tier.surcharge;
        }
    }

    // Fallback to highest tier
    return tiers[tiers.length - 1].surcharge;
}

/**
 * Calculate total Medicare premium (standard + IRMAA)
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {string} filingStatus - Filing status
 * @returns {Object} - { partB, partD, total } monthly premiums
 */
export function calculateMedicarePremium(magi, filingStatus) {
    const partB_surcharge = calculateIRMAA(magi, filingStatus, 'partB');
    const partD_surcharge = calculateIRMAA(magi, filingStatus, 'partD');

    const partB = MEDICARE_STANDARD_PREMIUMS.partB + partB_surcharge;
    const partD = MEDICARE_STANDARD_PREMIUMS.partD + partD_surcharge;

    return {
        partB,
        partD,
        total: partB + partD,
        surcharges: {
            partB: partB_surcharge,
            partD: partD_surcharge
        }
    };
}

/**
 * Get IRMAA tier for a given MAGI (for display/planning purposes)
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {string} filingStatus - Filing status
 * @returns {number} - Tier number (0-5, where 0 is standard premium)
 */
export function getIRMAATier(magi, filingStatus) {
    const status = filingStatus === 'married' ? 'married' : 'single';
    const tiers = IRMAA_TIERS_2025.partB[status];

    for (let i = 0; i < tiers.length; i++) {
        if (magi <= tiers[i].magiLimit) {
            return i;
        }
    }

    return tiers.length - 1;
}
