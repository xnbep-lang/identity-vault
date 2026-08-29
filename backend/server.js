const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://t.me'],
  credentials: true
}));

// Serve the Telegram Mini App UI at /app (same origin as the API, so no CORS
// headaches — the page's own fetch() calls just hit /api/... directly)
app.use('/app', express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('SQLite database initialized (in-memory)');
});

// Initialize Anthropic client
const client = new Anthropic();

// ============= DATABASE SETUP =============
const initializeDatabase = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      telegram_id TEXT UNIQUE,
      username TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME
    )
  `);

  // Profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_number INTEGER,
      archetype TEXT,
      traits TEXT,
      patterns TEXT,
      strength_score INTEGER,
      risk_factors TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Answers table (stores each individual answer)
  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      question TEXT,
      answer TEXT,
      question_order INTEGER,
      answer_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    )
  `);

  // Verification attempts table (for security analysis)
  db.run(`
    CREATE TABLE IF NOT EXISTS verification_attempts (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      question TEXT,
      user_answer TEXT,
      expected_hint TEXT,
      success BOOLEAN,
      attempt_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    )
  `);

  console.log('✓ Database tables created');
};

initializeDatabase();

// ============= UTILITY FUNCTIONS =============

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Database helper: Promise wrapper
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ============= MIDDLEWARE =============

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  req.userId = decoded.userId;
  next();
};

// ============= API ENDPOINTS =============

// 1. AUTH ENDPOINTS

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { telegram_id, username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const timestamp = new Date().toISOString();

    await dbRun(
      'INSERT INTO users (id, telegram_id, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, telegram_id || null, username, passwordHash, timestamp]
    );

    const token = generateToken(userId);
    res.status(201).json({ 
      success: true, 
      userId, 
      token,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) return res.status(401).json({ error: 'Invalid password' });

    await dbRun('UPDATE users SET last_active = ? WHERE id = ?', [new Date().toISOString(), user.id]);

    const token = generateToken(user.id);
    res.json({ 
      success: true,
      userId: user.id,
      username: user.username,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// 2. QUESTION GENERATION ENDPOINT

// Generate contextual question using Claude
app.post('/api/questions/generate', authenticateUser, async (req, res) => {
  try {
    const { existing_answers = [] } = req.body;

    const answerContext = existing_answers.length > 0
      ? existing_answers.map(a => `${a.question}: ${a.answer}`).join(' | ')
      : 'None yet';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are an identity profiler creating security questions. Based on user answers, generate ONE binary choice question that reveals lifestyle/personality patterns. 
      
      Format your response EXACTLY as: "What do you prefer: [Option A] or [Option B]?"
      
      Keep it short and evocative. Make sure both options are distinct and meaningful.`,
      messages: [
        {
          role: 'user',
          content: `Previous answers: ${answerContext}. Generate a contextual question that probes deeper into this profile. The question should feel personal and help build a unique identity fingerprint.`
        }
      ]
    });

    const questionText = message.content[0].text;
    const optionsMatch = questionText.match(/\[([^\]]+)\]/g);
    const [optionA, optionB] = optionsMatch
      ? [optionsMatch[0].slice(1, -1), optionsMatch[1].slice(1, -1)]
      : ['Option A', 'Option B'];

    res.json({
      success: true,
      question: questionText,
      optionA,
      optionB,
      question_order: existing_answers.length + 1
    });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. PROFILE MANAGEMENT ENDPOINTS

// Create new profile session
app.post('/api/profiles/create', authenticateUser, async (req, res) => {
  try {
    const profileId = generateId();
    const timestamp = new Date().toISOString();

    // Get session number
    const lastSession = await dbGet(
      'SELECT MAX(session_number) as max_session FROM profiles WHERE user_id = ?',
      [req.userId]
    );
    const sessionNumber = (lastSession?.max_session || 0) + 1;

    await dbRun(
      'INSERT INTO profiles (id, user_id, session_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [profileId, req.userId, sessionNumber, timestamp, timestamp]
    );

    res.status(201).json({
      success: true,
      profileId,
      sessionNumber,
      message: 'Profile session created'
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store answer
app.post('/api/profiles/:profileId/answers', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { question, answer, question_order } = req.body;

    // Verify profile belongs to user
    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(403).json({ error: 'Profile not found or unauthorized' });

    const answerId = generateId();
    await dbRun(
      'INSERT INTO answers (id, profile_id, question, answer, question_order) VALUES (?, ?, ?, ?, ?)',
      [answerId, profileId, question, answer, question_order]
    );

    res.status(201).json({
      success: true,
      answerId,
      message: 'Answer stored'
    });
  } catch (error) {
    console.error('Answer storage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze profile with Claude
app.post('/api/profiles/:profileId/analyze', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;

    // Verify profile belongs to user
    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(403).json({ error: 'Profile not found' });

    // Get all answers
    const answers = await dbAll('SELECT question, answer FROM answers WHERE profile_id = ? ORDER BY question_order', [profileId]);

    if (answers.length === 0) {
      return res.status(400).json({ error: 'No answers to analyze' });
    }

    const answerSummary = answers.map(a => `${a.question}: ${a.answer}`).join(' | ');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are a security psychologist analyzing identity profiles. Based on user answers, create a comprehensive personality profile. 
      
      Return ONLY valid JSON with NO markdown, NO code blocks, NO extra text. 
      
      Return this exact structure:
      {
        "archetype": "single word or two-word archetype name",
        "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
        "patterns": "2-3 sentences describing the identity pattern",
        "riskFactors": ["factor1", "factor2"],
        "strengthScore": 0-100,
        "recommendation": "brief recommendation for vault usage"
      }`,
      messages: [
        {
          role: 'user',
          content: `Analyze this identity profile from answers: ${answerSummary}`
        }
      ]
    });

    let profileData;
    try {
      const responseText = message.content[0].text;
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      profileData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error:', message.content[0].text);
      profileData = {
        archetype: 'The Seeker',
        traits: ['Independent', 'Thoughtful', 'Distinctive'],
        patterns: 'Your answers reveal a pattern of non-conventional choices aligned with personal values.',
        riskFactors: ['Emergent pattern'],
        strengthScore: 50,
        recommendation: 'Continue adding sessions to strengthen profile'
      };
    }

    // Update profile
    const timestamp = new Date().toISOString();
    await dbRun(
      `UPDATE profiles 
       SET archetype = ?, traits = ?, patterns = ?, risk_factors = ?, strength_score = ?, updated_at = ?
       WHERE id = ?`,
      [
        profileData.archetype,
        JSON.stringify(profileData.traits),
        profileData.patterns,
        JSON.stringify(profileData.riskFactors),
        profileData.strengthScore,
        timestamp,
        profileId
      ]
    );

    res.json({
      success: true,
      profile: {
        ...profileData,
        profileId,
        traits: profileData.traits,
        riskFactors: profileData.riskFactors
      }
    });
  } catch (error) {
    console.error('Profile analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get profile
app.get('/api/profiles/:profileId', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const answers = await dbAll('SELECT * FROM answers WHERE profile_id = ? ORDER BY question_order', [profileId]);

    res.json({
      success: true,
      profile: {
        ...profile,
        traits: profile.traits ? JSON.parse(profile.traits) : [],
        riskFactors: profile.risk_factors ? JSON.parse(profile.risk_factors) : [],
        answers
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all profiles for user
app.get('/api/profiles', authenticateUser, async (req, res) => {
  try {
    const profiles = await dbAll('SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);

    res.json({
      success: true,
      profiles: profiles.map(p => ({
        ...p,
        traits: p.traits ? JSON.parse(p.traits) : [],
        riskFactors: p.risk_factors ? JSON.parse(p.risk_factors) : []
      }))
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. VERIFICATION ENDPOINTS

// Generate verification question
app.post('/api/profiles/:profileId/verification-challenge', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(403).json({ error: 'Profile not found' });

    const profileData = {
      archetype: profile.archetype,
      traits: profile.traits ? JSON.parse(profile.traits) : [],
      patterns: profile.patterns
    };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You are a security verification system. Based on a user's identity profile, generate a verification question that only they should be able to answer consistently.
      
      Return ONLY JSON, no markdown:
      {
        "question": "A question that probes their identity",
        "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
      }`,
      messages: [
        {
          role: 'user',
          content: `Based on this profile - Archetype: ${profileData.archetype}, Traits: ${profileData.traits.join(', ')}, create a verification question.`
        }
      ]
    });

    let verificationData;
    try {
      const responseText = message.content[0].text;
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      verificationData = JSON.parse(cleanJson);
    } catch (parseError) {
      verificationData = {
        question: "Based on your profile, would you describe yourself as more structured or spontaneous?",
        expectedKeywords: ['spontaneous', 'structured', 'flexible']
      };
    }

    res.json({
      success: true,
      challenge: {
        profileId,
        ...verificationData
      }
    });
  } catch (error) {
    console.error('Verification challenge error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check verification answer
app.post('/api/profiles/:profileId/verify-answer', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { question, userAnswer, expectedKeywords } = req.body;

    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(403).json({ error: 'Profile not found' });

    // Check if answer contains expected keywords
    const answerLower = userAnswer.toLowerCase();
    const keywordMatch = expectedKeywords.some(keyword =>
      answerLower.includes(keyword.toLowerCase())
    );

    // Store verification attempt
    const attemptId = generateId();
    await dbRun(
      'INSERT INTO verification_attempts (id, profile_id, question, user_answer, expected_hint, success) VALUES (?, ?, ?, ?, ?, ?)',
      [attemptId, profileId, question, userAnswer, JSON.stringify(expectedKeywords), keywordMatch]
    );

    res.json({
      success: true,
      verified: keywordMatch,
      confidence: keywordMatch ? 95 : 20,
      message: keywordMatch ? 'Identity verified. Vault unlocked.' : 'Verification failed. Try again.',
      attemptId
    });
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. ANALYTICS & SECURITY ENDPOINTS

// Get profile statistics
app.get('/api/profiles/:profileId/stats', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const answers = await dbAll('SELECT * FROM answers WHERE profile_id = ?', [profileId]);
    const verifications = await dbAll('SELECT * FROM verification_attempts WHERE profile_id = ?', [profileId]);

    const successfulVerifications = verifications.filter(v => v.success).length;
    const verificationRate = verifications.length > 0 ? (successfulVerifications / verifications.length * 100).toFixed(2) : 0;

    res.json({
      success: true,
      stats: {
        profileId,
        totalAnswers: answers.length,
        totalVerificationAttempts: verifications.length,
        successfulVerifications,
        verificationRate: `${verificationRate}%`,
        strengthScore: profile.strength_score,
        archetype: profile.archetype,
        createdAt: profile.created_at,
        lastUpdated: profile.updated_at
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get security report
app.get('/api/profiles/:profileId/security-report', authenticateUser, async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await dbGet('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [profileId, req.userId]);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const verifications = await dbAll('SELECT * FROM verification_attempts WHERE profile_id = ? ORDER BY attempt_timestamp DESC LIMIT 10', [profileId]);

    res.json({
      success: true,
      report: {
        profileId,
        riskFactors: profile.risk_factors ? JSON.parse(profile.risk_factors) : [],
        strengthScore: profile.strength_score,
        vulnerabilities: profile.strength_score < 50 ? ['Profile not mature enough', 'Insufficient answer diversity'] : [],
        recentVerifications: verifications,
        recommendation: profile.strength_score > 70 ? 'Safe to use for sensitive data' : 'Need more sessions to strengthen profile'
      }
    });
  } catch (error) {
    console.error('Security report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║     IDENTITY VAULT API - SECURE BACKEND               ║
║     Running on http://localhost:${PORT}              ║
╚═══════════════════════════════════════════════════════╝

✓ SQLite database initialized
✓ Anthropic API configured
✓ CORS enabled for Telegram Bot API
✓ JWT authentication active
✓ Express server ready

Endpoints available:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/questions/generate
  POST   /api/profiles/create
  POST   /api/profiles/:id/answers
  POST   /api/profiles/:id/analyze
  POST   /api/profiles/:id/verification-challenge
  POST   /api/profiles/:id/verify-answer
  GET    /api/profiles
  GET    /api/profiles/:id
  GET    /api/profiles/:id/stats
  GET    /api/profiles/:id/security-report
  GET    /health
  `);
});

module.exports = app;
