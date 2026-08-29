# Identity Vault - Attack & Fuzzing Module Guide

## 🎯 Overview

The Attack Module helps you **ethically test your own Identity Vault profiles** against various security threats. This is crucial for understanding vulnerabilities before deploying in production.

**Key Principle:** Only test against your own profiles. Never use these attacks against others' systems.

---

## 📋 Attack Strategies

### 1. 🔴 Consistency Attack

**Objective:** Test if the system accepts inconsistent answers during verification

**How it works:**
1. Build a profile with certain preferences (e.g., "Moon over Sun")
2. During verification, claim opposite preference ("Sun over Moon")
3. Check if system accepts the contradiction

**What it tests:**
- Identity verification robustness
- Temporal consistency checking
- Answer history validation

**Expected Result:** System should **REJECT** inconsistent answers

**Vulnerability If Failed:**
```
⚠️ Attacker can pass verification by changing identity
→ Complete loss of security
```

---

### 2. 🔴 Random Answer Attack

**Objective:** Check if random answers still produce strong profiles

**How it works:**
1. Create profile with completely random answers
2. Let AI analyze the profile
3. Check if strength score is unreasonably high

**What it tests:**
- AI overfitting to noise
- Pattern detection validity
- Baseline profiling accuracy

**Expected Result:** Random answers should score **< 40%**

**Vulnerability If Failed:**
```
⚠️ AI creates patterns from noise
→ Attacker can fool system with random answers
```

---

### 3. 🔴 Demographics Attack

**Objective:** Check if profiles can be spoofed using demographic inference

**How it works:**
1. Assume demographic characteristics (age, region, etc.)
2. Answer based on statistical patterns for that group
3. See if spoofed profile gets accepted

**What it tests:**
- Demographic bias in profiling
- Predictability of answers
- Stereotype vulnerability

**Expected Result:** Demographic profiles should score **< 50%**

**Vulnerability If Failed:**
```
⚠️ Attacker can spoof identity using demographic guessing
→ Profile spoofing via statistical inference
```

---

### 4. 🔴 Brute Force Attack

**Objective:** Test if simple patterns can fool the system

**How it works:**
1. Try all common answer patterns:
   - All same answer
   - Alternating answers
   - Grouped answers
2. Check which patterns get accepted

**What it tests:**
- Pattern validation
- Answer diversity enforcement
- Entropy requirements

**Expected Result:** All-same patterns should score **< 30%**

**Vulnerability If Failed:**
```
⚠️ Attacker can use predictable patterns
→ Low entropy profiles accepted as valid
```

---

### 5. 🔴 Session Manipulation

**Objective:** Check if fake identities strengthen over multiple sessions

**How it works:**
1. Create fake profile (Session 1)
2. Complete another fake session with same identity (Session 2)
3. Check if strength score increases significantly
4. Repeat Session 3
5. Analyze growth pattern

**What it tests:**
- Session accumulation logic
- Multi-session validation
- Convergence bias

**Expected Result:** Strength growth should be **< 5% per session**

**Vulnerability If Failed:**
```
⚠️ Attacker can gradually build credibility
→ Fake identity becomes valid through repetition
```

---

### 6. 🔴 Answer Injection

**Objective:** Test input validation with edge cases

**How it works:**
1. Try unusual/extreme answers:
   - "Both", "Neither"
   - Emojis and special characters
   - Empty strings
   - Malformed input
2. Check if system processes them

**What it tests:**
- Input validation strength
- Error handling
- Edge case management

**Expected Result:** System should **REJECT** all invalid inputs

**Vulnerability If Failed:**
```
⚠️ Attacker can bypass answer validation
→ Arbitrary data injection possible
```

---

### 7. 🔴 Verification Bypass

**Objective:** Test if generic answers pass verification

**How it works:**
1. Get verification challenge
2. Try generic/common answers:
   - "Yes", "No", "I agree"
   - Expected keyword alone
   - Ambiguous responses
3. Check if any bypass verification

**What it tests:**
- Keyword matching robustness
- Specificity requirements
- Fuzzy matching vulnerability

**Expected Result:** Only profile-specific answers should pass

**Vulnerability If Failed:**
```
🔴 CRITICAL: Attacker can bypass identity verification
→ Complete security failure
```

---

## 📊 Vulnerability Severity Levels

| Level | Score Loss | Example |
|-------|-----------|---------|
| 🔴 **CRITICAL** | -25 | Verification bypass |
| 🟠 **HIGH** | -15 | Input injection accepted |
| 🟡 **MEDIUM** | -8 | Demographic predictability |
| 🟢 **LOW** | -3 | Minor edge cases |

---

## 🚀 Running Attacks

### Quick Start

```bash
# Run all attacks (creates test profiles)
node run-attacks.js

# Attack specific existing profile
node run-attacks.js profile_abc123

# Run specific attack strategy
node run-attacks.js profile_abc123 consistency
node run-attacks.js all random
node run-attacks.js all demographics
```

### Full Options

```bash
# Print usage
node run-attacks.js --help

# Run with custom API URL
API_URL=https://api.example.com node run-attacks.js

# Run with specific token
API_TOKEN=your_token node run-attacks.js

# Output to file
node run-attacks.js > attack-results.txt 2>&1
```

---

## 📄 Understanding the Report

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "totalAttacks": 6,
  "successfulAttacks": 2,
  "vulnerabilitiesFound": 2,
  "securityScore": 72,
  "results": [
    {
      "name": "Consistency Attack",
      "success": false,
      "description": "Answer differently on verification",
      "details": {
        "observation": "✓ System correctly rejected inconsistent answer"
      }
    },
    {
      "name": "Random Answer Attack",
      "success": true,
      "details": {
        "observation": "⚠️ Random answers scored 55% - AI may overfit"
      }
    }
  ],
  "vulnerabilities": [
    {
      "type": "Overfitting",
      "description": "Random answers achieved 55% strength",
      "severity": "MEDIUM",
      "impact": "AI may create patterns from noise"
    }
  ]
}
```

### Key Metrics

| Metric | Meaning |
|--------|---------|
| `totalAttacks` | How many attack strategies ran |
| `successfulAttacks` | How many found vulnerabilities |
| `vulnerabilitiesFound` | Total unique vulnerabilities discovered |
| `securityScore` | Overall security rating (0-100) |

---

## 🛡️ Security Score Interpretation

| Score | Assessment | Action |
|-------|------------|--------|
| **80-100** | Well Protected | Ready for deployment |
| **60-80** | Moderate Risk | Fix high-severity issues |
| **40-60** | Significant Risk | Major refactoring needed |
| **0-40** | Critical Risk | Not production-ready |

---

## 🔍 Common Vulnerabilities & Fixes

### Vulnerability: Overfitting (Random Answers Accepted)

**Problem:** AI creates patterns from noise

**Fix:**
```javascript
// In server.js - Add baseline validation
const baselineScore = 30; // Random should score ~30%
if (strengthScore > baselineScore + 15) {
  // Require answer diversity check
  const uniqueAnswers = new Set(answers.map(a => a.answer));
  if (uniqueAnswers.size < answers.length * 0.6) {
    strengthScore = Math.max(baselineScore, strengthScore - 20);
  }
}
```

### Vulnerability: Demographic Predictability

**Problem:** Statistical patterns make profiles guessable

**Fix:**
```javascript
// Use cross-demographic questions
const Questions = [
  // Bad: Correlates with age
  "Do you prefer technology or nature?", // Young → tech
  
  // Better: Randomized preference
  "Do you prefer hexagons or pentagons?",
  "What's your opinion on teal vs coral?"
];
```

### Vulnerability: Verification Bypass

**Problem:** Generic answers pass verification

**Fix:**
```javascript
// Require multiple keywords or exact matching
const verifyAnswer = (userAnswer, expectedKeywords) => {
  const matchCount = expectedKeywords.filter(k =>
    userAnswer.toLowerCase().includes(k.toLowerCase())
  ).length;
  
  // Require at least 2 keywords, not just 1
  return matchCount >= Math.ceil(expectedKeywords.length / 2);
};
```

### Vulnerability: Session Accumulation

**Problem:** Fake profiles strengthen over time

**Fix:**
```javascript
// Limit growth per session
const maxStrengthGrowth = 5; // % per session
const newStrength = Math.min(
  oldStrength + maxStrengthGrowth,
  100
);
```

---

## 📈 Continuous Testing Strategy

### Phase 1: Baseline Testing
```bash
# Day 1: Establish baseline vulnerabilities
node run-attacks.js > baseline-report.json

# Analyze which attacks succeed
jq '.vulnerabilities' baseline-report.json
```

### Phase 2: Fix & Verify
```bash
# Implement fixes in server.js
# Re-run attacks to verify fixes
node run-attacks.js > post-fix-report.json

# Compare reports
diff baseline-report.json post-fix-report.json
```

### Phase 3: Regression Testing
```bash
# Before each deployment
node run-attacks.js

# Should have zero new vulnerabilities
```

---

## 🧪 Custom Attack Development

### Creating Custom Attacks

```javascript
// in attack-module.js
async customAttack() {
  const result = {
    name: 'My Custom Attack',
    description: 'What I\'m testing',
    success: false,
    details: {}
  };

  try {
    // Your attack logic here
    const profileRes = await this.apiRequest('/api/profiles/create', 'POST', {});
    
    // Try something
    const challenge = await this.apiRequest(...);
    
    // Check if it worked
    if (somethingFailed) {
      result.success = true;
      this.vulnerabilities.push({
        type: 'My Vulnerability',
        description: 'Description',
        severity: 'MEDIUM',
        impact: 'What an attacker could do'
      });
    }
  } catch (error) {
    result.error = error.message;
  }

  this.results.push(result);
  return result;
}
```

---

## 🚨 Important Rules

### ✅ DO:
- Test only your own profiles
- Document findings
- Share results with team
- Fix vulnerabilities before production
- Re-test after fixes

### ❌ DON'T:
- Attack others' profiles
- Publish exploits publicly
- Use findings maliciously
- Skip security testing
- Deploy unvetted systems

---

## 📊 Threat Model

The attacks test against these threat actors:

### 1. **Naive Attacker**
- Uses random or simple strategies
- Caught by: Basic validation, pattern analysis

### 2. **Informed Attacker**
- Knows about demographics
- Tries multiple patterns
- Caught by: Diversity requirements, statistical baselines

### 3. **Sophisticated Attacker**
- Builds fake profile over time
- Uses consistency
- Caught by: Multi-session validation, anomaly detection

---

## 🔄 Integration with CI/CD

```yaml
# .github/workflows/security-test.yml
name: Security Testing

on: [push, pull_request]

jobs:
  attack-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run attack module
        run: |
          node run-attacks.js > report.json
          
      - name: Check security score
        run: |
          SCORE=$(jq '.securityScore' report.json)
          if [ "$SCORE" -lt 70 ]; then
            echo "Security score too low: $SCORE"
            exit 1
          fi
          
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: security-report
          path: report.json
```

---

## 📚 References

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [Fuzzing Techniques](https://owasp.org/www-community/Fuzzing)

---

## 🎓 Next Steps

1. ✅ Run all attacks on test profiles
2. ✅ Review vulnerability report
3. ✅ Implement recommended fixes
4. ✅ Re-run attacks to verify
5. ✅ Document lessons learned
6. 🔄 Integrate into CI/CD pipeline
7. 🚀 Deploy production version

---

**Secure by testing, not by hoping!** 🛡️
