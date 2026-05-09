---
name: create-readme
description: >
  Design and generate a polished, badge-rich README.md for a code repository
  using the QE-Automation Voyage Data style. Produces a single README with
  a hero header, status/tech badges, a Quick Links table (CI, reports, docs,
  Jira, SharePoint, Confluence), a test-layer breakdown, prerequisites,
  Quick Start / Run / Report / Docs sections, a Published Reports table for
  GitHub Pages, a CI/CD Workflows table, and an email-recipients note.
argument-hint: "[repo path | brief description of project, frameworks, CI pattern]"
---

# Create README

## When to Use

- Standing up a new automation / API / service repository that needs a
  professional README from day one.
- Refreshing a stale, sparse, or inconsistent README for an existing repo.
- Aligning the look-and-feel of multiple sibling repos onto one common
  pattern (e.g. all `voyage-data-*` or `mdm-core-*` repos).

## Source of Truth (Reference README)

Modeled on the live README of `QE-Automation-voyage-data-automation`
(Kotlin 2.1, JUnit 5, RestAssured, Allure, GitHub Actions, GitHub Pages).
Full reference markdown is in
[`templates/README.template.md`](templates/README.template.md).

## Inputs to Gather First

Before writing anything, collect (or infer from the repo):

1. **Project name** + one-line tagline.
2. **Tech stack** — language, build tool, test framework, reporting tool,
   JDK / runtime versions.
3. **GitHub org / repo slug** — used in badge URLs and Pages URLs.
4. **Default branch** — for badge `?branch=` query (use `main` unless told
   otherwise).
5. **CI workflow filenames** — at minimum a manual + a scheduled workflow,
   plus a docs publish workflow if one exists.
6. **Test layers / tags** — JUnit `@Tag` values or equivalent grouping
   (e.g. `schema`, `functional`, `smoke`, `regression`).
7. **Test classes** — one anchor class per layer with workspace-relative
   paths.
8. **Schedule** — cron expression, plus EST/EDT translation.
9. **Email recipients** — daily list, weekly add-ons.
10. **External resources** — Jira project URL, Confluence page, Postman
    collection path, SharePoint folder, API spec doc path.
11. **GitHub Pages base URL** — confirm `<org>.github.io/<repo>/` vs an
    Enterprise Pages host.

If any input is missing, ask once at the start with a short numbered list.
Do **not** fabricate URLs.

## Instructions

1. Read [`templates/README.template.md`](templates/README.template.md) and
   the existing `README.md` if present.
2. Detect the actual stack from `pom.xml` / `package.json` /
   `build.gradle*` / `pyproject.toml`. Pull versions from there — never
   guess.
3. Detect CI workflow filenames by listing `.github/workflows/`.
4. Fill the template in this order:
   - **Hero**: emoji + project name, one-line description with bolded
     stack.
   - **Badges**: 3 workflow badges (Scheduled, Manual, Docs) using
     `img.shields.io/github/actions/workflow/status` pinned to the default
     branch — followed by language, runtime, test framework, reporting,
     and an internal-license badge.
   - **🔗 Quick Links table** — most important; reports first, then docs,
     then external systems, then operational info (run trigger, schedule,
     recipients).
   - **Test Layers** table: `Tag | Class link | Purpose`.
   - **Prerequisites** table.
   - **Quick Start / Run Tests / Report / Docs** code blocks — always use
     the wrapper script (`./mvnw`, `./gradlew`, `npm`, `poetry run`).
   - **Published Reports (GitHub Pages)** table with concrete URLs.
   - **CI/CD Workflows** table linking each workflow file.
   - **Email recipients** line.
   - **Resources** table (slimmer copy of Quick Links at the bottom).
   - Footer team credit.
5. Validate all relative links resolve to files that exist; flag broken
   ones to the user instead of silently dropping them.
6. Output the final `README.md` and present a short diff summary. Do not
   commit unless explicitly asked.

## Style Rules

- Emoji sparingly but consistently — one per row in tables, one per major
  heading.
- Tables over bullet lists for any 3+ key/value pairs.
- Workflow badges always pinned to the default branch with `?branch=`.
- All shell snippets use the wrapper script — not bare `mvn` / `gradle` /
  `python`.
- Pages URLs use `https://<org>.github.io/<repo>/<path>/` form; include
  the Enterprise note from the template if applicable.
- Never include private email addresses unless the user has named them
  in this conversation.
- Do **not** invent URLs (Jira, Confluence, SharePoint).

## Templates

- [`templates/README.template.md`](templates/README.template.md) — the
  reference README with placeholders.

## Anti-Patterns to Avoid

- Bare `mvn` / `gradle` commands (breaks on runners without system
  installs).
- `<org>/<repo>` placeholders left in the published file.
- Workflow badges without a `?branch=` query (renders blank when the file
  isn't on the default branch yet).
- A single huge "Resources" list with 15 bullets — split into Quick Links
  (top, curated) and Resources (bottom, complete).
- Documenting features that don't exist yet ("aspirational README").
