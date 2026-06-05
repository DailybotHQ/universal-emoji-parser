---
name: deepworkplan-addon-dailybot
description: Optional DeepWorkPlan addon that connects an AI-first repo to the developer's Dailybot team — installing (with consent) the Dailybot agent skill and/or the Dailybot CLI, and wiring a best-effort progress/milestone report into DWP execution so a plan completion surfaces to the team. Opt-in, never required, never blocks the work, reconciles existing setups instead of clobbering them, and defers all auth to the Dailybot skill's own consent flow. Use when the developer or team already uses Dailybot and wants DWP progress visible to humans.
version: "2.4.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
metadata: {"openclaw":{"emoji":"📡","homepage":"https://deepworkplan.com","requires":{"anyBins":["git"]}}}
---

# DeepWorkPlan — Dailybot Addon

Connect the target repo to the developer's **Dailybot team** so that DWP work —
especially a **plan completion** — surfaces to humans as a standup-style
**progress/milestone report**. This is an **opt-in addon**; it is **never**
required for a repo to be AI-first, and it **never blocks** the actual work.

> ## The rule that overrides everything: this addon DEFERS, it does not reinvent
>
> The official **Dailybot agent skill** already owns install, consent, auth,
> context detection, the writing style, and the non-blocking guarantee. This
> addon's job is narrow: (1) **offer** to install the Dailybot skill/CLI through
> their own consent flows, and (2) **wire** an optional report step into DWP
> `execute`/plan-completion that routes through the dailybot `report` sub-skill.
> It MUST NOT duplicate, bypass, or weaken any Dailybot consent or auth flow —
> it points at them. (Normative source: [`SPEC.md`](SPEC.md).)

## Positioning guardrail (read before anything)

The **core DeepWorkPlan methodology has ZERO Dailybot dependency.** It is
vendor-neutral, MIT, and agent-agnostic. A repo with **zero addons** — including
this one — is fully conformant. This addon adds *team visibility* for developers
who already use Dailybot; declining it leaves a fully AI-first repo. Never
present Dailybot as a precondition for DWP, and never auto-install it for
everyone.

## Read these first (all relative inside the skill)

- [`SPEC.md`](SPEC.md) — the normative (RFC-2119) contract: what is installed
  (all opt-in), how auth is deferred, how the report step is wired, the
  never-block rule, and the vendor-neutral guardrail.
- [`templates/INTEGRATION.md`](templates/INTEGRATION.md) — reasoning guidance
  (NOT copy-paste): detect-if-already-installed, how to wire the optional
  report step into DWP execution, and the consent / never-block rules.
- `../README.md` — the addon mechanism (opt-in, reconcile-don't-clobber, contract).

## When this runs

- From **`onboard` Phase 7b** — after the core AI-first scaffolding, `onboard`
  offers this addon alongside devcontainer; if accepted it reads this SKILL and
  runs the flow below.
- **Directly** — `/deepworkplan-addon-dailybot` on an already-onboarded repo to
  add the Dailybot integration.

## The flow

### Step 0 — Consent + recommend-only-if-relevant
1. **Confirm relevance.** Offer this addon only when it makes sense: the
   developer or team **already uses Dailybot**, or explicitly asks for team
   reporting. In trust/auto mode you MAY recommend it **only** on that signal —
   do **not** auto-install for everyone. If the developer declines, stop cleanly;
   the repo stays baseline-conformant.
2. **Detect existing setup (reconcile-don't-clobber).** Before installing
   anything, check what is already present (see `templates/INTEGRATION.md`):
   - Dailybot skill already installed at the agent's skills dir
     (`~/.<agent>/skills/dailybot/`)?
   - `dailybot` CLI already on PATH (`command -v dailybot`)?
   - A repo identity already committed (`.dailybot/profile.json` or
     `.dailybot_example/profile.json`)?
   - An existing report step already wired into the repo's DWP `execute` notes?
   If a piece already exists, **do not redo it** — record it and only fill gaps.

### Step 1 — Offer the Dailybot skill + CLI install (OPT-IN, defer consent)
Present the install paths and let the developer choose; **never run an installer
without their explicit acceptance** — and where the Dailybot skill's own consent
flow applies, defer to it rather than prompting yourself.

- **Dailybot agent skill** (the recommended path — it brings the consent/auth
  flow with it):
  - `npx skills add DailybotHQ/agent-skill` (cross-agent, recommended), or
  - OpenClaw native: `openclaw skills install dailybot`, or
  - `git clone https://github.com/DailybotHQ/agent-skill.git` + run its `setup.sh`.
- **Dailybot CLI** (the underlying bridge; the skill installs it on first use
  via its own SHA-256-verified consent flow — you generally do **not** install
  it separately, but these are the supported paths if asked):
  - `curl -sSL https://cli.dailybot.com/install.sh | bash` — pair with the
    **checksum/consent verification** the Dailybot skill documents in
    `shared/auth.md` (cross-origin diff + `.sha256` sidecar check; never run it
    unverified), or
  - `pip install dailybot-cli` (Python 3.10+), or
  - `brew install dailybothq/tap/dailybot` (macOS).

> **Do not reimplement the verified installer.** If the Dailybot skill is being
> installed, let *its* `shared/auth.md` flow drive the CLI install + checksum
> verification. Only surface the raw CLI commands when the developer explicitly
> wants the CLI without the skill.

### Step 2 — Auth: DEFER to the Dailybot skill's own consent flow
Do **not** prompt for email, OTP, or API keys yourself, and do **not** store any
credential. Authentication is owned by the Dailybot skill's
[`shared/auth.md`](https://github.com/DailybotHQ/agent-skill/blob/main/skills/dailybot/shared/auth.md):
`dailybot login` (email OTP) or `DAILYBOT_API_KEY` / `dailybot config key=...`.
Point the developer at that flow; the skill handles login, profile, and the
HTTP fallback. If they decline auth, skip reporting — never block.

### Step 3 — Wire the optional progress-report step into DWP execution
This is the integration value. Reasoning guidance is in
`templates/INTEGRATION.md` — adapt it to the repo; do not copy verbatim.

- Add a short, clearly-optional note to the repo's DWP execution docs (e.g. the
  generated `AGENTS.md` reporting section and/or `docs/AI_AGENT_COLLAB.md`)
  stating: **when the Dailybot skill is installed, a DWP plan completion SHOULD
  emit a Dailybot report** — a **milestone** report via the dailybot `report`
  sub-skill (`dailybot agent update ... --milestone --json-data ...`),
  describing **what was built**, never "completed a plan."
- The step MUST be **best-effort and conditional**: it fires only if the
  Dailybot skill/CLI is present and authenticated, and it **MUST NOT block**
  `execute` if Dailybot is absent, unauthenticated, or unreachable — warn once
  and continue (see SPEC §Never-block).
- Optionally commit a repo identity so every contributor/agent signs reports the
  same way: `.dailybot/profile.json` (or the gitignore-friendly
  `.dailybot_example/profile.json` template) — **never** with a `key` field
  (credentials in that file are a hard error per the CLI).

### Step 4 — Validate (SPEC §Validation)
Run the validation checklist and report: whether the skill/CLI is present, that
auth was deferred (not reinvented), that the report step is wired as
**optional + non-blocking**, the identity source if any, and any deferred items.
If nothing could be installed here (sandbox/CI), say why — do not silently skip,
and do not fail the onboarding.

## Failure-mode guardrails

- **Never required, never blocking.** If declined — or if Dailybot is missing,
  unauthenticated, or unreachable — stop/continue cleanly. The repo stays
  baseline-conformant and `execute` is never blocked by reporting.
- **Defer auth, never store secrets.** No email/OTP/API-key prompting here; no
  credential written to any file. Point at the Dailybot skill's `shared/auth.md`.
- **Verified install only.** Never recommend `curl ... install.sh | bash`
  without the checksum/consent verification the Dailybot skill owns.
- **Reconcile, don't clobber.** An existing skill/CLI/identity/report step is
  preserved; only fill gaps. Any destructive change needs explicit approval.
- **Vendor-neutral.** Never imply DWP needs Dailybot. This addon is purely
  additive team visibility for teams already on Dailybot.
