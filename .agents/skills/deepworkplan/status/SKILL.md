---
name: deepworkplan-status
description: Report the status of a Deep Work Plan — completed tasks, what's left, and blockers — without executing. Use when the developer asks for plan status or what remains.
version: "2.4.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Status

Report the current state of one or more Deep Work Plans — progress, completed
tasks, current task, blockers — **without executing or modifying anything**.

## Shared resources (read these)

- [`../shared/context.sh`](../shared/context.sh) — resolve `dwp_dir`.
- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — plans at
  `.dwp/plans/PLAN_{name}/`.

## Parameter Support
- `/dwp-status {plan_name}` — check a specific plan.
- `/dwp-status latest` — check the most recently modified plan.
- `/dwp-status all` — check all plans.
- No parameter → interactive scope selection (Step 1).

Normalize the `PLAN_` prefix; validate that single plans exist under
`.dwp/plans/`. If not found, show available plans and ask the user to choose.

## Workflow

### Step 0 — Check for Parameters
`all` → scope "all", skip to Step 2. `latest` → most recent plan, scope "single",
skip to Step 2. Otherwise normalize the name, validate, scope "single", skip to
Step 2. No parameter → Step 1.

### Step 1 — Ask for Scope
List `PLAN_*` folders in `.dwp/plans/`; mark the most recently modified as
`latest`. Offer: a single plan (from a numbered list), all plans, or `latest`.
Accept a number, name, `all`, or `latest`.

### Step 2 — Gather Status Information
For each plan: read the README (goal, task list `[x]`/`[ ]`, plan-status notes);
run `git status` and `git log --oneline -20`; read the last completed task's
Completion & Log and the current `[ ]` task file; compute totals and progress %.

### Step 3 — Generate Status Report

**Single plan:** header with `Plan Status: PLAN_{name}` and location
`.dwp/plans/PLAN_{name}/`; goal; progress (total / completed / pending / %);
completed tasks; pending tasks; current status (last completed, next task,
uncommitted work, recent commits); notes from the README; last task log summary.

**All plans:** a one-line-per-plan summary (progress, status, last activity), then
the single-plan detail block for each.

### Step 4 — Additional Information (optional)
Offer deeper detail for any plan: all task files and status, `git diff` for
uncommitted changes, full last-task completion log, any blockers.

### Step 5 — Quick Actions
Suggest: resume (`/dwp-resume PLAN_{name}`), execute (`/dwp-execute PLAN_{name}`),
or open a specific task file.

## Status Classifications
Not started (all `[ ]`, no commits) · In progress (mixed, recent activity) ·
Complete (all `[x]`) · Blocked (current task has a blocker note) · Stale (no
activity for a long time — optional).

## Important Notes
- **Read-only:** never executes or modifies plans; `git status` is reported, not
  committed. Cross-reference the README task list with git commits for accuracy.

## Error Handling
- Plan folder doesn't exist → report; list available plans; ask to select.
- README missing → report incomplete structure; list what exists; suggest
  `/dwp-create`.
- No plans exist → report "No plans found in `.dwp/plans/`"; suggest
  `/dwp-create`.
