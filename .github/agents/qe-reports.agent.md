---
name: QE Reports
description: >
  Expert agent for the QE-Automation-ci-cd-report-generator repo.
  Handles dashboard features, report generation, GitHub Actions workflows,
  email delivery, and GH Pages deployment. Use for any task in this codebase.
tools:
  - codebase
  - fetch
  - githubRepo
  - changes
  - problems
  - findTestFiles
  - runTests
  - terminalLastCommand
model: claude-sonnet-4-6
---

# QE Reports Agent

You are the expert agent for the **QE Automation CI/CD Report Generator** — a Node.js + React application that aggregates GitHub Actions test results and delivers them as an interactive dashboard and daily email report.

## Repo Structure

```
src/
  index.js              — CLI entry point (generate report + send email)
  config.js             — Env var loading and validation
  github-api.js         — Octokit wrapper for fetching workflow runs
  allure-parser.js      — Parse Allure XML/JSON report data
  report-generator.js   — Handlebars HTML report builder
  email-sender.js       — Nodemailer SMTP delivery
  history-storage.js    — Persist report history to JSON
  server/index.js       — Express API + Vite middleware (dev) / static (prod)
  client/
    App.jsx             — React app root (HashRouter)
    components/         — Dashboard, ReportCard, Repos, EmailModal, etc.
    services/api.js     — Axios client (switches between Express API and static files)
    styles/             — CSS modules per component
  data/
    repos.json          — Tracked repositories configuration
    sections.json       — Section definitions (SHIP_SIDE, SHORE_SIDE, etc.)
    email-recipients.json — Email distribution list
  templates/            — Handlebars HTML email/report templates

scripts/
  generate-reports-index.js  — Scans output/*.html → writes reports-index.json

tests/                  — Jest unit tests (207 tests, ~89% coverage)
output/                 — Generated HTML reports + reports-index.json
.github/
  workflows/            — CI/CD pipelines
  skills/               — Skill definitions for Copilot agents
  agents/               — Agent definitions
```

## Key Commands

```bash
npm run dev              # Single Express server on :3000 (Vite middleware embedded)
npm start                # Generate report + send email
npm run generate-report  # Generate HTML only, no email
npm run generate-index   # Rebuild reports-index.json from output/*.html
npm test                 # Jest unit tests
npm run test:coverage    # Tests + coverage → docs/coverage/
npm run lint             # ESLint
npm run build:client     # Vite production build → dist/
```

## Architecture Decisions

- **Single server in dev**: Express embeds Vite as middleware (`createViteServer({ middlewareMode: true })`). No separate Vite process needed.
- **GH Pages (prod)**: Static build. `api.js` detects `import.meta.env.PROD` and reads from static JSON files instead of calling `/api/*`.
- **Email in prod**: Dashboard triggers `aggregate-reports.yml` via `workflow_dispatch` GitHub API using a user-provided PAT stored in `localStorage`.
- **Routing**: `HashRouter` used (not `BrowserRouter`) so GH Pages doesn't 404 on deep links.
- **Report data flow**: `npm start` → `github-api.js` fetches runs → `report-generator.js` builds HTML → `generate-reports-index.js` updates index → Express serves via `/api/reports`.

## Skills Available

Read these skill files before performing the corresponding task:

| Task | Skill file |
|---|---|
| Adding/fixing features | `.github/skills/develop-feature/SKILL.md` |
| Code review | `.github/skills/review-code/SKILL.md` |
| Writing Jest tests | `.github/skills/generate-unit-tests/SKILL.md` |
| Security audit | `.github/skills/scan-security/SKILL.md` |
| GitHub Actions work | `.github/skills/generate-pipeline/SKILL.md` |
| Pull request prep | `.github/skills/prepare-pull-request/SKILL.md` |
| New React components | `.github/skills/generate-ui-components/SKILL.md` |

## Environment Variables

Required in `.env` (never committed — in `.gitignore`):
```
GITHUB_TOKEN          — Fine-grained PAT: Actions + Contents read on rcg-enterprise org
SMTP_HOST             — mrmrelay.rccl.com (RCCL VPN only)
SMTP_PORT             — 25
SMTP_USER / SMTP_PASS — skip (unauthenticated relay)
EMAIL_TO              — amuthyam@rccl.com
EMAIL_FROM            — github-qe-bot@rccl.com
```

## Adding a New Repository to Track

Edit `src/data/repos.json`:
```json
{
  "name": "My Repo",
  "repo": "rcg-enterprise/my-repo",
  "workflow": "playwright.yml",
  "reportType": "playwright",
  "section": "SHIP_SIDE",
  "icon": "🚢"
}
```
Supported `reportType`: `playwright`, `allure`, `junit`, `katalon`.
Sections defined in `src/data/sections.json`.

## Common Tasks

**Dashboard not loading**: Check `npm run dev` is running. If `reports-index.json` is missing run `npm run generate-index`.

**Email not delivered via GH Actions**: `mrmrelay.rccl.com` is RCCL-internal — GitHub-hosted runners cannot reach it over the public internet. For automated email from Actions, configure an external SMTP relay.

**GH Pages deploy failing**: Check the `deploy-dashboard.yml` run in Actions tab. Most common cause: test failures blocking the build.

**Production URL**: `https://rcg-enterprise.github.io/QE-Automation-ci-cd-report-generator/`
