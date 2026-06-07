# Development Commands

Reference for every pnpm script and shell command you'll run during day-to-day work on Universal Emoji Parser. The repo uses **pnpm** (pinned via `"packageManager": "pnpm@11.1.2"` and provisioned by Corepack — run `corepack enable` once). All commands run from the repo root and assume `pnpm install` has been run at least once.

## Inner-loop favorites

| Goal               | Command                 | Notes                                                                                                |
| ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| TDD inner loop     | `pnpm run test:watch`   | Runs Vitest in watch mode — re-runs on every save in `src/` or `test/`                               |
| One-off smoke run  | `pnpm run dev`          | Runs `nodemon --exec tsx src/index.ts` — useful when adding a `console.log` (test-only) for ad hoc inspection |
| Type check         | `pnpm run build:tsc`    | `tsc -p tsconfig.build.json --noEmit` — type-check only, emits nothing                               |
| Lint + format check | `pnpm run biome:check` | CI gate — Biome covers both lint and format in one pass                                              |
| Fix everything     | `pnpm run biome:fix`    | Auto-fix lint + format (`biome check --write`)                                                       |

## Testing

```bash
pnpm test                             # All Vitest specs (vitest run), no compile step
pnpm run test:watch                   # Vitest watch mode on src/ + test/

# Run a single file
pnpm dlx vitest run test/main.test.ts

# Run a single describe / it (Vitest name filter)
pnpm dlx vitest run test/main.test.ts -t "should parse emojis from unicode"

# Run with the verbose reporter
pnpm dlx vitest run test/main.test.ts --reporter verbose
```

Vitest is configured in `vitest.config.ts`. Tests are slow only because of the Twemoji parse — the catalog ops are sub-millisecond.

### Running the regenerator (the `it.skip` test)

`test/prepareEmojiLibJson.test.ts` has an `it.skip(...)` so it never runs by default. To regenerate the catalog:

1. Open `test/prepareEmojiLibJson.test.ts`
2. Change `it.skip('create emojis lib json file', ...)` → `it('create emojis lib json file', ...)`
3. `pnpm test`
4. Check `src/lib/emoji-lib-output.json` was written
5. Diff against `src/lib/emoji-lib.json` and copy the new contents over
6. **Restore the `.skip`** before committing

See [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md) for the full procedure.

## Linting and formatting

Biome is a single tool for both lint and format. One config (`biome.json`), one pass.

```bash
pnpm run biome:check         # Lint + format check (CI gate) — biome check
pnpm run biome:fix           # Auto-fix lint + format — biome check --write
pnpm run biome:fix:unsafe    # Same, but also applies "unsafe" fixes (review the diff)
```

Style enforced by `biome.json`: single quotes, no semicolons, trailing comma `es5`, lineWidth 120. `noConsole` is an error in `src/` only (tests may log freely). `.agents/skills/deepworkplan/` is excluded from formatting.

### Pre-commit recommendation

Run before every commit:

```bash
pnpm run biome:fix && pnpm test
```

There's no Husky / pre-commit hook installed — the gate is CI. But running locally avoids "fix lint" loops in PR feedback.

## Building

```bash
pnpm run build             # Vite production bundle + tsc declarations → full dist/
pnpm run build:dev         # Vite development bundle (unminified, --mode development)
pnpm run build:types       # tsc -p tsconfig.build.json --emitDeclarationOnly → dist/index.d.ts + dist/lib/type.d.ts
pnpm run build:tsc         # tsc -p tsconfig.build.json --noEmit (type-check only, no output)
```

`pnpm run build` runs `vite build && tsc -p tsconfig.build.json --emitDeclarationOnly` (inlined — no nested package-manager call), so one command produces both the runtime bundle and the type declarations. The Vite-produced `dist/index.js` is the runtime; the tsc-produced `dist/index.d.ts` is the type declaration. Both are needed for npm consumers — the `package.json` `main` and `types` fields point at them.

```bash
ls -la dist/
# dist/index.js          ← Vite output (consumed at runtime)
# dist/index.d.ts        ← tsc output (consumed by TypeScript users)
# dist/lib/type.d.ts     ← re-exported interface types
# dist/*.map             ← source maps
```

`dist/` is gitignored. CI rebuilds it before publishing.

### Inspecting the bundle

```bash
ls -lh dist/index.js                              # Bundle size
node -e "console.log(require('./dist/index.js').parse('hello :smile:'))"   # Smoke run

# Catalog size dominates the bundle
ls -lh src/lib/emoji-lib.json                      # ~543 KB raw
ls -lh dist/index.js                                # ~403 KB minified (catalog + @twemoji/parser inlined)
```

## Maintenance

```bash
pnpm run ncu:check                 # Show available dependency upgrades (respects .ncurc.json)
pnpm run ncu:upgrade               # Apply upgrades to package.json
pnpm install                       # Refresh node_modules + pnpm-lock.yaml with the new versions

# After upgrading
pnpm run biome:check               # Sanity check (lint + format)
pnpm test
pnpm run build
```

`.ncurc.json` rejects upgrades to `@twemoji/parser` (pinned to 17.0.1 — 17.0.2 regressed U+FE0F handling). Every other dependency tracks latest. See [Technologies → Pinned exclusions](TECHNOLOGIES.md#pinned-exclusions).

### Cleaning

```bash
rm -rf node_modules dist            # Nuclear option
pnpm install                        # Re-bootstrap

# Just dist/ (Vite empties it on each build anyway)
rm -rf dist/
```

## Release (CI-driven, rarely run by hand)

The `release_and_publish.yml` workflow runs on every PR merge to `main` and:

1. Bumps the patch version via `.github/scripts/prepare_release.sh` (Node bumps `package.json`, then commits and tags with `[🤖 DailyBot] New release to v%s launched 🚀`)
2. Pushes the tag and the version commit
3. Builds: `corepack pnpm run build`
4. Creates a GitHub Release with notes from the merged commits
5. Publishes to npm: `corepack pnpm publish --no-git-checks`

If you need to do this by hand (CI down, emergency release):

```bash
bash .github/scripts/prepare_release.sh   # bumps package.json, commits + tags
git push --follow-tags origin main
corepack pnpm run build
corepack pnpm publish --no-git-checks
```

You'll need `NPM_TOKEN` set in the environment and write access to the GitHub remote. Walk through [`/release-npm`](../.agents/commands/release-npm.md) for the full manual flow.

## Useful one-liners

```bash
# Find which emoji a shortcode maps to
node -e "const u = require('./dist/index.js'); console.log(u.getEmojiObjectByShortcode('smile'))"

# Catalog size
node -e "console.log(Object.keys(require('./dist/index.js').emojiLibJsonData).length)"

# Test a single input end-to-end
node -e "console.log(require('./dist/index.js').parse('hello :smile: 🚀'))"

# List all keywords for an emoji
node -e "console.log(require('./dist/index.js').emojiLibJsonData['😎'].keywords)"
```

These all assume `dist/index.js` exists; run `pnpm run build` first if not.

## Common workflows

### Add a new shortcode alias for an existing emoji

1. Open `test/prepareEmojiLibJson.test.ts`
2. Add an entry to `EMOJIS_SPECIAL_CASES`:
   ```ts
   '🚀': { include: ['rocket_ship', 'launch'] },
   ```
3. Regenerate (see "Running the regenerator" above)
4. Verify in tests: `pnpm dlx vitest run test/main.test.ts -t "rocket_ship"`
5. Re-skip the regenerator test
6. Commit `src/lib/emoji-lib.json` + `prepareEmojiLibJson.test.ts` together

Walkthrough: [`/add-special-case`](../.agents/commands/add-special-case.md).

### Diagnose a parsing bug

1. Reproduce the failure in `tmp/repro.ts`:
   ```ts
   import uEmojiParser from '../src/index'
   console.log(uEmojiParser.parse('the input that breaks'))
   ```
2. `pnpm dlx tsx tmp/repro.ts`
3. Once you've isolated it, add a test in `test/main.test.ts` that asserts the _expected_ output, watch it fail
4. Fix `src/index.ts`
5. Test passes — commit fix + test together

### Bump `@twemoji/parser`

1. `pnpm run ncu:check` — confirm an upgrade is available (this is a runtime dep so look carefully)
2. Read Twemoji release notes for HTML / URL changes
3. Edit `package.json` for just this dep, run `pnpm install`
4. `pnpm test` — if the existing snapshots break, the URL format changed. Update the test expectations and bump the major version
5. `pnpm run build && pnpm test`
6. PR with title `chore: bump @twemoji/parser to <version>` (or `feat:` / `fix:` if the bump unlocks something)

### Reset a stuck setup

```bash
rm -rf node_modules dist
pnpm install
pnpm test
```

If that doesn't help, check the pnpm store:

```bash
pnpm store status
pnpm store prune          # last resort — removes unreferenced packages from the store
```

## Dev container helpers

When working inside the VS Code Dev Container (or `docker compose up uemojiparservscode`), `docker/custom_commands.sh` provides shortcuts:

```bash
help                # Reprint the welcome banner
check               # → corepack pnpm run biome:check
fix                 # → corepack pnpm run biome:fix
test                # → corepack pnpm run test
build               # → corepack pnpm run build
codecheck           # → biome + build + test (full local gate)
install             # → corepack pnpm install
check_devcontainer  # Verify you are inside the dev container

# AI CLI shortcuts (full-permission wrappers)
claudex             # claude --dangerously-skip-permissions
claudex -c          # continue last session
codexx              # codex --dangerously-bypass-approvals-and-sandbox
cursorx             # cursor agent --force

# Git aliases
gs / ga / gc / gp / gpl / gl / gd / gb / gco / gcob / gbd
```

Outside the container, these aren't available — use the underlying pnpm/git commands directly. Inside the dev container, a wrapper at `/usr/local/bin/npm` routes any stray `npm …` invocation to `corepack pnpm`, so legacy muscle memory still resolves to pnpm.

## CI considerations

The CI pipeline (`.github/workflows/code_check.yml`) runs on every PR:

```
setup
  ├── validate_linters_and_code_format    (corepack pnpm run biome:check)
  └── tests                                (corepack pnpm run test)
```

Both are required to merge. No build step in `code_check.yml` because it's verified by `release_and_publish.yml` on merge.

For local CI parity:

```bash
pnpm install
pnpm run biome:check
pnpm test
pnpm run build
```

If all three pass locally, the PR will pass CI (modulo Node version drift — CI uses Node 24, pinned to 24.16.0 via `.node-version`/`.nvmrc`; ensure your local Node satisfies `engines.node` ≥ 22).

## Reference: every pnpm script in `package.json`

| Script             | What it runs                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `biome:check`      | `biome check` (lint + format check — CI gate)                        |
| `biome:fix`        | `biome check --write` (auto-fix lint + format)                       |
| `biome:fix:unsafe` | `biome check --write --unsafe` (also applies unsafe fixes)          |
| `test`             | `vitest run`                                                         |
| `test:watch`       | `vitest` (watch mode)                                                |
| `release`          | `bash .github/scripts/prepare_release.sh` (Node patch bump + commit + tag) |
| `start`            | `node dist/index.js` (rare — this package is a library, not an app)  |
| `dev`              | `nodemon --exec tsx src/index.ts`                                    |
| `build`            | `vite build && tsc -p tsconfig.build.json --emitDeclarationOnly`     |
| `build:dev`        | `vite build --mode development`                                      |
| `build:types`      | `tsc -p tsconfig.build.json --emitDeclarationOnly`                   |
| `build:tsc`        | `tsc -p tsconfig.build.json --noEmit` (type-check only)             |
| `ncu:check`        | `ncu`                                                                |
| `ncu:upgrade`      | `ncu -u`                                                             |
