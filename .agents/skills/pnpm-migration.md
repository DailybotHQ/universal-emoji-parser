---
name: pnpm-migration
description: Playbook for migrating a published npm package to pnpm (Corepack pin, supply-chain guards, npm→pnpm Docker routing, CI store cache, Node-based release, pnpm publish with tarball parity)
---

# Skill: `pnpm-migration`

A reference playbook for migrating this repo (or a fork) from **npm** to **pnpm**,
motivated by supply-chain security
(<https://xergioalex.com/blog/supply-chain-attacks-ai-era/>). It records the exact
steps **and the non-obvious gotchas** discovered when migrating Universal Emoji
Parser, so the next migration is faster and avoids the traps.

> This is a deep-dive companion to [`/release-npm`](../commands/release-npm.md) and
> [`npm-publish-walkthrough`](./npm-publish-walkthrough.md). The package is still
> **published to the npm registry** — pnpm only replaces the dev/CI/release tooling.

## The model

- **Corepack pins pnpm.** `"packageManager": "pnpm@X.Y.Z"` in `package.json`;
  `corepack enable` provisions that exact version. Never `npm install -g pnpm`.
- **Supply-chain guards live in `pnpm-workspace.yaml`** (see below).
- **`npm` is routed to `pnpm`** inside the dev container via a `/usr/local/bin/npm`
  wrapper that execs `corepack pnpm`.
- **CI uses `corepack pnpm`** with a cached pnpm store keyed on `pnpm-lock.yaml`.
- **Release** bumps via a Node script (not `pnpm version`) and publishes with
  `corepack pnpm publish --no-git-checks`.

## Step-by-step

### 1. Foundation
- Add `"packageManager": "pnpm@X.Y.Z"` (match the maintainer's other repos for
  consistency — this repo uses `pnpm@11.1.2`).
- Create `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - .
  minimumReleaseAge: 10080            # 7-day quarantine on brand-new versions
  allowBuilds:
    esbuild: true                     # install-script allow-list (see gotcha #2)
  ```
- Add `.node-version` + `.nvmrc` (pin the CI Node version).
- `.gitignore`: add `.pnpm-store/`.

### 2. Lockfile
- `corepack pnpm import` (converts `package-lock.json` → `pnpm-lock.yaml`).
- `corepack pnpm install` — read the `[ERR_PNPM_IGNORED_BUILDS]` warning and add the
  named packages to `allowBuilds`.
- `git rm package-lock.json`.
- Replace any internal `npm run X` in `package.json` scripts (see gotcha #3).

### 3. Docker (npm→pnpm routing)
- `RUN corepack enable`; `ENV PNPM_HOME=/usr/local/share/pnpm` on `PATH`.
- Install the wrapper **after** any real-npm global installs:
  ```dockerfile
  RUN rm -f /usr/local/bin/npm && \
      printf '#!/bin/bash\necho "[npm→pnpm] Redirecting \"npm $*\" to pnpm (this repo uses pnpm)." >&2\nexec corepack pnpm "$@"\n' \
      > /usr/local/bin/npm && chmod +x /usr/local/bin/npm
  ```
- Convert dev-helper scripts (`docker/custom_commands.sh`) to `corepack pnpm …`.

### 4. CI
- After `setup-node`: `corepack enable`, then cache the pnpm store:
  ```yaml
  - run: echo "STORE_PATH=$(corepack pnpm store path --silent)" >> "$GITHUB_OUTPUT"
    id: pnpm-store
  - uses: actions/cache@v5
    with:
      path: ${{ steps.pnpm-store.outputs.STORE_PATH }}
      key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
  - run: corepack pnpm install --frozen-lockfile
  ```
- Use `--no-frozen-lockfile` only where deps are intentionally upgraded (post-`ncu -u`).

### 5. Release & publish
- `.github/scripts/prepare_release.sh`: bump the version with **Node** (not
  `pnpm version`), commit with the project's release message, and tag. Wire
  `package.json` `"release"` to it.
- Publish: `corepack pnpm publish --no-git-checks` with `NODE_AUTH_TOKEN` +
  `registry-url: https://registry.npmjs.org/` (set by `setup-node`).

### 6. Verify
- Clean install: `rm -rf node_modules && corepack pnpm install --frozen-lockfile`.
- Full gate: `biome:check` + `test` + `build` + `build:tsc`.
- **Tarball parity:** diff `corepack pnpm pack` contents against the published npm
  tarball (`corepack pnpm view <pkg>@<ver> dist.tarball` → curl → `tar tzf`). Must be
  identical — proves consumers are unaffected.

## Gotchas (learned the hard way)

1. **`minimumReleaseAge` blocks `pnpm import`/`install` for dependencies published
   <7 days ago.** That's the guard working — but it also blocks generating the
   lockfile from already-audited versions. Fix: temporarily set `minimumReleaseAge: 0`
   for lockfile *generation only* (versions come from the audited `package-lock.json`,
   so no new risk), then restore `10080`. Confirm `--frozen-lockfile` installs respect
   locked versions with the guard active. (The automated upgrade workflow will also
   refuse too-new versions — that is desirable.)
2. **pnpm 11 uses `allowBuilds:` (a map), NOT `onlyBuiltDependencies:`.** `pnpm
   install` auto-writes an `allowBuilds:` stub into `pnpm-workspace.yaml` listing
   packages with ignored install scripts. Set the ones you need to `true`. For this
   repo only `esbuild` (via Vite) needs it.
3. **Don't nest a bare `pnpm` call inside a `package.json` lifecycle script.** A bare
   `pnpm` isn't guaranteed on `PATH` inside scripts (Corepack provides `corepack
   pnpm`). E.g. `"build": "vite build && pnpm run build:types"` fails with `pnpm: not
   found`. Inline the command instead:
   `"build": "vite build && tsc -p tsconfig.build.json --emitDeclarationOnly"`.
4. **`pnpm publish` needs `--no-git-checks` in CI** — the post-build tree isn't clean
   / tag-matched, so pnpm's default guard would refuse.
5. **`pnpm version` fails with `ERR_PNPM_UNCLEAN_WORKING_TREE`** when install scripts
   leave transient artifacts — hence the Node-based `prepare_release.sh`.
6. **Consumer install docs keep npm/yarn** and add pnpm. Only *developer* commands
   migrate; the published package is PM-agnostic.

## Files this migration touches

`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.node-version`, `.nvmrc`,
`.gitignore`, `docker/**`, `.github/workflows/*`, `.github/scripts/*`, `README.md`,
`docs/**`, `AGENTS.md`, `.agents/**`.
