/**
 * Identity Vault API Client
 * Simplifies API interactions for frontend applications
 */

class IdentityVaultClient {
  constructor(baseURL = 'http://localhost:3000', options = {}) {
    this.baseURL = baseURL;
    this.token = options.token || null;
    this.timeout = options.timeout || 10000;
  }

  // ============= AUTHENTICATION =============

  async register(username, password, telegramId = null) {
    const response = await this.request('/api/auth/register', 'POST', {
      username,
      password,
      telegram_id: telegramId
    }, false);

    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(username, password) {
    const response = await this.request('/api/auth/login', 'POST', {
      username,
      password
    }, false);

    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  setToken(token) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vault_token', token);
    }
  }

  loadTokenFromStorage() {
    if (typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('vault_token');
    }
  }

  logout() {
    this.token = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('vault_token');
    }
  }

  // ============= QUESTION GENERATION =============

  async generateQuestion(existingAnswers = []) {
    return this.request('/api/questions/generate', 'POST', {
      existing_answers: existingAnswers
    });
  }

  // ============= PROFILE MANAGEMENT =============

  async createProfile() {
    return this.request('/api/profiles/create', 'POST', {});
  }

  async getProfile(profileId) {
    return this.request(`/api/profiles/${profileId}`, 'GET');
  }

  async getAllProfiles() {
    return this.request('/api/profiles', 'GET');
  }

  async storeAnswer(profileId, question, answer, questionOrder) {
    return this.request(`/api/profiles/${profileId}/answers`, 'POST', {
      question,
      answer,
      question_order: questionOrder
    });
  }

  async analyzeProfile(profileId) {
    return this.request(`/api/profiles/${profileId}/analyze`, 'POST', {});
  }

  // ============= VERIFICATION =============

  async generateVerificationChallenge(profileId) {
    return this.request(`/api/profiles/${profileId}/verification-challenge`, 'POST', {});
  }

  async verifyAnswer(profileId, question, userAnswer, expectedKeywords) {
    return this.request(`/api/profiles/${profileId}/verify-answer`, 'POST', {
      question,
      userAnswer,
      expectedKeywords
    });
  }

  // ============= ANALYTICS & SECURITY =============

  async getProfileStats(profileId) {
    return this.request(`/api/profiles/${profileId}/stats`, 'GET');
  }

  async getSecurityReport(profileId) {
    return this.request(`/api/profiles/${profileId}/security-report`, 'GET');
  }

  // ============= HEALTH CHECK =============

  async checkHealth() {
    return this.request('/health', 'GET', null, false);
  }

  // ============= INTERNAL REQUEST METHOD =============

  async request(endpoint, method = 'GET', data = null, requireAuth = true) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requireAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers,
      timeout: this.timeout
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ============= UTILITY METHODS =============

  /**
   * Run a complete session: create profile, answer questions, analyze
   */
  async runCompleteSession(questionCount = 5) {
    try {
      // 1. Create profile
      const profileRes = await this.createProfile();
      const profileId = profileRes.profileId;

      const answers = [];
      const questionTexts = [];

      // 2. Answer questions
      for (let i = 0; i < questionCount; i++) {
        const questionRes = await this.generateQuestion(answers);
        questionTexts.push(questionRes);

        // Simulate user choice (in real app, this comes from UI)
        const userChoice = Math.random() > 0.5 ? questionRes.optionA : questionRes.optionB;

        // Store answer
        await this.storeAnswer(
          profileId,
          questionRes.question,
          userChoice,
          i + 1
        );

        answers.push({
          question: questionRes.question,
          answer: userChoice
        });

        console.log(`Question ${i + 1}/${questionCount}: ${userChoice}`);
      }

      // 3. Analyze profile
      const analysisRes = await this.analyzeProfile(profileId);

      return {
        profileId,
        answers,
        profile: analysisRes.profile
      };
    } catch (error) {
      console.error('Session error:', error);
      throw error;
    }
  }

  /**
   * Batch create and analyze multiple profiles (for testing)
   */
  async createAndAnalyzeMultipleProfiles(count = 3) {
    const profiles = [];

    for (let i = 0; i < count; i++) {
      console.log(`Creating profile ${i + 1}/${count}...`);
      const session = await this.runCompleteSession(5);
      profiles.push(session);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return profiles;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IdentityVaultClient;
}
