# Documentation Guide

When and how to update the docs that live in this repo. The goal is to keep `AGENTS.md` and `docs/` in sync with the code so future contributors (human or agent) can land productively without reverse-engineering conventions from the source.

## Documentation map

| File                           | Purpose                                                                              | Update when…                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `AGENTS.md` (root)             | Single source of truth for AI agents — non-negotiable rules, quick command reference | Mandatory rules change, commands change, new patterns become canonical |
| `CLAUDE.md`                    | Symlink → `AGENTS.md`                                                                | Never edit directly                                                    |
| `README.md`                    | Human-facing intro, install + usage                                                  | The primary value proposition or public API changes                    |
| `docs/ARCHITECTURE.md`         | Module layout, data flow, regenerator pipeline                                       | New module, new data source, new pipeline stage                        |
| `docs/TECHNOLOGIES.md`         | Stack with versions and roles                                                        | A library is added, removed, or major-bumped                           |
| `docs/STANDARDS.md`            | Coding rules                                                                         | A convention is decided or changes                                     |
| `docs/DEVELOPMENT_COMMANDS.md` | pnpm script reference                                                                | A new script is wired or a workflow changes                            |
| `docs/TESTING_GUIDE.md`        | Test framework, conventions, regenerator workflow                                    | Test framework changes, new test scenario added                        |
| `docs/RUNTIMES.md`             | Per-runtime notes (Node, browsers, edge)                                             | A new runtime is supported or a runtime-specific gotcha is found       |
| `docs/BUILD_DEPLOY.md`         | Vite output, npm publish, CI workflows                                               | Build steps, signing, CI pipeline changes                              |
| `docs/EMOJI_PROVIDERS.md`      | Twemoji CDN, dialect support, special-case overrides                                 | A dialect is added, a CDN is swapped, an override changes              |
| `docs/PERFORMANCE.md`          | Hot paths, bundle size, profiling                                                    | A performance decision is made (caching, lazy-load, bundle split)      |
| `docs/API_REFERENCE.md`        | Every export, method, type, option                                                   | The public API changes (additions, signatures, defaults)               |
| `docs/SECURITY.md`             | XSS, supply chain, npm publish security                                              | A security policy or threat-model item changes                         |
| `docs/AI_AGENT_ONBOARDING.md`  | First-run flow for any AI agent                                                      | The onboarding path changes                                            |
| `docs/AI_AGENT_COLLAB.md`      | Multi-agent coordination                                                             | Agent roles or handoffs change                                         |
| `docs/FORK_CUSTOMIZATION.md`   | Rebrand checklist for forks                                                          | A new fork-time concern is discovered                                  |
| `.agents/README.md`            | Skills, commands, subagents catalog                                                  | A skill, command, or subagent is added/removed                         |
| `.agents/skills/<name>.md`     | Procedure / deep-dive for a skill                                                    | The procedure changes                                                  |
| `.agents/commands/<name>.md`   | Slash command spec                                                                   | The procedure changes                                                  |
| `.agents/agents/<name>.md`     | Persona for a specialized subagent                                                   | The persona changes                                                    |

## Triggers for updating

### Always require a doc update

- A new public method on `uEmojiParser`
- A new option on `EmojiParseOptionsType`
- A new field on `EmojiType`
- A new dependency added to `package.json`
- The HTML output template changes
- `DEFAULT_EMOJI_CDN` value changes
- A new pnpm script is wired
- A CI workflow is added or substantively changed
- The Node `engines` constraint changes
- A new entry is added to `EMOJIS_SPECIAL_CASES`
- The catalog is regenerated and `TOTAL_EMOJIS` changes
- A new skill, command, or subagent is added under `.agents/`

### Often require a doc update

- A non-obvious convention is decided ("All `expect` blocks include the input verbatim")
- A workaround for a third-party bug
- A bug-prone area gets a defensive check that future contributors should know about

### Rarely require a doc update

- Routine version bumps within the same major version
- Style-only refactors
- Test file reordering / split

## How to write docs that age well

1. **Lead with the rule.** "All output emojis use `class='emoji'`" — not "We typically use a class attribute…"
2. **Show one canonical example.** A code snippet that's the answer, not three options
3. **Explain _why_ when it's non-obvious.** "The `__` prefix means internal — Vite's CJS library output exposes everything, so this is a naming convention, not a hard private"
4. **Cross-link.** Mentioning a topic? Link to the dedicated doc instead of duplicating content. Repetition leads to drift
5. **Date-tag exceptions.** "Until U+FE0F handling is fixed upstream, `@twemoji/parser` stays pinned at 17.0.1" — easy to clean up later
6. **Keep the file under 500 lines.** Past that, split

## Cross-linking

Every doc that mentions something covered in detail elsewhere should link to it. Examples:

- `AGENTS.md` mentions the regenerator → links to `docs/ARCHITECTURE.md#the-regeneration-pipeline` and `.agents/commands/regenerate-emoji-lib.md`
- `ARCHITECTURE.md` mentions a dependency → links to `TECHNOLOGIES.md`
- A skill in `.agents/skills/` references rules from `STANDARDS.md`

When you rename a doc, grep for its old name and update inbound links:

```bash
grep -rln "OLD_NAME.md" .
```

## Single source of truth

Each fact lives in **one** file. If you find yourself copying a paragraph, replace one copy with a link to the other.

Examples of "owned by":

- Coding conventions → `docs/STANDARDS.md`
- pnpm scripts → `docs/DEVELOPMENT_COMMANDS.md`
- Stack versions → `docs/TECHNOLOGIES.md` (and pinned in `package.json`)
- HTML output contract → `docs/API_REFERENCE.md#html-output-contract` (referenced from `STANDARDS.md` and `SECURITY.md`)
- Regenerator workflow → `docs/ARCHITECTURE.md#the-regeneration-pipeline` + `.agents/commands/regenerate-emoji-lib.md` (link from one to the other; no copy-paste)

## Writing for AI agents

`AGENTS.md` is read by AI assistants on every session. It must be:

1. **Scannable.** Tables, bullet lists, short paragraphs. Agents prioritize structured content
2. **Decisive.** "MUST", "DO", "DON'T" beat "consider" and "you might want"
3. **Concrete.** Include exact file paths, command invocations, and example code
4. **Self-contained at the section level.** An agent might quote one bullet — it should still be unambiguous

Skill / command files (`.agents/skills/<name>.md`, `.agents/commands/<name>.md`) follow the same rules but are step-by-step procedures rather than reference docs. Keep them under 250 lines; if a procedure is longer, the skill is doing too much — split it.

## Forking

When this repo is forked into a new product, the **first commit on the fork** should:

1. Update [README.md](../README.md) with the new product name and purpose
2. Update [AGENTS.md](../AGENTS.md) Project Overview section
3. Walk through [Fork Customization](FORK_CUSTOMIZATION.md) and check every item
4. Audit `docs/` for content that no longer applies (e.g., if you don't use DailyBot for notifications, strip those sections from `BUILD_DEPLOY.md`)

## Reviewing doc PRs

When reviewing a PR that touches code, ask:

- Did this change add/remove a method, dep, pnpm script, or pattern? → Doc update required
- Did this change touch a path mentioned in the docs? → Verify the docs still reflect reality
- Did the PR description say "I'll document this later"? → It rarely happens — block on docs in the same PR
- Does the change affect the HTML output? → `docs/API_REFERENCE.md`, `docs/SECURITY.md`, and `AGENTS.md` all need review

## Detecting drift

Drift you should fix on sight:

- A doc describing a pnpm script that no longer exists
- A `EmojiType` field listed in the docs but missing from `src/lib/type.ts`
- A dependency version in the docs older than `package.json`
- A skill file referencing a procedure that's changed
- A README example that doesn't run when pasted into a Node REPL

When you spot drift, fix it immediately. Don't open a "TODO doc update" issue and move on.

## A note on the README

The README is **end-user facing** and is what npm/GitHub display on the package page. Treat it differently from `docs/`:

- Lead with installation and the simplest possible "Hello world" example
- Include the recommended CSS snippet (consumers always need it)
- Cover the public API by example, not exhaustively (link to `docs/API_REFERENCE.md` for that)
- Keep it under 200 lines — if it's longer, a section probably belongs in `docs/`
- Don't include CI/build internals — that's in `docs/BUILD_DEPLOY.md`
