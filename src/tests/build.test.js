/**
 * Build Validation Tests
 *
 * Verifies that the production build output is correct and ready for deployment.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

describe('Build Output Validation', () => {
  beforeAll(() => {
    // Run build if dist doesn't exist or is stale
    if (!fs.existsSync(DIST_DIR)) {
      console.log('Building project for tests...');
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    }
  });

  it('should have a dist/ folder', () => {
    expect(fs.existsSync(DIST_DIR)).toBe(true);
  });

  it('should have an index.html file', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it('should have an assets/ folder with JS files', () => {
    const assetsDir = path.join(DIST_DIR, 'assets');
    expect(fs.existsSync(assetsDir)).toBe(true);

    const files = fs.readdirSync(assetsDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);
  });

  it('index.html should use relative paths (start with ./)', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Check that script and CSS references use relative paths
    // Vite with base: './' should produce: ./assets/index-xxx.js
    expect(content).toMatch(/src="\.\/assets\//);
    expect(content).toMatch(/href="\.\/assets\//);
  });

  it('should NOT have absolute paths starting with /', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Should NOT have paths like /assets/ (absolute)
    // But allow things like "https://" which are valid
    const absoluteAssetPattern = /(?:src|href)="\/assets\//;
    expect(content).not.toMatch(absoluteAssetPattern);
  });
});
