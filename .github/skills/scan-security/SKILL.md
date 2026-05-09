---
name: scan-security
description: >
  Run npm audit to find CVE vulnerabilities, triage findings by severity,
  and produce fix/upgrade recommendations. For this repo, also checks for
  hardcoded secrets and OWASP Top 10 issues in the Express API.
argument-hint: "[optional: critical-only | high | all]"
---

# Scan Security

## When to Use

- Before opening a PR that changes `package.json` or `package-lock.json`
- During regular maintenance (monthly CVE sweeps)
- After GitHub Dependabot alerts appear
- Before a production deployment

## Instructions

### 1. Dependency Scan (SCA)

```bash
npm audit --json
```

Triage findings:
| Severity | Action |
|---|---|
| Critical | Block PR — fix before merge |
| High | Fix within same sprint |
| Moderate | Fix within 30 days |
| Low | Log, fix opportunistically |

Run `npm audit fix` for safe auto-fixes. For breaking changes use `npm audit fix --force` only after reviewing the diff.

### 2. Hardcoded Secrets Check

Search for patterns that should never appear in committed code:
- `GITHUB_TOKEN`, `GH_PAT`, `github_pat_` in non-`.env` files
- Passwords, API keys in source files
- Check `.gitignore` includes `.env`

### 3. Express API Review (OWASP Top 10)

Review `src/server/index.js` for:
- **A01 Broken Access Control** — all `/api/*` routes are public; confirm this is intentional for internal use
- **A03 Injection** — no user input passed to `fs` paths or shell commands unsanitized
- **A05 Security Misconfiguration** — CORS is `*`; confirm acceptable for internal dashboard
- **A09 Logging** — errors logged but no sensitive data exposed in responses

### 4. React Client Review

Review `src/client/services/api.js` for:
- GitHub token stored in `localStorage` — acceptable trade-off for internal tool, but note it
- No user input rendered as raw HTML (`dangerouslySetInnerHTML`)

## Reporting

Summarize findings as:
```
CRITICAL (must fix): X findings
HIGH (fix this sprint): X findings  
MODERATE (fix within 30d): X findings
LOW: X findings
```

List each with: package, CVE ID, description, fix command.

## This Repo's Known State

- 31 vulnerabilities flagged on default branch (1 critical, 14 high, 13 moderate, 3 low) as of April 2026
- Run `npm audit` to get current state before triaging
