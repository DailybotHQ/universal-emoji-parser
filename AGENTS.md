# AGENTS.md - Documentation for AI Agents

**Purpose:** Single source of truth for all AI coding assistants (Claude Code, Cursor AI, OpenAI Codex, Google Gemini, GitHub Copilot, and others). Ensures all agents work with consistent guidelines and patterns.

> `CLAUDE.md` in the repo root is a symlink to this file. Update **only** `AGENTS.md`.
> `.claude/` is a symlink to `.agents/`. Edit files in `.agents/`.

## Detailed Documentation

**Comprehensive guides for specific tasks:**

| Category        | Guide                                                                                           | Purpose                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Product         | [Product Spec](docs/PRODUCT_SPEC.md)                                                            | Non-technical "why" and "for whom": problem, audience, capabilities, non-goals |
| Architecture    | [Architecture](docs/ARCHITECTURE.md)                                                            | Module layout, data flow, parse pipeline, emoji catalog                        |
| Technologies    | [Technologies](docs/TECHNOLOGIES.md)                                                            | Stack overview with versions and roles                                         |
| Standards       | [Standards](docs/STANDARDS.md)                                                                  | TypeScript / lint / Prettier conventions, naming, exports                      |
| Commands        | [Development Commands](docs/DEVELOPMENT_COMMANDS.md)                                            | npm scripts, Mocha runs, Webpack, watch loops                                  |
| Testing         | [Testing](docs/TESTING_GUIDE.md)                                                                | Mocha + Chai setup, test conventions, regenerating expectations                |
| Runtimes        | [Runtimes](docs/RUNTIMES.md)                                                                    | Node, browsers, ESM vs CommonJS, bundlers consuming the package                |
| Build & Deploy  | [Build & Deploy](docs/BUILD_DEPLOY.md)                                                          | Webpack production bundle, npm publish, GitHub release pipeline                |
| Emoji Providers | [Emoji Providers](docs/EMOJI_PROVIDERS.md)                                                      | Twemoji CDN, custom CDNs, shortcode dialects (Slack/GitHub/Discord)            |
| Performance     | [Performance](docs/PERFORMANCE.md)                                                              | Lookup hot paths, RegExp caches, bundle size, large catalog handling           |
| API Reference   | [API Reference](docs/API_REFERENCE.md)                                                          | Public methods, types, options, return values                                  |
| Security        | [Security](docs/SECURITY.md)                                                                    | XSS in HTML output, input validation, npm publish security, dependency hygiene |
| Documentation   | [Documentation Guide](docs/DOCUMENTATION_GUIDE.md)                                              | When and how to update docs                                                    |
| AI Agents       | [Agent Onboarding](docs/AI_AGENT_ONBOARDING.md), [Agent Collaboration](docs/AI_AGENT_COLLAB.md) | Setup, handoff, coordination                                                   |
| Forking         | [Fork Customization](docs/FORK_CUSTOMIZATION.md)                                                | Step-by-step rebrand of the package into a new product                         |
| Skills/Agents   | [.agents/README.md](.agents/README.md)                                                          | Available skills, slash commands, and subagents for this repo                  |

## Project Overview

**Universal Emoji Parser** — a TypeScript library that parses emoji **unicodes** and **shortcodes** in arbitrary text and converts them into HTML `<img>` tags backed by the [Twemoji](https://github.com/jdecked/twemoji) CDN, or between unicode and shortcode forms. The shortcode dictionary is pre-curated from [emojilib](https://github.com/muan/emojilib) and [`unicode-emoji-json`](https://www.npmjs.com/package/unicode-emoji-json) into a single static catalog (`src/lib/emoji-lib.json`) so the runtime never has to merge the two upstream sources.

The package targets:

- Twitter, GitHub, Slack, Discord, Google Chat, and Microsoft Teams shortcode dialects (single dictionary, normalized to one canonical slug per emoji)
- Both **CommonJS** (`require('universal-emoji-parser')`) and **ES modules** (`import uEmojiParser from 'universal-emoji-parser'`)
- Server-side (Node ≥ 20.19) and browser environments (consumers bundle via webpack/rollup/vite)

> **Forking this?** The package name (`universal-emoji-parser`), the npm scope, the maintainer block in `package.json`, the GitHub remote, and the DailyBot release-bot identity are the renameable identifiers. Walk [Fork Customization](docs/FORK_CUSTOMIZATION.md) before merging product code.

**Technology Stack** (full list with versions: [Technologies](docs/TECHNOLOGIES.md))

- **TypeScript 6** — strict-null source language, compiles to `dist/index.js` + `dist/index.d.ts` (see `package.json` for exact semver)
- **Node.js ≥ 20.19.0** — `engines.node` constraint enforced by package.json (CI and the dev container use Node 24)
- **`@twemoji/parser` 17** — single runtime dependency; finds emoji entities in text and produces CDN URLs
- **emojilib 4 + unicode-emoji-json** (build/test only) — sources used to regenerate `src/lib/emoji-lib.json`
- **Webpack 5 + ts-loader** — production bundler, emits a single CommonJS entry at `dist/index.js`
- **Mocha 11 + Chai 6 + tsx** — test runner; `tsx` loads `.ts` specs (Chai 6 is ESM-first — `ts-node/register` alone is insufficient)
- **ESLint 10 + `typescript-eslint` (flat config)** — code linting via `eslint.config.mjs`
- **Prettier 3** — code formatting (`semi: false`, `singleQuote: true`, `trailingComma: 'es5'`)
- **npm-check-updates** — dependency upgrade automation (optional rejects in `.ncurc.json`; empty by default)
- **GitHub Actions** — CI/CD: lint → tests → build → npm publish + GitHub release on PR merge to `main`

## Project Structure

> Full tree and rationale: **[Architecture Guide](docs/ARCHITECTURE.md#project-structure)**

```
src/
├── index.ts                  # Public API: uEmojiParser, DEFAULT_EMOJI_CDN, emojiLibJsonData
└── lib/
    ├── type.ts               # Shared TypeScript interfaces (EmojiType, EmojiParseOptionsType, …)
    ├── emoji-lib.json        # Curated emoji catalog (1906 entries) — committed, generated by a test
    └── emoji-lib-output.json # Last regeneration output (git-ignored)

test/
├── main.test.ts                       # Integration tests for the public parse / parseTo* methods
├── emojiLibJson.test.ts               # Snapshot-style validation of the catalog
└── prepareEmojiLibJson.test.ts        # `it.skip`-guarded regenerator for emoji-lib.json

dist/                                  # Webpack output (git-ignored, npm-published)
docker/local/                          # Dev container Docker Compose + Dockerfile
.devcontainer/                         # VS Code Dev Container config (uses docker/local/)
.github/
├── workflows/                         # CI pipelines (code_check, release_and_publish, …)
└── scripts/                           # Shell helpers used by workflows
.agents/                               # AI agent skills, commands, subagents (.claude/ symlinks here)
docs/                                  # Project documentation
tmp/                                   # Scratch workspace (git-ignored, see below)
package.json                           # npm scripts, deps, version, engines
tsconfig.json                          # strict TS config for src + tests (declaration: true, strictNullChecks: true)
tsconfig.build.json                    # `tsc --build` / ts-loader: emit from `src/` only (`rootDir`)
webpack.config.js                      # commonjs2 output, ts-loader, clean-webpack-plugin on prod
eslint.config.mjs / .prettierrc / .editorconfig   # Style enforcement (ESLint flat config)
.ncurc.json                            # npm-check-updates defaults (`reject` optional)
.npmignore                             # Trims source/test/config from the npm tarball
```

## Temporary Workspace (`tmp/`)

The `tmp/` directory at the project root is a **git-ignored scratch space** for agents and developers.

**Use it for:**

- Temporary prompts, outputs, or drafts
- One-off analysis results, debug logs, build artifacts copied for inspection
- Throw-away `.ts` snippets you want to compile/run outside of `src/`

**Rules:**

- Everything inside `tmp/` is ignored by git (except `.gitkeep`)
- Do NOT store anything permanent or important here — it can be deleted at any time
- When a user asks for a temporary file, prompt output, or scratch artifact, **use `tmp/`**. Subdirectories are fine (e.g., `tmp/prompts/`, `tmp/analysis/`).

## CRITICAL: Mandatory Requirements

### 1. Language Standards

**ALL code, comments, identifiers, commit messages, and documentation MUST be in English.** Emoji shortcodes (`:smile:`) are part of the data, not the language. The package itself is data-language-neutral. Always update documentation after important changes.

### 2. Single Source of Truth: `src/lib/emoji-lib.json` (MANDATORY)

The runtime never imports from `emojilib` or `unicode-emoji-json` directly. Everything goes through `src/lib/emoji-lib.json`. Rules:

- **Do not edit `emoji-lib.json` by hand.** Regenerate it via [`prepareEmojiLibJson.test.ts`](test/prepareEmojiLibJson.test.ts) and commit the diff
- **The keys are unicode emoji characters** (e.g., `"😎"`), the values follow `EmojiType` from `src/lib/type.ts`
- **Each entry has exactly one `slug`** (the canonical shortcode, e.g., `smiling_face_with_sunglasses`) plus a curated `keywords` array
- **Special-case overrides** live in `EMOJIS_SPECIAL_CASES` inside `prepareEmojiLibJson.test.ts` — that's the only place where keyword merges/exclusions are encoded
- See [`/regenerate-emoji-lib`](.agents/commands/regenerate-emoji-lib.md) for the full procedure

### 3. Public API Surface (MANDATORY)

The public API of the package is defined by `src/index.ts` and consists of:

| Export                                                                                                                                                  | Purpose                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `default` (`uEmojiParser`)                                                                                                                              | Object exposing `parse`, `parseToHtml`, `parseToUnicode`, `parseToShortcode`, `getEmojiObjectByShortcode`, `getDefaultOptions` |
| Named: `emojiLibJsonData`                                                                                                                               | The full catalog as `EmojiLibJsonType` — read-only consumers                                                                   |
| Named: `DEFAULT_EMOJI_CDN`                                                                                                                              | Twemoji CDN URL string                                                                                                         |
| CommonJS: `module.exports = uEmojiParser`, `module.exports.emojiLibJsonData = emojiLibJsonData`, `module.exports.DEFAULT_EMOJI_CDN = DEFAULT_EMOJI_CDN` | Required for `require()` consumers                                                                                             |

Rules:

1. **Never break the dual ESM/CommonJS export shape.** Both `import uEmojiParser from 'universal-emoji-parser'` and `const uEmojiParser = require('universal-emoji-parser')` must keep working
2. **`parse(text)` only accepts strings.** Throw `Error('The text parameter should be a string.')` for non-strings — there is a test for this
3. **Default options:** `parseToHtml: true`, `parseToUnicode: false`, `parseToShortcode: false`, `emojiCDN: undefined`. Don't change defaults without a major version bump
4. **`parseToHtml` precedence:** `parseToHtml === true` always wins over `parseToShortcode`/`parseToUnicode` (see `parse()` in `src/index.ts`)
5. **API additions go through the catalog**, not as new top-level exports — keep the export surface narrow

Full reference: **[API Reference](docs/API_REFERENCE.md)**.

### 4. TypeScript Style (MANDATORY)

- **Strict null checks on** (`strictNullChecks: true` in `tsconfig.json`) — every nullable must be handled
- **No `any` without justification** (`noImplicitAny: true`); when forced, suppress with a targeted `// eslint-disable-line` and a comment
- **No semicolons** (Prettier `semi: false`, ESLint `semi: [2, 'never']`)
- **Single quotes** (`singleQuote: true`); use template literals when interpolating
- **Trailing comma `es5`** — multi-line arrays/objects, never in function call args
- **Explicit return types on exported functions** — `parse(text: string): string`, not inferred
- **Imports first, then constants, then implementation** — see `src/index.ts` for the canonical layout
- **`max_line_length = 120`** (`.editorconfig`) — Prettier reflows past it

Run `npm run eslint:check` and `npm run prettier:check` before committing. Auto-fix is `npm run eslint:fix` / `npm run prettier:fix`.

### 5. Code Quality (MANDATORY)

```bash
npm run eslint:check       # Lint check (CI gate)
npm run prettier:check     # Format check (CI gate)
npm run eslint:fix         # Auto-fix lint
npm run prettier:fix       # Auto-fix format
npm run build:tsc          # Type-check via tsc (no emit when used with --noEmit, otherwise builds .d.ts)
npm run build              # Webpack production bundle to dist/
```

The CI runs `eslint:check` + `prettier:check` + `test` + `build` on every PR (`.github/workflows/code_check.yml`). All four must pass.

### 6. Testing (MANDATORY)

```bash
npm test                  # Run all Mocha specs (tsx + mocha; no compile step)
npm run test:watch        # Re-run on file change
```

Specs live in `test/*.test.ts`. The runner config: `tsx ./node_modules/mocha/bin/mocha.js 'test/**/*.ts' --timeout 25000 --colors`.

- **Always add a regression test** when fixing a parsing bug — paste the exact input that broke and the expected output
- **Snapshot the catalog count** when regenerating: `emojiLibJson.test.ts` asserts `TOTAL_EMOJIS = 1906`. Bump it intentionally if a regeneration changes the count
- The regeneration test (`prepareEmojiLibJson.test.ts`) is `it.skip`'d by default; **never commit it un-skipped** — it writes to disk

Conventions: **[Testing Guide](docs/TESTING_GUIDE.md)**.

### 7. Emoji HTML Output Contract (MANDATORY)

Every emoji rendered to HTML by `parseToHtml` / `parse` (with `parseToHtml: true`) MUST follow this exact structure:

```html
<img class="emoji" alt="<unicode-emoji>" src="<cdn-url>" />
```

- `class="emoji"` — load-bearing; consumers style emojis with `img.emoji { ... }` (see `README.md`)
- `alt="<unicode-emoji>"` — the actual unicode character, **not** the shortcode (accessibility + copy-paste survives the rendering)
- `src="<cdn-url>"` — defaults to `DEFAULT_EMOJI_CDN`; overridable via `emojiCDN` option
- **Self-closing `/>`** — preserved for compatibility with strict XHTML/JSX consumers
- **No additional attributes** — adding `loading="lazy"`, `decoding="async"`, etc. is a breaking change

Bug-fix changes that alter HTML output break every consumer's snapshot tests. Cut a major version.

### 8. Performance-First Mindset (MANDATORY)

1. **Don't iterate the whole catalog per call.** `parseToShortcode` builds one big alternation regex from `Object.keys(emojiLibJsonData).join('|')` — keep the catalog ordered so longer matches come first (already the case)
2. **Cache regexes outside hot loops** when adding new code paths — `RegExp` construction is the slowest part of parsing
3. **`parseToHtml` calls `parseToUnicode` first**, then a single Twemoji `parse()` pass — preserve this order; doing them in parallel duplicates work
4. **Avoid full catalog object cloning.** `emojiLibJsonData` is shared; never mutate it. Tests rely on it being deep-equal across runs
5. **Bundle size matters.** `emoji-lib.json` is ~543 KB; don't add per-emoji metadata that isn't actively consumed
6. **Browser consumers bundle this package**; keep `dependencies` minimal — moving anything from `devDependencies` to `dependencies` ships it to every consumer's bundle

See **[Performance Guide](docs/PERFORMANCE.md)**.

### 9. Output Safety / XSS (MANDATORY)

The HTML emitted by `parseToHtml` is **trusted by consumers** — they typically inject it via `innerHTML` / `v-html` / `dangerouslySetInnerHTML`. Therefore:

1. **Never embed untrusted user input directly into the `alt` attribute**. The `alt` value is always the unicode emoji literal; it is not user-controlled
2. **Validate `emojiCDN` shape** if you ever start parsing user-supplied CDN URLs (currently we don't — the CDN comes from the consuming app's config)
3. **No script tags, no event handlers** ever appear in the output — the template is hardcoded in `__parseEmojiToHtml`
4. **Don't HTML-escape the surrounding text** in `parseToHtml`. The package is a transformer over text the consumer already considers safe; escaping would corrupt their content

See **[Security Guide](docs/SECURITY.md)**.

### 10. Watch Loop (Test-Driven)

The fastest inner loop for this package is `npm run test:watch`. Edit `src/index.ts` or a test file and the suite re-runs in ~1 second. Use it as the default workflow for any change to parsing logic.

For type-only changes, `npm run build:tsc` is faster than running tests.

## Shared Agent Coordination

Multiple AI agents collaborate on this codebase. When updating agent guidance, mirror changes across all relevant files. See **[AI Agent Collaboration](docs/AI_AGENT_COLLAB.md)**.

## Quick Commands

```bash
# Develop
npm install                              # Install everything
npm run dev                              # nodemon src/index.ts (manual smoke runs)
npm run test:watch                       # TDD inner loop

# Verify
npm run eslint:check                     # Lint
npm run prettier:check                   # Format
npm test                                 # Mocha specs
npm run build:tsc                        # tsc --build (emits .d.ts to dist/)

# Build
npm run build                            # Webpack production → dist/
npm run build:dev                        # Webpack development (no minify)

# Maintenance
npm run ncu:check                        # Show available dependency upgrades (respects .ncurc.json)
npm run ncu:upgrade                      # Apply upgrades to package.json (then `npm install`)

# Release (typically run by CI on merge to main, not by hand)
npm run release                          # npm version patch + auto commit message
```

Full reference: **[Development Commands](docs/DEVELOPMENT_COMMANDS.md)**.

## Architecture Patterns

> Full patterns with code examples: **[Architecture Guide](docs/ARCHITECTURE.md)**

### 1. Single Public Entry Point

`src/index.ts` is the only file that produces a public export. Everything else is internal. Consumers should never reach into `src/lib/*` — those are implementation details.

### 2. Catalog-First Lookup

`getEmojiObjectByShortcode(shortcode)` first tries a direct hit on `emojiLibJsonData[shortcode]` and only falls back to a `keywords.includes(shortcode)` scan when the slug doesn't match. This two-tier strategy is what makes Slack-style shortcodes (`:thumbsup:`) and canonical shortcodes (`:thumbs_up:`) both resolve to the same emoji.

### 3. Three Output Modes, One `parse()` Funnel

`parse(text, options)` dispatches to:

- `parseToShortcode(text)` if `parseToHtml === false && parseToShortcode === true`
- `parseToUnicode(text)` if `parseToHtml === true || parseToUnicode === true`
- `__parseEmojiToHtml(text, emojiCDN)` if `parseToHtml === true`

The order matters: shortcodes → unicode → HTML. Skip steps if the option is off.

### 4. Twemoji as the URL Authority

This package never hardcodes emoji-to-URL mappings — it delegates to `@twemoji/parser` and rewrites the CDN prefix when `emojiCDN` is set. When Twemoji renames or adds an emoji asset, this package picks it up by bumping the dep — no catalog change required.

### 5. CommonJS + ESM Dual Export

```ts
export default uEmojiParser
module.exports = uEmojiParser
module.exports.emojiLibJsonData = emojiLibJsonData
module.exports.DEFAULT_EMOJI_CDN = DEFAULT_EMOJI_CDN
```

This is **intentionally redundant**. Webpack with `libraryTarget: 'commonjs2'` exposes the default export as `module.exports.default`, which breaks `require('universal-emoji-parser').parse(...)`. The three assignments at the bottom of `src/index.ts` reattach the API and the named exports to `module.exports` itself so `require` users get the same shape as `import` users. **Every `export const` in `src/index.ts` must also be reattached here**, otherwise it ships as `undefined` to CommonJS consumers.

`test/exports.test.ts` enforces this rule two ways:

1. **Static check (always runs, no build needed)** — parses `src/index.ts` and asserts every `export const X` has a matching `module.exports.X = X`. Fails CI on PR with the exact line to add. This is the line of defense that runs in `code_check.yml` (which doesn't build before testing).
2. **Bundle smoke test (runs when `dist/` is fresh)** — `require('./dist/index.js')` and asserts the same property at runtime. Self-skips with a clear hint if `dist/` is missing or older than `src/`, so `npm test` and `npm run test:watch` never fail spuriously when you forget to rebuild. The `codecheck` shell helper builds before testing, so this suite always exercises in the local pre-merge gate.

### 6. CI-Driven Releases

`npm run release` is **not run by humans**. The `.github/workflows/release_and_publish.yml` workflow runs on every `pull_request: closed` event with `merged == true`, bumps the patch version via `npm version patch`, tags, pushes, builds, and publishes to npm. The commit message is hardcoded: `[🤖 DailyBot] New release to v%s launched 🚀`.

## Documentation Standards

Update docs after: changing the public API, adding/removing a runtime dependency, regenerating the emoji catalog, changing the HTML output contract, adding a CI workflow, changing release procedure, adding a new emoji-provider dialect. See **[Documentation Guide](docs/DOCUMENTATION_GUIDE.md)**.

## Common Mistakes to Avoid

### DON'T:

1. Edit `src/lib/emoji-lib.json` by hand — regenerate it via the skipped test
2. Move a `devDependency` to `dependencies` without measuring the bundle-size impact on consumers
3. Change the HTML output template (`<img class="emoji" alt="..." src="..."/>`) without a major version bump
4. Add a new top-level export — extend the `uEmojiParser` object instead
5. Use `console.*` in `src/` — ESLint blocks it (`no-console: 2`); test files are exempt
6. Commit `dist/` — it's built by CI; locally regenerated on demand
7. Strip `eslint.config.mjs` or revert to legacy `.eslintrc` — ESLint 10 uses flat config only in this repo
8. Run `npm run release` locally — it bumps the version and creates a tag; CI does this on merge
9. Add new emoji metadata fields to `EmojiType` — they ship in 540 KB JSON to every browser consumer
10. Use `==` (TypeScript ESLint allows `===` only); use `Boolean(x)` instead of `!!x` in option parsing — see `getDefaultOptions`
11. Update `CLAUDE.md` directly — it is a symlink to `AGENTS.md`. Edit `AGENTS.md`
12. Add files inside `.claude/` — it is a symlink to `.agents/`. Edit `.agents/`
13. Mutate `emojiLibJsonData` at runtime — tests deep-compare the catalog
14. Skip the `:smile`/`:thumbsup` ⇄ `:thumbs_up` keyword fallback when adding new shortcodes — Slack/Twitter dialects depend on it

### DO:

1. Add a regression test next to every parsing fix — paste the failing input verbatim
2. Run `npm run test:watch` while editing `src/index.ts`
3. Use `Object.getOwnPropertyDescriptor(options, 'emojiCDN')` (not `options.emojiCDN === undefined`) when distinguishing "explicitly undefined" from "missing" — that's how `getDefaultOptions` already works
4. Update `EMOJIS_SPECIAL_CASES` in `prepareEmojiLibJson.test.ts` for keyword overrides — that's the only sanctioned mutation point for the catalog
5. Run `npm run ncu:check` before bumping any dep manually; it respects `.ncurc.json`
6. Keep `dependencies` minimal — every entry ships to consumer bundles
7. Use the existing test patterns (`it('should parse ...')`) for new specs
8. Test both unicode and shortcode inputs when adding a new emoji-related case

## Pre-Commit Checklist

- [ ] All code, comments, and identifiers in English
- [ ] `npm run eslint:check` passes
- [ ] `npm run prettier:check` passes
- [ ] `npm test` passes (all Mocha specs green)
- [ ] `npm run build` succeeds (Webpack emits to `dist/`)
- [ ] `npm run build:tsc` succeeds (types compile)
- [ ] If you regenerated `emoji-lib.json`, the `TOTAL_EMOJIS` constant in `emojiLibJson.test.ts` is updated
- [ ] If you changed the public API, `docs/API_REFERENCE.md` and `README.md` are updated
- [ ] If you bumped a dep, `package-lock.json` is committed (or absent — see `.gitignore`)
- [ ] No `console.*` calls in `src/`
- [ ] No `dist/` artifacts staged (gitignored)
- [ ] Commit message in English (conventional format)

## Skills, Commands & Subagents (AI Agent Tooling)

This repository ships with a `.agents/` directory (symlinked as `.claude/`) containing skill files, slash commands, and specialized subagents tuned for parser/library work. Full catalog: **[.agents/README.md](.agents/README.md)**.

**Slash commands (`.agents/commands/`):**

- `/regenerate-emoji-lib` — Regenerate `src/lib/emoji-lib.json` from upstream `emojilib` + `unicode-emoji-json`
- `/add-special-case` — Add a keyword include/exclude override to `EMOJIS_SPECIAL_CASES`
- `/write-tests` — Author Mocha + Chai tests for a parsing bug or new feature
- `/fix-build` — Diagnose a failing TypeScript / Webpack / Mocha build
- `/bump-deps` — Update one or more npm dependencies safely (respects `.ncurc.json`)
- `/release-npm` — Walk through a manual release if CI is unavailable
- `/check-html-output` — Verify the HTML output contract for a given input

**Skills (`.agents/skills/`):**

- `emoji-parser-conventions` — Deep dive on the parse pipeline, regex caching, dual-export shape
- `emoji-data-pipeline` — Step-by-step regeneration of the catalog from upstream
- `npm-publish-walkthrough` — Full release flow including GitHub Actions internals
- `typescript-strict-style` — TS rules enforced by `tsconfig.json` + ESLint

**Subagents (`.agents/agents/`):**

- `parser-architect` — Decides where new logic lives and reviews public API shape
- `emoji-data-curator` — Owns the catalog, keyword resolution, and special-case overrides
- `test-author` — Writes Mocha + Chai tests, regression cases, and integration coverage
- `dependency-auditor` — Reviews `package.json` changes, license/CVE checks, `.ncurc.json` exclusions
- `release-engineer` — Owns Webpack config, CI workflows, npm publish, GitHub release notes
- `doc-writer` — Keeps `AGENTS.md`, `docs/`, and `README.md` synchronized with code

### How to Invoke Commands

| Agent               | Prefix       | Example                 |
| ------------------- | ------------ | ----------------------- |
| **Claude Code**     | `/` (native) | `/regenerate-emoji-lib` |
| **OpenAI Codex**    | `#`          | `#regenerate-emoji-lib` |
| **Cursor AI**       | `#`          | `#regenerate-emoji-lib` |
| **Gemini / others** | `#`          | `#regenerate-emoji-lib` |

> **Why `#` for non-Claude agents?** Most AI CLIs (Codex, Cursor) intercept `/` as their own system commands. Using `#` avoids interception. You can also write the command name in plain text: "run regenerate-emoji-lib".

When a command is invoked (via `/`, `#`, or by name), the agent MUST:

1. **Look up** the command in **[.agents/README.md](.agents/README.md)** to find its file
2. **READ** the linked command/skill file completely
3. **FOLLOW** its step-by-step instructions exactly
4. **DO NOT** improvise or skip steps — the file IS the spec

## Conventional Commits

**Format:** `<type>: <description>`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

Examples:

- `feat: support :neckbeard: as a Slack dialect alias`
- `fix: parse :star: even when followed by VS-16 modifier`
- `chore: bump @twemoji/parser to 17.1.0`
- `build: emit ESM bundle alongside commonjs2 output`
- `docs: document EMOJIS_SPECIAL_CASES override workflow`
- `perf: cache parseToShortcode alternation regex`
- `ci: run lighthouse on the published bundle size`

The CI release commit (`[🤖 DailyBot] New release to vX.Y.Z launched 🚀`) is reserved for the release workflow — humans should not write it.
