---
name: deepworkplan-resume
description: Resume an interrupted Deep Work Plan from its recorded progress state. Use when the developer wants to continue a plan in .dwp/plans/ that was paused or interrupted mid-execution.
version: "2.7.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Resume

Safely continue an interrupted plan from where it stopped — no duplicated work,
strict order, continuing from the first `[ ]` task.

## Shared resources (read these)

- [`../shared/context.sh`](../shared/context.sh) — resolve repo root, branch, and
  `dwp_dir`.
- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — plans at
  `.dwp/plans/PLAN_{name}/`.
- [`../shared/adaptation.md`](../shared/adaptation.md) — the two repository
  archetypes (relevant for orchestrator/child-DWP awareness).
- [`../execute/SKILL.md`](../execute/SKILL.md) — the execution rules this flow
  resumes into (team-agents, orchestrator task types, Dailybot golden rule).

## Parameter Support
- `/dwp-resume {plan_name}` — resume directly (skip the menu).
- `/dwp-resume latest` — resume the most recently modified plan.
- No parameter → interactive selection (Step 1).

Normalize the `PLAN_` prefix; validate `.dwp/plans/PLAN_{name}/` and its
`README.md`. If not found, show available plans and ask the user to choose.

## Workflow

### Step 0 — Check for Parameters
If a parameter was given, resolve the plan (or `latest`), validate folder +
README under `.dwp/plans/`, and skip to Step 2. Otherwise go to Step 1.

### Step 1 — Identify Plan
List `PLAN_*` folders in `.dwp/plans/`; mark the most recently modified as
`latest`. Present a numbered menu (number / name / `latest`) and validate the
choice.

### Step 2 — Assess Current State (CRITICAL)
1. Read the plan README fully (objective; which tasks are `[x]` vs `[ ]`).
2. Run `git status`, `git log --oneline -10`, and `git diff` (if uncommitted
   changes exist).
3. Find the resumption point — the **first unchecked `[ ]` task**.
4. Check for partial work: if `git status` shows uncommitted changes, review them
   against the current `[ ]` task; read that task's Completion & Log for notes.

### Step 3 — Report Resumption Status
Report: completed `[x]` tasks; pending `[ ]` tasks; the task to resume from; git
state (uncommitted changes, recent commits, last commit); the current task file
and any completion-log notes; partial-work findings; and the plan to finish the
task. Location: `.dwp/plans/PLAN_{name}/`.

### Step 4 — Handle Partial Work
If uncommitted changes exist, classify them: valid partial progress (incorporate
and complete), incomplete (finish remaining work), or unclear/unrelated (ask the
user before proceeding). If none, proceed directly.

### Step 5 — Resume Execution
1. **NEVER redo `[x]` tasks** — trust the README, cross-check git commits.
2. **NEVER skip `[ ]` tasks** — strict order; complete each fully.
3. **Continue from the first `[ ]` task** — open its file, read fully, address any
   logged blocker first.
4. **Complete the current task** — follow its Execution Checklist; run all
   validations; on failure, log in Completion & Log, leave `[ ]`, report and wait;
   on pass, update the log, mark `[x]`, and commit.
5. **Continue** to the next `[ ]` task until done or paused.

> From here, the standard **Execute** rules apply
> (`../execute/SKILL.md`): the per-task significance Dailybot report, the
> plan-completion **milestone** golden rule, and — for orchestrator plans —
> orchestrator task types (`create_child_dwp` / `integration_checkpoint` /
> `execute_child_dwp`), manifest checks, and team-agents parallel groups (real
> team agents, not subagents) with sequential fallback. Resume from the first
> `[ ]` task using those same rules, including hub-vs-individual-repo navigation
> per `../shared/adaptation.md`.

### Step 6 — Handle Blockers
If a task log shows a blocker, read it, fix the issue, re-run validations; on
pass: mark `[x]`, commit, continue; on fail: log again, stop, request help.

### Step 7 — Progress Reporting
After resuming and completing a task: `✓ Resumed and completed: Task N` with
files changed, validation result, commit, and the next task. On blocker: `✗ Task
N blocked` with the blocker, action taken, status, and next step.

## Important Notes
- Trust the task list (`[x]` done / `[ ]` pending); verify with git; read
  completion logs; never duplicate work; never skip; assess partial work
  carefully; stop on blockers.

## Error Handling
- Invalid plan structure → report; ask to fix or proceed with caution.
- Missing task file → report; ask whether to skip or create.
- Unclear git state → report findings; ask before proceeding.
- Unresolvable blocker → log in Completion & Log; report; wait for guidance.
