---
description: Author or update a reusable skill in this repo (provided by the installed `deepworkplan` skill)
---

# /skill-create — provided by the `deepworkplan` skill

> Thin alias. The flow lives in the installed `deepworkplan` skill — this file
> only routes to it, so there is a single source of truth and no drift.

## What to do

Route this invocation to the **author** sub-skill of the installed `deepworkplan`
skill and follow its **Create a skill** flow: read
`<skill-path>/deepworkplan/author/SKILL.md` and execute it, passing along any
arguments as the skill name/intent. Keep any new command thin and keep this
repo's `.agents/docs/` catalog in sync.

> Other agents: invoke the skill's `deepworkplan-author` sub-skill directly
> (`/deepworkplan-author` in Claude Code, `#deepworkplan-author` elsewhere). This
> `skill-create` file is the shorter, conventional alias.
