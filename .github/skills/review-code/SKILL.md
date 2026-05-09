---
name: review-code
description: >
  Perform code review with security, performance, and best-practice
  checklists. Fetches PR diffs from GitHub. Supports review-mode qualifiers:
  `/review-code security`, `/review-code performance`,
  `/review-code accessibility`.
argument-hint: "[PR number, branch, or file] [optional: security|performance|accessibility]"
---

# Review Code

## When to Use

- Reviewing a pull request or code diff
- Auditing code for security vulnerabilities
- Checking performance patterns
- Auditing accessibility of UI changes
- Validating adherence to project conventions

## Review Modes

Accept an optional qualifier to focus the review:

| Qualifier | Focus |
|---|---|
| (none) | Full review — correctness, security, performance, maintainability, testing, docs |
| `security` | Only the [security checklist](references/security-checklist.md) |
| `performance` | Only the [performance checklist](references/performance-checklist.md) |
| `accessibility` | Only the [accessibility checklist](references/accessibility-checklist.md) |

When a qualifier is supplied, skip unrelated categories and call that out in
the summary.

## Review Checklist (Full Mode)

1. **Correctness** — Does the code do what it's supposed to? Are there logic
   errors or edge cases?
2. **Security** — Injection, exposed secrets, insecure defaults, missing
   input validation. See [security checklist](references/security-checklist.md).
3. **Performance** — N+1 queries, unnecessary allocations, blocking calls,
   missing caching. See [performance checklist](references/performance-checklist.md).
4. **Accessibility** — Keyboard support, semantic HTML, labels, contrast,
   focus management. See [accessibility checklist](references/accessibility-checklist.md).
5. **Maintainability** — Readable, well-structured, follows project conventions.
6. **Testing** — Adequate tests; cover edge cases and error paths.
7. **Documentation** — Public APIs documented; complex algorithms explained.

## Workflow

1. Parse the argument: target (PR number, branch, file) + optional qualifier.
2. Fetch the diff and changed files from GitHub (or local branch compare).
3. Read the full context of changed files — not just the diff hunks.
4. Apply the relevant checklist(s) based on the qualifier.
5. Categorize findings by severity.
6. Provide concrete fix suggestions with file paths and line numbers.

## Severity Levels

- **Critical** — Must fix before merge (security, data loss, crashes)
- **Warning** — Should fix; potential issues (performance, maintainability)
- **Suggestion** — Nice-to-have improvements

## References

- [`references/security-checklist.md`](references/security-checklist.md)
- [`references/performance-checklist.md`](references/performance-checklist.md)
- [`references/accessibility-checklist.md`](references/accessibility-checklist.md)

## Guidelines

- Reference specific file paths and line numbers in feedback.
- Provide concrete fix suggestions, not just problem descriptions.
- Acknowledge good patterns alongside issues.
- Keep feedback actionable and constructive.
- When running in a qualifier mode, do not block on issues outside that mode
  — mention them briefly and move on.

## Context

Check `~/.ai-sdlc/profile.yaml` for defaults:
- `defaults.github.repo` — default repo for PR fetches
- `teams.<name>.review_standards` — team-specific rules to apply
- `defaults.review.mode` — default qualifier if none supplied
