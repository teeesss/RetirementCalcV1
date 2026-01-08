# LLM Test Guardian Rules

**Purpose**: Ensure test quality and prevent "self-lying tests" where tests are weakened to pass rather than fixing actual bugs.

## Core Principles

### 1. NEVER Weaken Tests to Make Them Pass

**Forbidden Actions:**
- ❌ Widening tolerances (e.g., changing `abs: 50` to `abs: 500`)
- ❌ Deleting assertions or invariant checks
- ❌ Reducing test coverage
- ❌ Adding `|| true` or similar logic to bypass failures
- ❌ Commenting out failing tests
- ❌ Changing `expect(x).toBe(y)` to `expect(x).toBeCloseTo(y, -5)` without justification

**Allowed Exception**: If tolerance widening is genuinely necessary due to legitimate precision limits, you MUST:
1. Provide written justification in code comments
2. Add a NEW compensating invariant test that validates correctness another way
3. Document the change in the commit message

### 2. Fix Code, Not Tests

When a test fails:
1. **Minimize**: Create smallest reproduction case
2. **Diagnose**: Identify root cause in production code
3. **Fix**: Correct the engine logic
4. **Strengthen**: Add invariant that would catch similar bugs

**Example Workflow:**
```
Test fails → Found NaN in discretionary → Root cause: undefined inflationRate
→ Fixed with safeNum() → Added invariant check for all NaN values
```

### 3. Single Authoritative Source

**Rule**: Do NOT duplicate constants, thresholds, or calculation logic across files.

**Violations:**
```javascript
// ❌ BAD: Tax brackets defined in multiple places
// File A:
const BRACKET_12 = 47150;
// File B:
const TOP_12_PERCENT = 47150;
```

**Correct:**
```javascript
// ✅ GOOD: Single source in constants/
import { TAX_BRACKETS_2025 } from '../lib/constants/taxBrackets.js';
const limit = TAX_BRACKETS_2025.single[0.12];
```

### 4. Monte Carlo Must Be Deterministic

**Rule**: All Monte Carlo tests MUST use seeded RNG for repeatability.

**Example:**
```javascript
// ❌ BAD: Flaky tests
const results = runMonteCarlo({ iterations: 10000 });

// ✅ GOOD: Deterministic
const results = runMonteCarlo({
    iterations: 10000,
    seed: 12345  // Fixed seed for testing
});
```

### 5. Required Test Structure for Bug Fixes

Every bug fix MUST include:

1. **Regression Test** (fails before fix)
```javascript
it('should not create NaN in discretionary expenses', () => {
    const profile = { ...defaultProfile, assumptions: {} }; // No inflationRate
    const ledger = generateLedger(profile);
    assertNoInvalidNumbers(ledger);
});
```

2. **Invariant Test** (prevents similar bugs)
```javascript
it('should have no NaN in ANY ledger field', () => {
    // This catches the whole class of "undefined math" bugs
    ledger.forEach(year => assertNoInvalidNumbers(year));
});
```

3. **Documentation** (in commit or test comment)
```javascript
// Bug: inflationRate was undefined, causing NaN in (undefined/100)
// Fix: Wrapped in safeNum() to default to 0
// Invariant: assertNoInvalidNumbers catches ALL NaN values
```

## Test Categories and Standards

### Invariant Tests (Property-Based)

**Purpose**: Catch "incorrect math" regardless of scenario

**Examples:**
- Balance continuity: `ending = starting + growth + inflows - outflows`
- Tax totals: `totalTax ≈ federal + state + fica + niit`
- No NaN/Infinity anywhere
- Withdrawals identity: `total = sum(byAccount)`

**Standard**: These are MANDATORY for all financial calculations.

### Scenario Tests (Example-Based)

**Purpose**: Verify specific use cases

**Standard**:
- Use golden master for key scenarios
- Version expected outputs
- Require explicit approval to update

### Metamorphic Tests (Relationship-Based)

**Purpose**: Test relationships without knowing exact outputs

**Examples:**
- If inflation ↑ → nominal spending ↑, real spending unchanged
- If portfolio + $1k → ending wealth ≥ baseline (no loss)
- If return ↑ → median outcome ↑

**Standard**: Add at least one metamorphic test per major feature.

## Tolerance Guidelines

### Recommended Tolerances (from `tolerance.js`)

```javascript
// Tax calculations
taxTotal: { abs: 50, rel: 0.001 }      // $50 or 0.1%
taxComponent: { abs: 10, rel: 0.005 }  // $10 or 0.5%

// Portfolio balances
portfolioBalance: { abs: 100, rel: 0.0001 } // $100 or 0.01%

// Rates
effectiveRate: { absPct: 0.1 }  // 0.1 percentage points
```

### Validation Rule

Use `validateToleranceNotWeakened()`:
```javascript
validateToleranceNotWeakened(
    'testName',
    { abs: 100, rel: 0.001 },  // Current
    TOLERANCE_PRESETS.taxTotal  // Baseline
);
// Throws if current is wider than baseline
```

## Anomaly Reporting

### When to Report vs Fail

**Report (WARN):**
- Balance continuity violations (complex, may have edge cases)
- Tax rate > 55% but < 70% (high but possible)
- Sudden spikes with KNOWN triggers (Roth conversion, sale)

**Fail (ERROR):**
- NaN or Infinity values
- Tax rate > 70% (impossible)
- Negative balances (unless debt is modeled)
- FICA on non-earned income

**Usage:**
```javascript
if (effectiveRate > 0.70) {
    reportAnomaly({
        type: 'impossible_tax_rate',
        severity: SEVERITY.CRITICAL,
        testName: 'assertEffectiveTaxRateSanity',
        description: `Rate ${effectiveRate} exceeds 70%`,
        data: { age, agi, totalTax },
        suggestedAction: 'Check tax calculation - likely a bug'
    });
    throw new Error('Effective tax rate exceeds 70%');
}
```

## Continuous Improvement Process

### On Test Failure

1. **Do NOT immediately**:
   - Widen tolerance
   - Skip test
   - Add `|| true`

2. **DO**:
   - Read error message carefully
   - Create minimal repro
   - Find root cause
   - Fix engine
   - Add invariant

### On Test Pass

1. **Check anomalies**:
```javascript
const anomalies = getAnomalies();
if (hasCriticalAnomalies()) {
    console.error('Tests passed but critical anomalies detected');
    // Review anomalies.json
}
```

2. **Review coverage**:
   - Are new code paths tested?
   - Are edge cases covered?
   - Do we have metamorphic tests?

## Artifacts to Maintain

### Test Reports
```bash
npm test -- --reporter=json --outputFile=artifacts/test-report.json
```

### Anomaly Reports
```javascript
// In afterAll hook:
fs.writeFileSync(
    'artifacts/anomalies.json',
    JSON.stringify(exportAnomalies(), null, 2)
);
```

### Ledger Diffs (Golden Master)
When golden master changes:
```bash
git diff src/tests/fixtures/golden-master.json > artifacts/ledger-diff.json
```

## CI/CD Integration

### Required Checks
1. `npm test` - All tests must pass
2. `npm run lint` - No linting errors
3. `npm run coverage` - Maintain > 80% coverage
4. Anomaly review - No critical/error anomalies

### Branch Protection
- Require all checks to pass
- Require code review
- No force push to main

## Common Mistakes to Avoid

### ❌ Self-Referential Testing
```javascript
// BAD: Testing against the same code being tested
const expectedTax = calculateTax(income);  // Uses production code
expect(actualTax).toBe(expectedTax);  // Circular!
```

### ❌ Brittle Snapshots
```javascript
// BAD: Massive snapshot that's hard to review
export const GOLDEN_MASTER = { /* 5000 lines */ };
```

### ❌ Flaky Tests
```javascript
// BAD: Random values without seed
const results = runMonteCarlo();
expect(results.median).toBeGreaterThan(1000000); // Flaky!
```

### ❌ Hidden Dependencies
```
javascript
// BAD: Test depends on order
it('test A', () => { globalState.x = 5; });
it('test B', () => { expect(globalState.x).toBe(5); }); // Fragile!
```

## Emergency Procedures

### If Test Suite Breaks Widely

1. **Don't panic-commit fixes**
2. **Bisect** to find breaking change:
```bash
git bisect start
git bisect bad HEAD
git bisect good <last-known-good>
```
3. **Review** the breaking commit
4. **Decide**: Revert or fix forward?
5. **Document** the incident

### If Golden Master Needs Update

1. **Verify** change is intentional
2. **Review** diff carefully
3. **Get approval** from team
4. **Document** why in commit:
```
git commit -m "test: update golden master for XYZ feature

BREAKING CHANGE: Tax calculation now includes NIIT
Previous: Federal + State + FICA
New: Federal + State + FICA + NIIT

Reviewed-by: @username
"
```

## Success Metrics

Track these over time:
- Test count (increasing)
- Coverage % (maintaining or increasing)
- Anomaly rate (decreasing)
- Tolerance values (stable - not widening over time)
- Bug escape rate (decreasing)

## Remember

**The goal is not green tests.**
**The goal is correct code, verified by rigorous tests.**

If you're tempted to weaken a test, ask yourself:
- "Am I hiding a bug?"
- "Will this catch similar bugs in the future?"
- "Would I trust my own money with this code?"
