# dwp-paths.md — The `.dwp/` Output Convention

> Source of truth for **where Deep Work Plan outputs live**. Every DeepWorkPlan
> sub-skill reads this to resolve plan and draft paths.

## The convention

All plans and drafts live under a single gitignored repo-root directory, `.dwp/`:

```
.dwp/
├── plans/      ← PLAN_{name}/ directories (the executed plans)
└── drafts/     ← {name}_draft_refined.md (the create-flow refined draft)
```

- A plan lives at `.dwp/plans/PLAN_{name}/`.
- The `create` flow stages its single reviewable artifact — the **refined
  draft** — at `.dwp/drafts/{name}_draft_refined.md`.

## Default location & override

- **Default:** `<repo-root>/.dwp/`, where `<repo-root>` is the git toplevel (or
  the current directory outside a git work tree). `shared/context.sh` resolves
  this and emits it as the `dwp_dir` field.
- **Override:** set the `DWP_DIR` environment variable to an absolute path to
  relocate the output directory (e.g. for monorepos that keep outputs elsewhere,
  or CI sandboxes). `context.sh` honors `DWP_DIR` when present.

## `.dwp/` is gitignored

`.dwp/` **MUST** be added to the repository's `.gitignore`. Plans and drafts are
working artifacts, not tracked source. (Orchestrator hubs follow the same rule:
child plans live at `repositories/{repo}/.dwp/plans/PLAN_{child}/`, also
gitignored.)

## Contrast with the legacy path

`.dwp/` **replaces** the legacy DWP output tree:

| Concept | Legacy path | New path |
|---------|-------------|----------|
| Plans | `.agent_commands/agent_deep_work_plans/results/plans/PLAN_{name}/` | `.dwp/plans/PLAN_{name}/` |
| Refined draft | `.agent_commands/agent_deep_work_plans/results/drafts/{name}_draft_refined.md` | `.dwp/drafts/{name}_draft_refined.md` |

The legacy `.agent_commands/agent_deep_work_plans/results/` tree **MUST NOT** be
used by repos onboarded to DeepWorkPlan v2; migration moves any existing plans
into `.dwp/`.
