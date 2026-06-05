---
name: deepworkplan-addon-devcontainer
description: Optional DeepWorkPlan addon that adds (or reconciles) a compose-based devcontainer to a repo — base image and supporting services reasoned from the detected stack, with persistent AI-CLI auth, the dailybot-project-network, the DOCKER_DEV_ENV=vscode convention, and project-identity precedence. Opt-in, never required, reconciles existing setups instead of clobbering them. Use when the developer wants a reproducible isolated dev container for an AI-first repo.
version: "2.4.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
metadata: {"openclaw":{"emoji":"📦","homepage":"https://deepworkplan.com","requires":{"anyBins":["docker","git"]}}}
---

# DeepWorkPlan — Devcontainer Addon

Add a **reproducible, isolated dev container** to the target repo so any human or
AI agent gets the same environment, with **AI-CLI auth that survives rebuilds**.
This is the methodology's **first opt-in addon** — it is **never** required for a
repo to be AI-first.

> ## The rule that overrides everything: REASON about the repo, then generate
>
> ~85% of every Dailybot devcontainer is identical — that **common skeleton** is
> the stable part you carry forward. ~15% is repo-specific — base image, user,
> `workspaceFolder`, supporting services, ports, secrets — and that part you
> **reason out from the target repo's actual stack**, never by copying one
> reference repo. The one near-verbatim exception is the **AI-CLI persistence
> entrypoint** (`templates/entrypoint.md`): it is stable enough to copy with only
> the home-path / user adjusted.

## Read these first (all relative inside the skill)

- [`SPEC.md`](SPEC.md) — the normative (RFC-2119) contract: common skeleton,
  per-repo reasoning checklist, project-identity precedence, validation rule,
  public-OSS variant.
- [`templates/presets.md`](templates/presets.md) — the **7 reasoning presets**
  (node-web, node-service, node-lambda, python-service, python-cli-oss,
  static-site, orchestrator-hub). Match one as a *starting checklist*, then
  verify every assumption against the real repo — **detected reality wins**.
- The other `templates/*.md` — reasoning guides for each file you generate.
- `../README.md` — the addon mechanism (opt-in, reconcile-don't-clobber, contract).

## When this runs

- From **`onboard` Phase 7b** — after the core AI-first scaffolding, `onboard`
  offers this addon; if accepted it reads this SKILL and runs the flow below.
- **Directly** — `/deepworkplan-addon-devcontainer` on an already-onboarded repo
  to add or reconcile a devcontainer.

## The flow

### Step 0 — Consent + reconcile check
1. Confirm the developer wants a devcontainer (skip silently if declined — the
   repo stays baseline-conformant).
2. **Detect existing setup.** Look for `.devcontainer/`, `docker/`,
   `docker-compose.{yml,yaml}`, a `Dockerfile`. If any exist, you are in
   **reconcile mode**: you MUST preserve working values and MUST NOT overwrite or
   delete files without explicit approval (see SPEC §Reconcile).

### Step 1 — Reason about the stack (reuse onboard's RECON)
If `onboard` already produced `.dwp/onboard/RECON.md`, read it. Otherwise detect:
language/runtime, package manager (from the lockfile that exists), build/test/
lint/typecheck commands, supporting services implied by the app's dependencies
(DB / cache / queue / emulators), exposed ports, and whether the repo is
**public** (OSS) or private. Pick the matching **preset** from
`templates/presets.md` as a checklist.

### Step 2 — Decide the reasoned ~15% (SPEC §3 checklist)
- **Base image + user + `workspaceFolder`** from the language (Node vs Python; a
  `node` vs created `dev-user`; `/app` vs `/workspace` vs `/code/js`).
- **Supporting services** from real dependencies — only those the app actually
  uses (postgres / pgvector / redis / mailpit / dynamodb / localstack / chromium).
- **Ports**, **secrets handling** (public vs private), **multi-stage** build need,
  locales, extra CLIs (AWS, Lighthouse/chromium).

### Step 3 — Generate / reconcile the files
Using the templates, produce or reconcile:
`.devcontainer/devcontainer.json`, `docker/local/docker-compose.{yaml,yml}`,
`docker/local/{service}/Dockerfile`, `docker/local/{service}/entrypoint.sh`
(the near-verbatim AI-CLI persistence piece), `docker/custom_commands.sh`, and —
**for public repos** — `.dockerignore` + a secret-free `.env.example`. Always:
keep the **common skeleton** (AI-CLI persistence volumes, `dailybot-project-network`,
`DOCKER_DEV_ENV=vscode`→`sleep infinity`, `codecheck`/`check`/`fix`/`test`).

### Step 4 — Project identity
Set identity by the precedence in SPEC §4
(`.dailybot/profile.json` → `DAILYBOT_PROJECT_NAME` → `devcontainer.json name`).
Do not invent a new name if one already resolves.

### Step 5 — Validate (SPEC §6)
Run the validation checklist. Report what was created/reconciled, the chosen
base image + services + ports, identity source, and any deferred items. If a
container build/smoke test cannot run here, say why (don't silently skip).

## Failure-mode guardrails

- **Never required, never blocking.** If the developer declines, stop cleanly.
- **No clobber.** Existing devcontainer/docker files are reconciled or
  backed-up-and-asked, never silently overwritten.
- **No phantom services.** Only add a service the app actually depends on.
- **No secrets in images or in `.env.example`** — especially for public repos.
- **Reason wins over preset.** If the preset and the real repo disagree,
  re-derive from the repo.
