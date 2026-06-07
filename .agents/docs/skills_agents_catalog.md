# Skills & Agents Catalog — Universal Emoji Parser

> Generated to match what actually exists on disk under `.agents/`. Keep in sync
> when adding/removing a skill, agent, or command (use `/skill-create` and
> `/agent-create`, which route to the `deepworkplan` **author** sub-skill).

The full prose catalog lives in [`../README.md`](../README.md); this file is the
machine-friendly index used by AI agents to discover the repo's kit.

## Skills (`.agents/skills/`)

| Skill                      | Purpose                                                                                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emoji-parser-conventions` | Parse pipeline, regex caching, dual ESM/CommonJS export shape                                                                                                                                                              |
| `emoji-data-pipeline`      | Step-by-step regeneration of `emoji-lib.json` from upstream sources                                                                                                                                                        |
| `npm-publish-walkthrough`  | Full release flow including GitHub Actions internals                                                                                                                                                                       |
| `typescript-strict-style`  | TS rules enforced by `tsconfig.json` + Biome                                                                                                                                                                               |
| `deepworkplan`             | Router skill — turn the repo AI-first and run Deep Work Plans. Sub-skills: `create`, `execute`, `refine`, `resume`, `status`, `verify`, `onboard`, `author` (installed via `npx skills add DailybotHQ/deepworkplan-skill`) |

## Agents (`.agents/agents/`)

| Agent                | Role                                                                               |
| -------------------- | ---------------------------------------------------------------------------------- |
| `parser-architect`   | Decides where new logic lives; reviews public API shape and dual-export discipline |
| `emoji-data-curator` | Owns the catalog, keyword resolution, and `EMOJIS_SPECIAL_CASES` overrides         |
| `test-author`        | Writes Vitest specs, regression cases, integration coverage                        |
| `dependency-auditor` | Reviews `package.json` changes, license/CVE checks, `.ncurc.json` exclusions       |
| `release-engineer`   | Owns Vite config, CI workflows, npm publish, GitHub release notes                  |
| `doc-writer`         | Keeps `AGENTS.md`, `docs/`, and `README.md` synchronized with code                 |

## Commands

See [`COMMANDS_REFERENCE.md`](COMMANDS_REFERENCE.md) for the full command index
(domain commands + DeepWorkPlan `dwp-*` delegators + author delegators).
