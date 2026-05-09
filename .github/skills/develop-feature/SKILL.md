---
name: develop-feature
description: >
  Story-to-PR development workflow: break down stories, scaffold (if new),
  implement, generate unit tests, scan for security, review, prepare the PR, and
  update tracking. Use to execute a feature end-to-end in 04-DEV.
argument-hint: "[Jira story key or feature name]"
---

# Develop Feature

## Purpose / When to Use

Used by Developers, Tech Leads, and Quality Engineers during **04-DEV** to take
a Jira story from "in progress" to "PR ready for review" without skipping the
hygiene steps (tests, security, code review, tracking). Orchestrates the core
dev skills with a conditional scaffolding step when the target is a new project.

## Workflow

1. **Break down stories** — Invoke `/break-down-stories` to split the target
   story into tasks/subtasks with clear acceptance criteria.
2. **Scaffold project** *(conditional)* — If the target is a new project or new
   module, invoke `/scaffold-project` to generate the initial structure, tooling,
   and lint/test config. Skip when working inside an existing codebase.
3. **Implement** — Work through the task list, editing source files to satisfy
   the acceptance criteria. This is the one step not delegated to another skill.
4. **Generate unit tests** — Invoke `/generate-unit-tests` for each changed
   module to add or extend coverage around the new behavior.
5. **Scan security** — Invoke `/scan-security` on the change set to catch
   dependency CVEs and SAST findings before review.
6. **Review code** — Invoke `/review-code` on the diff; address findings before
   opening the PR.
7. **Prepare pull request** — Invoke `/prepare-pull-request` to generate the
   PR title, description, checklist, and linked Jira references.
8. **Track project** — Invoke `/track-project` to transition the Jira story to
   "In Review" and refresh sprint tracking.
9. **Update progress memory** — Record the feature's progress in
   `progress.yaml`.

## Review Gates / Checkpoints

- After step 1 — confirm task breakdown with tech lead (avoids rework).
- After step 6 — developer self-review before PR open.

## Composed Skills

- `/break-down-stories`
- `/scaffold-project` *(conditional)*
- `/generate-unit-tests`
- `/scan-security`
- `/review-code`
- `/prepare-pull-request`
- `/track-project`

## Context

Check `~/.ai-sdlc/profile.yaml` for defaults:

- `defaults.jira.project` — source project for the story
- `defaults.github.repo` — target repo for the PR
- `defaults.context7.stack` — framework references for scaffolding and tests
- `teams.<name>.prTemplate` — PR description template override

## Progress Memory

Final step — update `progress.yaml`:

```yaml
phases:
  04-dev:
    develop-feature:
      story: <JIRA-123>
      completed_at: <ISO-8601>
      pr: <github-url>
      artifacts: [src/**, tests/**]
```
