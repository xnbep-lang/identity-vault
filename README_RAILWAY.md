# 🚂 Identity Vault - Deploy FREE on Railway

**Railway gives you $5/month credit - more than enough to run Identity Vault for FREE!**

---

## 🚀 Deploy in 5 Minutes

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Connect to Railway
```
1. Go to https://railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub
4. Select "identity-vault"
5. Add PostgreSQL database
6. Set environment variables
7. Done! 🎉
```

### Step 3: Test
```bash
curl https://your-app.railway.app/health
```

---

## 💰 Cost

**FREE!** 🎉
- $5/month credit includes everything
- API server: ~$1/month
- PostgreSQL: ~$1/month
- Telegram bot: ~$0.50/month
- **Total: ~$2.50/month** (stays free!)

---

## 📋 Full Documentation

See `RAILWAY_DEPLOYMENT.md` for complete step-by-step guide.

See `RAILWAY_QUICK_START.md` for 5-minute version.

---

## Why Railway Over Heroku?

| Feature | Railway | Heroku |
|---------|---------|--------|
| Free Tier | $5 credit | $7/month |
| Setup Time | 5 min | 15 min |
| GitHub Integration | Automatic | Manual |
| Database Included | ✅ Free | Extra cost |
| Scaling | Automatic | Limited |
| UI | Modern | Complex |
| Logs | Real-time | Historical |

**Railway wins on:** Cost, Speed, Ease, Database

---

## Quick Setup Checklist

- [ ] Create GitHub account
- [ ] Push code to GitHub
- [ ] Sign up for Railway (free)
- [ ] Connect GitHub repo
- [ ] Add PostgreSQL
- [ ] Set env variables:
  - PORT=3000
  - NODE_ENV=production
  - DATABASE_URL (auto)
  - JWT_SECRET (generate)
  - ANTHROPIC_API_KEY (add yours)
  - TELEGRAM_BOT_TOKEN (add yours)
- [ ] Deploy
- [ ] Test `/health` endpoint
- [ ] Go live! 🚀

---

## Environment Variables

**Required:**
```
PORT=3000
NODE_ENV=production
DATABASE_URL=<Railway auto-generates this>
JWT_SECRET=<generate with: openssl rand -hex 32>
ANTHROPIC_API_KEY=sk-ant-xxx
TELEGRAM_BOT_TOKEN=your_token_here
ALLOWED_ORIGINS=https://your-app.railway.app,https://t.me
```

**Optional:**
```
MINI_APP_URL=https://your-app.railway.app
LOG_LEVEL=info
RATE_LIMIT=true
```

---

## Deploy Steps

### 1. Prepare GitHub
```bash
# Your project root
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/identity-vault.git
git push -u origin main
```

### 2. Railway Account
- Go to https://railway.app
- Click "Login with GitHub"
- Authorize

### 3. Create Project
- Click "New Project"
- Select "Deploy from GitHub"
- Search "identity-vault"
- Select it

### 4. Add Database
- Click "Add Service"
- Select "Database"
- Choose "PostgreSQL"
- Wait for creation (~1 min)

### 5. Set Variables
- Click service
- Go to "Variables"
- Add all required variables

### 6. Deploy
- Push to GitHub (auto-deploys)
- Or click "Redeploy" in Railway

### 7. Test
```bash
curl https://your-app.railway.app/health
```

---

## After Deployment

**Your API is live at:**
```
https://identity-vault-xyz123.railway.app
```

**Use this URL:**
- In Telegram bot config
- In frontend (REACT_APP_API_URL)
- In analytics dashboard

---

## Telegram Bot Setup

### Option 1: Deploy Bot to Railway (Same as API)

1. Create `Procfile` with:
```
api: cd backend && npm start
bot: cd telegram-bot && npm start
```

2. Push to GitHub
3. Add bot service in Railway
4. Set `TELEGRAM_BOT_TOKEN`
5. Deploy

### Option 2: Run Bot Locally

```bash
cd telegram-bot
cp .env.example .env

# Edit .env:
API_URL=https://your-railway-app.railway.app
TELEGRAM_BOT_TOKEN=your_token

npm install
npm run dev
```

---

## Monitoring

**In Railway Dashboard:**

1. **Logs:** Real-time application output
2. **Metrics:** CPU, Memory, Requests
3. **Database:** PostgreSQL status
4. **Deployments:** History and rollback

---

## Troubleshooting

**API not responding?**
- Check logs in Railway
- Verify env variables set
- Check `PORT` is 3000

**Database error?**
- Verify `DATABASE_URL` is set
- Check PostgreSQL service is running
- Try restarting service

**Build failed?**
- Check package.json is correct
- Verify node_modules issues
- Try clearing cache in Railway

**Telegram not connecting?**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check bot is running in Railway
- Update webhook URL

---

## Scaling Up

When you outgrow free tier:

1. Add payment method
2. Increase plan
3. Or upgrade to:
   - AWS ($0-50/month)
   - Google Cloud ($0-50/month)
   - Vercel ($0-25/month)

**But Railway scales well for most projects!**

---

## Custom Domain (Optional)

1. Buy domain (namecheap, godaddy, etc)
2. In Railway: Settings → Custom Domains
3. Add your domain
4. Update DNS records (Railway shows how)
5. Railway auto-enables HTTPS

---

## For More Details

👉 **See RAILWAY_DEPLOYMENT.md** - Complete guide
👉 **See RAILWAY_QUICK_START.md** - 5-minute version

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Community:** Discord at railway.app
- **Status:** https://status.railway.app

---

## 🎉 TL;DR

**Identity Vault on Railway in 5 steps:**

1. Push code to GitHub
2. Go to railway.app
3. Connect GitHub repo
4. Add PostgreSQL
5. Set env vars
6. Deploy! 🚀

**Cost:** FREE ($5 credit/month)
**Time:** 5 minutes
**Result:** Production-ready Identity Vault! ✨

---

**Railway + Identity Vault = Secure, free, production system!** 🚂🔐

Start here: RAILWAY_QUICK_START.md
Full guide: RAILWAY_DEPLOYMENT.md
