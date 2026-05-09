---
name: generate-ui-components
description: >
  Scaffold production-ready React, Angular, or Vue components with prop types /
  interfaces, Storybook stories, and unit tests. Uses Context7 for
  framework-specific patterns and the project's existing style tokens.
argument-hint: "[component name or feature area]"
---

# Generate UI Components

## When to Use

- Scaffolding new UI components after wireframe / prototype sign-off
- Adding Storybook stories to undocumented existing components
- Generating test stubs for a component library
- Producing component skeletons for a design handoff

## Instructions

1. Confirm the UI framework (React / Angular / Vue) and version.
2. Use Context7 to fetch current framework docs / best practices before generating.
3. Read [`references/component-patterns.md`](references/component-patterns.md) for the agreed patterns and conventions for this stack.
4. For each component:
   - **React** — functional component with TypeScript props interface, `React.FC` or explicit return type, `forwardRef` where appropriate.
   - **Angular** — standalone component with `@Input()` / `@Output()` typings, `ChangeDetectionStrategy.OnPush` by default.
   - **Vue 3** — Composition API with `<script setup lang="ts">`, `defineProps`, `defineEmits`, `defineExpose`.
5. Apply design tokens from the style guide (CSS custom properties or Tailwind classes) — no hard-coded colors or spacing.
6. Generate a Storybook story file (`.stories.tsx` / `.stories.ts`): default story, all significant prop variants, one accessibility story.
7. Generate a unit test file (Vitest / Jest + Testing Library): renders without error, key interactions, prop variants, and one accessibility assertion (`toHaveAccessibleName`, `toHaveRole`).
8. Apply standard accessibility attributes: `aria-label`, `role`, `aria-expanded`, `aria-live` as appropriate to component type.

## References

- [`references/component-patterns.md`](references/component-patterns.md) — framework-specific scaffold patterns and conventions

## Guidelines

- No `any` in TypeScript props — define explicit interfaces.
- No inline styles — use tokens or utility classes.
- Every interactive component must have a keyboard-accessible interaction path.
- Stories drive documentation: name them for the state they show, not the prop they test.
- Unit tests use the public API (props, events) — not implementation details (internal state, refs).
- Keep components focused: one responsibility, one reason to change.

## Context

Check `~/.ai-sdlc/profile.yaml` for defaults:

- `teams.<name>.uiFramework` — React / Angular / Vue and version
- `teams.<name>.testFramework` — Vitest / Jest + Testing Library combination
- `teams.<name>.brand` — style guide / token file to reference
- `defaults.a11y.wcag_level` — accessibility target (AA default)
