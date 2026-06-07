---
name: bump-deps
description: Update one or more npm dependencies safely (respects .ncurc.json)
---

# Command: `/bump-deps`

Bump one or more dependencies in `package.json`, then verify lint + tests + build still pass.

## When to use

- The user asks to "bump X to version Y"
- The weekly `check_packages_versions.yml` workflow opened a PR that needs review
- A security advisory or feature requires a newer version
- Routine maintenance

## Inputs to confirm

- **Which dependency** — `@twemoji/parser`, `typescript`, `vitest`, `@biomejs/biome`, `vite`, etc.
- **Target version** — exact version string, or "latest" / "patch" / "minor"
- **Why** — feature, security, hygiene

## Pre-flight: `.ncurc.json` rejects

```json
{
  "upgrade": true,
  "reject": ["@twemoji/parser"]
}
```

Add package names to `reject` only when an upgrade needs deliberate follow-up (breaking API, ecosystem lag). **`@twemoji/parser` is pinned to exactly `17.0.1` and listed in `reject`** because `17.0.2` regressed U+FE0F (variation selector) handling and emits empty-`src` `<img>` tags. Don't lift this reject without verifying VS-16 emojis still render.

**There is no runtime dependency to bump.** `@twemoji/parser` is **inlined into the bundle at build time** and lives in `devDependencies`; `dependencies` is empty (zero runtime deps). Everything else — `typescript`, `vitest`, `@biomejs/biome`, `vite` — is also a devDep. Read `@twemoji/parser` release notes carefully before any bump — its URL format changes are breaking for our HTML output, and it currently sits behind the `reject` pin above.

## Procedure

### 1. Check what's available

```bash
npm run ncu:check
```

Output lists every dep with an upgrade available, respecting `.ncurc.json`. Sample:

```
 typescript           5.9.3  →  5.9.4
 vitest               4.0.1  →  4.0.2
 @biomejs/biome       2.4.0  →  2.4.1
```

(`@twemoji/parser` is pinned via `reject` and won't appear here.)

### 2. Bump one library at a time

Multi-bumps mask which dependency broke a build. Even if `ncu` proposes ten in one PR, take them one at a time **locally** to isolate breakage; the CI auto-PR can batch.

### 2a. Bump a single dep

```bash
# Edit package.json manually
$EDITOR package.json
# Or use ncu for one specific dep
npx ncu typescript -u
# Or for multiple
npx ncu typescript vitest -u
```

Note: `ncu -u` modifies `package.json`. Verify the diff:

```bash
git diff package.json
```

### 2b. Apply via npm install

```bash
npm install
```

This refreshes `node_modules`. There's no committed `package-lock.json`, so the lock is regenerated.

### 3. Run the full check sequence

```bash
npm run biome:check
npm test
npm run build
npm run build:tsc
```

Read every error. Common failure modes:

| Error                    | Likely cause                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `Could not find <coord>` | Wrong package name or version doesn't exist on npm                        |
| `error TS2###:`          | API removed or renamed in the new version (check release notes)           |
| `Could not resolve 'X'`  | Package's exports map changed; consumer code needs an updated import path |
| Test assertion mismatch  | HTML output format changed (Twemoji bump)                                 |
| Biome lint/format failure | A new Biome rule was activated or defaults shifted                       |

### 4. Address breaking changes

If the new version removed an API:

1. Find the replacement in the release notes
2. Update call sites in `src/` and/or `test/`
3. Re-run the check sequence

If the new version changed default behavior:

- Audit related code paths
- Decide whether to absorb the change or pin back

### 5. Verify the bundle still works

`@twemoji/parser` is inlined into the bundle, so any change to it (or to Vite/TypeScript) can affect `dist/index.js`:

```bash
npm run build
node -e "console.log(require('./dist/index.js').parse('hello :smile: 🚀'))"
```

Expected: HTML output with valid Twemoji URLs. If the URLs look wrong (or `src` is empty — the U+FE0F regression that pinned us to `17.0.1`), the bump changed parser behavior — that's a breaking change for consumers. Bump the package's major version, or keep the `reject` pin.

### 6. Update docs

If the bump:

- **Adds or renames a public API** used in docs → update [`docs/TECHNOLOGIES.md`](../../docs/TECHNOLOGIES.md), [`docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md)
- **Affects the build** (Vite, TypeScript version) → update [`docs/BUILD_DEPLOY.md`](../../docs/BUILD_DEPLOY.md)
- **Affects testing** (Vitest) → update [`docs/TESTING_GUIDE.md`](../../docs/TESTING_GUIDE.md)
- **Affects the catalog regeneration** (emojilib, unicode-emoji-json) → update [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) and consider running [`/regenerate-emoji-lib`](regenerate-emoji-lib.md)

Always update [`docs/TECHNOLOGIES.md`](../../docs/TECHNOLOGIES.md) version table for any major bump.

### 7. Commit

```bash
git add package.json
git commit -m "chore: bump <library> to <version>"
```

Conventional commit type:

- `chore:` — routine bump (most common)
- `fix:` — security or bug-fix bump
- `feat:` — bumping unlocks a new feature you're using
- `build:` — toolchain (Vite, TypeScript, Node)

Examples:

```
chore: bump vitest to 4.0.2
fix: bump @types/node to 24.10.3 (CVE-...)
build: bump typescript to 5.9.4
```

## Special cases

### `@twemoji/parser`

Inlined into the bundle (a devDep, not a runtime dep) and **pinned to `17.0.1` via `.ncurc.json` `reject`**. `17.0.2` regressed U+FE0F (variation selector) handling — it emits empty-`src` `<img>` tags — which is why the pin exists. Bumps can change:

- **CDN URL format** — historically rare; if it changes, every literal-HTML assertion in `main.test.ts` breaks. **Major version bump for our package**
- **Available emojis** — additive; no test breaks
- **Variation selector handling** — the exact regression that pinned us at `17.0.1`; verify VS-16 emojis (`⭐️`, `❤️`) render with a non-empty `src` before lifting the pin

Before lifting the `reject` pin and bumping:

```bash
npm test                                   # assertions break if URL format changed
npm run build && node -e "console.log(require('./dist/index.js').parse('❤️ 🚀'))"
```

If assertions break or `src` comes back empty, decide between:

- **Update assertions + bump our major** (preferred when the change is intentional and correct — consumers need to update too)
- **Keep the `17.0.1` pin** (if the change is undesirable, e.g. the U+FE0F regression)

### `typescript`

Type-only changes can ripple through the `.d.ts` we ship. After bumping:

```bash
npm run build:tsc                    # check the .d.ts compiles cleanly
npm pack                             # generate a tarball
# install in a sample project to verify types still work for consumers
```

Major TypeScript bumps may shift inferred types in `.d.ts` — review the diff. Declarations are emitted by `build:types` (`tsc -p tsconfig.build.json --emitDeclarationOnly`), not by Vite.

### `vite` major bumps

Vite drives the production bundle (library mode, CJS output, esbuild minify). A major bump can change config options or output behavior. When that bump comes, plan to:

1. Bump `vite` (and any Vite plugins) together
2. Audit `vite.config.ts` for deprecated options; keep library mode + CJS output + esbuild minify
3. Verify `dist/index.js` still has the `module.exports = uEmojiParser` tail (the dual require/import shape depends on it; it's wrapped in try/catch so it no-ops under ESM/Vitest)
4. Confirm `@twemoji/parser` is still inlined and `dist/index.js` stays ~403 KB

### `vitest` major bumps

Vitest occasionally drops Node version support. Verify our `engines.node` (`>=20.19`) is still compatible. Specs import `{ describe, it, expect }` from `vitest` — a major bump rarely touches those.

### `node-version` in CI workflows

If we bump `engines.node` in `package.json`, also bump the Node version in every CI workflow:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '24'
```

Don't drift CI Node from the package's stated minimum.

## Don't

- ❌ Lift the `@twemoji/parser` `.ncurc.json` `reject` without verifying VS-16 emojis render (the U+FE0F regression that pinned it to `17.0.1`)
- ❌ Move anything into `dependencies` — the package ships **zero runtime deps**; every devDep stays a devDep
- ❌ Bump multiple unrelated libraries in one commit
- ❌ Skip docs updates after a major bump
- ❌ Auto-merge a `@twemoji/parser` bump without reading release notes

## Do

- ✅ Read release notes (at minimum the headline changes)
- ✅ Run all checks (`biome:check`, test, build, types) after bumping
- ✅ Update docs in the same commit
- ✅ Use conventional commit messages
- ✅ Treat `@twemoji/parser` URL/`src` changes as breaking (major bump for our package)
- ✅ Keep `dependencies` empty — `@twemoji/parser` is inlined at build time

## Verification checklist

- [ ] Edited only `package.json` (and re-ran `npm install` to regenerate locks if applicable)
- [ ] `dependencies` is still empty (zero runtime deps)
- [ ] `npm run biome:check` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `npm run build:tsc` succeeds (types compile)
- [ ] If `@twemoji/parser` was bumped, manual smoke-test of HTML output succeeded (non-empty `src`)
- [ ] Docs updated for any documented version
- [ ] Conventional commit message
