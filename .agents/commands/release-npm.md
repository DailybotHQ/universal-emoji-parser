---
name: release-npm
description: Walk through a manual npm release if CI is unavailable
---

# Command: `/release-npm`

Manually publish a release when CI can't (CI is down, the workflow was disabled, or a hotfix needs to ship outside the PR-merge cycle).

## When to use

- **Emergency hotfix** — a critical bug needs publishing in minutes, not waiting for the full PR cycle
- **CI workflow is broken** — the release pipeline failed and isn't easily fixable
- **First-ever release on a fork** — sometimes the first npm publish needs `--access public` interactively

> **Default**: don't run this. The CI release on PR merge is the canonical path. Manual releases skip notifications and may produce unsigned commits if your local git config differs.

## Inputs to confirm

- **Why manual** — be explicit; this should be exceptional
- **Version bump type** — patch (default), minor, or major
- **Auth** — confirm you have `NPM_TOKEN` set or `npm login` completed
- **Release notes** — what to put in the GitHub Release body

## Procedure

### 1. Verify the working tree

```bash
git checkout main
git pull
git status                          # must be clean
```

If `main` is dirty or behind the remote, fix that first. A manual release from a divergent state is how you ship the wrong code.

### 2. Run the full check sequence

```bash
npm install
npm run eslint:check
npm run prettier:check
npm test
npm run build
npm run build:tsc
```

All five must pass. **Don't proceed if any fail** — the published artifact would be broken.

### 3. Verify the bundle

```bash
ls -lh dist/                         # index.js (~600 KB), index.d.ts, *.map
node -e "console.log(Object.keys(require('./dist/index.js')))"
node -e "console.log(require('./dist/index.js').parse('hello :smile: 🚀'))"
```

Expected: the keys include `default`, `DEFAULT_EMOJI_CDN`, `emojiLibJsonData`, plus the methods on the default. The smoke-run produces valid HTML.

### 4. Verify the npm tarball contents

```bash
npm pack --dry-run
```

Expected files:

```
dist/index.js
dist/index.js.map
dist/index.d.ts
dist/lib/type.d.ts
package.json
README.md
LICENSE
```

If you see `src/`, `test/`, or config files, fix `.npmignore` before publishing. **Once published, you can't take a version back** (unless within 72 hours and no one's downloaded it).

### 5. Bump the version

For a patch (default):

```bash
npm version patch -m "[🤖 DailyBot] New release to v%s launched 🚀"
```

For minor or major:

```bash
npm version minor -m "[🤖 DailyBot] New release to v%s launched 🚀"
npm version major -m "[🤖 DailyBot] New release to v%s launched 🚀"
```

This:

- Updates `package.json` `"version"`
- Creates a commit with the message above (substituting `%s` with the new version)
- Creates a git tag `v<new-version>`

### 6. Push the version commit and tag

```bash
git push --follow-tags origin main
```

If branch protection on `main` rejects direct pushes from your account, you need a temporary exemption — that's a CI / org-policy issue. Either:

- Have an admin temporarily disable branch protection
- Or push from a bot account that's exempt

### 7. Generate release notes

```bash
bash .github/scripts/get_github_release_log.sh
cat git_logs_output.txt
```

The script walks `git log` from HEAD until it hits the previous `[🤖 DailyBot] New release to v` commit, formatting each line with `🚩 `. Review the output — edit `git_logs_output.txt` if something's missing or wrong.

If this is a fresh fork's first release (no prior release commit), the script dumps the entire git history. Either truncate it manually or write the release notes from scratch.

### 8. Create the GitHub Release

Using the `gh` CLI (recommended):

```bash
TAG=$(git describe --tags --abbrev=0)
gh release create "$TAG" \
  --title "Release $TAG" \
  --notes-file git_logs_output.txt
```

Or via the GitHub web UI: Releases → Draft a new release → pick the tag, paste the notes from `git_logs_output.txt`.

### 9. Publish to npm

```bash
npm whoami                          # confirm you're logged in
npm publish
```

If the package is scoped (`@org/name`) and this is the **first** publish:

```bash
npm publish --access public         # for public packages
# or
npm publish --access restricted     # for private packages
```

After this command, the version is **live** on npm — anyone can `npm install` it. You **cannot** unpublish (within 72 hours, you can `npm unpublish` if no one has downloaded it; after that, you have to publish a new patch).

### 10. Verify the publish

```bash
npm view universal-emoji-parser version          # should report the new version
npm view universal-emoji-parser dist-tags
```

Smoke-test in a fresh directory:

```bash
mkdir /tmp/verify-release
cd /tmp/verify-release
npm init -y
npm install universal-emoji-parser@latest
node -e "console.log(require('universal-emoji-parser').parse('hello :smile:'))"
```

Expected: HTML output. If anything's wrong, the published artifact is broken.

### 11. Tag cleanup (if needed)

If you discovered a problem **before** running `npm publish`, you can roll back:

```bash
git reset --hard HEAD~1              # undo the npm version commit
git tag -d v<bad-version>            # delete the local tag
git push origin :refs/tags/v<bad-version>   # delete the remote tag
```

Then fix the issue and start over from step 2. **Only safe before publishing**; after `npm publish` the version is sealed.

### 12. Optional: notify

The CI workflow notifies a DailyBot channel on success. A manual release skips this. If the team needs to know:

```bash
# Manual Slack message, GitHub Discussions post, or in-person mention
```

## Rollback (after publishing)

You can't unpublish a version older than 72 hours. To "fix" a broken release:

1. Identify the issue
2. Bump again (patch) with the fix
3. Publish the new patch
4. Optionally: deprecate the broken version

```bash
npm deprecate universal-emoji-parser@<bad-version> "Broken; use <good-version>"
```

This adds a warning when consumers install the bad version. It doesn't block install.

## Pitfalls

1. **Forgetting `npm run build:tsc`** — Webpack only emits `index.js`; tsc emits `index.d.ts`. Skipping `build:tsc` means consumers' TypeScript projects break. CI's release workflow has the same gap; fix it eventually
2. **Stale `dist/`** — if you skip `npm run build`, you publish whatever was previously in `dist/`. Always rebuild before publishing
3. **Pushing tag without commit** — `git push origin v<version>` without `--follow-tags` pushes the tag but not the version commit. Always use `--follow-tags`
4. **Missing release notes** — the GitHub Release without notes looks unprofessional. Generate them before creating the release
5. **Version skew between `package.json` and the tag** — if `npm version` failed midway, `package.json` may report `2.0.80` but no tag was created. Always re-run `npm version` cleanly

## Don't

- ❌ Skip the lint + test + build sequence — never publish unverified
- ❌ Edit `package.json` `version` by hand — always use `npm version` (it commits + tags atomically)
- ❌ `npm publish` from a feature branch — only release from `main`
- ❌ `npm publish --force` — that's for republishing, not for skipping checks
- ❌ Forget to push the tag (`--follow-tags`) — the GitHub Release won't have a commit to anchor to

## Do

- ✅ Verify with `npm pack --dry-run` before publishing
- ✅ Smoke-test the published version in a fresh directory after publish
- ✅ Document why a manual release was needed (PR comment, post-incident)
- ✅ Restore CI promptly so the next release can be automated again

## Verification checklist

- [ ] Working tree clean; on `main`; up to date with origin
- [ ] All five checks pass (lint, format, test, build, types)
- [ ] `npm pack --dry-run` shows only expected files
- [ ] `npm version patch/minor/major` succeeded
- [ ] `git push --follow-tags origin main` succeeded
- [ ] GitHub Release created with notes
- [ ] `npm publish` succeeded
- [ ] Verified via `npm install` in a fresh directory
- [ ] Team / channel notified if relevant
