---
description: Create a deep work plan (single-step refined draft → final plan) (provided by the installed `deepworkplan` skill)
---

# /dwp-create — provided by the `deepworkplan` skill

> Thin alias. The flow lives in the installed `deepworkplan` skill — this file
> only routes to it, so there is a single source of truth and no drift.

## What to do

Route this invocation to the **create** sub-skill of the installed `deepworkplan`
skill and follow it: read `.agents/skills/deepworkplan/create/SKILL.md` and execute
its flow. Plan and draft outputs land in this repo's gitignored `.dwp/`
(`.dwp/plans/`, `.dwp/drafts/`) — never the legacy
`.agent_commands/agent_deep_work_plans/results/` path.

> Other agents: invoke the skill's `deepworkplan-create` sub-skill directly
> (`/deepworkplan-create` in Claude Code, `#deepworkplan-create` elsewhere). This
> `dwp-create` file is the shorter, conventional alias.
