# Identity Vault - Repository Structure

## 📁 Complete Directory Layout

```
identity-vault/
├── 📄 README.md                          # Project overview
├── 📄 SETUP_GUIDE.md                     # Backend setup instructions
├── 📄 TELEGRAM_BOT_GUIDE.md              # Bot deployment guide
├── 📄 TELEGRAM_BOT_QUICK_REFERENCE.md    # Bot quick commands
├── 📄 ATTACK_MODULE_GUIDE.md             # Attack/fuzzing documentation
├── 📄 ATTACK_QUICK_REFERENCE.md          # Attack quick reference
├── 📄 PRODUCTION_DEPLOYMENT.md           # Production deployment guide
├── 📄 docker-compose.yml                 # Local production Docker setup
├── 📄 .gitignore                         # Git ignore rules
├── 📄 package.json                       # Root dependencies (optional)
│
├── 📦 backend/                           # Backend API Service (Port 3000)
│   ├── 📄 server.js                      # Main Express API server
│   ├── 📄 package.json                   # Backend dependencies
│   ├── 📄 .env.example                   # Environment variables template
│   ├── 📄 init-db.js                     # Database initialization script
│   ├── 📄 IdentityVaultClient.js         # JavaScript API client library
│   ├── 📄 Dockerfile                     # Docker image for backend
│   └── 📁 migrations/                    # (Optional) Database migrations
│       └── 001_initial.sql               # Initial schema
│
├── 📦 telegram-bot/                      # Telegram Bot Service (Port 3001)
│   ├── 📄 telegram-bot.js                # Bot implementation
│   ├── 📄 package.json                   # Bot dependencies
│   ├── 📄 .env.example                   # Environment template
│   ├── 📄 Dockerfile                     # Docker image for bot
│   └── 📁 handlers/                      # (Optional) Command handlers
│       ├── 📄 start.js
│       ├── 📄 help.js
│       └── 📄 profiles.js
│
├── 📦 frontend/                          # Frontend Applications
│   │
│   ├── 📁 mini-app/                      # Telegram Mini App (React)
│   │   ├── 📄 identity-profiler.jsx      # Original mini app
│   │   ├── 📄 identity-profiler-telegram.jsx  # Telegram-integrated version
│   │   ├── 📄 package.json
│   │   ├── 📄 index.html
│   │   └── 📁 public/
│   │
│   └── 📁 dashboard/                     # Analytics Dashboard (React)
│       ├── 📄 analytics-dashboard.jsx    # Main dashboard component
│       ├── 📄 package.json
│       ├── 📄 index.html
│       ├── 📄 .env.example
│       └── 📁 components/                # (Optional) Reusable components
│           ├── 📄 StatCard.jsx
│           ├── 📄 Chart.jsx
│           └── 📄 ProfileTable.jsx
│
├── 📦 security/                          # Security & Testing
│   ├── 📄 attack-module.js               # Attack strategy implementations
│   ├── 📄 run-attacks.js                 # Attack runner script
│   ├── 📄 test-bot.js                    # Bot testing suite
│   └── 📁 test-data/                     # Test profiles and data
│       └── 📄 sample-profiles.json
│
├── 📦 infrastructure/                    # Deployment & Infrastructure
│   ├── 📄 deploy.sh                      # One-click Heroku deployment
│   ├── 📄 nginx.conf                     # Nginx configuration
│   │
│   ├── 📁 kubernetes/                    # Kubernetes configs
│   │   ├── 📄 api-deployment.yaml
│   │   ├── 📄 bot-deployment.yaml
│   │   ├── 📄 service.yaml
│   │   └── 📄 ingress.yaml
│   │
│   ├── 📁 terraform/                     # (Optional) AWS/GCP/Azure IaC
│   │   ├── 📄 main.tf
│   │   ├── 📄 variables.tf
│   │   └── 📄 outputs.tf
│   │
│   └── 📁 docker/
│       ├── 📄 Dockerfile.api
│       ├── 📄 Dockerfile.bot
│       └── 📄 Dockerfile.dashboard
│
├── 📦 docs/                              # Documentation
│   ├── 📄 API_REFERENCE.md               # API endpoints documentation
│   ├── 📄 ARCHITECTURE.md                # System architecture
│   ├── 📄 SECURITY.md                    # Security practices
│   ├── 📄 CONTRIBUTING.md                # Contribution guidelines
│   ├── 📄 TROUBLESHOOTING.md             # Common issues & solutions
│   │
│   ├── 📁 images/                        # Diagrams and screenshots
│   │   ├── 📄 architecture.png
│   │   ├── 📄 dashboard.png
│   │   └── 📄 flow-diagram.png
│   │
│   └── 📁 examples/
│       ├── 📄 example-curl-requests.sh
│       ├── 📄 example-python-client.py
│       └── 📄 example-nodejs-client.js
│
├── 📁 tests/                             # Integration tests
│   ├── 📄 api.test.js
│   ├── 📄 bot.test.js
│   ├── 📄 security.test.js
│   └── 📄 integration.test.js
│
├── 📁 scripts/                           # Utility scripts
│   ├── 📄 setup.sh                       # Initial setup
│   ├── 📄 seed-data.js                   # Populate test data
│   ├── 📄 backup.sh                      # Database backup
│   ├── 📄 migrate.js                     # Database migrations
│   └── 📄 health-check.sh                # Health verification
│
├── 📁 .github/                           # GitHub specific files
│   ├── 📁 workflows/
│   │   ├── 📄 test.yml                   # Run tests on push
│   │   ├── 📄 security.yml               # Security scanning
│   │   ├── 📄 deploy.yml                 # Auto-deploy on main
│   │   └── 📄 analytics.yml              # Attack module on schedule
│   │
│   └── 📁 ISSUE_TEMPLATE/
│       ├── 📄 bug_report.md
│       └── 📄 feature_request.md
│
└── 📁 logs/                              # (Git ignored) Runtime logs
    ├── error.log
    └── combined.log
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram User                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │    Telegram Bot (@BotFather)   │  Port 3001
        │    (telegram-bot.js)           │
        │  - Commands: /start, /help     │
        │  - Web app launcher            │
        │  - Notifications               │
        └────────┬───────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌─────────────┐  ┌──────────────┐
    │  Mini App   │  │  Dashboard   │  Port 8080
    │  (React)    │  │  (React)     │  http://localhost:8080
    │ Port 3000   │  │              │
    └──────┬──────┘  └────────┬─────┘
           │                  │
           └──────────┬───────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │   Backend API           │  Port 3000
         │   (server.js)           │  http://localhost:3000
         │  - Auth & Profiles      │
         │  - AI Integration       │
         │  - Analytics            │
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │   PostgreSQL Database   │  Port 5432
         │   (Docker: postgres)    │  localhost:5432
         │  - Users                │
         │  - Profiles             │
         │  - Answers              │
         │  - Verification Data    │
         └─────────────────────────┘

         ┌─────────────────────────┐
         │   Anthropic API         │
         │   (Claude AI)           │
         │  - Question Generation  │
         │  - Profile Analysis     │
         └─────────────────────────┘
```

---

## 🔑 Key Files Explained

### Backend Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `server.js` | Main Express API server, all endpoints | ~500 |
| `package.json` | Dependencies, scripts, metadata | ~40 |
| `.env.example` | Environment variables template | ~15 |
| `IdentityVaultClient.js` | JavaScript/Node API client | ~200 |
| `init-db.js` | Database schema initialization | ~50 |

### Telegram Bot Files

| File | Purpose | Lines |
|------|---------|-------|
| `telegram-bot.js` | Bot commands, Web App integration | ~400 |
| `test-bot.js` | 15+ automated test cases | ~600 |

### Frontend Files

| File | Purpose | Lines |
|------|---------|-------|
| `identity-profiler.jsx` | Original mini app (standalone) | ~400 |
| `identity-profiler-telegram.jsx` | Mini app with Telegram integration | ~450 |
| `analytics-dashboard.jsx` | Analytics dashboard with charts | ~800 |

### Security & Testing

| File | Purpose | Lines |
|------|---------|-------|
| `attack-module.js` | 7 attack strategies, vulnerability detection | ~700 |
| `run-attacks.js` | Attack runner with reporting | ~300 |

### Documentation

| File | Purpose |
|------|---------|
| `SETUP_GUIDE.md` | Backend setup & deployment |
| `TELEGRAM_BOT_GUIDE.md` | Bot deployment & configuration |
| `ATTACK_MODULE_GUIDE.md` | Security testing guide |
| `PRODUCTION_DEPLOYMENT.md` | Production deployment strategies |

---

## 📦 Dependencies by Service

### Backend (backend/package.json)
```json
{
  "@anthropic-ai/sdk": "^0.24.3",      // Claude API
  "express": "^4.18.2",                // Web framework
  "jsonwebtoken": "^9.1.2",            // JWT auth
  "bcrypt": "^5.1.1",                  // Password hashing
  "sqlite3": "^5.1.7",                 // Database (dev)
  "cors": "^2.8.5",                    // CORS middleware
  "dotenv": "^16.3.1"                  // Environment config
}
```

### Telegram Bot (telegram-bot/package.json)
```json
{
  "node-telegram-bot-api": "^0.64.0",  // Telegram bot
  "express": "^4.18.2",                // Web server
  "axios": "^1.6.5",                   // HTTP client
  "dotenv": "^16.3.1"                  // Environment config
}
```

### Frontend (frontend/package.json)
```json
{
  "react": "^18.2.0",                  // UI framework
  "recharts": "^2.10.0",               // Charts library
  "lucide-react": "^0.x.x",            // Icons
  "tailwindcss": "^3.x.x"              // CSS utility
}
```

---

## 🔄 Development Workflow

### Day-to-Day Development

```bash
# 1. Backend development
cd backend
npm run dev                    # Start API on port 3000

# 2. Bot development (separate terminal)
cd telegram-bot
npm run dev                    # Start bot on port 3001

# 3. Frontend development (separate terminal)
cd frontend/mini-app
npm start                      # Start mini app

# 4. Testing
npm test                       # Run all tests
node run-attacks.js           # Security testing
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature

# After merge, main triggers CI/CD
# - Runs tests
# - Runs security checks
# - Auto-deploys to production
```

---

## 🚀 Deployment Workflow

### Local Development
```
Code → Git → GitHub (main branch)
  ↓
```

### CI/CD Pipeline (.github/workflows/)
```
GitHub Actions
  ├─ Run tests
  ├─ Run security checks
  ├─ Run attack module
  └─ Deploy to production
```

### Production (Multiple Options)
```
Option 1: Heroku
  deploy.sh → Git push → Heroku → Build → Deploy

Option 2: Docker
  docker-compose.yml → Docker build → Docker run

Option 3: Kubernetes
  k8s/*.yaml → kubectl apply → Pods running

Option 4: AWS/GCP/Azure
  Terraform → Infrastructure created → Services deployed
```

---

## 📝 Configuration Files

### Environment Variables (.env)

**Backend (.env)**
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost/vault

# Secrets
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-xxx

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Telegram
TELEGRAM_BOT_TOKEN=xxx
MINI_APP_URL=http://localhost:3000
```

**Telegram Bot (.env)**
```bash
PORT=3001
NODE_ENV=development

# APIs
API_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=xxx
MINI_APP_URL=http://localhost:8080
WEBHOOK_URL=https://yourdomain.com
```

---

## 📊 Database Schema

### Tables in identity_vault

```sql
-- Users
users (id, telegram_id, username, password_hash, created_at, last_active)

-- Profiles
profiles (id, user_id, session_number, archetype, traits, patterns, 
          strength_score, risk_factors, created_at, updated_at)

-- Answers
answers (id, profile_id, question, answer, question_order, answer_timestamp)

-- Verification
verification_attempts (id, profile_id, question, user_answer, 
                       expected_hint, success, attempt_timestamp)

-- Analytics (views/aggregations)
```

---

## 🔐 Environment-Specific Config

### Development (.env.development)
```
NODE_ENV=development
DEBUG=true
CORS_ORIGIN=http://localhost:*
DATABASE=sqlite (in-memory)
LOG_LEVEL=debug
RATE_LIMIT=false
```

### Production (.env.production)
```
NODE_ENV=production
DEBUG=false
CORS_ORIGIN=https://yourdomain.com
DATABASE=postgresql://prod...
LOG_LEVEL=error
RATE_LIMIT=true
HTTPS=true
```

---

## 📚 Learning Path

### New Developer Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd identity-vault
   ./scripts/setup.sh
   ```

2. **Read Documentation**
   - README.md (overview)
   - SETUP_GUIDE.md (backend)
   - TELEGRAM_BOT_GUIDE.md (bot)

3. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Bot
   cd telegram-bot && npm run dev

   # Terminal 3: Frontend
   cd frontend/mini-app && npm start
   ```

4. **Run Tests**
   ```bash
   npm test              # Unit tests
   npm run test:bot      # Bot tests
   node run-attacks.js   # Security tests
   ```

5. **Explore Code**
   - Start with `backend/server.js`
   - Then `telegram-bot/telegram-bot.js`
   - Then `frontend/identity-profiler-telegram.jsx`

---

## 🎯 Quick File Locations

**Need to...** | **Look in...**
---|---
Add new API endpoint | `backend/server.js` (line ~200)
Add bot command | `telegram-bot/telegram-bot.js` (line ~100)
Change database schema | `backend/init-db.js`
Update analytics | `frontend/analytics-dashboard.jsx`
Add security check | `security/attack-module.js`
Deploy to production | Run `./infrastructure/deploy.sh`
View architecture | `docs/ARCHITECTURE.md`

---

## 🔄 File Update Frequency

| File | Update Frequency | Who |
|------|------------------|-----|
| `server.js` | Weekly | Backend Dev |
| `telegram-bot.js` | Bi-weekly | Bot Dev |
| `analytics-dashboard.jsx` | Weekly | Frontend Dev |
| `attack-module.js` | Monthly | Security |
| `PRODUCTION_DEPLOYMENT.md` | Quarterly | DevOps |
| `package.json` | As needed | All |

---

## 💾 Storage & Backups

### What Gets Backed Up

```
✅ PostgreSQL database (users, profiles, answers)
✅ .env files with secrets
✅ SSL certificates
✅ Application code (GitHub)

❌ node_modules (regenerated on deploy)
❌ Build artifacts
❌ Temporary files
```

### Backup Strategy

```bash
# Daily automatic backups (Heroku/AWS)
# Weekly manual backups
pg_dump identity_vault > backups/weekly-$(date +%Y%m%d).sql

# Version control for code
git push origin main
```

---

## 📞 Support & Contact

- **Issues**: GitHub Issues
- **Security**: security@yourdomain.com
- **Support**: support@yourdomain.com
- **Docs**: See `/docs` folder

---

**Repository is organized for scalability, maintainability, and team collaboration! 🚀**
