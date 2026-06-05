# SPEC.md — Dailybot Addon (Normative)

## Abstract

This document is the **normative specification** of the DeepWorkPlan **Dailybot
addon**: an opt-in capability that connects an AI-first repository to the
developer's **Dailybot team** so DWP work — especially a **plan completion** —
surfaces to humans as a standup-style **progress/milestone report**. It defines
**what the addon installs/configures** (all opt-in), how it **defers
authentication** to the Dailybot skill's own consent flow, how the **optional
progress-report step** is wired into DWP execution, the **never-block** rule, the
**reconcile-don't-clobber** behavior, and the **vendor-neutral guardrail**.

The addon is governed by [`../README.md`](../README.md) and
[`methodology-spec/ADDONS.md`](../../spec/ADDONS.md): it is **never** required for
baseline AI-first conformance.

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Companions** | `SKILL.md`, `templates/INTEGRATION.md`, `../README.md`, `methodology-spec/ADDONS.md` |
| **License** | MIT |

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**,
**MAY**, **OPTIONAL**) are interpreted as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

Throughout, the **Dailybot skill** is the official agent skill pack
([`DailybotHQ/agent-skill`](https://github.com/DailybotHQ/agent-skill)); the
**Dailybot CLI** is its companion binary
([`DailyBotHQ/cli`](https://github.com/DailyBotHQ/cli), PyPI `dailybot-cli`).

---

## 2. Vendor-Neutral Guardrail (the rule that frames everything)

- The **core DeepWorkPlan methodology MUST have zero dependency on Dailybot.**
  It is vendor-neutral, MIT, and agent-agnostic. A repository **MUST** be fully
  conformant to the AI-first baseline (`DOCUMENTATION_STANDARD.md` §§2–7) and to
  the DWP specification with **zero** addons — including this one.
- This addon **MUST NOT** be presented as a precondition for using DWP, and the
  `onboard` flow **MUST NOT** auto-install it for everyone. It is offered, and
  applied only on explicit acceptance.
- Declining this addon **MUST** still produce a baseline-conformant repo.
- The addon's value is **purely additive team visibility** for developers/teams
  who already use Dailybot.

---

## 3. What the Addon Installs / Configures (all OPT-IN)

When accepted, the addon **MAY** install or configure the following — each only
with explicit acceptance, and each reconciled if already present (§7):

### 3.1 The Dailybot agent skill (recommended path)

- The addon **SHOULD** offer the **Dailybot agent skill** as the primary path,
  because it brings its own install/consent/auth flow and the `report`
  sub-skill. Supported install methods (the addon **MUST** offer, not force):
  - `npx skills add DailybotHQ/agent-skill` (cross-agent, recommended), **or**
  - OpenClaw native: `openclaw skills install dailybot`, **or**
  - `git clone https://github.com/DailybotHQ/agent-skill.git` + run its `setup.sh`.

### 3.2 The Dailybot CLI (the underlying bridge)

- The Dailybot CLI is the bridge the skill uses. The Dailybot skill installs it
  on first use via **its own SHA-256-verified consent flow**, so the addon
  **SHOULD NOT** install the CLI separately when the skill is being installed.
- When the developer explicitly wants the CLI directly, the supported paths are:
  - `curl -sSL https://cli.dailybot.com/install.sh | bash` — which the addon
    **MUST** pair with the **checksum/consent verification** documented in the
    Dailybot skill's `shared/auth.md` (cross-origin diff against the GitHub
    source + `.sha256` sidecar match, optional cosign). The addon **MUST NOT**
    recommend piping the script to a shell **unverified**, **or**
  - `pip install dailybot-cli` (Python 3.10+), **or**
  - `brew install dailybothq/tap/dailybot` (macOS).
- The addon **MUST NOT** reimplement the verified installer; it points at the
  Dailybot skill's flow.

### 3.3 Optional repo identity

- The addon **MAY** commit a repo identity so every contributor and agent signs
  reports under the same name: `.dailybot/profile.json` (or the
  gitignore-friendly `.dailybot_example/profile.json` template the CLI
  documents).
- A `key` (credential) field in that file is a **hard error** — the addon
  **MUST NOT** write credentials anywhere.

---

## 4. Authentication — DEFER, Do Not Reinvent

- The addon **MUST** defer all authentication to the Dailybot skill's own
  consent flow (`shared/auth.md`): `dailybot login` (email OTP) or
  `DAILYBOT_API_KEY` / `dailybot config key=...`, including the CLI install
  consent and the HTTP fallback.
- The addon **MUST NOT** prompt for email, OTP, or API keys itself, **MUST NOT**
  bypass or weaken that flow, and **MUST NOT** store any credential in any file
  it creates.
- If the developer declines authentication, the addon **MUST** skip reporting and
  continue — auth issues **MUST NOT** block the primary work (§6).

---

## 5. The Integration Value — Optional Progress/Milestone Reporting

This is the "why": when present, DWP **execution reports progress/milestones to
the developer's Dailybot team**.

### 5.1 What gets wired

- The addon **MUST** wire a clearly-**optional** report step into the repo's DWP
  execution documentation (the generated `AGENTS.md` reporting section and/or
  `docs/AI_AGENT_COLLAB.md`), describing: **when the Dailybot skill is installed,
  a DWP plan completion SHOULD emit a Dailybot report.**
- A **DWP plan completion** **SHOULD** be sent as a **milestone** report via the
  dailybot `report` sub-skill (`dailybot agent update "<what was built>"
  --milestone --json-data '<completed/in_progress/blockers>' --metadata
  '<repo/branch/model>'`). Intermediate single-task completions, when reported at
  all, are **regular** reports, not milestones.
- Report content **MUST** follow the dailybot `report` writing rules: describe
  **what was built and why**, in English, 1–3 sentences, never "completed a
  plan", never file paths / git stats / branch names / plan IDs.

### 5.2 How `execute` / plan-completion emits it

- The step is **conditional**: it fires **only** when the Dailybot skill/CLI is
  present and authenticated. The addon **MUST** document the detection check
  (e.g. `command -v dailybot`, or the skill installed at
  `~/.<agent>/skills/dailybot/`) and that the report routes through the dailybot
  `report` sub-skill, not a hand-rolled API call.
- The addon **MUST NOT** change the DWP `execute` public surface; it only adds an
  optional, conditional reporting hook described in the repo's docs.
- The addon **SHOULD** respect Dailybot's per-repo opt-out
  (`.dailybot/disabled`): if present, no report is sent.

---

## 6. Never-Block Rule (mandatory)

- Reporting **MUST NOT** block the developer's primary work or DWP `execute`.
- If the Dailybot skill/CLI is **absent**, **unauthenticated**, the network is
  **down**, or any command **errors**, the addon's wired step **MUST**: warn
  briefly once, continue the primary task, **not** retry automatically, and
  **not** enter a diagnostic loop. This mirrors the Dailybot skill's own
  non-blocking guarantee.
- Plan execution **MUST** succeed regardless of whether the report was sent.

---

## 7. Reconcile, Don't Clobber

- The addon **MUST** detect existing setup before acting: an already-installed
  Dailybot skill, a `dailybot` CLI on PATH, a committed `.dailybot/profile.json`
  / `.dailybot_example/profile.json`, or an existing report step in the repo's
  DWP docs.
- Where a piece already exists, the addon **MUST** preserve it and only fill
  gaps — it **MUST NOT** reinstall, re-prompt auth, overwrite a working identity,
  or duplicate the report step.
- Any destructive change to an existing file **MUST** be approved by the user
  first (`AGENT_PROTOCOL.md`); the addon **MUST** record what it changed.

---

## 8. Conformance + Validation Step

A repo is **conformant to this addon** when **all** hold (after acceptance):

1. The Dailybot skill **or** CLI is available (installed via one of the §3
   opt-in paths), **or** the addon recorded why it could not install here
   (sandbox/CI) without failing onboarding.
2. Authentication was **deferred** to the Dailybot skill's `shared/auth.md` — no
   email/OTP/API-key prompting and **no credential** written by this addon.
3. The repo's DWP execution docs describe the **optional, conditional,
   non-blocking** report step, sending a **milestone** on plan completion via the
   dailybot `report` sub-skill.
4. If a repo identity was committed, it is credential-free (no `key` field) and
   resolves consistently for all contributors/agents.
5. Existing skill/CLI/identity/report-step were **reconciled**, not clobbered.
6. The vendor-neutral guardrail holds: nothing in the repo implies DWP **requires**
   Dailybot; the repo is still baseline-conformant.
7. **Smoke test (best-effort):** if the CLI is present and authenticated,
   `dailybot status --auth` succeeds; otherwise note why. Never fail onboarding
   on this.

---

## 9. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `SKILL.md` (the onboarding hook + flow), `templates/INTEGRATION.md` (reasoning aid)
- `../README.md` (addon mechanism), [`../../spec/ADDONS.md`](../../spec/ADDONS.md) (concept + pointer)
- Dailybot skill: [`DailybotHQ/agent-skill`](https://github.com/DailybotHQ/agent-skill)
  — `SKILL.md`, `shared/auth.md`, `report/SKILL.md`
- Dailybot CLI: [`DailyBotHQ/cli`](https://github.com/DailyBotHQ/cli), PyPI `dailybot-cli`

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
