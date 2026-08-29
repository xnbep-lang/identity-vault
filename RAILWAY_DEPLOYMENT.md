# Identity Vault - Railway Deployment Guide

## 🚂 Why Railway?

- ✅ **Free Tier:** $5/month credit (more than enough for testing)
- ✅ **Simple Setup:** Connect GitHub, deploy in 2 minutes
- ✅ **PostgreSQL Included:** Free database included
- ✅ **Auto-scaling:** Handles growth automatically
- ✅ **Environment Variables:** Easy management
- ✅ **Monitoring:** Built-in logs and metrics
- ✅ **Custom Domains:** Free domains supported
- ✅ **No Credit Card Required:** For free tier (initially)

---

## 📋 Prerequisites

Before you start, you'll need:

1. **GitHub Account** (Free)
   - Push your code to GitHub
   - Railway connects directly

2. **Railway Account** (Free)
   - Sign up at https://railway.app
   - Supports GitHub login

3. **Anthropic API Key** (Required)
   - Get from https://console.anthropic.com
   - Format: sk-ant-xxx

4. **Telegram Bot Token** (Required)
   - Create via @BotFather on Telegram
   - Free and instant

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your GitHub Repository

```bash
# Create a new repository on GitHub called "identity-vault"

# Clone and setup locally
git clone https://github.com/YOUR_USERNAME/identity-vault.git
cd identity-vault

# Extract the zip contents here
unzip identity-vault-complete.zip
mv identity-vault-repo/* .
rm -rf identity-vault-repo

# Initialize git if needed
git init
git add .
git commit -m "Initial commit: Identity Vault system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/identity-vault.git
git push -u origin main
```

### Step 2: Create railway.json Configuration

Create a `railway.json` file in the root of your project:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start",
    "restartPolicyMaxRetries": 5
  }
}
```

### Step 3: Update Backend package.json

Make sure your `backend/package.json` has proper start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

### Step 4: Update Backend for Production

Modify `backend/server.js` to work with Railway:

```javascript
// At the top of server.js, ensure port is configurable
const PORT = process.env.PORT || 3000;

// Make sure these are set
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;

// Ensure database migration runs on startup
if (process.env.NODE_ENV === 'production') {
  console.log('Running database migrations...');
  // Your init-db code here
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});
```

### Step 5: Add Procfile (Optional but Recommended)

Create a `Procfile` in the root:

```
backend: cd backend && npm start
bot: cd telegram-bot && npm start
```

### Step 6: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. Complete your profile setup

### Step 7: Create New Project

1. Click "Create New Project"
2. Select "Deploy from GitHub"
3. Search for "identity-vault" repository
4. Select it and authorize

### Step 8: Configure Environment Variables

**For Backend Service:**

1. Click on the backend service
2. Go to "Variables" tab
3. Add these environment variables:

```
PORT=3000
NODE_ENV=production
DATABASE_URL=<will be auto-filled by Railway PostgreSQL>
JWT_SECRET=<generate with: openssl rand -hex 32>
ANTHROPIC_API_KEY=sk-ant-xxx
ALLOWED_ORIGINS=https://your-app.railway.app,https://t.me
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
MINI_APP_URL=https://your-app.railway.app
```

### Step 9: Add PostgreSQL Database

1. In your Railway project
2. Click "Add Service"
3. Select "Database"
4. Choose "PostgreSQL"
5. Railway will automatically:
   - Create database
   - Set `DATABASE_URL` environment variable
   - Provide credentials

### Step 10: Deploy Backend

1. Push your changes to GitHub:
```bash
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

2. Railway will automatically detect changes and deploy
3. Monitor deployment in Railway dashboard
4. Once deployed, you'll get a URL like: `https://identity-vault-api.railway.app`

### Step 11: Test Backend

```bash
# Test health check
curl https://identity-vault-api.railway.app/health

# Test registration
curl -X POST https://identity-vault-api.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password123"}'
```

---

## 🤖 Deploy Telegram Bot (Optional Second Service)

### Option A: Deploy Bot as Second Service on Railway

1. Create a `Procfile`:
```
api: cd backend && npm start
bot: cd telegram-bot && npm start
```

2. Deploy bot service separately:
```bash
# Push to GitHub
git add Procfile
git commit -m "Add bot Procfile"
git push origin main

# In Railway dashboard:
# - Add new service
# - Select same GitHub repo
# - Set start command: cd telegram-bot && npm start
```

### Option B: Keep Bot Running Locally

You can run the bot locally while API is on Railway:

```bash
cd telegram-bot
cp .env.example .env

# Edit .env:
# API_URL=https://your-app.railway.app (from Railway)
# TELEGRAM_BOT_TOKEN=your_token
# PORT=3001

npm install
npm run dev
```

---

## 🌐 Custom Domain Setup (Optional)

### Add Custom Domain to Railway

1. In Railway dashboard, go to Settings
2. Click "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records to point to Railway
5. Railway will handle SSL automatically

### DNS Configuration Example

For domain `yourdomain.com`:

```
Type: CNAME
Name: api
Value: your-app.railway.app
TTL: 3600
```

---

## 📊 Railway Dashboard Features

After deployment, use Railway dashboard to:

- **Monitor Logs:** Real-time application logs
- **View Metrics:** CPU, Memory, Request count
- **Manage Variables:** Update environment variables
- **Scale Services:** Increase resources if needed
- **Database Management:** View and manage PostgreSQL
- **Deployments:** History and rollback capability

---

## 🔐 Security Best Practices on Railway

### 1. Secure Environment Variables

```bash
# Don't commit .env files
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use Railway dashboard to manage secrets
# Never put secrets in code or git
```

### 2. Update CORS Origins

```javascript
// In server.js
const allowedOrigins = [
  'https://your-railway-app.railway.app',
  'https://api.yourdomain.com',
  'https://t.me'
];
```

### 3. Set Strong JWT Secret

```bash
# Generate strong secret
openssl rand -hex 32

# Add to Railway environment variables as JWT_SECRET
```

### 4. Enable HTTPS (Automatic)

Railway provides free HTTPS certificates automatically.

---

## 📈 Scaling on Railway

### Vertical Scaling (More Power)

1. Go to service settings
2. Increase plan if needed
3. Railway handles automatic scaling

### Horizontal Scaling (More Instances)

```javascript
// In railway.json
{
  "deploy": {
    "numReplicas": 2  // Run 2 instances
  }
}
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: Database Connection Error

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Make sure DATABASE_URL is set in Railway variables
# Check it's using the PostgreSQL service URL
echo $DATABASE_URL  # Should show: postgresql://user:pass@host:5432/db
```

### Issue 2: Port Already in Use

**Error:** `Port 3000 already in use`

**Solution:**
```bash
# Railway assigns a PORT environment variable
# Make sure your code uses:
const PORT = process.env.PORT || 3000;
```

### Issue 3: Build Failures

**Error:** `npm install failed` or similar

**Solution:**
```bash
# Check that package-lock.json is committed
git add backend/package-lock.json
git add telegram-bot/package-lock.json
git commit -m "Add package locks"
git push origin main

# Railway will retry the build
```

### Issue 4: API Key Not Working

**Error:** `401 Unauthorized` from Anthropic

**Solution:**
```bash
# Verify API key in Railway variables
# Make sure format is: sk-ant-xxx
# Check it's not expired in Anthropic console
# Try regenerating the key
```

---

## 📱 Connect Telegram Bot to Railway API

After deploying backend to Railway:

1. Update bot environment variables:

```bash
# In telegram-bot/.env
API_URL=https://your-app.railway.app
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

2. If deploying bot to Railway:
```bash
# Railway will auto-set the webhook
# Bot will receive updates from Telegram
```

3. If running bot locally:
```bash
# Just point to Railway API URL
npm run dev  # Runs on localhost:3001
```

---

## 🧪 Testing After Deployment

### 1. Test API Health

```bash
curl https://your-app.railway.app/health
# Should return: {"status":"operational",...}
```

### 2. Test Authentication

```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
# Should return: {"success":true,"token":"..."}
```

### 3. Test Profile Creation

```bash
curl -X POST https://your-app.railway.app/api/profiles/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test"}'
```

### 4. Check Logs

In Railway dashboard:
- Click your service
- View "Logs" tab
- See real-time output

---

## 🔄 Deployment Workflow

### Every Time You Make Changes

```bash
# 1. Make changes locally
# 2. Test locally
npm test

# 3. Commit and push
git add .
git commit -m "Your commit message"
git push origin main

# 4. Railway automatically deploys
# 5. Monitor in Railway dashboard
```

### Rollback if Needed

```bash
# In Railway dashboard:
# 1. Go to "Deployments" tab
# 2. Click previous deployment
# 3. Click "Redeploy"
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# In Railway dashboard
# Service → Logs tab

# Look for:
✅ "API running on port 3000"
✅ "Database connected"
✅ "Server started successfully"
```

### Check Database Connection

```bash
# In Railway dashboard
# PostgreSQL service → Logs tab
# Should show: "ready to accept connections"
```

### Monitor Performance

```bash
# In Railway dashboard
# Service → Metrics tab
# View CPU, Memory, Request count
```

---

## 💰 Pricing

Railway free tier gives you:
- **$5/month credit**
- **Enough for:** API + Database + Bot
- **When it runs out:** You can add payment or stick to free tier

### Estimate

- API server: ~$0.50-1.50/month
- PostgreSQL: ~$1-2/month
- Bot server: ~$0.50-1/month
- **Total: ~$2-4/month** (well within $5 free tier)

---

## 🚀 Production Checklist

Before going live:

- [ ] GitHub repository set up
- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Backend deployed
- [ ] API endpoints tested
- [ ] Telegram bot configured
- [ ] Bot tested
- [ ] Custom domain added (optional)
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 📚 Railway Resources

- **Docs:** https://docs.railway.app
- **GitHub Integration:** https://docs.railway.app/deploy/github
- **Environment Variables:** https://docs.railway.app/develop/variables
- **PostgreSQL:** https://docs.railway.app/databases/postgresql
- **Troubleshooting:** https://docs.railway.app/help/faq

---

## 🎯 Quick Summary

### Traditional Path (Heroku)
```bash
./deploy.sh
# Takes 15 minutes, costs $50/month
```

### Railway Path (FREE! 🎉)
```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Railway
# Go to https://railway.app
# Connect GitHub repo
# Add env vars
# Done!

# Takes 5 minutes, costs $0-5/month
```

---

## 📞 Next Steps

1. ✅ Create GitHub account (if needed)
2. ✅ Push Identity Vault code to GitHub
3. ✅ Sign up for Railway
4. ✅ Connect GitHub repo
5. ✅ Add PostgreSQL database
6. ✅ Set environment variables
7. ✅ Deploy backend
8. ✅ Test API
9. ✅ Deploy bot (optional)
10. ✅ Go live! 🚀

---

## 🎉 You're Ready!

Your Identity Vault system can now run on Railway completely **FREE**! 

**Advantages over Heroku:**
- ✅ Free tier ($5 credit vs $7 minimum)
- ✅ Easier UI
- ✅ Better documentation
- ✅ More generous free tier
- ✅ No credit card for free tier (initially)

**Deploy in 5 minutes and celebrate!** 🚀🔐

---

**Railway + Identity Vault = Secure authentication system running free! ✨**
