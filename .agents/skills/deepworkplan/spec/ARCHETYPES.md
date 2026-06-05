# ARCHETYPES.md — Repository Archetypes

## Abstract

This document defines the **two repository archetypes** the DeepWorkPlan
methodology recognizes — the **individual repo** (the 99% case) and the
**orchestrator hub** — the heuristic an onboarding agent uses to classify a target
repository, and how onboarding differs between them. Every other spec
(`DOCUMENTATION_STANDARD.md`, `DWP_SPECIFICATION.md`, `AGENT_PROTOCOL.md`,
`ADDONS.md`) forks its requirements on the archetype determined here.

---

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Supersedes** | (net-new in v2; no v1 equivalent) |
| **Companions** | `DOCUMENTATION_STANDARD.md`, `DWP_SPECIFICATION.md`, `AGENT_PROTOCOL.md`, `ADDONS.md` |
| **License** | MIT |

> **Divergence from v1.** v1 defined a **single** conformance model; it mentioned
> monorepos in passing and buried orchestrator behavior inside the DWP spec's §10.
> v2 promotes the two archetypes to a **first-class axis** that every spec forks on
> (`RECONCILIATION.md` divergence #5, idea #5).

---

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **MAY**, etc.) are
interpreted as in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 2. The Individual Repo (99% case)

- An **individual repo** is a single codebase with one primary stack, its own
  validation commands, and per-module documentation. It is the **default**
  archetype.
- An onboarding agent **MUST** assume the individual archetype **unless** the repo
  is clearly an orchestrator hub (§4).
- An individual repo **MUST** satisfy `DOCUMENTATION_STANDARD.md` §§2–7: `AGENTS.md`
  (index + mandatory rules + quick commands), the `docs/` categories, per-module
  nested docs, `.agents/`, and the `.claude → .agents` symlink.
- Its DWP usage **MUST** stay within the single repository; orchestrator capability
  (`DWP_SPECIFICATION.md` §8) is typically unused.
- Live examples: all five Dailybot product repos — `api-services`, `web-app`,
  `chatbot-functions`, `discord-gateway`, `dailybot.com`
  (`ORCHESTRATOR_MANIFEST.md` registry: "All 5 repos are the individual archetype").

---

## 3. The Orchestrator Hub

- An **orchestrator hub** is a documentation/coordination repository that
  orchestrates work across multiple sub-repositories.
- A hub **MUST** additionally provide, beyond the §§2–7 baseline:
  - a **sub-project navigation index** (e.g. `repositories/README.md`) linked from
    the root `AGENTS.md` (`DOCUMENTATION_STANDARD.md` §2.2);
  - **`ECOSYSTEM_CONTEXT.md`** and a **cross-project standards** guide
    (`DOCUMENTATION_STANDARD.md` §3.1);
  - explicit **repository-boundary rules** in `AGENTS.md`: the hub **MUST NOT**
    commit sub-project code from the hub root; each sub-repo commits independently
    (`DOCUMENTATION_STANDARD.md` §2.3);
  - the **orchestrator DWP** capability — plans that spawn **child DWPs** in
    sub-repos via an `ORCHESTRATOR_MANIFEST.md` (`DWP_SPECIFICATION.md` §8).
- A hub's sub-repositories are typically git-ignored at the hub level (tracked
  independently); the hub tracks only its own docs, coordination files, and a
  navigation index.
- Live example: this **Core Hub** — its `repositories/` boundary rules,
  `repositories/README.md` index, and the orchestrator DWP that created this very
  plan and its `ORCHESTRATOR_MANIFEST.md`.

---

## 4. Classification Heuristic

An onboarding agent **MUST** classify the target repo before generating docs. It
**MUST** classify the repo as an **orchestrator hub** when a clear majority of the
following signals hold; otherwise it **MUST** classify it as an **individual repo**:

| Signal | Indicates hub |
|--------|---------------|
| A `repositories/` (or equivalent) folder containing multiple independent repos | strong |
| No single primary application stack at the root; the root is mostly markdown/coordination | strong |
| Sub-repos are git-ignored / tracked separately from the root | moderate |
| Presence of cross-project standards, a repo navigation index, or orchestrator manifests | moderate |
| Root `AGENTS.md` indexes *other repos'* `AGENTS.md` files | moderate |

- When signals are ambiguous, the agent **MUST** present its assessment and the
  evidence to the user and ask for confirmation before proceeding (consistent with
  `AGENT_PROTOCOL.md` approval behavior).
- A repo **MUST NOT** be classified as a hub solely because it is a monorepo; a
  monorepo with one build/stack is an **individual repo** with multiple modules
  (handled by per-module docs, `DOCUMENTATION_STANDARD.md` §4).

---

## 5. How Onboarding Differs

| Aspect | Individual repo | Orchestrator hub |
|--------|-----------------|------------------|
| Baseline `AGENTS.md` + `docs/` + `.agents/` + symlinks | **MUST** | **MUST** |
| Sub-project navigation index | n/a | **MUST** |
| `ECOSYSTEM_CONTEXT.md` | **SHOULD** | **MUST** |
| Cross-project standards guide | **MAY** | **MUST** |
| Repository-boundary rules in `AGENTS.md` | **SHOULD** (if vendored deps exist) | **MUST** (commit-from-sub-repo rule) |
| Orchestrator DWP / child-DWP capability | typically unused | **MAY** / expected |
| `ORCHESTRATOR_MANIFEST.md` pattern | n/a | **MUST** when running orchestrator plans |
| Per-module nested docs | **MUST** for major modules | applies to the hub's own modules; sub-repo modules are documented in each sub-repo |
| Validation commands | one repo's stack (reason per repo) | the hub's own (often docs-only); each child DWP uses **its** sub-repo's commands |

- Onboarding an individual repo is the **lean** path: classify → reason about the
  stack-specific 10% (`DOCUMENTATION_STANDARD.md` §7) → generate baseline structure.
- Onboarding a hub is **additive**: do the baseline, then layer the hub-only
  structure above, and wire the orchestrator capability.
- Addons (`ADDONS.md`) are archetype-agnostic and **MAY** be layered onto either.

---

## 6. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `DOCUMENTATION_STANDARD.md` (§§2.2, 2.3, 3.1, 4, 8), `DWP_SPECIFICATION.md` (§§7, 8), `AGENT_PROTOCOL.md`, `ADDONS.md`
- `../RECONCILIATION.md` (divergence #5), `../../ORCHESTRATOR_MANIFEST.md` (archetype registry)
- Audited live references: the Core Hub (`repositories/`, `repositories/README.md`, this orchestrator plan) and the five individual product repos

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
