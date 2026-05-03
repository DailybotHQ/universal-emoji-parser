# Fork Customization

Step-by-step rebrand of Universal Emoji Parser into a new product or fork. This is the first thing you should do after cloning. Every step is mechanical — none of it requires creative judgment.

The placeholders to replace, in summary:

| Placeholder | Currently | Examples of new value |
|---|---|---|
| Package name | `universal-emoji-parser` | `@acme/emoji-parser`, `acme-emojis` |
| GitHub repo | `DailyBotHQ/universal-emoji-parser` | `acme/emoji-parser` |
| Maintainer block | `DailyBot <developers@dailybot.com>` | `Acme Inc <eng@acme.com>` |
| Bug-tracker email | `developers@dailybot.com` | `eng@acme.com` |
| Homepage URL | `https://github.com/DailyBotHQ/universal-emoji-parser#readme` | `https://github.com/acme/emoji-parser#readme` |
| Release-bot identity | `🤖 DailyBot <ops@dailybot.com>` | `🤖 Acme-Bot <ops@acme.com>` |
| Notification channel | DailyBot Slack-like | Your own Slack/Teams/Discord |
| npm scope | unscoped (`universal-emoji-parser`) | `@acme/emoji-parser` |

## Step 1 — Package name

Edit `package.json`:

```json
{
  "name": "@acme/emoji-parser",
  "version": "1.0.0",
  "description": "Acme's emoji parser — fork of universal-emoji-parser",
  ...
}
```

If using an npm scope (`@acme/...`), also configure the publish registry. For npm.org private packages:

```json
{
  "publishConfig": {
    "access": "restricted"
  }
}
```

For public scoped packages, `"access": "public"`.

## Step 2 — Repository metadata

Edit `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acme/emoji-parser.git"
  },
  "author": "Acme Inc <eng@acme.com> (https://acme.com)",
  "bugs": {
    "url": "https://github.com/acme/emoji-parser/issues",
    "email": "eng@acme.com"
  },
  "homepage": "https://github.com/acme/emoji-parser#readme"
}
```

Reset the version to `1.0.0` so semver starts clean — your fork is a new product.

## Step 3 — README

Replace [`README.md`](../README.md) with:

- New product name and one-line value prop
- Fork attribution: "This is a fork of [universal-emoji-parser](https://github.com/DailyBotHQ/universal-emoji-parser)"
- Updated badges (CI status, license, npm version, downloads pointing at the new package)
- Install command using the new name: `npm install @acme/emoji-parser`
- Usage examples updated to import from the new name

## Step 4 — License and ownership

The original ships under MIT. Decide:

- **Keep MIT** — keep `LICENSE`, update the copyright year + holder
- **Switch to a different OSS license** — replace `LICENSE`, update `package.json` `"license"` field
- **Make it proprietary** — replace `LICENSE` with your "All rights reserved" notice, set `"license": "UNLICENSED"` in `package.json`, set `"private": true` if you don't intend to publish

If you keep MIT or another permissive license, you must retain the original copyright notice somewhere (the original `LICENSE` itself, or a `NOTICES` file).

## Step 5 — CI release workflows

The original uses GitHub Actions with DailyBot for notifications. To adapt:

### `release_and_publish.yml`

Edit `.github/workflows/release_and_publish.yml`:

1. **Bot identity** — change `git config user.name "🤖 DailyBot"` and `git config user.email "ops@dailybot.com"` to your bot
2. **Release commit message** — change the regex in `.github/scripts/get_github_release_log.sh` from `[🤖 DailyBot] New release to v` to your bot's prefix
3. **Notifications** — either update the DailyBot API call to your own Slack/Teams/Discord webhook, or remove the `notify_on_channel_*` jobs entirely
4. **Secrets** — replace `secrets.AUTOMATION_GITHUB_TOKEN`, `secrets.NPM_TOKEN`, `secrets.DAILYBOT_API_KEY` with your own; add them in GitHub repo Settings → Secrets and variables → Actions
5. **Vars** — replace `vars.DAILYBOT_DEPLOYMENT_NOTIFICATION_CHANNEL`, `vars.USERS_TO_NOTIFY` with your own (or remove if not using notifications)

### `package.json` `release` script

Edit:

```json
"release": "npm version patch -m \"[🤖 Acme-Bot] New release to v%s launched 🚀\""
```

The bot identity in the commit message must match the regex in `get_github_release_log.sh` so release notes pick the right boundary.

### Other workflows

- `code_check.yml` — usually no changes; it just runs lint + test
- `pull_request_check.yml` — references DailyBot in comments; trim if you don't use it
- `check_packages_versions.yml` + `check_and_merge_packages_upgrades_pr.yml` — DailyBot identity again; update or strip

## Step 6 — Dev container

The dev container at `docker/local/uemojiparser/` is a generic Node 24 container with Claude Code, Codex, and Cursor pre-installed. Adapt:

- Rename the directory: `docker/local/<your-product>/`
- Update `docker/local/docker-compose.yaml` `service` name + `container_name`
- Update `.devcontainer/devcontainer.json` `name` field
- Update the welcome banner in `docker/custom_commands.sh` (`show_welcome` function — the `🚀 Universal Emoji Parser Development Container` line)

If you don't need the AI CLI scaffolding, simplify the Dockerfile — drop the Claude/Codex/Cursor install steps.

## Step 7 — Catalog and source naming

The catalog at `src/lib/emoji-lib.json` and the source file `src/index.ts` are generic — no fork-specific identifiers in the runtime code. Inspect:

```bash
grep -rn 'universal-emoji-parser\|DailyBot\|dailybot\|xergioalex' src/ test/
```

(There should be no hits in `src/`. The repo's only product-specific identifiers are in metadata and CI.)

If you're adding new shortcode aliases for your product, do it via [`EMOJIS_SPECIAL_CASES`](../.agents/commands/add-special-case.md) — same workflow as the original.

## Step 8 — Documentation refresh

Walk every doc and update product-specific identifiers:

```bash
grep -rln 'universal-emoji-parser\|DailyBot\|dailybot\|xergioalex' docs/ AGENTS.md README.md .agents/
```

Replace with your fork's identifiers. This grep should return zero hits when you're done — except for one: the fork attribution in `README.md`, which intentionally references the original.

Audit specifically:

- `AGENTS.md` Project Overview section
- `docs/TECHNOLOGIES.md` "Pinned exclusions" — your fork might lift the chai/eslint pins
- `docs/BUILD_DEPLOY.md` — the entire CI section is about DailyBot; rewrite for your CI
- `docs/SECURITY.md` — npm 2FA recommendation, vulnerability email
- `.agents/README.md` and individual skills — references to the bot identity

## Step 9 — Git remote and history

Optional but typical:

```bash
git remote remove origin
git remote add origin git@github.com:acme/emoji-parser.git
git push -u origin main
```

If you want a clean history (most forks don't bother — keeping history lets you cherry-pick upstream fixes):

```bash
rm -rf .git
git init
git add .
git commit -m "chore: bootstrap from universal-emoji-parser"
git remote add origin git@github.com:acme/emoji-parser.git
git push -u origin main
```

## Step 10 — Sanity check

```bash
npm install
npm run eslint:check
npm run prettier:check
npm test
npm run build

# Verify the package name made it through
node -e "console.log(require('./package.json').name)"   # should be your new name

# Verify nothing references the old identifiers
grep -rln 'universal-emoji-parser\|DailyBot\|dailybot' src/ test/ AGENTS.md docs/
# (only README.md fork-attribution should remain)
```

## Step 11 — First release

```bash
# Manually verify the workflow once
git checkout -b first-release
git commit --allow-empty -m "feat: initial fork release"
git push -u origin first-release
# Open a PR, merge it
# Watch the release_and_publish workflow run
```

If npm publish fails with "package not found", the package name is new — npm needs you to add `--access public` for the first publish (or `"publishConfig": { "access": "public" }` in `package.json`). The CI workflow's `npm publish` doesn't pass `--access` by default; either add it or pre-publish manually once.

## Step 12 — After you're done

Once the rebrand is solid, audit the docs:

- Remove sections that no longer apply (e.g., if you don't use DailyBot, strip those workflow steps)
- Update `docs/TECHNOLOGIES.md` to reflect any stack swaps
- Update `AGENTS.md` "Project Overview" with your fork's product description
- Update [`AGENTS.md`](../AGENTS.md) command examples in the "Quick Commands" section if you've changed npm script names

## Checklist

- [ ] `package.json` `name`, `description`, `version`, `repository`, `author`, `bugs`, `homepage` updated
- [ ] `LICENSE` updated (or replaced)
- [ ] `README.md` rewritten for the new product
- [ ] CI bot identity (`git config user.name/email` in workflows) updated
- [ ] Release commit prefix in `.github/scripts/get_github_release_log.sh` updated to match
- [ ] DailyBot notifications either rewired or removed
- [ ] CI secrets added to fork (`NPM_TOKEN`, `AUTOMATION_GITHUB_TOKEN`, plus any notification keys)
- [ ] Dev container service name + welcome banner updated
- [ ] All docs grep clean except the fork-attribution line in README
- [ ] First release pushed and visible on npm

## When something goes wrong

- **`npm publish` says 403** — check `NPM_TOKEN` scope (must be `automation` or `publish`) and that the package name isn't already taken. Scoped packages need to be created under your org first
- **CI workflow fails on first run** — `secrets.AUTOMATION_GITHUB_TOKEN` is missing or doesn't have `contents: write` + `pull-requests: write`
- **Release notes are empty** — `get_github_release_log.sh` walks back until it sees the bot's release commit prefix. On the very first release there's no prior release commit, so it dumps the entire git history. Edit the script for first-release-friendly behavior or just edit the GitHub release notes manually that one time
- **Tests fail with "Cannot find module 'universal-emoji-parser'"** — old import paths somewhere; grep `src/`, `test/`, and update to your new name (note: the package shouldn't import its own name internally, but a copy-paste mistake might have introduced it)
