# Identity Vault Telegram Bot - Setup & Deployment

## 📋 What the Bot Does

1. **User Onboarding** - Welcome message with bot commands
2. **Mini App Launcher** - Seamless access to web app
3. **Profile Notifications** - Alerts when profiles complete
4. **Command Handler** - `/start`, `/help`, `/profiles`, `/stats`, `/security`
5. **Web App Integration** - Telegram Web App data flow
6. **Webhook Support** - Production-ready webhook endpoint

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 16+
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- Running backend API (`server.js`)
- Telegram app on phone/desktop

### 1. Create Your Telegram Bot

```bash
# Open Telegram and message @BotFather
# Send: /newbot
# Follow prompts to get your API token

# Example: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### 2. Bot Setup

```bash
# Install dependencies
npm install node-telegram-bot-api express axios

# Create .env for bot
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_token_here_from_BotFather
API_URL=http://localhost:3000
MINI_APP_URL=https://yourdomain.com/app
PORT=3001
EOF

# Start bot (development mode - polling)
node telegram-bot.js
```

### 3. Test Locally

Open Telegram, find your bot, and:
```
/start     - Begin vault
/help      - View commands
/profiles  - See your profiles
/security  - Security tips
```

---

## 📱 Setup Mini App in Telegram

This is required for the web app integration.

### Step 1: Create Web App with @BotFather

```
1. Message @BotFather
2. Send: /setmenubutton
3. Select your bot
4. Choose "Web App"
5. Enter name: "🚀 Open Vault"
6. Enter URL: https://yourdomain.com/app

OR use /newwebapp to create a new web app
```

### Step 2: Deploy Mini App

The mini app must be served over HTTPS:

**Option A: Vercel (Fastest)**
```bash
# Create vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build"
}

# Deploy
vercel --prod
# Get MINI_APP_URL: https://your-app.vercel.app
```

**Option B: Netlify**
```bash
netlify deploy --prod --dir=public
```

**Option C: Your Server**
```bash
# Serve mini app on same domain as API
# https://yourdomain.com/app
```

### Step 3: Update Bot Configuration

Update `.env`:
```
MINI_APP_URL=https://yourdomain.com/app
WEBHOOK_URL=https://yourdomain.com
```

---

## 🔗 Production Deployment (Webhook Mode)

### Why Webhook?
- **Polling** = bot constantly asks Telegram for updates (slow, battery drain)
- **Webhook** = Telegram pushes updates to your server (fast, efficient)

### Setup Webhook

```bash
# 1. Deploy bot to production server
# (Heroku, AWS, DigitalOcean, etc.)

# 2. Set webhook URL (call once):
curl http://localhost:3001/set-webhook

# Should return: { "success": true }

# 3. Telegram will now POST to:
# https://yourdomain.com/webhook/{TELEGRAM_BOT_TOKEN}

# 4. To switch back to polling:
curl http://localhost:3001/remove-webhook
```

### Heroku Deployment

```bash
# Create Heroku app
heroku create identity-vault-bot

# Set config vars
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set API_URL=https://identity-vault-api.herokuapp.com
heroku config:set MINI_APP_URL=https://yourdomain.com/app
heroku config:set WEBHOOK_URL=https://identity-vault-bot.herokuapp.com

# Deploy
git push heroku main

# Set webhook
curl https://identity-vault-bot.herokuapp.com/set-webhook

# View logs
heroku logs --tail
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "telegram-bot.js"]
```

```bash
docker build -t vault-bot .
docker run -p 3001:3001 \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e API_URL=https://api.yourdomain.com \
  -e MINI_APP_URL=https://yourdomain.com/app \
  vault-bot
```

---

## 📊 Bot Commands Reference

### User Commands

| Command | Description |
|---------|------------|
| `/start` | Initialize bot, show welcome |
| `/help` | Show all commands |
| `/profiles` | List your profiles |
| `/stats` | View statistics |
| `/security` | Security recommendations |

### Bot Buttons

**Welcome Screen:**
- 🚀 Start Vault → Opens mini app
- 📊 My Profiles → Shows profiles
- 🔒 Security → Security info

**Quick Actions (Inline):**
- 🚀 Open Vault
- 📱 Telegram Web App integration

---

## 🔌 API Integration Points

### Bot → Backend Communication

```javascript
// 1. User Registration (auto on first message)
POST /api/auth/register
{
  telegram_id: 123456789,
  username: "tg_123456789",
  password: "secure_token"
}

// 2. Get User Token
// Use token for all API calls

// 3. Backend → Bot Notifications (reverse flow)
POST /notify-profile-complete
{
  telegramId: 123456789,
  profileId: "abc123",
  archetype: "The Nocturnal Nomad",
  strengthScore: 75
}
```

### Web App Data Flow

```javascript
// From Mini App to Bot:
tg.sendData(JSON.stringify({
  event: 'profile_analyzed',
  profile: { ... },
  profileId: 'abc123'
}));

// Bot receives via web_app_data event
bot.on('web_app_data', async (msg) => {
  const data = JSON.parse(msg.web_app_data.data);
  // Handle event
});
```

---

## 🔒 Security Best Practices

### Bot Token Security
✓ Store in `.env` (never commit)
✓ Use environment variables
✓ Rotate token if compromised
✓ Don't log token in console

### User Data
✓ Hash passwords before storage
✓ Use JWT tokens for sessions
✓ Validate all inputs
✓ HTTPS only for web app

### Rate Limiting
Add to bot to prevent spam:

```javascript
const rateLimit = new Map();

bot.on('message', (msg) => {
  const userId = msg.from.id;
  const now = Date.now();
  
  if (!rateLimit.has(userId)) {
    rateLimit.set(userId, []);
  }
  
  const times = rateLimit.get(userId);
  times.push(now);
  
  // 10 messages per minute limit
  const recentMessages = times.filter(t => now - t < 60000);
  
  if (recentMessages.length > 10) {
    bot.sendMessage(msg.chat.id, '⏱️ Too many requests. Slow down!');
    return;
  }
  
  rateLimit.set(userId, recentMessages);
});
```

---

## 🧪 Testing the Bot

### Manual Testing

```bash
# 1. Start bot
node telegram-bot.js

# 2. Open Telegram, find your bot
# 3. Send /start
# 4. Tap "Start Vault" button
# 5. Complete a profile
# 6. Check bot receives notifications
```

### Automated Testing

```javascript
// test-bot.js
const axios = require('axios');

async function testBot() {
  // 1. Register user
  const reg = await axios.post('http://localhost:3001/register-user', {
    telegramId: 123456789,
    username: 'testuser',
    password: 'testpass'
  });
  
  // 2. Simulate web app data
  // (Manual in actual Telegram app)
  
  // 3. Verify notifications sent
  console.log('✓ Bot test complete');
}

testBot();
```

---

## 📈 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3001/health
# { "status": "operational", "bot_token": "✓ Configured" }
```

### Logs
```bash
# Development (polling)
node telegram-bot.js
# Shows: Message sent, Web app data, Errors

# Production (webhook)
docker logs vault-bot-container
heroku logs --tail
```

### Debug Mode
```javascript
// Add to telegram-bot.js
const debug = process.env.DEBUG === 'true';

if (debug) {
  bot.on('message', (msg) => {
    console.log('📨 Message:', msg.text);
  });
}
```

---

## 🚨 Troubleshooting

### Bot Not Responding

```bash
# 1. Check token validity
# BotFather → /mybots → Select bot → Check token

# 2. Restart bot
npm run dev

# 3. Check logs for errors
# Look for: "Error", "Cannot", "Failed"
```

### Mini App Not Loading

```bash
# 1. Verify MINI_APP_URL is HTTPS
# 2. Check CORS headers:
#    Access-Control-Allow-Origin should include Telegram domains
# 3. Test URL in browser:
#    https://yourdomain.com/app should load

# 4. Check browser console for errors
```

### Webhook Not Working

```bash
# 1. Verify domain is accessible
curl https://yourdomain.com/health

# 2. Check webhook status
curl https://api.telegram.org/bot{token}/getWebhookInfo

# 3. Re-set webhook
curl http://localhost:3001/set-webhook

# 4. Check firewall allows HTTPS
```

### Bot Not Saving Data

```bash
# 1. Verify backend API running:
curl http://localhost:3000/health

# 2. Check API_URL in .env
# 3. Verify authentication working:
#    Check logs for "Registration error"
```

---

## 📚 Example Telegram Bot Flow

```
User                    Bot                     API
 │                       │                       │
 ├──/start──────────────>│                       │
 │                       ├─────register────────>│
 │                       │<─────token───────────┤
 │<─Welcome + button─────┤                       │
 │                       │                       │
 ├─Tap "Start Vault"────>│                       │
 │<─Open Mini App────────┤                       │
 │                       │                       │
 │  [Mini App Session]   │                       │
 │  ┌─────────────────┐  │                       │
 │  │ Q1: Moon/Sun?   │  │                       │
 │  │ [Moon]──────────┼──┼──answer────────────>│
 │  │ Q2: Bikes/Walk? │  │<────────ack─────────┤
 │  │ [Bikes]─────────┼──┼──answer────────────>│
 │  │ ... 3 more Qs   │  │                       │
 │  │ Analyze Profile │  │                       │
 │  └─────────────────┘  │                       │
 │                       │<─profile analysis────┤
 ├─Send profile data────>│                       │
 │                       ├──notify complete────>│
 │<─Profile Complete!────┤                       │
 │  Archetype: Nomad     │                       │
 │  Strength: 75%        │                       │
```

---

## ✅ Deployment Checklist

- [ ] Created bot with @BotFather
- [ ] Saved TELEGRAM_BOT_TOKEN in .env
- [ ] Backend API running (test /health)
- [ ] Mini app hosted on HTTPS
- [ ] MINI_APP_URL configured in .env
- [ ] Bot tested locally (/start command works)
- [ ] Webhook URL configured (for production)
- [ ] Rate limiting implemented
- [ ] Error handling in place
- [ ] Logging setup
- [ ] Deployed to production server
- [ ] Called /set-webhook
- [ ] Tested end-to-end in Telegram

---

## 🎓 Next Steps

1. ✅ Telegram bot running
2. 🔄 **TODO:** Connect mini app to bot
3. 🔄 **TODO:** Test end-to-end flow
4. 🔄 **TODO:** Deploy to production
5. 🔄 **TODO:** Monitor performance
6. 🔄 **TODO:** Implement bot analytics
7. 🔄 **TODO:** Add more commands

---

**Your Identity Vault bot is ready to authenticate users on Telegram!** 🤖🔐
