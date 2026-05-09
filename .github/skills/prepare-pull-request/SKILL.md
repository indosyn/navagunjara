---
name: prepare-pull-request
description: >
  Generate a PR title, description, checklist, and linked references from
  branch diffs. Tailored for this repo's branch conventions and workflow triggers.
argument-hint: "[branch name or feature description]"
---

# Prepare Pull Request

## When to Use

- Any feature, fix, or chore branch ready to merge into `main`
- After completing the develop-feature workflow
- When a hotfix needs a fast but complete PR description

## Instructions

1. Run `git diff main...HEAD --stat` to get changed files summary.
2. Run `git log main..HEAD --oneline` to get commit list.
3. Determine the change type: `feat` / `fix` / `chore` / `docs` / `refactor` / `test`.
4. Generate PR title: `<type>: <concise description>` (max 72 chars).
5. Fill in the PR description template below.
6. Check which GitHub Actions workflows will be triggered by this merge — list them.

## PR Description Template

```markdown
## Summary
<!-- 2-3 sentences: what changed and why -->

## Changes
<!-- Bullet list of key changes grouped by area -->
- **src/**: ...
- **.github/workflows/**: ...
- **tests/**: ...

## Testing
- [ ] `npm test` passes locally
- [ ] `npm run test:coverage` — coverage did not regress
- [ ] `npm run lint` passes
- [ ] `npm run dev` verified in browser (if UI changes)

## Workflows Triggered by This Merge
<!-- List which .github/workflows/*.yml files will run on merge to main -->

## Security
- [ ] No secrets or credentials in committed files
- [ ] `.env` is gitignored and not staged
- [ ] No new `npm audit` critical/high findings introduced

## Notes
<!-- Breaking changes, migration steps, follow-up tickets -->
```

## Branch Naming Conventions (this repo)

| Prefix | Use |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, deps, config |
| `docs/` | Documentation only |
| `hotfix/` | Urgent production fixes |

## Workflow Impact Reference

| Change area | Workflows triggered |
|---|---|
| `src/client/**`, `src/server/**` | `deploy-dashboard.yml` |
| `src/**`, `tests/**` | `deploy-dashboard.yml` (runs tests) |
| `.github/workflows/aggregate-reports.yml` | No auto-trigger — manual/scheduled |
| Any push to `main` | `deploy-dashboard.yml` |
