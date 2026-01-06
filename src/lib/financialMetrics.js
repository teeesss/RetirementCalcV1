export function calculateBreakEvenRate({
    conversionAmount,
    currentTaxCost,
    yearsToGrowth,
    growthRate,
    capitalGainsRate = 0.15
}) {
    // Scenario A: Keep in Traditional + Invest Tax Cost in Brokerage
    // Future Value of Traditional (Pre-Tax)
    const futureTradValue = conversionAmount * Math.pow(1 + growthRate, yearsToGrowth);

    // Future Value of Tax Cost (Invested in Brokerage)
    // Brokerage grows, then pays Capital Gains Tax on growth
    const futureBrokerageValueRaw = currentTaxCost * Math.pow(1 + growthRate, yearsToGrowth);
    const brokerageGrowth = futureBrokerageValueRaw - currentTaxCost;
    const futureBrokerageAfterTax = futureBrokerageValueRaw - (brokerageGrowth * capitalGainsRate);

    // Scenario B: Convert to Roth
    // Future Value of Roth (Tax Free)
    const futureRothValue = conversionAmount * Math.pow(1 + growthRate, yearsToGrowth);

    // Equation:
    // FutureRoth = (FutureTrad * (1 - BreakEvenRate)) + FutureBrokerageAfterTax
    // We solve for BreakEvenRate (BER):
    // FutureRoth - FutureBrokerageAfterTax = FutureTrad * (1 - BER)
    // (FutureRoth - FutureBrokerageAfterTax) / FutureTrad = 1 - BER
    // BER = 1 - ((FutureRoth - FutureBrokerageAfterTax) / FutureTrad)

    if (futureTradValue === 0) return 0; // Avoid division by zero

    const breakEvenRate = 1 - ((futureRothValue - futureBrokerageAfterTax) / futureTradValue);

    return breakEvenRate;
}
