# DWP_SPECIFICATION.md — Deep Work Plan Specification

## Abstract

This document specifies the **Deep Work Plan (DWP)** workflow: a framework-agnostic,
agent-agnostic methodology for AI coding agents to execute complex, multi-step work
reliably over hours or days. A Deep Work Plan is a directory of markdown files — a
plan overview, per-task instruction files, a running progress log, and utility
prompts — that together hold all state an agent needs to begin, continue, and
complete a body of work. Plans are single-task focused, validation-first,
git-native, and resume-safe.

The DWP system in v2 is delivered as an **installable skill** (`deepworkplan`,
modeled on the `dailybot` skill in `repositories/agent-skill`), not an embedded
per-repo folder. Its outputs land in a gitignored **`.dwp/`** directory at repo
root. This document is implementation-independent; `deepworkplan` is the reference
implementation.

This specification applies to **both archetypes** (`ARCHETYPES.md`): the individual
repo (99% case) and the orchestrator hub. Archetype-specific behavior is called out
inline, especially in §8 (orchestrator).

---

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Supersedes** | `PLAN_build_deepworkplan_brand/.../deepworkplan/spec/DWP_SPECIFICATION.md` (v1.0.0) |
| **Companions** | `DOCUMENTATION_STANDARD.md`, `AGENT_PROTOCOL.md`, `ARCHETYPES.md`, `ADDONS.md` |
| **License** | MIT |

> **Divergence from v1 (overview).** Three breaking changes drive the major bump:
> (1) the **create flow is single-step** — one refined draft, dropping the v1
> draft → refined two-step (`RECONCILIATION.md` divergence #3); (2) plan output
> relocates to **`.dwp/`** at repo root, replacing
> `.agent_commands/agent_deep_work_plans/results/plans/` (divergence #2); (3) the
> system is an **installed skill**, not an embedded folder (divergence #1). The
> task anatomy, validation gates, completion protocol, mandatory final tasks,
> orchestrator, and team-agents model are **kept** from v1 with path/flow edits.

---

## 1. Conventions and Terminology

### 1.1. RFC 2119 Keywords

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be
interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

### 1.2. Terms

| Term | Definition |
|------|-----------|
| **Plan** | A directory of markdown files specifying an objective and its tasks. Named `PLAN_{snake_case_name}/`. |
| **Task** | An atomic unit of work, defined in `{N}.task_{title}.md`. |
| **Refined draft** | The single reviewable artifact produced by `create`, written to `.dwp/drafts/`. |
| **Plan README** | The `README.md` inside a plan; source of truth for "what is done". |
| **Mandatory final tasks** | The two tasks every plan ends with: Skills & Agents Discovery, then Executive Report. |
| **Orchestrator plan** | A plan in an orchestrator hub that creates and coordinates **child DWPs** in sub-repos. |
| **`.dwp/`** | The gitignored repo-root output directory: `.dwp/plans/`, `.dwp/drafts/`. |

---

## 2. The `.dwp/` Output Convention

- A repository using the DWP workflow **MUST** locate all plans and drafts under a
  single repo-root directory named `.dwp/`:

  ```
  .dwp/
  ├── plans/      ← PLAN_{name}/ directories (executed plans)
  └── drafts/     ← {name}_draft_refined.md (the create-flow artifact)
  ```

- `.dwp/` **MUST** be git-ignored (added to the repo's `.gitignore`). Plan
  execution artifacts are working state, not tracked deliverables.
- The legacy `.agent_commands/agent_deep_work_plans/results/` tree **MUST NOT** be
  used by v2 plans. On migration, existing plans **MUST** be relocated or archived,
  and **MUST NOT** be blind-deleted (`ORCHESTRATOR_MANIFEST.md` key decision).
- A plan **MUST** be located at `.dwp/plans/PLAN_{name}/`.

> **Divergence from v1.** v1's normative spec mandated
> `.agent_commands/agent_deep_work_plans/results/plans/PLAN_{name}/` even though the
> v1 `dwp-create` command and INIT hint already used `.dwp/`. v2 makes the spec and
> the commands consistent on `.dwp/` (`RECONCILIATION.md` divergence #2).

---

## 3. The Single-Step Refined-Draft Create Flow

- The `create` flow **MUST** produce exactly **one** artifact for user review: a
  **refined draft** written to `.dwp/drafts/{name}_draft_refined.md`.
- The flow **MUST NOT** produce an intermediate non-refined draft as a separate
  reviewable step. The legacy `[1/3] Creating draft → [2/3] Refining draft`
  sequence is removed.
- The flow **SHOULD** gather information, then directly synthesize the refined
  draft; the user reviews and approves that single artifact before the plan is
  materialized into `.dwp/plans/PLAN_{name}/`.
- The refined draft **MUST** contain enough structure (goal, context, variables,
  task outline, archetype) for the user to approve or request changes in one pass.

> **Divergence from v1.** v1's `dwp-create` was explicitly two-step. v2 collapses
> it to a single refined draft (`RECONCILIATION.md` divergence #3; this very plan's
> own refined draft is the worked example).

---

## 4. Plan Folder Structure

A conformant plan directory **MUST** contain:

```text
.dwp/plans/PLAN_{name}/
├── README.md                              ← overview, task list, rules, status (source of truth)
├── PROMPTS.md                             ← copy-paste execute / resume / status prompts
├── PROGRESS.md                            ← running narrative, one entry per completed task
├── analysis_results/                      ← task-produced artifacts (MAY start empty)
│   └── EXECUTIVE_REPORT.md                ← written by the final mandatory task
├── 1.task_{title}.md                      ← first user-defined task
├── …
├── {N-1}.task_skills_agents_discovery.md  ← mandatory: second-to-last
└── {N}.task_executive_report.md           ← mandatory: last
```

- Plan names **MUST** follow `PLAN_{snake_case_name}` (lowercase, underscore-separated, 2–5 words).
- `README.md`, `PROMPTS.md`, `PROGRESS.md`, and `analysis_results/` **MUST** all be present.
- At least one user-defined task plus the two mandatory final tasks **MUST** be present.

The plan `README.md` **MUST** contain: title + goal; context; plan variables (if
the tasks reference `{{...}}`); global guidelines; a task list with checkboxes and a
`Plan Status: X/N completed` count; execution rules; and an analysis-outputs table.
The checkbox list is the resume checkpoint: `[x]` means complete-and-committed, and
the agent **MUST** trust `[x]` marks without re-verifying.

---

## 5. Task File Anatomy — The 9 Sections

Each `{N}.task_{title}.md` **MUST** contain the following nine sections. Heading
text **MAY** vary; the semantic content **MUST** be present and in this order.

| # | Section | Requirement |
|---|---------|-------------|
| 1 | **Title** — `# Task {N}: {Title}` | **MUST** |
| 2 | **Context** — task-specific background; the agent **MUST** be able to start from this section alone. | **MUST** |
| 3 | **Read Before Starting** — files the agent **MUST** read first, each with why it matters (including re-anchoring to the plan README §Goal). | **MUST** |
| 4 | **Goal** — 1–2 sentences, unambiguous and testable. | **MUST** |
| 5 | **Instructions** — numbered, concrete steps, including an explicit **re-anchor** step (re-read the plan README §Goal at task start). Vague steps **MUST NOT** appear. | **MUST** |
| 6 | **Acceptance Criteria** — a verifiable checkbox list; the task **MUST NOT** be marked complete until every box can honestly be checked. | **MUST** |
| 7 | **Outputs** — table of files the task produces with paths (under `analysis_results/` or source). | **MUST** when the task produces artifacts |
| 8 | **Validation** — the stack-specific commands that **MUST** pass before completion; a task with no automated command **MUST** carry a specific manual checklist. | **MUST** |
| 9 | **Execution Checklist** + **Completion & Log** — the procedural walk-through plus the post-task log the agent fills (status, timestamp, summary, outputs, validation results, notes). The log **MUST NOT** retain placeholder values after completion. | **MUST** |

A task **MAY** additionally include a **Rollback** section (RECOMMENDED for
migrations, breaking changes, infra, or deployment) and a **Team Agents Metadata**
section when it participates in a parallel group (§9).

> **Divergence from v1.** v1 specified the same content across ~11 numbered
> subsections (Title, Context, Read Before Starting, Goal, Instructions,
> Acceptance Criteria, Outputs, Validation, Rollback, Execution Checklist,
> Completion & Log). v2 consolidates to a **9-section canonical anatomy** —
> folding Rollback into optional and merging Execution Checklist with Completion &
> Log — and makes the **re-anchoring** step explicit inside Instructions
> (`RECONCILIATION.md` §"Specs"). Content parity is preserved.

### 5.1. Validation Gates

A task **MUST NOT** be marked complete unless every command in its Validation
section has been run and passed. On any failure the agent **MUST** stop, report the
command + output + suspected cause, **MUST NOT** mark the task complete, and **MUST**
await guidance. Validation commands **MUST** be runnable shell commands, deterministic,
and scoped; they **MUST NOT** require human judgment to interpret. The concrete
commands are repo-specific (see `DOCUMENTATION_STANDARD.md` §7) and **MUST** be
reasoned about per repo.

### 5.2. Task Completion Protocol

After passing validation and before advancing, the agent **MUST**, in order:
(1) mark the task `[x]` in the plan README; (2) increment the `Plan Status` count;
(3) fill the task's Completion & Log with no placeholders; (4) add a 3–5 bullet
entry to `PROGRESS.md`; (5) commit (where the plan commits) with
`{type}({scope}): {description} - Task {N} of PLAN_{name}`. The agent **MUST** then
verify the README mark, the status count, the filled log, the PROGRESS entry, and a
clean git state before proceeding.

### 5.3. Resume

Resume **MUST** be possible from only the plan's markdown files plus the git log,
with **no external state**. A resuming agent **MUST** read the plan README to find
the first `[ ]` task, check git log/status, inspect the resume-point task's
Completion & Log, and continue. It **MUST** trust `[x]` marks and **MUST NOT**
re-validate completed tasks unless the user explicitly requests it.

---

## 6. Mandatory Final Tasks

Every conformant plan **MUST** end with exactly two mandatory tasks, in this order:

### 6.1. Task N-1 — Skills & Agents Discovery

- **MUST** review `PROGRESS.md` for patterns used two or more times across the plan.
- **MUST** check the existing `.agents/` skills/agents catalog for duplicates.
- **MUST** decide, per pattern, whether to create a new skill/agent, update an
  existing one, or record a finding.
- **MUST** write `analysis_results/SKILLS_AGENTS_DISCOVERY.md`, even when the
  conclusion is "no new skills warranted."

### 6.2. Task N — Executive Report

- **MUST** produce `analysis_results/EXECUTIVE_REPORT.md`, a stakeholder-ready
  summary covering at minimum: executive summary, plan overview, deliverables
  table, product impact, technical details, QA/verification guide, key decisions
  and trade-offs, risks/open questions, next steps.

Both final tasks **MUST** run sequentially after all other tasks (including any
parallel groups) and **MUST NOT** be placed in a parallel group.

---

## 7. Archetype Behavior in Plans

- For the **individual repo** (99% case), a plan operates entirely within one
  repository; all validation, commits, and outputs stay in that repo.
- For the **orchestrator hub**, a plan **MAY** be an orchestrator plan (§8) that
  spawns child DWPs in sub-repos. The hub plan **MUST NOT** commit sub-project code
  from the hub root; each sub-repo commits independently.
- An onboarding agent **MUST** determine the archetype (per `ARCHETYPES.md`) before
  deciding whether orchestrator capabilities apply.

---

## 8. Orchestrator Plans (optional capability)

The orchestrator mode is an **optional** capability primarily for the orchestrator
hub archetype. A repository **MAY** use it; an individual repo typically does not.

- An orchestrator plan **MUST** include, in the parent plan, a child-DWP tracking
  table (repository, child plan name, status) and an `ORCHESTRATOR_MANIFEST.md`
  carrying the shared cross-repo context, dependency graph, and output contracts
  (so each child inherits global decisions without re-deriving them).
- Each target sub-repo **MUST** have a dedicated `create_child_dwp` task in the
  parent plan that: navigates into the sub-repo, reads that sub-repo's `AGENTS.md`,
  creates `repositories/{repo}/.dwp/plans/PLAN_{child}/` with all required files,
  and ensures the child's tasks use **that sub-repo's** validation commands.
- Child DWPs **MUST** reference `ORCHESTRATOR_MANIFEST.md` and **MUST** follow this
  specification independently. They **MAY** be created and executed in
  **Distributed**, **Sequential-with-handoff**, or **Sequential-basic** mode.
- After all child plans complete, the parent plan **SHOULD** include an integration
  checkpoint task.

> **Divergence from v1.** Kept from v1 §10 with the path update
> `repositories/{repo}/.dwp/plans/` (was `.../.agent_commands/.../results/plans/`),
> per `RECONCILIATION.md` divergence #2. This plan and its `ORCHESTRATOR_MANIFEST.md`
> are the live worked example.

---

## 9. Team Agents (optional capability)

Team-agents metadata is an **OPTIONAL**, additive extension for agents that support
parallel execution (currently Claude Code only). Plans **MUST** function correctly
when executed sequentially; team-agents metadata is purely additive.

- A plan using team agents **SHOULD** declare Parallel Task Groups in its README
  (group → task numbers → teammates → description).
- A participating task **SHOULD** carry a Team Agents Metadata section (parallel
  group, role, file ownership, concurrency, blocks).
- Tasks in the same parallel group **MUST NOT** write to the same files (declared
  file ownership). The mandatory final tasks (§6) **MUST** remain sequential.

Non-Claude agents **MUST** ignore team-agents metadata and execute every task
sequentially (see `AGENT_PROTOCOL.md`).

---

## 10. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `DOCUMENTATION_STANDARD.md`, `AGENT_PROTOCOL.md`, `ARCHETYPES.md`, `ADDONS.md`
- `../RECONCILIATION.md` (divergences #1–#3 drive this spec), `../../ORCHESTRATOR_MANIFEST.md`
- [Conventional Commits](https://www.conventionalcommits.org/)

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
