/**
 * JavaScript Syntax Validation for Macros
 * Validates that all script macros have valid JavaScript syntax
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function loadMacros() {
  const dbPath = path.join(__dirname, '../packs/macros.db');
  const content = fs.readFileSync(dbPath, 'utf8');
  return content.trim().split('\n').map(line => JSON.parse(line));
}

console.log(`${colors.bold}${colors.cyan}JavaScript Syntax Check${colors.reset}\n`);

const macros = loadMacros();
const scriptMacros = macros.filter(m => m.type === 'script');

let passed = 0;
let failed = 0;
const errors = [];

console.log(`Checking ${scriptMacros.length} script macros...\n`);

scriptMacros.forEach(macro => {
  const code = macro.command.replace(/\r\n/g, '\n');

  try {
    // Create a more complete validation context
    const wrappedCode = `
      (async function() {
        // Mock Foundry globals
        const game = {};
        const ui = { notifications: {} };
        const canvas = { scene: { dimensions: {} }, tokens: { controlled: [] } };
        const scene = {};
        const token = null;
        const actor = null;
        const character = null;
        const speaker = {};
        const args = [];
        const ChatMessage = { create: () => {}, getWhisperRecipients: () => [] };
        const Dialog = function() {};
        const AudioHelper = { play: () => {} };
        const Sequence = function() {
          this.effect = () => this;
          this.animation = () => this;
          this.wait = () => this;
          this.waitUntilFinished = () => this;
          this.play = () => {};
          return this;
        };
        const Sequencer = { EffectManager: { endEffects: () => {} } };
        const PIXI = { Text: function() {} };
        const CONST = { TOKEN_DISPLAY_MODES: { ALWAYS: 1 } };
        const CONFIG = { DND5E: { skills: {} } };

        ${code}
      })();
    `;

    // Try to parse and validate syntax
    new vm.Script(wrappedCode);

    passed++;
    console.log(`${colors.green}✓${colors.reset} ${macro.name}`);
  } catch (error) {
    failed++;
    console.log(`${colors.red}✗${colors.reset} ${macro.name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);

    // Show the problematic line if available
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3);
      stackLines.forEach(line => {
        console.log(`  ${colors.yellow}${line}${colors.reset}`);
      });
    }

    errors.push({
      name: macro.name,
      error: error.message
    });
  }
});

console.log(`\n${colors.bold}Syntax Check Results:${colors.reset}`);
console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);

if (errors.length > 0) {
  console.log(`\n${colors.red}${colors.bold}Errors:${colors.reset}`);
  errors.forEach(err => {
    console.log(`  ${colors.red}${err.name}: ${err.error}${colors.reset}`);
  });
}

process.exit(failed === 0 ? 0 : 1);
