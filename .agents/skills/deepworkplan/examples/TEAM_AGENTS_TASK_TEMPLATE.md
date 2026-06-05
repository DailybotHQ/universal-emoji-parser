# Team Agents Task Template

> **Usage:** Use this template when creating task files for DWP plans that include team agents parallel execution.
> This extends the standard task template with an optional "Team Agents Metadata" section.
>
> Non-Claude agents ignore the Team Agents Metadata section — it doesn't affect sequential execution.

---

## Standard Task Template (Required — All Agents)

````markdown
# Task {N}: {Task Title}

## 1. Context

[Standard context: what part of codebase, relevant files, conventions]

## 2. Read Before Starting (optional)

- Task {X} Completion & Log: {what to extract}

## 3. Goal

[Concise description of what this task must achieve]

## 4. Instructions

> **Before starting:** Re-read the plan README section 1 (Goal) to ensure this task's work aligns with the overall objective.

[Detailed, actionable instructions for this single task]

## 5. Acceptance Criteria

[Explicit conditions for task completion]

## 6. Outputs (optional)

- `analysis_results/{FILE_NAME}.md` — {description}

## 7. Validation

```bash
[Validation commands that must pass]
```

## 8. Rollback (optional)

[Instructions if task fails]

## 9. Execution Checklist

- [ ] 1. Read this task file fully
- [ ] 2. [Task-specific steps]
- [ ] N. Update plan README `[x]`
- [ ] N+1. Update PROGRESS.md
- [ ] N+2. Commit changes
- [ ] N+3. Update Log below

## 10. Completion & Log

**Status:** Not started
````

---

## Team Agents Metadata Section (Optional — Claude Code Only)

Add this section **AFTER** all standard sections. It is **completely optional** — only include it when the plan uses team agents for parallel execution.

````markdown
## Team Agents Metadata (Claude Code Only)

- **Parallel Group:** {group_letter}
  <!-- Which parallel group this task belongs to (e.g., A, B, C) -->

- **Teammate Role:** {role_name}
  <!-- The specialized role assigned to this task's teammate -->

- **Can Run With:** Tasks {X}, {Y}
  <!-- Other tasks in the same parallel group (no file conflicts) -->

- **Blocks:** Task {Z}
  <!-- Tasks that cannot start until this task completes -->

- **Files Owned:** {directories_or_files}
  <!-- Files this task will create or modify — no other parallel task should touch these -->

- **Spawn Prompt:** "{detailed_prompt}"
  <!-- The prompt given to the teammate when spawned for this task.
       Should include: role context, focus area, key file paths, expected output format -->
````

### Field Descriptions

| Field | Required? | Description |
|-------|-----------|-------------|
| Parallel Group | Yes (if using team agents) | Letter identifier for the parallel group (A, B, C...) |
| Teammate Role | Yes (if using team agents) | Human-readable role name for the teammate |
| Can Run With | Recommended | List of task numbers that can execute simultaneously |
| Blocks | Recommended | List of task numbers that depend on this task's completion |
| Files Owned | Recommended | Explicit file ownership to prevent conflicts |
| Spawn Prompt | Optional | Detailed prompt for the teammate; if omitted, the task file content is used |

### Important Rules

1. **NEVER put required information in this section** — all execution details must be in standard sections
2. **This section is purely optimization metadata** — removing it changes nothing about task execution
3. **File ownership must not overlap** between tasks in the same parallel group
4. **Spawn prompts should reference** the plan's AGENTS.md and relevant documentation
5. **Sequential tasks** (not in any parallel group) should NOT have this section

### Examples

**Research task (parallel):**
```markdown
## Team Agents Metadata (Claude Code Only)

- **Parallel Group:** A
- **Teammate Role:** Market Researcher
- **Can Run With:** Tasks 3, 4
- **Blocks:** Task 5 (synthesis)
- **Files Owned:** analysis_results/market_research.md
- **Spawn Prompt:** "Research the competitive landscape for feature X. Focus on how competitors Y and Z implement this. Document findings in analysis_results/market_research.md with comparison tables."
```

**Code implementation task (parallel):**
```markdown
## Team Agents Metadata (Claude Code Only)

- **Parallel Group:** B
- **Teammate Role:** API Developer
- **Can Run With:** Tasks 7, 8
- **Blocks:** Task 9 (integration tests)
- **Files Owned:** src/api/notifications/, tests/api/notifications/
- **Spawn Prompt:** "Implement notification API endpoints at src/api/notifications/. Follow patterns in src/api/users/ as reference. Run validation with npm run test before marking complete."
```

**Sequential task (no metadata needed):**
```
[No Team Agents Metadata section — this task runs sequentially]
```
