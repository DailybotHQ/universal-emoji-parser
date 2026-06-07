# Architecture

This document explains the **big picture** of Universal Emoji Parser so a new contributor (human or agent) can be productive quickly. For day-to-day commands see [Development Commands](DEVELOPMENT_COMMANDS.md). For language-specific rules see [Standards](STANDARDS.md).

## High-level model

```
                         ┌─────────────────────────────────┐
                         │  src/index.ts (public API)      │
                         │  ───────────────────────────    │
                         │  uEmojiParser.parse(text, opts) │
                         │  uEmojiParser.parseToHtml       │
                         │  uEmojiParser.parseToUnicode    │
                         │  uEmojiParser.parseToShortcode  │
                         │  emojiLibJsonData               │
                         │  DEFAULT_EMOJI_CDN              │
                         └────────┬───────────────┬────────┘
                                  │               │
                ┌─────────────────┘               └─────────────────┐
                ▼                                                   ▼
   ┌──────────────────────────┐                       ┌─────────────────────────┐
   │  src/lib/emoji-lib.json  │                       │  @twemoji/parser        │
   │  (1914 entries)          │                       │  (inlined; zero rt deps)│
   │  shortcode → EmojiType   │                       │  finds emoji entities   │
   │  unicode  → EmojiType    │                       │  → CDN URLs             │
   └──────────┬───────────────┘                       └─────────────────────────┘
              │
              │ generated offline by
              ▼
   ┌──────────────────────────────────────────┐
   │  test/prepareEmojiLibJson.test.ts        │
   │  (it.skip — opt-in regeneration)         │
   │  emojilib  + unicode-emoji-json          │
   │  + EMOJIS_SPECIAL_CASES overrides        │
   │  → src/lib/emoji-lib-output.json         │
   │  → (review + copy to emoji-lib.json)     │
   └──────────────────────────────────────────┘
```

The runtime is **two files**: `src/index.ts` (~135 lines) and `src/lib/emoji-lib.json` (data). Everything else is type definitions, tests, or build/release infrastructure.

## Project structure

```
universal-emoji-parser/
├── AGENTS.md                          # Single source of truth for AI agents
├── CLAUDE.md → AGENTS.md              # Symlink (do not edit directly)
├── README.md                          # Human-facing intro and usage docs
├── LICENSE                            # MIT
├── package.json                       # Scripts, deps, version, engines.node ≥ 22
├── tsconfig.json                      # Strict TS config; tests + src
├── tsconfig.build.json                # `tsc`: emit declarations from `src/` only (`rootDir`)
├── vite.config.ts                     # Library mode, CommonJS output, esbuild minify; inlines @twemoji/parser
├── vitest.config.ts                   # Vitest test runner config
├── biome.json                         # Biome lint + format (single quotes, no semicolons, es5, lineWidth 120)
├── .editorconfig                      # 2-space indent, LF, max 120 cols
├── .ncurc.json                        # npm-check-updates (`reject` pins @twemoji/parser to 17.0.1)
├── .npmignore                         # Trims source/test/config from npm tarball
│
├── src/
│   ├── index.ts                       # The public API — see "src/index.ts" below
│   └── lib/
│       ├── type.ts                    # EmojiType, EmojiParseOptionsType, UEmojiParserType
│       ├── emoji-lib.json             # The catalog (committed; ~543 KB; 1914 entries)
│       └── emoji-lib-output.json      # Last regeneration output (git-ignored)
│
├── test/
│   ├── main.test.ts                       # Integration tests for the public methods
│   ├── emojiLibJson.test.ts               # Validates catalog metadata + count
│   ├── exports.test.ts                    # Dual-export contract (static + dist/ bundle smoke test)
│   └── prepareEmojiLibJson.test.ts        # `it.skip`-guarded regenerator
│
├── dist/                              # Vite output (git-ignored, npm-published)
│   ├── index.js
│   ├── index.d.ts
│   └── *.map
│
├── docker/local/                      # Dev container Docker Compose + Dockerfile
├── .devcontainer/                     # VS Code Dev Container config (uses docker/local/)
│
├── .github/
│   ├── workflows/
│   │   ├── code_check.yml                       # PR: biome check + test
│   │   ├── pull_request_check.yml               # PR: title/body length + size labels
│   │   ├── release_and_publish.yml              # PR merge → bump version, build, publish
│   │   ├── check_packages_versions.yml          # Weekly: open deps PR via ncu
│   │   ├── check_and_merge_packages_upgrades_pr.yml  # Auto-merge that PR if green
│   │   ├── check_branches_state.yml             # Stale branch report
│   │   └── cleanup_caches.yml                   # GHA cache GC
│   └── scripts/
│       ├── get_github_release_log.sh            # Build release notes from git log
│       └── get_packages_upgrades.sh             # Format ncu output for the PR body
│
├── .agents/                           # AI agent skills, commands, subagents
│   ├── README.md
│   ├── skills/
│   ├── commands/
│   └── agents/
├── .claude/ → .agents                 # Symlink (Claude Code looks here natively)
│
├── docs/                              # This documentation
└── tmp/                               # Git-ignored scratch space
```

## `src/index.ts` walkthrough

### Imports

```ts
import { EmojiLibJsonType, EmojiParseOptionsType, EmojiType, TwemojiEntity, UEmojiParserType } from './lib/type'
import emojiLibJson from './lib/emoji-lib.json'
import { parse } from '@twemoji/parser'
```

`emoji-lib.json` is imported as a typed JSON module (`resolveJsonModule: true` in `tsconfig.json`) and cast to `EmojiLibJsonType`. There is **no** runtime construction of the catalog — it's literally a `.json` import.

### Constants

```ts
export const DEFAULT_EMOJI_CDN: string = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/'
export const emojiLibJsonData: EmojiLibJsonType = emojiLibJson
```

`DEFAULT_EMOJI_CDN` is the URL prefix Twemoji's `parse()` produces. Custom CDNs work by string-replacing this prefix in `__parseEmojiToHtml`.

### The `uEmojiParser` object

Six methods, each described below. `getEmojiObjectByShortcode` and `getDefaultOptions` are public (typed in `UEmojiParserType`) but rarely used directly.

#### `getEmojiObjectByShortcode(shortcode)`

Two-tier lookup:

1. Strip `:` from the shortcode
2. **Direct hit** on `emojiLibJsonData[shortcode]` — fast path for canonical slugs (`smiling_face_with_sunglasses`)
3. **Keyword scan** — `Object.keys(...).find(k => emojiLibJsonData[k].keywords.includes(shortcode))` — fallback for dialects like `:thumbsup:` (Slack/legacy) that aren't the slug

This is what makes Slack-style aliases coexist with the canonical slugs in a single catalog.

#### `getDefaultOptions(options)`

Merges user options with defaults. Subtle detail: it uses `Object.getOwnPropertyDescriptor(options, 'emojiCDN')` to distinguish "explicitly undefined" from "missing". For booleans (`parseToHtml`, `parseToUnicode`, `parseToShortcode`) it just calls `Boolean(...)` because `undefined → false` is the right default for those.

Defaults: `parseToHtml: true`, `parseToUnicode: false`, `parseToShortcode: false`, `emojiCDN: undefined`.

#### `__parseEmojiToHtml(text, emojiCDN)`

Internal (note the `__` prefix, though it's exported — it's a JS-style "please don't call this" marker, not a hard private):

1. Run `@twemoji/parser`'s `parse(text)` to get `Array<TwemojiEntity>` (each has `text`, `url`, `indices`, `type`)
2. Track `entitiesFound` to avoid replacing the same emoji twice
3. For each entity: rewrite the URL prefix if `emojiCDN` is set, then `text.replace(new RegExp(entity.text, 'g'), <img...>)` to swap all occurrences

Output: `<img class="emoji" alt="<unicode>" src="<url>"/>` — see [API Reference → HTML output contract](API_REFERENCE.md).

#### `parseToHtml(text, emojiCDN?)`

Convenience: runs `parseToUnicode` first (so `:smile:` becomes `🙂` first), then hands off to `__parseEmojiToHtml`. **Always** runs unicode resolution first — Twemoji only sees unicode characters.

#### `parseToUnicode(text)`

Match `/:(\w+):/g` to find shortcodes, look each one up via `getEmojiObjectByShortcode`, replace with `emoji.char`. Linear scan over matches; one regex per shortcode found.

#### `parseToShortcode(text)`

Builds a single alternation regex from `Object.keys(emojiLibJsonData).join('|')`, escapes the `*️⃣` keycap (it has special regex characters), then `text.matchAll` to find every emoji and replace with `:slug:`. The escape is load-bearing — without it, the regex compiles but corrupts the keycap match.

#### `parse(text, options)`

The dispatcher:

```ts
if (typeof text !== 'string') throw new Error('The text parameter should be a string.')

if (!opts.parseToHtml && opts.parseToShortcode) text = parseToShortcode(text)
if (opts.parseToHtml || opts.parseToUnicode) text = parseToUnicode(text)
if (opts.parseToHtml) text = __parseEmojiToHtml(text, opts.emojiCDN)
```

Order matters: shortcode → unicode → HTML. Each stage is a no-op if its option is off.

### CommonJS reattachment

```ts
export default uEmojiParser
module.exports = uEmojiParser
module.exports.emojiLibJsonData = emojiLibJsonData
module.exports.DEFAULT_EMOJI_CDN = DEFAULT_EMOJI_CDN
```

Vite's library `commonjs` output exposes the default export as `module.exports.default`, which would break `require('universal-emoji-parser').parse(...)`. The three `module.exports` assignments at the bottom flatten the API so `require` and `import` users see the same shape. The reattachment now runs inside a `try/catch` so it harmlessly no-ops under ESM and Vitest (where `module` isn't a CommonJS binding). Every `export const` declared at the top of `src/index.ts` must be reattached here too, otherwise it ships as `undefined` to CommonJS consumers (regression-tested in `test/exports.test.ts`).

## Type model — `src/lib/type.ts`

```ts
export interface EmojiType {
  name: string // "smiling face with sunglasses"
  slug: string // "smiling_face_with_sunglasses" (canonical shortcode)
  group: string // "Smileys & Emotion"
  emoji_version: string // "1.0"
  unicode_version: string // "1.0"
  skin_tone_support: boolean
  char: string // "😎" — the unicode literal
  keywords: Array<string> // ["smiling_face_with_sunglasses", "cool", "summer", ...]
  keyword_index_found?: number // Used by the regenerator only — don't rely on it
}

export interface EmojiLibJsonType {
  [key: string]: EmojiType // keyed by emoji char (the unicode literal)
}

export interface EmojiParseOptionsType {
  emojiCDN?: string
  parseToHtml?: boolean
  parseToUnicode?: boolean
  parseToShortcode?: boolean
}

export interface UEmojiParserType {
  getEmojiObjectByShortcode: (shortcode: string) => EmojiType | undefined
  getDefaultOptions(options?: EmojiParseOptionsType): EmojiParseOptionsType
  __parseEmojiToHtml(text: string, emojiCDN?: string): string
  parseToHtml: (text: string, emojiCDN?: string) => string
  parseToUnicode: (text: string) => string
  parseToShortcode: (text: string) => string
  parse: (text: string, options?: EmojiParseOptionsType) => string
}

export interface TwemojiEntity {
  url: string
  indices: Array<number>
  text: string
  type: string
}
```

The catalog is **keyed by unicode literal**, not by slug. That's because the regenerator pipeline starts from `unicode-emoji-json` (whose keys are unicode) and merges keywords from `emojilib` (whose keys are also unicode). Looking up by slug requires the two-tier scan in `getEmojiObjectByShortcode`.

## The regeneration pipeline

`test/prepareEmojiLibJson.test.ts` is the **only** sanctioned way to rebuild `src/lib/emoji-lib.json`. The test is `it.skip`-guarded so it never runs on CI:

1. Load `unicode-emoji-json` (1906 emojis with metadata: name, slug, group, version)
2. Load `emojilib` (1898 emojis with curated keyword arrays)
3. For each emoji in `unicode-emoji-json`:
   - Set `char` to the key
   - Use `emojilib` keywords if present, else `[slug]`
   - Ensure the slug is in keywords (unshift if missing)
   - Apply `EMOJIS_SPECIAL_CASES` overrides (include/exclude)
4. **Deduplicate keywords** across emojis — the same keyword can appear on multiple emojis (e.g., `coffee` on `☕` and `🤎`). The algorithm picks the emoji with the lowest `keyword_index_found` (i.e., where the keyword is most prominent) and removes it from the rest. This is O(n²) but only runs at regeneration time
5. Write to `src/lib/emoji-lib-output.json`

After regeneration:

- Diff `emoji-lib-output.json` vs `emoji-lib.json` to review changes
- Copy the new contents to `emoji-lib.json` (the runtime source)
- Update `TOTAL_EMOJIS` in `emojiLibJson.test.ts` if the count changed
- Commit both files together

See [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md) for the full workflow.

## Special cases (`EMOJIS_SPECIAL_CASES`)

The regenerator applies hand-curated keyword overrides for a handful of emojis where the upstream `emojilib` keywords are wrong, missing, or collide with another emoji. Current entries:

| Emoji | Include                                | Exclude           | Why                                                                               |
| ----- | -------------------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| `☕`  | `coffee`                               | —                 | `emojilib` has it, but the dedup loop would otherwise hand `coffee` to `🤎` first |
| `🤎`  | —                                      | `coffee`          | Brown heart should not match `:coffee:`                                           |
| `❤️`  | `heart`                                | —                 | The plain red heart is the canonical `:heart:`                                    |
| `💘`  | —                                      | `heart`           | Heart-with-arrow shouldn't steal `:heart:`                                        |
| `👮‍♀️`  | `policewoman`, `female-police-officer` | `legal`, `arrest` | Common Slack aliases; remove ambiguous keywords                                   |
| `✅`  | `white_check_mark`                     | —                 | GitHub-flavored alias                                                             |
| `⏸️`  | `double_vertical_bar`                  | —                 | Niche but supported                                                               |

Add new entries by editing `EMOJIS_SPECIAL_CASES` in `prepareEmojiLibJson.test.ts` and regenerating.

## Build configuration

### Vite (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['cjs'],          // CommonJS — see "CommonJS reattachment" above
      fileName: () => 'index.js',
    },
    minify: 'esbuild',
    emptyOutDir: true,           // wipes dist/ on each build
    // @twemoji/parser is NOT externalized — it is inlined into the bundle (zero runtime deps)
  },
})
```

Single-entry, single-output. Vite compiles TypeScript with esbuild. Because `@twemoji/parser` is left as a normal (non-`external`) import, Vite bundles it into `dist/index.js`, so the published package has **zero runtime dependencies**. Type declarations are produced separately by `tsc` (`pnpm run build:types`), not by Vite.

### TypeScript (`tsconfig.json`)

Highlights:

- `strictNullChecks: true`
- `noImplicitAny: true`
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `declaration: true` — emits `.d.ts` so consumers get types
- `module: 'commonjs'`, `moduleResolution: 'node'`
- `lib: ['es6', 'dom']` — includes DOM types because consumers may use this in the browser
- `resolveJsonModule: true` — required to `import emojiLibJson from './lib/emoji-lib.json'`

Vite emits the runtime bundle; `tsc` is used only to emit type declarations (`pnpm run build:types`) and as a `--noEmit` type-check gate (`pnpm run build:tsc`).

### pnpm scripts

| Script                            | Runs                                                                  | Purpose                       |
| --------------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| `dev`                             | `nodemon --exec tsx src/index.ts`                                    | Watch-run a smoke script      |
| `build`                           | `vite build && tsc -p tsconfig.build.json --emitDeclarationOnly`     | Production bundle + `.d.ts`    |
| `build:dev`                       | `vite build --mode development`                                      | Unminified bundle             |
| `build:types`                     | `tsc -p tsconfig.build.json --emitDeclarationOnly`                  | Emit `.d.ts` declarations      |
| `build:tsc`                       | `tsc -p tsconfig.build.json --noEmit`                              | Type-check only (no output)   |
| `test`                            | `vitest run`                                                        | Run all specs                 |
| `test:watch`                      | `vitest`                                                            | TDD inner loop (watch mode)   |
| `biome:check`                     | `biome check`                                                       | Lint + format (CI gate)       |
| `biome:fix` / `biome:fix:unsafe`  | `biome check --write` / `--write --unsafe`                          | Auto-fix lint + format        |
| `release`                         | `bash .github/scripts/prepare_release.sh` (Node patch bump + commit + tag) | Bump version (CI-only)  |
| `ncu:check` / `ncu:upgrade`       | `npm-check-updates`                                                 | Dep upgrade pipeline          |

## CI/CD pipeline

The release flow (`.github/workflows/release_and_publish.yml`) is triggered on `pull_request: closed` with `merged == true` against `main`:

```
PR merged to main
       │
       ▼
check_pr_size_label   (XS / S / M / L / XL / XXL based on lines changed)
       │
       ▼
notify_on_channel_start  (DailyBot Slack-like notification)
       │
       ▼
deploy_setup            (corepack pnpm install with cache)
       │
       ▼
deploy_validate_linters_and_code_format   (corepack pnpm run biome:check)
       │
       ▼
deploy_tests            (corepack pnpm test → vitest run)
       │
       ▼
build                   (corepack pnpm run build → vite + tsc declarations → dist/)
       │
       ▼
release_and_publish     (prepare_release.sh bump + push tag + create GH release + pnpm publish)
       │
       ▼
cleanup_caches  +  notify_on_channel_end
```

Every job runs on `ubuntu-latest` with Node 24 (pinned 24.16.0) and Corepack-provisioned pnpm 11.1.2, with aggressive caching of the pnpm store and `node_modules`. The release job uses `secrets.AUTOMATION_GITHUB_TOKEN` (push + tag) and `secrets.NPM_TOKEN` (npm publish). The DailyBot identity (`🤖 DailyBot <ops@dailybot.com>`) is hardcoded.

Detailed walkthrough: **[Build & Deploy](BUILD_DEPLOY.md)**.

## Mental model summary

1. **Two-file runtime.** `src/index.ts` + `src/lib/emoji-lib.json`. Everything else is build/test/CI.
2. **The catalog is generated, not authored.** Edit `EMOJIS_SPECIAL_CASES` and regenerate; never hand-edit the JSON.
3. **Zero runtime dependencies.** `@twemoji/parser` is inlined into the bundle by Vite, so consumers install nothing transitively. Adding a real runtime dependency (or externalizing the inlined one) requires justification — it ships to consumer bundles.
4. **Dual ESM/CommonJS shape.** The `module.exports` reattachment at the bottom of `src/index.ts` is non-negotiable.
5. **HTML output is a contract.** `<img class="emoji" alt="<unicode>" src="<url>"/>` — exactly that shape, forever (until a major bump).
6. **CI owns the release.** Humans never run `pnpm run release` or `pnpm publish`. The merge to `main` is the release trigger.
