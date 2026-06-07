# Technologies

A complete inventory of every tool, library, and configuration shipped with Universal Emoji Parser, with **versions, role, and where it's wired**. Every version is pinned in [`package.json`](../package.json) — bump there and through `package-lock.json`, never through unpinned ranges.

## Languages and runtimes

| Tool       | Version                        | Role                                                                                                   |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| TypeScript | **6.0.3**                      | Source language; compiled by Vite/esbuild at bundle time and by `tsc` for `.d.ts` (`build:types`)      |
| Node.js    | **≥ 22.0.0** (`engines.node`) | Runtime for tests, build, CI; CI and the dev container use **Node 24**                                 |
| Vite       | **8.0.16**                     | Production bundler — **library mode**, single-entry, CommonJS output, esbuild minify                   |
| Vitest     | **4.x**                        | Test runner — runs `.ts` specs directly (ESM-native, esbuild-powered, no separate compile step)        |
| Biome      | **2.4.16**                     | Single tool for both lint and format — one config (`biome.json`)                                       |
| tsx        | **4.22.4**                     | Runs `.ts` entrypoints directly (`npm run dev`, ad-hoc repro snippets)                                 |
| nodemon    | **3.1.14**                     | Watcher behind `npm run dev` (`nodemon --exec tsx`)                                                    |
| npm        | (Node-bundled)                 | Package manager — `package-lock.json` is excluded by `.gitignore` (CI relies on cached `node_modules`) |

## Runtime dependencies

The package has **zero runtime dependencies**. `package.json` declares no `dependencies` block at all.

`@twemoji/parser` (the emoji-entity finder + CDN URL producer) is **inlined into the bundle** at build time by Vite, so it ships as part of `dist/index.js` rather than as a transitive install. It therefore lives in `devDependencies` (pinned to **17.0.1** — see [Pinned exclusions](#pinned-exclusions)), not in `dependencies`.

| Library           | Version    | Role                                                                              |
| ----------------- | ---------- | -------------------------------------------------------------------------------- |
| `@twemoji/parser` | **17.0.1** | Finds emoji entities in text and produces Twemoji CDN URLs. **Inlined** by Vite — no runtime dep |

Keep it this way. Adding a real runtime dependency (or marking one `external` so it stops being inlined) is a major decision — every byte ships to consumer bundles, and zero-runtime-deps is a headline property of this package. If a feature can be implemented without a new dep, do that.

## Build/test/dev dependencies

These are `devDependencies` — never published to npm consumers.

### Source generation

| Library              | Version   | Role                                                                                                    |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `emojilib`           | **4.0.3** | Source of curated keyword arrays (e.g., `cool`, `summer` for 😎). Used **only** by the regenerator test |
| `unicode-emoji-json` | **0.9.0** | Source of canonical metadata (slug, group, version, char). Used **only** by the regenerator test        |

Neither is imported by `src/index.ts`. They are merged into `src/lib/emoji-lib.json` once at regeneration time. See [Architecture → The regeneration pipeline](ARCHITECTURE.md#the-regeneration-pipeline).

### TypeScript / type definitions

| Library        | Version     | Role                                                            |
| -------------- | ----------- | --------------------------------------------------------------- |
| `@types/node` | **25.9.2** | Node types — used to type `fs` in the regenerator |

### Linting / formatting

| Library          | Version     | Role                                                              |
| ---------------- | ----------- | ---------------------------------------------------------------- |
| `@biomejs/biome` | **2.4.16**  | Single tool for lint **and** format                              |

Biome is configured by one file, `biome.json`, and covers both lint and format in a single fast pass.

### Bundler

| Library | Version    | Role                                                                  |
| ------- | ---------- | -------------------------------------------------------------------- |
| `vite`  | **8.0.16** | Library-mode bundler — single entry, CommonJS output, esbuild minify |

Vite compiles `src/index.ts` via esbuild and inlines `@twemoji/parser`. Vite empties `dist/` on each build (no extra plugins needed). `.d.ts` files are emitted separately by `tsc` (`build:types`).

### Testing

| Library  | Version  | Role                                                                          |
| -------- | -------- | ---------------------------------------------------------------------------- |
| `vitest` | **4.x**  | Test runner — runs `.ts` specs directly (ESM-native, esbuild, no compile step) |

Specs import `{ describe, it, expect } from 'vitest'` and use the `expect().toBe()` / `.toEqual()` family. The runner is configured by `vitest.config.ts`.

### Maintenance

| Library             | Version    | Role                                                 |
| ------------------- | ---------- | ---------------------------------------------------- |
| `npm-check-updates` | **22.1.0** | `ncu:check` / `ncu:upgrade` — dep upgrade automation |

## `.ncurc.json` (npm-check-updates)

```json
{
  "upgrade": true,
  "reject": ["@twemoji/parser"]
}
```

### Pinned exclusions

`@twemoji/parser` is pinned to **17.0.1** via the `reject` list. Version **17.0.2 regressed U+FE0F (variation selector) handling**, breaking emoji that depend on the VS-16 modifier. Until upstream fixes it, `ncu:upgrade` must not bump this package — lifting the pin requires verifying every VS-16 case still parses.

Every other dependency tracks **latest**. Add a name to `reject` only when an upgrade needs deliberate follow-up work (breaking migrations, ecosystem lag, upstream regressions like this one).

## Configuration files

| File                  | Purpose                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`        | Scripts, deps, engines, version, repository metadata                                                                                              |
| `tsconfig.json`       | TS compiler config — strict, includes `src/**/*` and `test/**/*`                                                                                  |
| `tsconfig.build.json` | `tsc -p ... --emitDeclarationOnly` (and `--noEmit` for `build:tsc`): emit declarations from `src/` only (`rootDir: ./src`)                          |
| `vite.config.ts`      | Bundler — library mode, CommonJS output, esbuild minify; inlines `@twemoji/parser`, empties `dist/` on build                                       |
| `vitest.config.ts`    | Test runner config — discovers `test/**/*.test.ts`, ESM-native                                                                                     |
| `biome.json`          | Biome lint **and** format — single quotes, no semicolons, trailing comma `es5`, lineWidth 120; `noConsole` error in `src/` only; excludes `.agents/skills/deepworkplan/` from formatting |
| `.editorconfig`       | 2-space indent, LF, max 120 cols, trim trailing whitespace                                                                                        |
| `.npmignore`          | Trims `src/`, `test/`, configs, etc. from the published tarball — only `dist/`, `package.json`, `README.md`, `LICENSE` ship                        |
| `.gitignore`          | Excludes `node_modules/`, `dist/`, `.env`, `tmp/*`, `package-lock.json`, `emoji-lib-output.json`, etc.                                            |
| `.ncurc.json`         | npm-check-updates config — `reject` pins `@twemoji/parser` to 17.0.1                                                                               |

## CI/CD platform

| Tool                      | Version   | Role                                                        |
| ------------------------- | --------- | ----------------------------------------------------------- |
| GitHub Actions            | (managed) | All CI workflows                                            |
| `actions/checkout`        | v6        | Pull source on each runner                                  |
| `actions/setup-node`      | v6        | Node **24** (`.x` from supported releases)                  |
| `actions/cache`           | v5        | Cache `~/.npm`, `node_modules`, `dist`                      |
| `ncipollo/release-action` | v1        | Publish GitHub Releases (used by `release_and_publish.yml`) |

Workflows:

| File                                       | Trigger                               | Purpose                                          |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------------ |
| `code_check.yml`                           | PR opened/sync/reopen → `main`        | Biome check + test gate                           |
| `pull_request_check.yml`                   | PR opened/sync/edit → `main`          | Title/body length + size labels                  |
| `release_and_publish.yml`                  | PR merged to `main`                   | Bump version, build, npm publish, GitHub release |
| `check_packages_versions.yml`              | Cron `0 15 * * 2` (Tue 15:00 UTC)     | Open auto-PR with `ncu:upgrade` results          |
| `check_and_merge_packages_upgrades_pr.yml` | Push to upgrade branch                | Auto-merge that PR if green                      |
| `check_branches_state.yml`                 | Manual / scheduled                    | Stale branch report                              |
| `cleanup_caches.yml`                       | `repository_dispatch: cleanup_caches` | GHA cache GC                                     |

Notifications go to a DailyBot Slack-like channel via `https://api.dailybot.com/v1/send-message/` using `secrets.DAILYBOT_API_KEY` and `vars.DAILYBOT_DEPLOYMENT_NOTIFICATION_CHANNEL`.

## Dev container

`.devcontainer/devcontainer.json` points at `docker/local/docker-compose.yaml`, which builds `docker/local/uemojiparser/Dockerfile`:

- Base: **`node:24.16.0-trixie-slim`** (pinned patch on Node 24 LTS — CI uses the same exact version for deterministic builds)
- System packages: `git`, `curl`, `gh` (GitHub CLI), `chromium` (for Lighthouse audits — declared, not wired)
- AI CLIs pre-installed for `node` user: **Claude Code**, **Codex**, **Cursor**
- Persistent volumes for each AI CLI's auth/data so re-builds don't lose sessions
- Custom shell helpers (`docker/custom_commands.sh`) added to `~/.bashrc`: `check` (→ `npm run biome:check`), `fix` (→ `npm run biome:fix`), `test`, `build`, `codecheck` (biome + build + test), `install`, `claudex`, `codexx`, `cursorx` (full-permission wrappers), plus git aliases (`gs`, `ga`, `gc`, `gp`, etc.)

VS Code Dev Containers users get this out of the box. Manual users can `cd docker/local && docker compose up -d uemojiparservscode` and `docker exec -it uemojiparser bash`.

## What this package does **not** ship

Deliberately omitted to keep the bundle small and the surface narrow:

- **No DOM bindings.** This package is a pure string transformer. It returns HTML; it does not insert into `document` for you.
- **No async API.** Every method is synchronous. Adding `async` versions would double the surface for no benefit (the catalog is in-memory).
- **No additional emoji databases.** We use Twemoji exclusively. Apple/Microsoft/Google emoji styling is the consumer's CSS choice via the `class="emoji"` hook.
- **No image hosting.** The Twemoji CDN (`cdn.jsdelivr.net/gh/jdecked/twemoji@latest/...`) is the default; consumers point at their own CDN via the `emojiCDN` option.
- **No emoji picker UI.** Out of scope. Consumers wire pickers separately.
- **No emoji search / fuzzy matching.** `getEmojiObjectByShortcode` matches exactly. Search libraries (e.g., `node-emoji`) are different products.

If you find yourself wanting any of the above, either build it as a separate package that depends on this one, or fork.

## Upgrading dependencies

1. **Routine bumps:** `npm run ncu:check` shows what's available; `npm run ncu:upgrade` applies them (it skips the `@twemoji/parser` pin via `.ncurc.json`); `npm install` to refresh `node_modules`. The CI workflow `check_packages_versions.yml` does this automatically every Tuesday and opens a PR.
2. **One library at a time** when something might break (Vite majors, TypeScript majors). Multi-bumps mask the breaking change.
3. **`@twemoji/parser` is pinned to 17.0.1** — do not bump it until the 17.0.2 U+FE0F regression is resolved upstream (see [Pinned exclusions](#pinned-exclusions)). When you do lift the pin, re-run every VS-16 parsing test before merging.
4. **Major TypeScript bumps** can change `.d.ts` shape; verify consumers' projects still type-check by running `npm pack` and installing the tarball locally.
5. **Major Node bumps** are rare — only update `engines.node` when a new Node feature is needed and the dev container / CI Node line supports it (see `actions/setup-node` + `docker/local/uemojiparser/Dockerfile`).

Walk through **[`/bump-deps`](../.agents/commands/bump-deps.md)** for a structured workflow.

## Version stamp

Current package version: see `package.json` `"version"` (last seen: 2.1.7). Major version 2 was the migration to Twemoji v17. Patch versions are released automatically on every PR merge.
