# AGENT_PROTOCOL.md — Cross-Agent Behavior Specification

## Abstract

This document specifies the cross-agent behavior required of any AI coding agent
operating in a DeepWorkPlan-conformant repository: which agents are supported, how
each invokes commands, how all agents read the same shared configuration, and what
progress-reporting behavior is expected. It is the normative companion to
`DOCUMENTATION_STANDARD.md` (what structure exists) and `DWP_SPECIFICATION.md` (how
plans execute).

The governing principle is **one source of truth, many agents**: `AGENTS.md` and
the `.agents/` directory are agent-neutral and shared; each agent reaches them
through its own native convention. The protocol applies to **both archetypes**
(`ARCHETYPES.md`).

---

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Supersedes** | `PLAN_build_deepworkplan_brand/.../deepworkplan/spec/AGENT_PROTOCOL.md` (v1.0.0) |
| **Companions** | `DOCUMENTATION_STANDARD.md`, `DWP_SPECIFICATION.md`, `ARCHETYPES.md`, `ADDONS.md` |
| **License** | MIT |

> **Divergence from v1 (overview).** v1's `AGENT_PROTOCOL.md` governed the
> *initialization* flow under an "agent-as-runtime, WebFetch on demand" model
> (model tiers, token-budget announcement, WebFetch-failure recovery). v2 reframes
> the protocol around an **installed skill** and a **shared `.agents/` surface**:
> the six supported agents, the `/` vs `#` command mapping, shared reading, and
> cross-agent progress reporting. The model-capability, approval-gate, validation,
> and privacy expectations from v1 are kept by reference and condensed
> (`RECONCILIATION.md` divergences #1, #2; "INIT/router" change row).

---

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**,
**REQUIRED**, **OPTIONAL**) are interpreted as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 2. Supported Agents

This methodology **MUST** support the following six AI coding agents. Any future
agent that reads markdown and can execute tool calls **MAY** be added without a
breaking change.

| Agent | Native config convention | Command prefix |
|-------|--------------------------|----------------|
| **Claude Code** | `.claude/` (symlinked to `.agents/`), `CLAUDE.md` (symlinked to `AGENTS.md`) | `/` (native) |
| **Cursor** | `.cursor/rules/*.mdc` referencing `AGENTS.md` | `#` or plain text |
| **OpenAI Codex** | `.codex/` / `CODEX.md` referencing `AGENTS.md` | `#` or plain text |
| **Google Gemini** | `.gemini/` referencing `AGENTS.md` | `#` or plain text |
| **GitHub Copilot** | `.github/copilot-instructions.md` referencing `AGENTS.md` | `#` or plain text |
| **Antigravity** | `.antigravity/` referencing `AGENTS.md` | `#` or plain text |

- Every supported agent **MUST** treat `AGENTS.md` as the single source of truth
  for repository conventions; a per-agent config file **MUST** reference it and
  **MUST NOT** duplicate its content (`DOCUMENTATION_STANDARD.md` §2.5).
- A model used to run DeepWorkPlan work **MUST** be reasoning-capable
  (inspecting many files, stack detection, self-validation, failure recovery);
  speed/cost-tier models **SHOULD NOT** be used for plan creation or repo onboarding.

---

## 3. Command Invocation Mapping (`/` vs `#`)

Commands live as markdown procedure files in `.agents/commands/` and are catalogued
in `.agents/docs/COMMANDS_REFERENCE.md`.

- **Claude Code** **MUST** invoke commands with the native `/` prefix
  (e.g. `/dwp-create`, `/dwp-execute`).
- **Cursor, Codex, Gemini, Copilot, and other non-Claude agents** **MUST** invoke
  commands with the `#` prefix (e.g. `#dwp-create`) or as plain text
  (e.g. "run dwp-create"). These CLIs intercept `/` as their own system prefix, so
  `/` **MUST NOT** be assumed available outside Claude Code.
- When a user's message begins with `#{command}` (or names a command), the agent
  **MUST** treat it as a command invocation.

On any command invocation, an agent **MUST**:

1. **Look up** the command (without its prefix) in `.agents/docs/COMMANDS_REFERENCE.md`
   to find its procedure file.
2. **Read** that procedure file completely.
3. **Follow** its steps exactly.
4. **MUST NOT** improvise, skip steps, or substitute remembered behavior — the
   procedure file is the spec.

> **Divergence from v1.** v1 documented the `/` vs `#` distinction inside per-agent
> adapter manifests. v2 makes it a **single normative mapping** in this protocol and
> ties it to the shared `.agents/commands/` + `COMMANDS_REFERENCE.md` surface
> (`RECONCILIATION.md` "adapters" change row).

---

## 4. Shared `.agents/` Reading

- All six agents **MUST** read the same configuration content from `.agents/`
  (agents, commands, skills, docs, settings), each through its own convention:
  Claude Code via the `.claude → .agents` symlink (`DOCUMENTATION_STANDARD.md` §6),
  others via their referencing config files.
- `.agents/` content **MUST** be authored agent-neutral. An agent **MUST NOT**
  introduce agent-specific divergence into shared files; agent-only settings (e.g.
  Claude Code's `settings.json` harness config) **MUST** be ignored by agents that
  do not consume them.
- The DWP skill (`.agents/skills/deepworkplan/`) and any other skill packs **MUST**
  be consumable by every supported agent through the skill's own `SKILL.md` router.

---

## 5. Progress Reporting

- Agents **SHOULD** report progress after significant work (a feature, a bug fix, a
  completed DWP plan, a migration, or substantial multi-commit work), framed as what
  the human accomplished. Trivial, read-only, or rolled-back work **SHOULD NOT** be
  reported.
- Reporting **MUST NOT** block or delay the actual work: if the reporting channel
  fails, times out, or is unreachable, the agent **MUST** log the issue and continue.
  Progress reporting is important but secondary.
- This expectation applies cross-agent. The mechanism is repo-specific (e.g. the
  Dailybot repos use the `dailybot` skill) and is therefore part of the
  reason-per-repo 10% (`DOCUMENTATION_STANDARD.md` §7).

---

## 6. Preserved v1 Expectations (by reference)

The following v1 behaviors are **kept** and apply during onboarding and plan
execution: read-before-action repository analysis; explicit user approval before
**destructive** actions (overwriting or deleting existing files); validation before
marking work complete (`DWP_SPECIFICATION.md` §5.1); and privacy — an agent **MUST
NOT** exfiltrate source/secrets and **MUST NOT** write literal secret values into
generated documentation. See `RECONCILIATION.md` non-divergences.

---

## 7. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `DOCUMENTATION_STANDARD.md` (§§2.5, 5, 6, 7), `DWP_SPECIFICATION.md` (§5.1), `ARCHETYPES.md`, `ADDONS.md`
- `../RECONCILIATION.md` — Task 1 carry-forward and divergences
- Audited live references: Core Hub `CLAUDE.md` "Slash Commands (All Agents)" + `.agents/docs/COMMANDS_REFERENCE.md`; `repositories/agent-skill` multi-agent `setup.sh`

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
