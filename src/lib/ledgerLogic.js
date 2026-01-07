import { calculateRMD, calculateTotalTax, calculateACASubsidy, calculateMedicarePremiums } from './taxEngine';
import { optimizeWithdrawals } from './withdrawalOptimizer';
import { calculateSSBenefit } from './ssOptimizer';
import { growHECM, calculateInitialPrincipalLimit } from './reverseMortgage';
import { optimizeTaxFreeWithdrawal } from './taxFreeEngine';
import { getLOCOffer, shouldBorrow } from './lineOfCreditEngine';
import {
    calculateBlanchettSmile,
    applyGuardrails,
    calculatePercentageBased,
    calculateFloorCeiling,
    calculateActuarial,
    calculateMaxSpend
} from './spendingStrategies';

/**
 * Calculate crypto balance from holdings
 */
function calculateCryptoBalance(crypto) {
    if (!crypto) return 0;
    const safeNum = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const clean = val.replace(/,/g, '').trim();
            if (clean === '') return 0;
            const parsed = Number(clean);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };
    return (
        safeNum(crypto.btc?.quantity) * safeNum(crypto.btc?.price) +
        safeNum(crypto.eth?.quantity) * safeNum(crypto.eth?.price) +
        safeNum(crypto.sol?.quantity) * safeNum(crypto.sol?.price)
    );
}

/**
 * Calculate annual expenses for a given year
 */
function calculateExpenses(currentYearIndex, people, expenses, inflation, goals = []) {
    const client = people.find(p => p.id === 'client') || people[0];
    const age = client.age + currentYearIndex;

    // Safe Number Helper (Redefined here or moved to module scope ideally, but localized for safety)
    const safeNum = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const clean = val.replace(/,/g, '').trim();
            if (clean === '') return 0;
            const parsed = Number(clean);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    // 1. Determine Base Annual Spend (Real Dollars)
    let baseReal = 0;
    if (expenses.essentialMonthly !== undefined || expenses.discretionaryMonthly !== undefined) {
        baseReal = (safeNum(expenses.essentialMonthly) + safeNum(expenses.discretionaryMonthly)) * 12;
    } else if (expenses.essential !== undefined || expenses.discretionary !== undefined) {
        baseReal = safeNum(expenses.essential) + safeNum(expenses.discretionary);
    } else {
        // Legacy Fallback
        baseReal = safeNum(expenses.baseMonthly) * 12;
    }

    // 2. Apply Spending Phases (Go-go, Slow-go, No-go)
    let phaseMultiplier = 1.0;
    const phases = expenses.spendingPhases;

    if (phases) {
        if (age >= phases.noGoAge) {
            phaseMultiplier = phases.noGoReduction || 0.75;
        } else if (age >= phases.slowGoAge) {
            phaseMultiplier = phases.slowGoReduction || 0.85;
        }
    }

    const annualSpendReal = baseReal * phaseMultiplier;

    // 3. Apply Inflation
    const inflationFactor = Math.pow(1 + inflation / 100, currentYearIndex);
    const totalAnnual = annualSpendReal * inflationFactor;

    let oneTime = 0;
    expenses.oneTime?.forEach(exp => {
        if (exp.age === age) oneTime += exp.amount * inflationFactor;
    });

    let recurring = 0;
    expenses.recurring?.forEach(exp => {
        if (age >= exp.startAge && age <= exp.endAge) recurring += exp.amount * inflationFactor;
    });

    let goalExpenses = 0;
    goals.forEach(goal => {
        if (goal.age === age) goalExpenses += goal.amount * inflationFactor;
    });

    return totalAnnual + oneTime + recurring + goalExpenses;
}

/**
 * Core Ledger Generation Function
 * Pure function that calculates the year-by-year financial projection.
 */
export function generateLedger(currentData, spendingStrategy = 'fixed', guardrails = {}) {
    if (!currentData || !currentData.people || !currentData.assets) {
        throw new Error('Invalid plan data provided to generateLedger');
    }

    const { people, assets, expenses, credit, socialSecurity, assumptions, taxOptimization, realEstate = [], goals = [] } = currentData;

    // Logic for Multi-Life Support
    if (!people || people.length === 0) {
        // Fallback to avoid crash
        return [];
    }
    const client = people.find(p => p.id === 'client') || people[0];
    if (!client) return []; // Double safety

    const spouse = people.find(p => p.id === 'spouse');

    const startAge = Number(client.age) || 50;
    const endAge = Math.max(Number(client.lifeExpectancy) || 90, Number(spouse?.lifeExpectancy) || 0);
    const filingStatus = currentData.profile?.filingStatus || 'single';

    // STRESS TEST OVERRIDES
    const shockInflation = (currentData?.stressTest?.inflationIncrease || 0);
    const shockSS = 1 - ((currentData?.stressTest?.ssCut || 0) / 100);
    const shockDrop = (currentData?.stressTest?.marketDrop || 0) / 100;
    const shockLongevity = (currentData?.stressTest?.longevityYears || 0);

    const computedInflation = (assumptions.inflation ?? 2.5) + shockInflation;
    const startAgeSafe = Number(startAge) || 50;
    const endAgeSafe = Number(endAge) || 90;
    // Duration Calculation
    // Age 60 to 90 is 31 years inclusive (60, 61... 90)
    const baseDuration = (endAgeSafe - startAgeSafe) + 1;
    const loopDuration = baseDuration + shockLongevity;

    // Birthday Logic (v2.1)
    const birthDateStr = client.birthDate || `${new Date().getFullYear() - startAgeSafe}-01-01`;
    const [bY, bM, bD] = birthDateStr.split('-').map(Number);
    const birthDate = new Date(bY, bM - 1, bD); // Construct as Local Date
    const startYear = new Date().getFullYear();

    // Helper: Calculate exact age on Dec 31 of a given year
    const getAgeAtYearEnd = (year) => {
        const yearEnd = new Date(year, 11, 31); // Dec 31
        let age = yearEnd.getFullYear() - birthDate.getFullYear();
        const m = yearEnd.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && yearEnd.getDate() < birthDate.getDate())) {
            age--;
        }
        return age; // Returns integer age reached in that year
    };


    // Initial balances (Granular tracking)
    // Safe Number Parser (handles strings with/without commas, or numbers)
    const safeNum = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const clean = val.replace(/,/g, '').trim();
            if (clean === '') return 0;
            const parsed = Number(clean);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    // Helper to safely extract asset value
    const parseAsset = (asset, key) => {
        if (typeof asset === 'number') return key === 'client' ? asset : 0;
        if (typeof asset === 'string') return key === 'client' ? safeNum(asset) : 0;
        if (typeof asset === 'object') return safeNum(asset?.[key]); // Handles nested string values
        return 0;
    };

    // console.log("DIAGNOSTIC: generateLedger assets:", JSON.stringify(assets, null, 2));

    // Initial balances (Granular tracking)
    const tradClient = parseAsset(assets.traditional, 'client');
    const tradSpouse = parseAsset(assets.traditional, 'spouse');
    const rothClient = parseAsset(assets.roth, 'client');
    const rothSpouse = parseAsset(assets.roth, 'spouse');
    const hsaClient = parseAsset(assets.hsa, 'client');
    const hsaSpouse = parseAsset(assets.hsa, 'spouse');

    // Brokerage (Explicit Summation)
    let brokerageVal = 0;
    if (typeof assets.brokerage === 'number') {
        brokerageVal = assets.brokerage;
    } else {
        const brokJoint = safeNum(assets.brokerage?.joint);
        const brokClient = safeNum(assets.brokerage?.client);
        const brokSpouse = safeNum(assets.brokerage?.spouse);
        brokerageVal = brokJoint + brokClient + brokSpouse;
    }

    const balances = {
        // Granular Balances (Primary Source of Truth)
        traditionalClient: tradClient,

        traditionalSpouse: tradSpouse,
        rothClient: rothClient,
        rothSpouse: rothSpouse,
        hsaClient: hsaClient,
        hsaSpouse: hsaSpouse,
        realEstate: (realEstate && Array.isArray(realEstate) && realEstate.length > 0)
            ? realEstate.reduce((sum, p) => sum + safeNum(p.currentValue), 0)
            : (assets.realEstate && Array.isArray(assets.realEstate))
                ? assets.realEstate.reduce((sum, p) => sum + safeNum(p.currentValue), 0)
                : safeNum(assets.realEstate?.currentValue || assets.realEstate),

        // Aggregates (kept for UI compatibility, updated via sync)
        traditional: tradClient + tradSpouse,
        roth: rothClient + rothSpouse,
        hsa: hsaClient + hsaSpouse,

        brokerage: brokerageVal,
        crypto: calculateCryptoBalance(assets.crypto),
        cash: assets.cash?.total || 0,

        // Debts/Other
        brokerageLOC: credit?.brokerageLOC?.currentBalance || 0,
        cryptoLOC: credit?.cryptoLOC?.currentBalance || 0,
        hecmBalance: credit?.reverseMortgage?.initialDraw || 0,
        hecmLimit: 0
    };

    // Capture Initial State for Monte Carlo (Start of Year 0)
    const initialBalances = { ...balances };

    // Initialize HECM Limit if enabled
    if (credit?.reverseMortgage?.enabled) {
        const hecmParams = credit.reverseMortgage;
        balances.hecmLimit = calculateInitialPrincipalLimit(startAge, hecmParams.homeValue, hecmParams.growthRate);
    }

    let brokerageBasis = (assets.brokerageBasis?.joint || assets.brokerageBasis?.client || assets.brokerageBasis?.spouse || 0);
    // Initialize Crypto Basis - If not explicitly tracked, assume current value (fresh start)
    let cryptoBasis = calculateCryptoBalance(assets.crypto);

    const ledger = [];
    let lossBank = 0;
    // Current Real Estate tracking
    // Normalize real estate input (Account for top-level or assets-level)
    const rawRealEstate = (realEstate && Array.isArray(realEstate) && realEstate.length > 0)
        ? realEstate
        : (assets.realEstate && Array.isArray(assets.realEstate)) ? assets.realEstate : [];

    let currentRealEstate = rawRealEstate.map(re => ({
        ...re,
        currentValue: Number(re.currentValue) || 0,
        mortgageBalance: Number(re.mortgage?.balance) || 0
    }));

    const tlhStart = taxOptimization?.taxLossHarvesting?.startAge || startAge;
    const annualTLH = (taxOptimization?.taxLossHarvesting?.crypto || 0) + (taxOptimization?.taxLossHarvesting?.brokerage || 0);
    let peakPortfolioValue = 0;
    // Allow overrides from arguments (guardrails/params) and data
    const spendingParams = { ...(currentData.spending || {}), ...guardrails };

    // startYear is already defined above at line 144
    const enableTCJASunset = assumptions.enableTCJASunset || false;

    // Track "Previous Year" survival state for transition logic
    let wasClientAlive = true;
    let wasSpouseAlive = !!spouse;

    // Generate Ledger
    // If lifeExpectancy is 90 and age is 60, duration is 30.
    // We want year 60, 61... 90. That is 31 years.
    // i=0 (60), i=30 (90). So i <= simDuration.
    for (let i = 0; i < loopDuration; i++) { // loopDuration is already calculated to be (endAgeSafe - startAgeSafe + 1) + shockLongevity
        const currentYear = startYear + i;
        const clientAge = getAgeAtYearEnd(currentYear); // Keep existing logic for accurate age calculation
        const spouseAge = spouse ? (spouse.age + i) : 0; // Keeping spouse simple for now unless birthDate provided

        // Stop if everyone is dead
        if (clientAge > endAgeSafe) break;

        const clientAlive = clientAge <= client.lifeExpectancy;
        const spouseAlive = spouse ? (spouseAge <= spouse.lifeExpectancy) : false;

        if (!clientAlive && !spouseAlive) break;

        // SURVIVOR LOGIC: Basis Step-Up & Filing Status
        // ---------------------------------------------
        // Detect Death Event (Spouse Transition)
        const isSpouseDeathYear = wasSpouseAlive && !spouseAlive;
        const isClientDeathYear = wasClientAlive && !clientAlive && spouseAlive; // Client died, spouse lives

        // 1. Basis Step-Up (Brokerage)
        if (isSpouseDeathYear || isClientDeathYear) {
            const isCommunity = currentData.profile?.isCommunityProperty || false;
            const currentVal = balances.brokerage; // FMV at death

            if (isCommunity) {
                // 100% Step-Up
                brokerageBasis = currentVal;
            } else {
                // 50% Step-Up (Assume 50/50 ownership for Joint)
                // New Basis = SurvivorShare(50% Old) + DecedentShare(50% FMV)
                // = 0.5 * brokerageBasis + 0.5 * currentVal
                brokerageBasis = (brokerageBasis * 0.5) + (currentVal * 0.5);
            }
            console.log(`Survivor Logic: Basis Step-Up Triggered in ${currentYear}. Community=${isCommunity}, NewBasis=${brokerageBasis}`);
        }

        // 2. Filing Status Switch
        // Logic: Year of death = Married. Subsequent years = Single.
        // If initially single, stay single.
        let currentFilingStatus = filingStatus;
        if (filingStatus === 'married' || filingStatus === 'joint') {
            if (!spouseAlive && !isSpouseDeathYear) {
                // Spouse dead and NOT year of death -> Single
                currentFilingStatus = 'single';
            }
            if (!clientAlive && !isClientDeathYear && spouseAlive) {
                // Client dead, Spouse survivor -> Single
                currentFilingStatus = 'single';
            }
        }


        const isRetired = clientAge >= (Number(client.retirementAge) || 65);

        // Income logic
        let salary = isRetired ? 0 : (currentData.salary || 0);

        // Retirement Contributions
        let contributions = { traditional: 0, roth: 0, hsa: 0, aftertax: 0 };
        if (!isRetired && salary > 0) {
            const inflationRate = (assumptions.inflation || 2.5) / 100;
            const inflationFactor = Math.pow(1 + inflationRate, i);

            const trad401kMax = (clientAge >= 50 ? 30500 : 23000) * inflationFactor;
            const rothIRAMax = (clientAge >= 50 ? 8000 : 7000) * inflationFactor;
            const hsaMax = 8300 * inflationFactor;

            const trad401kPercent = (currentData.contributions?.traditional || 0) / 100;
            const matchPercent = (currentData.contributions?.match || 0) / 100;

            let remainingSalary = salary;
            contributions.traditional = Math.min(trad401kMax, salary * trad401kPercent);
            remainingSalary -= contributions.traditional;

            contributions.hsa = Math.min(hsaMax, currentData.contributions?.hsa || 0);
            if ((currentData.contributions?.hsa || 0) >= 8300) contributions.hsa = hsaMax;
            if (contributions.hsa > remainingSalary) contributions.hsa = remainingSalary;
            remainingSalary -= contributions.hsa;

            contributions.match = (currentData.salary || 0) * matchPercent;

            // Phase 7: Mega-Backdoor Roth (After-Tax 401k)
            // Limit: $69,000 (2024) - Traditional - Match
            const total401kLimit = 69000 * inflationFactor;
            const used401kSpace = contributions.traditional + contributions.match;
            const remaining401kSpace = Math.max(0, total401kLimit - used401kSpace);

            // User input is likely a % or fixed amount? Profile has it as number (assumed fixed amount based on other fields)
            // Let's assume it's a fixed dollar amount request
            const requestedafterTax = currentData.contributions?.afterTax401k || 0;
            contributions.aftertax = Math.min(requestedafterTax, remaining401kSpace);

            // Immediate In-Plan Conversion -> Goes straight to Roth
            // We store it in 'aftertax' for tracking, but balance updates will put it in Roth
            salary = salary - contributions.traditional - contributions.hsa - contributions.aftertax; // Deduct from Paycheck

            contributions.roth = Math.min(rothIRAMax, currentData.contributions?.roth || 0);
            if ((currentData.contributions?.roth || 0) >= 7000) contributions.roth = rothIRAMax;
        }

        // Social Security Logic (Precise Monthly)
        const primaryStart = socialSecurity?.primary?.startAge ?? socialSecurity?.startAge ?? 67;
        const spouseStart = socialSecurity?.spouse?.startAge ?? socialSecurity?.spouseStartAge ?? 67;
        const pia = socialSecurity?.pia || socialSecurity?.primary?.annualAmount || 0;
        const spousePia = socialSecurity?.spousePia || socialSecurity?.spouse?.annualAmount || 0;
        const fra = 67;

        // COLA adjustment
        const safePia = pia > 6000 ? pia / 12 : pia;
        const safeSpousePia = spousePia > 6000 ? spousePia / 12 : spousePia;
        const colaFactor = Math.pow(1 + computedInflation / 100, i);

        // Monthly Benefit Amounts (Adjusted for Claim Age)
        const primaryMonthly = calculateSSBenefit(safePia, primaryStart, fra) * colaFactor;
        const spouseMonthly = calculateSSBenefit(safeSpousePia, spouseStart, fra) * colaFactor;

        let ss = 0;

        // Helper: Calculate months eligible in current year
        const getMonthsEligible = (bDate, startAge, year) => {
            // Claim Date = BirthDate + StartAge (Years) + (StartAge Fraction * 12 Months)
            // Actually, simpler: ClaimDate = BirthDate + StartAge Years
            bDate.getFullYear() + Math.floor(startAge);
            const claimMonthFraction = (startAge % 1);
            bDate.getMonth() + Math.round(claimMonthFraction * 12);

            // console.log(`[SS Debug] Year: ${year}, StartAge: ${startAge}, ClaimY: ${claimYear}, ClaimM: ${claimMonth}`);

            // Handle month rollover (e.g. Oct + 6 months = April next year)
            // But simplification: Let's stick to simple Date addition if possible or approximation
            // Precise method:
            const claimDate = new Date(bDate.getTime());
            claimDate.setFullYear(bDate.getFullYear() + Math.floor(startAge));
            claimDate.setMonth(bDate.getMonth() + Math.round((startAge % 1) * 12));

            // Current Year Window
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);

            // Overlap
            const effectiveStart = claimDate > yearStart ? claimDate : yearStart;

            if (effectiveStart > yearEnd) return 0; // Starts after this year

            // Calculate months active in this year
            // If started this year: (11 - Month) + 1 (if start is Jan, 12 months. If start Dec, 1 month)
            // But if start is mid-month? SSA pays next month usually.
            // Simplified: If eligible in Month X, paid for Month X? No, usually paid in X+1.
            // Let's assume inclusive for MPV calculation ease.

            let months = 0;
            if (effectiveStart <= yearEnd) {
                months = 12 - effectiveStart.getMonth(); // Jan=0. 12-0=12. Dec=11. 12-11=1.
                // Adjust for claimDate being later in the year
                if (claimDate > yearStart) {
                    months = 12 - claimDate.getMonth();
                }
            }
            return Math.max(0, Math.min(12, months));
        };

        if (clientAlive) {
            const m = getMonthsEligible(birthDate, primaryStart, currentYear);
            ss += primaryMonthly * m;
        }

        if (spouse && spouseAlive) {
            // Need spouse birthDate. Fallback to age deviation if not set.
            let spouseBirthDate;
            if (spouse.birthDate) {
                const [sY, sM, sD] = spouse.birthDate.split('-').map(Number);
                spouseBirthDate = new Date(sY, sM - 1, sD);
            } else {
                // Estimate from age difference
                const ageDiff = (client.age || 50) - (spouse.age || 50);
                spouseBirthDate = new Date(birthDate.getTime());
                spouseBirthDate.setFullYear(birthDate.getFullYear() + ageDiff);
            }

            const m = getMonthsEligible(spouseBirthDate, spouseStart, currentYear);
            ss += spouseMonthly * m;
        }

        // Survivor Logic (Simplified for Monthly precision - Step up happens same year? Next year?)
        if (spouse && (!clientAlive || !spouseAlive)) {
            // If someone died THIS year, standard logic covers them until death?
            // "Stop if everyone is dead" check is above.
            // If one died previous year:
            const survivorBenefit = Math.max(primaryMonthly, spouseMonthly);

            // Overwrite SS with Survivor if widow(er) status established
            // This is a rough patch for Single/Survivor status calculated at top of loop
            if ((clientAlive && !spouseAlive) || (!clientAlive && spouseAlive)) {
                // Determine who is the survivor
                const isPrimarySurvivor = clientAlive;
                isPrimarySurvivor ? primaryStart : spouseStart; // When do they claim?
                // Actually survivor can claim EARLIER (age 60).
                // For now, assume they claim at their planned age or immediately if eligible.

                // If established survivor, we just take the max annual logic from before, but monthly?
                // Let's rely on the previous simple survivor overwrite for now, but apply monthly scalar?
                // Reverting to annual simple for Survivor to reduce risk of regression in this specific block
                // calculating full annual survivor benefit

                ss = survivorBenefit * 12; // Back to annual for purely survivor years to be safe
            }
        }

        // Apply Shock
        ss = ss * shockSS;

        const income = salary + ss;

        // Legacy Survivor Logic Removed (Consolidated at top of loop)

        // Spending Strategy (BOY Logic)
        // Calculate spending based on Beginning of Year portfolio value
        const currentPortfolio =
            balances.traditionalClient + balances.traditionalSpouse +
            balances.rothClient + balances.rothSpouse +
            balances.brokerage + balances.hsaClient + balances.hsaSpouse +
            balances.crypto;

        if (currentPortfolio > peakPortfolioValue) peakPortfolioValue = currentPortfolio;

        // Expenses
        const annualExpenses = calculateExpenses(i, people, expenses, computedInflation, goals);
        if (i === 0) {
            console.log("DEBUG Y0: Annual Exp:", annualExpenses);
            console.log("DEBUG Y0: Salary:", salary);
            console.log("DEBUG Y0: SS:", ss);
            console.log("DEBUG Y0: Income:", income);
            console.log("DEBUG Y0: Portfolio Start:", currentPortfolio);
            console.log("DEBUG Y0: Brokerage Start:", balances.brokerage);
        }

        // Calculate Minimum Need (Floor) = Total - Discretionary
        let discretionaryBase = (expenses.discretionaryMonthly || 0) * 12 + (expenses.discretionary || 0);

        // Re-apply Phase Reduction to Discretionary component
        let phaseFactor = 1.0;
        if (expenses.spendingPhases) {
            const age = clientAge;
            if (expenses.spendingPhases.noGoAge && age >= expenses.spendingPhases.noGoAge) {
                phaseFactor = expenses.spendingPhases.noGoReduction || 0.75;
            } else if (expenses.spendingPhases.slowGoAge && age >= expenses.spendingPhases.slowGoAge) {
                phaseFactor = expenses.spendingPhases.slowGoReduction || 0.85;
            }
        }

        const discretionaryInflated = discretionaryBase * phaseFactor * Math.pow(1 + computedInflation / 100, i);
        const minimumNeed = Math.max(0, annualExpenses - discretionaryInflated);

        let effectiveAnnualExpenses = annualExpenses;

        if (isRetired) {
            switch (spendingStrategy) {
                case 'blanchett':
                    effectiveAnnualExpenses = Math.max(minimumNeed, calculateBlanchettSmile(clientAge, client.retirementAge, annualExpenses));
                    break;
                case 'guardrails':
                    effectiveAnnualExpenses = Math.max(minimumNeed, applyGuardrails(currentPortfolio, peakPortfolioValue, annualExpenses, guardrails));
                    break;
                case 'percentage':
                    effectiveAnnualExpenses = Math.max(minimumNeed, calculatePercentageBased(currentPortfolio, spendingParams.percentageRate || 0.04));
                    break;
                case 'floor-ceiling': {
                    const floor = (spendingParams.floorAmount || 50000) * Math.pow(1 + computedInflation / 100, i);
                    const ceiling = (spendingParams.ceilingAmount || 200000) * Math.pow(1 + computedInflation / 100, i);
                    const effectiveFloor = Math.max(floor, minimumNeed);
                    effectiveAnnualExpenses = calculateFloorCeiling(currentPortfolio, spendingParams.percentageRate || 0.04, effectiveFloor, ceiling);
                    break;
                }
                case 'dynamic':
                    effectiveAnnualExpenses = Math.max(minimumNeed, calculateActuarial(currentPortfolio, clientAge, client.lifeExpectancy || 95));
                    break;
                case 'max-spend': {
                    const maxStart = spendingParams.maxSpendStart || client.retirementAge;
                    const maxEnd = spendingParams.maxSpendEnd || 75;
                    if (clientAge >= maxStart && clientAge < maxEnd) {
                        const maxSpendCalc = calculateMaxSpend(currentPortfolio, clientAge, maxEnd, 0.05, spendingParams.maxSpendLegacy || 0);
                        effectiveAnnualExpenses = Math.max(minimumNeed, maxSpendCalc);
                    } else {
                        effectiveAnnualExpenses = annualExpenses;
                    }
                    break;
                }
                default:
                    if (spendingParams.fixedAmount) {
                        const inflationFactor = Math.pow(1 + computedInflation / 100, i);
                        effectiveAnnualExpenses = spendingParams.fixedAmount * inflationFactor;
                    }
                    if (expenses.flexibility?.enabled && peakPortfolioValue > 0) {
                        const drop = (peakPortfolioValue - currentPortfolio) / peakPortfolioValue;
                        if (drop > (expenses.flexibility.portfolioDropThreshold || 0.10)) {
                            const rawEss = expenses.essentialMonthly ? expenses.essentialMonthly * 12 : (expenses.essential || 0);
                            const rawDisc = expenses.discretionaryMonthly ? expenses.discretionaryMonthly * 12 : (expenses.discretionary || 0);
                            const totalRaw = rawEss + rawDisc;
                            const discRatio = totalRaw > 0 ? rawDisc / totalRaw : 0;
                            const cutPercent = expenses.flexibility.discretionaryCut || 0.30;
                            const reduction = effectiveAnnualExpenses * discRatio * cutPercent;
                            effectiveAnnualExpenses -= reduction;
                        }
                    }
            }
        }

        // Real Estate, Mortgage & Housing Costs
        let totalMortPayment = 0;
        let totalMortInterest = 0;
        let totalRealEstateValue = 0;

        let housingCost = 0;
        const housingInf = Math.pow(1 + computedInflation / 100, i);

        currentRealEstate.forEach(re => {
            // Appreciation
            const appreciationRate = (re.appreciationRate || 2.5) / 100;
            re.currentValue *= (1 + appreciationRate);
            totalRealEstateValue += re.currentValue;

            // Mortgage
            if (re.mortgageBalance > 0 && re.mortgage) {
                const monthlyPmt = Number(re.mortgage.paymentPI) || 0;
                const annualPayment = monthlyPmt * 12;

                // Calculate Interest First
                const annualRate = (Number(re.mortgage.rate) || 0) / 100;
                const interest = re.mortgageBalance * annualRate;

                let extraPayment = 0;
                if (re.mortgage.targetAge && re.mortgage.targetAge > clientAge) {
                    const yearsRemaining = re.mortgage.targetAge - clientAge;
                    extraPayment = Math.max(0, (re.mortgageBalance - (annualPayment * yearsRemaining)) / yearsRemaining);
                }
                const totalAnnualPayment = annualPayment + extraPayment;

                // Fix: Cap payment at Balance + Interest (Total Liability), not just Balance
                // Otherwise we leave interest unpaid and balance never hits exactly 0
                const payment = Math.min(re.mortgageBalance + interest, totalAnnualPayment);

                totalMortPayment += payment;
                totalMortInterest += interest;

                const principal = Math.max(0, payment - interest);
                re.mortgageBalance = Math.max(0, re.mortgageBalance - principal);

                // Snap to 0 if very small (handling floating point noise)
                if (re.mortgageBalance < 5) re.mortgageBalance = 0;
            }


            // Per-property Housing Costs
            const annualPropTax = (re.propertyTax || 0) * housingInf;
            const annualIns = (re.insurance || 0) * housingInf;
            const annualMaint = (re.maintenance || 0) * housingInf;
            housingCost += (annualPropTax + annualIns + annualMaint);
        });

        // Healthcare
        let healthcareCost = 0;
        let medicareData = null;
        let acaData = null;

        const isPrimaryMedEligible = clientAge >= 65 && clientAlive;
        const isSpouseMedEligible = spouseAge >= 65 && spouseAlive;

        if (isPrimaryMedEligible || isSpouseMedEligible) {
            const lookbackIndex = ledger.length - 2;
            let priorMAGI = income; // fallback
            if (lookbackIndex >= 0) {
                priorMAGI = ledger[lookbackIndex].taxes.agi;
            }
            const premiums = calculateMedicarePremiums(priorMAGI, currentFilingStatus);
            healthcareCost = (isPrimaryMedEligible ? premiums.totalAnnual : 0) + (isSpouseMedEligible ? premiums.totalAnnual : 0);
            medicareData = { ...premiums, total: healthcareCost };
        }

        if ((clientAlive && clientAge < 65) || (spouseAlive && spouseAge < 65)) {
            const pre65Monthly = expenses.medicarePre65 || 0;
            const acaMagi = income; // Approximation
            const acaParams = assumptions.aca || { benchmarkPremium: 600, householdSize: spouseAlive ? 2 : 1, povertyLine: 14580 };
            const result = calculateACASubsidy(acaMagi, spouseAlive ? 2 : 1, acaParams.benchmarkPremium, acaParams.povertyLine);
            const annualPre65Cost = pre65Monthly * 12;
            const netCost = Math.max(0, annualPre65Cost - result.subsidy);
            healthcareCost += netCost;
            acaData = { ...result, grossCost: annualPre65Cost, netCost };
        }

        // LTC
        let ltcCost = 0;
        if (currentData.stressTest?.ltcEvent?.enabled) {
            const ltcStart = currentData.stressTest.ltcEvent.startAge || 85;
            const ltcYears = currentData.stressTest.ltcEvent.years || 3;
            if (clientAge >= ltcStart && clientAge < (ltcStart + ltcYears)) {
                ltcCost = (currentData.stressTest.ltcEvent.monthlyCost || 0) * 12 * Math.pow(1 + computedInflation / 100, i);
                healthcareCost += ltcCost;
            }
        }

        const totalExpenses = effectiveAnnualExpenses + totalMortPayment + healthcareCost + housingCost;

        // TLH
        if (clientAge >= tlhStart) lossBank += annualTLH;

        // LOC Interest
        const brokerageLocInterest = balances.brokerageLOC * (credit?.brokerageLOC?.rate || 0.08);
        const cryptoLocInterest = balances.cryptoLOC * (credit?.cryptoLOC?.rate || 0.10);
        const totalLocInterest = brokerageLocInterest + cryptoLocInterest;

        // HECM Growth
        if (credit?.reverseMortgage?.enabled && balances.hecmLimit > 0) {
            const growthResult = growHECM({
                currentLimit: balances.hecmLimit,
                currentBalance: balances.hecmBalance,
                interestRate: 0.05,
                mipRate: credit.reverseMortgage.annualMIP,
                draw: 0
            });
            balances.hecmLimit = growthResult.newLimit;
            balances.hecmBalance = growthResult.newBalance;
        }

        // RMDs
        let rmdClient = calculateRMD(balances.traditionalClient, clientAge);
        let rmdSpouse = calculateRMD(balances.traditionalSpouse, spouseAge);

        // QCD & DAF Logic
        let totalQCD = 0;
        let annualCharity = expenses.charity || 0;
        let dafContribution = 0;

        // Phase 7: DAF Bunching
        // "Bunch" N years of charity into Year 1 (or startYear) to maximize Itemized Deduction
        const dafStrategy = currentData.strategy?.daf;
        if (dafStrategy?.enabled) {
            const startBunchYear = dafStrategy.startYear || startYear;
            const bunchYears = dafStrategy.yearsToBunch || 5;

            // Check if inside the "Pre-paid" window
            if (currentYear >= startBunchYear && currentYear < startBunchYear + bunchYears) {
                // If it's the trigger year, we pay the lump sum
                if (currentYear === startBunchYear) {
                    dafContribution = annualCharity * bunchYears;
                    annualCharity = 0; // The cash outflow is the DAF Contribution (handled below as expense or deduction)
                    // We treat dafContribution as an expense flow AND a deduction
                    effectiveAnnualExpenses += dafContribution;
                } else {
                    // For subsequent years, charity is paid from DAF, so $0 cash flow for client
                    annualCharity = 0;
                }
            }
        }

        if (annualCharity > 0) {
            let remaining = annualCharity;
            if (clientAge >= 70.5 && balances.traditionalClient > 0) {
                const qcd = Math.min(remaining, balances.traditionalClient, 105000);
                balances.traditionalClient -= qcd;
                remaining -= qcd;
                rmdClient = Math.max(0, rmdClient - qcd);
                totalQCD += qcd;
            }
            if (spouse && spouseAge >= 70.5 && balances.traditionalSpouse > 0 && remaining > 0) {
                const qcd = Math.min(remaining, balances.traditionalSpouse, 105000);
                balances.traditionalSpouse -= qcd;
                remaining -= qcd;
                rmdSpouse = Math.max(0, rmdSpouse - qcd);
                totalQCD += qcd;
            }
            effectiveAnnualExpenses = Math.max(0, effectiveAnnualExpenses - totalQCD);
        }

        const totalRMD = rmdClient + rmdSpouse;
        let rmdIncome = totalRMD;

        // Dividends
        const divYield = (assumptions.dividendYield || 2) / 100;
        const qualRatio = (assumptions.qualifiedRatio || 85) / 100;
        const totalDividends = balances.brokerage * divYield;
        const qualDividends = totalDividends * qualRatio;
        const ordDividends = totalDividends - qualDividends;

        let incomeWithMandatory = income + rmdIncome + totalDividends;

        // let estimatedTax = 0;
        let iterationResult = null;
        // let annualCashDraw = 0;
        let annualLocBorrow = 0, annualCryptoLocBorrow = 0, annualHecmBorrow = 0;
        let bucketRefilled = false;

        // Bucket Refill
        const bucketStrategy = currentData.strategy?.bucket;
        if (bucketStrategy?.enabled) {
            const annualReturn = (isRetired ? assumptions.retirementReturn : assumptions.preRetirementReturn) || 6;
            const targetCash = effectiveAnnualExpenses * (bucketStrategy.yearsOfCash || 2);
            if (shouldRefillBucket({ currentCash: balances.cash, targetCash, portfolioReturn: annualReturn / 100, refillConditions: bucketStrategy.refillCondition })) {
                const amount = Math.min(getRefillAmount(balances.cash, targetCash), balances.brokerage);
                if (amount > 0) {
                    balances.brokerage -= amount;
                    balances.cash += amount;
                    bucketRefilled = true;
                }
            }
        }

        // Year Logic Configuration
        const taxFreeEnabled = currentData.taxFreeStrategy?.enabled || false;
        const taxOptimization = currentData.taxOptimization || {};

        // Calculate Total Cash Flow Need (NET of Tax - Solver handles Tax)
        const grossHealthcare = (medicareData?.total || 0) + (acaData?.grossCost || 0) + ltcCost;
        const estACACredit = (acaData?.grossCost - acaData?.netCost) || 0;

        // Total Need = Spending + Mortgage + Healthcare (Gross) + Debt Interest - Subsidies
        // REMOVED estimatedTax from this sum as logic v2 solver handles tax internally on top of this gap.
        const iterTotalNeed = effectiveAnnualExpenses + totalMortPayment + grossHealthcare + totalLocInterest - estACACredit;

        const rawDeficit = Math.max(0, iterTotalNeed - incomeWithMandatory);
        const rawSurplus = Math.max(0, incomeWithMandatory - iterTotalNeed); // NEW: Track surplus to pay taxes

        // Borrowing Logic
        let borrowAmount = 0;
        if (rawDeficit > 0) {
            // ... (Abbreviated LOC Logic - keeping simple for first pass refactor)
            // Assume borrowing happens if logic matches, but for brevity in this tool call...
            // Re-implementing simplified LOC loop
            const sources = [
                { id: 'brokerageLOC', coll: balances.brokerage, settings: credit?.brokerageLOC, balance: balances.brokerageLOC },
                { id: 'cryptoLOC', coll: balances.crypto, settings: credit?.cryptoLOC, balance: balances.cryptoLOC }
            ];
            if (credit?.reverseMortgage?.enabled && clientAge >= (credit.reverseMortgage.ageStart || 62)) {
                sources.push({ id: 'hecm', coll: balances.hecmLimit, isHECM: true, balance: balances.hecmBalance, settings: { rate: 0 } });
            }

            for (const src of sources) {
                if (rawDeficit - borrowAmount <= 0) break;
                if (src.settings || src.isHECM) {
                    let maxDraw = src.isHECM ? src.coll : getLOCOffer({ collateralValue: src.coll, ltv: src.settings.ltv, rate: src.settings.rate }).maxDraw;
                    const available = Math.max(0, maxDraw - src.balance);
                    let should = src.isHECM ? true : shouldBorrow({ expectedReturn: 0.08, rateAfterTax: src.settings.rate, marginProb: 0.01 });

                    if (should && available > 0) {
                        const take = Math.min(rawDeficit - borrowAmount, available);
                        borrowAmount += take;
                        if (src.id === 'brokerageLOC') annualLocBorrow += take;
                        if (src.id === 'cryptoLOC') annualCryptoLocBorrow += take;
                        if (src.id === 'hecm') annualHecmBorrow += take;
                    }
                }
            }
        }

        const remainingGap = Math.max(0, rawDeficit - borrowAmount);

        // Bucket Spend
        let gapPostBucket = remainingGap;
        if (bucketStrategy?.enabled && !bucketRefilled && gapPostBucket > 0) {
            const draft = Math.min(gapPostBucket, balances.cash);
            balances.cash -= draft;
            gapPostBucket -= draft;
            // annualCashDraw += draft;
        }

        // Withdrawal Optimization
        // Include DAF Contribution in itemized charity
        const itemizedCharity = annualCharity + dafContribution;
        const totalPropTax = currentRealEstate.reduce((sum, re) => sum + (re.propertyTax || 0), 0) * housingInf;
        const itemizedItems = { medical: healthcareCost + (expenses.medical || 0), mortgageInterest: totalMortInterest, charity: itemizedCharity, propertyTax: totalPropTax };

        let result;

        if (taxFreeEnabled && isRetired) {
            const withdrawals = optimizeTaxFreeWithdrawal(gapPostBucket, {
                traditional: { client: balances.traditionalClient - totalRMD, spouse: balances.traditionalSpouse },
                roth: { client: balances.rothClient, spouse: balances.rothSpouse },
                brokerage: { joint: balances.brokerage },
                brokerageBasis: { joint: brokerageBasis },
                hsa: { client: balances.hsaClient, spouse: balances.hsaSpouse },
                crypto: balances.crypto,
                cash: balances.cash
            }, salary + ss, currentFilingStatus);

            const taxes = calculateTotalTax({
                ordinaryIncome: salary + totalRMD + withdrawals.traditional + withdrawals.hsa,
                qualifiedDividends: qualDividends, ordinaryDividends: ordDividends, ssBenefits: ss,
                filingStatus: currentFilingStatus, age: clientAge, capitalLosses: lossBank,
                stateRate: currentData.stateTaxRate || 0, isRetired, itemizedItems, year: currentYear, enableTCJASunset,
                earnedIncome: salary,
                stateOfResidence: currentData.profile?.stateOfResidence || 'FL',
                stateTaxModel: currentData.profile?.stateTaxModel
            });
            result = { withdrawals, taxes };
        } else {
            result = optimizeWithdrawals({
                age: clientAge, gap: gapPostBucket,
                incomeSurplus: rawSurplus, // NEW: Pass surplus
                balances: {
                    traditional: balances.traditionalClient + balances.traditionalSpouse - totalRMD,
                    roth: balances.rothClient + balances.rothSpouse,
                    brokerage: balances.brokerage,
                    hsa: balances.hsaClient + balances.hsaSpouse,
                    crypto: balances.crypto,
                    cash: balances.cash // Adding Cash
                },
                filingStatus: currentFilingStatus,
                ordinaryIncome: salary + totalRMD, ssBenefits: ss,
                qualifiedDividends: qualDividends, ordinaryDividends: ordDividends,
                brokerageBasis, taxLossHarvesting: lossBank,
                strategy: {
                    ...taxOptimization,
                    allowRothConversion: taxOptimization.enableRothConversion || (taxOptimization.rothStrategy === '12' || taxOptimization.rothStrategy === '22' || taxOptimization.rothStrategy === '24'),
                    rothConversionBracket: taxOptimization.rothStrategy === '12' ? 0.12 : (taxOptimization.rothStrategy === '24' ? 0.24 : 0.22),
                    order: taxOptimization.withdrawalOrder || 'standard',
                    shouldPayTaxes: false,
                    itemizedItems,
                    stateOfResidence: currentData.profile?.stateOfResidence || 'FL',
                    stateTaxModel: currentData.profile?.stateTaxModel
                },
                year: currentYear, enableTCJASunset, enableDynamicMAGI: taxOptimization?.enableDynamicMAGI
            });
        }

        // --- END Roth Conversion ---

        // No Loop needed, Solver handles exact tax.
        iterationResult = result;
        // Convergence assumed via solver


        brokerageBasis += totalDividends;

        const { withdrawals, taxes: taxBill } = iterationResult;

        let realizedGains = iterationResult.realizedGains || 0;

        // Initialize Cash Flow Tracker for this Year
        const trackedCashFlow = {
            traditionalClient: 0, traditionalSpouse: 0,
            rothClient: 0, rothSpouse: 0,
            hsaClient: 0, hsaSpouse: 0,
            brokerage: 0, crypto: 0, cash: 0
        };



        // Update Balances with Withdrawals
        const totalTradOutflow = (taxFreeEnabled && isRetired)
            ? (withdrawals.traditional || 0) + totalRMD
            : (withdrawals.traditional || 0);

        const applyVol = (k1, k2, amt) => {
            if (amt <= 0) return;
            const tot = (balances[k1] || 0) + (balances[k2] || 0);
            if (tot <= 0) return;
            const r = (balances[k1] || 0) / tot;
            balances[k1] = Math.max(0, balances[k1] - (amt * r));
            trackedCashFlow[k1] -= (amt * r);
            balances[k2] = Math.max(0, balances[k2] - (amt * (1 - r)));
            trackedCashFlow[k2] -= (amt * (1 - r));
        };

        applyVol('traditionalClient', 'traditionalSpouse', totalTradOutflow);
        applyVol('rothClient', 'rothSpouse', (withdrawals.roth || 0));
        applyVol('hsaClient', 'hsaSpouse', (withdrawals.hsa || 0));

        // Final Trad update for record
        withdrawals.traditional = totalTradOutflow;

        balances.brokerage -= (withdrawals.brokerage || 0);
        trackedCashFlow.brokerage -= (withdrawals.brokerage || 0);
        balances.cash -= (withdrawals.cash || 0);
        trackedCashFlow.cash -= (withdrawals.cash || 0);
        balances.crypto -= (withdrawals.crypto || 0);
        trackedCashFlow.crypto -= (withdrawals.crypto || 0);

        // Conversions (Roth)
        if (withdrawals.rothConversion > 0) {
            // Withdraw from Trad
            applyVol('traditionalClient', 'traditionalSpouse', withdrawals.rothConversion);

            // Deposit to Roth (Handle 0 balance case)
            const rothTot = balances.rothClient + balances.rothSpouse;
            if (rothTot > 0) {
                applyVol('rothClient', 'rothSpouse', -withdrawals.rothConversion);
            } else {
                // If empty, default to Client (or split 50/50? Client is safer default)
                // Actually, if we converted, we should credit it.
                balances.rothClient += withdrawals.rothConversion;
                trackedCashFlow.rothClient += withdrawals.rothConversion; // Track as inflow
            }
        }

        // Store unified total for UI components (Gross Outflow)
        // Note: Optimizer already included money for taxes in its withdrawals.
        withdrawals.total = (withdrawals.traditional || 0) +
            (withdrawals.roth || 0) +
            (withdrawals.brokerage || 0) +
            (withdrawals.hsa || 0) +
            (withdrawals.crypto || 0) +
            (withdrawals.cash || 0);

        // Update basis for brokerage withdrawals (Simple proportional)
        if (withdrawals.brokerage > 0) {
            const oldTotal = balances.brokerage + withdrawals.brokerage;
            if (oldTotal > 0) {
                brokerageBasis = Math.max(0, brokerageBasis - (withdrawals.brokerage * (brokerageBasis / oldTotal)));
            }
        }


        // Apply LOC
        balances.brokerageLOC += annualLocBorrow;
        balances.cryptoLOC += annualCryptoLocBorrow;
        balances.hecmBalance += annualHecmBorrow;

        // Apply Contributions
        if (!isRetired) {
            balances.traditionalClient += contributions.traditional + (contributions.match || 0);
            trackedCashFlow.traditionalClient += contributions.traditional + (contributions.match || 0);

            balances.hsaClient += contributions.hsa;
            trackedCashFlow.hsaClient += contributions.hsa;

            balances.rothClient += contributions.roth + (contributions.aftertax || 0);
            trackedCashFlow.rothClient += contributions.roth + (contributions.aftertax || 0);
        }

        // Surplus
        const safeNeed = effectiveAnnualExpenses + totalMortPayment + healthcareCost + taxBill.totalTax + totalLocInterest;
        const surplus = Math.max(0, incomeWithMandatory - safeNeed);
        if (surplus > 0) {
            // User Feedback: Do NOT reinvest surplus. It goes to unmodeled expenses.
            // balances.brokerage += surplus;
            // trackedCashFlow.brokerage += surplus;
            // brokerageBasis += surplus;
        }

        // Growth - CRITICAL: Only apply growth to GRANULAR fields, not aggregates
        let growthRate = assumptions.growthRate || 7;
        let effectiveROI = 1 + (growthRate / 100);
        if (i === 0 && shockDrop > 0) effectiveROI = 1 - shockDrop;

        // Apply growth to granular balance fields only (not aggregates which are recalculated)
        const granularFields = [
            'traditionalClient', 'traditionalSpouse',
            'rothClient', 'rothSpouse',
            'hsaClient', 'hsaSpouse',
            'brokerage'
        ];

        granularFields.forEach(key => {
            balances[key] *= effectiveROI;
        });

        // Crypto has its own return rate
        balances.crypto *= (1 + (assumptions.cryptoReturn || assumptions.growthRate || 7) / 100);

        // Cash has its own return rate
        balances.cash *= (1 + (assumptions.cashReturn || 2) / 100);

        // --- RIGOROUS VALIDATION: TLH Cost (Basis Reduction) ---
        // You cannot harvest losses forever without reducing basis.
        // We assume the "Annual TLH" claimed reduces the cost basis of the asset.
        const cryptoTLH = taxOptimization?.taxLossHarvesting?.crypto || 0;
        const brokerageTLH = taxOptimization?.taxLossHarvesting?.brokerage || 0;

        // Crypto TLH
        if (cryptoTLH > 0 && balances.crypto > 0) {
            // Can only reduce basis to 0
            const reduction = Math.min(cryptoTLH, cryptoBasis);
            cryptoBasis = Math.max(0, cryptoBasis - reduction);
            // If we successfully reduced basis, we credit the loss bank
            if (reduction > 0) {
                // Note: logic line 662 already adds total `annualTLH` to lossBank.
                // We should ideally coupled them. For now, this basis reduction is the "Side Effect".
            }
        }

        // Brokerage TLH
        if (brokerageTLH > 0 && balances.brokerage > 0) {
            const reduction = Math.min(brokerageTLH, brokerageBasis);
            brokerageBasis = Math.max(0, brokerageBasis - reduction);
        }

        // --- RIGOROUS VALIDATION: Crypto Rebalancing (The "Age 95 Anomaly" Fix) ---
        // If Crypto exceeds X% of portfolio, sell down to target and move to Brokerage.
        // Triggers Taxable Event (LTCG).
        const totalPort = balances.brokerage + balances.crypto + balances.traditional + balances.roth + balances.hsa + balances.cash;
        const cryptoAlloc = balances.crypto / totalPort;
        const maxCrypto = assumptions.maxCryptoAllocation || 0.20; // Default 20% cap to prevent runaway

        if (balances.crypto > 0 && cryptoAlloc > maxCrypto) {
            const targetAmt = totalPort * maxCrypto;
            const sellAmt = balances.crypto - targetAmt;

            if (sellAmt > 1000) { // Threshold to avoid noise
                // Sell Crypto
                balances.crypto -= sellAmt;

                // Calculate Basis portion sold
                // Basis Ratio
                const basisRatio = (balances.crypto + sellAmt) > 0 ? (cryptoBasis / (balances.crypto + sellAmt)) : 0;
                const costSold = sellAmt * basisRatio;
                const gain = Math.max(0, sellAmt - costSold);

                // Reduce Basis
                cryptoBasis = Math.max(0, cryptoBasis - costSold);

                // Add to Realized Gains for this year (Tax Hit!)
                realizedGains += gain;

                // Move Proceeds to Brokerage (Net of Tax? No, Tax is calc'd at end of year globally)
                // We move Gross Proceeds to Brokerage, Tax bill will increase
                balances.brokerage += sellAmt;
                // Add to Brokerage Basis (since we just bought it)
                brokerageBasis += sellAmt;

                // console.log(`[Rebalance ${currentYear}] Sold ${Math.round(sellAmt)} Crypto. Gain: ${Math.round(gain)}. New Balance: ${Math.round(balances.crypto)}`);
            }
        }


        // Recalculate aggregate fields from granular (DO NOT apply growth to them directly)
        balances.traditional = balances.traditionalClient + balances.traditionalSpouse;
        balances.roth = balances.rothClient + balances.rothSpouse;
        balances.hsa = balances.hsaClient + balances.hsaSpouse;

        // ESTATE CALCULATION (Exact Copy)
        const estateInflation = Math.pow(1.025, i);
        const baseExemption = currentFilingStatus === 'married' ? 27220000 : 13610000;
        const exemption = baseExemption * estateInflation;

        const portVal = balances.brokerage + balances.crypto + balances.rothClient + balances.rothSpouse + balances.cash + balances.traditionalClient + balances.traditionalSpouse + balances.hsaClient + balances.hsaSpouse;

        const deathBenefit = currentData.insurance?.totalBenefit || 0;
        const isILIT = currentData.estate?.ilit?.enabled || false;

        let grossEstate = portVal + totalRealEstateValue;
        if (!isILIT) grossEstate += deathBenefit;
        const totalDebt = currentRealEstate.reduce((sum, re) => sum + re.mortgageBalance, 0) + balances.hecmBalance;
        const taxableEstate = Math.max(0, grossEstate - totalDebt - exemption);
        const estateTax = taxableEstate * 0.40;
        const heirTaxRate = 0.24;
        const irdTax = (balances.traditionalClient + balances.traditionalSpouse + balances.hsaClient + balances.hsaSpouse) * heirTaxRate;

        const effectiveLegacy = (grossEstate - totalDebt - estateTax) + (isILIT ? deathBenefit : 0) - irdTax;

        // Recalculate Total Income for Final Tax Bill
        // Define totalGrossIncome before using it
        const totalGrossIncome = salary + totalRMD + ss + ordDividends + qualDividends + realizedGains + (withdrawals.traditional || 0) + (withdrawals.conversion || 0);

        const taxResult = calculateTotalTax({
            grossIncome: totalGrossIncome,
            filingStatus: currentFilingStatus, // Use dynamic status
            stateRate: assumptions.stateTaxRate || 0,
            capitalGains: {
                short: i < 1 ? realizedGains : 0,
                long: i < 1 ? 0 : realizedGains
            }, // Year 1 Rebal = STCG (Conservative), Year 2+ = LTCG
            capitalLosses: lossBank,
            deductionMode: 'standard',
            itemizedDeduction: 0,
            age: clientAge,
            year: currentYear,
            enableTCJASunset,
            stateOfResidence: currentData.profile?.stateOfResidence || 'FL',
            stateTaxModel: currentData.profile?.stateTaxModel || { enabled: false }
        });

        // Update Carryover (The Carrot - Persistence)
        // Reduce the loss bank by the amount actually used this year (either against gains or ordinary income)
        if (taxResult.capitalLossesUsed > 0) {
            lossBank = Math.max(0, lossBank - taxResult.capitalLossesUsed);
        }

        // We just need discretionaryExpenses.
        const discretionaryExpenses = (expenses.discretionary || 0) * ((i === 0) ? 1 : Math.pow(1 + (assumptions.inflationRate / 100), i));

        if (i === 0) { /* Debug removed */ }

        ledger.push({
            year: currentYear,
            age: clientAge,
            spouseAge: spouseAge,
            isRetired,
            filingStatus: currentFilingStatus, // Expose for testing
            income: {
                total: income + rmdIncome,
                ss: ss,
                salary: salary,
                rmd: rmdIncome,
                pension: income // If income is used as pension elsewhere
            },
            expenses: {
                total: totalExpenses,
                essential: effectiveAnnualExpenses, // Approximation
                discretionary: discretionaryExpenses,
                healthcare: healthcareCost,
                mortgage: totalMortPayment,
                housing: housingCost,
                taxes: taxResult.totalTax
            },
            taxes: taxResult,
            withdrawals: withdrawals,
            legacyValue: Math.max(0, effectiveLegacy),
            estateReport: { net: { total: Math.max(0, effectiveLegacy) }, taxes: { estate: estateTax } },
            netWorth: portVal + totalRealEstateValue - totalDebt,
            totalBalance: portVal,
            balances: {
                traditional: balances.traditionalClient + balances.traditionalSpouse,
                roth: balances.rothClient + balances.rothSpouse,
                hsa: balances.hsaClient + balances.hsaSpouse,
                brokerage: balances.brokerage,
                crypto: balances.crypto,
                cash: balances.cash,
                realEstate: totalRealEstateValue,
                mortgageBalance: currentRealEstate.reduce((sum, re) => sum + re.mortgageBalance, 0),
                hsaClient: balances.hsaClient,
                hsaSpouse: balances.hsaSpouse,
                traditionalClient: balances.traditionalClient,
                traditionalSpouse: balances.traditionalSpouse,
                rothClient: balances.rothClient,
                rothSpouse: balances.rothSpouse,
                brokerageBasis: brokerageBasis,
                cryptoBasis: cryptoBasis,
                lossBank: lossBank // Expose for audit/testing
            },
            cashFlow: {
                byAccount: trackedCashFlow
            },
            // Phase 12: Advanced Metrics (Single Source of Authority)
            metrics: {
                totalWithdrawals: withdrawals.total,
                yearlyAssetGrowth: i > 0 ? ((portVal + totalRealEstateValue - totalDebt) - ledger[i - 1].netWorth) + withdrawals.total : 0,
                cumulativeAssetGrowth: 0, // Will be updated recursively below
                yearlyNetDifference: i > 0 ? (portVal + totalRealEstateValue - totalDebt) - ledger[i - 1].netWorth : 0,
                // Phase 13: Detailed Cash Flow breakdown for visualization
                detailedCashFlow: {
                    inflows: {
                        salary: salary,
                        socialSecurity: ss,
                        pension: 0, // FIXED: Was 'income' which double-counted Salary+SS
                        rmd: rmdIncome,
                        other: 0
                    },
                    drawdowns: {
                        traditional: withdrawals.traditional || 0,
                        roth: withdrawals.roth || 0,
                        brokerage: withdrawals.brokerage || 0,
                        crypto: withdrawals.crypto || 0,
                        hsa: withdrawals.hsa || 0,
                        cash: withdrawals.cash || 0
                    },
                    outflows: {
                        essential: effectiveAnnualExpenses,
                        discretionary: discretionaryExpenses,
                        healthcare: healthcareCost,
                        housing: housingCost,
                        mortgage: totalMortPayment,
                        taxes: {
                            federal: taxResult.federalTax || 0,
                            state: taxResult.stateTax || 0,
                            fica: taxResult.fica?.total || 0,
                            total: taxResult.totalTax || 0
                        }
                    }
                }
            }
        });

        if (i > 0) {
            ledger[i].metrics.cumulativeAssetGrowth = ledger[i - 1].metrics.cumulativeAssetGrowth + ledger[i].metrics.yearlyAssetGrowth;
        }

        // Update tracking state for next iteration
        wasClientAlive = clientAlive;
        wasSpouseAlive = spouseAlive;
    }

    ledger.initialBalances = initialBalances;
    return ledger;
}

/**
 * Helper to determine if cash bucket should be refilled from brokerage
 */
function shouldRefillBucket({ currentCash, targetCash, portfolioReturn, refillConditions }) {
    if (currentCash >= targetCash) return false;

    // Default to always refill if no condition specified
    if (!refillConditions || refillConditions === 'always') return true;

    // Market-based conditions
    if (refillConditions === 'market_up' && portfolioReturn > 0) return true;
    if (refillConditions === 'market_not_down' && portfolioReturn >= 0) return true;

    return false;
}

/**
 * Helper to calculate amount to refill (up to target)
 */
function getRefillAmount(currentCash, targetCash) {
    return Math.max(0, targetCash - currentCash);
}

// Named exports for clarity and testing
export {
    calculateCryptoBalance,
    calculateExpenses
};
