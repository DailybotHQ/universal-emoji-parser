---
name: deepworkplan-create
description: Create a Deep Work Plan. Gather context, draft, and refine into a single final plan under .dwp/plans/, with a refined draft staged in .dwp/drafts/. Use when the developer wants a new structured multi-task plan.
version: "2.7.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Create

Create a new Deep Work Plan through a smooth, unified flow: the developer
provides information once, you generate a **single refined draft**, the developer
reviews it, and you materialize the final plan under `.dwp/plans/PLAN_{name}/`.

> **Single-step change (vs legacy):** DeepWorkPlan generates the **refined draft
> directly**. There is **no separate raw-draft file**. This replaces the legacy
> draft → refined-draft two-step (which wrote `PLAN_{name}_draft.md` and then
> `PLAN_{name}_draft_refined.md`). The only reviewable draft artifact is now
> `.dwp/drafts/PLAN_{name}_draft_refined.md`.

## Philosophy

The goal is a delightful, smooth experience. The user provides information once;
the system handles all intermediate steps (refined-draft creation, review, final
plan generation) automatically.

## Shared resources (read these)

- [`../shared/context.sh`](../shared/context.sh) — resolve repo root, branch,
  agent tool, and the `.dwp/` output location (`dwp_dir`).
- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — the `.dwp/plans/` +
  `.dwp/drafts/` output convention.
- [`../shared/adaptation.md`](../shared/adaptation.md) — reasoning-over-copy-paste
  and the two repository archetypes (individual repo vs orchestrator hub).
- [`../guide/GUIDE.md`](../guide/GUIDE.md) — the full methodology: plan README
  structure, task-file anatomy, mandatory final tasks, orchestrator (§13),
  team agents (§14).
- [`../examples/CREATE_PLAN.md`](../examples/CREATE_PLAN.md) — prompt patterns.
- [`../examples/PROMPTS_TEMPLATE.md`](../examples/PROMPTS_TEMPLATE.md) — the
  `PROMPTS.md` template for each plan.

## Parameter Reference

| Input | Classification | Mode | Behavior | Example |
|-------|---------------|------|----------|---------|
| (none) | — | guided | Ask for name, then ask questions | `/dwp-create` |
| `{short text}` | **name-only** | guided | Extract name, ask questions immediately | `/dwp-create improve error handling` |
| `{long text}` | **full-context** | guided | Infer name, proceed to refined draft directly | `/dwp-create Refactor auth to use JWT across all services. Currently using sessions...` |
| `trust` or `auto` | — | trust | Ask for name, then ask questions (no confirmations) | `/dwp-create trust` |
| `{short text} trust` | **name-only** | trust | Extract name, ask questions (no confirmations) | `/dwp-create improve-error-handling trust` |
| `{long text} trust` | **full-context** | trust | Infer name, proceed directly (no confirmations) | `/dwp-create Refactor auth... trust` |
| `refined-draft {name}` | — | refined-draft-only | Produce ONLY the refined draft (no final plan) | `/dwp-create refined-draft my_plan` |
| `from-refined-draft {file}` | — | from-refined-draft | Build final plan from an existing refined draft | `/dwp-create from-refined-draft PLAN_x_draft_refined.md` |
| `from {file}` | — | from-refined-draft | Alias for `from-refined-draft` | `/dwp-create from PLAN_x_draft_refined.md` |

> **Name format:** users type names in any format; you auto-convert to
> `snake_case` internally.

## Modes

### Guided Mode (default)
- Collects information from the user.
- Creates the **refined draft** → shows it for review.
- Asks for confirmation before creating the final plan.
- User can request adjustments before final generation.

### Trust Mode (`trust` or `auto`)
- Collects information from the user.
- Creates the **refined draft** → final plan automatically (no intermediate
  confirmations).

## Unified Workflow

### Step 0 — Parse Parameters & Determine Mode

**0.1 Detect trust mode:** if the LAST word is `trust` or `auto`, remove it and
set `trust_mode = true`; otherwise `false`.

**0.2 Detect special modes (check FIRST word):**
- `refined-draft` → `mode = "refined-draft-only"`, remaining text = plan name.
- `from-refined-draft` or `from` → `mode = "from-refined-draft"`, remaining text
  = refined-draft file path.
- Otherwise → continue to input classification (0.3).

**0.3 Classify remaining input:**

| Condition | Classification | What to do |
|-----------|---------------|------------|
| No remaining text | **no input** | Go to Step 1, then Step 2 (ask for name + all info) |
| ≤10 words AND no complete sentences AND no line breaks | **name-only** | Convert to snake_case → plan name. Go to Step 1, then Step 2 (skip name question) |
| >10 words OR detailed sentences OR line breaks | **full-context** | Infer plan name → snake_case. Go to Step 1, then Step 3 (use provided context) |

**Name auto-conversion to snake_case:** lowercase; replace hyphens/spaces with
`_`; strip everything but `a-z0-9_`. Examples: `improve Feature X` →
`improve_feature_x`, `add-stripe-payments` → `add_stripe_payments`.

> **CRITICAL:** when input is **name-only**, NEVER explore the codebase or
> research the topic before asking questions. The name only says what to CALL the
> plan, not what to DO. Go directly to Step 2.

**Routing by mode:**
- `from-refined-draft` → skip to Step 4.3.
- `refined-draft-only` → gather info, create only the refined draft, skip final
  plan creation.
- `no input` / `name-only` → Step 1, then Step 2.
- `full-context` → Step 1, then Step 3.

### Step 1 — Quick Introduction

Show a brief intro matching the mode (guided vs trust): what will happen and that
you'll create a refined plan, review it (guided) or proceed (trust), then
generate the final executable plan.

### Step 2 — Gather Information (Conversational)

> Skip this entire step for `full-context` input — go straight to Step 3.

Collect, conversationally:
- **2.1 Plan name** (skip if already extracted) — auto-convert to snake_case, add
  `PLAN_` prefix internally.
- **2.2 Objective** — one or two sentences.
- **2.3 Context** — where the changes live, constraints/rules, tech notes.
- **2.4 Tasks** — at least 2; if only 1, suggest breaking it down.
- **2.5 Guidelines (optional)** — branch/commit format, coverage target, etc.

**2.6 Orchestrator detection (automatic).** After 2.3–2.4, auto-detect an
**orchestrator plan** when: the work spans 2+ sub-repositories with independent
feature work, or the user explicitly mentions child DWPs / orchestrator /
"create plans in each repo". If detected, offer the choice between an
**orchestrator plan** (creates child DWPs per repo, each following its own
`AGENTS.md`) and a **direct multi-project plan**. See `../guide/GUIDE.md` §13 and
`../shared/adaptation.md` (orchestrator-hub archetype).

**2.7–2.9 (orchestrator only):** ask for target repositories (note each repo
root — for an orchestrator hub this is `repositories/{repo}/`), dependency order,
and execution mode (Distributed / Sequential with Output Handoff / Sequential
basic). Default to Distributed.

**2.10 Team-agents detection (automatic — always runs, non-orchestrator plans).**
Always analyze whether 2+ tasks touch different files/modules with no data
dependencies and would benefit from parallel execution. This is NOT opt-in.
- If parallelizable: in **guided** mode, inform the user (do not ask) and add the
  team-agents configuration; in **trust** mode, do it silently. Team-agents
  metadata is always additive and backward compatible (other agents ignore it).
- Auto-assign parallel groups (tasks with no cross-dependencies), teammate roles
  (derived from task content), and default model `sonnet`. Setup/integration and
  the two mandatory final tasks are always sequential.
- If not parallelizable: add nothing, mention nothing.

**Step 2.11 — Parallel Research Phase (Claude Code only, automatic).** Before
drafting, if the plan spans 2+ repos or several independent modules and context
isn't already provided, spawn **research teammates** (`subagent_type: "Explore"`,
one per repo/area) to read each `AGENTS.md`, identify relevant files, contracts,
and validation commands, then synthesize their findings into enriched context for
the refined draft. Skip for simple/single-module plans or full-context input.
Fallback: research sequentially if team agents are unavailable. In trust mode,
run silently.

### Step 3 — Create the Refined Draft (Automatic, SINGLE STEP)

> **This is the single-step change.** Produce the **refined draft directly** —
> one file, written straight to `.dwp/drafts/`. Do NOT create a separate raw
> `PLAN_{name}_draft.md` first.

Show a **2-step** progress UI:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating your plan...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/2] Drafting refined plan...
```

**3.1 Write the refined draft:**
- Resolve `dwp_dir` via `../shared/context.sh`; ensure `<dwp_dir>/drafts/` exists.
- Compose a professional, complete plan prompt following
  `../examples/CREATE_PLAN.md`: objective, context (enriched with Step 2.11
  research if applicable), well-formed tasks, guidelines. Expand every section
  with full detail and clarity in one pass.
- Write **only**: `.dwp/drafts/PLAN_{name}_draft_refined.md`.

```
[1/2] Drafting refined plan... ✓
[2/2] Preparing for review...
```

### Step 4 — Review & Create Final Plan

#### 4.1 Guided Mode — Show for Review

Present a summary (objective, task count + list, location, constraints) and the
path `→ .dwp/drafts/PLAN_{name}_draft_refined.md`, then offer:
1. Looks good, create the final plan → Step 4.4.
2. Make adjustments → ask what to change, **edit the refined draft in place**,
   show the menu again.
3. Show the full refined draft → display it, then re-show the menu.
4. Stop here → completion message for the draft phase.

#### 4.2 Trust Mode — Automatic Continue

Skip review; go directly to Step 4.4. Progress: `[2/2] Creating final plan...`.

#### 4.3 From-Refined-Draft Mode

- Validate the file exists in `.dwp/drafts/`. If not found, list available
  refined drafts and ask the user to select.
- Read it; extract plan name, objective, context, tasks, guidelines.
- Skip to Step 4.4.

#### 4.4 Create Final Plan

Follow `../guide/GUIDE.md`. Create:

1. **Folder:** `.dwp/plans/PLAN_{name}/`
2. **README.md** — Goal; Context; Plan Variables (optional); Global Guidelines;
   Task List with `[ ]` checkboxes + links (including the two mandatory final
   tasks); Execution Rules; Skills & Agents Used; Plan Status / Notes; Analysis
   Outputs (referencing `EXECUTIVE_REPORT.md`); Quick Reference to `PROMPTS.md`.
3. **PROMPTS.md** — from `../examples/PROMPTS_TEMPLATE.md`, replacing
   `{PLAN_NAME}`.
4. **PROGRESS.md** — initial template (Task Summaries / Key Decisions / Important
   Values & Paths).
5. **analysis_results/** — empty folder inside the plan directory.
6. **User-defined task files** — `N.task_{title}.md`, each with Context, Read
   Before Starting (optional), Goal, Instructions (with re-anchoring),
   Acceptance Criteria, Outputs (optional), Validation, Rollback (optional),
   Execution Checklist, Completion & Log.

**Two mandatory final tasks (always):**
- **Skills & Agents Discovery** (MANDATORY, **second-to-last**, task `N-1`,
  `{N-1}.task_skills_agents_discovery.md`): reviews completed tasks for new
  patterns, checks the catalog, creates/updates skills/agents if warranted,
  evaluates the skills-generator system. If no skills-generator exists in the
  target repo, write a simplified evaluate-and-document-only version.
- **Executive Report** (MANDATORY, **last**, task `N`,
  `{N}.task_executive_report.md`): generates
  `analysis_results/EXECUTIVE_REPORT.md` with Executive Summary, Product Impact,
  Technical Details, QA Verification Guide, FAQs, Next Steps.

Add to the README a note: "Every plan includes Skills & Agents Discovery
(second-to-last) and Executive Report (last). These are auto-generated by
`/dwp-create`."

**Quality gates:** atomic, ordered tasks; both mandatory files present;
`analysis_results/` exists; `PROGRESS.md` exists; numbering correct (user tasks →
skills discovery → executive report).

**Accelerate generation with team agents (Claude Code only, automatic):** for
5+ user-defined task files, the lead creates README/PROMPTS/PROGRESS/
analysis_results + the mandatory final task files, then spawns teammates (1 per
2–3 task files) to write user task files in parallel (no file overlap), verifies
all files, and cleans up. Fallback: generate sequentially.

**Orchestrator additions (orchestrator plans):**
- README **Child DWP Plans** table (`# | Repository | Child Plan | Status |
  Depends On`), an **Execution Mode** subsection, and **Dependency Rules**.
- **ORCHESTRATOR_MANIFEST.md** at `.dwp/plans/PLAN_{name}/ORCHESTRATOR_MANIFEST.md`
  (template in `../guide/GUIDE.md` §13.8): Shared Context, Child DWP Registry,
  Dependency Graph, Output Contracts, Execution State.
- Task files: direct design tasks first (if hybrid); then `create_child_dwp`
  tasks in dependency order (template
  `../examples/ORCHESTRATOR_TASK_TEMPLATE_create_child_dwp.md`); optional
  `integration_checkpoint` tasks
  (`../examples/ORCHESTRATOR_TASK_TEMPLATE_integration_checkpoint.md`);
  `execute_child_dwp` tasks for Sequential-with-Output-Handoff mode
  (`../examples/ORCHESTRATOR_TASK_TEMPLATE_execute_child_dwp.md`); then the two
  mandatory final tasks last. Each `create_child_dwp` task instructs the agent to
  navigate to the target repo, read its `AGENTS.md`, and create a child DWP at
  `repositories/{repo}/.dwp/plans/PLAN_{child}/` using that repo's conventions.

**Team-agents metadata (when Step 2.10 detected parallelizable tasks):** add a
"Team Agents Configuration (Claude Code Only)" section to the README (Parallel
Task Groups + Teammate Roles tables) and a "Team Agents Metadata (Claude Code
Only)" section to each parallel task file (Parallel Group / Teammate Role / Can
Run With / Blocks / Files Owned). Use `../examples/TEAM_AGENTS_TASK_TEMPLATE.md`.
Rules: never put required info inside team-agents sections; every task must work
sequentially; mandatory final tasks are always sequential; file ownership between
parallel tasks must not overlap.

### Step 5 — Completion & Execute Option

For a full plan, report success and the location
`.dwp/plans/PLAN_{name}/`, then offer: (1) execute now → run the **Execute**
sub-skill (`../execute/SKILL.md`); (2) review the README first, then ask again;
(3) done for now → tell them to run `/dwp-execute {name}` later.

For `refined-draft-only` mode, report the single refined draft saved at
`.dwp/drafts/PLAN_{name}_draft_refined.md` and the next step: run
`/dwp-create from PLAN_{name}_draft_refined.md` to build the final plan.

### Step 6 — Execute Plan (Optional)

If the user chose to execute, hand off to the **Execute** sub-skill
(`../execute/SKILL.md`): read the plan README, check git status, start from the
first `[ ]` task, execute sequentially, validate, commit per task, report.

## Error Handling

- **Plan name already exists:** offer different name / overwrite / cancel.
- **Name auto-converted:** show an informational notice (not an error).
- **Refined draft not found (from-refined-draft):** list available refined drafts
  in `.dwp/drafts/` and ask the user to choose.
- **Insufficient tasks (<2):** ask the user to break the work down.

## Important Notes

- **Git ignore:** everything under `.dwp/` is git-ignored.
- **Single artifact:** the only draft file is `PLAN_{name}_draft_refined.md` in
  `.dwp/drafts/` — there is no separate raw draft.
- **Reference:** follow `../guide/GUIDE.md`; orchestrator → §13; team agents → §14.
- **Archetypes:** orchestrator support assumes the orchestrator-hub archetype
  (sub-repos under `repositories/`); an individual repo creates standard plans.
  See `../shared/adaptation.md`.
