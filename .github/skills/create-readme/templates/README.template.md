# 🚢 {{PROJECT_NAME}}

{{ONE_LINE_TAGLINE}} — {{LANG}} {{LANG_VERSION}}, {{TEST_FRAMEWORK}}, {{HTTP_LIB}}, {{REPORTING_TOOL}}.

[![Scheduled](https://img.shields.io/github/actions/workflow/status/{{ORG}}/{{REPO}}/{{SCHEDULED_WORKFLOW_FILE}}?branch={{DEFAULT_BRANCH}}&label=Scheduled&logo=githubactions&logoColor=white)](https://github.com/{{ORG}}/{{REPO}}/actions/workflows/{{SCHEDULED_WORKFLOW_FILE}})
[![Manual](https://img.shields.io/github/actions/workflow/status/{{ORG}}/{{REPO}}/{{MANUAL_WORKFLOW_FILE}}?branch={{DEFAULT_BRANCH}}&label=Manual&logo=githubactions&logoColor=white)](https://github.com/{{ORG}}/{{REPO}}/actions/workflows/{{MANUAL_WORKFLOW_FILE}})
[![Docs](https://img.shields.io/github/actions/workflow/status/{{ORG}}/{{REPO}}/{{DOCS_WORKFLOW_FILE}}?branch={{DEFAULT_BRANCH}}&label=KDoc&logo=readthedocs&logoColor=white)](https://github.com/{{ORG}}/{{REPO}}/actions/workflows/{{DOCS_WORKFLOW_FILE}})
[![{{LANG}}](https://img.shields.io/badge/{{LANG}}-{{LANG_VERSION}}-7F52FF?logo={{LANG_LOGO}}&logoColor=white)]({{LANG_URL}})
[![Java](https://img.shields.io/badge/Java-{{JDK_VERSION}}-007396?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![JUnit5](https://img.shields.io/badge/JUnit-5-25A162?logo=junit5&logoColor=white)](https://junit.org/junit5/)
[![Allure](https://img.shields.io/badge/Allure-{{REPORTING_VERSION}}-FF6E00?logo=qase&logoColor=white)](https://allurereport.org/)
[![License](https://img.shields.io/badge/Internal-{{COMPANY}}-003366)](#)

## 🔗 Quick Links

| Resource | Link |
|---|---|
| 📊 Latest **Scheduled** Allure Report | [scheduled/](https://{{ORG}}.github.io/{{REPO}}/scheduled/) |
| 🧪 Latest **Manual** Allure Report | [manual/](https://{{ORG}}.github.io/{{REPO}}/manual/) |
| 📚 KDoc (Kotlin API docs) | [kdoc/](https://{{ORG}}.github.io/{{REPO}}/kdoc/) |
| 📘 API Reference | [API_DOCUMENT.md]({{API_DOC_PATH}}) |
| 🧰 Postman Collection | [collection/]({{POSTMAN_PATH}}) |
| 🤝 Contributing Guide | [CONTRIBUTING.md](CONTRIBUTING.md) |
| 🧭 Jira Board | [{{JIRA_PROJECT_KEY}}]({{JIRA_URL}}) |
| 🗂️ SharePoint ({{SHAREPOINT_LABEL}}) | [{{SHAREPOINT_DISPLAY}}]({{SHAREPOINT_URL}}) |
| ⚙️ Allure Setup | [Confluence]({{CONFLUENCE_URL}}) |
| ▶️ Run Manual Tests | [Actions ▸ Manual](https://github.com/{{ORG}}/{{REPO}}/actions/workflows/{{MANUAL_WORKFLOW_FILE}}) |
| 🕐 Scheduled Run | Daily at **{{CRON_HUMAN_UTC}}** ({{CRON_HUMAN_EST}}) |
| ✉️ Email Recipients | `{{DAILY_RECIPIENT}}` (daily) · `{{WEEKLY_RECIPIENT}}` (Mondays) |

## Test Layers

| Tag | Class | Purpose |
|-----|-------|---------|
| `{{TAG_1}}` | [{{CLASS_1}}]({{CLASS_1_PATH}}) | {{PURPOSE_1}} |
| `{{TAG_2}}` | [{{CLASS_2}}]({{CLASS_2_PATH}}) | {{PURPOSE_2}} |

Both classes run their {{STEP_COUNT}} steps in strict order via `@TestMethodOrder(OrderAnnotation::class)`.

## Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | {{JDK_VERSION}}+ |
| Maven | 3.9+ (or use bundled `mvnw`) |
| Allure CLI | {{REPORTING_VERSION}}+ (optional, for local reports) |

## Quick Start

```bash
git clone <repository-url>
cd {{REPO}}
./mvnw clean install -DskipTests
```

## Run Tests

```bash
# All tests ({{TAG_1}} + {{TAG_2}})
./mvnw clean test -Dgroups={{TAG_1}},{{TAG_2}}

# {{TAG_1}} layer only
./mvnw clean test -Dgroups={{TAG_1}}

# {{TAG_2}} layer only
./mvnw clean test -Dgroups={{TAG_2}}

# Single test class
./mvnw test -Dtest={{CLASS_1}}
./mvnw test -Dtest={{CLASS_2}}
```

## Allure Report

```bash
# After a test run
allure serve ./target/allure-results
```

## KDoc (Kotlin API Docs)

```bash
# Generate KDoc HTML into target/dokka
./mvnw dokka:dokka -DskipTests

# Open locally
start target/dokka/index.html        # Windows
open  target/dokka/index.html        # macOS
```

KDoc is auto-published to GitHub Pages by
[{{DOCS_WORKFLOW_FILE}}](.github/workflows/{{DOCS_WORKFLOW_FILE}}) on every push to `{{DEFAULT_BRANCH}}`.

## Published Reports (GitHub Pages)

All reports live on the `gh-pages` branch and are served at:

| Report | URL |
|--------|-----|
| KDoc (API docs) | https://{{ORG}}.github.io/{{REPO}}/kdoc/ |
| Latest scheduled run | https://{{ORG}}.github.io/{{REPO}}/scheduled/ |
| Latest manual run | https://{{ORG}}.github.io/{{REPO}}/manual/ |

> If the repo is on GitHub Enterprise (not github.com), substitute the host accordingly (e.g. `https://pages.github.<enterprise>/{{ORG}}/{{REPO}}/...`).

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [{{MANUAL_WORKFLOW_FILE}}](.github/workflows/{{MANUAL_WORKFLOW_FILE}}) | `workflow_dispatch` | On-demand run; choose `all` / `{{TAG_1}}` / `{{TAG_2}}` + threads |
| [{{SCHEDULED_WORKFLOW_FILE}}](.github/workflows/{{SCHEDULED_WORKFLOW_FILE}}) | Daily {{CRON_HUMAN_UTC}} | Full suite, Allure published to GitHub Pages, email report |
| [{{DOCS_WORKFLOW_FILE}}](.github/workflows/{{DOCS_WORKFLOW_FILE}}) | Push to `{{DEFAULT_BRANCH}}` / manual | Generate KDoc and publish to `gh-pages/kdoc/` |

Email recipients: `{{DAILY_RECIPIENT}}`, `{{WEEKLY_RECIPIENT}}`.

## Resources

| Resource | Link |
|----------|------|
| API Reference | [API_DOCUMENT.md]({{API_DOC_PATH}}) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Postman Collection | [collection/]({{POSTMAN_PATH}}) |
| Jira Board | [{{JIRA_PROJECT_KEY}}]({{JIRA_URL}}) |
| Allure Setup | [Confluence]({{CONFLUENCE_URL}}) |

---
**{{TEAM_NAME}}**
