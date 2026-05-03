# Troubleshooting

Real problems hit while setting up and developing Universal Emoji Parser, with the exact fix for each. If you're hitting something not listed here, open an issue.

> Most setup pain comes from Node version mismatches or stale `node_modules`. When in doubt, check Node version first.

---

## `npm install` fails with engine incompatibility

**Symptom:**

```
npm error EBADENGINE Unsupported engine
npm error EBADENGINE   required: { node: '>=20.19.0' }
npm error EBADENGINE   current: { node: 'v18.x.x' }
```

**Cause:** Node version is below the `engines.node: ">=20.19.0"` constraint in `package.json`.

**Fix:**

```bash
nvm install 24
nvm use 24
node --version    # confirm v24.x (or any v20.19+)
npm install
```

Or use Volta / asdf / your favorite version manager.

---

## Tests fail with `Cannot find module '@twemoji/parser'`

**Symptom:**

```
Error: Cannot find module '@twemoji/parser'
```

…during `npm test` or `npm run build`.

**Cause:** `node_modules` is stale or partial. Common after switching branches that have different `package.json`.

**Fix:**

```bash
rm -rf node_modules
npm install
npm test
```

If that doesn't help, also clear npm cache:

```bash
npm cache clean --force
npm install
```

---

## `ts-node` errors during tests

**Symptom:** Mocha starts but immediately errors with TypeScript compile messages, e.g.:

```
TSError: ⨯ Unable to compile TypeScript:
src/index.ts:1:1 - error TS6053: File 'src/index.ts' not found.
```

**Cause:** Usually a `tsconfig.json` issue or a missing source file.

**Fix:**

1. Check `tsconfig.json` `"include": ["src/**/*"]` is intact
2. Verify `src/index.ts` exists
3. If you've been editing `tsconfig.json`, revert and try again
4. As a last resort, `rm -rf node_modules && npm install` (reinstalls `ts-node` + `typescript`)

---

## `npm run build` fails with `Cannot find module 'clean-webpack-plugin'`

**Symptom:** Webpack production build fails because `CleanWebpackPlugin` isn't found.

**Cause:** The `clean-webpack-plugin` import path changed across versions; the current code uses `require('clean-webpack-plugin')` and accesses `.CleanWebpackPlugin` on the export. If `node_modules` has a different version of the package, this can fail.

**Fix:**

```bash
rm -rf node_modules
npm install
npm run build
```

If still broken, check `webpack.config.js`:

```js
const CleanWebPackPlugin = require('clean-webpack-plugin')
// ...
new CleanWebPackPlugin.CleanWebpackPlugin()
```

…matches the installed version of `clean-webpack-plugin` (currently 4.x).

---

## ESLint fails with `Parsing error: Cannot read file 'tsconfig.json'`

**Symptom:**

```
eslint.config.mjs » @typescript-eslint/...
Parsing error: Cannot read file '/app/tsconfig.json'
```

**Cause:** ESLint is being run from a directory that doesn't contain `tsconfig.json`.

**Fix:** Run from the repo root:

```bash
cd /app   # or wherever the repo root is
npm run eslint:check
```

---

## Prettier check fails on `package.json`

**Symptom:**

```
Code style issues found in package.json
```

**Cause:** `package.json` was reformatted by something (npm install, an editor, manual edit) and now violates Prettier's expectations.

**Fix:** This file is **excluded** from Prettier formatting (`'!package.json'` in the `prettier:check` script). If `prettier:check` is reporting it, something's off:

1. Confirm the script in `package.json` still includes `'!package.json'`:
   ```json
   "prettier:check": "prettier -c --ignore-path .gitignore '**/*.{css,html,js,ts,json,md,yaml,yml}' '!package.json'"
   ```
2. Run `prettier:check` directly:
   ```bash
   npm run prettier:check
   ```
3. If it still picks up `package.json`, the exclusion isn't reaching prettier — make sure the script wasn't modified

---

## Tests pass locally but fail in CI

**Symptom:** Green locally, red on the PR.

**Common causes:**

1. **Different Node version** — local Node ≠ CI Node 24. Match locally with `nvm use 24` (or satisfy `engines.node` ≥ 20.19)
2. **Different timezone / locale** — unlikely in this package (no date/locale handling) but possible if you've added time-sensitive logic
3. **Race condition** — Mocha tests aren't supposed to interact, but if they share state, ordering can matter. Run `npm test` repeatedly locally; if it ever fails, you have a flake
4. **Env-var dependency** — code that reads `process.env.X` may behave differently with/without the var. The package shouldn't read env vars; check recent changes if it does
5. **Stale CI cache** — re-run the workflow with cache disabled (push an empty commit, or add `--no-cache` to the cache key)

---

## "Unauthorized" on `npm publish` (manual release)

**Symptom:**

```
npm error 401 Unauthorized - PUT https://registry.npmjs.org/universal-emoji-parser
```

**Cause:** You're not logged in, or your token doesn't have publish permission for this package.

**Fix:**

```bash
# For interactive login
npm login

# For token-based auth
npm whoami        # confirm you're logged in
npm access list packages    # confirm you have publish access
```

Manual releases by humans are rare — the CI does this. If CI is failing with this error, `secrets.NPM_TOKEN` is expired or wrong-scoped.

---

## Dev container build fails on `npm install -g @openai/codex`

**Symptom:** Docker build fails during the Codex CLI installation step.

**Cause:** npm registry hiccup or temporary network issue.

**Fix:** Re-run the build:

```bash
docker compose build --no-cache uemojiparservscode
```

If it consistently fails, the Codex CLI may have moved registries. Edit `docker/local/uemojiparser/Dockerfile` to comment out the Codex install line and rebuild — Codex isn't required for development.

---

## Dev container `claude` / `codex` / `agent` says "command not found"

**Symptom:** After entering the container, the AI CLI commands aren't on PATH.

**Cause:** The `~/.bashrc` `PATH` modification didn't take effect (e.g., you're in a non-interactive shell).

**Fix:**

```bash
source ~/.bashrc
which claude         # should show /home/node/.npm-global/bin/claude
which codex
which agent
```

If they're still missing, the install scripts didn't complete. Check:

```bash
ls /home/node/.npm-global/bin/
ls /home/node/.cursor/bin/
```

Re-run the dev container build (`docker compose build --no-cache`) if either is empty.

---

## `git push` from inside the dev container says "Permission denied (publickey)"

**Symptom:** Git operations fail with SSH auth errors.

**Cause:** The container mounts `${HOME}/.ssh` as `~/.ssh_host` (read-only), not as `~/.ssh`. SSH agent forwarding isn't configured.

**Fix (option 1, ad hoc):**

```bash
# Inside the container
mkdir -p ~/.ssh
cp ~/.ssh_host/id_* ~/.ssh/
chmod 600 ~/.ssh/id_*
ssh-add ~/.ssh/id_*

# Then git push works
```

**Fix (option 2, permanent):** Edit `docker/local/docker-compose.yaml` to mount `~/.ssh` directly:

```yaml
volumes:
  - ${HOME}/.ssh:/home/node/.ssh:ro
```

(Change `:ro` to read-only if the SSH agent inside the container needs to write to known_hosts; many setups need read-write.)

**Fix (option 3, GitHub CLI auth):** Authenticate with `gh` instead of SSH:

```bash
gh auth login
```

Then use HTTPS git remotes (which `gh` will sign for you).

---

## Webpack build is suspiciously small

**Symptom:** `dist/index.js` is < 100 KB after `npm run build`. Catalog is missing.

**Cause:** `tsconfig.json`'s `resolveJsonModule: true` got disabled, or `webpack.config.js` is excluding the JSON catalog.

**Fix:**

1. Check `tsconfig.json` has `"resolveJsonModule": true`
2. Check `src/index.ts` line `import emojiLibJson from './lib/emoji-lib.json'` is intact
3. Check `webpack.config.js` rules don't include a `json-loader` exclusion that breaks the default behavior

Sanity check:

```bash
node -e "console.log(Object.keys(require('./dist/index.js').emojiLibJsonData).length)"
# Should print 1906
```

---

## Catalog regenerator runs but writes an empty file

**Symptom:** After enabling the regenerator (`it(...)` instead of `it.skip(...)`), `src/lib/emoji-lib-output.json` is empty or missing.

**Cause:** `unicode-emoji-json` or `emojilib` upstream package shape changed.

**Fix:**

1. Check the test output for errors during the regenerator run
2. Inspect the upstream packages:
   ```bash
   node -e "console.log(Object.keys(require('unicode-emoji-json')).length)"
   node -e "console.log(Object.keys(require('emojilib')).length)"
   ```
   Both should report >1500
3. If one of them is empty or has the wrong shape, the package's API changed. Check its release notes and adjust `prepareEmojiLibJson.test.ts` to match
4. Pin the working version in `package.json` if needed

---

## Test runner hangs or times out

**Symptom:** `npm test` runs for >25 seconds and fails with a timeout error.

**Cause:** The regenerator was accidentally enabled (`it.skip` reverted to `it`).

**Fix:** Open `test/prepareEmojiLibJson.test.ts` and verify line 39 reads:

```ts
it.skip('create emojis lib json file', () => {
```

If it reads `it(...)`, restore the `.skip` and re-run.

---

## "Cannot find module" for a path that exists

**Symptom:** Mocha or ts-node fails to find a file you can clearly see.

**Cause (typical):** Case sensitivity. macOS is case-insensitive by default; Linux (and most CI) is case-sensitive. `import './Index'` works on macOS but fails on CI.

**Fix:** Match the actual file casing exactly:

```bash
ls -la src/
# Confirm the case of every imported file
```

Then update imports to match.

---

## `git_logs.txt` / `packages_upgrades.txt` keeps appearing

**Symptom:** These files keep showing up in `git status`, but `.gitignore` lists them.

**Cause:** They were committed before being added to `.gitignore`, so git tracks them despite the rule.

**Fix:**

```bash
git rm --cached git_logs.txt packages_upgrades.txt
git commit -m "chore: untrack CI scratch files"
```

Now `.gitignore` will work for new copies of those files.

---

## CSS for emojis isn't applying

**Symptom:** The `<img class="emoji" .../>` output shows up, but emojis are huge / don't align with text.

**Cause:** This isn't a bug in this package — consumers must add the recommended CSS:

```css
img.emoji {
  height: 1em;
  width: 1em;
  margin: 0 0.05em 0 0.1em;
  vertical-align: -0.1em;
}
```

**Fix:** Add the snippet to your consumer's stylesheet. The package's `class="emoji"` is the contract; the styling is the consumer's responsibility.

---

## Still stuck?

1. Re-read the relevant section of [Environment Setup](ENVIRONMENT_SETUP.md) — most issues come from a missed step
2. Run the sanity-check commands from [Environment Setup → Final sanity checklist](ENVIRONMENT_SETUP.md#final-sanity-checklist) to isolate which layer is broken
3. Try the dev container — it eliminates "but it works on my machine" issues
4. File an issue with:
   - Output of `node --version`, `npm --version`
   - Output of the failing command with `--verbose` or `--stacktrace` if available
   - Your OS and shell
   - What you've already tried
