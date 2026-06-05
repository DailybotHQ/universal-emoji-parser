# Template — `docker/local/{service}/Dockerfile` (reason, don't copy)

Reasoning template with **Node** and **Python** branches. The base image, user,
and dependency install are reasoned per repo; the **agent-tooling block**
(install claude/codex/cursor/gh/dailybot CLIs, source `custom_commands.sh`,
pre-create persistence dirs) is the stable part.

## Shared across both branches (the stable tooling block)

Every Dockerfile, regardless of language:

1. Installs base tools: `sudo git bash-completion nano ssh curl gnupg
   ca-certificates build-essential`.
2. Creates the dev user (or uses the image's) with UID/GID 1000 + passwordless
   sudo — **unless** the base image already ships a suitable non-root user.
3. Installs the **agent CLIs**: GitHub CLI (`gh`), Dailybot CLI
   (`curl -sSL https://cli.dailybot.com/install.sh | bash`), Codex CLI, and — as
   the dev user — Claude Code (`curl -fsSL https://claude.ai/install.sh | bash`)
   and Cursor CLI (`curl -fsSL https://cursor.com/install | bash`).
4. `ENV EDITOR=nano VISUAL=nano GIT_EDITOR=nano`.
5. `WORKDIR {workspaceFolder}`.
6. Copies `entrypoint.sh`, strips CRLF, `chmod +x`.
7. Pre-creates `{user-home}/.claude_data .codex_data .cursor_data .gh_data
   .dailybot_data .ssh` owned by the dev user.
8. As the dev user: `git config` defaults + `echo 'source
   {workspaceFolder}/docker/custom_commands.sh' >> ~/.bashrc`, then remove any
   seeded `~/.claude` / `~/.claude.json` (the entrypoint re-seeds from volume).
9. `ENTRYPOINT ["/entrypoint.sh"]`.

> Reason the **package manager** from the lockfile that exists. Node: enable
> Corepack for pnpm/yarn shims if the repo pins `packageManager`; otherwise plain
> npm. Python: poetry / pip-tools / uv as the repo actually uses.

## Node branch

```dockerfile
FROM node:{24.x}-trixie-slim          # reason exact version from .nvmrc / engines / packageManager
# ... base tools (apt) ...
# node image already ships a `node` user (UID 1000); use it OR create dev-user.
# Corepack for pnpm/yarn if the repo pins packageManager:
RUN corepack enable && corepack --version
# gh + dailybot + codex CLIs (system-wide), then USER node/dev-user for claude/cursor.
WORKDIR {/code/js | /app}
# (no app `npm install` in the dev image if you bind-mount the repo; install at runtime)
```

Decision notes (Node):
- **User**: reuse the image's `node` user, or create `dev-user` for parity with
  Python repos — pick one and keep `remoteUser`/volume paths consistent.
- **Native modules**: keep `build-essential` for packages that compile.
- **Static-site / Lighthouse**: add chromium + its deps (see `static-site`
  preset) when the build runs headless Chrome.

## Python branch

```dockerfile
FROM python:{3.x}-slim-trixie         # reason exact version from pyproject / .python-version
# ... base tools (apt) ...
RUN groupadd --gid 1000 dev-user && useradd --uid 1000 ... (sudoers)
# Node 24 too (agent CLIs + any JS tooling), gh, dailybot, codex.
# Install deps from the LOCKFILE in its own cache layer (reproducible):
COPY {requirements/dev.txt | poetry.lock+pyproject.toml} /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements-dev.txt   # or poetry install
WORKDIR {/app | /workspace}
```

Decision notes (Python):
- **Multi-stage** when native deps need a build toolchain at build time only
  (api-services builds wheels in a `python-build-stage`, copies them into a slim
  `python-run-stage`). A pure-Python CLI does **not** need multi-stage.
- **Locales**: generate `en_US`/`es_ES`/`pt_PT` if the app formats localized
  output (api-services).
- **Isolated tools**: install aggressive-pin tools (e.g.
  `python-semantic-release`) via `pipx --global` so they don't downgrade the main
  env (cli repo).
- **Lockfile pinning** is mandatory for reproducibility (and doubly so for
  public-OSS — SPEC §5).
```
