/**
 * Social Security Optimizer Logic
 *
 * Calculates official SSA benefit amounts including:
 * - Actuarial reductions for early filing (pre-FRA)
 * - Delayed Retirement Credits (DRC) for late filing (post-FRA)
 * - Break-even analysis
 */

/**
 * Calculate the monthly benefit based on Primary Insurance Amount (PIA) and claiming age
 *
 * @param {number} pia - Primary Insurance Amount (Benefit at FRA)
 * @param {number} claimAge - Age at which benefits are claimed (e.g. 62, 67, 70)
 * @param {number} fra - Full Retirement Age (default 67 for those born 1960+)
 * @returns {number} Monthly Benefit Amount
 */
export function calculateSSBenefit(pia, claimAge, fra = 67) {
    if (claimAge === fra) return pia;

    // Months difference
    // We assume claimAge is an integer for simplicity, but in reality it's years + months.
    // We'll treat claimAge as exactly that birthday.
    const monthsDiff = (claimAge - fra) * 12;

    if (monthsDiff < 0) {
        // Early Filing (Reduction)
        // First 36 months: 5/9 of 1% per month
        // Remaining months: 5/12 of 1% per month

        const earlyMonths = Math.abs(monthsDiff);
        let reduction = 0;

        if (earlyMonths <= 36) {
            reduction = earlyMonths * (5 / 9) * 0.01;
        } else {
            // First 36 months
            reduction = 36 * (5 / 9) * 0.01;
            // Remaining
            reduction += (earlyMonths - 36) * (5 / 12) * 0.01;
        }

        return pia * (1 - reduction);

    } else {
        // Delayed Filing (Credit)
        // 8% per year simple interest (2/3 of 1% per month)
        // Credits stop at age 70.

        const delayedMonths = Math.min(monthsDiff, (70 - fra) * 12);
        const credit = delayedMonths * (2 / 3) * 0.01;

        return pia * (1 + credit);
    }
}

/**
 * Compare cumulative benefits for standard strategies (62, FRA, 70)
 *
 * @param {number} pia - Primary Insurance Amount
 * @param {number} fra - Full Retirement Age
 * @param {number} maxAge - Age to calculate cumulative benefits until (e.g. 95)
 * @returns {Object} Comparison data and break-even analysis
 */
export function compareClaimingStrategies(pia, fra = 67, maxAge = 95) {
    const ages = [62, fra, 70];
    const strategies = {};

    // Calculate annual benefits for each strat
    ages.forEach(age => {
        strategies[age] = {
            startAge: age,
            monthlyBenefit: calculateSSBenefit(pia, age, fra),
            cumulative: []
        };
    });

    // Calculate cumulative lifetime payout for each year from 62 to maxAge
    // Format: [ { age: 62, strat62: 0, stratFRA: 0, strat70: 0 }, ... ]
    const dataPoints = [];

    for (let currentAge = 62; currentAge <= maxAge; currentAge++) {
        const point = { age: currentAge };

        ages.forEach(startAge => {
            // Initialize cumulative sum if this is the first year valid
            let prevSum = 0;
            if (dataPoints.length > 0) {
                prevSum = dataPoints[dataPoints.length - 1][`strat${startAge}`] || 0;
            }

            // Add benefit if we have reached claiming age
            if (currentAge >= startAge) {
                point[`strat${startAge}`] = prevSum + (strategies[startAge].monthlyBenefit * 12);
            } else {
                point[`strat${startAge}`] = 0;
            }
        });

        dataPoints.push(point);
    }

    // Find Break-Even Points
    // 1. Where FRA beats 62
    // 2. Where 70 beats FRA
    // 3. Where 70 beats 62

    let beAttributes = {
        fraBeats62: null,
        '70BeatsFra': null,
        '70Beats62': null
    };

    for (let i = 1; i < dataPoints.length; i++) {
        const prev = dataPoints[i - 1];
        const curr = dataPoints[i];
        const age = curr.age;

        // Check FRA vs 62
        if (!beAttributes.fraBeats62 && curr[`strat${fra}`] > curr.strat62 && prev[`strat${fra}`] <= prev.strat62 && curr.strat62 > 0) {
            beAttributes.fraBeats62 = age;
        }

        // Check 70 vs FRA
        if (!beAttributes['70BeatsFra'] && curr.strat70 > curr[`strat${fra}`] && prev.strat70 <= prev[`strat${fra}`] && curr[`strat${fra}`] > 0) {
            beAttributes['70BeatsFra'] = age;
        }

        // Check 70 vs 62
        if (!beAttributes['70Beats62'] && curr.strat70 > curr.strat62 && prev.strat70 <= prev.strat62 && curr.strat62 > 0) {
            beAttributes['70Beats62'] = age;
        }
    }

    return {
        strategies,
        curve: dataPoints,
        breakEven: beAttributes
    };
}

/**
 * Calculate Spousal Benefit (50% rule) accounting for deemed filing
 *
 * @param {number} primaryPia - Primary Earner's PIA
 * @param {number} spousePia - Spouse's PIA
 * @param {number} spouseClaimAge - Age spouse claims
 * @param {number} fra - Full Retirement Age
 * @returns {number} Monthly Spousal Benefit (Total = Own + Add-on)
 */
export function calculateSurvivorBenefit(primaryBenefit, spouseBenefit) {
    return Math.max(primaryBenefit, spouseBenefit);
}

/**
 * Simulate Joint Lifetime Value for a couple
 */
export function simulateJointStrategy({
    primaryPia,
    spousePia,
    primaryClaimAge,
    spouseClaimAge,
    primaryLifeExpectancy = 90,
    spouseLifeExpectancy = 95,
    primaryAge = 62, // Current Age
    spouseAge = 60,  // Current Age
    fra = 67
}) {
    // Current year offset
    // Calculate birth year offset for spouse
    const spouseBirthYearOffset = spouseAge - primaryAge; // Negative if spouse younger

    let totalLifetimeBenefit = 0;
    const monthlyStream = [];

    // Simulate year by year until both pass
    // Simulate year by year until both pass

    // Calculate Individual Benefits at Claim Age (Standard)
    const primaryOwnBenefit = calculateSSBenefit(primaryPia, primaryClaimAge, fra);
    const spouseOwnBenefit = calculateSSBenefit(spousePia, spouseClaimAge, fra);

    // Spousal Top-Up (Max 50% of Primary PIA)
    // Reduce if claimed early.
    // Base Spousal = 0.5 * PrimaryPIA
    // Add-on = Base Spousal - SpousePIA (if positive)
    // If Spouse claims before FRA, Spousal portion is reduced.
    // Reduction: 25/36 of 1% first 36mo, 5/12 of 1% remainder.
    const spousalBase = primaryPia * 0.5;
    const rawAddOn = Math.max(0, spousalBase - spousePia);

    // Reduce Add-On if Spouse Early
    let reducedAddOn = rawAddOn;
    if (spouseClaimAge < fra && rawAddOn > 0) {
        const monthsEarly = (fra - spouseClaimAge) * 12;
        let reduction = 0;
        if (monthsEarly <= 36) {
            reduction = monthsEarly * (25 / 36) * 0.01;
        } else {
            reduction = (36 * (25 / 36) * 0.01) + ((monthsEarly - 36) * (5 / 12) * 0.01);
        }
        reducedAddOn = rawAddOn * (1 - reduction);
    }

    // Iterate years from Primary's perspective
    for (let pAge = primaryAge; pAge <= Math.max(primaryLifeExpectancy, 100); pAge++) {
        const sAge = pAge + spouseBirthYearOffset; // Spouse Age this year

        const primaryAlive = pAge <= primaryLifeExpectancy;
        const spouseAlive = sAge <= spouseLifeExpectancy;

        if (!primaryAlive && !spouseAlive) break;

        let primaryMonthly = 0;
        let spouseMonthly = 0;

        // 1. Determine Status (Both Alive, Survivor)

        if (primaryAlive && spouseAlive) {
            // BOTH ALIVE

            // Primary Benefit
            if (pAge >= primaryClaimAge) {
                primaryMonthly = primaryOwnBenefit;
            }

            // Spouse Benefit
            if (sAge >= spouseClaimAge) {
                // Spouse gets Own Benefit
                spouseMonthly = spouseOwnBenefit;

                // Spousal Add-on?
                // Only if Primary has explicitly filed (or suspended - but deemed filing rules apply)
                // We assume Primary filed if pAge >= primaryClaimAge.
                if (pAge >= primaryClaimAge) {
                    spouseMonthly += reducedAddOn;
                }
            }

        } else if (!primaryAlive && spouseAlive) {
            // SURVIVOR SCENARIO 1 (Primary Die, Spouse Live)
            // Spouse gets Max(Own + Spousal, Deceased Primary's Actual Benefit)
            // Survivor benefit is roughly:
            // Max(SpouseOwn, PrimaryAmountIncludingDRC)
            // Note: If Spouse claims survivor benefit BEFORE FRA, reduction applies?
            // Assume Spouse is already old enough (usually passing happens late).
            // Simplified: Survivor gets the higher check.

            // Assume Spouse was receiving Own + AddOn.
            // Check Survivor Amount = Max(PrimaryOwnBenefit, SpouseOwnBenefitWithAddOn?? No just Own)
            // Actually it's simple: Survivor gets Max(Primary's Cheque, Spouse's Cheque).
            // Usually Primary's cheque is higher if Primary was high earner.
            // If Primary died BEFORE claiming? (Not handled here deeply).

            // If Primary claimed, use that amount.


            // Wait, Spousal Add-On drops off, replaced by Survivor Benefit.
            // Logic: Max(SpouseOwn, PrimaryDisbursed).
            const potentialSurvivor = Math.max(spouseOwnBenefit, primaryOwnBenefit);

            if (sAge >= 60) { // Survivor eligibility
                spouseMonthly = potentialSurvivor;
            }

        } else if (primaryAlive && !spouseAlive) {
            // SURVIVOR SCENARIO 2 (Spouse Die, Primary Live)
            // Primary gets Max(PrimaryOwn, SpouseOwn)
            const potentialSurvivor = Math.max(primaryOwnBenefit, spouseOwnBenefit);
            if (pAge >= 60) primaryMonthly = potentialSurvivor;
        }

        monthlyStream.push({
            pAge,
            sAge,
            primary: primaryMonthly,
            spouse: spouseMonthly,
            total: primaryMonthly + spouseMonthly
        });

        totalLifetimeBenefit += (primaryMonthly + spouseMonthly) * 12;
    }

    return {
        totalLifetimeBenefit,
        monthlyStream
    };
}
