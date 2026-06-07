# AI Agent Collaboration

When multiple AI assistants share this codebase — sometimes in parallel, often across separate sessions — they need a contract so they don't step on each other's work.

## Source of truth

| Topic                            | File                                        |
| -------------------------------- | ------------------------------------------- |
| Mandatory rules                  | [`AGENTS.md`](../AGENTS.md)                 |
| Coding conventions               | [`docs/STANDARDS.md`](STANDARDS.md)         |
| Public API contract              | [`docs/API_REFERENCE.md`](API_REFERENCE.md) |
| Skills                           | [`.agents/skills/`](../.agents/skills/)     |
| Slash commands                   | [`.agents/commands/`](../.agents/commands/) |
| Subagents (specialized personas) | [`.agents/agents/`](../.agents/agents/)     |
| Per-skill catalog                | [`.agents/README.md`](../.agents/README.md) |

Every agent reads `AGENTS.md` first. When `AGENTS.md` changes, **all** agents inherit the new rule on their next session — no per-tool config needed.

## Subagent roster

The repo defines specialized subagents (see [`.agents/agents/`](../.agents/agents/)). Use them when their domain matches:

| Subagent             | Owns                                                            | Don't use for                      |
| -------------------- | --------------------------------------------------------------- | ---------------------------------- |
| `parser-architect`   | Public API shape, source-file placement, dual-export discipline | Routine bug fixes                  |
| `emoji-data-curator` | The catalog, `EMOJIS_SPECIAL_CASES`, regeneration pipeline      | Code that doesn't touch emoji data |
| `test-author`        | Vitest specs, regression tests, regenerator handling            | Production code                    |
| `dependency-auditor` | `package.json` changes, `.ncurc.json`, license/CVE checks       | Application logic                  |
| `release-engineer`   | Vite config, GitHub Actions, npm publish, GitHub releases       | Day-to-day feature work            |
| `doc-writer`         | Keeping `AGENTS.md`, `docs/`, and `README.md` synchronized      | Code changes                       |

## Skill / command invocation

Skills are reusable procedures. Same name, different prefix per host:

| Host                    | Prefix | Example                    |
| ----------------------- | ------ | -------------------------- |
| Claude Code             | `/`    | `/regenerate-emoji-lib`    |
| Cursor / Codex / Gemini | `#`    | `#regenerate-emoji-lib`    |
| Plain text fallback     | none   | "run regenerate-emoji-lib" |

When a command is invoked, the agent **must**:

1. Look up the command in [`.agents/README.md`](../.agents/README.md)
2. Read the linked procedure file (`.agents/commands/<name>.md` or `.agents/skills/<name>.md`) end to end
3. Follow the steps exactly — the file IS the spec
4. If the procedure requires another subagent (e.g., `release-engineer`), delegate explicitly

## Handoffs

Agents run sequentially in a single session. When a task spans multiple roles:

1. Document what's done (commit message, PR description, scratch notes in `tmp/`)
2. Identify the next role explicitly: "Next: `test-author` to add regression tests"
3. The next agent reads the prior commit / notes, picks up from there

For Claude Code, this is the **subagent** pattern. For other hosts that don't support subagents, leave the handoff in the chat or in `tmp/handoffs/`.

## Parallel agents

Avoid concurrent edits to the same file. If parallelism is needed:

- Split work by file (`src/index.ts` vs `test/main.test.ts` are naturally orthogonal)
- Coordinate through `git` branches, not by hoping the merge resolves cleanly
- Each agent should run the full pre-commit checklist on its branch before merging

## Common conflicts

| Conflict                                                         | Resolution                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Two agents bump the same dependency to different versions        | Pick the higher version; rerun lint + test + build                                                   |
| Two agents add unrelated entries to `EMOJIS_SPECIAL_CASES`       | Both keep their work; the second to merge regenerates and updates `TOTAL_EMOJIS` if needed           |
| One agent edits `AGENTS.md`, another edits a doc that mirrors it | The `AGENTS.md` rule wins; update the doc to match                                                   |
| Two agents disagree on whether a change is a major bump          | Default to "yes, major" — `parser-architect` decides if in doubt. HTML output changes always major   |
| Two agents both add a public method                              | Architect reviews; consolidate into a single method if possible (the API surface should stay narrow) |

## When in doubt

- **Defer to `AGENTS.md`** for non-negotiable rules
- **Defer to `STANDARDS.md`** for stylistic decisions
- **Defer to `API_REFERENCE.md`** for the public API shape
- **Ask the user** if none of the above covers the case — don't silently invent a new rule
- **Propose updating the docs** if you discover a gap. Add the new rule to the right doc in the same PR

## Memory

If your host supports memory (Claude Code does, Cursor does, others vary):

- **Save** project-wide conventions only after the user has confirmed them
- **Don't save** ephemeral state like "currently working on feature X" — use `tmp/` instead
- **Verify before recommending** anything from memory; the code is the source of truth, memory may be stale
- Project-wide conventions belong in `AGENTS.md`, not in your own session memory — that way every agent inherits them

## Trust but verify

When taking work from another agent:

- Read the diff, don't trust the summary
- Re-run the full pre-commit checklist on your machine (`pnpm run biome:check && pnpm test && pnpm run build`)
- If tests fail, the work isn't done — even if the previous agent claimed otherwise

## Updating these rules

This file documents the **process** of agent collaboration. Update it when:

- A new subagent role is added to `.agents/agents/`
- The skill invocation flow changes
- A new conflict pattern surfaces in real work and we want a written resolution

Mirror any update that affects rule precedence into `AGENTS.md`'s "Shared Agent Coordination" section.
