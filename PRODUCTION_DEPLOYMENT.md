# Identity Vault - Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### Security Hardening
- [ ] Change all default secrets and tokens
- [ ] Enable HTTPS/SSL everywhere
- [ ] Set up environment variables
- [ ] Review and update CORS origins
- [ ] Enable rate limiting
- [ ] Add request validation
- [ ] Set up security headers
- [ ] Configure firewall rules
- [ ] Review database security
- [ ] Enable audit logging

### Testing & Validation
- [ ] All tests pass (npm test)
- [ ] Attack module security score ≥ 80/100
- [ ] Load testing completed
- [ ] Database backups working
- [ ] Error handling verified
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Rollback plan documented

### Infrastructure
- [ ] Domain registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Database (PostgreSQL) provisioned
- [ ] Redis cache configured (optional)
- [ ] CDN configured (optional)
- [ ] Monitoring tools installed
- [ ] Log aggregation setup
- [ ] Backup strategy in place

### Documentation
- [ ] API documentation complete
- [ ] Deployment runbook written
- [ ] Incident response plan
- [ ] Scaling strategy documented
- [ ] Team trained on system
- [ ] On-call rotation established

---

## 🌍 Deployment Options

### Option 0: Railway (FREE! - 5 minutes) ⭐ RECOMMENDED

**FREE TIER:** $5/month credit (covers everything!)
- Perfect for testing and small projects
- Automatic PostgreSQL included
- No credit card needed (initially)
- GitHub integration (deploy in 5 minutes)

**See:** RAILWAY_DEPLOYMENT.md (Complete step-by-step guide)

**Quick Start:**
```bash
# 1. Push to GitHub
git push origin main

# 2. Go to https://railway.app
# 3. Connect GitHub repo
# 4. Add env vars
# 5. Done! 🚀
```

---

### Option 1: Heroku (Easiest - 15 minutes)

#### Step 1: Create Heroku Apps

```bash
# Create backend API app
heroku create identity-vault-api
heroku apps:rename identity-vault-api

# Create bot app
heroku create identity-vault-bot
heroku apps:rename identity-vault-bot

# Create dashboard app
heroku create identity-vault-dash
heroku apps:rename identity-vault-dash
```

#### Step 2: Add PostgreSQL Database

```bash
# Add database to API app
heroku addons:create heroku-postgresql:standard-0 --app identity-vault-api

# Check connection string
heroku config:get DATABASE_URL --app identity-vault-api
```

#### Step 3: Set Environment Variables

```bash
# Backend API
heroku config:set \
  ANTHROPIC_API_KEY=sk-ant-xxx \
  JWT_SECRET=$(openssl rand -hex 32) \
  NODE_ENV=production \
  DATABASE_URL=postgres://... \
  --app identity-vault-api

# Telegram Bot
heroku config:set \
  TELEGRAM_BOT_TOKEN=your_token \
  API_URL=https://identity-vault-api.herokuapp.com \
  MINI_APP_URL=https://identity-vault-dash.herokuapp.com \
  --app identity-vault-bot

# Dashboard
heroku config:set \
  REACT_APP_API_URL=https://identity-vault-api.herokuapp.com \
  --app identity-vault-dash
```

#### Step 4: Deploy

```bash
# Backend
git subtree push --prefix backend heroku-api main

# Bot
git subtree push --prefix bot heroku-bot main

# Dashboard
git subtree push --prefix dashboard heroku-dash main

# Verify deployments
heroku logs --tail --app identity-vault-api
heroku logs --tail --app identity-vault-bot
heroku logs --tail --app identity-vault-dash
```

#### Step 5: Initialize Database

```bash
# Run migrations
heroku run node init-db.js --app identity-vault-api

# Verify
heroku pg:info --app identity-vault-api
```

---

### Option 2: Docker + Kubernetes (Production-Grade)

#### Step 1: Create Docker Images

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

```dockerfile
# telegram-bot/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001
CMD ["node", "telegram-bot.js"]
```

```bash
# Build images
docker build -t identity-vault-api:latest ./backend
docker build -t identity-vault-bot:latest ./telegram-bot

# Tag for registry
docker tag identity-vault-api:latest gcr.io/your-project/identity-vault-api:latest
docker tag identity-vault-bot:latest gcr.io/your-project/identity-vault-bot:latest

# Push to registry
docker push gcr.io/your-project/identity-vault-api:latest
docker push gcr.io/your-project/identity-vault-bot:latest
```

#### Step 2: Kubernetes Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: identity-vault-api
  labels:
    app: identity-vault-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: identity-vault-api
  template:
    metadata:
      labels:
        app: identity-vault-api
    spec:
      containers:
      - name: api
        image: gcr.io/your-project/identity-vault-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: vault-secrets
              key: database-url
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: vault-secrets
              key: anthropic-key
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: vault-secrets
              key: jwt-secret
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: identity-vault-api
spec:
  selector:
    app: identity-vault-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

```bash
# Deploy to Kubernetes
kubectl create secret generic vault-secrets \
  --from-literal=database-url=postgres://... \
  --from-literal=anthropic-key=sk-ant-xxx \
  --from-literal=jwt-secret=$(openssl rand -hex 32)

kubectl apply -f k8s/

# Verify
kubectl get pods
kubectl logs -f deployment/identity-vault-api
```

---

### Option 3: AWS (ECS + RDS)

#### Step 1: Create RDS Database

```bash
# Create PostgreSQL database
aws rds create-db-instance \
  --db-instance-identifier identity-vault-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 20

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier identity-vault-db \
  --query 'DBInstances[0].Endpoint.Address'
```

#### Step 2: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name identity-vault

# Register task definition
aws ecs register-task-definition \
  --family identity-vault-api \
  --container-definitions '[{
    "name": "api",
    "image": "your-registry/identity-vault-api:latest",
    "portMappings": [{"containerPort": 3000}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "DATABASE_URL", "value": "postgres://..."}
    ]
  }]'

# Create service
aws ecs create-service \
  --cluster identity-vault \
  --service-name identity-vault-api \
  --task-definition identity-vault-api \
  --desired-count 3 \
  --launch-type FARGATE
```

#### Step 3: Setup ALB

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name identity-vault-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create target group
aws elbv2 create-target-group \
  --name identity-vault-api \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx

# Register targets and create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=...
```

---

### Option 4: DigitalOcean (Simple & Affordable)

#### Step 1: Create Droplet

```bash
# Via doctl CLI
doctl compute droplet create identity-vault \
  --region sfo3 \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --wait

# Get IP
doctl compute droplet get identity-vault --format PublicIPv4 --no-header
```

#### Step 2: Setup Server

```bash
# SSH into droplet
ssh root@YOUR_IP

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install nginx
apt install -y nginx

# Install certbot for SSL
apt install -y certbot python3-certbot-nginx
```

#### Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
git clone your-repo identity-vault
cd identity-vault/backend

# Install dependencies
npm ci --only=production

# Setup environment
cp .env.example .env
# Edit .env with production values
nano .env

# Create systemd service
cat > /etc/systemd/system/identity-vault-api.service << EOF
[Unit]
Description=Identity Vault API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/identity-vault/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable identity-vault-api
systemctl start identity-vault-api
```

#### Step 4: Setup Nginx

```nginx
# /etc/nginx/sites-available/identity-vault
upstream api {
  server localhost:3000;
}

server {
  server_name yourdomain.com;
  
  client_max_body_size 10M;

  location / {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  listen 80;
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/identity-vault /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup SSL
certbot --nginx -d yourdomain.com

# Verify
curl https://yourdomain.com/health
```

---

## 🔐 Security Hardening

### 1. Update Production Environment Variables

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$(openssl rand -base64 32)

# Set in production
export JWT_SECRET="$JWT_SECRET"
export ADMIN_PASSWORD="$ADMIN_PASSWORD"
export NODE_ENV="production"
export ALLOWED_ORIGINS="https://yourdomain.com,https://t.me"
```

### 2. Enable Security Headers

```javascript
// Add to server.js
const helmet = require('helmet');
app.use(helmet());

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', authLimiter, loginHandler);
```

### 4. Database Security

```bash
# Secure PostgreSQL
# /etc/postgresql/14/main/postgresql.conf
listen_addresses = 'localhost'
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'

# Restart PostgreSQL
systemctl restart postgresql

# Create application user (minimal privileges)
sudo -u postgres psql << EOF
CREATE USER vault_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE identity_vault TO vault_app;
GRANT USAGE ON SCHEMA public TO vault_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO vault_app;
EOF
```

### 5. API Security

```javascript
// Validate API input
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register', [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 8 }),
  body('telegram_id').optional().isNumeric()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});

// CORS whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

## 📊 Monitoring & Logging

### 1. Setup Monitoring

```javascript
// Prometheus metrics
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.route?.path, res.statusCode).observe(duration);
  });
  next();
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### 2. Setup Logging

```javascript
// Winston logger
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Use in routes
logger.info('User registered', { userId, email });
logger.error('Database connection failed', { error });
```

### 3. Setup Alerting

```bash
# Uptime monitoring
curl -s https://yourdomain.com/health | jq '.status'

# Alert if down
if [ $? -ne 0 ]; then
  # Send alert (Slack, PagerDuty, etc)
  curl -X POST https://hooks.slack.com/... \
    -d '{"text": "Identity Vault API is down"}'
fi
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: node run-attacks.js

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "identity-vault-api"
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          
      - name: Run migrations
        run: heroku run node init-db.js
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
          
      - name: Smoke test
        run: curl https://identity-vault-api.herokuapp.com/health
```

---

## 📋 Post-Deployment

### Step 1: Verify Deployment

```bash
# Check API health
curl https://yourdomain.com/health
# Expected: {"status": "operational", ...}

# Check bot connection
curl https://your-bot-domain.com/health
# Expected: {"status": "operational", "bot_token": "✓ Configured"}

# Test authentication
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
# Expected: {"success": true, "token": "..."}

# Test Telegram webhook
curl https://yourdomain.com/set-webhook
# Expected: {"success": true}
```

### Step 2: Database Backup

```bash
# Create backup
pg_dump identity_vault > backup.sql

# Or with cloud provider
heroku pg:backups:capture --app identity-vault-api

# Schedule automated backups
# Heroku: Dashboard → Add-ons → Heroku PostgreSQL → Backups
```

### Step 3: Monitor Performance

```bash
# Check logs
heroku logs --tail --app identity-vault-api

# Check metrics
curl https://yourdomain.com/metrics

# Monitor dashboard
# Open https://yourdomain.com/dashboard
```

### Step 4: Setup Alerts

```bash
# Heroku alerts
heroku alerts:add ERROR_RATE_HIGH --value 5

# Custom alerts
# Email: errors@yourdomain.com
# Slack: #identity-vault-alerts
```

---

## 🆘 Incident Response

### If Deployment Fails

```bash
# Rollback on Heroku
heroku releases --app identity-vault-api
heroku releases:rollback v123 --app identity-vault-api

# Rollback on Kubernetes
kubectl rollout undo deployment/identity-vault-api

# Check logs
kubectl logs -f deployment/identity-vault-api
```

### If Database Fails

```bash
# Restore from backup
heroku pg:backups:restore b123 DATABASE_URL --app identity-vault-api

# Or manual restore
psql identity_vault < backup.sql
```

### If API is Slow

```bash
# Scale up
heroku ps:scale web=5 --app identity-vault-api

# Check database performance
heroku pg:ps --app identity-vault-api

# Check logs for errors
heroku logs --tail --app identity-vault-api
```

---

## 📈 Scaling Strategy

### Horizontal Scaling

```bash
# Heroku
heroku ps:scale web=5 --app identity-vault-api

# Kubernetes
kubectl scale deployment/identity-vault-api --replicas=5

# AWS ECS
aws ecs update-service \
  --cluster identity-vault \
  --service identity-vault-api \
  --desired-count 5
```

### Vertical Scaling (Upgrade Instance Type)

```bash
# Heroku
heroku ps:type standard-2x --app identity-vault-api

# AWS
# Modify RDS instance class via AWS Console

# DigitalOcean
doctl compute droplet-action resize identity-vault --size s-4vcpu-8gb
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_answers_profile_id ON answers(profile_id);
CREATE INDEX idx_verification_profile_id ON verification_attempts(profile_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM profiles WHERE user_id = 'xxx';
```

---

## ✅ Final Checklist

- [ ] All tests pass
- [ ] Security score ≥ 80/100
- [ ] SSL certificate active
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Alerts setup
- [ ] Logging active
- [ ] Team trained
- [ ] Documentation updated
- [ ] On-call rotation established
- [ ] Incident response plan ready
- [ ] Scaling strategy tested

---

## 🎯 Success Criteria

- Response time: < 200ms
- Uptime: ≥ 99.5%
- Error rate: < 0.1%
- Verification success rate: ≥ 95%
- Security score: ≥ 80/100

---

**Your Identity Vault is now production-ready! 🚀🔐**

For support:
- Documentation: See SETUP_GUIDE.md
- Issues: GitHub Issues
- Security: security@yourdomain.com
- Support: support@yourdomain.com
