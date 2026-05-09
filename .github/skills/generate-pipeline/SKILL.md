---
name: generate-pipeline
description: >
  Add, update, or troubleshoot GitHub Actions workflows for this repo.
  Covers report generation scheduling, dashboard deployment, and test CI.
argument-hint: "[workflow name or goal]"
---

# Generate Pipeline

## When to Use

- Adding a new scheduled workflow (e.g., new test suite integration)
- Updating an existing workflow (trigger paths, env vars, secrets)
- Troubleshooting a failing GitHub Actions run
- Adding a new deployment stage

## This Repo's Workflow Inventory

| File | Trigger | Purpose |
|---|---|---|
| `aggregate-reports.yml` | Daily 2AM UTC + manual | Fetch GitHub workflow data, generate HTML report, send email |
| `deploy-dashboard.yml` | Push to `main` + manual | Build React app → deploy to GH Pages |
| `test.yml` | Push/PR | Run Jest unit tests |
| `release.yml` | Tags | Create GitHub releases |
| `daily-unit-tests.yml` | Daily scheduled | Nightly test run |

## Key Secrets Required

```
GITHUB_TOKEN / GH_PAT_TOKEN  — read Actions/Contents on rcg-enterprise org
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  — RCCL relay (mrmrelay.rccl.com)
EMAIL_TO, EMAIL_FROM, EMAIL_CC  — distribution list
```

## Adding a New Report Source

To track a new repo's CI results, add an entry to `src/data/repos.json` — no workflow change needed. The `aggregate-reports.yml` workflow reads repos dynamically.

## Workflow Template: New Scheduled Job

```yaml
name: <Descriptive Name>

on:
  schedule:
    - cron: '0 2 * * *'   # 2AM UTC daily
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Skip side effects'
        default: 'false'
        type: boolean

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: <your command>
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT_TOKEN }}
```

## deploy-dashboard.yml Notes

- Sets `VITE_BASE_PATH=/QE-Automation-ci-cd-report-generator/` at build time
- Copies `output/*.html` + `reports-index.json` → `dist/reports/`
- Copies `src/data/repos.json` + `src/data/sections.json` → `dist/data/`
- Runs tests + JSDoc before build — failures block the deploy
- Uses `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| GH Pages shows old content | Check workflow completed; clear browser cache |
| `aggregate-reports.yml` fails with 404 | `GH_PAT_TOKEN` expired or lacks Actions read scope |
| Email not delivered | SMTP only works on RCCL VPN — GitHub-hosted runners cannot reach `mrmrelay.rccl.com` via public internet; use an external SMTP or GitHub Actions SMTP service |
| Deploy fails on test step | Run `npm test` locally to reproduce |
