---
name: deepworkplan
description: DeepWorkPlan — turn any repo AI-first and run Deep Work Plans. Routes to create, execute, refine, resume, status, verify, and repo-onboarding sub-skills based on intent. Use when the developer wants to plan, execute, manage, or verify structured multi-task work, or make a repository AI-agent-ready.
version: "2.7.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
metadata: {"openclaw":{"emoji":"🧠","homepage":"https://deepworkplan.com","requires":{"anyBins":["git","bash"]}}}
---

# DeepWorkPlan — Methodology Skill (Router)

Models matter; context matters more. The **DeepWorkPlan** skill turns any
repository into a structured environment — context, guardrails, and a durable
plan — where any coding agent executes reliably on long-horizon work. It makes
the repository "AI-first" — `AGENTS.md` + `docs/` + per-module docs + `.agents/`
(with the `.claude → .agents` symlink) — and runs structured **Deep Work
Plans**: multi-task plans an AI agent drafts, refines, executes task-by-task,
and resumes. All plan and draft outputs land in a gitignored `.dwp/` directory
at the repo root (`.dwp/plans/`, `.dwp/drafts/`).

Source of truth: <https://deepworkplan.com>. License: MIT.

## Start here (first run)

This skill is a self-sufficient entry point: whether a developer arrives from
<https://deepworkplan.com/init.md> or simply installs this skill, the setup plan
is the same — and it lives here, so no network is required.

**If the repository is not yet AI-first** — there is no root `AGENTS.md` and no
`.agents/` directory — the recommended first action is to **onboard it**, even if
the developer's request was vague ("set this up", "make this repo AI-first", or a
plain install). Before routing anywhere else:

1. **Read the standard locally.** Read [`spec/`](spec/README.md) (five RFC-2119
   documents) and [`shared/adaptation.md`](shared/adaptation.md). The overriding
   rule is **REASON, do not copy-paste**: this skill is the reusable engine; what
   you produce must be adapted to *this* repository, never templated.
2. **Run onboarding.** Read [`onboard/SKILL.md`](onboard/SKILL.md) and execute it.
   It is **non-destructive**: detect existing `AGENTS.md`, `docs/`, `.agents/`, or
   `CLAUDE.md`, reconcile rather than overwrite, and ask the developer before
   replacing anything. The result: `AGENTS.md` + `CLAUDE.md` symlink, a reasoned
   `docs/` tree, per-module docs, a `.agents/` kit, and a gitignored `.dwp/` — the
   repository becomes the agent harness.
3. **Verify conformance.** Read [`verify/SKILL.md`](verify/SKILL.md) and run it to
   confirm, objectively, that the repository now meets the standard (AGENTS.md with
   real commands, the `.agents/` catalog, the gitignored `.dwp/`, and so on).
4. **Then plan and execute.** With the harness in place, create and execute Deep
   Work Plans (below) — long-horizon, gated, resumable work an agent can run
   autonomously for hours.

**If the repository is already AI-first**, skip onboarding and route by intent
**silently** — do not announce the detection or the routing decision (no "the repo
is already AI-first" / "routing to the create sub-skill" preamble). Just begin the
matched sub-skill's flow directly.

## What it does

This is the **router**. It does not run any flow itself — it maps the
developer's intent to the right sub-skill and tells the agent to read that
sub-skill's `SKILL.md` and execute it there.

---

## For the agent — routing rules

When the developer wants to plan, execute, or manage structured work, or make a
repo AI-agent-ready, match the intent below and **read that sub-skill's
`SKILL.md` to execute it**. Do not answer directly — each sub-skill carries the
full step-by-step flow.

| Developer says… | Route to |
|------------------|----------|
| "create a plan", "new deep work plan", "/dwp-create" | **Create** → read [`create/SKILL.md`](create/SKILL.md) |
| "execute the plan", "run the plan", "/dwp-execute" | **Execute** → read [`execute/SKILL.md`](execute/SKILL.md) |
| "refine the draft", "modify the plan", "/dwp-refine" | **Refine** → read [`refine/SKILL.md`](refine/SKILL.md) |
| "resume", "continue the interrupted plan", "/dwp-resume" | **Resume** → read [`resume/SKILL.md`](resume/SKILL.md) |
| "plan status", "what's left", "/dwp-status" | **Status** → read [`status/SKILL.md`](status/SKILL.md) |
| "verify", "is this repo AI-first?", "check conformance", "/dwp-verify" | **Verify** → read [`verify/SKILL.md`](verify/SKILL.md) |
| "make this repo AI-first", "onboard this repo", "set up AGENTS.md + docs + .agents" | **Onboard** → read [`onboard/SKILL.md`](onboard/SKILL.md) |
| "create/update a skill or agent", "evolve the kit", "/skill-create", "/agent-create" | **Author** → read [`author/SKILL.md`](author/SKILL.md) |

If the intent is ambiguous between planning and managing existing work, ask the
developer which they mean before routing.

### Normative specification (ships with the skill)

The methodology's authoritative standard lives at [`spec/`](spec/README.md) —
five RFC-2119 documents (`DOCUMENTATION_STANDARD`, `DWP_SPECIFICATION`,
`AGENT_PROTOCOL`, `ARCHETYPES`, `ADDONS`). It ships inside the skill so an agent
reads the standard **locally** — no network needed. The `onboard` flow and
`shared/adaptation.md` reference it as the standard to produce. The public,
rendered version lives at https://deepworkplan.com/spec.

### Shared resources used by every sub-skill

- [`shared/context.sh`](shared/context.sh) — detect repo root, branch, and agent
  tool; resolve the `.dwp/` output location.
- [`shared/dwp-paths.md`](shared/dwp-paths.md) — the `.dwp/plans/` +
  `.dwp/drafts/` output convention and how to override it.
- [`shared/adaptation.md`](shared/adaptation.md) — the reasoning-over-copy-paste
  principle and the two repository archetypes (individual repo vs orchestrator
  hub).

### Opt-in addons

The [`addons/`](addons/README.md) area holds **opt-in** capabilities the
`onboard` flow can layer onto a repo. Addons are never part of the AI-first
baseline — a repo is fully conformant with zero addons. The first addon is
devcontainer support.
