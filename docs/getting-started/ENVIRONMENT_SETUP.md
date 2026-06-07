# Environment Setup

A step-by-step guide for setting up a Universal Emoji Parser development environment, from zero to "tests pass". Two paths are supported:

- **Native** — Node.js installed locally (macOS, Linux, Windows). Simplest for casual contributors
- **Dev container** — VS Code Dev Containers / Docker Compose. Pre-configured with Claude Code, Codex, Cursor, and shell helpers. Recommended for team work or reproducible setups

By the end of this guide you will be able to:

- Install dependencies (`npm install`)
- Run the test suite (`npm test`)
- Build the production bundle (`npm run build`)
- Run lint + format checks (`npm run biome:check`)

> Already set up? Skip to [Running Tests](RUNNING_TESTS.md).
> Hit a problem? Check [Troubleshooting](TROUBLESHOOTING.md).

---

## Path A — Native Node.js

### 1. Install Node.js

The package requires **Node.js ≥ 22.0.0**. CI runs on **Node 24**. Use Active LTS, Current, or the same major as CI.

#### macOS / Linux (recommended: nvm)

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your shell, then:
nvm install 24
nvm use 24
nvm alias default 24
```

#### macOS (Homebrew)

```bash
brew install node@22
brew link --overwrite node@22
```

#### Windows

Use [nvm-windows](https://github.com/coreybutler/nvm-windows) or download the installer from [nodejs.org](https://nodejs.org/).

### 2. Verify

```bash
node --version       # should report v24.x (or any v22+)
npm --version        # comes with Node; should be 10.x+
```

### 3. Clone the repo

```bash
git clone https://github.com/DailyBotHQ/universal-emoji-parser.git
cd universal-emoji-parser
```

### 4. Install dependencies

```bash
npm install
```

First install takes ~30 seconds and pulls in (all devDependencies — the published package has **zero runtime dependencies**, since `@twemoji/parser` is inlined into the bundle at build time):

- `@twemoji/parser` (inlined into `dist/index.js` at build; pinned to `17.0.1`)
- TypeScript, Vitest (test runner + `vite-node` for ad-hoc scripts)
- Vite (build), `tsc` (declaration emit)
- Biome (lint + format)
- `emojilib`, `unicode-emoji-json`, `@types/*` (regenerator + types)

### 5. Smoke test

```bash
npm test
```

Expected: ~5 seconds, all green. If it fails, see [Troubleshooting](TROUBLESHOOTING.md).

```bash
npm run build
```

Expected: `dist/index.js` created (~403 KB minified CJS, with `@twemoji/parser` inlined).

### 6. Optional: editor integration

The repo ships `.editorconfig` and `biome.json`. Most editors auto-detect:

- **VS Code** — install the recommended extensions (see `.devcontainer/devcontainer.json` `customizations.vscode.extensions` for the list — same list applies to native VS Code); the Biome extension handles both lint and format
- **WebStorm / IntelliJ** — install the Biome plugin and point it at the project's `biome.json`
- **Vim / Neovim** — Biome's LSP (`biome lsp-proxy`) via your LSP client

---

## Path B — VS Code Dev Container (recommended for teams)

The repo ships a Dev Container at `.devcontainer/devcontainer.json` that builds a Node 24 + Claude Code + Codex + Cursor image, with persistent volumes for AI CLI sessions.

### 1. Install prerequisites

| Tool                                                                                                               | Why                           |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) (or Docker Engine + Compose on Linux)             | Builds and runs the container |
| [VS Code](https://code.visualstudio.com/)                                                                          | Frontend                      |
| [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) | Wires VS Code to Docker       |

### 2. Open the repo in VS Code

```bash
git clone https://github.com/DailyBotHQ/universal-emoji-parser.git
cd universal-emoji-parser
code .
```

VS Code prompts: _Reopen in Container_. Click it.

(Or: `View → Command Palette → "Dev Containers: Reopen in Container"`)

### 3. Wait for the build

First time takes ~3 minutes:

- Pulls `node:24.14.0-trixie-slim`
- Installs `git`, `curl`, `gh` (GitHub CLI), `chromium`
- Installs Claude Code CLI, Codex CLI, Cursor CLI as the `node` user
- Configures persistent volumes for AI CLI auth

Subsequent rebuilds are seconds (Docker layer cache).

### 4. Open a terminal in the container

`Terminal → New Terminal` inside VS Code, or via `docker exec`:

```bash
docker exec -it uemojiparser bash
```

You should see a welcome banner:

```
🚀 Universal Emoji Parser Development Container

✅ Running inside Docker container

Useful commands:
  • help                 - Show this message
  • test                 - Run tests
  ...
```

### 5. Install dependencies + test

```bash
npm install
npm test
```

Same as native.

### 6. Optional: AI CLI auth

The dev container has Claude Code, Codex, and Cursor pre-installed but unauthenticated. To use them:

```bash
# Claude Code
claude        # opens auth flow on first run

# Codex
codex         # opens auth flow on first run

# Cursor
agent         # opens auth flow on first run
```

Each CLI's auth state lives in a Docker named volume (`claude_data`, `codex_data`, `cursor_data`) so it survives container rebuilds.

### Shell helpers

The container's `~/.bashrc` sources `docker/custom_commands.sh`, which provides:

| Command                                                                                 | What it does                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `help`                                                                                  | Reprint the welcome banner                                               |
| `check_devcontainer`                                                                    | Print whether you are running inside Docker / Dev Containers             |
| `check`                                                                                 | `npm run biome:check`                                                    |
| `fix`                                                                                   | `npm run biome:fix`                                                      |
| `test`                                                                                  | `npm test`                                                               |
| `build`                                                                                 | `npm run build`                                                          |
| `codecheck`                                                                             | `check`, then `build`, then `test` (full local gate)                     |
| `install`                                                                               | `npm install`                                                            |
| `claudex`                                                                               | `claude --dangerously-skip-permissions` (full-permission Claude session) |
| `claudex -c`                                                                            | Continue last Claude session                                             |
| `claudex -r [<id>]`                                                                     | Resume Claude session                                                    |
| `codexx`                                                                                | `codex --dangerously-bypass-approvals-and-sandbox`                       |
| `codexx -l` / `-r`                                                                      | Codex session controls                                                   |
| `cursorx`                                                                               | `agent --force` (full-permission Cursor agent)                           |
| `cursorx -l` / `-r`                                                                     | Cursor session controls                                                  |
| `gs` / `ga` / `gc` / `gp` / `gpl` / `gl` / `gd` / `gb` / `gco` / `gcob` / `gbd` / `grc` | Git aliases                                                              |

These exist only in the container. Native users use the underlying `npm` and `git` commands directly.

### Mounting your host SSH and git config

`docker-compose.yaml` mounts `${HOME}/.ssh` and `${HOME}/.gitconfig` read-only into the container, so `git push`, `gh auth`, and SSH-based git remotes work without re-authenticating. Your host SSH keys are reachable as `~/.ssh_host` in the container; `~/.gitconfig` is read directly.

---

## Path C — Manual Docker Compose (without VS Code)

If you don't use VS Code:

```bash
cd docker/local
docker compose up -d uemojiparservscode
docker exec -it uemojiparser bash
```

Then proceed as in Path B step 5 (`npm install && npm test`).

To stop:

```bash
docker compose down
```

To remove volumes (resets AI CLI auth, loses cached node_modules):

```bash
docker compose down --volumes
```

---

## Final sanity checklist

Run these and confirm each succeeds before moving on:

```bash
node --version                       # ≥ 22.0.0
npm --version                        # ≥ 10
npm install                          # No errors
npm run biome:check                  # No lint or format errors
npm test                             # All specs pass
npm run build                        # dist/index.js created
ls -lh dist/index.js                 # ~403 KB
```

If everything passes, you're ready to [run the test suite](RUNNING_TESTS.md) or start coding.

If something failed, the [troubleshooting guide](TROUBLESHOOTING.md) covers every issue we've actually hit during setup.
