# Preset — Astro (+ Svelte) site

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `astro.config.mjs`/`astro.config.ts` and `astro` in `package.json` deps.
- UI integration islands: `@astrojs/svelte` + `.svelte` files (or
  `@astrojs/react`/`@astrojs/vue` — adapt the island-component skill to whichever
  is present). Tailwind via `@astrojs/tailwind`.
- Content collections: a `src/content/` folder with a `config.ts` defining
  collections (blog, docs); MDX via `@astrojs/mdx`.
- Layout: `src/pages/` (file-based routing), `src/components/`, `src/layouts/`,
  `src/content/`, `public/`.
- Package manager from the lockfile (pnpm/yarn/npm) — infer from what's present.

## What to look for in recon

- The **real** scripts: `astro check` (type/diagnostics), the lint/format gate
  (frequently **Biome** — `biome:check` — rather than ESLint+Prettier; confirm),
  `build` (`astro build`), `dev`/`preview`.
- Whether tests exist at all (static sites often have few/none — note it and
  treat `astro check` + `build` as the validation gate). Playwright for E2E if
  present.
- Content collections + their schemas (drives `content`/`blog` skills and a
  content-collection-aware doc emphasis).
- Deployment: static output vs SSR adapter (Vercel/Netlify/node) — informs
  `ARCHITECTURE.md` and `PERFORMANCE.md`.

## Stack-specific skills/agents/commands to generate

- Skills: `content`/`blog` (add a content-collection entry per its schema),
  `component` (Astro or island component), `collection` (define a new content
  collection), `page`/`route`.
- Agents: baseline + a `content-author` / `frontend-reviewer` persona aware of
  content-collection schemas and SEO/performance.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — file-based routing, content collections + schemas, island
  architecture, static-vs-SSR output, the asset pipeline.
- `PERFORMANCE.md` — important for a marketing/static site: bundle size, image
  optimization, Lighthouse/Core Web Vitals budgets.
- `STANDARDS.md` — content frontmatter conventions, component boundaries,
  Tailwind usage.
- Per-module docs: per content collection and per major component area.

## Typical validation command (FIND the real one)

Often `pnpm run astro check && pnpm run build`, sometimes preceded by a Biome
gate `pnpm run biome:check`. **Do not assume** — read `package.json`/CI and
capture the exact commands.
