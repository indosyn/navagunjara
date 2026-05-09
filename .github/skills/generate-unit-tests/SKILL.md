---
name: generate-unit-tests
description: >
  Generate Jest unit tests for a given module, class, or function.
  Focuses on edge cases, boundary conditions, and coverage gaps.
  Tailored for this repo's Node.js ESM modules and React components.
argument-hint: "[file path or module name]"
---

# Generate Unit Tests

## When to Use

- Adding tests for a new `src/*.js` module (report generator, email sender, etc.)
- Extending test coverage for an existing module after changes
- Adding component tests for new React components in `src/client/components/`
- Reaching coverage targets before a PR merge

## Project Test Setup

- **Framework**: Jest with `--experimental-vm-modules` (ESM support)
- **Config**: `jest.config.js`
- **Test location**: `tests/*.test.js` for Node modules, co-located `*.test.jsx` for React
- **Coverage output**: `docs/coverage/`
- **Run**: `npm test` / `npm run test:coverage`

## Instructions

1. Read the target file fully before writing any tests.
2. Identify all exported functions/classes and their signatures.
3. For each function, generate tests covering:
   - **Happy path** — normal valid inputs
   - **Edge cases** — empty arrays, zero, null, undefined, empty strings
   - **Error paths** — invalid inputs, network failures (mock with `jest.fn()`)
   - **Boundary conditions** — min/max values, off-by-one
4. For Node.js modules (`src/*.js`):
   - Use `jest.mock()` for external dependencies (`@octokit/rest`, `nodemailer`, `fs`)
   - Use `jest.spyOn()` to assert side effects without real I/O
   - Restore mocks with `afterEach(() => jest.restoreAllMocks())`
5. For React components (`src/client/components/`):
   - Use `@testing-library/react` with `render`, `screen`, `fireEvent`
   - Test: renders without error, key props render correctly, interactions trigger callbacks
6. Follow the existing test style in `tests/` — describe blocks, clear `it()` descriptions.
7. Run `npm test` to confirm all new tests pass before finishing.

## Coverage Targets

- New modules: ≥ 90% line coverage
- Existing modules being extended: do not regress current coverage

## Key Mocking Patterns (this repo)

```js
// Mock Octokit
jest.mock('@octokit/rest', () => ({ Octokit: jest.fn(() => ({ rest: { actions: { listWorkflowRuns: jest.fn() } } })) }))

// Mock fs
jest.mock('fs', () => ({ readFileSync: jest.fn(), writeFileSync: jest.fn(), existsSync: jest.fn() }))

// Mock nodemailer
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }) })) }))
```
