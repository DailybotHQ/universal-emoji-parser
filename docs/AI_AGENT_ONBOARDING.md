# AI Agent Onboarding

Whether you're Claude Code, Cursor, Codex, Gemini, GitHub Copilot, or any other AI coding assistant — read this once before touching the repo.

## In one minute

1. **Read [`AGENTS.md`](../AGENTS.md)** — the non-negotiable rules. Don't skip it.
2. **This is a TypeScript library** that parses emoji unicodes/shortcodes into HTML `<img>` tags or between formats. Zero runtime dependencies — `@twemoji/parser` is inlined into the bundle at build time
3. **Two files matter most:** `src/index.ts` (the parser) and `src/lib/emoji-lib.json` (the catalog)
4. **Don't hand-edit `emoji-lib.json`.** Regenerate via `prepareEmojiLibJson.test.ts` (see [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md))
5. **The HTML output template is a contract.** `<img class="emoji" alt="..." src="..."/>` — exactly that shape, forever (until a major bump)
6. **Inner loop:** `pnpm run test:watch` while editing `src/index.ts` (the repo uses **pnpm**, pinned via Corepack — `corepack enable` once)
7. **`tmp/` is git-ignored scratch space** — put throw-away files there, never anywhere else

## In ten minutes (recommended pre-task reading)

- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — module layout, `src/index.ts` walkthrough, regenerator pipeline
- [`docs/STANDARDS.md`](STANDARDS.md) — TypeScript / lint / formatting rules
- [`docs/API_REFERENCE.md`](API_REFERENCE.md) — every public method, type, option

## Before each task

1. **Identify what's changing.** Public API? Internal helper? Catalog? Build infrastructure? Each has its own playbook
2. **Check if a skill matches.** See [`.agents/README.md`](../.agents/README.md). If yes, follow its procedure file step-by-step
3. **Plan briefly.** What files will you touch? Will you need to regenerate the catalog? What's the test strategy?
4. **Pick the inner loop.** Code change to `src/`? `pnpm run test:watch`. Catalog change? Open `prepareEmojiLibJson.test.ts`. Build/CI change? Probably no fast loop — make small commits and check CI

## During the task

- **Edit only `AGENTS.md`** when updating agent rules — `CLAUDE.md` is a symlink
- **Edit only `.agents/`** when adding skills/commands/subagents — `.claude/` is a symlink
- **Run the inner loop after every meaningful change.** Don't accumulate unverified changes
- **If you change the public API, update [`docs/API_REFERENCE.md`](API_REFERENCE.md) and `README.md` in the same change**
- **If you regenerate the catalog, update `TOTAL_EMOJIS` in `test/emojiLibJson.test.ts` if the count changed**

## Before claiming "done"

Run the pre-commit checklist from `AGENTS.md`:

- [ ] All code, comments, and identifiers in English
- [ ] `pnpm run biome:check` passes (lint + format)
- [ ] `pnpm test` passes
- [ ] `pnpm run build` succeeds (Vite produces `dist/index.js`; `build:types` emits the `.d.ts` files)
- [ ] `pnpm run build:tsc` succeeds (types type-check)
- [ ] If you regenerated `emoji-lib.json`, the `TOTAL_EMOJIS` constant in `emojiLibJson.test.ts` is updated
- [ ] If you changed the public API, `docs/API_REFERENCE.md` and `README.md` are updated
- [ ] No `console.*` calls in `src/`
- [ ] No `dist/` artifacts staged (gitignored)
- [ ] Commit message in English (conventional format)

## Common patterns

### Adding a new public method

1. Define it in `UEmojiParserType` in `src/lib/type.ts`
2. Implement it on the `uEmojiParser` object in `src/index.ts`
3. Add tests in `test/main.test.ts`
4. Update `docs/API_REFERENCE.md`
5. Mention in `README.md` if it's user-facing
6. Conventional commit: `feat: add <method> for ...`

### Fixing a parsing bug

1. Reproduce in `tmp/repro.ts`:
   ```ts
   import uEmojiParser from '../src/index'
   console.log(uEmojiParser.parse('the input that breaks'))
   ```
2. `pnpm dlx vite-node tmp/repro.ts` — confirm the bug
3. Add a failing test in `test/main.test.ts` that asserts the _expected_ output. Paste the broken input verbatim
4. `pnpm run test:watch` — watch it fail
5. Fix `src/index.ts`
6. Test passes — commit fix + test together with `fix: <description>`

Skill: [`/write-tests`](../.agents/commands/write-tests.md).

### Adding a shortcode alias

1. Edit `EMOJIS_SPECIAL_CASES` in `test/prepareEmojiLibJson.test.ts`:
   ```ts
   '🚀': { include: ['rocketship'] },
   ```
2. Regenerate the catalog (skill: [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md))
3. Add a test:
   ```ts
   it('should resolve :rocketship: to 🚀', () => {
     expect(uEmojiParser.parseToUnicode(':rocketship:')).to.be.equal('🚀')
   })
   ```
4. Commit `prepareEmojiLibJson.test.ts`, `emoji-lib.json`, and the new test together

Skill: [`/add-special-case`](../.agents/commands/add-special-case.md).

### Bumping a dependency

1. `pnpm run ncu:check` — confirm an upgrade is available
2. Read release notes for breaking changes
3. Edit `package.json`, run `pnpm install`
4. `pnpm test && pnpm run build`
5. PR with `chore: bump <library> to <version>` (or `fix:` / `feat:` if appropriate)

Skill: [`/bump-deps`](../.agents/commands/bump-deps.md).

### Diagnosing a build failure

1. Read the actual error output, not just the symptom
2. Check Biome first (most failures are lint/format, not build): `pnpm run biome:check`
3. If TypeScript: `pnpm run build:tsc` for clearer error messages
4. If the Vite bundle: `pnpm run build:dev` (development mode, no minification) for readable output

Skill: [`/fix-build`](../.agents/commands/fix-build.md).

## Decision tree: where does this code go?

```
What kind of change is it?
├── Public API (new method, new option)
│     → src/index.ts + src/lib/type.ts + test/main.test.ts + docs/API_REFERENCE.md + README.md
├── Catalog content (new alias, new emoji)
│     → test/prepareEmojiLibJson.test.ts (EMOJIS_SPECIAL_CASES) + regenerate + test/main.test.ts
├── Internal helper (refactor, perf)
│     → src/index.ts only; existing tests should still pass
├── Build/CI
│     → vite.config.ts / vitest.config.ts / .github/workflows/*.yml + docs/BUILD_DEPLOY.md
├── Documentation
│     → docs/<file>.md (or AGENTS.md for top-level rules)
└── AI tooling (skill / command / subagent)
      → .agents/(skills|commands|agents)/<name>.md + .agents/README.md
```

## Tools you have

| Tool         | Use                                     |
| ------------ | --------------------------------------- |
| Read         | Read code or docs to understand context |
| Bash         | Run `pnpm run *`, `git`, `find`, `grep` |
| Edit / Write | Modify files                            |
| Grep / Find  | Locate code by pattern                  |

Before bulk changes, read the relevant section of `AGENTS.md` and the doc it links to. Don't optimize for fewest tool calls at the cost of correctness.

## Things that look easy but aren't

- **Hand-editing `emoji-lib.json`** — feels faster but the next regeneration overwrites it. Always go through `EMOJIS_SPECIAL_CASES`
- **Adding a runtime dependency** — every byte ships to consumer bundles. Justify with measurement
- **Changing the HTML output template** — breaks every consumer's snapshot tests; major version
- **Major bumps to test or lint tooling** — Vitest 4 + Biome 2.4 are the current baseline; still read release notes and run `pnpm test` + `pnpm run biome:check` + `pnpm run build` before merging
- **Skipping the `it.skip` on the regenerator test** — if you forget to re-skip it, the next CI run regenerates the catalog into `emoji-lib-output.json` (which is gitignored, so it's a wasted run, not a leak)

## Asking for clarification

If a task is ambiguous, ask **before** writing code. Common ambiguities:

- "Add an alias" — for which emoji? In the canonical catalog or as a special case?
- "Fix the parser" — for what input? Paste it, please
- "Make it faster" — what's slow? Bundle size? Runtime? Cold start?
- "Support X dialect" — Slack-specific? GitHub-specific? Probably already supported via `EMOJIS_SPECIAL_CASES`

A 30-second clarification beats a 30-minute rewrite.

## Multi-agent coordination

If multiple agents collaborate, follow [`docs/AI_AGENT_COLLAB.md`](AI_AGENT_COLLAB.md).
