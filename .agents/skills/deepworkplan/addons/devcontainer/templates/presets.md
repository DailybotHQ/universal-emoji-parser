# Devcontainer Presets — Reasoning Aids (NOT fixed file sets)

These are the **7 presets** distilled from auditing the Dailybot repos + the hub.
Each is a **reasoning checklist** for the ~15% that varies — a *starting point*
you verify against the target repo's real stack. **Detected reality always wins
over a preset assumption.** Every preset still keeps the full common skeleton
(SPEC §2): compose-based devcontainer, AI-CLI persistence volumes,
`dailybot-project-network`, `DOCKER_DEV_ENV=vscode`→`sleep infinity`,
`custom_commands.sh` validation aliases.

Match a preset by signal, then reason the specifics.

---

## 1. `node-web` — Node/TS web app (e.g. web-app: Vue 3 + Vite)

- **Signal:** `package.json` + `vite.config.*` + `vue`/`react` in deps.
- **Base image:** `node:24.x-trixie-slim`. **User:** `node` or `dev-user`.
  **`workspaceFolder`:** `/code/js` or `/app`.
- **Supporting services:** usually **none** (talks to a remote API in dev).
- **Ports (non-vscode variant only):** the Vite dev port (e.g. 5173).
- **Validation:** `pnpm run eslint:check`, `pnpm run type:check`, `pnpm test` /
  `vitest`.
- **Extensions:** ESLint, Volar (Vue), Prettier.

## 2. `node-service` — long-running Node service (e.g. discord-gateway: Express + Discord.js)

- **Signal:** `package.json` + Express/Fastify imports; no front-end build.
- **Base image:** `node:24.x-trixie-slim`. **`workspaceFolder`:** `/app`.
- **Supporting services:** only what it integrates (a cache/queue if used);
  often **none** locally.
- **Ports:** the service's listen port (non-vscode variant).
- **Validation:** `pnpm run eslint:check` + `pnpm test` (`*.spec.ts`).
- **Two-variant compose:** base service runs the real start command + publishes
  the port; the `vscode` variant runs `sleep infinity`, no ports.

## 3. `node-lambda` — serverless Node handlers (e.g. chatbot-functions: Lambda + TS)

- **Signal:** Lambda handlers / `serverless.yml` / `template.yaml`.
- **Base image:** `node:24.x-trixie-slim`.
- **Extra tooling:** **AWS CLI** in the image.
- **Supporting services (emulators):** **dynamodb-local**, **localstack** (e.g.
  SNS) — add only the emulators the functions actually call. Give them a data
  volume + healthcheck; expose admin UIs (dynamodb-admin) on the non-vscode
  variant.
- **Validation:** `pnpm run eslint:check` + `pnpm test` (`*.spec.ts`); offline
  invoke if the repo supports it.

## 4. `python-service` — multi-service Python app (e.g. api-services: Django; the HEAVIEST)

- **Signal:** `manage.py` + `settings.py`; `pyproject.toml`/`poetry.lock` or
  `requirements/`.
- **Base image:** `python:3.x-slim-{trixie,bullseye}`, **multi-stage** (build
  wheels in a build stage, copy into a slim run stage). **User:** created
  `dev-user`. **`workspaceFolder`:** `/app`.
- **Supporting services:** **postgres**, **pgvector**, **redis**, **mailpit**,
  **dynamodb** (+ admin) — each only if the app uses it. Healthchecks +
  `depends_on`.
- **Locales:** generate `en_US`/`es_ES`/`pt_PT` if the app localizes output.
- **Ports (non-vscode variant):** 8000 (Django), 5555 (Flower), 8025 (mailpit),
  5433/5434 (postgres/pgvector), 8010 (dynamodb-admin).
- **Validation — DOCKER-REQUIRED:** `codecheck -f` (black + mypy) and `pytest`
  run **inside the container** (DB + native deps). The generated `AGENTS.md` /
  `DEVELOPMENT_COMMANDS.md` MUST flag these as Docker-only (SPEC §6.1).
- **Dual-user volume mounts:** mount the AI-CLI volumes for **both** `/root`
  (app runs as root) and `/home/dev-user` (devcontainer attaches as dev-user).

## 5. `python-cli-oss` — public Python CLI/package (e.g. cli: Click + httpx) — PUBLIC VARIANT

- **Signal:** `[project.scripts]` / `console_scripts` + Click/Typer/argparse;
  repo is **public OSS**.
- **Base image:** `python:3.x-slim-trixie` (+ Node for agent CLIs). **User:**
  `dev-user`. **`workspaceFolder`:** `/workspace`.
- **Supporting services:** **none** (no DB; talks to a remote API).
- **PUBLIC-OSS requirements (SPEC §5) — MUST:**
  - **`.dockerignore` at repo root** excluding secrets + AI-config (`.env`,
    `.env.*` but `!.env.example`, `.pypirc`, `.git`, `.claude*`/`.codex*`/
    `.cursor*`/`.gh_data`/`.dailybot_data`, `.devcontainer`, `node_modules`,
    build/test caches, OS cruft).
  - **Repo-root build context** (`build.context: ../..`) so the Dockerfile can
    `COPY` the lockfile/manifest, kept lean by the `.dockerignore`.
  - **Secret-free `.env.example`** (stub keys, no values); never bake secrets
    into the image.
  - **Lockfile pinning** for reproducibility (`COPY requirements/dev.txt` → pip
    install in its own cache layer; `pip-compile` keeps it pinned).
  - Isolate aggressive-pin tools (e.g. `python-semantic-release`) via
    `pipx --global` so they don't downgrade the user-visible env.
- **Validation:** `ruff check` + `mypy` + `pytest` (`*_test.py`) — runs on host
  *or* in container (no Docker hard requirement).

## 6. `static-site` — static/SSG marketing site (e.g. dailybot.com: Astro + Svelte)

- **Signal:** `astro.config.*` (or Next/Gatsby static export) + Tailwind.
- **Base image:** `node:24.x-trixie-slim`. **`workspaceFolder`:** `/app`.
- **Extra tooling:** **chromium** + its libs when the build runs headless Chrome
  (e.g. **Lighthouse** audits, screenshot generation).
- **Supporting services:** **none**.
- **Ports (non-vscode variant):** the dev/preview port (e.g. 4321 Astro).
- **Validation:** `astro check` + `pnpm run eslint:check` + build; Lighthouse if
  wired.

## 7. `orchestrator-hub` — coordination hub, no app stack (e.g. the Core Hub)

- **Signal (`ARCHETYPES.md`):** a `repositories/` folder of independent repos;
  root is mostly markdown/coordination; no single primary app stack.
- **Base image:** a light combined image (e.g. `python:3.x-slim-trixie` + Node
  for agent CLIs) — enough to run docs tooling + the agent CLIs. **User:**
  `dev-user`. **`workspaceFolder`:** `/workspace`.
- **Supporting services:** **NONE** — the hub coordinates; it does not run app
  databases. A **single** vscode service running `sleep infinity`.
- **Network:** still joins `dailybot-project-network` so the hub can reach
  sibling repo containers.
- **Validation:** light — markdown/link checks, frontmatter validation; no
  Docker-required app validation.
- **Note:** sub-repos under `repositories/` keep their **own** devcontainers; the
  hub's is intentionally minimal.

---

## How to use a preset

1. Identify the repo's stack from real manifests/lockfiles (reuse
   `.dwp/onboard/RECON.md` if present).
2. Pick the closest preset as a **checklist**.
3. **Verify every assumption** (base image version, services, ports, validation
   commands) against what the repo actually contains — drop services the app
   doesn't use, correct versions, capture the real commands.
4. Generate via the `templates/*.md` guides, keeping the SPEC §2 skeleton intact.
5. If the repo is public, apply the **public-OSS variant** (§5 / preset 5)
   regardless of language.
