/**
 * MAGI Monitor & Optimizer
 *
 * Real-time Modified AGI tracking for ACA subsidies and IRMAA optimization
 * Critical for tax-free retirement strategy
 */

import { usePlan } from '../../contexts/PlanContext';
import { IRMAA_BRACKETS } from '../../lib/taxEngine';

export default function MAGIMonitor() {
    const { ledger, planData } = usePlan();

    // Get current year data
    const currentYear = ledger?.[0] || {};
    const currentAge = planData.people?.[0]?.age || 0;
    const isRetired = currentAge >= (planData.people?.[0]?.retirementAge || 67);
    const filingStatus = planData.profile?.filingStatus || 'married';

    // Calculate MAGI (AGI + tax-exempt interest + excluded foreign income)
    const agi = currentYear.taxes?.agi || 0;
    const magi = agi; // Simplified - in real scenario would add back exclusions

    // ACA Subsidy Thresholds (% of Federal Poverty Level)
    const fplSingle = 15060; // 2025 estimate
    const fplMarried = 20440; // 2025 estimate
    const fpl = filingStatus === 'married' ? fplMarried : fplSingle;

    const magiAsPercentFPL = (magi / fpl) * 100;
    const acaSubsidyMin = 100; // % FPL
    const acaSubsidyMax = 400; // % FPL
    const qualifiesForACA = magiAsPercentFPL >= acaSubsidyMin && magiAsPercentFPL <= acaSubsidyMax;

    // IRMAA Brackets (simplified - would need age 65+ check)
    const irmaaAge = currentAge >= 65;
    const irmaaBrackets = IRMAA_BRACKETS[filingStatus] || IRMAA_BRACKETS.married;

    let currentIRMAABracket = null;
    let nextIRMAABracket = null;
    let distanceToNextBracket = 0;

    if (irmaaAge) {
        for (let i = 0; i < irmaaBrackets.length; i++) {
            const bracket = irmaaBrackets[i];
            if (magi <= bracket.max || bracket.max === Infinity) {
                currentIRMAABracket = bracket;
                nextIRMAABracket = irmaaBrackets[i + 1] || null;
                if (nextIRMAABracket) {
                    distanceToNextBracket = nextIRMAABracket.max - magi;
                }
                break;
            }
        }
    }

    // Calculate optimal MAGI targets
    const optimalMAGIForACA = fpl * 1.5; // 150% FPL = sweet spot for subsidies
    const magiRoomToMaxACA = (fpl * acaSubsidyMax) - magi;
    const magiRoomToNextIRMAA = distanceToNextBracket;

    // Roth conversion opportunity (use MAGI room without penalties)
    const rothConversionRoom = Math.min(
        magiRoomToMaxACA > 0 ? magiRoomToMaxACA : Infinity,
        magiRoomToNextIRMAA > 0 ? magiRoomToNextIRMAA : Infinity
    );

    // 2-Year Lookback (IRMAA uses income from 2 years ago)
    const lookbackYear = ledger?.[2] || null; // 2 years ago
    const lookbackMAGI = lookbackYear?.taxes?.agi || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    📊 MAGI Monitor & Optimizer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Modified Adjusted Gross Income tracking for ACA subsidies and IRMAA optimization
                </p>
            </div>

            {!isRetired ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                    <div className="text-4xl mb-3">💼</div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Active During Retirement</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        MAGI monitoring becomes critical after retirement to maximize ACA subsidies and minimize IRMAA surcharges.
                    </p>
                </div>
            ) : (
                <>
                    {/* Current MAGI Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current MAGI</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                ${magi.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                {magiAsPercentFPL.toFixed(0)}% of Federal Poverty Level
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${qualifiesForACA
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                : 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
                            }`}>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ACA Subsidy Status</div>
                            <div className={`text-2xl font-bold ${qualifiesForACA
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                {qualifiesForACA ? '✅ Qualified' : '❌ Not Qualified'}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                {qualifiesForACA
                                    ? `${magiRoomToMaxACA > 0 ? `$${magiRoomToMaxACA.toLocaleString()} room` : 'At max'}`
                                    : magiAsPercentFPL < acaSubsidyMin ? 'MAGI too low' : 'MAGI too high'}
                            </div>
                        </div>

                        {irmaaAge && currentIRMAABracket && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">IRMAA Surcharge</div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    +${currentIRMAABracket.surcharge}/mo
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                    {nextIRMAABracket
                                        ? `${distanceToNextBracket > 0 ? `$${distanceToNextBracket.toLocaleString()} to next tier` : 'At tier'}`
                                        : 'Highest tier'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACA Subsidy Optimizer */}
                    {qualifiesForACA && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border-2 border-green-300 dark:border-green-700">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">💚</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-green-900 dark:text-green-300 mb-2 text-lg">
                                        ACA Premium Tax Credit Qualified!
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Current MAGI</div>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                ${magi.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {magiAsPercentFPL.toFixed(0)}% FPL
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Roth Conversion Room</div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                ${Math.max(0, magiRoomToMaxACA).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                Before losing subsidy
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-800 text-sm">
                                        <div className="font-semibold text-gray-900 dark:text-white mb-1">💡 Strategy:</div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            Keep MAGI between {acaSubsidyMin}-{acaSubsidyMax}% FPL (${(fpl * (acaSubsidyMin / 100)).toLocaleString()} - ${(fpl * (acaSubsidyMax / 100)).toLocaleString()}) to maximize ACA subsidies.
                                            Use Roth withdrawals (invisible to MAGI) instead of Traditional IRA when at risk of exceeding {acaSubsidyMax}% FPL.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* IRMAA Cliff Detector */}
                    {irmaaAge && nextIRMAABracket && distanceToNextBracket > 0 && distanceToNextBracket < 50000 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg border-2 border-yellow-400 dark:border-yellow-600">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">⚠️</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2 text-lg">
                                        IRMAA Cliff Warning!
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Current Surcharge</div>
                                            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                                +${currentIRMAABracket.surcharge}/mo
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                ${(currentIRMAABracket.surcharge * 12).toLocaleString()}/year
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Next Tier Surcharge</div>
                                            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                                +${nextIRMAABracket.surcharge}/mo
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                ${(nextIRMAABracket.surcharge * 12).toLocaleString()}/year
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Distance to Cliff</div>
                                            <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                                ${distanceToNextBracket.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                MAGI increase triggers +${(nextIRMAABracket.surcharge - currentIRMAABracket.surcharge) * 12}/yr
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-300 dark:border-yellow-700 text-sm">
                                        <div className="font-semibold text-gray-900 dark:text-white mb-1">🚨 Action Required:</div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            You&apos;re only ${distanceToNextBracket.toLocaleString()} away from a ${((nextIRMAABracket.surcharge - currentIRMAABracket.surcharge) * 12).toLocaleString()}/year Medicare surcharge increase!
                                            Use Roth withdrawals instead of Traditional IRA to avoid crossing the IRMAA threshold.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2-Year Lookback Tracker */}
                    {irmaaAge && lookbackYear && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>🔄</span>
                                <span>2-Year Lookback (IRMAA Uses Income from 2 Years Ago)</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        MAGI from {lookbackYear.age - currentAge + currentAge - 2} years ago (Age {lookbackYear.age})
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        ${lookbackMAGI.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                        This is what Medicare uses for your current IRMAA
                                    </div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded border border-purple-200 dark:border-purple-800">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Today&apos;s MAGI (Will affect IRMAA in 2 years)
                                    </div>
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        ${magi.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                        Plan ahead to minimize future Medicare costs
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-sm">
                                <div className="font-semibold text-gray-900 dark:text-white mb-1">📝 Important:</div>
                                <p className="text-gray-700 dark:text-gray-300">
                                    IRMAA surcharges are based on your MAGI from 2 years ago. Today&apos;s Roth conversions and withdrawals will affect
                                    your Medicare premiums in {currentAge + 2}, so plan accordingly!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Optimal MAGI Target */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 p-4 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-lg mb-1">🎯 Optimal MAGI Target</div>
                                <div className="text-sm text-indigo-100">
                                    Maximize benefits while minimizing surcharges
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">
                                    ${Math.min(optimalMAGIForACA, nextIRMAABracket?.max || Infinity).toLocaleString()}
                                </div>
                                <div className="text-xs text-indigo-100">
                                    {qualifiesForACA ? '150% FPL (max ACA value)' : 'Just below next IRMAA tier'}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
