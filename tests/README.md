# Advanced Macros - Test Suite

This directory contains comprehensive tests for the Advanced Macros module for FoundryVTT.

## Test Suites

### 1. Macro Validation Tests (`validate-macros.js`)
Validates the structure and format of all macros in the database:
- ✓ Database file integrity
- ✓ Valid JSON (NDJSON) format
- ✓ Required fields present
- ✓ Unique IDs and names
- ✓ Valid types and scopes
- ✓ Documentation completeness
- ✓ Presence of new macros

### 2. Syntax Check (`syntax-check.js`)
Validates JavaScript syntax for all script macros:
- ✓ Valid JavaScript syntax
- ✓ Proper async/await usage
- ✓ No syntax errors
- ✓ Compilable code

### 3. Execution Tests (`execution-tests.js`)
Tests macro execution with mocked Foundry environment:
- ✓ Macros execute without errors
- ✓ Proper error handling
- ✓ Notification messages
- ✓ Argument validation
- ✓ Default values work correctly

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
# Validation tests only
npm run test:validate

# Syntax check only
npm run test:syntax

# Execution tests (requires all previous tests to pass)
node tests/execution-tests.js
```

## Test Coverage

The test suite covers:
- **17** original macros (legacy validation)
- **13** newly added macros:
  - 5 Sequencer animation macros
  - 8 Narrative DM event macros

## Requirements

- Node.js 12+
- No external dependencies required (uses Node.js built-ins only)

## Test Output

Tests provide colored output for easy reading:
- 🟢 Green ✓ = Test passed
- 🔴 Red ✗ = Test failed
- 🟡 Yellow ⚠ = Warning (non-critical issue)

## Adding New Tests

To add new tests, edit the respective test file:

1. **For validation tests**: Add to `validate-macros.js`
   ```javascript
   runner.test('Test description', () => {
     // Your test logic here
   });
   ```

2. **For execution tests**: Add to `execution-tests.js`
   ```javascript
   await runner.test('Test description', async () => {
     const macro = macros.find(m => m.name === 'macro-name');
     const mockEnv = createMockEnvironment();
     await executeMacro(macro, [args], mockEnv);
     // Assertions...
   });
   ```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Exit codes:
- `0` = All tests passed
- `1` = One or more tests failed

## Troubleshooting

### Tests fail with "module not found"
Make sure you're running tests from the repository root or the tests directory.

### Syntax errors in macros
Check the specific macro mentioned in the error output. The error will show the line number and issue.

### Execution tests fail
The execution tests use mocked Foundry VTT objects. If a macro uses an API not mocked, you may need to extend the mock environment in `execution-tests.js`.

## Mock Environment

The test suite includes a comprehensive mock of the Foundry VTT environment including:
- `game` object with modules, user, and users
- `ui.notifications` for user feedback
- `canvas` with scene dimensions and tokens
- `token`, `actor`, `character` context
- `ChatMessage`, `Dialog`, `AudioHelper` APIs
- `Sequence` and `Sequencer` (for animation macros)

## License

Same as the parent module (MIT)
