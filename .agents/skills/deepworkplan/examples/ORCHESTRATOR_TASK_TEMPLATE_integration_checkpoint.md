# Task {N}: Integration Checkpoint — {Description}

> **Template for orchestrator plans.** Replace all `{placeholders}` when generating a real task file.

## 1. Context

**Plan Type:** Orchestrator — Integration Checkpoint
**Preceding Child DWPs:** {list child DWPs created before this checkpoint}
**Purpose:** Verify that child DWP plans are compatible and integration points are aligned before proceeding.

This task does NOT execute any child DWP plans. It reviews the created child plans to ensure:
- API contracts are consistent across repos
- Data models use compatible field names and types
- Error handling patterns are aligned
- Naming conventions don't conflict

### Orchestrator Context

- **Parent Plan:** PLAN_{parent_plan_name}
- **Checkpoint position:** After {child DWP creation tasks}, before {next phase}
- **Manifest:** `.dwp/plans/PLAN_{parent_plan_name}/ORCHESTRATOR_MANIFEST.md` {or "Not used"}
- **Child DWPs to verify:**
  - `repositories/{repo1}/.agent_commands/.../PLAN_{feature}_{repo1_short}/`
  - `repositories/{repo2}/.agent_commands/.../PLAN_{feature}_{repo2_short}/`

### Output Contract Verification

This checkpoint also verifies that output contracts are properly defined:
- Each child DWP's "Expected Outputs" section is complete
- Downstream child DWPs' "Input Dependencies" match what predecessors declare as outputs
- The manifest's "Output Contracts" section is consistent with child DWP declarations (if manifest exists)

## 2. Read Before Starting

- All preceding child DWP creation task Completion & Logs
- The created child DWP plan READMEs and key task files
- Any design documents or API contracts from direct tasks in this plan

## 3. Goal

Verify that the child DWP plans created in preceding tasks are compatible and will integrate correctly when executed. Flag any inconsistencies for correction before execution begins.

## 4. Instructions

> **Before starting:** Re-read the plan README section 1 (Goal) to ensure this task's work aligns with the overall objective.

### Step 1: Read all child DWP plans

For each child DWP, read:
- README.md — understand goal and task list
- Key task files — especially those involving:
  - API endpoints / URL definitions
  - Data models / schemas
  - API client / service layer definitions
  - Shared constants or configuration

### Step 2: Verify API Contract Alignment

Check that API-producing repos and API-consuming repos agree on:

| Aspect | Producer ({repo1}) | Consumer ({repo2}) | Match? |
|--------|--------------------|--------------------|--------|
| Base URL / path | {e.g., `/api/v1/preferences/`} | {e.g., `/api/v1/preferences/`} | [ ] Yes / [ ] No |
| HTTP methods | {e.g., GET, PUT, PATCH} | {e.g., GET, PUT, PATCH} | [ ] Yes / [ ] No |
| Request body fields | {field list} | {field list} | [ ] Yes / [ ] No |
| Response body fields | {field list} | {field list} | [ ] Yes / [ ] No |
| Authentication | {e.g., JWT Bearer} | {e.g., JWT Bearer} | [ ] Yes / [ ] No |
| Error format | {e.g., `{error: string}`} | {e.g., `{error: string}`} | [ ] Yes / [ ] No |

### Step 3: Verify Data Model Consistency

Check that field names, types, and required/optional status are consistent:

| Field | {repo1} Type | {repo2} Type | Consistent? |
|-------|-------------|-------------|-------------|
| {field1} | {type} | {type} | [ ] Yes / [ ] No |
| {field2} | {type} | {type} | [ ] Yes / [ ] No |

### Step 4: Verify Naming Conventions

Check that references between repos use consistent naming:
- [ ] API endpoint paths match between producer and consumer task files
- [ ] Event/message names are consistent (if applicable)
- [ ] Shared constants or enums use the same values

### Step 5: Check Error Handling Alignment

Verify that:
- [ ] Error response formats are handled correctly by consumers
- [ ] HTTP status codes are expected correctly
- [ ] Timeout handling is consistent
- [ ] Retry logic doesn't conflict

### Step 6: Verify Output Contracts

Check that output declarations match input dependencies across the dependency chain:

| Producer Child DWP | Declared Outputs | Consumer Child DWP | Required Inputs | Match? |
|-------------------|-----------------|-------------------|----------------|--------|
| PLAN_{feature}_{repo1_short} | {outputs listed in "Expected Outputs"} | PLAN_{feature}_{repo2_short} | {inputs listed in "Input Dependencies"} | [ ] Yes / [ ] No |

For each mismatch:
- Identify what's missing or inconsistent
- Determine which child DWP needs to be updated
- Flag as blocking (if outputs are undefined) or advisory (if outputs exist but descriptions differ)

### Step 7: Verify Manifest Consistency (if manifest exists)

If `ORCHESTRATOR_MANIFEST.md` exists, verify:
- [ ] All child DWPs listed in manifest match the actual created child DWPs
- [ ] Dependency graph in manifest matches dependencies declared in child DWP READMEs
- [ ] Output contracts in manifest are consistent with child DWP declarations
- [ ] Shared context in manifest is reflected in child DWP "Orchestrator Context" sections

If any inconsistency found:
- Update the manifest to match the actual child DWP content (child DWPs are the source of truth)
- Log the fix in the checkpoint report

### Step 8: Assess Execution Readiness

For each execution phase/group, verify:
- [ ] All child DWPs in the current phase have defined validation commands
- [ ] Predecessor dependencies are clearly documented
- [ ] Output expectations are set for downstream consumers
- [ ] No circular dependencies exist

**Execution readiness summary:**

| Phase | Child DWPs | Dependencies Met | Ready? |
|-------|-----------|-----------------|--------|
| Phase 1 (no deps) | {repo1} | N/A | [ ] Yes / [ ] No |
| Phase 2 (depends on Phase 1) | {repo2} | Phase 1 outputs defined | [ ] Yes / [ ] No |

### Step 9: Document Findings

Create a checkpoint report with:
- All verified integration points (API, data model, naming, error handling)
- Output contract verification results
- Manifest consistency results (if applicable)
- Execution readiness assessment
- Pass/fail for each check
- Any issues found with recommended fixes
- Overall compatibility assessment

### Step 10: Handle Issues

**If all checks pass:**
- Mark checkpoint as passed
- Continue to next task

**If issues are found:**
- Document each issue clearly
- For each issue, specify:
  - Which child DWP(s) need modification
  - What the fix should be
  - Whether it's blocking (must fix before execution) or advisory (can fix during execution)
- If blocking issues exist: update the affected child DWP task files to fix the inconsistency
- If only advisory issues: note them for the executing agent to address

## 5. Acceptance Criteria

- [ ] All child DWP plans reviewed
- [ ] API contract alignment verified
- [ ] Data model consistency verified
- [ ] Naming conventions verified
- [ ] Error handling alignment verified
- [ ] Checkpoint report documented in Completion & Log
- [ ] Any blocking issues resolved or flagged
- [ ] Output contracts verified between producer and consumer child DWPs
- [ ] Manifest consistency verified (if manifest exists)
- [ ] Execution readiness assessed for each phase
- [ ] Orchestrator README updated with checkpoint status

## 6. Validation

```bash
# Verify all child DWP plans exist
test -f repositories/{repo1}/.dwp/plans/PLAN_{feature}_{repo1_short}/README.md && echo "PASS: {repo1} child DWP exists" || echo "FAIL"
test -f repositories/{repo2}/.dwp/plans/PLAN_{feature}_{repo2_short}/README.md && echo "PASS: {repo2} child DWP exists" || echo "FAIL"

# No code validation needed — this is a review task
echo "Integration checkpoint is a manual verification task"
```

## 7. Execution Checklist

- [ ] 1. Read this task file fully.
- [ ] 2. Read all child DWP plans (README + key task files).
- [ ] 3. Verify API contract alignment.
- [ ] 4. Verify data model consistency.
- [ ] 5. Verify naming conventions.
- [ ] 6. Check error handling alignment.
- [ ] 7. Verify output contracts (producer outputs vs consumer inputs).
- [ ] 8. Verify manifest consistency (if manifest exists).
- [ ] 9. Assess execution readiness for each phase.
- [ ] 10. Document findings.
- [ ] 11. Handle any issues (fix blocking, note advisory).
- [ ] 12. Update the plan README to mark this task as `[x]`.
- [ ] 13. Update PROGRESS.md with checkpoint results.
- [ ] 14. Commit: `git commit -m "docs(technical): integration checkpoint passed - Task {N} of PLAN_{parent_plan_name}"`
- [ ] 15. Send Dailybot progress report (non-blocking).
- [ ] 16. Update the Log section below.

## 8. Completion & Log (filled by the agent)

- **Status:** (completed / blocked / failed validation)
- **Timestamp:**
- **Integration Points Verified:** {count}
- **All Checks Passed:** (yes / no — {count} issues found)
- **Blocking Issues:** {list or "None"}
- **Advisory Issues:** {list or "None"}
- **Output contract checks:** {count} pass / {count} fail
- **Manifest consistent:** (yes / no / N/A — no manifest)
- **Execution readiness:** (all phases ready / {phase} not ready)
- **Overall Assessment:** {Compatible / Needs fixes}
- **Notes / follow-ups:**
