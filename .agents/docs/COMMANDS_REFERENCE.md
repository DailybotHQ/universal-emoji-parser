# Commands Reference — Universal Emoji Parser

> One row per file in [`.agents/commands/`](../commands/). Invoke with `/name`
> (Claude Code) or `#name` / plain text (Codex, Cursor, Gemini, Copilot).

## Domain commands (parser/library work)

| Command                 | Purpose                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `/regenerate-emoji-lib` | Regenerate `src/lib/emoji-lib.json` from upstream `emojilib` + `unicode-emoji-json` |
| `/add-special-case`     | Add a keyword include/exclude override to `EMOJIS_SPECIAL_CASES`                    |
| `/write-tests`          | Author Vitest tests for a parsing bug or new feature                                |
| `/fix-build`            | Diagnose a failing TypeScript / Vite / Vitest build                                 |
| `/bump-deps`            | Update one or more npm dependencies safely (respects `.ncurc.json`)                 |
| `/release-npm`          | Walk through a manual release if CI is unavailable                                  |
| `/check-html-output`    | Verify the HTML output contract for a given input                                   |

## DeepWorkPlan commands (thin delegators → installed `deepworkplan` skill)

These route to the matching sub-skill of the installed `deepworkplan` skill —
the skill is the single source of truth, so these stay drift-free.

| Command        | Routes to              | Purpose                                                                |
| -------------- | ---------------------- | ---------------------------------------------------------------------- |
| `/dwp-create`  | `deepworkplan-create`  | Decompose a goal into numbered, sequential tasks with validation gates |
| `/dwp-execute` | `deepworkplan-execute` | Execute a plan task-by-task, validating each gate                      |
| `/dwp-status`  | `deepworkplan-status`  | Report plan progress without making changes                            |
| `/dwp-refine`  | `deepworkplan-refine`  | Add, remove, or reorder tasks while preserving completed work          |
| `/dwp-resume`  | `deepworkplan-resume`  | Reconstruct state and continue an interrupted plan                     |
| `/dwp-verify`  | `deepworkplan-verify`  | Objective pass/fail DeepWorkPlan conformance report                    |

## Kit-authoring commands (thin delegators → `deepworkplan` author sub-skill)

| Command         | Routes to             | Purpose                                           |
| --------------- | --------------------- | ------------------------------------------------- |
| `/skill-create` | `deepworkplan-author` | Author or update a reusable skill in this repo    |
| `/agent-create` | `deepworkplan-author` | Author or update a specialized agent in this repo |
