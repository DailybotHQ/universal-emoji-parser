# Standards

Canonical coding rules for Universal Emoji Parser. Every contributor (human or agent) must follow these. Biome handles most details automatically (lint + format in one tool) — these standards cover decisions tools cannot make.

## Language

- **English only** for code, identifiers, comments, JSDoc, commit messages, branch names, and PR descriptions
- Emoji shortcodes (`:smile:`, `:thumbs_up:`) are **data**, not language. Their casing/naming follows the emoji catalog, not English convention

## TypeScript

### Strict by default

`tsconfig.json` enforces:

- `strictNullChecks: true` — every nullable union must be handled (`?.`, `??`, narrowing, or explicit type guard)
- `noImplicitAny: true` — every parameter and return type must be inferable or annotated
- `noUnusedLocals: true`, `noUnusedParameters: true` — dead code fails the build
- `declaration: true` — every public export gets a `.d.ts` entry

If you need `any`, prefer `unknown` and narrow. Biome's `noExplicitAny` is **off** in this repo, but treat `any` as a last resort and explain why when you reach for it.

### Explicit return types on exports

```ts
// ✅ exported — annotate
export function parseToHtml(text: string, emojiCDN?: string): string { ... }

// ✅ internal helper — inference is fine
const formatEntity = (e: TwemojiEntity) => `<img src="${e.url}"/>`
```

This keeps the public `.d.ts` stable across minor refactors.

### Interfaces over type aliases for public types

`type.ts` uses `interface` for `EmojiType`, `EmojiLibJsonType`, `EmojiParseOptionsType`, etc. Reasons:

- Interfaces support declaration merging (consumers can extend in their own `.d.ts` if needed)
- TypeScript error messages reference interface names cleanly
- They show up as "interface" in IDE hover tooltips, signaling "this is part of the API"

Reserve `type` for unions and mapped types: `type EmojiKey = keyof typeof emojiLibJsonData`.

## Naming

| Element                     | Convention                                  | Example                                                     |
| --------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Source file                 | `camelCase.ts` matching the dominant export | `emojiLibJson.test.ts`, `index.ts`, `type.ts`               |
| Test file                   | `<subject>.test.ts`                         | `main.test.ts`, `emojiLibJson.test.ts`                      |
| Class / interface           | `PascalCase`                                | `EmojiType`, `UEmojiParserType`                             |
| Function (top-level)        | `camelCase`                                 | `parseToHtml`, `getEmojiObjectByShortcode`                  |
| Internal "private" function | `__camelCase` (double underscore prefix)    | `__parseEmojiToHtml`                                        |
| Constant (compile-time)     | `SCREAMING_SNAKE_CASE`                      | `DEFAULT_EMOJI_CDN`, `EMOJIS_SPECIAL_CASES`, `TOTAL_EMOJIS` |
| Local variable              | `camelCase`                                 | `entitiesFound`, `emojiUrl`                                 |
| Catalog slug                | `snake_case`                                | `smiling_face_with_sunglasses`                              |

The `__` prefix on `__parseEmojiToHtml` is a JavaScript-era marker meaning "implementation detail, may change without notice". TypeScript's actual `private` modifier doesn't apply because we use a plain object literal, not a class.

## Module structure (`src/index.ts`)

Order in this exact sequence:

1. **External imports** — packages from `node_modules` (`@twemoji/parser`)
2. **Internal imports** — relative paths (`./lib/type`, `./lib/emoji-lib.json`)
3. **Constants** — `export const DEFAULT_EMOJI_CDN`, `export const emojiLibJsonData`
4. **The main object** — `const uEmojiParser: UEmojiParserType = { ... }`
5. **Default export** — `export default uEmojiParser`
6. **CommonJS reattachment** — `module.exports = uEmojiParser; module.exports.emojiLibJsonData = emojiLibJsonData`

The CommonJS reattachment is **mandatory** — see [Architecture → CommonJS reattachment](ARCHITECTURE.md#commonjs-reattachment). Don't move it, don't delete it, don't refactor around it.

## Public API discipline

The public surface is:

```ts
// from src/index.ts
export const DEFAULT_EMOJI_CDN: string
export const emojiLibJsonData: EmojiLibJsonType
export default uEmojiParser     // UEmojiParserType — 7 methods

// from src/lib/type.ts (re-exported via .d.ts)
export interface EmojiType
export interface EmojiLibJsonType
export interface EmojiParseOptionsType
export interface UEmojiParserType
export interface TwemojiEntity
```

Rules:

1. **Don't add new top-level exports.** Extend `uEmojiParser` instead — that's how consumers expect to find new functionality
2. **Don't change method signatures.** Adding optional parameters is OK; reordering, renaming, or changing return types is a major bump
3. **Don't change the HTML output template.** `<img class="emoji" alt="..." src="..."/>` is a contract — see [API Reference](API_REFERENCE.md)
4. **Don't break dual ESM/CommonJS.** Both `import` and `require` consumers must keep working
5. **Don't expose internal helpers.** If something's prefixed with `__`, it's internal. If you add a new helper, mark it the same way

## Formatting (Biome)

Configured in `biome.json` (Biome formats and lints in one tool):

```jsonc
// biome.json (formatter-relevant settings)
{
  "javascript": { "formatter": { "semicolons": "asNeeded", "quoteStyle": "single", "trailingCommas": "es5" } },
  "formatter": { "lineWidth": 120 }
}
```

In short: no semicolons, single quotes, ES5 trailing commas. Implications:

```ts
// ✅ no semicolons (except where ASI hazards exist — Biome inserts a leading semi)
const x = 1
const y = 2

// ✅ single quotes for strings; backticks for templates
const a = 'hello'
const b = `hello, ${name}`

// ✅ trailing comma in multi-line arrays/objects (es5: not in function calls)
const arr = ['a', 'b', 'c']
fn('a', 'b', 'c') // ✅ no trailing comma in function call (es5)
```

Auto-fix with `npm run biome:fix`. CI fails on `npm run biome:check`, so always run before committing.

### Line length

`biome.json` sets `lineWidth: 120` (and `.editorconfig` mirrors `max_line_length = 120`). Biome reflows past it when possible (long string literals stay inline). Don't force-wrap shorter lines for cosmetic reasons.

## Linting (Biome)

`biome.json` is the single config for both lint and format. Notable rule choices:

| Rule            | Setting               | Reason                                                                                          |
| --------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `noConsole`     | error in `src/` only  | This is a library — `console.*` in `src/` leaks into consumers. Tests may log freely            |
| `noExplicitAny` | off                   | We sometimes need `any` for interop; treat it as a last resort and comment why                  |
| `noCommonJs`    | off                   | The `module.exports = uEmojiParser` reattachment tail in `src/index.ts` must be allowed         |

Semicolons (`semicolons: "asNeeded"`) and quote style are enforced by the formatter, not as separate lint rules. `.agents/skills/deepworkplan/` is excluded from formatting.

Run `npm run biome:check` before committing; auto-fix is `npm run biome:fix` (or `npm run biome:fix:unsafe` for fixes Biome flags as unsafe — review that diff).

## Comments

- **Don't comment what the code does** — the code already says that
- **Do comment why** when the reason is non-obvious: a workaround, a constraint, an upstream quirk
- **Do JSDoc public methods** with at minimum a one-line description; consumers see this in their IDE hover. The current `src/index.ts` is light on JSDoc — adding more is welcome
- **TODOs:** `// TODO(<owner>): <action>` — never bare `// TODO`. Even better, open an issue and reference it

Examples that are _worth_ keeping:

```ts
// Track processed entities to avoid duplicate replacements when the same emoji
// appears multiple times — Twemoji parse() returns one entry per occurrence
const entitiesFound: Array<string> = []
```

```ts
// Escape the keycap; * has special regex semantics and would corrupt the alternation
regexText = regexText.replace(/\*️⃣/g, '\\*️⃣')
```

Both explain a non-obvious _why_; without them, a reader would think the code was redundant or buggy.

## Object option-merge pattern

The `getDefaultOptions` helper uses an unusual pattern — preserve it:

```ts
emojiCDN: options && Object.getOwnPropertyDescriptor(options, 'emojiCDN')
  ? String(options.emojiCDN)
  : undefined,
parseToHtml: options && Object.getOwnPropertyDescriptor(options, 'parseToHtml')
  ? Boolean(options.parseToHtml)
  : true,
```

Why `Object.getOwnPropertyDescriptor` instead of `options.emojiCDN === undefined`?

Because callers passing `{ emojiCDN: undefined }` should be treated as "explicitly clearing" — and a future signature might want to distinguish "unset" from "undefined". `getOwnPropertyDescriptor` returns `undefined` when the key doesn't exist; truthy when the key is set to _anything_ (including undefined).

For `parseToHtml`/`parseToUnicode`/`parseToShortcode`, the pattern is simpler — `Boolean(options?.parseToHtml)` defaults to `false`, but `parseToHtml`'s default is **true**, hence the `getOwnPropertyDescriptor` check. The other two booleans default to `false`, so `Boolean(options?.x)` is fine.

Don't refactor this to nullish coalescing without verifying every test still passes — the option semantics are subtle.

## Error handling

The package only throws in one place:

```ts
if (typeof text !== 'string') {
  throw new Error('The text parameter should be a string.')
}
```

Rules:

- **The message string is part of the contract.** A test asserts the throw, and consumers may catch by message. Don't reword it
- **Don't add other throws.** Bad input (an unmatched shortcode like `:not_an_emoji:`) is just left as text — it's not an error
- **Never throw asynchronously.** The whole API is synchronous; introducing `Promise.reject` paths is a major change

## Testing standards

See [Testing Guide](TESTING_GUIDE.md). Summary:

- Specs in `test/*.test.ts`, run by Vitest (`vitest run`)
- Import the test API: `import { describe, it, expect } from 'vitest'`
- BDD style: `describe('Test emoji parser', () => { describe('Using default options', () => { it('should ...') })})`
- One behavior per `it` — split if you'd write "and" in the name
- `expect(result).toBe(...)` for primitive equality; `.toEqual(...)` for objects/arrays
- Paste the exact failing input verbatim when adding a regression test — don't summarize

## Catalog discipline

- **Do not edit `src/lib/emoji-lib.json` by hand.** Regenerate via `prepareEmojiLibJson.test.ts`
- **Do not commit `src/lib/emoji-lib-output.json`** — gitignored intentionally
- **Do not export new fields from `EmojiType`** without measuring the bundle-size cost; every field × 1914 entries × every consumer's bundle adds up
- **Do update `EMOJIS_SPECIAL_CASES`** in `prepareEmojiLibJson.test.ts` when a Slack-style alias needs to be supported

See [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md) and [`/add-special-case`](../.agents/commands/add-special-case.md).

## Imports

TypeScript's `noUnusedLocals` (and Biome) flag unused imports. Prefer named imports for clarity:

```ts
// ✅ named — clear what we're using
import { parse } from '@twemoji/parser'

// ✅ default — when the lib's primary export is a single object/value
import emojiLibJson from './lib/emoji-lib.json'

// ❌ namespace — only when truly needed
import * as fs from 'fs' // ✅ this case is fine — we use fs.writeFileSync, fs.existsSync
```

Don't insert blank lines between import groups; let the file flow naturally.

## Visibility

TypeScript classes aren't used here, but the same intent applies via naming:

- **`__name`** — internal, may change without notice
- **`name`** without underscore — public API, signature changes are versioned
- **Type re-exports** — only re-export types from `src/lib/type.ts` that consumers will reasonably use; don't pollute the `.d.ts` with internal helpers

## Versioning

The package follows **Semantic Versioning** loosely:

- **Patch** (`2.0.78` → `2.0.79`) — bug fixes, catalog regenerations, doc-only changes. CI auto-bumps on merge
- **Minor** (`2.0.x` → `2.1.0`) — new methods on `uEmojiParser`, new options, new catalog fields (rare). **Bump manually** before merging
- **Major** (`2.x` → `3.0`) — HTML output template change, default option flip, removed/renamed method, dual-export break, dropped Node version. Reserved for intentional breakage

CI's `npm version patch` is the right default. If a change deserves minor or major, edit `package.json` version manually in the same PR and the workflow's `npm version patch` will fail loudly (you'll need to skip the auto-bump for that release — open an issue in the workflow at that point).

## Build hygiene

- Don't commit `dist/` (gitignored)
- Don't commit `node_modules/` (gitignored)
- Don't commit `package-lock.json` — gitignored intentionally; CI rebuilds from `package.json` + cached `node_modules`. _(If you have strong feelings, open an issue and discuss before changing.)_
- Don't commit `.env` files — gitignored
- Don't commit `git_logs.txt`, `git_logs_output.txt`, `packages_upgrades.txt`, `packages_upgrades_output.txt` — gitignored CI scratch
- Don't commit `src/lib/emoji-lib-output.json` — gitignored

## Don't

- ❌ Hand-edit `src/lib/emoji-lib.json`
- ❌ Add a new runtime dependency without measuring bundle-size impact
- ❌ Change the HTML output template (`<img class="emoji" alt="..." src="..."/>`)
- ❌ Use `console.log` / `console.error` in `src/`
- ❌ Use `==` (use `===` only)
- ❌ Use `!!x` for boolean coercion in option parsing — use `Boolean(x)` (matches existing style)
- ❌ Add semicolons (Biome strips them and errors on them)
- ❌ Use double quotes (`"..."`)
- ❌ Skip `npm run biome:check` before committing
- ❌ Modify `EmojiType` shape without regenerating the catalog and bumping consumer-visible types

## Do

- ✅ Run `npm run test:watch` while editing `src/`
- ✅ Add a regression test for every parsing fix; paste the failing input verbatim
- ✅ Use `npm run biome:fix` before committing
- ✅ Annotate exported function return types explicitly
- ✅ Use `Object.getOwnPropertyDescriptor` for option-merge "explicit-undefined" detection
- ✅ Update `EMOJIS_SPECIAL_CASES` for keyword overrides; never mutate the catalog at runtime
- ✅ Bump deps via `npm run ncu:upgrade` (respects `.ncurc.json`)
- ✅ Write conventional commit messages (`feat:`, `fix:`, `chore:`, etc.)
