# ADDONS.md — Opt-In Addon Mechanism

## Abstract

This document defines the **opt-in addon mechanism** for the DeepWorkPlan
methodology: a way to layer optional, self-contained capabilities onto a repository
during onboarding **without** making them part of the AI-first baseline. An addon is
**never required** for conformance; it is offered, accepted or declined, and — when
accepted — **reconciles** with the repo's existing setup rather than clobbering it.

This is a **concept + pointer** document. It defines the addon contract, discovery,
and the reconcile-don't-clobber rule, and names the **shipping addons**
(devcontainer support and Dailybot integration), pointing to their full
implementations. It does **not** contain any addon's implementation.

---

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Supersedes** | (net-new in v2; no v1 equivalent) |
| **Companions** | `DOCUMENTATION_STANDARD.md`, `DWP_SPECIFICATION.md`, `AGENT_PROTOCOL.md`, `ARCHETYPES.md` |
| **License** | MIT |

> **Divergence from v1.** v1 had **no addon concept** anywhere in the framework.
> The addon mechanism is **net-new in v2** (`RECONCILIATION.md` divergence #7,
> idea #7), introduced to keep the core baseline lean while allowing optional
> capabilities (devcontainer support, then Dailybot integration) to be layered in.

---

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **MAY**, **OPTIONAL**,
etc.) are interpreted as in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 2. What an Addon Is

- An **addon** is a self-contained, optional capability that the onboarding flow
  **MAY** layer onto a repository.
- An addon **MUST NOT** be required by the AI-first baseline
  (`DOCUMENTATION_STANDARD.md` §§2–7). A repository **MUST** be fully conformant
  with **zero** addons installed.
- Addons are **archetype-agnostic** (`ARCHETYPES.md`): one **MAY** be layered onto
  either an individual repo or an orchestrator hub.
- Addons live under the DWP skill at `skills/deepworkplan/addons/{addon-name}/`.

---

## 3. The Addon Contract

Each addon **MUST** ship all four of the following components:

| Component | Requirement | Purpose |
|-----------|-------------|---------|
| **Spec** | **MUST** | A normative description (RFC-2119) of what the addon provides and what "conformant to this addon" means. |
| **Reasoning templates** | **MUST** | Templates the agent fills by **reasoning** about the target repo's stack (not copy-paste), consistent with the reason-per-repo rule (`DOCUMENTATION_STANDARD.md` §7). |
| **Onboarding hook** | **MUST** | The integration point that lets the `onboard` flow offer the addon as an **optional** step. |
| **Validation step** | **MUST** | A check that confirms the addon was applied correctly (files exist, settings present, smoke check passes). |

An addon **MAY** additionally ship examples, per-stack presets, or migration notes.

---

## 4. Discovery by the `onboard` Flow

- The onboarding flow **MUST** discover available addons by enumerating
  `skills/deepworkplan/addons/`.
- For each discovered addon, the flow **MUST** present it to the user as an
  **opt-in** step and **MUST NOT** apply it without explicit acceptance.
- If the user declines an addon, the flow **MUST** skip it and **MUST** still
  produce a baseline-conformant repository.
- When an addon is accepted, the flow **MUST** run the addon's onboarding hook and,
  on completion, the addon's validation step.

---

## 5. Reconcile, Don't Clobber

- When an accepted addon detects an **existing** setup it would touch (e.g. an
  existing `.devcontainer/` or `docker/`), it **MUST reconcile** with that setup —
  preserving working configuration and additively bringing it toward the addon
  standard.
- An addon **MUST NOT** blindly overwrite or delete existing files. Per
  `AGENT_PROTOCOL.md`, any destructive change to an existing file **MUST** be
  approved by the user first.
- The reconcile result **SHOULD** preserve repo-specific values that already work
  (ports, network names, environment flags, project identity) and **MUST** record
  what it changed.

---

## 6. Shipping Addons

Four addons ship today. All are **opt-in** and **never required** — a repository
is fully conformant with **zero** addons installed.

### 6.1 Devcontainer Support (first addon)

- **Devcontainer support** is the **first** addon. Its full normative content
  (spec, reasoning templates, onboarding hook, validation step, per-stack presets,
  and the public-OSS variant) **MUST** live at:

  ```
  skills/deepworkplan/addons/devcontainer/
  ```

- Scope (per `ORCHESTRATOR_MANIFEST.md`): a compose-based `.devcontainer/` + `docker/`
  setup that preserves **AI-CLI persistence**, the **`dailybot-project-network`**,
  the **`DOCKER_DEV_ENV=vscode`** flag, and **project-identity precedence** —
  reconciled, not clobbered, against any existing devcontainer setup.
- The full implementation lives at
  `skills/deepworkplan/addons/devcontainer/` — see its
  [`SKILL.md`](../addons/devcontainer/SKILL.md)
  (onboarding hook), [`SPEC.md`](../addons/devcontainer/SPEC.md)
  (RFC-2119 common skeleton, reasoning checklist, project-identity precedence,
  public-OSS variant, validation), and `templates/` (reasoning templates + the 7
  presets).
- Each child-DWP **MAY** include one optional task to reconcile its repo's
  devcontainer to this addon, and **MUST** skip it if declined
  (`ORCHESTRATOR_MANIFEST.md` key decision).

### 6.2 Dailybot Integration (second addon)

- **Dailybot integration** is the **second** addon. Its full normative content
  (spec, reasoning template, onboarding hook, validation step) **MUST** live at:

  ```
  skills/deepworkplan/addons/dailybot/
  ```

- Scope: an **opt-in** connection to the developer's **Dailybot team**. When
  accepted, it offers (never forces) install of the **Dailybot agent skill**
  (`npx skills add DailybotHQ/agent-skill`, OpenClaw, or git clone + `setup.sh`)
  and/or the **Dailybot CLI** (`pip install dailybot-cli`,
  `brew install dailybothq/tap/dailybot`, or the SHA-256-verified
  `cli.dailybot.com/install.sh`); **defers all authentication** to the Dailybot
  skill's own consent flow (`shared/auth.md` — `dailybot login` or
  `DAILYBOT_API_KEY`); and wires an **optional, best-effort, never-blocking**
  progress-report step into DWP execution so a **plan completion** emits a
  Dailybot **milestone** report via the dailybot `report` sub-skill.
- **Vendor-neutral guardrail:** the core DeepWorkPlan methodology has **zero**
  Dailybot dependency. This addon **MUST NOT** be auto-installed for everyone —
  the `onboard` flow recommends it only when the developer/team already uses
  Dailybot, and a repo with zero addons is fully conformant.
- The full implementation lives at
  `skills/deepworkplan/addons/dailybot/` — see its
  [`SKILL.md`](../addons/dailybot/SKILL.md)
  (onboarding hook), [`SPEC.md`](../addons/dailybot/SPEC.md)
  (RFC-2119 contract: opt-in install, deferred auth, optional reporting,
  never-block rule, vendor-neutral guardrail, validation), and
  `templates/INTEGRATION.md` (reasoning aid).

### 6.3 Dependency Upgrade (third addon)

- **Dependency upgrade** is the **third** addon. Its full normative content (spec,
  reasoning templates, onboarding hook, validation step, the `/lib-upgrade`
  delegator template) **MUST** live at:

  ```
  skills/deepworkplan/addons/dependency-upgrade/
  ```

- Scope: **package-manager agnostic**, **opt-in** dependency upgrades. When
  accepted, it detects the repo's **real** package manager (npm/pnpm/yarn + ncu,
  pip/poetry/uv, cargo, go mod, bundler, composer, …), classifies upgrades by
  semver, upgrades in **safe batches**, runs the repo's **real** validation gate
  after each batch, **reverts** a failing batch, and summarizes — and **only when
  accepted** installs a `/lib-upgrade` delegator into the repo's
  `.agents/commands/`.
- The full implementation lives at
  `skills/deepworkplan/addons/dependency-upgrade/` — see its
  [`SKILL.md`](../addons/dependency-upgrade/SKILL.md) (onboarding hook),
  [`SPEC.md`](../addons/dependency-upgrade/SPEC.md) (RFC-2119 contract: detection,
  semver classification, batched upgrade, validate-after-each-batch gate,
  revert-on-failure, reconcile-don't-clobber, validation), and `templates/`.

### 6.4 Design System (fourth addon)

- **Design system** is the **fourth** addon. Its full normative content (spec,
  reasoning templates, onboarding hook, validation step) **MUST** live at:

  ```
  skills/deepworkplan/addons/design-system/
  ```

- Scope: a **frontend/UI-scoped**, **opt-in** capability that gives a repo a
  **`DESIGN.md`** — placed at **`docs/DESIGN.md`** alongside the repo's other specs
  (root only if the repo has no `docs/` tree) and **indexed from `AGENTS.md`** — a
  Markdown design-system file any coding agent reads to generate UI consistent with
  the repo's **own** design system. When accepted,
  it **reasons about the repo's actual design tokens** (CSS custom properties, a
  Tailwind config, token files, component styles) — **never** copying a brand file —
  documents the canonical sections (colors & roles, typography, layout/spacing,
  elevation, shapes, components, responsive behavior, do's & don'ts, agent prompt
  guide), checks **WCAG AA** contrast and token integrity, and reconciles an
  existing `DESIGN.md` instead of clobbering it. It is **default-on when detected**
  (addon SPEC §3.1): when a UI surface / design system **is** detected the `onboard`
  flow **applies** it in trust mode and **strongly recommends** it in guided mode;
  when no UI surface is present it is **not** offered. It remains **never required** —
  a zero-addon repo is fully conformant.
- **Distinct from per-feature design docs:** this addon provides a **repo-level,
  persistent** design-system file; it is **not** a per-feature technical design
  document (the "requirements → design → tasks" `design.md` of tool-bound
  spec-driven workflows). DeepWorkPlan deliberately ships **no** separate
  per-feature design-doc archetype — a plan's README (Goal + Context), each task's
  Context and **Acceptance Criteria**, and the **validation gates** already fulfill
  that role; this addon fills the one gap that role does not cover: durable,
  repo-native **UI** design context.
- The full implementation lives at
  `skills/deepworkplan/addons/design-system/` — see its
  [`SKILL.md`](../addons/design-system/SKILL.md) (onboarding hook),
  [`SPEC.md`](../addons/design-system/SPEC.md) (RFC-2119 contract: frontend-scope
  gate, canonical sections, reason-don't-copy, reconcile-don't-clobber,
  accessibility & token integrity, pragmatic-reference posture, validation), and
  `templates/` (the `DESIGN.md` skeleton, per-stack presets, agent prompt guide).

> This `ADDONS.md` is the concept + pointer; it **MUST NOT** be treated as any
> addon's implementation.

---

## 7. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `DOCUMENTATION_STANDARD.md` (§7 reason-per-repo), `AGENT_PROTOCOL.md` (approval gates), `ARCHETYPES.md`, `DWP_SPECIFICATION.md`
- `../RECONCILIATION.md` (divergence #7), `../../ORCHESTRATOR_MANIFEST.md` (devcontainer-addon decision)
- Devcontainer addon implementation (`skills/deepworkplan/addons/devcontainer/`)
- Dailybot addon implementation (`skills/deepworkplan/addons/dailybot/`)
- Dependency-upgrade addon implementation (`skills/deepworkplan/addons/dependency-upgrade/`)
- Design-system addon implementation (`skills/deepworkplan/addons/design-system/`)

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
