---
name: npm-publish-walkthrough
description: Full release flow including GitHub Actions internals, manual fallback, and rollback strategies
---

# Skill: `npm-publish-walkthrough`

Comprehensive reference for releasing Universal Emoji Parser to npm. Covers the automated CI flow, the manual fallback, and what to do when things go wrong.

For the day-to-day procedural commands, see [`/release-npm`](../commands/release-npm.md). This skill explains the full picture.

## The release model

Universal Emoji Parser uses a **merge-to-main = release** model:

1. Every PR merge to `main` triggers `release_and_publish.yml`
2. The workflow patch-bumps the version (via `.github/scripts/prepare_release.sh`), builds, tags, creates a GitHub Release, and publishes to npm with `corepack pnpm publish --no-git-checks`
3. Humans don't run the release scripts or `pnpm publish` manually under normal conditions

Tradeoffs:

- ✅ Every change ships immediately — no batching, no delayed release
- ✅ Release notes are automatic
- ✅ Patch number reflects merge count
- ❌ Can't easily ship a major version (the workflow auto-runs a patch bump via `prepare_release.sh`)
- ❌ Unreviewable releases — by the time you see version X, it's already on npm

## The CI workflow in detail

`.github/workflows/release_and_publish.yml`. Trigger:

```yaml
on:
  pull_request:
    branches: [main]
    types: [closed]
```

…with `if: github.event.pull_request.merged == true` on every job (so closing-without-merging doesn't release).

### Jobs in order

#### 1. `check_pr_size_label`

Reads PR labels, looks for `Size - XS / S / M / L / XL / XXL` (set earlier by `pull_request_check.yml`), emits a colored emoji indicator. Pure metadata for the channel notification.

#### 2. `notify_on_channel_start`

Posts "deployment started" to a DailyBot Slack-like channel via:

```
POST https://api.dailybot.com/v1/send-message/
Headers: X-API-KEY: ${{ secrets.DAILYBOT_API_KEY }}
```

Includes PR number, title, body, size label, workflow URL.

#### 3. `deploy_setup`

```yaml
- uses: actions/checkout@v4
- run: corepack enable
- uses: actions/setup-node@v4
  with: { node-version: '24.16.0' }
- uses: actions/cache@v4
  with:
    path: ~/.local/share/pnpm/store   # the pnpm content-addressed store
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('pnpm-lock.yaml') }}
- run: corepack pnpm install --frozen-lockfile
```

The cache key is keyed on `pnpm-lock.yaml`'s hash — which **is** committed — so the cache invalidates precisely when dependencies change. `--frozen-lockfile` makes the install fail (rather than silently mutate the lockfile) if `package.json` and `pnpm-lock.yaml` are out of sync, which is what you want in CI.

`corepack enable` provisions the pinned `pnpm@11.1.2` (from `"packageManager"` in `package.json`) before any install step.

#### 4. `deploy_validate_linters_and_code_format`

```yaml
- run: corepack pnpm run biome:check
```

Hard gate. A single `biome check` covers both linting and formatting. Must pass.

#### 5. `deploy_tests`

```yaml
- run: corepack pnpm run test
```

All Vitest specs must pass (`vitest run`). The regenerator test (`prepareEmojiLibJson.test.ts`) is `it.skip`'d so it doesn't run.

#### 6. `build`

```yaml
- run: |
    corepack pnpm run build
    if [ ! -d "dist" ]; then
      echo "⚠️ Error: dist folder does not exist."
      exit 1
    fi
```

Vite library build. `pnpm run build` runs `vite build && tsc -p tsconfig.build.json --emitDeclarationOnly` (the `tsc` step is inlined into the `build` script), emitting `dist/index.d.ts` + `dist/lib/type.d.ts` alongside the single minified CJS `dist/index.js` (~403 KB). The output (`dist/`) is cached for the publish job.

> **Always run `pnpm run build`, not `vite build` alone** — `vite build` skips the `tsc --emitDeclarationOnly` step, so the published tarball would ship without `dist/index.d.ts` and consumers would report "no types." The `build` script chains both steps so declarations are always emitted.

#### 7. `release_and_publish`

The actual release. Steps:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: '30' # need history for release notes
    token: ${{ secrets.AUTOMATION_GITHUB_TOKEN }}
- uses: actions/setup-node@v4
  with:
    node-version: '24.16.0'
    registry-url: https://registry.npmjs.org/
- run: |
    git config user.name "🤖 DailyBot"
    git config user.email "ops@dailybot.com"
- run: |
    bash .github/scripts/get_github_release_log.sh
    if [[ ! -f git_logs_output.txt ]]; then
      echo "⚠️ No description found for release body content."
      exit 1
    fi
- run: |
    bash .github/scripts/prepare_release.sh   # Node patch bump + commit + tag "[🤖 DailyBot] New release to v%s launched 🚀"
    git push --follow-tags origin main
- run: |
    GITHUB_RELEASE_TAG=$(git describe --tags $(git rev-list --tags --max-count=1))
    if [[ -z $GITHUB_RELEASE_TAG ]]; then
      echo "⚠️ No release tag found."
      exit 1
    fi
    echo "::set-env name=GITHUB_RELEASE_TAG::$GITHUB_RELEASE_TAG"
  env:
    ACTIONS_ALLOW_UNSECURE_COMMANDS: true
- uses: ncipollo/release-action@v1
  with:
    name: Release ${{ env.GITHUB_RELEASE_TAG }}
    tag: ${{ env.GITHUB_RELEASE_TAG }}
    bodyFile: git_logs_output.txt
    token: ${{ secrets.AUTOMATION_GITHUB_TOKEN }}
- run: |
    if [ ! -d "dist" ]; then
      echo "⚠️ Error: dist folder does not exist."
      exit 1
    fi
    corepack pnpm publish --no-git-checks
    echo "package_version=$(npm pkg get version)" >> $GITHUB_OUTPUT
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
- run: |
    PR_MERGED=$(jq --raw-output .pull_request.merged "$GITHUB_EVENT_PATH")
    if [ "$PR_MERGED" = "true" ]; then
      git push origin --delete "${{ github.event.pull_request.head.ref }}"
    fi
```

Note the `ACTIONS_ALLOW_UNSECURE_COMMANDS: true` and `::set-env`. These are deprecated GitHub Actions syntax (set-env was disabled by default in 2020). The workflow predates the modern alternative (`echo "TAG=..." >> $GITHUB_ENV`). It still works because of the explicit `ACTIONS_ALLOW_UNSECURE_COMMANDS` toggle, but it's a tech-debt item — eventually GitHub may remove it. When that happens, fix the syntax:

```bash
echo "GITHUB_RELEASE_TAG=$GITHUB_RELEASE_TAG" >> $GITHUB_ENV
```

#### 8. `cleanup_caches`

Triggers `cleanup_caches.yml` via `repository_dispatch` to GC stale GHA caches.

#### 9. `notify_on_channel_end`

`if: always()` — runs even if earlier jobs failed. Posts the per-job status (✅/❌/⏩/❓) plus overall success/failure to the DailyBot channel. On failure, includes `vars.USERS_TO_NOTIFY` (a Slack mention list).

## The release notes script

`.github/scripts/get_github_release_log.sh`:

```bash
git log --pretty=oneline | sed 's/[^ ]* *//' > git_logs.txt

while read text_line; do
  if [[ "$text_line" =~ "[🤖 DailyBot] New release to v" ]]; then
    break
  fi
  if [[ ! "$text_line" =~ "Merge branch 'main'" ]] && [[ ! "$text_line" =~ "Merge pull request" ]]; then
    echo "🚩 $text_line" >> git_logs_output.txt
  fi
done < git_logs.txt
```

Walks `git log` from HEAD until the previous `[🤖 DailyBot] New release to v` commit, collects everything in between (skipping merge commits), prefixes each with `🚩`. The result is the body of the GitHub Release.

Implications:

- **The bot's commit message format is the boundary marker** — if you change it, you must also change the regex in this script
- **Release notes are commit-message-quality** — write good commit messages; they become the changelog
- **Merges are filtered** — if your repo's merge style is "Squash and merge," the squash commit's message is what's recorded (good); if "Create a merge commit," the merge message is filtered (so the underlying commits are preserved as long as they're not squashed away)

## The version-bump step (`prepare_release.sh`)

```bash
bash .github/scripts/prepare_release.sh
```

What this does:

1. Refuses to run if **tracked** files have uncommitted changes (untracked/gitignored build artifacts like `dist/` are fine)
2. Reads current version from `package.json`
3. Increments the patch number with a small Node script (e.g., `2.0.79` → `2.0.80`)
4. Stages `package.json` (and `pnpm-lock.yaml` if present)
5. Creates a git commit: `[🤖 DailyBot] New release to v2.0.80 launched 🚀`
6. Creates an annotated git tag: `v2.0.80`

It bumps with Node rather than `pnpm version` deliberately: pnpm v11 runs `git status --porcelain` upfront and aborts with `ERR_PNPM_UNCLEAN_WORKING_TREE` when the tree carries transient install artifacts (e.g. esbuild's postinstall after `pnpm install --frozen-lockfile`). The Node bump only touches `package.json` and is safe regardless of untracked state.

If `prepare_release.sh` fails (tracked files dirty, nothing to bump), the workflow aborts and no release happens.

### Why patch only

The script is hardcoded to a patch increment. The legacy `release` script in `package.json` (kept for reference) was:

```json
"release": "npm version patch -m \"[🤖 DailyBot] New release to v%s launched 🚀\""
```

For minor or major releases, you have two options:

**Option A: Manually pre-bump in the PR**

In the PR that triggers a minor release:

```bash
# In your PR branch, before final review
$EDITOR package.json   # change version from 2.0.79 to 2.1.0
git commit -am "chore: bump version to 2.1.0 for release"
git push
# Merge the PR
# Workflow runs prepare_release.sh (patch bump), bumps 2.1.0 → 2.1.1
# Final published version is 2.1.1, not 2.1.0
```

That last detail (`2.1.1`, not `2.1.0`) means the "minor" version users see is the `.1` patch — minor enough not to matter for semver, awkward for release notes.

**Option B: Disable auto-bump for the release**

Edit the workflow temporarily to skip `prepare_release.sh`, set the target minor version in `package.json` and commit + tag locally (preserving the `[🤖 DailyBot] New release to v%s launched 🚀` message), push the tag, re-enable the workflow. More involved.

Neither is great. A future improvement: add a `[skip auto-bump]` PR-title convention or a `release-type: minor` PR label that the workflow honors.

## Manual release procedure

Required when: CI is down, the workflow is broken, an emergency hotfix needs to ship in minutes.

See [`/release-npm`](../commands/release-npm.md) for the procedural walkthrough. Key points:

1. **Always run the full check sequence** (`corepack pnpm run biome:check`, `corepack pnpm run test`, `corepack pnpm run build`) — never publish unverified
2. **Use `bash .github/scripts/prepare_release.sh`** to bump + commit + tag atomically (don't edit `package.json` by hand for a patch)
3. **`git push --follow-tags`** — pushing without `--follow-tags` leaves the tag local
4. **`corepack pnpm publish --no-git-checks`** requires `npm login` or a `NODE_AUTH_TOKEN` env var
5. **Smoke-test in a fresh directory** after publish — `corepack pnpm add` the published version and verify

## Rollback strategies

### Within 72 hours of publish, with no downloads

```bash
npm unpublish universal-emoji-parser@<bad-version> --force
```

This is the only way to make the bad version disappear from npm. Limited window.

### After 72 hours

You can't unpublish. Two options:

**Deprecate**:

```bash
npm deprecate universal-emoji-parser@<bad-version> "Broken; use <good-version>"
```

Adds a console warning when consumers install the deprecated version. Doesn't block install.

**Publish a fix**:

Bump again (usually patch) with the fix and ship. Consumers `npm update` to get the fix.

For severe issues (security, malware in a dep), npm support can intervene faster — open a ticket.

## Common failure modes

### `pnpm publish` 401 Unauthorized

- `secrets.NPM_TOKEN` is expired
- Token is account-wide but doesn't have the new package's name in its allowlist
- Account 2FA is `auth-and-writes` mode and the automation token can't satisfy it (use an automation-type token specifically — npm distinguishes)

Fix: regenerate the token in npm settings → Profile → Access Tokens → Generate New Token → "Automation". Update `secrets.NPM_TOKEN` in GitHub repo settings.

### `prepare_release.sh` says tracked files have uncommitted changes

A prior step modified a **tracked** file. (Untracked/gitignored artifacts like `dist/` are tolerated — the script only checks `git diff --quiet HEAD -- .`.) Common causes:

- A test wrote to a tracked file in the repo (regenerator, sloppy test)
- A tracked config or source file was modified between checkout and the release step
- A stray `package-lock.json` was committed (the lockfile is `pnpm-lock.yaml`; bare `npm` must not be used)

Fix: add the offending file to `.gitignore`, or `git checkout -- .` before re-running `prepare_release.sh`.

> Note: this is also why the script uses a Node bump instead of `pnpm version` — `pnpm version` would reject the run with `ERR_PNPM_UNCLEAN_WORKING_TREE` even for harmless untracked build artifacts.

### `git push --follow-tags` rejected

Branch protection on `main` requires PRs, blocking direct pushes. The workflow needs a way through:

- Use a fine-grained PAT or GitHub App token with **bypass branch protection** privileges
- Or weaken branch protection for the bot user
- Or change the workflow to not push directly (push to a release branch, then merge — much more complex)

### `actions/cache` cache miss every run

The cache key is `hashFiles('pnpm-lock.yaml')`, and `pnpm-lock.yaml` **is** committed, so the key changes only when dependencies change — exactly the desired behavior. If you ever need to force-refresh, bump the cache key suffix:

```yaml
key: ${{ runner.os }}-pnpm-store-v2-${{ hashFiles('pnpm-lock.yaml') }}
```

## Runtime dependencies

The published package has **zero runtime dependencies**. Vite's library build inlines `@twemoji/parser` into the single `dist/index.js` bundle (~403 KB), so nothing is installed transitively into a consumer's `node_modules` for this package.

`@twemoji/parser` is pinned to exactly **`17.0.1`** — it's listed in the `reject` array of `.ncurc.json` because `17.0.2` regressed U+FE0F (variation selector) handling. Don't bump it without verifying the regression is fixed upstream.

## What gets published

`.npmignore` controls the tarball:

```
Excluded:
  .vscode_example, .vscode, .devcontainer_example, .devcontainer
  src, test
  .babelrc, .env, .env_example
  .gitignore, .travis.yml
  package-lock.json   (legacy entry; the lockfile is now pnpm-lock.yaml)
  tsconfig.json, tsconfig.build.json, vite.config.ts, vitest.config.ts
  docker, .github
  biome.json (single Biome lint + format config)
  get_github_release_log.sh
  git_logs.txt, git_logs_output.txt
  .editorconfig

Included by default (everything not excluded):
  dist/index.js
  dist/index.d.ts
  dist/lib/type.d.ts
  dist/*.map
  package.json
  README.md
  LICENSE
```

Verify before publishing:

```bash
corepack pnpm pack --dry-run
```

If the output includes `src/`, `test/`, or config files, fix `.npmignore`.

## Side effect: branch deletion

The final step of `release_and_publish.yml`:

```bash
git push origin --delete "${{ github.event.pull_request.head.ref }}"
```

Deletes the source branch of the merged PR. This is convenient (keeps the branch list clean) but **irreversible** — you can't recover the branch from GitHub UI after this.

If a developer wants to keep their branch (e.g., for follow-up PRs), they have to either:

- Re-push the branch after the release runs
- Make a backup tag before merging

This isn't documented prominently anywhere — be prepared for the question.

## Notifications

The workflow posts to a DailyBot Slack-like channel using:

- `secrets.DAILYBOT_API_KEY` — auth header
- `vars.DAILYBOT_DEPLOYMENT_NOTIFICATION_CHANNEL` — channel ID
- `vars.DAILYBOT_WORKFLOWS_NOTIFICATION_CHANNEL` — channel ID for `check_packages_versions.yml`
- `vars.USERS_TO_NOTIFY` — Slack mention list for failures

If you fork and don't use DailyBot, either:

1. Replace the curl calls with your own webhook (Slack, Discord, Teams)
2. Strip the `notify_on_channel_*` jobs and dependencies entirely

Without the secrets/vars, the curl calls fail silently — the rest of the pipeline still works, but you lose visibility.

## Why this is over-engineered for a small library

Honest answer: it isn't, for DailyBot's organizational needs. The size labels, the channel notifications, the auto-merge of dep PRs — these reflect a pattern DailyBot uses across many small libraries. Forking this for a different organization will likely simplify.

For a fork, see [Fork Customization → Step 5](../../docs/FORK_CUSTOMIZATION.md#step-5--ci-release-workflows).
