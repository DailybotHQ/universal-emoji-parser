# Template — `.devcontainer/devcontainer.json` (reason, don't copy)

This is a **reasoning template**, not a file to copy. Fill the `{...}`
placeholders from the target repo's real stack (see `presets.md`).

## What's fixed (the skeleton — keep as-is)

- **Compose-based**: `dockerComposeFile` → `../docker/local/docker-compose.{yaml,yml}`.
- `service` = the **vscode** service (the one running `sleep infinity`).
- `runServices` = `["{service}"]` (start only the dev service by default; add
  supporting services here only if the dev container needs them up to attach).
- `customizations.vscode.extensions` MUST include the AI tooling extension(s)
  (`Anthropic.claude-code`, `dailybot.dailybot`).

## What you reason per repo

| Field | Reason from | Examples |
|-------|-------------|----------|
| `name` | Project identity precedence (SPEC §4) — `.dailybot/profile.json` → `DAILYBOT_PROJECT_NAME` → here. | `"Core Hub"`, `"API Services"`, `"Dailybot CLI"`. |
| `service` | The vscode service name in the compose file. | `hubvscode`, `djangovscode`, `clivscode`, `webvscode`. |
| `workspaceFolder` | The repo's mount target. | `/workspace`, `/app`, `/code/js`. |
| `remoteUser` | The container's dev user. | `dev-user` (created) or `node`. |
| extensions | Stack-appropriate IDE extensions + AI tooling. | Python+Pylance+even-better-toml for Python; ESLint/Volar for Node/Vue. |

## Skeleton to adapt

```jsonc
{
  "name": "{Project Name — resolved per SPEC §4}",
  "dockerComposeFile": "../docker/local/docker-compose.yaml",
  "service": "{service}vscode",
  "workspaceFolder": "{/workspace | /app | /code/js}",
  "runServices": ["{service}vscode"],
  "remoteUser": "{dev-user | node}",
  "customizations": {
    "vscode": {
      "extensions": [
        // Always: AI tooling
        "Anthropic.claude-code",
        "dailybot.dailybot"
        // + stack-appropriate (reason these): e.g.
        // Python:  "ms-python.python", "ms-python.vscode-pylance", "tamasfe.even-better-toml"
        // Node:    "dbaeumer.vscode-eslint", "esbenp.prettier-vscode"
        // Vue:     "Vue.volar"
        // common:  "eamodio.gitlens", "vscode-icons-team.vscode-icons"
      ]
    }
  }
}
```

## Decision notes

- **Do not publish ports here.** The vscode service publishes no host ports; VS
  Code forwards them. Host port bindings live on the non-vscode compose service.
- **Hub / orchestrator**: `runServices` is just the dev service — no app
  services exist.
- **Reconcile mode**: if a `devcontainer.json` already exists, keep its working
  `name`/`service`/`workspaceFolder`; only add the AI tooling extensions and the
  compose-based wiring if missing. Don't churn a working file.
