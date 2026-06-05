# Preset — Vue + Vite (TypeScript)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `vite.config.ts`/`vite.config.js` and `vue` in `package.json` `dependencies`
  (Vue 3 → `vue@^3`, Composition API, `<script setup>`).
- `@vitejs/plugin-vue`, `vue-tsc`, `vue-router`, `pinia` (stores) in deps.
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm. **Infer from the lockfile present.**
- Layout: `src/` with `components/`, `views/`/`pages/`, `stores/`,
  `composables/`, `router/`; possibly Storybook (`.storybook/`, `*.stories.ts`).

> If `react` is in deps instead of `vue`, this is a React+Vite repo — reuse the
> same reasoning but generate React-shaped skills (`component`, `hook`, `route`).

## What to look for in recon

- The **real** `package.json` scripts: the lint script (often `eslint:check`),
  the type-check (`vue-tsc --noEmit` / a `type:check` script), the test command
  (`vitest` / `jest`), and `build`. Capture them verbatim.
- Test convention: `*.test.ts` or `*.spec.ts`; vitest vs jest; component testing
  via `@vue/test-utils` / Testing Library.
- Whether Storybook is used (drives a `storybook-story` skill and a component-doc
  emphasis).
- Where API clients / env config live; the auth/token handling on the client.

## Stack-specific skills/agents/commands to generate

- Skills: `component` (SFC + test + optional story), `store-module` (Pinia
  store), `composable` (reusable composition fn), `view`/`route` (page + router
  entry), `storybook-story` if Storybook is present.
- Agents: baseline + a `component-author` / `frontend-reviewer` persona aware of
  the UI-vs-business component split and accessibility.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — views/components/stores/composables structure, router,
  state management, API layer.
- `STANDARDS.md` — SFC conventions, props/events typing, component boundaries,
  the UI-vs-business split.
- `TESTING_GUIDE.md` — vitest/jest patterns, `@vue/test-utils` mounting/mocking,
  the real `*.spec.ts`/`*.test.ts` pattern, coverage target.
- Per-module docs: per feature folder under `src/` (and a component-library doc
  if Storybook is used).

## Typical validation command (FIND the real one)

Commonly `pnpm run eslint:check && pnpm run type:check && pnpm test` or a
combined script. **Do not assume the package manager or script names** — read
`package.json` and CI and capture the exact commands.
