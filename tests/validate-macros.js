/**
 * Macro Database Validation Tests
 * Validates structure, format, and completeness of macros.db
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`${colors.bold}${colors.cyan}Running Macro Validation Tests${colors.reset}\n`);

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`${colors.green}✓${colors.reset} ${test.description}`);
      } catch (error) {
        this.failed++;
        console.log(`${colors.red}✗${colors.reset} ${test.description}`);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
      }
    }

    console.log(`\n${colors.bold}Test Results:${colors.reset}`);
    console.log(`  ${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${this.failed}${colors.reset}`);

    if (this.warnings > 0) {
      console.log(`  ${colors.yellow}Warnings: ${this.warnings}${colors.reset}`);
    }

    return this.failed === 0;
  }

  warn(message) {
    this.warnings++;
    console.log(`  ${colors.yellow}⚠ Warning: ${message}${colors.reset}`);
  }
}

// Load and parse macros
function loadMacros() {
  const dbPath = path.join(__dirname, '../packs/macros.db');
  const content = fs.readFileSync(dbPath, 'utf8');
  const lines = content.trim().split('\n');
  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON at line ${index + 1}: ${error.message}`);
    }
  });
}

// Required fields for all macros
const REQUIRED_FIELDS = ['_id', 'name', 'type', 'command', 'scope', 'permission', 'img', 'author'];
const VALID_TYPES = ['script', 'chat'];
const VALID_SCOPES = ['global', 'world', 'user'];

// New macros we added
const NEW_MACROS = [
  'sequencer-effect',
  'sequencer-teleport',
  'sequencer-weather',
  'sequencer-aura',
  'sequencer-combat',
  'narrative-scene-intro',
  'narrative-npc-speech',
  'narrative-time-passage',
  'narrative-atmosphere',
  'narrative-cliffhanger',
  'narrative-random-event',
  'narrative-flashback',
  'narrative-countdown'
];

// Run tests
const runner = new TestRunner();

runner.test('Macros database file exists and is readable', () => {
  const dbPath = path.join(__dirname, '../packs/macros.db');
  if (!fs.existsSync(dbPath)) {
    throw new Error('macros.db file not found');
  }
  const stats = fs.statSync(dbPath);
  if (stats.size === 0) {
    throw new Error('macros.db file is empty');
  }
});

runner.test('All macros are valid JSON (NDJSON format)', () => {
  const macros = loadMacros();
  if (macros.length === 0) {
    throw new Error('No macros found in database');
  }
  console.log(`  Found ${macros.length} macros`);
});

runner.test('All macros have required fields', () => {
  const macros = loadMacros();
  macros.forEach((macro, index) => {
    REQUIRED_FIELDS.forEach(field => {
      if (!(field in macro)) {
        throw new Error(`Macro at line ${index + 1} (${macro.name || 'unknown'}) missing required field: ${field}`);
      }
    });
  });
});

runner.test('All macro IDs are unique', () => {
  const macros = loadMacros();
  const ids = new Set();
  macros.forEach(macro => {
    if (ids.has(macro._id)) {
      throw new Error(`Duplicate ID found: ${macro._id}`);
    }
    ids.add(macro._id);
  });
});

runner.test('All macro names are unique', () => {
  const macros = loadMacros();
  const names = new Set();
  macros.forEach(macro => {
    if (names.has(macro.name)) {
      throw new Error(`Duplicate name found: ${macro.name}`);
    }
    names.add(macro.name);
  });
});

runner.test('All macros have valid type', () => {
  const macros = loadMacros();
  macros.forEach(macro => {
    if (!VALID_TYPES.includes(macro.type)) {
      throw new Error(`Invalid type for macro ${macro.name}: ${macro.type}`);
    }
  });
});

runner.test('All macros have valid scope', () => {
  const macros = loadMacros();
  macros.forEach(macro => {
    if (!VALID_SCOPES.includes(macro.scope)) {
      throw new Error(`Invalid scope for macro ${macro.name}: ${macro.scope}`);
    }
  });
});

runner.test('All macros have non-empty command', () => {
  const macros = loadMacros();
  macros.forEach(macro => {
    if (!macro.command || macro.command.trim().length === 0) {
      throw new Error(`Empty command for macro: ${macro.name}`);
    }
  });
});

runner.test('All script macros contain valid JavaScript syntax', () => {
  const macros = loadMacros();
  const scriptMacros = macros.filter(m => m.type === 'script');

  scriptMacros.forEach(macro => {
    // Remove carriage returns for consistency
    const code = macro.command.replace(/\r\n/g, '\n');

    try {
      // Wrap in async function to allow await
      const wrappedCode = `(async function() { ${code} })()`;
      new Function('args', 'game', 'ui', 'canvas', 'scene', 'token', 'actor', 'character', 'speaker',
                   'Sequence', 'ChatMessage', 'Dialog', 'AudioHelper', wrappedCode);
    } catch (error) {
      throw new Error(`JavaScript syntax error in macro ${macro.name}: ${error.message}`);
    }
  });
});

runner.test('All new Sequencer macros are present', () => {
  const macros = loadMacros();
  const macroNames = new Set(macros.map(m => m.name));

  const sequencerMacros = ['sequencer-effect', 'sequencer-teleport', 'sequencer-weather',
                           'sequencer-aura', 'sequencer-combat'];

  sequencerMacros.forEach(name => {
    if (!macroNames.has(name)) {
      throw new Error(`Missing Sequencer macro: ${name}`);
    }
  });
});

runner.test('All new narrative macros are present', () => {
  const macros = loadMacros();
  const macroNames = new Set(macros.map(m => m.name));

  const narrativeMacros = ['narrative-scene-intro', 'narrative-npc-speech', 'narrative-time-passage',
                          'narrative-atmosphere', 'narrative-cliffhanger', 'narrative-random-event',
                          'narrative-flashback', 'narrative-countdown'];

  narrativeMacros.forEach(name => {
    if (!macroNames.has(name)) {
      throw new Error(`Missing narrative macro: ${name}`);
    }
  });
});

runner.test('All new macros have documentation comments', () => {
  const macros = loadMacros();

  NEW_MACROS.forEach(macroName => {
    const macro = macros.find(m => m.name === macroName);
    if (!macro) {
      throw new Error(`Macro not found: ${macroName}`);
    }

    // Check if command starts with a comment
    const command = macro.command.trim();
    if (!command.startsWith('/*') && !command.startsWith('//')) {
      throw new Error(`Macro ${macroName} missing documentation comment at start`);
    }

    // Check for "Example:" in documentation
    if (!command.toLowerCase().includes('example:')) {
      runner.warn(`Macro ${macroName} missing usage examples in documentation`);
    }
  });
});

runner.test('Sequencer macros check for module availability', () => {
  const macros = loadMacros();
  const sequencerMacros = macros.filter(m => m.name.startsWith('sequencer-'));

  sequencerMacros.forEach(macro => {
    if (!macro.command.includes('game.modules.get("sequencer")')) {
      throw new Error(`Sequencer macro ${macro.name} doesn't check for Sequencer module availability`);
    }
  });
});

runner.test('Macros with arguments validate input', () => {
  const macros = loadMacros();

  // Check that new macros that use args check for required arguments
  const macrosWithArgs = macros.filter(m => NEW_MACROS.includes(m.name) && m.command.includes('args['));

  macrosWithArgs.forEach(macro => {
    // Should have some kind of validation or default values
    const hasValidation = macro.command.includes('||') ||
                         macro.command.includes('undefined') ||
                         macro.command.includes('ui.notifications');

    if (!hasValidation) {
      runner.warn(`Macro ${macro.name} uses args but may not validate inputs properly`);
    }
  });
});

runner.test('All macro IDs follow expected format', () => {
  const macros = loadMacros();
  const newMacros = macros.filter(m => NEW_MACROS.includes(m.name));

  newMacros.forEach(macro => {
    // Check ID length and format (alphanumeric)
    if (!/^[a-zA-Z0-9]{16}$/.test(macro._id)) {
      runner.warn(`Macro ${macro.name} has non-standard ID format: ${macro._id}`);
    }
  });
});

runner.test('Macros use consistent error notification pattern', () => {
  const macros = loadMacros();
  const newMacros = macros.filter(m => NEW_MACROS.includes(m.name));

  newMacros.forEach(macro => {
    // Check if macro uses ui.notifications for user feedback
    if (macro.command.includes('return') && !macro.command.includes('ui.notifications')) {
      runner.warn(`Macro ${macro.name} returns without user notification`);
    }
  });
});

runner.test('Total macro count is correct', () => {
  const macros = loadMacros();
  const expectedMin = 30; // 17 original + 13 new

  if (macros.length < expectedMin) {
    throw new Error(`Expected at least ${expectedMin} macros, found ${macros.length}`);
  }

  console.log(`  Total macros: ${macros.length} (${macros.length - 17} new macros)`);
});

// Run all tests
runner.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
