# Preset — Next.js (React)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `next` and `react` in `package.json` `dependencies`, plus a
  `next.config.js` / `next.config.mjs` / `next.config.ts` at the repo root.
- **Router detection (decisive):** an `app/` directory → **App Router**
  (Server Components by default, `'use client'` for Client Components, nested
  `layout.tsx`/`page.tsx`, `route.ts` route handlers, server actions); a
  `pages/` directory → **Pages Router** (`pages/_app`, `getServerSideProps`/
  `getStaticProps`, `pages/api/*` API routes). Some repos run **both** during a
  migration — note it.
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm. **Infer from the lockfile present.**
- Layout: `src/` or root-level `app/`/`pages/`, `components/`, `lib/`,
  `public/`; TypeScript via `tsconfig.json`; styling via Tailwind, CSS Modules,
  or styled-components.

## What to look for in recon

- The **real** `package.json` scripts: `dev`, `build` (`next build`),
  `start`, `lint` (`next lint` / `eslint`), and the test command. Capture them
  verbatim.
- Lint config: `eslint-config-next` with `next/core-web-vitals` (the canonical
  Next ESLint preset). Confirm whether it's `next lint` or a direct `eslint`
  invocation, and whether Biome is used instead.
- Test convention: unit/component via **Jest** (`jest.config`) or **Vitest**
  (`vitest.config`) with Testing Library; end-to-end via **Playwright**
  (`playwright.config.ts`) or **Cypress** (`cypress/`). Note `*.test.tsx` /
  `*.spec.tsx` naming and where tests live.
- Data layer: server actions, route handlers (`app/**/route.ts`), or
  `pages/api/*`; where env/config and secrets live (`.env.local`,
  `NEXT_PUBLIC_*` vs server-only vars — the boundary matters).
- Rendering strategy (static/SSG, SSR, ISR, streaming) — it shapes
  `PERFORMANCE.md`.

## Stack-specific skills/agents/commands to generate

- Skills (App Router): `page`/`route` (segment `page.tsx` + `layout.tsx`),
  `server-component`, `client-component`, `route-handler` (`route.ts` +
  test), `server-action`. Skills (Pages Router): `page` (`pages/*` +
  data-fetching fn), `api-route` (`pages/api/*` + test), `component`.
- Agents: baseline + a `frontend-reviewer` persona aware of the Server vs
  Client Component boundary, the `NEXT_PUBLIC_*` env boundary, and Core Web
  Vitals.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — router model (App vs Pages), Server/Client Component
  split, data fetching (server actions / route handlers / `getServerSideProps`),
  rendering/caching strategy.
- `STANDARDS.md` — component conventions, the `'use client'` boundary,
  props/typing, file-colocation rules.
- `TESTING_GUIDE.md` — Jest/Vitest + Testing Library patterns, Playwright/
  Cypress e2e flow, the real `*.test.tsx`/`*.spec.tsx` pattern, coverage target.
- `PERFORMANCE.md` — rendering strategy, bundle/Core Web Vitals budgets,
  `next/image` and font optimization.

## Typical validation command (FIND the real one)

Commonly `pnpm run lint && pnpm test && pnpm run build` (or npm/yarn), with
`next build` as the build gate and a separate e2e job. **Do not assume the
package manager, the router, or script names** — read `package.json`, the
config files, and CI, and capture the exact commands.
