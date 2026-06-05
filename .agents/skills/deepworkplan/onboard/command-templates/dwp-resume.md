---
description: Resume an interrupted deep work plan from the first open task (provided by the installed `deepworkplan` skill)
---

# /dwp-resume — provided by the `deepworkplan` skill

> Thin alias. The flow lives in the installed `deepworkplan` skill — this file
> only routes to it, so there is a single source of truth and no drift.

## What to do

Route this invocation to the **resume** sub-skill of the installed `deepworkplan`
skill and follow it: read `<skill-path>/deepworkplan/resume/SKILL.md` and execute
its flow. Plan and draft outputs land in this repo's gitignored `.dwp/`
(`.dwp/plans/`, `.dwp/drafts/`) — never the legacy
`.agent_commands/agent_deep_work_plans/results/` path.

> Other agents: invoke the skill's `deepworkplan-resume` sub-skill directly
> (`/deepworkplan-resume` in Claude Code, `#deepworkplan-resume` elsewhere). This
> `dwp-resume` file is the shorter, conventional alias.
