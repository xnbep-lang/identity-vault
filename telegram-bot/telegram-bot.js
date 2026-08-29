const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// ============= CONFIGURATION =============

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://yourdomain.com/app';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://yourdomain.com/webhook';
const PORT = process.env.PORT || 3001;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
  process.exit(1);
}

// ============= INITIALIZE BOT =============

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const app = express();
app.use(express.json());

// Store user sessions
const userSessions = new Map();

// ============= UTILITY FUNCTIONS =============

// Generate user token (link Telegram ID to vault account)
const generateUserCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get or create user session
const getOrCreateSession = (telegramId) => {
  if (!userSessions.has(telegramId)) {
    userSessions.set(telegramId, {
      telegramId,
      code: generateUserCode(),
      createdAt: new Date(),
      status: 'waiting_verification'
    });
  }
  return userSessions.get(telegramId);
};

// Format keyboard button
const webAppButton = (text, url) => {
  return {
    text,
    web_app: { url }
  };
};

// Send message with inline keyboard
const sendWithKeyboard = async (chatId, text, keyboard) => {
  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
};

// ============= TELEGRAM BOT HANDLERS =============

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  console.log(`👤 User started bot: ${username} (${userId})`);

  const session = getOrCreateSession(userId);

  const welcomeText = `
🔐 *Welcome to Identity Vault*

I'm your secure identity profiler. Here's what I do:

📋 *Answer simple preference questions* to build your unique identity fingerprint
🧠 *AI analyzes patterns* to create your security profile
🔓 *Unlock your vault* by proving you're you

Your identity is your key to security. The more you know yourself, the better you're protected.

**Your Session Code:** \`${session.code}\`

Ready to begin? Tap the button below to start! ⬇️
  `;

  await sendWithKeyboard(chatId, welcomeText, [
    [webAppButton('🚀 Start Vault', `${MINI_APP_URL}?code=${session.code}&telegramId=${userId}`)],
    [
      { text: '📊 My Profiles', callback_data: 'view_profiles' },
      { text: '🔒 Security', callback_data: 'security_info' }
    ]
  ]);
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpText = `
*Identity Vault - Help*

**Available Commands:**

/start - Begin or restart the vault
/profiles - View all your profiles
/stats - Get profile statistics
/security - Security recommendations
/help - Show this message

**How it works:**

1️⃣ Tap "Start Vault" button
2️⃣ Answer 5 quick preference questions
3️⃣ AI builds your identity profile
4️⃣ Get your strength score
5️⃣ Use for verification later

**Questions?**
Each question has 2 choices (A or B). There are no "right" answers - just your preferences.

The more honest you are, the stronger your vault becomes.
  `;

  await bot.sendMessage(chatId, helpText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '📱 Open Vault', web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
});

// /profiles command
bot.onText(/\/profiles/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = getOrCreateSession(userId);

  // This would call your backend API
  // For now, show a placeholder
  const profilesText = `
📊 *Your Profiles*

Your vault profiles will appear here once you start sessions.

*Current Session Code:* \`${session.code}\`

To view your profiles:
1. Open the Vault app
2. Complete at least one session
3. Check your profile stats

🚀 [Open Vault](${MINI_APP_URL}?code=${session.code})
  `;

  await bot.sendMessage(chatId, profilesText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
});

// /stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;

  const statsText = `
📈 *Your Statistics*

Once you complete profiles, your stats will show:

• Total profiles created
• Strength scores
• Verification success rate
• Identity patterns detected

🚀 [Create Your First Profile](${MINI_APP_URL})
  `;

  await bot.sendMessage(chatId, statsText, {
    parse_mode: 'Markdown'
  });
});

// /security command
bot.onText(/\/security/, async (msg) => {
  const chatId = msg.chat.id;

  const securityText = `
🔐 *Security Recommendations*

**Vault Strength Levels:**

🟢 *Vault Ready* (80%+)
→ Safe for highly sensitive data
→ Strong identity fingerprint
→ Multiple verified sessions

🟡 *Strong* (60-80%)
→ Good for moderate sensitivity
→ Clear pattern detection
→ Few verification attempts

🟠 *Medium* (30-60%)
→ Enough for basic verification
→ Profile still forming
→ Good foundation

🔴 *Weak* (0-30%)
→ Profile developing
→ Need more answers
→ Keep answering questions

**Tips for Stronger Vault:**
✓ Answer honestly
✓ Complete multiple sessions
✓ Maintain consistency
✓ Use for important data only

🚀 [Strengthen Your Vault](${MINI_APP_URL})
  `;

  await bot.sendMessage(chatId, securityText, {
    parse_mode: 'Markdown'
  });
});

// Callback query handler for inline buttons
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  switch (data) {
    case 'view_profiles':
      bot.emit('text', {
        chat: { id: chatId },
        from: { id: userId },
        text: '/profiles'
      });
      break;

    case 'security_info':
      bot.emit('text', {
        chat: { id: chatId },
        from: { id: userId },
        text: '/security'
      });
      break;

    default:
      break;
  }
});

// Handle Web App data
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const data = msg.web_app_data.data;

  console.log(`📱 Web app data from user ${userId}:`, data);

  try {
    const appData = JSON.parse(data);

    // Handle different app events
    switch (appData.event) {
      case 'profile_created':
        await bot.sendMessage(chatId, `
✅ *Profile Created!*

Session #${appData.sessionNumber}
Profile ID: \`${appData.profileId}\`

Start answering questions to build your identity fingerprint!
        `, { parse_mode: 'Markdown' });
        break;

      case 'profile_analyzed':
        const profile = appData.profile;
        await bot.sendMessage(chatId, `
🎯 *Profile Analyzed!*

*Archetype:* ${profile.archetype}
*Strength:* ${profile.strengthScore}% 💪

*Your Traits:*
${profile.traits.map(t => `• ${t}`).join('\n')}

*Pattern:*
${profile.patterns}

${profile.strengthScore > 70 ? '🟢 Your vault is ready!' : '🟡 Complete more sessions to strengthen it'}
        `, { parse_mode: 'Markdown' });
        break;

      case 'verification_success':
        await bot.sendMessage(chatId, `
🔓 *Vault Unlocked!*

Identity verified successfully!
Confidence: ${appData.confidence}%

Your identity profile authenticated the access.
        `, { parse_mode: 'Markdown' });
        break;

      case 'verification_failed':
        await bot.sendMessage(chatId, `
❌ *Verification Failed*

Your answer doesn't match your profile pattern.
Try again or answer more questions first.
        `, { parse_mode: 'Markdown' });
        break;

      case 'error':
        await bot.sendMessage(chatId, `
⚠️ *Error*

${appData.message}

Please try again or contact support.
        `, { parse_mode: 'Markdown' });
        break;

      default:
        console.log('Unknown event:', appData.event);
    }
  } catch (error) {
    console.error('Error handling web app data:', error);
    await bot.sendMessage(chatId, `
⚠️ Error processing your request: ${error.message}
        `);
  }
});

// ============= EXPRESS WEBHOOK ENDPOINT =============

// Webhook endpoint for Telegram updates
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Set webhook (call this once to configure Telegram)
app.get('/set-webhook', async (req, res) => {
  try {
    const result = await bot.setWebHook(`${WEBHOOK_URL}/${TELEGRAM_BOT_TOKEN}`);
    console.log('✓ Webhook set:', result);
    res.json({ success: true, message: 'Webhook configured' });
  } catch (error) {
    console.error('Webhook setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove webhook (call to switch back to polling)
app.get('/remove-webhook', async (req, res) => {
  try {
    await bot.deleteWebHook();
    console.log('✓ Webhook removed');
    res.json({ success: true, message: 'Webhook removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= API INTEGRATION ENDPOINTS =============

// Register user (called from mini app)
app.post('/register-user', async (req, res) => {
  try {
    const { telegramId, username, password } = req.body;

    // Call backend API to register
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      telegram_id: telegramId,
      username,
      password
    });

    res.json({
      success: true,
      token: response.data.token,
      userId: response.data.userId
    });
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data?.error || error.message });
  }
});

// Forward profile update to user (notification)
app.post('/notify-profile-complete', async (req, res) => {
  try {
    const { telegramId, profileId, archetype, strengthScore } = req.body;

    const message = `
✅ *Profile Complete!*

*Archetype:* ${archetype}
*Strength:* ${strengthScore}%

🔐 Ready for action!
    `;

    await bot.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🚀 Open Vault', web_app: { url: MINI_APP_URL } }
        ]]
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= HEALTH CHECK =============

app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    bot_token: TELEGRAM_BOT_TOKEN ? '✓ Configured' : '✗ Missing'
  });
});

// ============= ERROR HANDLING =============

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============= START SERVER =============

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   IDENTITY VAULT TELEGRAM BOT - RUNNING           ║
║   Port: ${PORT}                                    ║
╚════════════════════════════════════════════════════╝

🤖 Bot Token: ${TELEGRAM_BOT_TOKEN.slice(0, 15)}...
📱 Mini App: ${MINI_APP_URL}
🔗 Backend API: ${API_URL}
🪝 Webhook URL: ${WEBHOOK_URL}/${TELEGRAM_BOT_TOKEN}

✓ Ready to accept Telegram updates
✓ Web app integration active
✓ Webhook endpoint listening

Commands:
  GET /set-webhook     - Configure Telegram webhook
  GET /remove-webhook  - Remove webhook (use polling)
  GET /health          - Health check
  POST /webhook/*      - Telegram webhook endpoint

Next: Deploy this bot and call /set-webhook
  `);
});

module.exports = app;
