# Preset — Nuxt (Vue)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `nuxt` in `package.json` `dependencies` and a `nuxt.config.ts` at the repo
  root (Nuxt 3+; Vue 3 + Vite + the **Nitro** server engine under the hood).
- An `app.vue` entrypoint; file-based routing under `pages/` (with `[id].vue`
  dynamic segments and `[...slug].vue` catch-alls) and `layouts/`.
- Server layer under `server/`: `server/api/*` (Nitro route handlers, e.g.
  `server/api/users.get.ts`), `server/routes/`, `server/middleware/`,
  `server/utils/`.
- Auto-imported `composables/`, `components/`, `utils/`, and `stores/` (Pinia
  via `@pinia/nuxt`); `plugins/`, `middleware/` (route middleware),
  `assets/`/`public/`.
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm. **Infer from the lockfile present.**

## What to look for in recon

- The **real** `package.json` scripts: `dev`, `build` (`nuxt build`),
  `generate` (`nuxt generate`, for static), `preview`, `typecheck`
  (`nuxi typecheck` / `nuxt typecheck`), `lint` (`eslint`, often via
  `@nuxt/eslint`), and the test command. Capture them verbatim.
- Test convention: **Vitest** with **`@nuxt/test-utils`** (the official Nuxt
  test harness — `defineVitestConfig`, `mountSuspended`, `setup` for e2e). Note
  `*.test.ts`/`*.spec.ts` naming, and whether component vs Nuxt-runtime tests
  are split.
- Rendering mode in `nuxt.config.ts`: universal SSR (default), SSG
  (`nuxt generate` / `nitro.prerender`), SPA (`ssr: false`), or hybrid
  per-route `routeRules` — this shapes `PERFORMANCE.md` and the deploy target.
- Data fetching (`useFetch`, `useAsyncData`, `$fetch`), `runtimeConfig` and
  where **secrets** live (server-only `runtimeConfig` vs `public`, `.env`,
  `NUXT_*` env vars — the boundary matters).
- Modules enabled in `nuxt.config.ts` (`@nuxt/content`, `@pinia/nuxt`,
  `@nuxtjs/i18n`, etc.) — they add conventions and directories.

## Stack-specific skills/agents/commands to generate

- Skills: `page`/`route` (`pages/*.vue` + `definePageMeta` + data fetching),
  `server-route` (`server/api/*` Nitro handler + test), `composable`
  (auto-imported composition fn), `component` (auto-imported SFC + test),
  optionally `store-module` (Pinia) and `route-middleware`.
- Agents: baseline + a `frontend-reviewer` persona aware of auto-imports, the
  server-vs-client boundary, and the `runtimeConfig` public/private split.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — pages/layouts routing, the Nitro `server/api` layer,
  composables and auto-imports, data fetching, rendering mode and `routeRules`.
- `STANDARDS.md` — SFC + Composition API conventions, auto-import expectations,
  composable naming (`useX`), props/events typing.
- `TESTING_GUIDE.md` — Vitest + `@nuxt/test-utils` patterns (`mountSuspended`,
  runtime vs e2e setup), the real `*.test.ts`/`*.spec.ts` pattern, coverage
  target.
- `PERFORMANCE.md` — SSR vs SSG vs hybrid, payload/hydration cost, the deploy
  preset/target, asset budgets.

## Typical validation command (FIND the real one)

Commonly `pnpm run lint && pnpm run typecheck && pnpm test && pnpm run build`
(or npm/yarn), where typecheck is `nuxi typecheck` and build is `nuxt build`.
**Do not assume the package manager or script names** — read `package.json`,
`nuxt.config.ts`, and CI, and capture the exact commands.
