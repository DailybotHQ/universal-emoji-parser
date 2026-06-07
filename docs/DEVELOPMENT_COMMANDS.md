# Development Commands

Reference for every npm script and shell command you'll run during day-to-day work on Universal Emoji Parser. All commands run from the repo root and assume `npm install` has been run at least once.

## Inner-loop favorites

| Goal               | Command                | Notes                                                                                                |
| ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------- |
| TDD inner loop     | `npm run test:watch`   | Runs Vitest in watch mode — re-runs on every save in `src/` or `test/`                               |
| One-off smoke run  | `npm run dev`          | Runs `nodemon --exec tsx src/index.ts` — useful when adding a `console.log` (test-only) for ad hoc inspection |
| Type check         | `npm run build:tsc`    | `tsc -p tsconfig.build.json --noEmit` — type-check only, emits nothing                               |
| Lint + format check | `npm run biome:check` | CI gate — Biome covers both lint and format in one pass                                              |
| Fix everything     | `npm run biome:fix`    | Auto-fix lint + format (`biome check --write`)                                                       |

## Testing

```bash
npm test                              # All Vitest specs (vitest run), no compile step
npm run test:watch                    # Vitest watch mode on src/ + test/

# Run a single file
npx vitest run test/main.test.ts

# Run a single describe / it (Vitest name filter)
npx vitest run test/main.test.ts -t "should parse emojis from unicode"

# Run with the verbose reporter
npx vitest run test/main.test.ts --reporter verbose
```

Vitest is configured in `vitest.config.ts`. Tests are slow only because of the Twemoji parse — the catalog ops are sub-millisecond.

### Running the regenerator (the `it.skip` test)

`test/prepareEmojiLibJson.test.ts` has an `it.skip(...)` so it never runs by default. To regenerate the catalog:

1. Open `test/prepareEmojiLibJson.test.ts`
2. Change `it.skip('create emojis lib json file', ...)` → `it('create emojis lib json file', ...)`
3. `npm test`
4. Check `src/lib/emoji-lib-output.json` was written
5. Diff against `src/lib/emoji-lib.json` and copy the new contents over
6. **Restore the `.skip`** before committing

See [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md) for the full procedure.

## Linting and formatting

Biome is a single tool for both lint and format. One config (`biome.json`), one pass.

```bash
npm run biome:check          # Lint + format check (CI gate) — biome check
npm run biome:fix            # Auto-fix lint + format — biome check --write
npm run biome:fix:unsafe     # Same, but also applies "unsafe" fixes (review the diff)
```

Style enforced by `biome.json`: single quotes, no semicolons, trailing comma `es5`, lineWidth 120. `noConsole` is an error in `src/` only (tests may log freely). `.agents/skills/deepworkplan/` is excluded from formatting.

### Pre-commit recommendation

Run before every commit:

```bash
npm run biome:fix && npm test
```

There's no Husky / pre-commit hook installed — the gate is CI. But running locally avoids "fix lint" loops in PR feedback.

## Building

```bash
npm run build              # Vite production bundle + tsc declarations → full dist/
npm run build:dev          # Vite development bundle (unminified, --mode development)
npm run build:types        # tsc -p tsconfig.build.json --emitDeclarationOnly → dist/index.d.ts + dist/lib/type.d.ts
npm run build:tsc          # tsc -p tsconfig.build.json --noEmit (type-check only, no output)
```

`npm run build` chains `vite build && npm run build:types`, so one command produces both the runtime bundle and the type declarations. The Vite-produced `dist/index.js` is the runtime; the tsc-produced `dist/index.d.ts` is the type declaration. Both are needed for npm consumers — the `package.json` `main` and `types` fields point at them.

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
npm run ncu:check                  # Show available dependency upgrades (respects .ncurc.json)
npm run ncu:upgrade                # Apply upgrades to package.json
npm install                        # Refresh node_modules with the new versions

# After upgrading
npm run biome:check                # Sanity check (lint + format)
npm test
npm run build
```

`.ncurc.json` rejects upgrades to `@twemoji/parser` (pinned to 17.0.1 — 17.0.2 regressed U+FE0F handling). Every other dependency tracks latest. See [Technologies → Pinned exclusions](TECHNOLOGIES.md#pinned-exclusions).

### Cleaning

```bash
rm -rf node_modules dist            # Nuclear option
npm install                         # Re-bootstrap

# Just dist/ (Vite empties it on each build anyway)
rm -rf dist/
```

## Release (CI-driven, rarely run by hand)

The `release_and_publish.yml` workflow runs on every PR merge to `main` and:

1. Bumps the patch version: `npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"`
2. Pushes the tag and the version commit
3. Builds: `npm run build`
4. Creates a GitHub Release with notes from the merged commits
5. Publishes to npm: `npm publish`

If you need to do this by hand (CI down, emergency release):

```bash
npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"
git push --follow-tags origin main
npm run build
npm publish
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

These all assume `dist/index.js` exists; run `npm run build` first if not.

## Common workflows

### Add a new shortcode alias for an existing emoji

1. Open `test/prepareEmojiLibJson.test.ts`
2. Add an entry to `EMOJIS_SPECIAL_CASES`:
   ```ts
   '🚀': { include: ['rocket_ship', 'launch'] },
   ```
3. Regenerate (see "Running the regenerator" above)
4. Verify in tests: `npx vitest run test/main.test.ts -t "rocket_ship"`
5. Re-skip the regenerator test
6. Commit `src/lib/emoji-lib.json` + `prepareEmojiLibJson.test.ts` together

Walkthrough: [`/add-special-case`](../.agents/commands/add-special-case.md).

### Diagnose a parsing bug

1. Reproduce the failure in `tmp/repro.ts`:
   ```ts
   import uEmojiParser from '../src/index'
   console.log(uEmojiParser.parse('the input that breaks'))
   ```
2. `npx tsx tmp/repro.ts`
3. Once you've isolated it, add a test in `test/main.test.ts` that asserts the _expected_ output, watch it fail
4. Fix `src/index.ts`
5. Test passes — commit fix + test together

### Bump `@twemoji/parser`

1. `npm run ncu:check` — confirm an upgrade is available (this is a runtime dep so look carefully)
2. Read Twemoji release notes for HTML / URL changes
3. Edit `package.json` for just this dep, run `npm install`
4. `npm test` — if the existing snapshots break, the URL format changed. Update the test expectations and bump the major version
5. `npm run build && npm test`
6. PR with title `chore: bump @twemoji/parser to <version>` (or `feat:` / `fix:` if the bump unlocks something)

### Reset a stuck setup

```bash
rm -rf node_modules dist
npm install
npm test
```

If that doesn't help, check `~/.npm` cache:

```bash
npm cache verify
npm cache clean --force    # last resort
```

## Dev container helpers

When working inside the VS Code Dev Container (or `docker compose up uemojiparservscode`), `docker/custom_commands.sh` provides shortcuts:

```bash
help                # Reprint the welcome banner
check               # → npm run biome:check
fix                 # → npm run biome:fix
test                # → npm run test
build               # → npm run build
codecheck           # → biome + build + test (full local gate)
install             # → npm install
check_devcontainer  # Verify you are inside the dev container

# AI CLI shortcuts (full-permission wrappers)
claudex             # claude --dangerously-skip-permissions
claudex -c          # continue last session
codexx              # codex --dangerously-bypass-approvals-and-sandbox
cursorx             # cursor agent --force

# Git aliases
gs / ga / gc / gp / gpl / gl / gd / gb / gco / gcob / gbd
```

Outside the container, these aren't available — use the underlying npm/git commands directly.

## CI considerations

The CI pipeline (`.github/workflows/code_check.yml`) runs on every PR:

```
setup
  ├── validate_linters_and_code_format    (npm run biome:check)
  └── tests                                (npm run test)
```

Both are required to merge. No build step in `code_check.yml` because it's verified by `release_and_publish.yml` on merge.

For local CI parity:

```bash
npm install
npm run biome:check
npm test
npm run build
```

If all three pass locally, the PR will pass CI (modulo Node version drift — CI uses Node 24; ensure your local Node satisfies `engines.node` ≥ 22).

## Reference: every npm script in `package.json`

| Script             | What it runs                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `biome:check`      | `biome check` (lint + format check — CI gate)                        |
| `biome:fix`        | `biome check --write` (auto-fix lint + format)                       |
| `biome:fix:unsafe` | `biome check --write --unsafe` (also applies unsafe fixes)          |
| `test`             | `vitest run`                                                         |
| `test:watch`       | `vitest` (watch mode)                                                |
| `release`          | `npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"` |
| `start`            | `node dist/index.js` (rare — this package is a library, not an app)  |
| `dev`              | `nodemon --exec tsx src/index.ts`                                    |
| `build`            | `vite build && npm run build:types`                                  |
| `build:dev`        | `vite build --mode development`                                      |
| `build:types`      | `tsc -p tsconfig.build.json --emitDeclarationOnly`                   |
| `build:tsc`        | `tsc -p tsconfig.build.json --noEmit` (type-check only)             |
| `ncu:check`        | `ncu`                                                                |
| `ncu:upgrade`      | `ncu -u`                                                             |
