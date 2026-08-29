/**
 * Identity Vault - Attack & Fuzzing Module
 * Test your own profiles against various attack strategies
 * 
 * Strategies:
 * 1. Consistency Attack - Change answers over time
 * 2. Random Attack - Answer randomly
 * 3. Demographic Attack - Answer based on inferred stats
 * 4. Brute Force Attack - Try common patterns
 * 5. Mimicry Attack - Try to copy other profiles
 * 6. Pattern Manipulation - Exploit detected patterns
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AttackModule {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl || 'http://localhost:3000';
    this.token = token;
    this.results = [];
    this.vulnerabilities = [];
  }

  // ============= ATTACK STRATEGIES =============

  /**
   * Strategy 1: Consistency Attack
   * Build profile, then change answers on verification
   */
  async consistencyAttack(profileId) {
    console.log('\n🔴 [ATTACK] Consistency Attack - Answer differently on verification');
    
    const result = {
      name: 'Consistency Attack',
      profileId,
      description: 'Answer differently during verification to fool the system',
      success: false,
      details: {}
    };

    try {
      // Get profile
      const profileRes = await this.apiRequest(`/api/profiles/${profileId}`, 'GET');
      const profile = profileRes.profile;

      // Get verification challenge
      const challengeRes = await this.apiRequest(
        `/api/profiles/${profileId}/verification-challenge`,
        'POST',
        {}
      );
      const challenge = challengeRes.challenge;

      // Try opposite of expected
      const keywords = challenge.expectedKeywords;
      const opposites = {
        'moon': 'sun',
        'sun': 'moon',
        'night': 'day',
        'day': 'night',
        'bikes': 'walk',
        'walk': 'bikes',
        'city': 'wilderness',
        'wilderness': 'city'
      };

      let maliciousAnswer = 'different';
      for (const keyword of keywords) {
        if (opposites[keyword.toLowerCase()]) {
          maliciousAnswer = opposites[keyword.toLowerCase()];
          break;
        }
      }

      // Try to verify with wrong answer
      const verifyRes = await this.apiRequest(
        `/api/profiles/${profileId}/verify-answer`,
        'POST',
        {
          question: challenge.question,
          userAnswer: maliciousAnswer,
          expectedKeywords: keywords
        }
      );

      result.details = {
        challenge: challenge.question,
        expectedKeywords: keywords,
        maliciousAnswer,
        systemResponse: verifyRes
      };

      if (!verifyRes.verified) {
        result.details.observation = '✓ System correctly rejected inconsistent answer';
      } else {
        result.success = true;
        result.details.observation = '✗ VULNERABILITY: System accepted inconsistent answer';
        this.vulnerabilities.push({
          type: 'Consistency',
          description: 'Profile accepted different answers',
          severity: 'HIGH',
          impact: 'Attacker can bypass verification by changing identity'
        });
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Strategy 2: Random Answer Attack
   * Create profile with random answers, check if it still gets strong score
   */
  async randomAnswerAttack() {
    console.log('\n🔴 [ATTACK] Random Answer Attack - Build profile with random choices');

    const result = {
      name: 'Random Answer Attack',
      description: 'Answer randomly to see if profile strength is meaningful',
      success: false,
      details: {}
    };

    try {
      // Create profile
      const profileRes = await this.apiRequest('/api/profiles/create', 'POST', {});
      const profileId = profileRes.profileId;

      const answers = [];
      const questions = [];

      // Answer 5 random questions
      for (let i = 0; i < 5; i++) {
        // Generate question
        const questionRes = await this.apiRequest(
          '/api/questions/generate',
          'POST',
          { existing_answers: answers }
        );
        const question = questionRes.question;
        const optionA = questionRes.optionA;
        const optionB = questionRes.optionB;

        // Random choice (0 or 1)
        const randomChoice = Math.random() > 0.5 ? optionA : optionB;

        questions.push({ question, optionA, optionB });

        // Store random answer
        await this.apiRequest(
          `/api/profiles/${profileId}/answers`,
          'POST',
          {
            question,
            answer: randomChoice,
            question_order: i + 1
          }
        );

        answers.push({ question, answer: randomChoice });
      }

      // Analyze profile
      const analysisRes = await this.apiRequest(
        `/api/profiles/${profileId}/analyze`,
        'POST',
        {}
      );

      const profile = analysisRes.profile;
      const strengthScore = profile.strengthScore;

      result.details = {
        randomAnswers: answers,
        profile: {
          archetype: profile.archetype,
          traits: profile.traits,
          strengthScore
        }
      };

      // Check if random answers got decent score
      if (strengthScore > 50) {
        result.success = true;
        result.details.observation = `⚠️ FINDING: Random answers scored ${strengthScore}% - AI may overfit`;
        this.vulnerabilities.push({
          type: 'Overfitting',
          description: `Random answers achieved ${strengthScore}% strength`,
          severity: 'MEDIUM',
          impact: 'AI may create patterns from noise'
        });
      } else {
        result.details.observation = `✓ Random answers scored ${strengthScore}% - reasonable`;
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Strategy 3: Demographics-Based Attack
   * Answer based on statistical assumptions
   */
  async demographicsAttack(demographics = {}) {
    console.log('\n🔴 [ATTACK] Demographics Attack - Infer answers from stats');

    const result = {
      name: 'Demographics Attack',
      description: 'Predict answers based on demographic stereotypes',
      success: false,
      details: {
        demographics
      }
    };

    try {
      // Common demographic patterns
      const patterns = {
        age: {
          young: { moon: 0.7, night: 0.8, city: 0.6, tech: 0.9 },
          old: { sun: 0.7, day: 0.8, nature: 0.7, walk: 0.6 }
        },
        timezone: {
          east: { morning: 0.9, walk: 0.5 },
          west: { night: 0.8, bikes: 0.7 }
        },
        region: {
          urban: { city: 0.9, tech: 0.8 },
          rural: { nature: 0.9, outdoors: 0.8 }
        }
      };

      // Build stereotype profile
      const stereotypeAnswers = [];
      const selectedPatterns = patterns[demographics.category || 'age'][
        demographics.value || 'young'
      ] || {};

      const commonQuestions = [
        { q: 'Moon or Sun?', options: ['Moon', 'Sun'], pattern: 'moon' },
        { q: 'Night or Day?', options: ['Night', 'Day'], pattern: 'night' },
        { q: 'City or Nature?', options: ['City', 'Nature'], pattern: 'city' },
        { q: 'Bikes or Walk?', options: ['Bikes', 'Walk'], pattern: 'bikes' },
        { q: 'Tech or Outdoors?', options: ['Tech', 'Outdoors'], pattern: 'tech' }
      ];

      // Create profile with stereotype answers
      const profileRes = await this.apiRequest('/api/profiles/create', 'POST', {});
      const profileId = profileRes.profileId;

      for (let i = 0; i < commonQuestions.length; i++) {
        const qItem = commonQuestions[i];
        const pattern = qItem.pattern;
        const confidence = selectedPatterns[pattern] || 0.5;

        // Choose based on pattern confidence
        const choice = Math.random() < confidence ? qItem.options[0] : qItem.options[1];

        await this.apiRequest(
          `/api/profiles/${profileId}/answers`,
          'POST',
          {
            question: qItem.q,
            answer: choice,
            question_order: i + 1
          }
        );

        stereotypeAnswers.push({ question: qItem.q, answer: choice });
      }

      // Analyze
      const analysisRes = await this.apiRequest(
        `/api/profiles/${profileId}/analyze`,
        'POST',
        {}
      );

      const profile = analysisRes.profile;

      result.details.stereotypeAnswers = stereotypeAnswers;
      result.details.profile = {
        archetype: profile.archetype,
        strengthScore: profile.strengthScore
      };

      // Check if demographic attack worked
      if (profile.strengthScore > 60) {
        result.success = true;
        result.details.observation = `⚠️ Demographic stereotype scored ${profile.strengthScore}%`;
        this.vulnerabilities.push({
          type: 'Demographic Predictability',
          description: `Stereotypical answers based on ${demographics.category} achieved ${profile.strengthScore}%`,
          severity: 'MEDIUM',
          impact: 'Profile could be spoofed using demographic inference'
        });
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Strategy 4: Brute Force Attack
   * Try all common answer combinations
   */
  async bruteForceAttack() {
    console.log('\n🔴 [ATTACK] Brute Force Attack - Try common patterns');

    const result = {
      name: 'Brute Force Attack',
      description: 'Systematically try common answer patterns',
      success: false,
      details: {
        patterns: [],
        successfulPatterns: []
      }
    };

    try {
      // Common patterns
      const patterns = [
        ['Option A', 'Option A', 'Option A', 'Option A', 'Option A'], // All same
        ['Option A', 'Option B', 'Option A', 'Option B', 'Option A'], // Alternating
        ['Option A', 'Option A', 'Option B', 'Option B', 'Option A'], // Grouping
        ['Option B', 'Option B', 'Option B', 'Option B', 'Option B'], // All opposite
      ];

      for (let patternIdx = 0; patternIdx < patterns.length; patternIdx++) {
        const pattern = patterns[patternIdx];

        try {
          // Create profile
          const profileRes = await this.apiRequest('/api/profiles/create', 'POST', {});
          const profileId = profileRes.profileId;

          const answers = [];

          // Answer with pattern
          for (let i = 0; i < 5; i++) {
            const questionRes = await this.apiRequest(
              '/api/questions/generate',
              'POST',
              { existing_answers: answers }
            );

            const choice = pattern[i] === 'Option A' 
              ? questionRes.optionA 
              : questionRes.optionB;

            await this.apiRequest(
              `/api/profiles/${profileId}/answers`,
              'POST',
              {
                question: questionRes.question,
                answer: choice,
                question_order: i + 1
              }
            );

            answers.push({ question: questionRes.question, answer: choice });
          }

          // Analyze
          const analysisRes = await this.apiRequest(
            `/api/profiles/${profileId}/analyze`,
            'POST',
            {}
          );

          const strengthScore = analysisRes.profile.strengthScore;

          const patternResult = {
            pattern: pattern.join(' → '),
            strengthScore,
            archetype: analysisRes.profile.archetype
          };

          result.details.patterns.push(patternResult);

          if (strengthScore > 50) {
            result.details.successfulPatterns.push(patternResult);
            result.success = true;
          }
        } catch (error) {
          console.log(`  Pattern ${patternIdx + 1} failed: ${error.message}`);
        }
      }

      if (result.success) {
        this.vulnerabilities.push({
          type: 'Predictable Patterns',
          description: `Simple patterns achieved 50%+ strength`,
          severity: 'MEDIUM',
          impact: 'Attacker can use predictable answer sequences'
        });
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Strategy 5: Session Manipulation
   * Complete multiple sessions to see evolution
   */
  async sessionManipulationAttack() {
    console.log('\n🔴 [ATTACK] Session Manipulation - Build profile over time');

    const result = {
      name: 'Session Manipulation',
      description: 'See if multiple sessions strengthen fake profile',
      success: false,
      details: {
        sessions: []
      }
    };

    try {
      // Create multiple profiles with same (possibly false) identity
      for (let sessionNum = 1; sessionNum <= 3; sessionNum++) {
        const profileRes = await this.apiRequest('/api/profiles/create', 'POST', {});
        const profileId = profileRes.profileId;

        const answers = [];

        // Answer consistently for this session
        for (let i = 0; i < 5; i++) {
          const questionRes = await this.apiRequest(
            '/api/questions/generate',
            'POST',
            { existing_answers: answers }
          );

          // Consistent but arbitrary choice
          const choice = Math.random() > 0.5 ? questionRes.optionA : questionRes.optionB;

          await this.apiRequest(
            `/api/profiles/${profileId}/answers`,
            'POST',
            {
              question: questionRes.question,
              answer: choice,
              question_order: i + 1
            }
          );

          answers.push({ question: questionRes.question, answer: choice });
        }

        // Analyze
        const analysisRes = await this.apiRequest(
          `/api/profiles/${profileId}/analyze`,
          'POST',
          {}
        );

        result.details.sessions.push({
          sessionNumber: sessionNum,
          strengthScore: analysisRes.profile.strengthScore,
          archetype: analysisRes.profile.archetype
        });
      }

      // Check if strength increases linearly
      const scores = result.details.sessions.map(s => s.strengthScore);
      const avgGrowth = (scores[scores.length - 1] - scores[0]) / (scores.length - 1);

      if (avgGrowth > 10) {
        result.success = true;
        result.details.observation = `⚠️ Strength grows ${avgGrowth.toFixed(1)}% per session`;
        this.vulnerabilities.push({
          type: 'Session Accumulation',
          description: `Profile strength increases ${avgGrowth.toFixed(1)}% per session`,
          severity: 'MEDIUM',
          impact: 'Attacker can gradually build credibility'
        });
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Strategy 6: Answer Injection
   * Inject extreme or edge case answers
   */
  async answerInjectionAttack() {
    console.log('\n🔴 [ATTACK] Answer Injection - Use extreme/edge case answers');

    const result = {
      name: 'Answer Injection',
      description: 'Test with unusual or extreme answers',
      success: false,
      details: {
        injections: []
      }
    };

    try {
      const extremeAnswers = [
        'Both',
        'Neither',
        'I refuse to answer',
        'This is a false choice',
        '🤖 ROBOT MODE 🤖',
        'All of the above',
        'Skip this question',
        ''
      ];

      for (const injection of extremeAnswers) {
        try {
          const profileRes = await this.apiRequest('/api/profiles/create', 'POST', {});
          const profileId = profileRes.profileId;

          // Inject for each question
          for (let i = 0; i < 5; i++) {
            const questionRes = await this.apiRequest(
              '/api/questions/generate',
              'POST',
              {}
            );

            await this.apiRequest(
              `/api/profiles/${profileId}/answers`,
              'POST',
              {
                question: questionRes.question,
                answer: injection,
                question_order: i + 1
              }
            );
          }

          // Try to analyze
          const analysisRes = await this.apiRequest(
            `/api/profiles/${profileId}/analyze`,
            'POST',
            {}
          );

          if (analysisRes.profile) {
            result.details.injections.push({
              injection,
              accepted: true,
              strengthScore: analysisRes.profile.strengthScore
            });

            if (analysisRes.profile.strengthScore > 40) {
              result.success = true;
              this.vulnerabilities.push({
                type: 'Input Validation',
                description: `Injection "${injection}" was accepted`,
                severity: 'HIGH',
                impact: 'Attacker can bypass answer validation'
              });
            }
          }
        } catch (error) {
          result.details.injections.push({
            injection,
            accepted: false,
            error: error.message
          });
        }
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Strategy 7: Verification Bypass
   * Try to verify without matching profile
   */
  async verificationBypassAttack(profileId) {
    console.log('\n🔴 [ATTACK] Verification Bypass - Try generic answers');

    const result = {
      name: 'Verification Bypass',
      profileId,
      description: 'Try to pass verification with generic/common answers',
      success: false,
      details: {}
    };

    try {
      // Get challenge
      const challengeRes = await this.apiRequest(
        `/api/profiles/${profileId}/verification-challenge`,
        'POST',
        {}
      );

      const challenge = challengeRes.challenge;
      const expectedKeywords = challenge.expectedKeywords;

      // Try various generic answers
      const genericAnswers = [
        'Yes',
        'No',
        'I agree',
        'Obviously',
        'Who cares',
        expectedKeywords[0] || 'definitely',
        'maybe both',
        'I forget'
      ];

      let bypassSuccess = false;

      for (const answer of genericAnswers) {
        try {
          const verifyRes = await this.apiRequest(
            `/api/profiles/${profileId}/verify-answer`,
            'POST',
            {
              question: challenge.question,
              userAnswer: answer,
              expectedKeywords
            }
          );

          if (verifyRes.verified) {
            bypassSuccess = true;
            result.success = true;
            result.details.successfulBypass = {
              answer,
              confidence: verifyRes.confidence
            };

            this.vulnerabilities.push({
              type: 'Verification Bypass',
              description: `Generic answer "${answer}" passed verification`,
              severity: 'CRITICAL',
              impact: 'Attacker can bypass identity verification'
            });
            break;
          }
        } catch (error) {
          // Continue trying
        }
      }

      if (!bypassSuccess) {
        result.details.observation = '✓ All generic bypass attempts failed';
      }
    } catch (error) {
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  // ============= REPORT GENERATION =============

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalAttacks: this.results.length,
      successfulAttacks: this.results.filter(r => r.success).length,
      vulnerabilitiesFound: this.vulnerabilities.length,
      results: this.results,
      vulnerabilities: this.vulnerabilities,
      securityScore: this.calculateSecurityScore()
    };

    return report;
  }

  calculateSecurityScore() {
    // Start at 100
    let score = 100;

    // Deduct for each vulnerability
    for (const vuln of this.vulnerabilities) {
      if (vuln.severity === 'CRITICAL') score -= 25;
      else if (vuln.severity === 'HIGH') score -= 15;
      else if (vuln.severity === 'MEDIUM') score -= 8;
      else score -= 3;
    }

    return Math.max(0, score);
  }

  // ============= API REQUEST HELPER =============

  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        validateStatus: () => true
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);

      if (response.status >= 400) {
        throw new Error(`API Error ${response.status}: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ============= DISPLAY RESULTS =============

  displayResults() {
    console.log(`
╔════════════════════════════════════════════════════════╗
║     IDENTITY VAULT - ATTACK & FUZZING RESULTS         ║
╚════════════════════════════════════════════════════════╝
    `);

    console.log(`
📊 Summary:
  • Total Attacks: ${this.results.length}
  • Successful: ${this.results.filter(r => r.success).length}
  • Vulnerabilities Found: ${this.vulnerabilities.length}
  • Security Score: ${this.calculateSecurityScore()}/100
    `);

    if (this.vulnerabilities.length > 0) {
      console.log(`
⚠️ Vulnerabilities Discovered:
    `);
      this.vulnerabilities.forEach((vuln, idx) => {
        const severityEmoji = {
          CRITICAL: '🔴',
          HIGH: '🟠',
          MEDIUM: '🟡',
          LOW: '🟢'
        }[vuln.severity];

        console.log(`
  ${severityEmoji} ${idx + 1}. ${vuln.type} [${vuln.severity}]
     Description: ${vuln.description}
     Impact: ${vuln.impact}
        `);
      });
    }

    console.log(`
📈 Detailed Results:
    `);
    this.results.forEach((result, idx) => {
      const status = result.success ? '✗ VULNERABLE' : '✓ PASSED';
      console.log(`
  ${status} - ${result.name}
  ${result.description}
  ${result.error ? `  Error: ${result.error}` : ''}
      `);
    });
  }

  displayReportJSON(filePath = 'attack-report.json') {
    const fs = require('fs');
    const report = this.generateReport();
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${filePath}`);
  }
}

module.exports = AttackModule;
