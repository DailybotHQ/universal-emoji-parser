# DOCUMENTATION_STANDARD.md — DeepWorkPlan Repository Documentation Standard

## Abstract

This document specifies the normative repository-structure standard that makes a
codebase an **AI-first autopilot repo**: a repository whose documentation,
configuration, and conventions give any AI coding agent — Claude Code, Cursor,
OpenAI Codex, Google Gemini, GitHub Copilot, Antigravity, or any future agent —
enough structured context to work reliably without per-session human guidance.

The standard is grounded in an audit of **6 Dailybot repositories**
(`api-services`, `web-app`, `chatbot-functions`, `discord-gateway`,
`dailybot.com`, and the Core Hub). Roughly **90% of the structure is identical
across all six**; roughly **10% is repo-specific** (validation commands, file
paths, stack-specific skills, example plans). This document specifies the common
90% as the normative standard and explicitly flags the 10% as values an
onboarding agent MUST **reason about per repo**, never copy verbatim.

The standard applies to **both archetypes** defined in `ARCHETYPES.md`: the
**individual repo** (the 99% case) and the **orchestrator hub**. Archetype-specific
requirements are called out inline.

---

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Supersedes** | `PLAN_build_deepworkplan_brand/.../deepworkplan/spec/DOCUMENTATION_STANDARD.md` (v1.0.0) |
| **Companions** | `DWP_SPECIFICATION.md`, `AGENT_PROTOCOL.md`, `ARCHETYPES.md`, `ADDONS.md` |
| **License** | MIT |

> **Divergence from v1 (overview).** v1 framed the standard as a "3-tier hierarchy"
> with Bronze/Silver/Gold/Platinum conformance badges and used `.agent_commands/`
> as the DWP home. v2 keeps the tier *idea* but: (a) names a concrete **10-category
> `docs/` set** observed across the 6 repos rather than v1's 5-file minimum
> (`RECONCILIATION.md` §"Specs", divergence #6); (b) formalizes **per-module
> `README.md` + `docs/`** as a normative requirement, not an optional Platinum
> add-on (divergence #6); (c) adds the **`.agents/` directory + `.claude → .agents`
> directory symlink** (divergence #4); and (d) relocates DWP output to `.dwp/`
> (see `DWP_SPECIFICATION.md`, divergence #2). The conformance-badge ladder is
> retained as informative, not normative.

---

## 1. Conventions and Terminology

### 1.1. RFC 2119 Keywords

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be
interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

### 1.2. Terms

| Term | Definition |
|------|-----------|
| **AGENTS.md** | The single canonical root file every agent reads first. Index + mandatory rules + quick commands. |
| **`docs/` hub** | Repository-root `docs/` folder holding the categorized markdown guide set. |
| **Per-module docs** | A `README.md` (and optional `docs/`) inside a major source folder (`app/{module}/`, `src/{module}/`). |
| **`.agents/`** | The cross-agent configuration directory (agents, commands, skills, docs, settings). |
| **Compatibility wrapper / symlink** | A tool-specific path (`CLAUDE.md`, `.claude/`) that points at the canonical artifact without duplicating it. |
| **Common 90%** | Structure identical across the audited repos; the normative standard. |
| **Repo-specific 10%** | Values an onboarding agent MUST reason about per repo (validation commands, paths, stack skills, example plans). |

---

## 2. AGENTS.md — The Canonical Root File

### 2.1. Existence and Format

- Every conformant repository **MUST** contain exactly one `AGENTS.md` at the repository root.
- `AGENTS.md` **MUST** be plain UTF-8 markdown and **MUST NOT** contain YAML frontmatter (maximally compatible across agent toolchains).
- `AGENTS.md` **SHOULD** be 150–500 lines. If it exceeds ~500 lines, content **SHOULD** move into `docs/` and be linked from the index.

`AGENTS.md` **MUST** serve three roles: an **index**, a set of **mandatory rules**, and a **quick commands** reference.

### 2.2. Role 1 — Index (navigation)

`AGENTS.md` **MUST** contain a documentation index: a table linking every
`docs/` category file that exists, with one-line descriptions. It **MUST NOT**
link files that do not exist. For the **orchestrator hub** archetype it **MUST**
additionally link the sub-project navigation index (e.g. `repositories/README.md`)
and each sub-project's `AGENTS.md`. (Observed live: `api-services/AGENTS.md`
"Detailed Documentation" table; Core Hub `CLAUDE.md` "Documentation Navigation"
and "Project-Specific Documentation" tables.)

`AGENTS.md` **MUST** include an annotated repository-structure tree showing at
least two levels of depth (observed live in both `api-services/AGENTS.md` and the
Core Hub).

### 2.3. Role 2 — Mandatory Rules

`AGENTS.md` **MUST** contain a "Mandatory Rules" (or equivalently-named) section
stating, in normative language, the non-negotiable rules an agent **MUST** follow.
At minimum it **MUST** cover:

| Rule | Requirement |
|------|-------------|
| **Language** | All code, comments, and documentation **MUST** be in English. |
| **Conventional commits** | Commits **MUST** follow `type(scope): description`. |
| **Testing** | The repo's test pattern and coverage expectation **MUST** be stated. |
| **Error handling / logging** | The repo's consistent error and logging patterns **MUST** be stated. |
| **Repository boundaries** | Where the agent **MAY** and **MUST NOT** commit (load-bearing for the orchestrator hub, which **MUST** state that sub-project code is committed from inside each sub-repo, never from the hub root). |
| **Progress reporting** | The expectation that agents report progress after significant work, and the "never block work on reporting" rule (see `AGENT_PROTOCOL.md`). |

The test pattern, commit scopes, and validation commands themselves are part of
the **repo-specific 10%** (§7) and **MUST** be reasoned about per repo, not copied.

### 2.4. Role 3 — Quick Commands

`AGENTS.md` **MUST** contain a quick-commands reference table for the most common
agent actions: install, test, lint, type-check, build, validate. Every command
**MUST** be runnable in the repo's development environment; commands that run only
in CI or only inside a container **MUST** be marked as such (observed: the Core
Hub flags `codecheck -f` as "must run INSIDE the Docker container"). The exact
commands are repo-specific (§7).

### 2.5. CLAUDE.md → AGENTS.md

- The repository **MUST** provide a `CLAUDE.md` for Claude Code that resolves to `AGENTS.md` without duplicating content. It **MUST** be either:
  1. a **symlink** `CLAUDE.md → AGENTS.md` (RECOMMENDED; observed live in `repositories/agent-skill/CLAUDE.md` and the Core Hub), or
  2. a one-line **import wrapper** containing exactly `@AGENTS.md`.
- The symlink form **SHOULD** be used wherever the filesystem and git host support symlinks (all Dailybot repos do). The `@AGENTS.md` import form **MAY** be used where symlinks are unsupported (e.g. certain Windows checkouts or archive distributions).
- A `CLAUDE.md` that duplicates `AGENTS.md` content **MUST NOT** be used; `AGENTS.md` is the single source of truth.

> **Divergence from v1.** v1 listed `CLAUDE.md` among several "compatibility wrappers"
> and treated symlink-vs-`@import` as interchangeable prose. v2 makes the
> `CLAUDE.md → AGENTS.md` relationship a **MUST**, prefers the symlink, and pairs it
> with the new `.claude → .agents` *directory* symlink in §6 (`RECONCILIATION.md`
> divergence #4).

---

## 3. The `docs/` Categories

### 3.1. The Categorized Guide Set

A conformant repository **MUST** maintain a root-level `docs/` folder holding
categorized markdown guides. Guides **SHOULD NOT** carry YAML frontmatter (they are
evergreen reference, not lifecycle documents). The audit found 10 categories
common across the 6 repos; this standard adds an 11th — **`PRODUCT_SPEC.md`**,
the product/"why" layer — for **11 categories** total as the normative `docs/`
standard:

| # | Category file | Requirement | Purpose |
|---|---------------|-------------|---------|
| 0 | `PRODUCT_SPEC.md` | **MUST** | The product spec: the problem the repo solves, who it is for, its key capabilities/features, success criteria, and explicit non-goals — the **why** and **for whom**, not the **how**. Deliberately **non-technical**, high-value context. **Every repository is a product** — even a library, CLI, or internal tool: its consumers and their use cases are its product, and they deserve a non-technical spec. A library that omits this hides the very thing a new agent (or human) most needs to understand first. |
| 1 | `ARCHITECTURE.md` | **MUST** | System design, components, data flow, key decisions. |
| 2 | `STANDARDS.md` | **MUST** | Coding conventions, naming, import order, error/logging patterns, forbidden anti-patterns. |
| 3 | `TESTING_GUIDE.md` | **MUST** | Test framework, file-naming pattern, how to run/scope tests, coverage expectation. |
| 4 | `DEVELOPMENT_COMMANDS.md` | **MUST** | Authoritative command reference (install/test/lint/type-check/build/run), expanding §2.4. |
| 5 | `SECURITY.md` | **MUST** | Secrets handling, auth model, sensitive-data boundaries, what agents MUST NOT write to docs. |
| 6 | `PERFORMANCE.md` | **SHOULD** | Performance-critical paths, budgets, profiling guidance. |
| 7 | `AI_AGENT_ONBOARDING.md` | **MUST** | First-session checklist for an agent new to the repo. |
| 8 | `AI_AGENT_COLLAB.md` | **MUST** | How multiple agents/humans collaborate; handoff, ownership, conflict avoidance. |
| 9 | `PR_REVIEW_WORKFLOW.md` | **SHOULD** | How PRs are opened, reviewed, and merged in this repo. |
| 10 | `ECOSYSTEM_CONTEXT.md` | **SHOULD** (individual) / **MUST** (orchestrator hub & multi-repo members) | How this repo relates to sibling repos and the wider product. |

- The **MUST** categories (`PRODUCT_SPEC`, `ARCHITECTURE`, `STANDARDS`, `TESTING_GUIDE`, `DEVELOPMENT_COMMANDS`, `SECURITY`) plus `AI_AGENT_ONBOARDING` and `AI_AGENT_COLLAB` constitute the conformance floor for an AI-first repo.
- `PRODUCT_SPEC.md` is **non-technical by design** and **MUST NOT** be skipped on the grounds that "this repo is just a library/tool." If the repo genuinely has no end users, frame the product as its API/consumers: what it offers, to whom, and why they would choose it. Reason the content from the real repo (README, package description, public API, issues/roadmap) — never a generic stub.
- A repository **MAY** add domain-specific guides beyond these 11 (e.g. `API_REFERENCE.md`, `DATABASE_SCHEMA.md`, `LOGGING_BEST_PRACTICES.md`, `REDIS_CACHING_BEST_PRACTICES.md`) when the stack warrants. Whether a given domain guide is warranted is part of the **repo-specific 10%** (§7). (All four examples observed live in `api-services/docs/`.)
- A guide that would fall below ~30 lines **SHOULD** be merged into a sibling; a guide above ~700 lines **SHOULD** be split into a subfolder.

> **Divergence from v1.** v1 required only 5 `docs/` files at "Silver"
> (`README`, `ARCHITECTURE`, `SETUP`, `STANDARDS`, `TROUBLESHOOTING`) and listed
> `SECURITY`/`AI_AGENT_ONBOARDING`/`ECOSYSTEM_CONTEXT` as merely "recommended". v2
> elevates a **10-category set audited from the real repos**, makes 7 of them
> **MUST**, and renames `SETUP.md`→`DEVELOPMENT_COMMANDS.md` to match observed
> practice (`RECONCILIATION.md` §"Specs"). `SETUP`/`TROUBLESHOOTING` content is
> not lost: it folds into `DEVELOPMENT_COMMANDS.md` and `AI_AGENT_ONBOARDING.md`.
>
> **Added: `PRODUCT_SPEC.md` (category 0, MUST).** The audited 10-category set was
> entirely engineering/process documentation — it captured the *how* but never the
> *why*. This standard adds `PRODUCT_SPEC.md` as a required, deliberately
> **non-technical** product/purpose document so an agent (or human) learns what the
> repo is *for* and *for whom* before diving into its mechanics. It is a **MUST for
> every archetype, including libraries, CLIs, and internal tools** — every
> repository is a product; the spec frames its users/consumers and the value it
> delivers.

### 3.2. `docs/README.md` Master Index

A repository **SHOULD** provide `docs/README.md` as the master index of the
`docs/` hub: a one-paragraph scope statement, a table linking every guide with a
one-line description, and a "start here" pointer for common tasks. It **MUST** be
present in the orchestrator hub archetype (the hub's `docs/` is large enough that
navigation without an index degrades agent performance).

---

## 4. Per-Module Nested Docs

This section formalizes the per-module documentation tier observed across the
audited repos (e.g. `api-services/app/integrations/docs/` with `README.md`,
`MODELS.md`, `API.md`, `SIGNALS.md`, `STRUCTURE.md`, `TASKS.md`, plus
`app/{module}/README.md` in every major module).

- Each **major** source module (a folder under `app/`, `src/`, or the stack
  equivalent that represents a distinct feature or bounded concern) **MUST** carry
  a `README.md` describing that module: its purpose, key files, and how it fits the
  system.
- A module that is **complex or high-velocity** (3+ interconnected concerns, or
  frequently modified) **SHOULD** additionally carry a `docs/` subfolder with
  deeper guides (models, services, signals, tasks, etc.), entered via a
  `README.md`.
- A trivial or stable module **MAY** omit the `docs/` subfolder; a single
  `README.md` is sufficient.
- Per-module docs **MUST** be linked from the module's own `README.md`, and the
  most significant ones **SHOULD** be surfaced in the root `AGENTS.md` index
  (observed: `api-services/AGENTS.md` links
  `app/integrations/docs/features/AI_SERVICES.md`).

Which modules qualify as "major" or "complex" is part of the **repo-specific 10%**
(§7) and **MUST** be reasoned about per repo.

> **Divergence from v1.** v1 shipped only a per-module *`AGENTS.md`* template and
> treated nested docs as an optional "Tier 3 / Platinum" extra. v2 makes a per-major-module
> `README.md` a **MUST** and a module `docs/` subfolder a **SHOULD** for complex
> modules, matching the audited 6-repo reality (`RECONCILIATION.md` divergence #6).

---

## 5. The `.agents/` Layout

A conformant repository **MUST** maintain a `.agents/` directory as the canonical,
**cross-agent** configuration home. It **MUST** contain:

| Path | Requirement | Contents |
|------|-------------|----------|
| `.agents/agents/` | **MUST** | Role-based subagent definitions (e.g. `doc-writer.md`, `researcher.md`, `planner.md`). Native to Claude Code; readable as personas by other agents. |
| `.agents/commands/` | **MUST** | Slash commands as markdown procedure files. The five DWP commands (`dwp-create.md`, `dwp-execute.md`, `dwp-refine.md`, `dwp-resume.md`, `dwp-status.md`) **MUST** be present and **SHOULD** be thin delegators that route to the installed `deepworkplan` skill's matching sub-skill (single source of truth, no copied flow). Invoked via `/` by Claude Code and `#`/plain-text by other agents (see `AGENT_PROTOCOL.md`). |
| `.agents/skills/` | **MUST** | Installed skill packs, each a self-contained folder with a `SKILL.md` router. The DWP system itself ships here as `.agents/skills/deepworkplan/`. |
| `.agents/docs/` | **MUST** | Cross-agent catalog docs: a skills/agents catalog and a `COMMANDS_REFERENCE.md` mapping each command to its procedure file. |
| `.agents/settings.json` | **MUST** | Harness configuration (hooks, permissions, team-agent config). Claude-Code-specific but lives here for a unified location; other agents ignore it. |
| `.agents/settings.local.json` | **MAY** | Local, uncommitted-style overrides. |
| `.agents/README.md` | **SHOULD** | Entry point describing the directory. |

- Subagents in `.agents/agents/` **SHOULD** be **role-based** (a documentation
  writer, a researcher, a planner) and **MUST** be described well enough that a
  non-Claude agent can read them as personas.
- The command set **MUST** include the five DWP commands (`create`, `execute`,
  `refine`, `resume`, `status`) once the deepworkplan skill is installed; it **MAY**
  include repo-specific commands.
- The set of stack-specific skills installed under `.agents/skills/` is part of the
  **repo-specific 10%** (§7).

> **Divergence from v1.** The v1 spec did not codify a `.agents/` directory at all;
> agent config was scattered per-tool (`.claude/commands/`, `.cursor/rules/`,
> `.codex/skills/`). v2 makes `.agents/` the **single canonical, cross-agent home**,
> matching the live Core Hub and `repositories/agent-skill` layout
> (`RECONCILIATION.md` divergences #1 and #4; `ORCHESTRATOR_MANIFEST.md` key decisions).

### 2.6. Working directories (gitignored)

A conformant repo keeps two gitignored working areas at its root, serving
different purposes. Both **MUST** be gitignored (tracking only an index
`README.md`/`.gitkeep`).

| Directory | Requirement | Purpose |
|-----------|-------------|---------|
| `.dwp/` | **MUST** (once the DWP skill is installed) | **Structured** Deep Work Plan output — `.dwp/plans/` and `.dwp/drafts/`. Owned by the DWP flows. See `DWP_SPECIFICATION.md`. |
| `tmp/` | **SHOULD** | **Unstructured** repo-root scratch space for ephemeral agent/developer work: exploratory output, data exports, inter-agent prompt handoffs, throwaway experiments. Agents **SHOULD** write temporary/throwaway artifacts here rather than polluting the source tree, `docs/`, or `.dwp/`. |

The distinction matters: `.dwp/` is the methodology's **structured** output (plans an agent can resume), while `tmp/` is **freeform** scratch that can be deleted at any time. Common `tmp/` sub-uses observed across the audited repos: `tmp/scratch/`, `tmp/exports/`, `tmp/{tool}_prompts/`. An onboarding agent **SHOULD** create `tmp/` (with a `.gitkeep`) and add it to `.gitignore`, and **SHOULD** note the convention in `AGENTS.md`.

---

## 6. The `.claude → .agents` Symlink

- A conformant repository **MUST** provide a `.claude` directory-level symlink
  pointing at `.agents/` (`.claude → .agents`), so Claude Code finds configuration
  at the path it expects natively while `.agents/` remains the canonical store.
  (Observed live: the Core Hub's `.claude → .agents`.)
- This mirrors the file-level `CLAUDE.md → AGENTS.md` convention (§2.5): the
  canonical artifact carries the agent-neutral name; the Claude-facing name is a
  symlink.
- `.agents/` content **MUST** be authored as cross-agent (consumed by Cursor,
  Codex, Gemini, Copilot, Antigravity through their own conventions per
  `AGENT_PROTOCOL.md`); the `.claude` symlink **MUST NOT** introduce
  Claude-only divergence in shared files.
- Where symlinks are unsupported by the host, the repository **MAY** substitute a
  tool-native pointer, but **MUST** keep `.agents/` canonical and document the
  substitution.

> **Divergence from v1.** v1 documented only the *file* symlink
> `CLAUDE.md → AGENTS.md` (in the Claude adapter). The *directory* symlink
> `.claude → .agents` is **net-new in v2** (`RECONCILIATION.md` divergence #4, idea #1).

---

## 7. The Repo-Specific 10% — "Reason Per Repo"

The following values are **repo-specific** and **MUST NOT** be copied verbatim from
this standard or from another repo. An onboarding agent (`AGENT_PROTOCOL.md`)
**MUST** reason about each by inspecting the target repo's stack, config, and CI:

| Repo-specific value | How the agent reasons about it |
|---------------------|--------------------------------|
| **Validation commands** | Derive `test`/`lint`/`type-check`/`build`/`validate` from package manager, lockfiles, CI config (e.g. `codecheck -f` in Docker for Django; `eslint:check && test` for Node; `astro:check` for Astro). |
| **File paths & structure** | Derive module layout from the actual source tree (`app/` vs `src/` vs `pages/`). |
| **Test file naming** | Derive from existing tests (`*_test.py`, `*.spec.ts`, `*.test.ts`). |
| **Stack-specific skills** | Decide which `.agents/skills/` to install based on the stack and the repo's needs. |
| **Example plans / domain docs** | Decide which optional `docs/` guides and `.dwp/` examples are warranted. |
| **Commit scopes** | Derive valid `scope` values from the repo's domains. |

The agent **MUST** record, in the generated `AGENTS.md` and `docs/`, the *concrete*
resolved values for the target repo — never the placeholder or another repo's value.

---

## 8. Archetype Notes (cross-reference)

Both archetypes from `ARCHETYPES.md` follow §§2–7. The **individual repo** (99%
case) is the default; an onboarding agent **MUST** assume it unless the repo is
clearly a hub. The **orchestrator hub** **MUST** additionally provide: the
sub-project navigation index (§2.2), `ECOSYSTEM_CONTEXT.md` and a cross-project
standards guide (§3.1), repository-boundary rules in `AGENTS.md` (§2.3), and the
orchestrator DWP capability (`DWP_SPECIFICATION.md` §8). See `ARCHETYPES.md` for
the classification heuristic and the full onboarding-difference matrix.

---

## 9. Conformance (informative)

The v1 Bronze/Silver/Gold/Platinum badge ladder is retained as an **informative**
self-assessment aid, not a normative requirement. A repository is **AI-first
conformant** when it satisfies every **MUST** in §§2–7. The optional ladder maps,
roughly: Bronze = §2 only; Silver = §2 + the six MUST `docs/` categories
(`PRODUCT_SPEC`, `ARCHITECTURE`, `STANDARDS`, `TESTING_GUIDE`,
`DEVELOPMENT_COMMANDS`, `SECURITY`); Gold =
+ remaining MUST categories + `.agents/` + symlinks; Platinum = + per-module docs
for all complex modules (§4).

---

## 10. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- [agents.md](https://agents.md) — the cross-tool AGENTS.md convention
- `DWP_SPECIFICATION.md`, `AGENT_PROTOCOL.md`, `ARCHETYPES.md`, `ADDONS.md` — companion specs
- `../RECONCILIATION.md`, `../ARTIFACT_INVENTORY.md` — Task 1 carry-forward decisions
- Audited live references: `repositories/api-services/AGENTS.md`, `repositories/agent-skill/` (`.agents/` + skill-pack + `CLAUDE.md`/`.claude` symlinks), the Core Hub `CLAUDE.md`/`.claude → .agents`

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
