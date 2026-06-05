---
description: Execute an existing deep work plan task-by-task (provided by the installed `deepworkplan` skill)
---

# /dwp-execute — provided by the `deepworkplan` skill

> Thin alias. The flow lives in the installed `deepworkplan` skill — this file
> only routes to it, so there is a single source of truth and no drift.

## What to do

Route this invocation to the **execute** sub-skill of the installed `deepworkplan`
skill and follow it: read `.agents/skills/deepworkplan/execute/SKILL.md` and execute
its flow. Plan and draft outputs land in this repo's gitignored `.dwp/`
(`.dwp/plans/`, `.dwp/drafts/`) — never the legacy
`.agent_commands/agent_deep_work_plans/results/` path.

> Other agents: invoke the skill's `deepworkplan-execute` sub-skill directly
> (`/deepworkplan-execute` in Claude Code, `#deepworkplan-execute` elsewhere). This
> `dwp-execute` file is the shorter, conventional alias.
