#!/usr/bin/env node

/**
 * Identity Vault - Attack Runner
 * Execute attack strategies and generate security reports
 * 
 * Usage:
 *   node run-attacks.js [profileId] [strategy]
 * 
 * Examples:
 *   node run-attacks.js                    # Run all attacks on new profiles
 *   node run-attacks.js profile_123        # Attack existing profile
 *   node run-attacks.js all random         # Run only random attack
 */

const dotenv = require('dotenv');
const AttackModule = require('./attack-module.js');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || process.env.TEST_TOKEN;

const args = process.argv.slice(2);
const profileId = args[0];
const strategy = args[1];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`)
};

async function main() {
  log.header(`
╔══════════════════════════════════════════════════════════╗
║   IDENTITY VAULT - ATTACK & FUZZING MODULE               ║
║   Security Testing for Your Own Profiles                ║
╚══════════════════════════════════════════════════════════╝
  `);

  // Verify configuration
  if (!API_TOKEN) {
    log.error('API_TOKEN not set in .env');
    log.info('Set API_TOKEN in .env file or login first');
    process.exit(1);
  }

  log.info(`API URL: ${API_URL}`);
  log.info(`Token: ${API_TOKEN.slice(0, 20)}...`);

  // Initialize attack module
  const attacker = new AttackModule(API_URL, API_TOKEN);

  try {
    if (profileId) {
      // Attack existing profile
      log.header(`\nTesting Profile: ${profileId}`);
      
      if (strategy === 'consistency' || !strategy) {
        await attacker.consistencyAttack(profileId);
      }
      if (strategy === 'bypass' || !strategy) {
        await attacker.verificationBypassAttack(profileId);
      }
      if (!strategy) {
        log.info('Tip: Use specific strategy to test fewer attacks');
      }
    } else {
      // Create new profiles and attack them
      log.header('\nRunning Full Attack Suite');
      log.info('Creating test profiles...');

      // Run all attacks
      const attacks = [
        { name: 'Consistency Attack', fn: () => attacker.consistencyAttack('new') },
        { name: 'Random Answer Attack', fn: () => attacker.randomAnswerAttack() },
        { name: 'Demographics Attack', fn: () => attacker.demographicsAttack({ category: 'age', value: 'young' }) },
        { name: 'Brute Force Attack', fn: () => attacker.bruteForceAttack() },
        { name: 'Session Manipulation', fn: () => attacker.sessionManipulationAttack() },
        { name: 'Answer Injection', fn: () => attacker.answerInjectionAttack() }
      ];

      let completed = 0;
      for (const attack of attacks) {
        console.log(`\n[${completed + 1}/${attacks.length}] Running ${attack.name}...`);
        try {
          await attack.fn();
          completed++;
        } catch (error) {
          log.error(`${attack.name} failed: ${error.message}`);
        }
      }

      log.success(`\nCompleted ${completed}/${attacks.length} attacks`);
    }

    // Generate and display report
    log.header('\n📊 ATTACK REPORT');
    attacker.displayResults();

    // Save detailed report
    attacker.displayReportJSON('attack-report.json');

    // Generate security recommendations
    log.header('\n🛡️ SECURITY RECOMMENDATIONS');
    generateRecommendations(attacker);

    process.exit(0);
  } catch (error) {
    log.error(`Attack execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

function generateRecommendations(attacker) {
  const vulnTypes = attacker.vulnerabilities.map(v => v.type);
  const score = attacker.calculateSecurityScore();

  console.log(`
Current Security Score: ${colors.bright}${score}/100${colors.reset}
  `);

  if (score >= 80) {
    log.success('System is well-protected');
  } else if (score >= 60) {
    log.warning('System has moderate vulnerabilities');
  } else if (score >= 40) {
    log.warning('System has significant vulnerabilities');
  } else {
    log.error('System has critical vulnerabilities');
  }

  console.log(`
Recommendations:
  `);

  if (vulnTypes.includes('Consistency')) {
    console.log(`
  1️⃣ Strengthen Consistency Checking
     • Verify answers match profile across sessions
     • Implement temporal consistency scoring
     • Flag sudden changes in preferences
    `);
  }

  if (vulnTypes.includes('Overfitting')) {
    console.log(`
  2️⃣ Improve Pattern Detection
     • Require answer diversity
     • Validate against random baseline
     • Increase minimum answer count
    `);
  }

  if (vulnTypes.includes('Demographic Predictability')) {
    console.log(`
  3️⃣ Reduce Demographic Bias
     • Increase question complexity
     • Use non-obvious demographic questions
     • Cross-validate against real patterns
    `);
  }

  if (vulnTypes.includes('Input Validation')) {
    console.log(`
  4️⃣ Strengthen Input Validation
     • Reject non-standard answers
     • Require exact match to options
     • Implement CAPTCHA for unusual patterns
    `);
  }

  if (vulnTypes.includes('Verification Bypass')) {
    console.log(`
  5️⃣ Improve Verification Questions
     • Use more specific verification questions
     • Randomize question selection
     • Require multiple verification rounds
    `);
  }

  console.log(`
Next Steps:
  • Review attack report (attack-report.json)
  • Test recommended fixes on test profiles
  • Re-run attacks to verify improvements
  • Deploy hardened system
  `);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run
main();
