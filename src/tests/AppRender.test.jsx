/* eslint-env node */
// import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from '../App';

// Mock Worker
class Worker {
    constructor(stringUrl) {
        this.url = stringUrl;
        this.onmessage = () => { };
    }
    postMessage(/* msg */) {
        this.onmessage({ data: { type: 'result', results: { successRate: 1, finalBalances: { median: 1000000 } } } });
    }
    terminate() { }
}
global.Worker = Worker;

// Mock HTMLCanvasElement.prototype.getContext to appease Chart.js
HTMLCanvasElement.prototype.getContext = () => {
    return {
        fillRect: () => { },
        clearRect: () => { },
        getImageData: (x, y, w, h) => {
            return {
                data: new Array(w * h * 4)
            };
        },
        putImageData: () => { },
        createImageData: () => [],
        createPattern: () => null,
        setTransform: () => { },
        drawImage: () => { },
        save: () => { },
        fillText: () => { },
        restore: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        closePath: () => { },
        stroke: () => { },
        translate: () => { },
        scale: () => { },
        rotate: () => { },
        arc: () => { },
        fill: () => { },
        measureText: () => {
            return { width: 0 };
        },
        transform: () => { },
        rect: () => { },
        clip: () => { },
    };
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock chart.js components
vi.mock('react-chartjs-2', () => ({
    Chart: () => null,
    Bar: () => null,
    Line: () => null,
    Pie: () => null,
    Doughnut: () => null,
}));

vi.mock('chart.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Chart: {
            ...actual.Chart,
            register: () => { }
        }
    };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
    writable: true
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('App Root', () => {
    it('renders without crashing', () => {
        // We expect this to either throw or logging an error if there is a crash
        const { container } = render(<App />);
        expect(container).toBeTruthy();
        // Check if main content renders (e.g. Header text we saw earlier)
        expect(container.innerHTML).toContain('The Architect');
    });
});
