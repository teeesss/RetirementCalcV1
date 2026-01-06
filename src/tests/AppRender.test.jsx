import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock Web Worker
class Worker {
    constructor(stringUrl) {
        this.url = stringUrl;
        this.onmessage = () => { };
    }
    postMessage(msg) {
        this.onmessage({ data: { type: 'result', results: { successRate: 1, finalBalances: { median: 1000000 } } } });
    }
    terminate() { }
}
global.Worker = Worker;

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

afterEach(() => {
    vi.restoreAllMocks();
});

describe('App Root', () => {
    it('renders without crashing', () => {
        // We expect this to either throw or logging an error if there is a crash
        const { container } = render(<App />);
        expect(container).toBeTruthy();
        // Check if main content renders (e.g. Header text we saw earlier)
        expect(container.innerHTML).toContain('Retirement Planner');
    });
});
