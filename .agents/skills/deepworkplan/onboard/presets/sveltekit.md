# Preset — SvelteKit

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `@sveltejs/kit` and `svelte` in `package.json`, a `svelte.config.js`, and a
  `vite.config.js`/`vite.config.ts` (SvelteKit is Vite-based).
- File-based routing under `src/routes/`: `+page.svelte` (UI), `+page.ts`
  (universal `load`), `+page.server.ts` (server `load` + form `actions`),
  `+layout.svelte`/`+layout.ts`, and `+server.ts` (standalone API endpoints with
  `GET`/`POST`/… handlers).
- `src/lib/` (the `$lib` alias), `src/app.html`, `src/hooks.server.ts` /
  `src/hooks.client.ts`, and `src/app.d.ts` (the `App` namespace types).
- The configured **adapter** in `svelte.config.js`: `adapter-auto`,
  `adapter-node`, `adapter-static`, `adapter-cloudflare`, `adapter-vercel` —
  it decides SSR vs prerender and the deploy target.
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm. **Infer from the lockfile present.**

## What to look for in recon

- The **real** `package.json` scripts: `dev`, `build` (`vite build`),
  `preview`, `check` (`svelte-kit sync && svelte-check`), `lint` (`eslint` +
  often `prettier --check`), and the test command. Capture them verbatim.
- Type-checking is `svelte-check` (not bare `tsc`) — it understands `.svelte`
  files; the script is usually `check` / `check:watch`.
- Test convention: unit/component via **Vitest** (`vitest.config` /
  `vite.config` test block) with `@testing-library/svelte`; end-to-end via
  **Playwright** (`playwright.config.ts`, `tests/`). Note `*.test.ts` /
  `*.spec.ts` naming.
- The `load`/`actions` model: which routes use server vs universal loads, form
  actions, and `+server.ts` endpoints; where env/secrets live (`$env/static/*`,
  `$env/dynamic/*`, `.env`).
- Svelte version (4 vs 5 runes) — it changes component/reactivity conventions.

## Stack-specific skills/agents/commands to generate

- Skills: `route` (`+page.svelte` + `load` + optional `+page.server.ts`
  actions), `endpoint` (`+server.ts` with typed request handlers + test),
  `component` (`$lib` component + test), `load-function` (server/universal load
  + invalidation), optionally `form-action`.
- Agents: baseline + a `frontend-reviewer` persona aware of the server-vs-
  universal `load` boundary, progressive enhancement, and the adapter's SSR/
  prerender constraints.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — routing tree, `load` model (server vs universal), form
  actions, `+server.ts` endpoints, hooks, the adapter and SSR/prerender story.
- `STANDARDS.md` — component conventions, `$lib` boundaries, Svelte 4 vs 5
  (runes) idioms, props/typing.
- `TESTING_GUIDE.md` — Vitest + `@testing-library/svelte` patterns, Playwright
  e2e flow, the real `*.test.ts`/`*.spec.ts` pattern, plus `svelte-check` as a
  gate.
- `PERFORMANCE.md` — prerender vs SSR per route, the adapter target, asset/
  bundle budgets.

## Typical validation command (FIND the real one)

Commonly `pnpm run lint && pnpm run check && pnpm test && pnpm run build`
(or npm/yarn), where `check` is `svelte-check` and `build` is `vite build`.
**Do not assume the package manager or script names** — read `package.json`,
`svelte.config.js`, and CI, and capture the exact commands.
