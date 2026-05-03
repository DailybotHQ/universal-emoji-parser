---
name: fix-build
description: Diagnose and repair a failing TypeScript / Webpack / Mocha build
---

# Command: `/fix-build`

The build is broken. Find the root cause and fix it without disabling the failing check.

## Inputs to confirm

- **Which command fails?** `npm test`, `npm run build`, `npm run eslint:check`, `npm run prettier:check`, `npm run build:tsc`
- **Full error output** — paste the last ~30 lines, especially any "Caused by" / "Error:" / "TS####" lines

## Procedure

### 1. Reproduce

Run the failing command yourself with verbose output:

```bash
npm run <script> --silent=false 2>&1 | tee tmp/build.log
```

Read the actual root cause, not just the surface error.

### 2. Classify the failure

| Symptom | Likely cause | Section |
|---|---|---|
| `Cannot find module '@twemoji/parser'` (or similar) | Stale `node_modules` | A |
| `TSError: ⨯ Unable to compile TypeScript` | TS source error | B |
| `error TS####:` | TypeScript compiler error | B |
| `Module parse failed` (Webpack) | TS file Webpack can't parse — usually `ts-loader` not picking up | C |
| ESLint `Parsing error: Cannot read file 'tsconfig.json'` | Wrong working directory | D |
| ESLint `'X' is not defined` (no-console, etc.) | Code violates a lint rule | E |
| Prettier `Code style issues found` | Code violates Prettier formatting | F |
| Mocha tests time out | Regenerator accidentally enabled | G |
| Mocha tests fail with assertion mismatch | Real test failure — fix the code | H |
| `npm publish` 401/403 | Auth or scope issue | I |
| GitHub Actions fails on `npm install` | Lock file / cache issue in CI | J |

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

| Code | Meaning | Fix |
|---|---|---|
| TS2304 | Cannot find name | Missing import |
| TS2322 | Type X is not assignable to type Y | Adjust types or cast carefully |
| TS2339 | Property does not exist on type | Property genuinely missing, or wrong type — check declaration |
| TS6133 | Declared but never read | `noUnusedLocals: true`; remove the unused thing or use it |
| TS6053 | File not found | Path typo or missing source file |
| TS7006 | Parameter implicitly has 'any' type | `noImplicitAny: true`; annotate the parameter |

Run `npm run build:tsc` for the cleanest TS error output (Webpack obscures TypeScript errors slightly).

### C. Webpack `Module parse failed` on a `.ts` file

ts-loader didn't get a chance to compile. Verify `webpack.config.js` rules:

```js
module: {
  rules: [
    { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
  ],
},
```

If this looks right, `ts-loader` may not be installed:

```bash
npm install
ls node_modules/ts-loader
```

### D. ESLint can't find tsconfig

```
.eslintrc » @typescript-eslint/eslint-recommended
Parsing error: Cannot read file '/.../tsconfig.json'
```

ESLint runs from a directory without `tsconfig.json`. Run from the repo root:

```bash
cd /app  # or wherever the repo is
npm run eslint:check
```

### E. ESLint rule violation

Common violations and fixes:

| Rule | Violation | Fix |
|---|---|---|
| `no-console` | `console.log(...)` in `src/` | Remove it. Tests are exempt |
| `semi` | Stray semicolon | Run `npm run prettier:fix` |
| `@typescript-eslint/no-unused-vars` | Declared but unused | Remove or prefix with `_` |
| `@typescript-eslint/no-explicit-any` | `any` type | Use `unknown` and narrow, or suppress with `// eslint-disable-next-line` and a comment |

If the rule is genuinely wrong for the case, suppress with:

```ts
// eslint-disable-next-line @typescript-eslint/<rule-name>
const result: any = ...
```

…and **always** add a comment explaining why.

### F. Prettier formatting

```bash
npm run prettier:fix
git diff   # review what Prettier changed
```

If Prettier and ESLint disagree (rare — `eslint-config-prettier` should prevent this), update `.eslintrc` to extend `prettier` last so it wins.

### G. Mocha timeout — regenerator accidentally enabled

Open `test/prepareEmojiLibJson.test.ts`. If line ~39 reads `it(...)` instead of `it.skip(...)`, that's the bug. Restore:

```ts
it.skip('create emojis lib json file', () => {
```

Save, re-run `npm test`. Tests now finish in ~5 seconds.

### H. Real test failure

The test asserts something the code no longer does. Two sub-cases:

1. **Test is right, code is wrong** — fix the code in `src/index.ts`
2. **Test is wrong, code is right** — update the test

If the failing test is in `emojiLibJson.test.ts` after a regeneration, see [`/regenerate-emoji-lib`](regenerate-emoji-lib.md) — the count or sample data probably changed.

If the failing test is a snapshot of HTML output and `@twemoji/parser` was bumped, the URL format changed:

- If the change is intentional (bumping Twemoji is documented): update the test expectation, **bump the major version** (HTML output change is breaking)
- If the change is unintentional: pin Twemoji back

### I. `npm publish` auth

| Error | Fix |
|---|---|
| `401 Unauthorized` | Token expired or wrong scope. Generate a new automation token in npm settings; update `secrets.NPM_TOKEN` |
| `403 Forbidden` | Token doesn't have publish access for this package. Verify with `npm access list packages` |
| `404 Not Found` | First publish — add `--access public` (for scoped packages) |
| `EPUBLISHCONFLICT` | Version already exists. Bump and retry |

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
npm run eslint:check
npm run prettier:check
npm test
npm run build
npm run build:tsc                    # If you touched TS configs
```

All five should pass. If the original failure was in CI, push and verify the workflow goes green.

### 4. Don't bypass

Avoid:

- `--skip-tests`, `--no-test`, `it.skip`-ing the failing test (unless it's testing something that no longer applies and you've considered carefully)
- Disabling lint rules wholesale (`/* eslint-disable */` at the file level) — target the specific line
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
- ✅ Run all four checks (lint + format + test + build) after fixing
- ✅ Commit the fix with a `fix:` conventional message
