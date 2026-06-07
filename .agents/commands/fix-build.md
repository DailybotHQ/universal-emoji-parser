---
name: fix-build
description: Diagnose and repair a failing TypeScript / Vite / Vitest build
---

# Command: `/fix-build`

The build is broken. Find the root cause and fix it without disabling the failing check.

## Inputs to confirm

- **Which command fails?** `npm test`, `npm run build`, `npm run biome:check`, `npm run build:tsc`
- **Full error output** — paste the last ~30 lines, especially any "Caused by" / "Error:" / "TS####" lines

## Procedure

### 1. Reproduce

Run the failing command yourself with verbose output:

```bash
npm run <script> --silent=false 2>&1 | tee tmp/build.log
```

Read the actual root cause, not just the surface error.

### 2. Classify the failure

| Symptom                                                  | Likely cause                                                     | Section |
| -------------------------------------------------------- | ---------------------------------------------------------------- | ------- |
| `Cannot find module '@twemoji/parser'` (or similar)      | Stale `node_modules`                                             | A       |
| `error TS####:`                                          | TypeScript compiler error                                        | B       |
| `[vite:dts]` / Rollup `Could not resolve` / parse error  | Vite can't resolve or transform a module                        | C       |
| Biome `Cannot find configuration`                        | Wrong working directory                                          | D       |
| Biome `noConsole` / lint diagnostic                      | Code violates a Biome rule                                       | E       |
| Biome `Formatter would have printed...`                  | Code violates Biome formatting                                   | F       |
| Vitest run hangs / times out                             | Regenerator accidentally enabled                                 | G       |
| Vitest fails with assertion mismatch                     | Real test failure — fix the code                                 | H       |
| `npm publish` 401/403                                    | Auth or scope issue                                              | I       |
| GitHub Actions fails on `npm install`                    | Lock file / cache issue in CI                                    | J       |

### A. Stale `node_modules`

```bash
rm -rf node_modules
npm install
```

If still broken, also clear npm cache:

```bash
npm cache verify
npm cache clean --force   # last resort
npm install
```

### B. TypeScript compile error

Read the `error TS####:` line. Common patterns:

| Code   | Meaning                             | Fix                                                           |
| ------ | ----------------------------------- | ------------------------------------------------------------- |
| TS2304 | Cannot find name                    | Missing import                                                |
| TS2322 | Type X is not assignable to type Y  | Adjust types or cast carefully                                |
| TS2339 | Property does not exist on type     | Property genuinely missing, or wrong type — check declaration |
| TS6133 | Declared but never read             | `noUnusedLocals: true`; remove the unused thing or use it     |
| TS6053 | File not found                      | Path typo or missing source file                              |
| TS7006 | Parameter implicitly has 'any' type | `noImplicitAny: true`; annotate the parameter                 |

Run `npm run build:tsc` for the cleanest TS error output (it type-checks via `tsc -p tsconfig.build.json --noEmit` with no bundling noise).

### C. Vite can't resolve or transform a module

Vite (Rollup under the hood, esbuild for transforms) reports `Could not resolve` or a transform/parse error. Common causes:

- **Bad import path** — Vite resolves from `src/`; verify the specifier exists and the extension/casing match
- **JSON not inlined** — `src/index.ts` must `import emojiLibJson from './lib/emoji-lib.json'`; Vite inlines JSON natively
- **Type-only construct in runtime position** — esbuild strips types but won't evaluate them; check for `import type` misuse

Verify the config and reinstall if a tool is missing:

```bash
npm install
node -e "require('vite/package.json')"   # confirm Vite is installed
```

Check `vite.config.ts` — library mode must keep CJS output and esbuild minify intact. Type declarations are emitted separately by `build:types` (`tsc -p tsconfig.build.json --emitDeclarationOnly`), not by Vite.

### D. Biome can't find its configuration

```
Biome: Cannot find configuration file biome.json
```

Biome runs from a directory without `biome.json`. Run from the repo root:

```bash
cd /app  # or wherever the repo is
npm run biome:check
```

### E. Biome lint diagnostic

Common violations and fixes:

| Rule                | Violation                    | Fix                                                                                |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| `noConsole`         | `console.log(...)` in `src/` | Remove it. Tests are exempt                                                        |
| `noUnusedVariables` | Declared but unused          | Remove or prefix with `_`                                                          |
| Style/format        | Quotes, semicolons, commas   | Run `npm run biome:fix` (safe) or `npm run biome:fix:unsafe` (applies unsafe fixes) |

Note: `noExplicitAny` is **off** in `biome.json`, so `any` is allowed without a suppression. `noCommonJs` is also **off** (the dual-export tail in `src/index.ts` relies on `module.exports`).

If a diagnostic is genuinely wrong for the case, suppress with a Biome ignore comment and **always** explain why:

```ts
// biome-ignore lint/suspicious/<rule>: <reason>
const result: any = ...
```

### F. Biome formatting

```bash
npm run biome:fix
git diff   # review what Biome changed
```

Biome is the single source of both lint and format (single quotes, no semicolons, es5 trailing commas, lineWidth 120). There is no separate Prettier step — `biome check` covers both. If `biome:fix` doesn't resolve everything, run `npm run biome:fix:unsafe` and review the diff.

### G. Vitest hang/timeout — regenerator accidentally enabled

Open `test/prepareEmojiLibJson.test.ts`. If line ~39 reads `it(...)` instead of `it.skip(...)`, that's the bug. Restore:

```ts
it.skip('create emojis lib json file', () => {
```

Save, re-run `npm test` (`vitest run`). Tests now finish in ~5 seconds.

### H. Real test failure

The test asserts something the code no longer does. Two sub-cases:

1. **Test is right, code is wrong** — fix the code in `src/index.ts`
2. **Test is wrong, code is right** — update the test

If the failing test is in `emojiLibJson.test.ts` after a regeneration, see [`/regenerate-emoji-lib`](regenerate-emoji-lib.md) — the count or sample data probably changed.

If the failing test is a snapshot of HTML output and `@twemoji/parser` was bumped, the URL format changed:

- If the change is intentional (bumping Twemoji is documented): update the test expectation, **bump the major version** (HTML output change is breaking)
- If the change is unintentional: pin Twemoji back

### I. `npm publish` auth

| Error              | Fix                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `401 Unauthorized` | Token expired or wrong scope. Generate a new automation token in npm settings; update `secrets.NPM_TOKEN` |
| `403 Forbidden`    | Token doesn't have publish access for this package. Verify with `npm access list packages`                |
| `404 Not Found`    | First publish — add `--access public` (for scoped packages)                                               |
| `EPUBLISHCONFLICT` | Version already exists. Bump and retry                                                                    |

### J. CI cache / lock issues

```yaml
# .github/workflows/code_check.yml caches node_modules and ~/.npm
```

If CI is using a stale cache:

1. Bump the cache key in the workflow (e.g., add `-v2` to the key string)
2. Or push an empty commit to invalidate (won't always work)
3. Or delete the cache via GitHub UI: Repo → Actions → Caches → Delete

### 3. After fixing

```bash
npm install                          # If you touched package.json
npm run biome:check
npm test
npm run build
npm run build:tsc                    # If you touched TS configs
```

All four should pass. If the original failure was in CI, push and verify the workflow goes green.

### 4. Don't bypass

Avoid:

- `--skip-tests`, `--no-test`, `it.skip`-ing the failing test (unless it's testing something that no longer applies and you've considered carefully)
- Disabling lint rules wholesale (a file-level `biome-ignore-all` comment) — target the specific line
- Lowering TypeScript strictness (`strictNullChecks: false`) to make errors go away
- Editing `dist/` directly to "fix" a build issue — the next build overwrites it

### 5. Document recurring failures

If you fix the same kind of build break twice, write it up:

- Add a note to [`docs/getting-started/TROUBLESHOOTING.md`](../../docs/getting-started/TROUBLESHOOTING.md)
- Add a defensive check in `package.json` scripts or a workflow if applicable

## Don't

- ❌ Disable a check to make the build pass
- ❌ Bump every dependency at once when a build breaks — bump one, build, then the next
- ❌ Edit `dist/` files (gitignored, regenerated)
- ❌ Run `git checkout -- .` to "reset" partial work without investigating

## Do

- ❌ Read the actual error message before guessing the fix
- ✅ Use `npm run build:tsc` for clearer TS errors than `npm run build`
- ✅ Run all checks (`biome:check` + test + build) after fixing
- ✅ Commit the fix with a `fix:` conventional message
