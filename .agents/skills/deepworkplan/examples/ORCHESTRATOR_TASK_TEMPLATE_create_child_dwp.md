# Task {N}: Create Child DWP — {Repository Name}

> **Template for orchestrator plans.** Replace all `{placeholders}` when generating a real task file.

## 1. Context

**Plan Type:** Orchestrator — Child DWP Creation
**Target Repository:** `repositories/{repo_name}/`
**Child Plan Name:** `PLAN_{feature}_{repo_short}`

This task creates a complete DWP plan inside `repositories/{repo_name}/` that implements the {repo_name}-specific portion of the overall feature. The child DWP will follow {repo_name}'s own AGENTS.md, validation commands, and conventions.

### Orchestrator Context

- **Parent Plan:** PLAN_{parent_plan_name} (this plan, in Core Hub)
- **Feature:** {overall feature description}
- **This repo's role:** {what this repo contributes — e.g., "CRUD API endpoints for user preferences"}
- **Depends on:** {list child plans that must complete first, or "None — this is the first child DWP"}
- **Depended on by:** {list child plans that depend on this one's outputs, or "None"}
- **Manifest:** `.dwp/plans/PLAN_{parent_plan_name}/ORCHESTRATOR_MANIFEST.md` {or "Not used"}

### Input Dependencies (from predecessors)

{If this child has predecessors, list what outputs it expects from them:}
- From PLAN_{feature}_{predecessor_short}: {what outputs are expected — e.g., "Executive Report with API endpoint definitions, data model schemas"}
- {Or "None — this is the first child DWP in the dependency chain"}

### Output Declarations (for successors)

{What this child DWP is expected to produce for downstream consumers:}
- Executive Report: {summary of what it will contain — e.g., "API endpoint paths, request/response schemas, data model definitions"}
- Key outputs: {specific outputs — e.g., "API endpoint URLs, error response formats, pagination patterns"}
- {Or "None — no downstream child DWPs depend on this one's outputs"}

### Expected Child DWP Scope

The child DWP should cover approximately {N} tasks, including:
- {high-level task 1 — e.g., "Add data model and migration"}
- {high-level task 2 — e.g., "Create serializer/validation"}
- {high-level task 3 — e.g., "Add API views/endpoints"}
- {high-level task 4 — e.g., "Write comprehensive tests"}
- {high-level task 5 — e.g., "Update documentation"}
- Plus mandatory final tasks (Skills & Agents Discovery + Executive Report)

## 2. Read Before Starting

**CRITICAL — Read target repo documentation first:**

1. `repositories/{repo_name}/AGENTS.md` — Rules, validation commands, tech stack, conventions
2. `repositories/{repo_name}/guide/GUIDE.md` — DWP guide (if exists)

**If DWP system doesn't exist in target repo:**
- Bootstrap it following Core Hub's guide as template
- Create: `.dwp/` folder structure with adapted GUIDE
- Adapt validation commands and conventions to the target repo's tech stack

**From parent plan (if applicable):**
- {Previous task} Completion & Log: {what to extract, e.g., "API contract decisions from design task"}
- {Previous task} Outputs: {e.g., "analysis_results/API_CONTRACT.md"}

## 3. Goal

Create a complete, executable DWP plan inside `repositories/{repo_name}/` that:
- Implements {repo-specific goal — e.g., "user preferences CRUD API with model, serializer, views, and tests"}
- Follows {repo_name}'s AGENTS.md rules and conventions
- Uses {repo_name}'s validation commands (e.g., `{validation_command}`)
- Contains approximately {N} atomic tasks plus mandatory final tasks
- Can be executed independently by an agent working in that repository
- References the parent orchestrator plan for context

## 4. Instructions

> **Before starting:** Re-read the plan README section 1 (Goal) to ensure this task's work aligns with the overall objective.

### Step 1: Read the Orchestrator Context Manifest and navigate to target repository

**Read the Orchestrator Context Manifest first (if it exists):**
- Read `ORCHESTRATOR_MANIFEST.md` from the parent plan folder
- Extract: shared context (design decisions, API contracts, global constraints)
- Note the dependency graph and this repo's position in it
- Note what predecessor outputs this child DWP will need (Input Dependencies)
- Note what outputs this child DWP must produce (Output Declarations)

**Navigate to target repository:**
```bash
cd repositories/{repo_name}
```

Read the following files completely:
- **`AGENTS.md`** — Extract and note:
  - Validation commands (e.g., `codecheck -f`, `npm run test && npm run eslint:check`)
  - Test file naming convention (e.g., `*.spec.ts`, `*_test.py`)
  - Linting command (e.g., `npm run eslint:check`, `codecheck -f`)
  - Test command (e.g., `npm run test`, `pytest`)
  - Package manager (npm, Poetry, etc.)
  - Docker requirements (e.g., API Services must run inside Docker)
  - Commit format and scope conventions
  - Import order rules, code style rules

- **`guide/GUIDE.md`** (if exists) — Note any repo-specific DWP conventions

- **Architecture documentation** — Any relevant patterns or conventions docs

### Step 2: Design the child DWP tasks

Based on this repo's role in the feature, break down the work into atomic tasks:
- Each task should have one clear objective
- Tasks should be ordered by dependency
- Each task should be independently completable
- Include validation using the target repo's commands

**{repo_type}-specific task patterns:**

{Include the appropriate pattern based on repo type:}

**For API repos (Django/Python):**
1. Model/migration
2. Serializer
3. View/endpoint
4. URL routing
5. Tests
6. Documentation

**For Web repos (Vue/TypeScript):**
1. API client/service layer
2. Pinia store / state management
3. Component(s)
4. View/route
5. Tests
6. Documentation

**For Chatbot repos (Node.js/TypeScript):**
1. Handler
2. Parser / intent recognition
3. Response builder
4. Tests
5. Documentation

**For Gateway repos (Express/TypeScript):**
1. Command registration
2. Handler implementation
3. Response formatting
4. Tests
5. Documentation

### Step 3: Create the child DWP plan

Create the plan at:
```
repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/
```

Create all required files:

**README.md:**
```markdown
# Plan: {Feature Title} — {Repo Name}

> This is a child DWP created by orchestrator plan `PLAN_{parent_plan_name}` in the Core Hub.

## 1. Goal
{Repo-specific goal}

## 2. Context
{Tech stack and context from the repo's AGENTS.md}

## 3. Global Guidelines
{Guidelines from the repo's AGENTS.md — validation, linting, commit format}

## 4. Task List & Links
- [ ] Task 1: {title}
      See: [1.task_{name}.md](./1.task_{name}.md)
...
- [ ] Task N-1: Skills & Agents Discovery
      See: [{N-1}.task_skills_agents_discovery.md](./{N-1}.task_skills_agents_discovery.md)
- [ ] Task N: Executive Report
      See: [{N}.task_executive_report.md](./{N}.task_executive_report.md)

## 5. Execution Rules for the Agent
{Standard execution rules}

## 6. Orchestrator Context

> This child DWP is part of orchestrator plan `PLAN_{parent_plan_name}` in the Core Hub.

### Parent Plan Reference
- **Parent Plan:** PLAN_{parent_plan_name}
- **Parent Location:** /workspace/.dwp/plans/PLAN_{parent_plan_name}/
- **Manifest:** /workspace/.dwp/plans/PLAN_{parent_plan_name}/ORCHESTRATOR_MANIFEST.md
- **This repo's role:** {what this repo contributes}
- **Dependencies:** {which child plans must complete first}

### Shared Context (from parent plan)
<!-- Snapshot of key shared context at child DWP creation time -->

**Key decisions:**
- {Decision 1 from parent plan — e.g., "Use JSON field for preferences storage"}
- {Decision 2 from parent plan — e.g., "REST API endpoints at /api/v1/preferences/"}

**API contract summary (if applicable):**
- {Endpoint/method/path summaries relevant to this repo}

**Global constraints:**
- {Constraint 1 — e.g., "All field names in snake_case"}
- {Constraint 2 — e.g., "Error responses follow standard format"}

### Input Dependencies

{If this child DWP has predecessors, execution is BLOCKED until inputs are available:}

> ⚠️ **EXECUTION BLOCKED** until all inputs are available.

| Predecessor | Status | Executive Report Path |
|-------------|--------|----------------------|
| PLAN_{feature}_{predecessor_short} | [ ] Ready | `repositories/{predecessor_repo}/.agent_commands/.../PLAN_{feature}_{predecessor_short}/analysis_results/EXECUTIVE_REPORT.md` |

**Before starting execution:**
1. Verify each predecessor's Executive Report exists at the path above
2. Read the Executive Report(s) — extract API endpoints, data models, key decisions
3. If any predecessor report is missing, STOP and report: "Cannot start — waiting for {predecessor} to complete"
4. Use predecessor context throughout execution, especially for integration-related tasks

{Or if no predecessors: "None — this child DWP has no predecessors and can execute immediately."}

### Expected Outputs

{What this child DWP must produce for downstream consumers:}
- **Executive Report:** `analysis_results/EXECUTIVE_REPORT.md` — {what it should contain for downstream use}
- **Key outputs for successors:** {e.g., "API endpoint definitions, data model schemas, error handling patterns"}
- {Or "No downstream consumers — this is the last child DWP in the chain."}

## 7. Plan Status / Notes
- Created: {date}
- Status: Not started — 0/{N} tasks completed

## 8. Quick Reference
See [PROMPTS.md](./PROMPTS.md) for ready-to-use prompts.
```

**Task files (`N.task_{title}.md`):**
- Use the target repo's validation commands (NOT the Core Hub's)
- Use the target repo's test naming patterns
- Use the target repo's commit format and scope
- Include re-anchoring instruction in each task
- Include Execution Checklist with Dailybot reporting step

**PROMPTS.md** — Using the target repo's template if available, or Core Hub's
**PROGRESS.md** — Initial template
**analysis_results/** — Empty folder (with .gitkeep)
**Mandatory final tasks** — Skills & Agents Discovery + Executive Report

### Step 4: Return to Core Hub and update orchestrator tracking

```bash
cd /workspace  # Return to Core Hub root
```

Update the orchestrator plan's README.md:
- Mark this child DWP's row: `[x] Created / [ ] Executed`
- Add the child plan's full path in notes if helpful

## 5. Acceptance Criteria

- [ ] Target repo's AGENTS.md was read and its rules extracted
- [ ] Child DWP plan folder created at `repositories/{repo_name}/.agent_commands/.../PLAN_{feature}_{repo_short}/`
- [ ] README.md references parent orchestrator plan
- [ ] README.md uses target repo's conventions (validation, test patterns, etc.)
- [ ] All task files use target repo's validation commands
- [ ] Task files reference target repo's test naming convention
- [ ] Task files use target repo's commit format and scope
- [ ] PROMPTS.md, PROGRESS.md, analysis_results/ all created
- [ ] Mandatory final tasks included (Skills & Agents Discovery + Executive Report)
- [ ] Orchestrator plan's Child DWP Plans table updated (`[x] Created`)
- [ ] Child DWP README includes "Orchestrator Context" section with shared context snapshot
- [ ] Child DWP README includes "Input Dependencies" section (with blocking notice if applicable)
- [ ] Child DWP README includes "Expected Outputs" section
- [ ] Manifest referenced in child DWP README (if manifest exists)

## 6. Outputs

- **Created:** `repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/`
- **Updated:** Parent plan README (Child DWP Plans table)

## 7. Validation

```bash
# Verify child plan structure
test -f repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/README.md && echo "PASS: README exists" || echo "FAIL"
test -f repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/PROMPTS.md && echo "PASS: PROMPTS exists" || echo "FAIL"
test -f repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/PROGRESS.md && echo "PASS: PROGRESS exists" || echo "FAIL"
test -d repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/analysis_results && echo "PASS: analysis_results exists" || echo "FAIL"

# Verify child plan uses target repo's conventions
grep -q "{validation_command}" repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/README.md && echo "PASS: Uses repo validation" || echo "FAIL"

# Verify parent plan updated
grep -q "PLAN_{feature}_{repo_short}" .dwp/plans/PLAN_{parent_plan_name}/README.md && echo "PASS: Parent updated" || echo "FAIL"

# Verify parent reference in child
grep -q "PLAN_{parent_plan_name}" repositories/{repo_name}/.dwp/plans/PLAN_{feature}_{repo_short}/README.md && echo "PASS: Parent referenced" || echo "FAIL"
```

## 8. Execution Checklist

- [ ] 1. Read this task file fully.
- [ ] 2. Navigate to target repository.
- [ ] 3. Read target repo's AGENTS.md — extract conventions.
- [ ] 4. Read target repo's DWP guide (if exists).
- [ ] 5. Design child DWP task breakdown.
- [ ] 6. Create child DWP plan with all required files.
- [ ] 7. Verify child DWP uses repo-specific conventions.
- [ ] 8. Return to Core Hub (`cd /workspace`).
- [ ] 9. Update orchestrator README (Child DWP Plans table).
- [ ] 10. Run validation commands.
- [ ] 11. Update the plan README to mark this task as `[x]`.
- [ ] 12. Update PROGRESS.md with task summary.
- [ ] 13. Commit: `git commit -m "docs(technical): create child DWP for {repo_name} - Task {N} of PLAN_{parent_plan_name}"`
- [ ] 14. Send Dailybot progress report (non-blocking).
- [ ] 15. Update the Log section below.

## 9. Completion & Log (filled by the agent)

- **Status:** (completed / blocked / failed validation)
- **Timestamp:**
- **Summary of work:**
- **Child DWP location:**
- **Child DWP task count:**
- **Repo conventions extracted:** (validation, test pattern, commit format)
- **Shared context injected:** (yes/no — list key items injected)
- **Input dependencies declared:** (list or "None")
- **Output declarations set:** (list or "None")
- **Validation results:**
- **Notes / follow-ups:**
