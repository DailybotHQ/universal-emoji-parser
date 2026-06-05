# SPEC.md — Devcontainer Addon (Normative)

## Abstract

This document is the **normative specification** of the DeepWorkPlan
**devcontainer addon**: an opt-in capability that gives a repository a
**compose-based, reproducible, isolated dev container** with **persistent AI-CLI
authentication**. It defines the **common skeleton** every conformant
devcontainer shares (RFC-2119), the **per-repo reasoning checklist** for the
parts that vary, **project-identity precedence**, the **validation-in-container**
rule, the **public-OSS variant**, and the **reconcile-don't-clobber** behavior.

The addon is governed by `../README.md` and `methodology-spec/ADDONS.md`: it is
**never** required for baseline AI-first conformance.

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Companions** | `SKILL.md`, `templates/*` (reasoning templates + 7 presets), `../README.md`, `methodology-spec/ADDONS.md` |
| **License** | MIT |

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**,
**MAY**, **OPTIONAL**) are interpreted as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

Throughout, `{service}` is the repo's primary devcontainer service name
(e.g. `hubvscode`, `djangovscode`, `clivscode`, `webvscode`), and `{user-home}`
is the home directory of the container's dev user.

---

## 2. The Common Skeleton (the stable ~85%)

Every conformant devcontainer **MUST** follow this skeleton. It was audited as
identical across all Dailybot repos + the hub; it is the part the addon
**carries forward**, not re-reasons.

### 2.1 Compose-based `.devcontainer/devcontainer.json`

- The repo **MUST** contain `.devcontainer/devcontainer.json`.
- It **MUST** be **compose-based**: it **MUST** set `dockerComposeFile`
  pointing at `../docker/local/docker-compose.{yaml,yml}` (it **MUST NOT** use a
  bare `image`/`dockerfile`-only devcontainer).
- It **MUST** declare `name`, `service`, `workspaceFolder`, `remoteUser`, and
  `runServices` (the dev container service, e.g. `["{service}"]`).
- `customizations.vscode.extensions` **MUST** include the AI tooling extensions
  (`Anthropic.claude-code` and/or `dailybot.dailybot`) and **SHOULD** include
  stack-appropriate extensions (Python/Pylance for Python, etc.).
- The devcontainer service **MUST NOT** publish host ports (VS Code forwards
  them); host port bindings live on the non-vscode service variants.

### 2.2 `docker/local/{service}/` layout

The container build **MUST** live under a predictable layout:

```
.devcontainer/devcontainer.json
docker/
├── local/
│   ├── docker-compose.{yaml,yml}      # services + named volumes + network
│   └── {service}/
│       ├── Dockerfile                 # base image + tooling (reasoned per stack)
│       └── entrypoint.sh              # AI-CLI persistence (near-verbatim skeleton)
└── custom_commands.sh                 # codecheck/check/fix/test + claudex/codexx/cursorx + git aliases
```

- `docker/custom_commands.sh` **MUST** exist and be sourced from the dev user's
  `.bashrc`.
- The compose file **MAY** be accompanied by helpers (`docker.sh`, `utils.sh`)
  and OPTIONAL extra service files (e.g. a `docker-compose.pgadmin.yaml`).

### 2.3 AI-CLI persistence (the signature pattern — near-verbatim)

This is the highest-value, **most stable** piece — copy it near-verbatim,
adjusting only `{user-home}` and the user. See `templates/entrypoint.md` for the
full reference script.

- The compose service **MUST** mount **named volumes** for each AI/agent CLI:
  `claude_data`, `codex_data`, `cursor_data`, `gh_data`, `dailybot_data` →
  `{user-home}/.claude_data`, `.codex_data`, `.cursor_data`, `.gh_data`,
  `.dailybot_data`.
- It **MUST** mount the host's `${HOME}/.ssh` and `${HOME}/.gitconfig`
  **read-only** at `{user-home}/.ssh_host` and `{user-home}/.gitconfig`.
- The `entrypoint.sh` **MUST** implement **seed-on-first-run, preserve-on-rebuild**:
  for each tool's real config dir (`~/.claude` + `~/.claude.json` +
  `~/.config/claude-code`, `~/.codex`, `~/.cursor` + `~/.config/cursor`,
  `~/.config/gh`, `~/.config/dailybot`), if it is not already a symlink, seed the
  named-volume copy only when empty, remove the original, and symlink it into the
  persistent volume. SSH keys are **copied** from the read-only `*.ssh_host`
  mount into a writable `~/.ssh` with `chmod 600`/`700`, only if not already
  present.
- The result **MUST** survive `docker compose build`/rebuilds: auth and session
  state persist in the named volumes. This is why agents stay logged in across
  container rebuilds.
- The entrypoint **MUST** end with `exec "$@"` so the compose `command` runs.

### 2.4 Shared external network

- The compose file **MUST** attach services to the shared external network named
  **`dailybot-project-network`** (declared `external: true`). This lets a repo's
  container reach sibling services (e.g. the hub or another repo) on the same
  Docker network. A repo with no cross-service needs **MAY** still declare it for
  consistency.

### 2.5 `DOCKER_DEV_ENV=vscode` → `sleep infinity`

- The devcontainer service **MUST** set `DOCKER_DEV_ENV=vscode` and run
  `command: sleep infinity` (the container stays up for VS Code/agents to attach;
  it does **not** run the app).
- A repo that also runs the app in Docker **MUST** keep a separate non-vscode
  service (or compose variant) that runs the real app command and **MAY** publish
  host ports. The `{service}vscode` variant **MUST NOT** publish host ports.

### 2.6 `custom_commands.sh` validation + agent helpers

`docker/custom_commands.sh` **MUST** define:

- **Validation aliases/functions** mapped to the repo's **real** commands:
  `codecheck` (or `check`), `fix`, `test`. These wrap the repo's actual lint /
  typecheck / test commands (e.g. `ruff check && mypy && pytest`,
  `pnpm run eslint:check`, `astro check`). They **MUST** be the verbatim real
  commands, never placeholders.
- **AI-CLI wrappers** `claudex` / `codexx` / `cursorx` (full-permission /
  resume-aware wrappers around `claude` / `codex` / `agent`).
- A **git-aware prompt** + git aliases + a `check_devcontainer` helper + a
  welcome message.

---

## 3. The Reasoned ~15% — Per-Repo Reasoning Checklist

The addon **MUST** reason these from the **target repo's actual stack**, never
hardcode one repo's choice. Verify each against detected reality (the matching
preset in `templates/presets.md` is a checklist, not an answer key).

| Decision | How to reason it | Examples observed |
|----------|------------------|-------------------|
| **Language → base image** | From the manifest + lockfile actually present. | Node → `node:24.x-trixie-slim`; Python → `python:3.x-slim-trixie` (or `-bullseye`). |
| **User** | Match the base image's convention or create one. | `node` (node image) vs created `dev-user` (UID/GID 1000, sudoers). |
| **`workspaceFolder`** | The mount target for the repo. | `/workspace`, `/app`, `/code/js`. |
| **Supporting services** | **Enumerate from the app's real dependencies** — DB / cache / queue / object store / mail / emulators. Add **only** what the app uses. | postgres, pgvector, redis, mailpit, dynamodb (api-services); dynamodb + localstack-SNS (chatbot); **none** (web-app, dailybot.com, cli, hub). |
| **Ports** | The app's real listen ports + service admin UIs; only on non-vscode variants. | 8000 (Django), 5555 (Flower), 8025 (mailpit), 5433/5434 (postgres/pgvector). |
| **Multi-stage build** | Use when native deps need a build toolchain not wanted at runtime. | api-services: wheel build stage → slim run stage. |
| **Extra tooling** | Add CLIs the stack needs. | AWS CLI + dynamodb (lambda repos); chromium + Lighthouse (static sites); locales (api-services). |
| **Secrets handling** | Public vs private (see §5). | private: `docker/local/hub/.env`; public: secret-free `.env.example` + `.dockerignore`. |

A devcontainer is **conformant to this addon** when it satisfies the §2 skeleton
**and** its §3 choices are demonstrably derived from the repo's real stack (no
phantom services, real validation commands).

---

## 4. Project-Identity Precedence (standardized)

The audit found inconsistent project-name resolution. The addon **MUST**
standardize on this precedence (highest wins):

1. **`.dailybot/profile.json`** — the committed, credential-free repo identity
   (`project` / `name`). If present, it is authoritative.
2. **`DAILYBOT_PROJECT_NAME`** — env var (or `.dailybot.env` / the repo's local
   env file).
3. **`devcontainer.json` `name`** — the fallback display name.

- The addon **MUST** resolve identity in this order and **MUST NOT** invent a new
  name when one already resolves.
- When generating fresh, it **SHOULD** set a consistent `devcontainer.json name`
  and, if the repo uses Dailybot reporting, align it with
  `.dailybot/profile.json`.
- Credentials **MUST NOT** be written into `.dailybot/profile.json` or
  `devcontainer.json` (a `key` field in the profile is a hard error).

---

## 5. Public-OSS Variant

When the target repo is **public** (open source), the addon **MUST** additionally:

- Add a **`.dockerignore`** at the **repo root** (the build context) that
  excludes secrets and AI-config: `.env`, `.env.*` (but `!.env.example`),
  `.pypirc`, `.git`, `.claude`/`.claude_data`/`.codex`/`.cursor`/`.gh_data`/
  `.dailybot_data`, `.devcontainer`, `node_modules`, build/test caches, and OS
  cruft. This keeps the daemon context lean **and** secret-free.
- Use a **repo-root build context** (`build.context: ../..`) so the Dockerfile
  can `COPY` the manifest/lockfile, with the `.dockerignore` keeping it lean.
- Keep **`.env.example` secret-free** — stub keys with **no values**; never
  commit a real secret.
- **Never bake secrets into the image.** Secrets arrive at runtime via
  `env_file` / mounts, never via `COPY` or `ENV` of a real value.
- **Pin dependencies via the lockfile** for reproducibility: `COPY` the lock
  (e.g. `requirements/dev.txt` from `pip-compile`, or `pnpm-lock.yaml`) and
  install from it in its own cache layer, so every container/dev/rebuild
  resolves identical versions.

A **private** repo MAY keep its real secrets in the canonical env file
(e.g. `docker/local/{service}/.env`, gitignored) but the no-secrets-in-image and
lockfile-pinning rules still apply.

---

## 6. Validation-in-Container Rule + Validation Step

### 6.1 Validation runs inside the container

- For repos whose validation **requires** the container (DB, native deps,
  service emulators), the addon **MUST** document that the repo's validation
  (e.g. api-services' `codecheck -f`) runs **inside** the container, and the
  generated `AGENTS.md` Quick Commands / `docs/DEVELOPMENT_COMMANDS.md` **MUST**
  flag those commands as Docker-only.
- The `custom_commands.sh` validation aliases (`codecheck`/`check`/`fix`/`test`)
  are the in-container entry points and **MUST** map to the repo's real commands.

### 6.2 Addon validation step (run after applying)

The addon is correctly applied when **all** hold:

1. `.devcontainer/devcontainer.json` exists, is compose-based, and points at
   `docker/local/docker-compose.{yaml,yml}`.
2. The compose file declares the AI-CLI named volumes
   (`claude_data`/`codex_data`/`cursor_data`/`gh_data`/`dailybot_data`), the
   read-only `${HOME}/.ssh` + `${HOME}/.gitconfig` mounts, and the
   `dailybot-project-network` external network.
3. The devcontainer service sets `DOCKER_DEV_ENV=vscode` + `command: sleep
   infinity` and publishes **no** host ports.
4. `entrypoint.sh` implements seed-on-first-run persistence for all five CLIs
   and ends with `exec "$@"`.
5. `custom_commands.sh` defines real `codecheck`/`check`/`fix`/`test` +
   `claudex`/`codexx`/`cursorx`.
6. Only services the app actually depends on are present (no phantom DBs).
7. Project identity resolves per §4.
8. **Public repos:** `.dockerignore` excludes secrets and `.env.example` is
   secret-free.
9. **Smoke test (best-effort):** `docker compose build {service}` (or, if a
   build cannot run here, note why). Confirm the repo's validation command runs
   inside the container.

---

## 7. Reconcile, Don't Clobber

- On an **existing** `.devcontainer/` / `docker/`, the addon **MUST** reconcile
  additively: keep working ports, network names, env flags, identity, and
  service definitions; bring missing skeleton pieces (AI-CLI persistence,
  `DOCKER_DEV_ENV=vscode`, validation aliases) up to standard.
- The addon **MUST NOT** overwrite or delete an existing file without explicit
  user approval; back up before any unavoidable destructive change.
- It **MUST** record what it changed (in the onboarding/addon report).

---

## 8. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `SKILL.md` (the onboarding hook + flow), `templates/*` (reasoning aids)
- `../README.md` (addon mechanism), `methodology-spec/ADDONS.md` (concept + pointer)
- `methodology-spec/DOCUMENTATION_STANDARD.md` §7 (reason-per-repo),
  `AGENT_PROTOCOL.md` (approval gates), `ARCHETYPES.md`

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
