/**
 * Main Test Runner
 * Runs all test suites for the Advanced Macros module
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.magenta}   Advanced Macros - Test Suite${colors.reset}`);
console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}\n`);

const testSuites = [
  { name: 'Macro Validation', file: 'validate-macros.js' },
  { name: 'Syntax Check', file: 'syntax-check.js' },
  { name: 'Execution Tests', file: 'execution-tests.js' }
];

const results = [];

async function runTest(suite) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bold}${colors.cyan}Running: ${suite.name}${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(55)}${colors.reset}\n`);

    const testPath = path.join(__dirname, suite.file);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      const passed = code === 0;
      results.push({ name: suite.name, passed });

      console.log(); // Extra newline for spacing
      resolve(passed);
    });

    child.on('error', (error) => {
      console.error(`${colors.red}Error running ${suite.name}: ${error.message}${colors.reset}`);
      results.push({ name: suite.name, passed: false });
      resolve(false);
    });
  });
}

async function runAllTests() {
  for (const suite of testSuites) {
    await runTest(suite);
  }

  // Print summary
  console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}   Test Summary${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}\n`);

  results.forEach(result => {
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${result.name}: ${result.passed ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  });

  console.log();

  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log(`${colors.bold}${colors.green}All tests passed! ✨${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}Some tests failed. Please review the output above.${colors.reset}\n`);
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});
