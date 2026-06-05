# Task {N}: Hand Off Execution of Child DWP — {Repository Name}

> **Template for orchestrator plans.** Replace all `{placeholders}` when generating a real task file.

> [!IMPORTANT]
> **This task is a HAND-OFF, not an execution.** The orchestrator agent **must never** execute a child DWP itself in the same session. It must stop at this task, confirm predecessors are ready, emit a ready-to-use execution prompt for the target repository, and wait for the user (or a separate agent session running inside that repo) to execute the child and confirm completion. Only then may the orchestrator agent continue.
>
> **Rationale:** Child DWPs run inside their own repository with their own agent context, tooling, AGENTS.md rules, validation commands, and git history. Executing them from the orchestrator session silently mixes contexts, violates per-repo conventions, hides work from the target repo's audit trail, and can produce invalid commits. The hand-off model keeps each repo's agent autonomous.

> [!TIP]
> **Parallel execution is often possible and preferred.** Check the execution mode declared in the orchestrator plan's README (§4 Child DWP Plans → Execution Mode):
>
> - **Contract-Parallel** (recommended when children share a frozen design spec): emit a SINGLE combined hand-off block listing all eligible children at once; they can run concurrently in separate agent sessions.
> - **Sequential Runtime-Dependent** (rare; only when child B's code literally imports child A's code at build time): emit one hand-off at a time, wait for DONE, then the next.
> - **Fully Parallel / Distributed** (children are independent): same as Contract-Parallel — combined hand-off.
>
> See GUIDE §13.6 for the mode selection algorithm. Default to the most parallel mode your dependency analysis supports.

## 1. Context

**Plan Type:** Orchestrator — Child DWP Execution HAND-OFF
**Target Repository:** `repositories/{repo_name}/`
**Child Plan to Execute (by another agent):** `PLAN_{feature}_{repo_short}`
**Child Plan Location:** `repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/`

This task verifies predecessors are ready, emits a hand-off prompt for the target repo's agent, and **stops**. It does not execute the child DWP. When the user confirms the child DWP has been executed (executive report present, all its tasks `[x]`), the orchestrator agent updates the manifest and marks this task complete.

### Orchestrator Context

- **Parent Plan:** PLAN_{parent_plan_name} (this plan, in Core Hub)
- **Feature:** {overall feature description}
- **This repo's role:** {what this repo contributes — e.g., "CRUD API endpoints for user preferences"}
- **Depends on:** {list child plans that must be executed first, or "None — this is the first child DWP"}
- **Depended on by:** {list child plans that depend on this one's outputs, or "None"}
- **Manifest:** `.dwp/plans/PLAN_{parent_plan_name}/ORCHESTRATOR_MANIFEST.md`

### Predecessor Outputs Required

{If this child has predecessors, list what outputs must be available before hand-off:}

- **PLAN_{feature}_{predecessor_short}** (must be `[x] Executed`):
  - Executive Report: `repositories/{predecessor_repo}/.dwp/plans/PLAN_{feature}_{predecessor_short}/analysis_results/EXECUTIVE_REPORT.md`
  - Key outputs needed: {specific data this child needs — e.g., "API endpoint paths, data model definitions, error response formats"}
- {Or "None — this is the first child DWP (no predecessors)"}

## 2. Read Before Starting

1. **Orchestrator Manifest:** Read `ORCHESTRATOR_MANIFEST.md` from the parent plan folder.
   - Check "Execution State" — verify all predecessors are `[x] Executed`.
   - Check "Completed Output References" — confirm predecessor executive reports are registered.
2. **Predecessor Executive Reports** (if this child has dependencies): confirm they exist on disk (do NOT read through them line-by-line — the target repo's agent will).
3. **Child DWP README** (for the hand-off prompt): `repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/README.md`.

## 3. Goal

Emit a ready-to-use hand-off prompt for the target repo's agent to execute `PLAN_{feature}_{repo_short}`, then pause. When the user confirms execution is complete, register outputs in the orchestrator manifest and mark this task `[x]`.

**Success conditions:**

- Predecessor readiness verified.
- Hand-off prompt emitted and delivered to the user (or separate agent session).
- Orchestrator agent has **NOT** navigated into `repositories/{repo_name}/` with any write intent, has **NOT** run validations, has **NOT** edited or committed anything inside the target repo.
- After user confirmation of execution, manifest and orchestrator README are updated with the executed child's outputs.

## 4. Instructions

> **Before starting:** Re-read the parent plan README section 1 (Goal) to ensure this hand-off aligns with the overall objective.

### Step 1: Verify Hand-Off Readiness (CRITICAL — mode-dependent)

Determine execution mode from the orchestrator plan README (§4). Then apply the appropriate gate (see GUIDE §13.10):

**Contract-Parallel or Fully Parallel:** lenient gate.
- [ ] Design-doc contracts exist on disk (envelope spec / API contract / prompt architecture / etc.).
- [ ] Integration checkpoint PROCEED documented.
- [ ] Sibling child DWP folders exist (each `test -d <path>`).

**Sequential Runtime-Dependent:** strict gate — for this mode only.
- [ ] Predecessor marked `[x] Executed` in manifest Execution State.
- [ ] Predecessor Executive Report exists at the referenced path.
- [ ] "Completed Output References" has the predecessor entry.

If any required check for the applicable mode fails — STOP:

```
BLOCKED: Cannot hand off PLAN_{feature}_{repo_short}
- Mode: {Contract-Parallel | Fully Parallel | Sequential Runtime-Dependent}
- Missing: {what failed}
- Action: {fix the missing piece; do NOT execute the child inline to "unblock"}
```

Log the blocker in §9. Do NOT mark this task complete. Stop and wait.

> **Note:** if multiple hand-off tasks in the same plan can fire together (Contract-Parallel / Fully Parallel), prefer emitting a single combined hand-off block (see the TIP callout at the top of this template).

### Step 2: Emit the Hand-Off Prompt to the User

Present the following ready-to-use execution prompt to the user. The user (or a separate agent session running inside `repositories/{repo_name}/`) will paste it into that repo's agent to execute the child DWP.

**Hand-off prompt (copy verbatim into the user-facing message):**

~~~
# Hand-off — Execute child DWP inside repositories/{repo_name}/

Open a new agent session with its working directory set to `repositories/{repo_name}/`.
(For CLI tools: open a new shell/agent in that folder so the agent's context is the target repo.)

Paste this prompt into that agent:

Execute the plan at: .dwp/plans/PLAN_{feature}_{repo_short}/README.md

Important:
- Follow THIS repository's AGENTS.md conventions (validation, commit format, test patterns).
- {Predecessor context note — e.g., "Before Task 1, read: repositories/{predecessor_repo}/.dwp/plans/PLAN_{feature}_{predecessor_short}/analysis_results/EXECUTIVE_REPORT.md"}
- {Any audit-only / behavior notes from the child DWP README}
- Do NOT send Dailybot interim reports if the parent orchestrator will send a single milestone at its final task.

When the child DWP is complete:
1. All its tasks are `[x]` in its README.
2. `analysis_results/EXECUTIVE_REPORT.md` exists with the required sections.
3. Reply to the orchestrator session with:
   "DONE: PLAN_{feature}_{repo_short} executed. Executive report at <path>. Key outputs: <1–3 bullets>."
~~~

### Step 3: Pause and wait for user confirmation

**The orchestrator agent stops here.** Do not proceed until the user confirms the child DWP has been executed.

While waiting, the orchestrator agent:

- MUST NOT `cd` into `repositories/{repo_name}/` with any write or execution intent.
- MUST NOT run the child DWP's tasks inline.
- MUST NOT modify files inside the target repository.
- MAY answer questions about the hand-off prompt or the child DWP README.
- MAY re-emit the hand-off prompt if the user lost it.

### Step 4: Verify child DWP completion (after user confirms)

After the user replies "DONE: …" (or equivalent), verify from Core Hub:

```bash
test -f repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/analysis_results/EXECUTIVE_REPORT.md \
  && echo "PASS: Executive report present" || echo "FAIL: executive report missing"
```

If the executive report is missing, tell the user and do NOT mark this task complete.

### Step 5: Register outputs in the orchestrator manifest

Update `ORCHESTRATOR_MANIFEST.md`:

1. §5 Execution State — mark this child `[x] Executed`:
   ```
   | {N} | PLAN_{feature}_{repo_short} | [x] | [x] | Available | {short key-outputs list} |
   ```

2. §5 Completed Output References — add an entry:
   ```markdown
   #### Child #{N}: PLAN_{feature}_{repo_short} ({repo_name})
   - **Executive Report:** `repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/analysis_results/EXECUTIVE_REPORT.md`
   - **Key outputs:** (from the user's DONE reply + a quick read of the executive report's Section 1)
     - {bullet}
     - {bullet}
   - **Summary:** {One-line summary of what was produced}
   ```

3. Orchestrator README — Child DWP Plans table: mark this child `[x] Created / [x] Executed`.

### Step 6: Close this task in Core Hub

- Mark this task `[x]` in the orchestrator README.
- Update `PROGRESS.md` with a 1–2 sentence summary.
- Fill §9 Completion & Log below.
- Commit in Core Hub (tracking files only): `docs(technical): hand-off + register outputs for {repo_name} child DWP - Task {N} of PLAN_{parent_plan_name}`.

## 5. Acceptance Criteria

- [ ] Hand-off readiness verified (predecessors `[x] Executed`, executive reports on disk).
- [ ] Hand-off prompt emitted to the user.
- [ ] Orchestrator agent did NOT execute the child DWP inline (no `cd` with write intent, no runs, no edits in target repo).
- [ ] User confirmed child DWP execution and executive report is present on disk.
- [ ] Orchestrator manifest updated (Execution State + Output References).
- [ ] Orchestrator README Child DWP Plans table updated (`[x] Executed`).
- [ ] PROGRESS.md updated, task marked `[x]`, commit made in Core Hub.

## 6. Outputs

- **Emitted:** Ready-to-use execution prompt for the target repo's agent.
- **Verified (after user confirmation):** `repositories/{repo_name}/.../PLAN_{feature}_{repo_short}/analysis_results/EXECUTIVE_REPORT.md`.
- **Updated (in Core Hub):** Parent plan ORCHESTRATOR_MANIFEST.md + README.

## 7. Validation

```bash
# Run in Core Hub after the user replies DONE:
test -f repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/analysis_results/EXECUTIVE_REPORT.md && echo "PASS: Executive report generated" || echo "FAIL"

# Verify manifest updated
grep -q "PLAN_{feature}_{repo_short}" .dwp/plans/PLAN_{parent_plan_name}/ORCHESTRATOR_MANIFEST.md && echo "PASS: Manifest has child entry" || echo "FAIL"

# Verify orchestrator README marked Executed
grep -E "\[x\].*PLAN_{feature}_{repo_short}|PLAN_{feature}_{repo_short}.*\[x\] Executed" .dwp/plans/PLAN_{parent_plan_name}/README.md >/dev/null && echo "PASS: README marks Executed" || echo "CHECK MANUALLY"
```

## 8. Execution Checklist

- [ ] 1. Read this task file fully.
- [ ] 2. Read orchestrator manifest — verify predecessors are `[x] Executed`.
- [ ] 3. Confirm predecessor executive reports exist on disk.
- [ ] 4. Emit the hand-off prompt to the user (Step 2).
- [ ] 5. **Pause.** Do not navigate into the target repo. Do not run the child DWP. Do not edit target-repo files.
- [ ] 6. Wait for the user's DONE confirmation.
- [ ] 7. Verify executive report exists on disk.
- [ ] 8. Update ORCHESTRATOR_MANIFEST.md (Execution State + Output References).
- [ ] 9. Update orchestrator README Child DWP Plans table.
- [ ] 10. Update PROGRESS.md with summary.
- [ ] 11. Mark this task `[x]` in the plan README.
- [ ] 12. Commit in Core Hub: `git commit -m "docs(technical): hand-off + register outputs for {repo_name} - Task {N} of PLAN_{parent_plan_name}"`.
- [ ] 13. Update the Log section below.

## 9. Completion & Log (filled by the agent)

- **Status:** (hand-off emitted / blocked waiting / confirmed complete / failed)
- **Timestamp of hand-off:**
- **Timestamp of user confirmation:**
- **Predecessor readiness:** (all `[x]` / blocked on Child #M)
- **User-reported DONE summary:** {one-line summary user provided}
- **Executive report verified on disk:** (yes/no + path)
- **Key outputs registered in manifest:** {list}
- **Did the orchestrator agent execute any child DWP task inline?:** **Must be NO.** (If yes — violation; document and raise to the user.)
- **Notes / follow-ups:**
