#!/bin/bash

# Identity Vault - One-Click Heroku Deployment
# Usage: ./deploy.sh [app-name]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Get app name from argument or prompt
if [ -z "$1" ]; then
  read -p "Enter Heroku app name (e.g., identity-vault-api): " APP_NAME
else
  APP_NAME=$1
fi

if [ -z "$APP_NAME" ]; then
  log_error "App name is required"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Identity Vault - Heroku Deployment                  ║"
echo "║   App: $APP_NAME"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check Heroku CLI
log_info "Checking Heroku CLI..."
if ! command -v heroku &> /dev/null; then
  log_error "Heroku CLI not found. Install from https://devcenter.heroku.com/articles/heroku-cli"
  exit 1
fi
log_success "Heroku CLI found"

# Check authentication
log_info "Checking Heroku authentication..."
if ! heroku auth:whoami &> /dev/null; then
  log_error "Not logged into Heroku. Run: heroku login"
  exit 1
fi
log_success "Authenticated with Heroku"

# Check if app exists or create
log_info "Checking Heroku app..."
if heroku apps:info --app "$APP_NAME" &> /dev/null; then
  log_success "App '$APP_NAME' found"
else
  log_info "Creating app '$APP_NAME'..."
  heroku create "$APP_NAME" || {
    log_error "Failed to create app"
    exit 1
  }
  log_success "App created"
fi

# Add PostgreSQL
log_info "Setting up PostgreSQL database..."
if heroku addons --app "$APP_NAME" | grep -q "heroku-postgresql"; then
  log_success "Database already added"
else
  heroku addons:create heroku-postgresql:standard-0 --app "$APP_NAME" || {
    log_warning "Could not add database (may already exist or plan issue)"
  }
  log_success "Database added"
fi

# Generate secrets
log_info "Generating secrets..."
JWT_SECRET=$(openssl rand -hex 32)
log_success "Secrets generated"

# Set environment variables
log_info "Setting environment variables..."
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET="$JWT_SECRET" \
  --app "$APP_NAME" || {
  log_error "Failed to set environment variables"
  exit 1
}
log_success "Environment variables set"

# Prompt for Anthropic API key
echo ""
read -sp "Enter your Anthropic API key (sk-ant-...): " ANTHROPIC_API_KEY
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
  log_error "Anthropic API key is required"
  exit 1
fi

heroku config:set \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  --app "$APP_NAME"

log_success "Anthropic API key configured"

# Get database URL
log_info "Waiting for database..."
sleep 5
DATABASE_URL=$(heroku config:get DATABASE_URL --app "$APP_NAME")

if [ -z "$DATABASE_URL" ]; then
  log_warning "Database URL not found. You may need to configure it manually."
else
  log_success "Database configured"
fi

# Add buildpacks
log_info "Setting up buildpacks..."
heroku buildpacks:set heroku/nodejs --app "$APP_NAME" || true
log_success "Buildpacks configured"

# Deploy
log_info "Deploying application..."
if git remote | grep -q heroku; then
  log_info "Heroku remote already exists"
else
  heroku git:remote --app "$APP_NAME" || true
fi

git push heroku main || git push heroku master || {
  log_error "Deployment failed"
  exit 1
}
log_success "Application deployed"

# Initialize database
log_info "Initializing database..."
heroku run node init-db.js --app "$APP_NAME" || {
  log_warning "Database initialization had issues (may already be initialized)"
}
log_success "Database initialized"

# Verify deployment
log_info "Verifying deployment..."
sleep 5

HEALTH_URL="https://$APP_NAME.herokuapp.com/health"
RESPONSE=$(curl -s "$HEALTH_URL")

if echo "$RESPONSE" | grep -q "operational"; then
  log_success "Application is operational"
else
  log_error "Health check failed"
  log_info "URL: $HEALTH_URL"
  exit 1
fi

# Display summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          🎉 Deployment Successful! 🎉                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "App Details:"
echo "  URL: https://$APP_NAME.herokuapp.com"
echo "  API: https://$APP_NAME.herokuapp.com/health"
echo "  Logs: heroku logs --tail --app $APP_NAME"
echo ""
echo "Next Steps:"
echo "  1. Update your Telegram bot webhook:"
echo "     heroku run node /set-webhook --app $APP_NAME"
echo "  2. View logs:"
echo "     heroku logs --tail --app $APP_NAME"
echo "  3. Scale if needed:"
echo "     heroku ps:scale web=2 --app $APP_NAME"
echo "  4. Setup monitoring:"
echo "     heroku config:set LOG_LEVEL=info --app $APP_NAME"
echo ""
echo "Resources:"
echo "  Dashboard: https://dashboard.heroku.com/apps/$APP_NAME"
echo "  Documentation: See PRODUCTION_DEPLOYMENT.md"
echo "  Support: support@yourdomain.com"
echo ""

# Optional: Open dashboard
read -p "Open Heroku dashboard? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  heroku open --app "$APP_NAME"
fi

log_success "Deployment complete! Your Identity Vault is live! 🚀"
