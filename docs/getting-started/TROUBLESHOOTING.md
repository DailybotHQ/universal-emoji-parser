# Troubleshooting

Real problems hit while setting up and developing Universal Emoji Parser, with the exact fix for each. If you're hitting something not listed here, open an issue.

> Most setup pain comes from Node version mismatches or stale `node_modules`. When in doubt, check Node version first.

---

## `npm install` fails with engine incompatibility

**Symptom:**

```
npm error EBADENGINE Unsupported engine
npm error EBADENGINE   required: { node: '>=22.0.0' }
npm error EBADENGINE   current: { node: 'v18.x.x' }
```

**Cause:** Node version is below the `engines.node: ">=22.0.0"` constraint in `package.json`.

**Fix:**

```bash
nvm install 24
nvm use 24
node --version    # confirm v24.x (or any v22+)
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

## Type errors during tests

**Symptom:** Vitest starts but immediately errors with TypeScript compile messages, e.g.:

```
Error: Failed to load source: src/index.ts
src/index.ts:1:1 - error TS6053: File 'src/index.ts' not found.
```

**Cause:** Usually a `tsconfig.json` issue or a missing source file. Vitest transpiles `.ts` on the fly via esbuild, so this is a config/source problem, not a runner bug.

**Fix:**

1. Check `tsconfig.json` `"include": ["src/**/*"]` is intact
2. Verify `src/index.ts` exists
3. If you've been editing `tsconfig.json`, revert and try again
4. As a last resort, `rm -rf node_modules && npm install` (reinstalls `vitest` + `typescript`)

---

## `npm run build` produces no `dist/index.js`

**Symptom:** Vite production build finishes but `dist/index.js` is missing or empty.

**Cause:** `vite.config.ts` library-mode config got edited (wrong `lib.entry`, `formats`, or `fileName`), or the build silently failed before emitting.

**Fix:**

```bash
rm -rf node_modules dist
npm install
npm run build
```

`npm run build` runs `vite build && npm run build:types` — the second step (`tsc -p tsconfig.build.json --emitDeclarationOnly`) emits `dist/index.d.ts` + `dist/lib/type.d.ts`. If only the `.d.ts` files are missing, run `npm run build:types` on its own to isolate the type-emit step.

If still broken, check `vite.config.ts` library mode:

```ts
build: {
  lib: {
    entry: 'src/index.ts',
    formats: ['cjs'],
    fileName: () => 'index.js',
  },
  minify: 'esbuild',
}
```

…and confirm `@twemoji/parser` is being inlined (it ships inside `dist/index.js`; the package has zero runtime dependencies).

---

## Biome fails with `Cannot read file 'tsconfig.json'` or config errors

**Symptom:**

```
biome.json » error
Cannot read file '/app/tsconfig.json'
```

**Cause:** Biome is being run from a directory that doesn't contain `biome.json` / `tsconfig.json`.

**Fix:** Run from the repo root:

```bash
cd /app   # or wherever the repo root is
npm run biome:check
```

---

## Biome check fails on a file you didn't touch

**Symptom:**

```
Found N errors / warnings — formatter or linter issues
```

…on files outside your change.

**Cause:** A file was reformatted by something (an editor, a stale config) and now violates `biome.json` (single quotes, no semicolons, es5 trailing commas, lineWidth 120).

**Fix:** Let Biome fix it, then review the diff:

1. Run the safe autofix:
   ```bash
   npm run biome:fix
   ```
2. For lint rules that need riskier rewrites, use the unsafe fixer and review every change:
   ```bash
   npm run biome:fix:unsafe
   ```
3. Re-run the gate:
   ```bash
   npm run biome:check
   ```

---

## Tests pass locally but fail in CI

**Symptom:** Green locally, red on the PR.

**Common causes:**

1. **Different Node version** — local Node ≠ CI Node 24. Match locally with `nvm use 24` (or satisfy `engines.node` ≥ 22)
2. **Different timezone / locale** — unlikely in this package (no date/locale handling) but possible if you've added time-sensitive logic
3. **Race condition** — Vitest tests aren't supposed to interact, but if they share state, ordering can matter. Run `npm test` repeatedly locally; if it ever fails, you have a flake
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

## Vite build is suspiciously small

**Symptom:** `dist/index.js` is < 100 KB after `npm run build`. Catalog is missing.

**Cause:** `tsconfig.json`'s `resolveJsonModule: true` got disabled, or `vite.config.ts` is excluding the JSON catalog from the bundle.

**Fix:**

1. Check `tsconfig.json` has `"resolveJsonModule": true`
2. Check `src/index.ts` line `import emojiLibJson from './lib/emoji-lib.json'` is intact
3. Check `vite.config.ts` doesn't mark the catalog or `@twemoji/parser` as `external` — both must be inlined into the single CJS bundle (the published package has zero runtime dependencies)

Sanity check:

```bash
node -e "console.log(Object.keys(require('./dist/index.js').emojiLibJsonData).length)"
# Should print 1914
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

**Symptom:** `npm test` runs for a long time and fails with a timeout error.

**Cause:** The regenerator was accidentally enabled (`it.skip` reverted to `it`).

**Fix:** Open `test/prepareEmojiLibJson.test.ts` and verify line 39 reads:

```ts
it.skip('create emojis lib json file', () => {
```

If it reads `it(...)`, restore the `.skip` and re-run.

---

## "Cannot find module" for a path that exists

**Symptom:** Vitest fails to find a file you can clearly see.

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
