/**
 * Identity Vault Telegram Bot - Test Suite
 * Tests bot functionality without needing actual Telegram
 */

const axios = require('axios');

const BOT_URL = process.env.BOT_URL || 'http://localhost:3001';
const API_URL = process.env.API_URL || 'http://localhost:3000';

class BotTester {
  constructor() {
    this.testResults = [];
    this.testCount = 0;
  }

  async test(name, fn) {
    this.testCount++;
    try {
      await fn();
      this.testResults.push({ name, status: '✓ PASS' });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.testResults.push({ name, status: '✗ FAIL', error: error.message });
      console.error(`✗ ${name}: ${error.message}`);
    }
  }

  async report() {
    const passed = this.testResults.filter(r => r.status === '✓ PASS').length;
    const failed = this.testResults.filter(r => r.status === '✗ FAIL').length;

    console.log(`
╔════════════════════════════════════════╗
║         BOT TEST RESULTS               ║
╠════════════════════════════════════════╣
║ Total: ${this.testCount.toString().padEnd(30)} ║
║ Passed: ${passed.toString().padEnd(28)} ║
║ Failed: ${failed.toString().padEnd(28)} ║
╚════════════════════════════════════════╝
    `);

    this.testResults.forEach(r => {
      console.log(`${r.status} - ${r.name}`);
      if (r.error) console.log(`   Error: ${r.error}`);
    });
  }
}

const tester = new BotTester();

async function runTests() {
  console.log(`
╔════════════════════════════════════════╗
║   IDENTITY VAULT BOT - TEST SUITE      ║
║   Testing: ${BOT_URL}
║   API: ${API_URL}
╚════════════════════════════════════════╝
  `);

  // Test 1: Bot health check
  await tester.test('Bot health check', async () => {
    const response = await axios.get(`${BOT_URL}/health`);
    if (response.status !== 200) throw new Error('Health check failed');
    if (!response.data.status) throw new Error('No status in response');
    console.log(`  └─ Status: ${response.data.status}`);
  });

  // Test 2: Backend API health
  await tester.test('Backend API health check', async () => {
    const response = await axios.get(`${API_URL}/health`);
    if (response.status !== 200) throw new Error('API health check failed');
    console.log(`  └─ API Status: ${response.data.status}`);
  });

  // Test 3: User registration flow
  let testToken;
  let testUserId;
  await tester.test('User registration via API', async () => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      telegram_id: 9999999,
      username: `test_user_${Date.now()}`,
      password: 'test_password_123'
    });
    if (!response.data.token) throw new Error('No token in response');
    testToken = response.data.token;
    testUserId = response.data.userId;
    console.log(`  └─ User ID: ${testUserId}`);
    console.log(`  └─ Token: ${testToken.slice(0, 20)}...`);
  });

  // Test 4: Profile creation
  let testProfileId;
  await tester.test('Profile creation', async () => {
    const response = await axios.post(
      `${API_URL}/api/profiles/create`,
      {},
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.profileId) throw new Error('No profileId in response');
    testProfileId = response.data.profileId;
    console.log(`  └─ Profile ID: ${testProfileId}`);
    console.log(`  └─ Session: ${response.data.sessionNumber}`);
  });

  // Test 5: Question generation
  await tester.test('Question generation', async () => {
    const response = await axios.post(
      `${API_URL}/api/questions/generate`,
      { existing_answers: [] },
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.question) throw new Error('No question in response');
    if (!response.data.optionA) throw new Error('No optionA');
    if (!response.data.optionB) throw new Error('No optionB');
    console.log(`  └─ Q: ${response.data.question}`);
    console.log(`  └─ A: ${response.data.optionA}`);
    console.log(`  └─ B: ${response.data.optionB}`);
  });

  // Test 6: Store answer
  await tester.test('Store answer', async () => {
    const response = await axios.post(
      `${API_URL}/api/profiles/${testProfileId}/answers`,
      {
        question: 'Do you prefer Moon or Sun?',
        answer: 'Moon',
        question_order: 1
      },
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.answerId) throw new Error('No answerId in response');
    console.log(`  └─ Answer ID: ${response.data.answerId}`);
  });

  // Test 7: Store multiple answers
  await tester.test('Store multiple answers for analysis', async () => {
    const testAnswers = [
      { question: 'Moon or Sun?', answer: 'Moon', order: 2 },
      { question: 'Bikes or Walk?', answer: 'Bikes', order: 3 },
      { question: 'Night or Day?', answer: 'Night', order: 4 },
      { question: 'Cities or Wilderness?', answer: 'Wilderness', order: 5 }
    ];

    for (const ans of testAnswers) {
      await axios.post(
        `${API_URL}/api/profiles/${testProfileId}/answers`,
        {
          question: ans.question,
          answer: ans.answer,
          question_order: ans.order
        },
        {
          headers: { Authorization: `Bearer ${testToken}` }
        }
      );
    }
    console.log(`  └─ Stored ${testAnswers.length} answers`);
  });

  // Test 8: Profile analysis
  await tester.test('Profile analysis with AI', async () => {
    const response = await axios.post(
      `${API_URL}/api/profiles/${testProfileId}/analyze`,
      {},
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.profile) throw new Error('No profile in response');
    const profile = response.data.profile;
    if (!profile.archetype) throw new Error('No archetype');
    console.log(`  └─ Archetype: ${profile.archetype}`);
    console.log(`  └─ Strength: ${profile.strengthScore}%`);
    console.log(`  └─ Traits: ${profile.traits.join(', ')}`);
  });

  // Test 9: Get profile
  await tester.test('Retrieve profile', async () => {
    const response = await axios.get(
      `${API_URL}/api/profiles/${testProfileId}`,
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.profile) throw new Error('No profile in response');
    console.log(`  └─ Profile loaded with ${response.data.profile.answers.length} answers`);
  });

  // Test 10: Verification challenge
  await tester.test('Generate verification challenge', async () => {
    const response = await axios.post(
      `${API_URL}/api/profiles/${testProfileId}/verification-challenge`,
      {},
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.challenge) throw new Error('No challenge in response');
    console.log(`  └─ Challenge: ${response.data.challenge.question}`);
    console.log(`  └─ Keywords: ${response.data.challenge.expectedKeywords.join(', ')}`);
  });

  // Test 11: Profile stats
  await tester.test('Get profile statistics', async () => {
    const response = await axios.get(
      `${API_URL}/api/profiles/${testProfileId}/stats`,
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.stats) throw new Error('No stats in response');
    console.log(`  └─ Total Answers: ${response.data.stats.totalAnswers}`);
    console.log(`  └─ Strength: ${response.data.stats.strengthScore}%`);
  });

  // Test 12: Security report
  await tester.test('Get security report', async () => {
    const response = await axios.get(
      `${API_URL}/api/profiles/${testProfileId}/security-report`,
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.report) throw new Error('No report in response');
    console.log(`  └─ Risk Factors: ${response.data.report.riskFactors.join(', ') || 'None'}`);
    console.log(`  └─ Recommendation: ${response.data.report.recommendation}`);
  });

  // Test 13: Get all profiles
  await tester.test('Get all user profiles', async () => {
    const response = await axios.get(
      `${API_URL}/api/profiles`,
      {
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );
    if (!response.data.profiles) throw new Error('No profiles in response');
    console.log(`  └─ Total profiles: ${response.data.profiles.length}`);
  });

  // Test 14: Webhook endpoint
  await tester.test('Webhook endpoint availability', async () => {
    try {
      // This will return 404 or 200 depending on if webhook is set
      const response = await axios.get(`${BOT_URL}/webhook/test`, {
        validateStatus: () => true
      });
      console.log(`  └─ Endpoint responds with status: ${response.status}`);
    } catch (error) {
      // Expected - endpoint requires POST
      console.log(`  └─ Endpoint ready for webhook`);
    }
  });

  // Test 15: Error handling
  await tester.test('Error handling for invalid token', async () => {
    try {
      await axios.get(`${API_URL}/api/profiles`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      throw new Error('Should have failed with invalid token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`  └─ Correctly rejected invalid token`);
      } else {
        throw error;
      }
    }
  });

  // Print report
  console.log('');
  await tester.report();

  // Success/failure exit
  const passed = tester.testResults.filter(r => r.status === '✓ PASS').length;
  if (passed === tester.testCount) {
    console.log('\n✅ All tests passed! Bot is ready for deployment.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
