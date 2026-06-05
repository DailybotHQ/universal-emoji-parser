---
name: deepworkplan-execute
description: Execute an existing Deep Work Plan task-by-task, run each task's validation, and log progress. Use when the developer wants to run or continue executing a plan in .dwp/plans/.
version: "2.4.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Execute

Execute a Deep Work Plan by working through its tasks **sequentially, one at a
time**, validating and committing after each, and reporting progress.

## Shared resources (read these)

- [`../shared/context.sh`](../shared/context.sh) — resolve repo root, branch,
  agent tool, and `dwp_dir` (the `.dwp/` output location).
- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — plans live at
  `.dwp/plans/PLAN_{name}/`.
- [`../shared/adaptation.md`](../shared/adaptation.md) — the two repository
  archetypes (individual repo vs orchestrator hub) that govern how navigation
  and validation commands resolve.
- [`../guide/GUIDE.md`](../guide/GUIDE.md) — execution rules (§6), orchestrator
  protocol (§13), team agents (§14).

## Parameter Support

- `/dwp-execute {plan_name}` — execute directly (skip the selection menu).
- `/dwp-execute latest` — execute the most recently modified plan.
- No parameter → interactive selection (Step 1).

Normalize names by adding the `PLAN_` prefix if missing. Validate that
`.dwp/plans/PLAN_{name}/` and its `README.md` exist; if not, show available plans
and ask the user to choose.

## Workflow

### Step 0 — Check for Parameters
If a parameter was given, resolve the plan (or "latest"), validate the folder and
README under `.dwp/plans/`, and skip to Step 2. Otherwise continue to Step 1.

### Step 1 — Identify Plan
List folders in `.dwp/plans/` starting with `PLAN_`; mark the most recently
modified as `latest`. Present a numbered menu and accept a number, plan name, or
`latest`. Validate the chosen plan's folder + README.

### Step 2 — Read Plan Overview
Read the plan README: goal, context, global guidelines, task list (`[x]` vs
`[ ]`), execution rules.

**Step 2.1 — Detect plan type.** Set `plan_type = "orchestrator"` if the README
has a "Child DWP Plans" section, or task files contain `create_child_dwp` /
`execute_child_dwp`. Note the execution mode (Distributed / Sequential / Sequential
with Output Handoff) and whether `ORCHESTRATOR_MANIFEST.md` exists in the plan
folder. Report orchestrator plans with their execution mode, manifest
availability, and child-DWP list.

**Step 2.2 — Detect team-agents configuration.** If the README has a "Team Agents
Configuration" section: team-agents mode is available. Verify
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; if not set, inform the user and fall
back to sequential. If available and enabled, offer to use team agents for
parallel groups. Store the decision for Step 5.

### Step 3 — Check Current Status
Read the README task list; run `git status` and `git log --oneline -10`; identify
the first `[ ]` task. Report completed/pending tasks, the starting task, git
state, and recent commits. The location is `.dwp/plans/PLAN_{name}/`.

### Step 4 — Ask for Execution Preferences (optional)
Ask for any specific requirements (press Enter for defaults from the plan README).

### Step 5 — Execute Plan

Rules (strict):
1. **One task at a time** — always the first unchecked `[ ]` task. Never skip or
   reorder.
2. **For each task** — open `N.task_{title}.md`, read it fully, follow its
   instructions and Execution Checklist.
3. **Run validations** — execute ALL validation commands. If any fail: STOP, log
   the issue in the task's Completion & Log, do NOT mark `[x]`, report and wait
   for guidance.
4. **Mark complete** — only when all acceptance criteria are met and all
   validations pass. Update the README `[ ] → [x]` and fill the task's Completion
   & Log (status, timestamp, summary, files changed, validation results, notes).
5. **Commit** after each completed task using conventional commits:
   `type(scope): complete task N - description`.
6. **Dailybot per-task report (only for individually significant tasks)** — after
   committing a task that is independently significant (feature, bug fix, major
   refactor), trigger the `dailybot` skill (e.g. "report this to Dailybot" or
   `/dailybot_report`) with a standup-style message — WHAT was accomplished + WHY
   it matters. Do NOT report intermediate setup tasks; the plan-completion report
   (Step 7) covers those. Never use internal "Completed Task N" phrasing. If
   reporting fails, continue without blocking. The `dailybot` skill is installed
   alongside this skill in the agent's skills directory — invoke it there.
7. **Move to the next `[ ]` task** and repeat.

**Stop conditions:** all tasks `[x]`; a validation fails; the user requests a
pause; a blocking issue.

#### Autonomous mode (long-horizon, hours-long runs)

A Deep Work Plan is designed to be executed **autonomously for hours**, across
many tasks and even across a context-window reset. When the developer asks to run
unattended (or passes `trust` / `auto`):

- **Continue without per-task confirmation.** Run task → validate → commit →
  update `PROGRESS.md` → next task, in a loop. Do not stop to ask "shall I
  continue?" between tasks.
- **Stop only on a real boundary:** a failed validation gate, genuine ambiguity,
  a blocking dependency, an unsafe/destructive action outside the plan's scope, or
  plan completion. On a stop, log the reason in the task's Completion & Log and
  report.
- **Checkpoint every task.** Progress lives on disk — the README checkboxes, each
  task's Completion & Log, and `PROGRESS.md` (summaries, key decisions, important
  values/paths). After each task this state MUST be current, because it is the
  only thing that survives a context-window reset.
- **Resume from disk, not memory.** If context is exhausted or a fresh agent takes
  over, do not rely on conversation history: re-read the plan README, `PROGRESS.md`,
  and the Completion & Logs, then continue at the first `[ ]` task (this is exactly
  what the `resume` sub-skill does). Re-anchor to the plan goal before each task to
  prevent drift over the long horizon.

#### Step 5.0.1 — Team-Agents Parallel Groups

> **CRITICAL: use REAL team agents, NOT subagents.** When the plan has a "Team
> Agents Configuration" section and team-agents mode was selected, you MUST use
> `TeamCreate` + `Agent` with `team_name` + `TaskCreate` + `SendMessage` +
> `TeamDelete`. Do NOT call `Agent` alone (no `team_name`) — that creates
> subagents, which only report back to the caller. Team agents share a task list
> and communicate with each other.

At a parallel-group boundary:
1. Announce the parallel group.
2. `TeamCreate` with `team_name: "dwp-{plan_name}-group-{letter}"`.
3. Spawn teammates with `Agent` + `team_name` + `subagent_type:
   "general-purpose"`, passing each its task file content + the plan README's
   Goal/Context/Guidelines + commit instructions.
4. `TaskCreate` one shared task per parallel task; assign each to its teammate via
   `TaskUpdate` (`owner`).
5. Monitor: receive teammate messages, `SendMessage` as needed; when all parallel
   tasks complete, verify each is `[x]` in the README. If a teammate fails, log
   and recover or fall back to sequential.
6. Clean up: `SendMessage` a `shutdown_request` to each teammate, wait for
   confirmation, then `TeamDelete`. Continue with the next sequential task/group.
7. Each teammate commits its own task; the lead verifies commits afterward.

**Verify real team agents:** the status bar shows `Team: dwp-...-group-X · N
teammates`, NOT `N local agents`.

**Sequential fallback:** if team-agents execution fails at any point, log the
reason and execute the remaining group tasks sequentially (standard single-task
rules) — no special handling needed.

#### Step 5.1 — Orchestrator Task Types

Orchestrator navigation generalizes across the two archetypes (see
`../shared/adaptation.md`):
- **Orchestrator-hub archetype** — the hub coordinates sub-repos under
  `repositories/{repo}/`. Navigate with `cd repositories/{repo_name}` to operate
  in a child repo, and return to the hub root (resolve it via
  `../shared/context.sh` — e.g. the git toplevel) between tasks. Child plans live
  at `repositories/{repo}/.dwp/plans/PLAN_{child}/`.
- **Individual-repo archetype** — the repo resolves its own root via
  `../shared/context.sh`; there is no `repositories/` layer. Child-DWP task types
  rarely apply here.

**`create_child_dwp` tasks:** navigate to the target repo; read its `AGENTS.md`
(validation commands, test patterns, commit format, stack); install/confirm
DeepWorkPlan there if missing (it ships its own guide/examples); create the child
DWP at `{child_repo_root}/.dwp/plans/PLAN_{feature}_{repo_short}/` using that
repo's conventions and validation commands (NOT the hub's), including a parent
plan reference; return to the hub root and mark the child `[x] Created` in the
orchestrator README's Child DWP Plans table. In **Sequential** mode also execute
the child DWP immediately (committing in that repo) and mark `[x] Created /
[x] Executed`; in **Distributed** mode create only.

**`integration_checkpoint` tasks:** read the checkpoint criteria and all created
child DWPs; verify integration points (API contracts, data model field
names/types, naming, error handling) across repos; report each pass/fail; fix
blockers or flag for the user.

**`execute_child_dwp` tasks:** verify execution readiness from
`ORCHESTRATOR_MANIFEST.md` (all predecessors `[x] Executed`, outputs listed) — if
any predecessor is missing, STOP and report BLOCKED. Load predecessor executive
reports as context; navigate to the target repo; execute the child DWP using that
repo's validation commands; commit there; return to the hub and register outputs
in the manifest (mark `[x] Executed`, add a Completed Output Reference) and update
the README to `[x] Created / [x] Executed`.

### Step 6 — Progress Reporting
After each task: `✓ Task N completed: {title}` with files changed, validation
result, commit, and the next task. On failure: `✗ Task N validation failed` with
the error, blocked status, and `[ ]` retained.

### Step 7 — Completion

When all tasks are `[x]`, report the completion summary (all tasks, totals,
commits, final commit).

**🔔 GOLDEN RULE — Dailybot Plan-Completion Report (MANDATORY):**

> When a DWP plan finishes execution, you MUST ALWAYS send a Dailybot progress
> report **as a milestone**. A completed plan is always a significant milestone.

Trigger the `dailybot` skill (e.g. `/dailybot_report` or "report this milestone
to Dailybot") in Daily Standup style describing WHAT the plan accomplished and
its impact. Mark it as a **milestone** with structured data
(completed/in-progress/blockers). NEVER use internal references (plan names, task
counts, DWP terminology).
- GOOD: *"Finished the authentication refactor — the API now uses JWT tokens
  across all services with centralized middleware validation."*
- BAD: *"Plan completed: PLAN_auth_refactor - All 8 tasks completed."*

Craft it: read the plan README's Goal; summarize WHAT was accomplished in terms
the team cares about; add WHY it matters; 1–3 sentences; always English; always a
milestone. The `dailybot` skill is installed alongside this skill — invoke it
there. If reporting fails, continue without blocking.

### Step 7.1 — Orchestrator Plan Completion
Report per mode (Distributed: all child DWPs created and ready, with the
dependency order and per-repo execute commands; Sequential / Sequential with
Output Handoff: all created and executed, with outputs and the fully-updated
manifest path). The same Dailybot milestone golden rule applies — describe what
the feature achieved across repos, never "N child DWPs executed."

## Important Notes
- Strict order; one task at a time; validation required; commit after each; stop
  on failure; the plan README is the source of truth.
- **Skill invocation:** when a task references a skill (`/{skill}`), invoke it
  directly. When it references agent-based validation, delegate to that agent.
- **Orchestrator navigation:** always return to the hub root between tasks (hub
  archetype). Orchestrator tracking updates are committed in the hub; child plan
  files live in each sub-repo's gitignored `.dwp/`.
- **Manifest:** read it at the start of orchestrator execution; update it after
  each `execute_child_dwp`. Verify predecessors before any `execute_child_dwp`.
- **Team agents:** detect, offer, fall back to sequential on failure, and always
  clean up the team after each parallel group. Mandatory final tasks (Skills
  Discovery, Executive Report) are ALWAYS sequential under the lead.

## Error Handling
- Missing task file → report; ask whether to skip or create.
- Validation command fails → stop, log, report, wait.
- User requests pause → stop at the current task; `[x]` marks persist.
- Invalid plan structure → report; ask to fix or proceed with caution.
- Target repo not found / no `AGENTS.md` (orchestrator) → report; for missing
  `AGENTS.md`, create a minimal child DWP with generic validation and note it.
- Predecessor not executed (`execute_child_dwp`) → BLOCKED; list what's missing;
  do not proceed.
- Manifest missing but `execute_child_dwp` exists → warn; fall back to the
  README's Child DWP Plans table and predecessor executive reports; log the
  limitation.
