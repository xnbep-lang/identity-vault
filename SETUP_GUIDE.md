# Identity Vault - Setup & Deployment Guide

## 📋 Project Structure

```
identity-vault/
├── backend/
│   ├── server.js              # Main Express API
│   ├── package.json           # Dependencies
│   ├── .env                   # Configuration (create from .env.example)
│   └── IdentityVaultClient.js # JS client library
├── frontend/
│   ├── identity-profiler.jsx  # React Mini App
│   └── index.html             # HTML wrapper
└── README.md
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Anthropic API key ([get it here](https://console.anthropic.com/))

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
nano .env

# Start development server
npm run dev
# Server runs on http://localhost:3000
```

### 2. Frontend Setup (React Mini App)

```bash
# Option A: Use the provided identity-profiler.jsx directly in a React app
# Add to your React project:
npm install lucide-react

# Then import and use:
import IdentityProfiler from './identity-profiler.jsx'

# Option B: Standalone HTML + React
# Create index.html:
<!DOCTYPE html>
<html>
  <head>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" src="identity-profiler.jsx"></script>
  </body>
</html>
```

### 3. Test the API

```bash
# Use the client library
node -e "
const Client = require('./IdentityVaultClient.js');
const vault = new Client('http://localhost:3000');

(async () => {
  // Register
  const reg = await vault.register('testuser', 'testpass123');
  console.log('Registered:', reg);

  // Run full session
  const session = await vault.runCompleteSession(5);
  console.log('Profile:', session.profile);
})();
"
```

---

## 🔑 API Endpoints Reference

### Authentication

```bash
# Register
POST /api/auth/register
{
  "username": "john_doe",
  "password": "secure_password",
  "telegram_id": "optional_123456"
}

# Login
POST /api/auth/login
{
  "username": "john_doe",
  "password": "secure_password"
}
# Returns: { token, userId, username }
```

### Profile Management

```bash
# Create new profile session
POST /api/profiles/create
Headers: Authorization: Bearer <token>

# Store an answer
POST /api/profiles/:profileId/answers
{
  "question": "What do you prefer: [Moon] or [Sun]?",
  "answer": "Moon",
  "question_order": 1
}

# Generate AI question (contextual)
POST /api/questions/generate
{
  "existing_answers": [
    { "question": "...", "answer": "Moon" }
  ]
}

# Analyze profile (after 5 answers)
POST /api/profiles/:profileId/analyze

# Get profile details
GET /api/profiles/:profileId

# Get all user profiles
GET /api/profiles
```

### Verification

```bash
# Generate verification challenge
POST /api/profiles/:profileId/verification-challenge

# Check answer
POST /api/profiles/:profileId/verify-answer
{
  "question": "Based on your profile...",
  "userAnswer": "user's response",
  "expectedKeywords": ["moon", "night"]
}
```

### Analytics

```bash
# Profile statistics
GET /api/profiles/:profileId/stats

# Security report
GET /api/profiles/:profileId/security-report
```

---

## 🎯 Client Library Usage

### JavaScript/Node.js

```javascript
const IdentityVaultClient = require('./IdentityVaultClient.js');

const vault = new IdentityVaultClient('http://localhost:3000');

// 1. Register
await vault.register('username', 'password');

// 2. Generate questions
const question = await vault.generateQuestion([]);
// { question, optionA, optionB }

// 3. Create profile
const profile = await vault.createProfile();

// 4. Store answers
await vault.storeAnswer(profileId, question.text, answer, 1);

// 5. Analyze
const analysis = await vault.analyzeProfile(profileId);
// { archetype, traits, patterns, strengthScore }

// 6. Verify
const challenge = await vault.generateVerificationChallenge(profileId);
const result = await vault.verifyAnswer(profileId, challenge.question, userAnswer, challenge.expectedKeywords);
// { verified: boolean, confidence: 0-100 }
```

### React Integration

```javascript
import IdentityVaultClient from './IdentityVaultClient.js';
import IdentityProfiler from './identity-profiler.jsx';

function App() {
  const vault = new IdentityVaultClient(
    process.env.REACT_APP_API_URL || 'http://localhost:3000'
  );

  return (
    <IdentityProfiler vaultClient={vault} />
  );
}
```

---

## 🔐 Security Considerations

### Production Checklist

- [ ] Change `JWT_SECRET` to a long random string
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (not HTTP)
- [ ] Implement rate limiting (provided in code)
- [ ] Add input validation (use `validator` package)
- [ ] Enable CORS restrictions to trusted domains
- [ ] Use PostgreSQL instead of in-memory SQLite
- [ ] Implement request signing for critical operations
- [ ] Add comprehensive logging
- [ ] Regular security audits of profiles

### Database Persistence

Replace in-memory SQLite with PostgreSQL:

```javascript
// Install: npm install pg pg-promise

const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);

// Then replace all db.run/db.get/db.all calls with:
db.run(sql, values);
db.one(sql, values);
db.any(sql, values);
```

---

## 🧪 Testing Profiles (Security Research)

### Attack Vectors to Test Against Your Own Profiles:

1. **Consistency Testing**
   ```bash
   # Ask same questions multiple times - verify user answers consistently
   # Can you fool the system by changing your answers?
   ```

2. **Pattern Inference**
   ```bash
   # What patterns does the AI detect?
   # Can demographic stats predict your answers?
   ```

3. **Answer Manipulation**
   ```bash
   # What if you answer randomly? Does profile still form?
   # What's the minimum consistency needed to verify?
   ```

4. **Statistical Attack**
   ```bash
   # Can someone brute-force your identity fingerprint?
   # How unique is your profile vs others?
   ```

### Recommended Testing Flow:

```javascript
const vault = new IdentityVaultClient();

// Create 10 test profiles with different strategies
const strategies = [
  'truthful',          // Always answer honestly
  'consistent-lie',    // Consistent fake identity
  'random',            // Random answers
  'opposite',          // Always opposite preference
  'demographic-based'  // Answer based on assumed stats
];

for (let strategy of strategies) {
  const session = await vault.runCompleteSession(5);
  // Analyze results, check strength scores
  // Try to verify with different strategies
}
```

---

## 📊 Understanding Strength Score

- **0-30%**: Weak - Profile still forming, insufficient diversity
- **30-60%**: Medium - Enough answers for basic verification
- **60-80%**: Strong - Good for moderate sensitivity data
- **80-100%**: Vault-Ready - Safe for highly sensitive information

The score considers:
- Answer diversity (not all same option)
- Pattern clarity (AI confidence)
- Session count (multiple sessions strengthen)
- Verification success rate

---

## 🚢 Deployment Options

### Option 1: Heroku (Simplest)

```bash
# Create Heroku app
heroku create identity-vault-api

# Set environment variables
heroku config:set ANTHROPIC_API_KEY=sk-ant-xxx
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build
docker build -t identity-vault .

# Run
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-xxx \
  -e JWT_SECRET=your-secret \
  identity-vault
```

### Option 3: AWS/GCP/Azure

Use managed Node.js hosting with environment variable configuration.

---

## 📱 Telegram Bot Integration (Future)

Once you implement the Telegram Bot:

```javascript
// bot.js
const TelegramBot = require('node-telegram-bot-api');
const IdentityVaultClient = require('./IdentityVaultClient.js');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const vault = new IdentityVaultClient(process.env.API_URL);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  // Redirect to mini app
  bot.sendMessage(chatId, 'Starting Identity Vault...', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Open Vault',
          web_app: { url: 'https://yourdomain.com/app' }
        }
      ]]
    }
  });
});
```

---

## 🐛 Troubleshooting

### "Cannot find module '@anthropic-ai/sdk'"
```bash
npm install @anthropic-ai/sdk
```

### "ANTHROPIC_API_KEY is missing"
```bash
# Make sure .env file exists and contains:
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### "CORS error from frontend"
```bash
# Update .env:
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.com
```

### Database locked (SQLite)
```bash
# SQLite doesn't handle concurrent writes well
# Switch to PostgreSQL for production
```

---

## 📚 Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com)
- [Express.js Guide](https://expressjs.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Security Guidelines](https://owasp.org/)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

---

## 🎓 Next Steps

1. ✅ Backend API running locally
2. ✅ Frontend Mini App connected to API
3. 🔄 **TODO:** Implement Telegram Bot wrapper
4. 🔄 **TODO:** Build attack/testing module
5. 🔄 **TODO:** Deploy to production
6. 🔄 **TODO:** Add Telegram Mini App integration
7. 🔄 **TODO:** Build analytics dashboard

---

**Built with security, AI, and ethical testing in mind** 🔐🤖
