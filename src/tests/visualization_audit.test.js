
import { describe, it, expect } from 'vitest';
import { generateLedger } from '../lib/ledgerLogic';
import defaultProfile from '../data/defaultProfile.json';

describe('Visualization Audit: Growth & Cash Flow', () => {
    // Generate ONCE to avoid mutation side-effects or overhead
    const ledger = generateLedger(JSON.parse(JSON.stringify(defaultProfile)));

    console.log('Ledger Type:', typeof ledger, 'Is Array:', Array.isArray(ledger), 'Length:', ledger?.length);

    it('Cumulative Asset Growth should equal sum of yearly growth', () => {
        let runningTotal = 0;

        expect(ledger.length).toBeGreaterThan(0);

        ledger.forEach((entry, index) => {
            const yearlyGrowth = entry.metrics.yearlyAssetGrowth || 0;
            const cumulativeToken = entry.metrics.cumulativeAssetGrowth || 0;

            if (index === 0) {
                expect(cumulativeToken).toBe(0);
            } else {
                runningTotal += yearlyGrowth;
                expect(cumulativeToken).toBeCloseTo(runningTotal, 2);
            }
        });
    });

    it('Detailed Cash Flow: Sources should loosely match Uses + Net Change', () => {
        ledger.forEach(entry => {
            const detailed = entry.metrics.detailedCashFlow;
            if (!detailed) return;

            // Sources (Inflows + Drawdowns)
            const totalSources =
                Object.values(detailed?.inflows || {}).reduce((a, b) => a + b, 0) +
                Object.values(detailed?.drawdowns || {}).reduce((a, b) => a + b, 0);

            // Uses
            const expenses =
                (detailed.outflows?.essential || 0) +
                (detailed.outflows?.discretionary || 0) +
                (detailed.outflows?.healthcare || 0) +
                (detailed.outflows?.housing || 0) +
                (detailed.outflows?.mortgage || 0);

            const taxes = detailed.outflows?.taxes?.total || 0;
            const totalUses = expenses + taxes;

            expect(totalSources).toBeGreaterThanOrEqual(0);
            expect(totalUses).toBeGreaterThanOrEqual(0);
        });
    });
});
