# 🚂 Railway Quick Start - 5 Minutes

## ⚡ Deploy Identity Vault to Railway in 5 Minutes (FREE!)

---

## What You Need

- ✅ GitHub account (free)
- ✅ Railway account (free at railway.app)
- ✅ Anthropic API key (sk-ant-xxx)
- ✅ Telegram bot token (@BotFather)

---

## Step 1: Push Code to GitHub (2 minutes)

```bash
# Create repo on GitHub called "identity-vault"

# In your local directory
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/identity-vault.git
git push -u origin main
```

---

## Step 2: Create Railway Project (1 minute)

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway
4. Click "New Project"
5. Select "Deploy from GitHub"
6. Search for "identity-vault"
7. Select it
8. Done! ✅

---

## Step 3: Add PostgreSQL Database (1 minute)

1. In Railway project, click "Add Service"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway creates it automatically ✅
5. `DATABASE_URL` is auto-set in environment

---

## Step 4: Set Environment Variables (1 minute)

**In Railway Dashboard:**

1. Click on your service
2. Go to "Variables" tab
3. Add these:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=<run: openssl rand -hex 32>
ANTHROPIC_API_KEY=sk-ant-xxx
TELEGRAM_BOT_TOKEN=your_telegram_token
ALLOWED_ORIGINS=https://your-app.railway.app,https://t.me
MINI_APP_URL=https://your-app.railway.app
```

---

## Step 5: Deploy! (Automatic)

Railway automatically deploys when you:
1. Push to GitHub
2. Or manually redeploy in dashboard

**You'll get a URL like:**
```
https://identity-vault-abc123.railway.app
```

---

## Test It Works

```bash
# Test health check
curl https://your-app.railway.app/health

# Should return:
# {"status":"operational",...}
```

---

## 🎉 Done!

Your Identity Vault is now live on Railway!

**Total time:** ~5 minutes
**Cost:** FREE ($5/month credit)

---

## Common Questions

**Q: How much does it cost?**
A: FREE! $5/month credit covers everything.

**Q: Do I need a credit card?**
A: Not for the free tier (initially).

**Q: Can I use my own domain?**
A: Yes! Add in Railway settings (free SSL).

**Q: What if my code changes?**
A: Push to GitHub → Railway auto-deploys.

**Q: Can I run the bot too?**
A: Yes! Deploy as second service or run locally.

**Q: What if something breaks?**
A: Check logs in Railway dashboard → Rollback deployment.

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Test API health endpoint
3. ✅ Deploy bot (optional)
4. ✅ Test Telegram integration
5. ✅ Monitor logs in Railway dashboard

---

**That's it! Your free, production-ready Identity Vault is running!** 🚀🔐

For detailed guide, see: RAILWAY_DEPLOYMENT.md
