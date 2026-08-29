# Attack Module - Quick Reference

## Installation

```bash
# Add to existing project
npm install uuid  # Already in dependencies

# Make scripts executable
chmod +x run-attacks.js
```

## Running Attacks

### Basic Commands

```bash
# Run all attacks (creates new test profiles)
node run-attacks.js

# Test specific profile
node run-attacks.js abc123def456

# Test specific strategy
node run-attacks.js all consistency
node run-attacks.js all random
node run-attacks.js all demographics
node run-attacks.js all bruteforce
node run-attacks.js all injection
node run-attacks.js all verification
```

## Attack Strategies

| Strategy | What it tests | Command |
|----------|--------------|---------|
| Consistency | Can change answers? | `node run-attacks.js all consistency` |
| Random | Do random answers work? | `node run-attacks.js all random` |
| Demographics | Can guess based on stats? | `node run-attacks.js all demographics` |
| Brute Force | Can simple patterns work? | `node run-attacks.js all bruteforce` |
| Injection | Can bypass validation? | `node run-attacks.js all injection` |
| Verification | Can bypass verification? | `node run-attacks.js all verification` |
| Session | Does profile strengthen over time? | `node run-attacks.js all session` |

## Reports

```bash
# View report (JSON)
cat attack-report.json | jq .

# Check security score
jq '.securityScore' attack-report.json

# List vulnerabilities
jq '.vulnerabilities[] | {type, severity}' attack-report.json

# Pretty print
jq . attack-report.json
```

## Security Scores

```
80-100 ✅ Well protected → Ready to deploy
60-80  ⚠️  Moderate risk → Fix issues
40-60  🔴 High risk → Major review
0-40   🔴 Critical → Don't deploy
```

## Environment Setup

```bash
# Create .env
cat > .env << EOF
API_URL=http://localhost:3000
API_TOKEN=your_token_here_from_login
EOF

# Or get token from login
node -e "
const client = require('./IdentityVaultClient.js');
const vault = new client();
vault.login('user', 'pass').then(r => console.log(r.token));
"
```

## Workflow

```bash
# 1. Start backend
npm run dev

# 2. Login to get token
API_TOKEN=$(node get-token.js) npm start

# 3. Run attacks
node run-attacks.js

# 4. Review report
cat attack-report.json | jq '.vulnerabilities'

# 5. Fix issues in server.js

# 6. Re-run attacks
node run-attacks.js

# 7. Verify score improved
jq '.securityScore' attack-report.json
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "API_TOKEN not set" | Set in .env: `API_TOKEN=your_token` |
| "Cannot connect to API" | Start backend: `npm run dev` |
| "Authorization failed" | Token expired, get new one |
| "Profile not found" | Use new profile: `node run-attacks.js` |

## CI/CD Integration

```bash
# GitHub Actions
- name: Security Tests
  run: |
    node run-attacks.js
    SCORE=$(jq '.securityScore' attack-report.json)
    if [ "$SCORE" -lt 70 ]; then exit 1; fi
```

## Analysis Tips

```bash
# See which attacks succeeded
jq '.results[] | select(.success==true) | .name' attack-report.json

# Count vulnerabilities by severity
jq '[.vulnerabilities[] | .severity] | group_by(.) | map({(.[0]): length})' attack-report.json

# Timeline of security
jq '.timestamp' attack-report.json
```

## Understanding Results

### Example Report
```json
{
  "securityScore": 72,
  "totalAttacks": 6,
  "successfulAttacks": 2,
  "vulnerabilities": [
    {
      "type": "Overfitting",
      "severity": "MEDIUM",
      "impact": "AI creates patterns from noise"
    }
  ]
}
```

### What to Fix
1. Look at `vulnerabilities` array
2. For each, severity determines priority
3. Read `impact` to understand risk
4. Implement fix in `server.js`
5. Re-run to verify

## Continuous Testing

```bash
# Before each commit
npm test && node run-attacks.js

# Automate before deployment
git hook: node run-attacks.js || exit 1

# Monitor score over time
node run-attacks.js >> security-history.log
```

## Support

- Full guide: `ATTACK_MODULE_GUIDE.md`
- Code examples: `attack-module.js`
- Runner: `run-attacks.js`
- API: Backend `server.js`

---

**Run attacks regularly. Fix vulnerabilities quickly. Deploy safely.** 🛡️
