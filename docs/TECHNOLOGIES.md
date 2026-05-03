# Technologies

A complete inventory of every tool, library, and configuration shipped with Universal Emoji Parser, with **versions, role, and where it's wired**. Every version is pinned in [`package.json`](../package.json) — bump there and through `package-lock.json`, never through unpinned ranges.

## Languages and runtimes

| Tool | Version | Role |
|---|---|---|
| TypeScript | **5.9.3** | Source language, compiles to JS via `ts-loader` (Webpack) or `tsc` (`build:tsc`) |
| Node.js | **≥ 20.16.0** (`engines.node`) | Runtime for tests, build, CI; CI uses **22.13.1** |
| Webpack | **5.103.0** | Production bundler, single-entry, `commonjs2` output |
| Mocha | **11.7.5** | Test runner, with `ts-node/register` so specs run as `.ts` |
| Chai | **4.4.1** | Assertion library — pinned at 4.x; see [Pinned exclusions](#pinned-exclusions) |
| ESLint | **8.57.0** | Linter — pinned at 8.x; see [Pinned exclusions](#pinned-exclusions) |
| Prettier | **3.7.4** | Formatter (also wired into ESLint via `eslint-plugin-prettier`) |
| ts-node | **10.9.2** | Lets Mocha run `.ts` files directly without a compile step |
| nodemon | **3.1.11** | Watcher behind `npm run dev` |
| npm | (Node-bundled) | Package manager — `package-lock.json` is excluded by `.gitignore` (CI relies on cached `node_modules`) |

## Runtime dependencies

The package's `dependencies` (what every consumer pulls in transitively):

| Library | Version | Role |
|---|---|---|
| `@twemoji/parser` | **17.0.1** | Finds emoji entities in text and produces Twemoji CDN URLs. The **only** runtime dep |

That's it. Adding another runtime dependency is a major decision — every byte ships to consumer bundles. If a feature can be implemented without a new dep, do that.

## Build/test/dev dependencies

These are `devDependencies` — never published to npm consumers.

### Source generation

| Library | Version | Role |
|---|---|---|
| `emojilib` | **4.0.2** | Source of curated keyword arrays (e.g., `cool`, `summer` for 😎). Used **only** by the regenerator test |
| `unicode-emoji-json` | **0.8.0** | Source of canonical metadata (slug, group, version, char). Used **only** by the regenerator test |

Neither is imported by `src/index.ts`. They are merged into `src/lib/emoji-lib.json` once at regeneration time. See [Architecture → The regeneration pipeline](ARCHITECTURE.md#the-regeneration-pipeline).

### TypeScript / type definitions

| Library | Version | Role |
|---|---|---|
| `@types/chai` | **5.2.3** | Chai 4 with type defs from `@types/chai` 5 — works because the v5 types are a superset for the surface we use |
| `@types/mocha` | **10.0.10** | Mocha types |
| `@types/node` | **24.10.2** | Node types — used to type `fs` in the regenerator |

### Linting / formatting

| Library | Version | Role |
|---|---|---|
| `@typescript-eslint/parser` | **8.49.0** | ESLint parser for TS |
| `@typescript-eslint/eslint-plugin` | **8.49.0** | TS-aware ESLint rules |
| `eslint-plugin-prettier` | **5.5.4** | Run Prettier as an ESLint rule |
| `eslint-plugin-import` | **2.32.0** | Import-order / cycle detection (declared, not yet used in `.eslintrc`) |
| `eslint-config-prettier` | **10.1.8** | Disables ESLint rules that fight Prettier |

### Webpack

| Library | Version | Role |
|---|---|---|
| `webpack` | **5.103.0** | Bundler |
| `webpack-cli` | **6.0.1** | CLI |
| `ts-loader` | **9.5.4** | Compile `.ts` during bundling |
| `clean-webpack-plugin` | **4.0.0** | Wipe `dist/` on production builds |
| `eslint-webpack-plugin` | **5.0.2** | Optional ESLint pass during build (declared, not yet wired into `webpack.config.js`) |

### Maintenance

| Library | Version | Role |
|---|---|---|
| `npm-check-updates` | **19.1.2** | `ncu:check` / `ncu:upgrade` — dep upgrade automation |

## Pinned exclusions (`.ncurc.json`)

```json
{
  "upgrade": true,
  "reject": ["chai", "eslint"]
}
```

These two are **deliberately frozen**:

- **`chai` < 5.0** — Chai 5 went ESM-only. We use `ts-node`'s CommonJS loader for tests (`require: ts-node/register`); migrating to Chai 5 means switching the test runner to ESM, which is doable but not urgent. Migration is tracked in **[`/bump-deps`](../.agents/commands/bump-deps.md)** notes.
- **`eslint` < 9.0** — ESLint 9 introduced flat config (`eslint.config.js`) and dropped support for `.eslintrc`. We can migrate, but it's an unrelated yak-shave; skip the bump.

If you want to lift either pin, that is a multi-PR effort, not part of a routine `ncu:upgrade`. Edit `.ncurc.json` only with that intent.

## Configuration files

| File | Purpose |
|---|---|
| `package.json` | Scripts, deps, engines, version, repository metadata |
| `tsconfig.json` | TS compiler config — strict, emits `.d.ts`, includes `src/**/*` |
| `webpack.config.js` | Bundler — single entry, `commonjs2`, `ts-loader`, prod-only `CleanWebpackPlugin` |
| `.eslintrc` | ESLint config — `eslint:recommended` + `@typescript-eslint/recommended` + Prettier integration; `no-console: 2`, `semi: [2, 'never']` |
| `.eslintignore` | Excludes `node_modules`, `dist`, `webpack.config.js` |
| `.prettierrc` | `semi: false`, `singleQuote: true`, `trailingComma: 'es5'` |
| `.editorconfig` | 2-space indent, LF, max 120 cols, trim trailing whitespace |
| `.babelrc` | Legacy — `@babel/preset-env` + `transform-runtime` + `transform-modules-commonjs`. **Not used by Webpack or tests**; kept for downstream tools that opt in. Safe to delete in a future cleanup |
| `.npmignore` | Trims `src/`, `test/`, configs, etc. from the published tarball — only `dist/`, `package.json`, `README.md`, `LICENSE` ship |
| `.gitignore` | Excludes `node_modules/`, `dist/`, `.env`, `tmp/*`, `package-lock.json`, `emoji-lib-output.json`, etc. |
| `.ncurc.json` | npm-check-updates config; rejects `chai` and `eslint` upgrades |

## CI/CD platform

| Tool | Version | Role |
|---|---|---|
| GitHub Actions | (managed) | All CI workflows |
| `actions/checkout` | v4 | Pull source on each runner |
| `actions/setup-node` | v4 | Node 22.13.1 |
| `actions/cache` | v4 | Cache `~/.npm`, `node_modules`, `dist` |
| `ncipollo/release-action` | v1 | Publish GitHub Releases (used by `release_and_publish.yml`) |

Workflows:

| File | Trigger | Purpose |
|---|---|---|
| `code_check.yml` | PR opened/sync/reopen → `main` | Lint + format + test gate |
| `pull_request_check.yml` | PR opened/sync/edit → `main` | Title/body length + size labels |
| `release_and_publish.yml` | PR merged to `main` | Bump version, build, npm publish, GitHub release |
| `check_packages_versions.yml` | Cron `0 15 * * 2` (Tue 15:00 UTC) | Open auto-PR with `ncu:upgrade` results |
| `check_and_merge_packages_upgrades_pr.yml` | Push to upgrade branch | Auto-merge that PR if green |
| `check_branches_state.yml` | Manual / scheduled | Stale branch report |
| `cleanup_caches.yml` | `repository_dispatch: cleanup_caches` | GHA cache GC |

Notifications go to a DailyBot Slack-like channel via `https://api.dailybot.com/v1/send-message/` using `secrets.DAILYBOT_API_KEY` and `vars.DAILYBOT_DEPLOYMENT_NOTIFICATION_CHANNEL`.

## Dev container

`.devcontainer/devcontainer.json` points at `docker/local/docker-compose.yaml`, which builds `docker/local/uemojiparser/Dockerfile`:

- Base: **`node:24.14.0-trixie-slim`**
- System packages: `git`, `curl`, `gh` (GitHub CLI), `chromium` (for Lighthouse audits — declared, not wired)
- AI CLIs pre-installed for `node` user: **Claude Code**, **Codex**, **Cursor**
- Persistent volumes for each AI CLI's auth/data so re-builds don't lose sessions
- Custom shell helpers (`docker/custom_commands.sh`) added to `~/.bashrc`: `claudex`, `codexx`, `cursorx` (full-permission wrappers), plus git aliases (`gs`, `ga`, `gc`, `gp`, etc.)

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

1. **Routine bumps:** `npm run ncu:check` shows what's available; `npm run ncu:upgrade` applies them; `npm install` to refresh `node_modules`. The CI workflow `check_packages_versions.yml` does this automatically every Tuesday and opens a PR.
2. **One library at a time** when something might break (Webpack majors, TypeScript majors). Multi-bumps mask the breaking change.
3. **Bump `@twemoji/parser` alone** when Twemoji adds new emojis or moves CDN URL format — the package picks up new emojis transparently.
4. **Major TypeScript bumps** can change `.d.ts` shape; verify consumers' projects still type-check by running `npm pack` and installing the tarball locally.
5. **Major Node bumps** are rare — only update `engines.node` when a new Node feature is needed and CI's Node version (22.13.1) supports it.

Walk through **[`/bump-deps`](../.agents/commands/bump-deps.md)** for a structured workflow.

## Version stamp

Current package version: see `package.json` `"version"` (last seen: 2.0.79). Major version 2 was the migration to Twemoji v17. Patch versions are released automatically on every PR merge.
