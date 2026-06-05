# Template — `docker/local/docker-compose.{yaml,yml}` (reason, don't copy)

Reasoning template. The **AI-CLI persistence volumes**, the
**`dailybot-project-network`**, and **`DOCKER_DEV_ENV=vscode` → `sleep infinity`**
are the fixed skeleton; **services** and **ports** are reasoned per repo.

## The fixed skeleton (every repo)

A devcontainer service (`{service}vscode`) that:
- builds from `docker/local/{service}/Dockerfile`,
- mounts the repo at `workspaceFolder`,
- mounts the **five AI-CLI named volumes** + read-only ssh/gitconfig,
- sets `DOCKER_DEV_ENV=vscode` and `command: sleep infinity`,
- publishes **no** host ports,
- joins `dailybot-project-network`.

```yaml
# name: optional compose project name (e.g. dailybotplatformlocal)

services:
  {service}vscode:
    container_name: {project-slug}            # e.g. dailybot-hub, dailybot-cli
    init: true
    build:
      context: {. | ../..}                    # repo-root (../..) for public-OSS / COPY-from-root builds
      dockerfile: ./{service}/Dockerfile       # or ./docker/local/{service}/Dockerfile when context=../..
    working_dir: {workspaceFolder}
    command: sleep infinity                    # FIXED — devcontainer stays up; app does NOT run here
    environment:
      - DOCKER_DEV_ENV=vscode                  # FIXED — flips entrypoint behavior
    env_file:
      - {service}/.env                         # private repos; public repos use a secret-free example
    volumes:
      - {../.. | .}:{workspaceFolder}
      # --- FIXED: AI-CLI persistence (survives rebuilds) ---
      - claude_data:{user-home}/.claude_data
      - codex_data:{user-home}/.codex_data
      - cursor_data:{user-home}/.cursor_data
      - dailybot_data:{user-home}/.dailybot_data
      - gh_data:{user-home}/.gh_data
      - ${HOME}/.ssh:{user-home}/.ssh_host:ro
      - ${HOME}/.gitconfig:{user-home}/.gitconfig:ro
    # ports: []                                # devcontainer publishes NO host ports
    networks:
      - dailybot

  # --- REASONED: only services the app actually depends on (see presets.md) ---
  # postgres / pgvector / redis / mailpit / dynamodb / localstack / ... — add per real deps.

volumes:
  claude_data: {}
  codex_data: {}
  cursor_data: {}        # Cursor CLI session/auth
  dailybot_data: {}      # Dailybot CLI config/auth
  gh_data: {}
  # + REASONED data volumes for any DB/cache you added (e.g. local_postgres14_data)

networks:
  dailybot:
    name: dailybot-project-network            # FIXED — shared external network
    external: true
```

## Decision notes

- **Where the volumes mount (`{user-home}`)** depends on the dev user: `/root`
  *and/or* `/home/dev-user`. Heavier repos (api-services) mount **both** root and
  `dev-user` paths against the same named volumes so the container works whether
  the app runs as root or the devcontainer attaches as `dev-user`. A simple repo
  mounts only the `dev-user` paths.
- **Two-variant pattern (app + vscode):** when the app also runs in Docker, keep
  a base `{service}` service (real `command`, publishes ports) and a
  `{service}vscode` variant (YAML anchor `<<: *base`) that overrides
  `environment: DOCKER_DEV_ENV=vscode`, `command: sleep infinity`, and
  `ports: []`. The hub/cli, which only run the dev container, can collapse to a
  single vscode service.
- **Supporting services**: add **only** what the app uses. Give each a healthcheck
  if other services `depends_on` it. Publish their admin/UI ports on the non-vscode
  variant only (e.g. mailpit `8025`, dynamodb-admin `8010`).
- **Public-OSS**: `build.context: ../..` + a root `.dockerignore` (see SPEC §5).
- **Reconcile mode**: keep existing service names, ports, and network if they
  already work; just ensure the five AI-CLI volumes, the ro ssh/gitconfig mounts,
  the `DOCKER_DEV_ENV=vscode`/`sleep infinity` flags, and the network name are
  present.
