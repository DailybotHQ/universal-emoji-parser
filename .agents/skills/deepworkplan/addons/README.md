# addons/ — Opt-In Addon Mechanism

This directory ships **inside** the DeepWorkPlan skill
(`skills/deepworkplan/addons/`) but every addon here is **opt-in** and **never**
part of the AI-first baseline. A repository is fully conformant with **zero**
addons installed. (Normative source: Task 2's `methodology-spec/ADDONS.md`.)

An **addon** is a self-contained, optional capability that the `onboard` flow
can layer onto a repo *after* the mandatory AI-first scaffolding
(`AGENTS.md` + `docs/` + per-module docs + `.agents/` + `.claude → .agents` +
the DWP skill + `.dwp/`). Addons encode high-value best practices that the
audit found consistently across Dailybot repos but that a repo does **not** need
in order to be AI-first.

## The four rules every addon obeys

1. **Never required.** An addon MUST NOT be a precondition of baseline
   conformance. Declining every addon still yields a fully AI-first repo.
2. **Reconcile, don't clobber.** When an accepted addon finds existing setup it
   would touch (an existing `.devcontainer/`, `docker/`, `.gitignore`,
   `.env.example`), it reconciles **additively** — preserving working values
   (ports, network names, env flags, project identity) and bringing the rest
   toward the addon standard. Any destructive change to an existing file
   requires explicit user approval (`AGENT_PROTOCOL.md`).
3. **Reason, don't copy-paste.** Like the rest of the methodology, an addon's
   templates are filled by **reasoning about the target repo's actual stack**,
   not by copying one reference repo's files verbatim. The *shape* is fixed; the
   *content* is adapted per repo. (One narrow exception: a piece so stable it is
   copied near-verbatim is explicitly flagged as such — e.g. the devcontainer
   AI-CLI persistence entrypoint.)
4. **Archetype-agnostic.** An addon MAY be layered onto either an individual
   repo or an orchestrator hub (`ARCHETYPES.md`); the addon's own spec says how
   each archetype differs.

## The addon contract — four mandatory components

Each addon is a subfolder here and MUST ship all four:

| Component | File(s) | Purpose |
|-----------|---------|---------|
| **Spec** | `SPEC.md` | RFC-2119 description of what the addon provides and what "conformant to this addon" means. |
| **Reasoning templates** | `templates/*` | Parameterized guides with placeholders + decision notes the agent fills by reasoning about the repo's stack — not literal copies of one repo. |
| **Onboarding hook** | `SKILL.md` (`user-invocable`) | The entry point the `onboard` flow calls to offer, then (if accepted) apply the addon. Also directly invocable on an already-onboarded repo. |
| **Validation step** | A checklist inside `SPEC.md`/`SKILL.md` | Confirms the addon was applied correctly (files exist, settings present, smoke check passes). |

An addon MAY additionally ship per-stack presets, examples, or migration notes.

## How `onboard` discovers and applies addons

- **Discovery** — `onboard` enumerates this directory (`../addons/`) and offers
  each subfolder as an **explicit opt-in** step in **Phase 7b**, after the core
  scaffolding (Phases 3–7).
- **Consent** — it never applies an addon without user acceptance. In trust
  mode it MAY *recommend* the obviously-applicable ones, but still surfaces them.
- **Decline is safe** — a declined addon leaves a baseline-conformant repo.
- **On accept** — `onboard` reads the addon's `SKILL.md`, runs its hook
  (reasoning about the detected stack), then runs its validation step.

## Addons

| Addon | Folder | Status |
|-------|--------|--------|
| Devcontainer support | [`addons/devcontainer/`](devcontainer/SKILL.md) | **Authored** — compose-based `.devcontainer/` + `docker/` with AI-CLI persistence, `dailybot-project-network`, `DOCKER_DEV_ENV=vscode`, project-identity precedence, public-OSS variant, 7 reasoning presets. |
| Dailybot integration | [`addons/dailybot/`](dailybot/SKILL.md) | **Authored** — opt-in install of the Dailybot agent skill / CLI, auth **deferred** to the Dailybot skill's own consent flow, and an **optional, best-effort, never-blocking** progress/milestone report wired into DWP execution (a plan completion → a Dailybot milestone report). The core methodology has **zero** Dailybot dependency. |
| Dependency upgrade | [`addons/dependency-upgrade/`](dependency-upgrade/SKILL.md) | **Authored** — opt-in, **package-manager-agnostic** dependency upgrades: detect the repo's real manager (npm/pnpm/yarn + ncu, pip/poetry/uv, cargo, go mod, bundler, composer…), classify by semver, upgrade in safe batches, run the repo's **real** validation gate after each batch, revert a failing batch, summarize. Installs a `/lib-upgrade` delegator into the repo's `.agents/commands/` only when accepted. |
| Design system | [`addons/design-system/`](design-system/SKILL.md) | **Authored** — opt-in, **frontend-scoped** `DESIGN.md` at `docs/DESIGN.md` (indexed from `AGENTS.md`; root only if no `docs/` tree): reason about the repo's **real** design tokens (CSS vars / Tailwind config / token files / component styles), document the canonical sections (colors & roles, typography, layout, elevation, shapes, components, responsive, do's & don'ts, agent prompt guide), check **WCAG AA** contrast + token integrity, reconcile an existing `DESIGN.md` instead of clobbering it. Offered by `onboard` **only when a UI surface / design system is detected**. |

> This README is the mechanism doc. The first addon, `addons/devcontainer/`, is
> the methodology's proof that the mechanism works; the second,
> `addons/dailybot/`, shows an addon can layer optional team visibility while
> keeping the methodology fully vendor-neutral; the third,
> `addons/dependency-upgrade/`, shows an addon can encode a recurring maintenance
> workflow that reasons about each repo's actual stack; the fourth,
> `addons/design-system/`, shows an addon can capture durable, repo-native UI
> design context for frontend repos (a repo is conformant with zero addons).
