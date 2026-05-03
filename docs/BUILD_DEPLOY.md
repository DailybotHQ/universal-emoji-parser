# Build & Deploy

How Universal Emoji Parser is built, versioned, and published. The release path is **fully automated** via GitHub Actions — humans rarely run any of the commands in this document by hand.

## Inputs you need before any release

- **GitHub remote** with push + tag access for the release bot (`secrets.AUTOMATION_GITHUB_TOKEN`)
- **npm publish access** for the `universal-emoji-parser` package (`secrets.NPM_TOKEN`)
- **DailyBot notification credentials** (`secrets.DAILYBOT_API_KEY`, `vars.DAILYBOT_DEPLOYMENT_NOTIFICATION_CHANNEL`) — non-blocking; messages just fail silently if absent

The fork checklist for these is in [Fork Customization](FORK_CUSTOMIZATION.md).

---

## The build artifact

`npm run build` produces a single bundle in `dist/`:

```
dist/
├── index.js          ← Webpack production bundle (~600 KB minified, catalog inlined)
├── index.js.map      ← Source map (production: minimal; dev: full)
├── index.d.ts        ← TypeScript declarations (emitted by tsc --build separately)
└── lib/
    └── type.d.ts     ← Re-exported interface types
```

`package.json` points consumers at:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

`dist/` is **gitignored**. CI rebuilds it before publishing; nobody commits it.

### Manual build

```bash
npm run build              # Webpack production (minified, single file, CleanWebpackPlugin)
npm run build:tsc          # tsc --build (emits .d.ts)
```

**Both** must run before `npm publish` because:

- Webpack produces `dist/index.js` (executable)
- tsc produces `dist/index.d.ts` (types)

The CI workflow runs `npm run build` (which is Webpack-only) — that's enough because Webpack with `ts-loader` also emits declarations when configured. Currently it doesn't, so tsc is the source of truth for `.d.ts`. **If you find missing types in the published package, add `npm run build:tsc` to the release workflow before `npm publish`.**

### Inspecting the bundle

```bash
ls -lh dist/index.js                              # Bundle size
node -e "console.log(Object.keys(require('./dist/index.js')))"   # Exported keys
node -e "console.log(require('./dist/index.js').parse('hello :smile:'))"   # Smoke run
```

The exported keys should be: `default`, `DEFAULT_EMOJI_CDN`, `emojiLibJsonData`, plus the `parse`, `parseToHtml`, etc. methods on the default. The CommonJS reattachment in `src/index.ts` ensures `require('./dist/index.js')` returns `uEmojiParser` directly (not `{ default: uEmojiParser }`).

---

## Versioning

The package follows **Semantic Versioning** (loosely):

- **Patch** (e.g., `2.0.79` → `2.0.80`) — bug fixes, catalog regenerations, dep bumps without API change. CI auto-bumps on every PR merge
- **Minor** (e.g., `2.0.x` → `2.1.0`) — new methods, new options, new catalog fields. **Manually bump** before merging
- **Major** (e.g., `2.x` → `3.0`) — HTML output template change, default option flip, removed/renamed method, dual-export break, dropped Node version

CI's `npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"` is the right default.

### How to ship a non-patch release

The release workflow auto-runs `npm version patch`, which fails if the working tree is dirty or if the new version already exists. To ship a minor or major:

1. **In the same PR**, edit `package.json` `"version"` manually to the next minor or major (e.g., `2.0.79` → `2.1.0` or `3.0.0`)
2. Note in the PR description that this is a non-patch release
3. The workflow's `npm version patch` will then bump from `2.1.0` → `2.1.1` (or `3.0.0` → `3.0.1`) — which is fine
4. **Or**: temporarily disable the auto-bump in the workflow for that release, manually run `npm version minor`/`major` locally, push the tag, and re-enable the workflow

Right now the workflow has no toggle — modifying it is the way. File an issue if this happens often; we'll add a `[skip auto-bump]` PR-title convention.

---

## CI release pipeline

`.github/workflows/release_and_publish.yml` runs on:

```yaml
on:
  pull_request:
    branches: [main]
    types: [closed]
```

…and gates every step on `if: github.event.pull_request.merged == true` (so closing a PR without merging doesn't trigger a release).

### Job graph

```
                                check_pr_size_label
                                       │
                                       ▼
                              notify_on_channel_start
                                       │
                                       ▼
                                  deploy_setup
                                  (npm install)
                                       │
                                       ▼
                deploy_validate_linters_and_code_format
                       (eslint:check + prettier:check)
                                       │
                                       ▼
                                  deploy_tests
                                   (npm test)
                                       │
                                       ▼
                                      build
                                  (npm run build)
                                       │
                                       ▼
                            release_and_publish
                       (version bump + tag + GH release + npm publish)
                                       │
                            ┌──────────┴──────────┐
                            ▼                     ▼
                     cleanup_caches      notify_on_channel_end
```

Every job runs on `ubuntu-latest` with Node `22.13.1` and aggressive caching of `~/.npm`, `node_modules`, and `dist/`.

### Job-by-job

#### 1. `check_pr_size_label`

Reads the PR's labels for one of `Size - XS / S / M / L / XL / XXL` (set by `pull_request_check.yml`) and emits an emoji indicator (`🟢`/`🟡`/`🟠`/`🔴`) used in the channel notification. Pure metadata — doesn't gate the release.

#### 2. `notify_on_channel_start`

Posts a "deployment started" message to the DailyBot channel via `https://api.dailybot.com/v1/send-message/`. Includes PR number, title, body, size label, and workflow URL.

#### 3. `deploy_setup`

`actions/checkout@v4` + `actions/setup-node@v4` (Node 22.13.1) + cache `~/.npm` and `node_modules`. If cache miss, runs `npm install`.

#### 4. `deploy_validate_linters_and_code_format`

```yaml
- run: npm run eslint:check
- run: npm run prettier:check
```

Hard gate. Fails the whole pipeline if either lint check fails.

#### 5. `deploy_tests`

`npm run test` — Mocha + Chai over `test/**.test.ts`. Hard gate.

#### 6. `build`

```yaml
- run: |
    npm run build
    if [ ! -d "dist" ]; then
      echo "⚠️ Error: dist folder does not exist."
      exit 1
    fi
```

Webpack production build. Caches `dist/` so the next job can publish without rebuilding.

> **Gotcha:** the workflow doesn't run `npm run build:tsc` — only Webpack. If a consumer reports missing types in a published version, that's why. Fix is to add `npm run build:tsc` to the build job (a one-line change).

#### 7. `release_and_publish`

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: '30'                 # need history for release notes
    token: ${{ secrets.AUTOMATION_GITHUB_TOKEN }}
- uses: actions/setup-node@v4
  with:
    node-version: '22.13.1'
    registry-url: https://registry.npmjs.org/
- run: |
    git config user.name "🤖 DailyBot"
    git config user.email "ops@dailybot.com"
- run: |
    bash .github/scripts/get_github_release_log.sh
- run: |
    npm run release
    git push --follow-tags origin main
- run: |
    GITHUB_RELEASE_TAG=$(git describe --tags $(git rev-list --tags --max-count=1))
    echo "::set-env name=GITHUB_RELEASE_TAG::$GITHUB_RELEASE_TAG"
- uses: ncipollo/release-action@v1
  with:
    name: Release ${{ env.GITHUB_RELEASE_TAG }}
    tag: ${{ env.GITHUB_RELEASE_TAG }}
    bodyFile: git_logs_output.txt
    token: ${{ secrets.AUTOMATION_GITHUB_TOKEN }}
- run: |
    npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
- run: |
    git push origin --delete "${{ github.event.pull_request.head.ref }}"
```

Steps in order:

1. **Checkout** with token + 30-commit history (for the release notes script)
2. **Identity** — git as `🤖 DailyBot <ops@dailybot.com>`
3. **Release notes** — `get_github_release_log.sh` walks `git log` from HEAD until it hits the previous `[🤖 DailyBot] New release to v...` commit, formats each as `🚩 <message>`, writes `git_logs_output.txt`
4. **Bump version** — `npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"` updates `package.json`, creates a tag, commits
5. **Push** — `git push --follow-tags origin main` (sends the version commit + the tag)
6. **GitHub Release** — `ncipollo/release-action@v1` creates a Release with notes from step 3
7. **npm publish** — uses `secrets.NPM_TOKEN` via `NODE_AUTH_TOKEN`. The package goes live on npm
8. **Delete source branch** — tidies up the merged feature branch

#### 8. `cleanup_caches`

Triggers `cleanup_caches.yml` via `repository_dispatch` to GC stale GHA caches.

#### 9. `notify_on_channel_end`

Posts the final status (success/failure per job) to the DailyBot channel. Always runs (`if: always()`) so failures get reported even when an earlier job blew up.

---

## What gets published to npm

`.npmignore` excludes everything except what consumers need:

| Included in tarball | Excluded |
|---|---|
| `dist/` | `src/` |
| `package.json` | `test/` |
| `README.md` | `webpack.config.js`, `tsconfig.json`, `.babelrc`, `.eslintrc`, `.prettierrc`, `.editorconfig` |
| `LICENSE` | `.github/`, `docker/`, `.vscode/`, `.devcontainer/`, `.agents/`, `.claude/`, `docs/` |
| | `package-lock.json`, `git_logs*.txt`, `packages_upgrades*.txt`, `emoji-lib-output.json` |

Verify what would publish without actually publishing:

```bash
npm pack --dry-run                  # Lists files; does not publish
npm pack                            # Creates universal-emoji-parser-X.Y.Z.tgz locally
tar tzf universal-emoji-parser-*.tgz | sort
```

If you ever see `src/`, `test/`, or config files in the tarball, fix `.npmignore`.

---

## Manual release (CI down or emergency)

```bash
# 0. Make sure main is clean and up to date
git checkout main
git pull
git status                          # must be clean

# 1. Lint, test, build
npm install
npm run eslint:check
npm run prettier:check
npm test
npm run build
npm run build:tsc

# 2. Bump version (this commits + tags)
npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"

# 3. Push commit + tag
git push --follow-tags origin main

# 4. Generate release notes
bash .github/scripts/get_github_release_log.sh
cat git_logs_output.txt             # review

# 5. Publish to npm (must have NPM_TOKEN configured or be logged in)
npm publish

# 6. Create the GitHub release manually via gh CLI
TAG=$(git describe --tags --abbrev=0)
gh release create "$TAG" --notes-file git_logs_output.txt --title "Release $TAG"
```

This bypasses the DailyBot notifications and the cache cleanup — if you're doing a manual release, you've already accepted that those won't fire.

Walk through [`/release-npm`](../.agents/commands/release-npm.md) for the structured version.

---

## Pull request workflows (gating, not releasing)

### `code_check.yml` — runs on every PR

Three jobs: `setup` → `validate_linters_and_code_format` → `tests`. Gates merging.

### `pull_request_check.yml` — runs on PR open/edit

Computes the PR size label from `git diff --shortstat` (lines added + removed) and applies one of `Size - XS / S / M / L / XL / XXL`. Posts a warning comment for L+. Also enforces minimum title length (10 chars) and body length (30 chars).

These exist for review hygiene; they don't directly affect the release.

---

## Dependency upgrade pipeline

### `check_packages_versions.yml` — runs every Tuesday 15:00 UTC

1. Checks out a branch named `feature__packages_versions_update` (creates if missing)
2. Runs `npm run ncu:upgrade` (respects `.ncurc.json` — chai 4 / eslint 8 stay pinned)
3. If anything upgraded, commits `Upgrading packages versions`, pushes the branch
4. Opens a PR titled `🤖 Upgrading packages versions` with the upgrade list as body
5. Notifies DailyBot

### `check_and_merge_packages_upgrades_pr.yml`

Auto-merges that PR when CI is green. The merged PR then triggers `release_and_publish.yml`, which patch-bumps and publishes — the dep upgrade ships within hours.

This is fully automated; humans only review when something breaks.

---

## Forking the release infrastructure

If you're forking this repo (see [Fork Customization](FORK_CUSTOMIZATION.md)):

1. **Create a `secrets.NPM_TOKEN`** in your fork's GitHub repo settings (npm → Profile → Access Tokens → Generate New Token, select "Automation")
2. **Create a `secrets.AUTOMATION_GITHUB_TOKEN`** — a fine-grained PAT or GitHub App token with `contents: write`, `pull-requests: write`, `metadata: read` on the fork
3. **Either set or unset DailyBot vars/secrets** — without them the notification steps fail (silently for `success` runs, visibly for `failure` runs). Easiest path: gut the `notify_on_channel_*` jobs from your fork's workflow
4. **Update the package name** in `package.json` to your scoped package (`@myorg/emoji-parser`) so npm publish doesn't conflict

---

## Common build failures

### `npm publish` 403 Forbidden

- `NPM_TOKEN` expired or wrong scope (needs `automation` or `publish`)
- Package name conflict — the name `universal-emoji-parser` is taken by this repo; if you fork and rename, register the new name first
- Org permission missing — for scoped packages, the publishing user must have `developer` or above in the org

### Webpack build is empty / missing methods

- `ts-loader` failed silently — check `dist/index.js` size; if it's tiny (<10 KB), the catalog wasn't bundled. Likely a `tsconfig.json` change broke `resolveJsonModule: true`

### `git push --follow-tags` rejected

- Branch protection on `main` requires PRs — but the release workflow pushes directly. Verify the bot's token has the "bypass branch protection" toggle enabled, or weaken protection for that token
- Tag already exists — manual push happened previously; delete the local tag and let CI retry

### npm version says "git working tree is not clean"

- A previous step modified files (e.g., a test wrote to `dist/`). The workflow caches `dist/` between jobs; if it's dirty, the version bump aborts
- Manual fix: `git checkout -- .` before `npm version`, or stage cleanly

---

## Deployment checklist

- [ ] `npm run eslint:check` succeeds
- [ ] `npm run prettier:check` succeeds
- [ ] `npm test` passes
- [ ] `npm run build` produces `dist/index.js`
- [ ] `npm run build:tsc` produces `dist/index.d.ts` (manual releases only — CI doesn't)
- [ ] `npm pack --dry-run` shows only the expected files
- [ ] No `console.log` in `src/`
- [ ] `package.json` `version` reflects the intent (patch/minor/major)
- [ ] Release notes draft makes sense (`bash .github/scripts/get_github_release_log.sh && cat git_logs_output.txt`)
- [ ] `NPM_TOKEN` and `AUTOMATION_GITHUB_TOKEN` are valid (CI will fail fast if not)
