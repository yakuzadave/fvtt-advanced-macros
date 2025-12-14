/**
 * Macro Execution Tests
 * Tests macros with mocked Foundry environment
 */

const fs = require('fs');
const path = require('path');

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

// Mock Foundry VTT environment
function createMockEnvironment() {
  const notifications = [];

  return {
    game: {
      modules: {
        get: (name) => {
          // Mock Sequencer module as available
          if (name === 'sequencer') {
            return { active: true };
          }
          return { active: false };
        }
      },
      user: {
        name: 'TestUser',
        targets: new Set()
      },
      users: {
        players: []
      }
    },
    ui: {
      notifications: {
        info: (msg) => notifications.push({ type: 'info', message: msg }),
        warn: (msg) => notifications.push({ type: 'warn', message: msg }),
        error: (msg) => notifications.push({ type: 'error', message: msg })
      }
    },
    canvas: {
      scene: {
        dimensions: {
          width: 4000,
          height: 3000
        }
      },
      tokens: {
        controlled: [],
        placeables: []
      },
      animatePan: () => {}
    },
    scene: {},
    token: {
      id: 'test-token-123',
      name: 'Test Token',
      document: {
        update: async (data) => ({ ...data })
      },
      center: { x: 1000, y: 1000 },
      data: {
        dimSight: 60,
        brightSight: 0,
        dimLight: 0,
        brightLight: 0,
        lightAngle: 360,
        lockRotation: false
      }
    },
    actor: null,
    character: null,
    speaker: {},
    ChatMessage: {
      create: async (data) => ({ ...data }),
      getWhisperRecipients: (name) => []
    },
    Dialog: function(config) {
      this.render = () => this;
      return this;
    },
    AudioHelper: {
      play: (config, push) => ({})
    },
    Sequence: function() {
      this.effect = () => this;
      this.animation = () => this;
      this.on = () => this;
      this.wait = () => this;
      this.waitUntilFinished = () => this;
      this.atLocation = () => this;
      this.stretchTo = () => this;
      this.attachTo = () => this;
      this.scale = () => this;
      this.opacity = () => this;
      this.duration = () => this;
      this.fadeIn = () => this;
      this.fadeOut = () => this;
      this.persist = () => this;
      this.delay = () => this;
      this.name = () => this;
      this.file = () => this;
      this.teleportTo = () => this;
      this.play = () => Promise.resolve();
      return this;
    },
    Sequencer: {
      EffectManager: {
        endEffects: (config) => {}
      }
    },
    notifications,
    clearNotifications: () => { notifications.length = 0; }
  };
}

// Execute a macro with mock environment
async function executeMacro(macro, args, mockEnv) {
  const code = macro.command.replace(/\r\n/g, '\n');

  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

  const fn = new AsyncFunction(
    'args', 'game', 'ui', 'canvas', 'scene', 'token', 'actor', 'character',
    'speaker', 'ChatMessage', 'Dialog', 'AudioHelper', 'Sequence', 'Sequencer',
    code
  );

  return await fn(
    args,
    mockEnv.game,
    mockEnv.ui,
    mockEnv.canvas,
    mockEnv.scene,
    mockEnv.token,
    mockEnv.actor,
    mockEnv.character,
    mockEnv.speaker,
    mockEnv.ChatMessage,
    mockEnv.Dialog,
    mockEnv.AudioHelper,
    mockEnv.Sequence,
    mockEnv.Sequencer
  );
}

// Test runner
class ExecutionTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(description, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`${colors.green}✓${colors.reset} ${description}`);
    } catch (error) {
      this.failed++;
      console.log(`${colors.red}✗${colors.reset} ${description}`);
      console.log(`  ${colors.red}${error.message}${colors.reset}`);
    }
  }

  printResults() {
    console.log(`\n${colors.bold}Execution Test Results:${colors.reset}`);
    console.log(`  ${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${this.failed}${colors.reset}`);
    return this.failed === 0;
  }
}

// Main test execution
async function runTests() {
  console.log(`${colors.bold}${colors.cyan}Macro Execution Tests${colors.reset}\n`);

  const macros = loadMacros();
  const runner = new ExecutionTestRunner();

  // Test: sequencer-effect macro
  await runner.test('sequencer-effect: executes without error', async () => {
    const macro = macros.find(m => m.name === 'sequencer-effect');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['jb2a.fire_bolt.blue', 'token', 1], mockEnv);

    // Should show error since no token selected in mock
    if (!mockEnv.notifications.some(n => n.type === 'warn' || n.type === 'info')) {
      throw new Error('Expected notification');
    }
  });

  // Test: sequencer-teleport macro
  await runner.test('sequencer-teleport: executes with coordinates', async () => {
    const macro = macros.find(m => m.name === 'sequencer-teleport');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, [2000, 1500, 'lightning'], mockEnv);

    if (!mockEnv.notifications.some(n => n.message && n.message.includes('lightning'))) {
      throw new Error('Expected teleport notification');
    }
  });

  // Test: sequencer-weather macro
  await runner.test('sequencer-weather: executes with weather type', async () => {
    const macro = macros.find(m => m.name === 'sequencer-weather');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['rain', 10000, 2], mockEnv);

    if (!mockEnv.notifications.some(n => n.message && n.message.includes('rain'))) {
      throw new Error('Expected weather notification');
    }
  });

  // Test: sequencer-aura remove
  await runner.test('sequencer-aura: can remove aura', async () => {
    const macro = macros.find(m => m.name === 'sequencer-aura');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['remove'], mockEnv);

    if (!mockEnv.notifications.some(n => n.message && n.message.includes('removed'))) {
      throw new Error('Expected aura removal notification');
    }
  });

  // Test: sequencer-combat macro
  await runner.test('sequencer-combat: validates target requirement', async () => {
    const macro = macros.find(m => m.name === 'sequencer-combat');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['firebolt', 'blue'], mockEnv);

    // Should warn about no targets
    if (!mockEnv.notifications.some(n => n.type === 'warn' && n.message.includes('target'))) {
      throw new Error('Expected warning about missing targets');
    }
  });

  // Test: narrative-scene-intro macro
  await runner.test('narrative-scene-intro: creates scene introduction', async () => {
    const macro = macros.find(m => m.name === 'narrative-scene-intro');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['The Dark Forest', 'A spooky place...', 'fade'], mockEnv);

    if (!mockEnv.notifications.some(n => n.message && n.message.includes('Scene introduction'))) {
      throw new Error('Expected scene introduction notification');
    }
  });

  // Test: narrative-npc-speech macro
  await runner.test('narrative-npc-speech: formats NPC dialogue', async () => {
    const macro = macros.find(m => m.name === 'narrative-npc-speech');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    const result = await executeMacro(macro, ['Gandalf', 'You shall not pass!', 'angry'], mockEnv);

    // Should execute without error
    if (mockEnv.notifications.some(n => n.type === 'error')) {
      throw new Error('Unexpected error during execution');
    }
  });

  // Test: narrative-time-passage macro
  await runner.test('narrative-time-passage: displays time passage', async () => {
    const macro = macros.find(m => m.name === 'narrative-time-passage');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['hours', 8, 'You rest through the night'], mockEnv);

    // Should execute without error
    if (mockEnv.notifications.some(n => n.type === 'error')) {
      throw new Error('Unexpected error during execution');
    }
  });

  // Test: narrative-atmosphere macro
  await runner.test('narrative-atmosphere: sets atmosphere', async () => {
    const macro = macros.find(m => m.name === 'narrative-atmosphere');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['creepy'], mockEnv);

    // Should execute without error
    if (mockEnv.notifications.some(n => n.type === 'error')) {
      throw new Error('Unexpected error during execution');
    }
  });

  // Test: narrative-cliffhanger macro
  await runner.test('narrative-cliffhanger: creates cliffhanger', async () => {
    const macro = macros.find(m => m.name === 'narrative-cliffhanger');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['The dragon awakens...', 'dramatic'], mockEnv);

    if (!mockEnv.notifications.some(n => n.message && n.message.includes('CLIFFHANGER'))) {
      throw new Error('Expected cliffhanger notification');
    }
  });

  // Test: narrative-random-event macro
  await runner.test('narrative-random-event: generates random event', async () => {
    const macro = macros.find(m => m.name === 'narrative-random-event');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    const result = await executeMacro(macro, ['encounter'], mockEnv);

    // Should return a string (the random event)
    if (typeof result !== 'string') {
      throw new Error('Expected string return value');
    }
  });

  // Test: narrative-flashback macro
  await runner.test('narrative-flashback: creates flashback', async () => {
    const macro = macros.find(m => m.name === 'narrative-flashback');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, ['5 years ago', 'You remember...'], mockEnv);

    // Should execute without error
    if (mockEnv.notifications.some(n => n.type === 'error')) {
      throw new Error('Unexpected error during execution');
    }
  });

  // Test: narrative-countdown macro
  await runner.test('narrative-countdown: validates countdown parameters', async () => {
    const macro = macros.find(m => m.name === 'narrative-countdown');
    if (!macro) throw new Error('Macro not found');

    const mockEnv = createMockEnvironment();
    await executeMacro(macro, [3, 'until explosion', 1], mockEnv);

    if (!mockEnv.notifications.some(n => n.message && n.message.includes('Countdown started'))) {
      throw new Error('Expected countdown start notification');
    }
  });

  // Test: All new macros handle missing args gracefully
  await runner.test('All new macros handle missing arguments', async () => {
    const newMacros = [
      'sequencer-effect', 'sequencer-teleport', 'sequencer-weather',
      'sequencer-aura', 'sequencer-combat', 'narrative-scene-intro',
      'narrative-npc-speech', 'narrative-time-passage', 'narrative-atmosphere',
      'narrative-cliffhanger', 'narrative-random-event', 'narrative-flashback'
    ];

    for (const macroName of newMacros) {
      const macro = macros.find(m => m.name === macroName);
      if (!macro) continue;

      const mockEnv = createMockEnvironment();

      try {
        // Execute with no arguments
        await executeMacro(macro, [], mockEnv);
      } catch (error) {
        throw new Error(`Macro ${macroName} failed with no args: ${error.message}`);
      }
    }
  });

  return runner.printResults();
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});
