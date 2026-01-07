
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConeChart from '../components/ConeChart';
import ConfidenceBand from '../components/strategy/ConfidenceBand';

// Mock Chart.js to avoid canvas errors in JSDOM,
// OR simpler: just try to render and catch basic JS errors.
// Ideally we want to test if config generation throws.

// Mock data
const mockPercentiles = {
    p90: [100, 110, 120],
    p75: [90, 95, 100],
    p50: [80, 85, 90],
    p25: [70, 75, 80],
    p10: [60, 65, 70]
};

const mockYears = [2025, 2026, 2027];

// Deeply mock react-chartjs-2 because Canvas API is flaky in JSDOM
// But we want to fail if OPTIONS are invalid structure.
// So we want real Chart.js execution?
// Chart.js usually validates options on render.
// For now, let's just render the component.

describe('Chart Rendering Regression Test', () => {

    it('renders ConfidenceBand without crashing', () => {
        const { container } = render(
            <ConfidenceBand percentiles={mockPercentiles} years={mockYears} />
        );
        expect(container).toBeTruthy();
    });

    it('renders ConeChart without crashing', () => {
        const { container } = render(
            <ConeChart percentiles={mockPercentiles} startAge={60} />
        );
        expect(container).toBeTruthy();
    });

});
