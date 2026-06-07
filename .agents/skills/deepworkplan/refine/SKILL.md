---
name: deepworkplan-refine
description: Refine a Deep Work Plan draft or modify an existing final plan. Use when the developer wants to adjust scope, tasks, or details of a draft in .dwp/drafts/ or a plan in .dwp/plans/.
version: "2.7.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Refine

Polish a **refined draft** or modify an **existing final plan** (add / edit /
reorder tasks, update the README).

> **Single-step change (vs legacy):** there is exactly one draft artifact — the
> **refined draft** at `.dwp/drafts/PLAN_{name}_draft_refined.md`. Refining a
> draft **edits it in place** (or converts it into a final plan). The legacy
> distinction where "refine the draft" produced a separate `_refined` file from a
> raw draft is gone, and the old three-option "Refine / Convert / Both" collapses
> to **Edit in place** or **Convert to plan**.

## Shared resources (read these)

- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — drafts at `.dwp/drafts/`,
  plans at `.dwp/plans/PLAN_{name}/`.
- [`../shared/context.sh`](../shared/context.sh) — resolve `dwp_dir`.
- [`../guide/GUIDE.md`](../guide/GUIDE.md) — plan/task structure and mandatory
  final tasks.
- [`../examples/CREATE_PLAN.md`](../examples/CREATE_PLAN.md) — prompt patterns for
  professional rewriting.

## Parameter Support

| Parameter | Description | Example |
|-----------|-------------|---------|
| (none) | Interactive — choose draft or plan | `/dwp-refine` |
| `{draft_filename}` | Refine a specific refined draft | `/dwp-refine PLAN_x_draft_refined.md` |
| `latest` | Refine the most recent refined draft | `/dwp-refine latest` |
| `plan {plan_name}` | Modify an existing final plan | `/dwp-refine plan auth_refactor` |
| `plan latest` | Modify the most recent plan | `/dwp-refine plan latest` |

## Workflow

### Step 0 — Determine Target Type
- No parameters → Step 1 (interactive).
- A draft filename / `latest` → Step 2 (Draft Workflow).
- `plan {name}` / `plan latest` → Step 3 (Plan Workflow).

### Step 1 — Interactive Selection
Ask whether to refine **a draft** (polish or convert to a final plan) or **an
existing final plan** (add tasks, modify instructions, adjust context). Route to
Step 2 or Step 3.

## Draft Workflow

### Step 2 — Select and Refine the Refined Draft

**2.1 Select.** If not specified, list `*.md` files in `.dwp/drafts/` (excluding
README) and let the user pick by number, filename, or `latest`.

**2.2 Read** the refined draft fully: objective, context, tasks, plan name,
structure.

**2.3 Choose action:**
1. **Edit the refined draft in place** — improve/polish the prompt; rewrite
   professionally following `../examples/CREATE_PLAN.md`; expand and detail all
   sections; **save back to the same** `.dwp/drafts/PLAN_{name}_draft_refined.md`
   (no new `_refined` file).
2. **Convert to a final plan** — extract plan info; create the plan folder and all
   files following `../guide/GUIDE.md`; **auto-add the mandatory elements** (same
   as create): `analysis_results/` folder, `PROGRESS.md` initial template, Skills
   & Agents Discovery task (second-to-last), Executive Report task (last),
   Analysis Outputs section in the README; then offer to execute via the
   **Execute** sub-skill (`../execute/SKILL.md`).

## Plan Workflow

### Step 3 — Select and Modify a Final Plan

**3.1 Select.** If not specified, list `PLAN_*` folders in `.dwp/plans/`; pick by
number, name, or `latest`. Normalize the `PLAN_` prefix.

**3.2 Read** the plan README and task files: objective, context, guidelines,
tasks and their `[x]`/`[ ]` status.

**3.3 Show current state** — objective, the task list with status, and the
location `.dwp/plans/PLAN_{name}/`.

**3.4 Choose modification:** Add task(s) / Edit task / Reorganize / Update README
/ View task details / Done.

**3.5 Execute modifications**

**Mandatory-task protection (applies throughout):**
- **Skills & Agents Discovery** must remain second-to-last; **Executive Report**
  must remain last.
- They **CANNOT be deleted or reordered**, but they **CAN be edited** (e.g. to add
  plan-specific evaluation criteria or report sections). If the user tries to
  delete or move them, explain: "These are mandatory tasks. They can be edited but
  not deleted or reordered."

- **Add task(s):** new tasks may only be inserted BEFORE the two mandatory final
  tasks. Ask for the insert position (a number `1..N-2`, `before-mandatory`, or
  `after {k}` where `k ≤ N-2`), gather task details, create the task file (full
  standard structure), and renumber subsequent files. Keep the mandatory tasks as
  the final two. Update the README task list.
- **Edit task:** show current content; apply changes to title / instructions /
  acceptance criteria / validation / everything. Mandatory tasks are editable.
- **Reorganize:** move / split / merge / delete. Renumber files as needed and
  **always keep the mandatory tasks as the final two**. Warn before deleting a
  completed `[x]` task.
- **Update README:** objective / context / global guidelines / execution rules.
- **View task details:** display the full task file.
- **Done:** report modifications and offer to execute/resume via the **Execute**
  (`../execute/SKILL.md`) or **Resume** (`../resume/SKILL.md`) sub-skill.

## Important Notes
- **Preserve completed work:** never alter `[x]` tasks unless explicitly asked.
- **Renumber carefully:** keep task file numbers and README references in sync.
- **Maintain consistency:** task files follow the standard structure
  (`../guide/GUIDE.md` §5).
- **Git ignore:** everything under `.dwp/` is git-ignored.
- **One draft artifact:** refining a draft edits
  `PLAN_{name}_draft_refined.md` in place; there is no separate raw draft.

## Error Handling
- Draft/plan not found → list available options and let the user select.
- Task number out of range → show the valid range and re-ask.
- Deleting a completed `[x]` task → confirm explicitly first.
- Plan has work in progress → warn about impact; suggest finishing the current
  task first.
