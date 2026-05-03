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

- **Which dependency** — `@twemoji/parser`, `typescript`, `mocha`, etc.
- **Target version** — exact version string, or "latest" / "patch" / "minor"
- **Why** — feature, security, hygiene

## Pre-flight: optional `.ncurc.json` rejects

```json
{
  "upgrade": true,
  "reject": []
}
```

Add package names to `reject` only when an upgrade needs deliberate follow-up (breaking API, ecosystem lag). **`chai` and `eslint` are no longer repo-wide pins** — we ship Chai 6 + ESLint 10 (`eslint.config.mjs`) + **tsx** for the Mocha suite.

For `@twemoji/parser` (the only runtime dep), read the release notes — URL format changes are breaking.

## Procedure

### 1. Check what's available

```bash
npm run ncu:check
```

Output lists every dep with an upgrade available, respecting `.ncurc.json`. Sample:

```
 @twemoji/parser     17.0.1  →  17.1.0
 typescript           5.9.3  →  5.9.4
 mocha               11.7.5  →  11.8.0
```

### 2. Bump one library at a time

Multi-bumps mask which dependency broke a build. Even if `ncu` proposes ten in one PR, take them one at a time **locally** to isolate breakage; the CI auto-PR can batch.

### 2a. Bump a single dep

```bash
# Edit package.json manually
$EDITOR package.json
# Or use ncu for one specific dep
npx ncu @twemoji/parser -u
# Or for multiple
npx ncu typescript mocha -u
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
npm run eslint:check
npm run prettier:check
npm test
npm run build
npm run build:tsc
```

Read every error. Common failure modes:

| Error                    | Likely cause                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `Could not find <coord>` | Wrong package name or version doesn't exist on npm                        |
| `error TS2###:`          | API removed or renamed in the new version (check release notes)           |
| `Module not found: 'X'`  | Package's exports map changed; consumer code needs an updated import path |
| Test snapshot mismatch   | HTML output format changed (Twemoji bump)                                 |
| Lint or format failure   | New `@typescript-eslint` rule was activated                               |

### 4. Address breaking changes

If the new version removed an API:

1. Find the replacement in the release notes
2. Update call sites in `src/` and/or `test/`
3. Re-run the check sequence

If the new version changed default behavior:

- Audit related code paths
- Decide whether to absorb the change or pin back

### 5. Verify the bundle still works

For runtime deps (currently only `@twemoji/parser`):

```bash
npm run build
node -e "console.log(require('./dist/index.js').parse('hello :smile: 🚀'))"
```

Expected: HTML output with valid Twemoji URLs. If the URLs look wrong, the bump changed the URL format — that's a breaking change for consumers. Bump the package's major version.

### 6. Update docs

If the bump:

- **Adds or renames a public API** used in docs → update [`docs/TECHNOLOGIES.md`](../../docs/TECHNOLOGIES.md), [`docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md)
- **Affects the build** (Webpack, ts-loader, ts-node version) → update [`docs/BUILD_DEPLOY.md`](../../docs/BUILD_DEPLOY.md)
- **Affects testing** (mocha, chai) → update [`docs/TESTING_GUIDE.md`](../../docs/TESTING_GUIDE.md)
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
- `build:` — toolchain (Webpack, TypeScript, Node)

Examples:

```
chore: bump @twemoji/parser to 17.1.0
fix: bump @types/node to 24.10.3 (CVE-...)
build: bump typescript to 5.9.4
```

## Special cases

### `@twemoji/parser`

The only runtime dependency. Bumps can change:

- **CDN URL format** — historically rare; if it changes, every snapshot test in `main.test.ts` breaks. **Major version bump for our package**
- **Available emojis** — additive; no test breaks
- **Variation selector handling** — sometimes Twemoji decides to render an emoji differently with/without VS-16

After bumping:

```bash
npm test                                   # snapshots will break if URL format changed
npm run build && node -e "console.log(require('./dist/index.js').parse('🚀'))"
```

If snapshots break, decide between:

- **Update snapshots + bump our major** (preferred — consumers need to update their snapshots)
- **Pin Twemoji back** (if the change is undesirable)

### `typescript`

Type-only changes can ripple through the `.d.ts` we ship. After bumping:

```bash
npm run build:tsc                    # check the .d.ts compiles cleanly
npm pack                             # generate a tarball
# install in a sample project to verify types still work for consumers
```

Major TypeScript bumps may shift inferred types in `.d.ts` — review the diff.

### Webpack 5 → 6

Currently we're on Webpack 5. A future Webpack 6 will likely require config changes. When that bump comes, plan to:

1. Bump `webpack` and `webpack-cli` together
2. Audit `webpack.config.js` for deprecated APIs
3. Verify `dist/index.js` still has `module.exports = uEmojiParser` (the dual-export shape depends on `commonjs2`)

### `mocha` major bumps

Mocha occasionally drops Node version support. Verify our `engines.node` is still compatible.

### `node-version` in CI workflows

If we bump `engines.node` in `package.json`, also bump the Node version in every CI workflow:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '24'
```

Don't drift CI Node from the package's stated minimum.

## Don't

- ❌ Bump `chai` or `eslint` without lifting `.ncurc.json` exclusions and committing to the migration
- ❌ Bump multiple unrelated libraries in one commit
- ❌ Inline a version in `package.json` `dependencies` to "test it real quick" — always go through `ncu` or manual edit + `npm install`
- ❌ Skip docs updates after a major bump
- ❌ Auto-merge a `@twemoji/parser` bump without reading release notes

## Do

- ✅ Read release notes (at minimum the headline changes)
- ✅ Run all five checks (lint, format, test, build, types) after bumping
- ✅ Update docs in the same commit
- ✅ Use conventional commit messages
- ✅ Treat `@twemoji/parser` URL format changes as breaking (major bump for our package)

## Verification checklist

- [ ] Edited only `package.json` (and re-ran `npm install` to regenerate locks if applicable)
- [ ] `npm run eslint:check` passes
- [ ] `npm run prettier:check` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `npm run build:tsc` succeeds (types compile)
- [ ] If `@twemoji/parser` was bumped, manual smoke-test of HTML output succeeded
- [ ] Docs updated for any documented version
- [ ] Conventional commit message
