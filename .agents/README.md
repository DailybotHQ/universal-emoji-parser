# AI Agent Skills, Commands & Subagents — Universal Emoji Parser

This directory contains **skills** (deep-dive procedures), **slash commands** (short reusable invocations), and **subagents** (specialized personas) tuned for TypeScript library work in this repo.

> **For non-Claude hosts** (Cursor, Codex, Gemini, GitHub Copilot): the markdown files in [`commands/`](commands/) and [`skills/`](skills/) are plain procedures. Invoke them by name (`#regenerate-emoji-lib` or "run regenerate-emoji-lib") — the agent will read the matching file and follow it step-by-step.
>
> The folder is also reachable as `.claude/` — a symlink to this directory — so Claude Code's native conventions (`.claude/commands/`, `.claude/skills/`, `.claude/agents/`) work out of the box.

## Layout

```
.agents/             ← (.claude/ symlinks here)
├── README.md            # This file — full catalog
├── commands/            # One file per slash command (short, procedural)
│   ├── regenerate-emoji-lib.md
│   ├── add-special-case.md
│   ├── write-tests.md
│   ├── fix-build.md
│   ├── bump-deps.md
│   ├── release-npm.md
│   └── check-html-output.md
├── skills/              # Deep-dive procedures and conventions (richer than commands)
│   ├── emoji-parser-conventions.md
│   ├── emoji-data-pipeline.md
│   ├── npm-publish-walkthrough.md
│   └── typescript-strict-style.md
└── agents/              # Specialized subagent personas
    ├── parser-architect.md
    ├── emoji-data-curator.md
    ├── test-author.md
    ├── dependency-auditor.md
    ├── release-engineer.md
    └── doc-writer.md
```

## Slash commands

Reusable procedures invoked by slash command (or `#` in non-Claude hosts).

| Command | Purpose | File |
|---|---|---|
| `/regenerate-emoji-lib` | Regenerate `src/lib/emoji-lib.json` from `emojilib` + `unicode-emoji-json` | [commands/regenerate-emoji-lib.md](commands/regenerate-emoji-lib.md) |
| `/add-special-case` | Add a keyword include/exclude override to `EMOJIS_SPECIAL_CASES` | [commands/add-special-case.md](commands/add-special-case.md) |
| `/write-tests` | Author Mocha + Chai tests for a parsing bug or new feature | [commands/write-tests.md](commands/write-tests.md) |
| `/fix-build` | Diagnose a failing TypeScript / Webpack / Mocha build | [commands/fix-build.md](commands/fix-build.md) |
| `/bump-deps` | Update one or more npm dependencies safely (respects `.ncurc.json`) | [commands/bump-deps.md](commands/bump-deps.md) |
| `/release-npm` | Walk through a manual release if CI is unavailable | [commands/release-npm.md](commands/release-npm.md) |
| `/check-html-output` | Verify the HTML output contract for a given input | [commands/check-html-output.md](commands/check-html-output.md) |

### How to invoke

| Host | Prefix | Example |
|---|---|---|
| Claude Code | `/` (native) | `/regenerate-emoji-lib` |
| OpenAI Codex | `#` | `#regenerate-emoji-lib` |
| Cursor AI | `#` | `#regenerate-emoji-lib` |
| Gemini / others | `#` | `#regenerate-emoji-lib` |

When invoked, the agent **must**:

1. Look up the command name in this README
2. Read the linked command file end-to-end
3. Follow the steps exactly — the file IS the spec
4. If the procedure asks for confirmation or input, pause and ask; don't improvise

## Skills

Richer, longer procedures that explain conventions and pipelines. Use these when the user asks "how does the catalog work?" or "how do I publish?" rather than "run X".

| Skill | Purpose | File |
|---|---|---|
| `emoji-parser-conventions` | Deep dive on the parse pipeline, regex caching, dual-export shape | [skills/emoji-parser-conventions.md](skills/emoji-parser-conventions.md) |
| `emoji-data-pipeline` | Step-by-step regeneration of the catalog from upstream | [skills/emoji-data-pipeline.md](skills/emoji-data-pipeline.md) |
| `npm-publish-walkthrough` | Full release flow including GitHub Actions internals | [skills/npm-publish-walkthrough.md](skills/npm-publish-walkthrough.md) |
| `typescript-strict-style` | TS rules enforced by `tsconfig.json` + ESLint | [skills/typescript-strict-style.md](skills/typescript-strict-style.md) |

Skills don't have a slash-command form. They're read by agents as reference material.

## Subagents (specialized personas)

Adopt the persona described in the file when the task matches.

| Subagent | Domain | File |
|---|---|---|
| `parser-architect` | Public API shape, source-file placement, dual-export discipline | [agents/parser-architect.md](agents/parser-architect.md) |
| `emoji-data-curator` | The catalog, `EMOJIS_SPECIAL_CASES`, regeneration pipeline | [agents/emoji-data-curator.md](agents/emoji-data-curator.md) |
| `test-author` | Mocha + Chai specs, regression tests, regenerator handling | [agents/test-author.md](agents/test-author.md) |
| `dependency-auditor` | `package.json` changes, `.ncurc.json`, license/CVE checks | [agents/dependency-auditor.md](agents/dependency-auditor.md) |
| `release-engineer` | Webpack config, GitHub Actions, npm publish, GitHub releases | [agents/release-engineer.md](agents/release-engineer.md) |
| `doc-writer` | Keeping `AGENTS.md`, `docs/`, and `README.md` synchronized | [agents/doc-writer.md](agents/doc-writer.md) |

## Adding a new skill, command, or subagent

1. Create the markdown file under `commands/<name>.md`, `skills/<name>.md`, or `agents/<name>.md`
2. Follow the structure of an existing file (frontmatter with `name` and `description`, then sections)
3. Add a row to the appropriate table above
4. Mention the new entry in [`../AGENTS.md`](../AGENTS.md) "Skills, Commands & Subagents" section
5. Commit with `feat: add <name> command` / `feat: add <name> skill` / `feat: add <name> subagent`

## Conventions

- **Commands** are **procedural** — numbered steps, exact commands, file paths, copy-pasteable code. Aim for under 200 lines
- **Skills** are **deep-dives** — they explain *why*, not just *how*; richer than commands; reference docs/ files freely
- **Subagents** are **persona-based** — what they care about, what they don't, how they decide
- All three must be **self-contained at the file level** — an agent reading only the file should be able to execute it
- **Cross-link** to `docs/` rather than duplicating content
- **Frontmatter** at the top of every file:

  ```markdown
  ---
  name: <command-or-skill-or-agent-name>
  description: One-line summary used by agent hosts to surface the file
  ---
  ```
