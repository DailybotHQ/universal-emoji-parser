---
name: typescript-strict-style
description: TypeScript strictness rules enforced by tsconfig.json (strict) + Biome (biome.json), plus the patterns the existing code follows
---

# Skill: `typescript-strict-style`

A reference for the TypeScript style enforced in Universal Emoji Parser. Read this when adding new code to `src/` or when Biome complains about something you didn't expect.

For the prose version (rules + rationale), see [`docs/STANDARDS.md`](../../docs/STANDARDS.md). This skill focuses on patterns and idioms.

## tsconfig.json key settings

```json
{
  "strictNullChecks": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "declaration": true,
  "module": "commonjs",
  "moduleResolution": "node",
  "esModuleInterop": true,
  "resolveJsonModule": true,
  "downlevelIteration": true,
  "skipLibCheck": true,
  "removeComments": true
}
```

Implications for new code:

| Setting                                 | What it forces                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `strictNullChecks: true`                | Every nullable union (`T \| undefined`) must be handled with `?.`, `??`, narrowing, or explicit type guard |
| `noImplicitAny: true`                   | Every parameter/return must be annotated or inferable                                                      |
| `noUnusedLocals` / `noUnusedParameters` | Dead code fails the build. Prefix unused params with `_` if you must keep them (rare)                      |
| `declaration: true`                     | `build:types` (`tsc -p tsconfig.build.json --emitDeclarationOnly`) emits `.d.ts` for every public export — keep return types stable |
| `resolveJsonModule: true`               | `import emojiLibJson from './lib/emoji-lib.json'` works                                                    |
| `removeComments: true`                  | Comments in `dist/index.js` are stripped at build time. JSDoc still appears in `.d.ts`                     |

`strict` itself isn't on (would also enable `strictFunctionTypes`, `strictPropertyInitialization`, etc.). The granular settings above are the explicit subset.

## Patterns from the existing code

### Typed module-level constants

```ts
export const DEFAULT_EMOJI_CDN: string = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/'
export const emojiLibJsonData: EmojiLibJsonType = emojiLibJson
```

Even where TypeScript can infer the type, **public exports are annotated explicitly**. This stabilizes the `.d.ts` output — a future change that affects inference (e.g., switching the JSON catalog to a different shape) doesn't silently shift the public types.

For internal constants (`const x = 5` inside a function), inference is fine.

### Object-literal "class" pattern

```ts
const uEmojiParser: UEmojiParserType = {
  getEmojiObjectByShortcode(shortcode: string): EmojiType | undefined { ... },
  getDefaultOptions(options?: EmojiParseOptionsType): EmojiParseOptionsType { ... },
  __parseEmojiToHtml(text: string, emojiCDN?: string): string { ... },
  parseToHtml(text: string, emojiCDN?: string): string { ... },
  // ...
}
```

The package uses an object literal annotated with the interface, not a class. Reasons:

- The "instance" is a singleton — there's no construction. A class with `static` methods would work but adds ceremony
- TypeScript's interface conformance check verifies all methods are present
- The dual-export shape (`module.exports = uEmojiParser`) works naturally with object literals

When adding a new method, declare it on the interface in `src/lib/type.ts` first, then add the implementation. TypeScript will surface the missing method as an error, which you can fix by adding it.

### Method signatures with explicit types

```ts
parseToHtml(text: string, emojiCDN?: string): string {
```

Not:

```ts
parseToHtml(text, emojiCDN) {  // ❌ noImplicitAny error
```

Or:

```ts
parseToHtml(text: string, emojiCDN?: string) {  // works but inferred return type may drift
```

Always annotate parameters and return types on public methods.

### `this` inside methods

```ts
parseToHtml(text: string, emojiCDN?: string): string {
  text = this.parseToUnicode(text)
  return this.__parseEmojiToHtml(text, emojiCDN)
}
```

`this` refers to the object literal. TypeScript types `this` correctly because of the `UEmojiParserType` annotation on the const declaration. If you destructure a method (`const { parseToHtml } = uEmojiParser`), `this` is lost — but consumers normally call via the object, so this isn't a real issue.

### Optional parameters with defaults

```ts
getDefaultOptions(options?: EmojiParseOptionsType): EmojiParseOptionsType {
  options = {
    emojiCDN: options && Object.getOwnPropertyDescriptor(options, 'emojiCDN')
      ? String(options.emojiCDN)
      : undefined,
    parseToHtml: options && Object.getOwnPropertyDescriptor(options, 'parseToHtml')
      ? Boolean(options.parseToHtml)
      : true,
    parseToUnicode: options ? Boolean(options.parseToUnicode) : false,
    parseToShortcode: options ? Boolean(options.parseToShortcode) : false,
  }
  return options
}
```

The pattern: accept `options?: T`, build a fully-populated result, return it. **Don't** mutate the input — the function builds a new object every call.

The `Object.getOwnPropertyDescriptor` trick is documented in [`docs/STANDARDS.md`](../../docs/STANDARDS.md#object-option-merge-pattern). It distinguishes "explicitly undefined" from "not passed."

### Internal helpers prefixed with `__`

```ts
__parseEmojiToHtml(text: string, emojiCDN?: string): string { ... }
```

Two underscores at the front mark this as **conventionally private** — implementation detail, may change without notice. It's still typed in `UEmojiParserType` (so it's reachable through the public API), but the prefix tells consumers "use the public method instead."

JavaScript / TypeScript don't have a hard `private` for object literals. The underscore is the convention.

### Type imports separate from value imports

```ts
import { EmojiLibJsonType, EmojiParseOptionsType, EmojiType, TwemojiEntity, UEmojiParserType } from './lib/type'
import emojiLibJson from './lib/emoji-lib.json'
import { parse } from '@twemoji/parser'
```

Notice the `type.ts` import is grouped with other value-style imports, even though only types come from it. TypeScript handles this fine — the types are erased at compile time.

For stricter projects you could write:

```ts
import type { EmojiLibJsonType, EmojiParseOptionsType, ... } from './lib/type'
```

The `type` modifier ensures the import is type-only, so TypeScript can elide it in the emitted JS. The package doesn't use this — it works either way. If you add `import type` for new files, that's fine; don't refactor existing imports just for consistency.

### `interface` over `type` for public types

`type.ts` uses `interface` for every public type:

```ts
export interface EmojiType {
  name: string
  slug: string
  // ...
}
```

Reasons:

- Interfaces support **declaration merging** — consumers can extend in their own `.d.ts`
- TypeScript error messages reference interface names cleanly
- IDE hover shows "interface" — signals "part of the API"

Reserve `type` for unions and mapped types:

```ts
type EmojiKey = keyof EmojiLibJsonType // mapped from another type
type ParseResult = string | undefined // union — no interface possible
```

### Index signatures on the catalog type

```ts
export interface EmojiLibJsonType {
  [key: string]: EmojiType
}
```

The catalog is `{ [unicode_char]: EmojiType }`. The index signature handles arbitrary string keys.

Trade-off: TypeScript can't tell you "the key 😎 exists" at compile time — every lookup is `EmojiType | undefined`. The runtime code handles the undefined case via `?.char` checks.

### `Array<T>` vs `T[]`

The codebase uses `Array<T>`:

```ts
keywords: Array<string>
const entitiesFound: Array<string> = []
```

Biome's `useConsistentArrayType` could enforce one or the other. It's not enabled, so both work. **For consistency, use `Array<T>` in new code** — it matches the existing style.

### Optional fields with `?:`

```ts
export interface EmojiType {
  // ...
  keyword_index_found?: number
}
```

The `?:` makes the field optional in the interface. This emits the field as `keyword_index_found?: number` in the `.d.ts` — consumers know it might be missing.

Use sparingly — every optional field is a value the consumer has to handle.

## Biome rules in detail

Lint and format are unified under **Biome 2.4.x** with a single config, `biome.json` (it replaced the old `eslint.config.mjs` + `.prettierrc` + `typescript-eslint` setup). Run:

```bash
npm run biome:check        # biome check — lint + format check (CI gate)
npm run biome:fix          # biome check --write — safe auto-fix
npm run biome:fix:unsafe   # biome check --write --unsafe — includes unsafe fixes
```

Notable rule configuration in `biome.json`:

```jsonc
{
  // lint
  "noConsole": "error",     // src/ only — overridden off in test/**
  "noCommonJs": "off",      // the dual-export module.exports tail is intentional
  "noExplicitAny": "off",   // `any` allowed where justified
  // formatter
  "semicolons": "asNeeded", // no trailing semicolons
  "quoteStyle": "single",
  "trailingCommas": "es5",
  "lineWidth": 120
}
```

### `noConsole: error` (src only, off in `test/**`)

`console.*` is an error in `src/`. The package is a library — calling `console.log` from inside it leaks log lines into every consumer's output.

Biome scopes this with an override: `noConsole` is **off in `test/**`**, so tests can use `console.log` freely for debugging. Still, remove throw-away logging before committing.

### `noExplicitAny: off`

`any` is allowed. Use sparingly — it bypasses the type system. When you must use it, leave a comment explaining why. Biome won't flag it, but reviewers will ask.

### Non-null assertion (`x!`) allowed

Biome doesn't forbid the non-null assertion. Use sparingly — it bypasses the type system. The current codebase uses it in the regenerator's dedup loop:

```ts
emojiLibJson[emojiObjectFound.char].keywords.splice(emojiObjectFound.keyword_index_found!, 1)
```

…where `keyword_index_found` is typed as `number | undefined` but the code's logic guarantees it's set. The alternative would be a `requireNotNull` helper, which adds complexity for a one-off case.

For new code, **prefer `?.` and `??`** over `!`. Reach for `!` only when:

- The invariant is genuinely guaranteed by surrounding logic
- Adding a runtime check would obscure the algorithm

### `// @ts-*` comments

`// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck` are allowed. Don't abuse them — they're for unavoidable interop, not for silencing real type errors.

### Inferrable type annotations

Biome doesn't flag `const x: number = 5` as redundant. We keep explicit annotations because:

- Public exports always annotate types explicitly (stability)
- Even local annotations can clarify intent for human readers

You decide case-by-case.

### `noCommonJs: off`

The dual-export tail in `src/index.ts` assigns to `module.exports` directly. Biome's `noCommonJs` would normally flag this, so it's turned **off** — the CommonJS reattachment is load-bearing (see [`emoji-parser-conventions`](emoji-parser-conventions.md)).

### Suppressing a Biome rule inline

Use a `// biome-ignore` comment with the rule path and a reason (the old `// eslint-disable-line` syntax no longer applies):

```ts
// biome-ignore lint/suspicious/noExplicitAny: upstream type is untyped
function f(x: any): void { ... }
```

The reason after the colon is mandatory — Biome errors on a `biome-ignore` without one.

## Formatter (semicolons, quotes, trailing commas)

Biome's formatter is configured in `biome.json` and replaces Prettier. The style is **unchanged** from the old Prettier setup:

| Setting                | Effect                                                                     |
| ---------------------- | -------------------------------------------------------------------------- |
| `semicolons: asNeeded` | No trailing semicolons (Biome inserts a leading `;` only on ASI hazard)   |
| `quoteStyle: single`   | `'...'` for strings, `` `...` `` for templates. Never `"..."`              |
| `trailingCommas: es5`  | Trailing comma in multi-line arrays/objects, but **not** in function calls |
| `lineWidth: 120`       | Reflows past 120 columns                                                   |

Examples:

```ts
const x = 1                    // ✅ no semicolons
const y = 2                    // ✅

;[x, y].forEach(n => ...)      // ✅ — leading semi when ASI hazard

const arr = [
  'a',
  'b',
  'c', // ✅ trailing comma in array
]

const obj = {
  a: 1,
  b: 2, // ✅ trailing comma in object literal
}

fn('a', 'b', 'c') // ✅ no trailing comma in function call (es5 rule)
```

Biome inserts the leading `;` automatically when needed (e.g., before a line starting with `(`, `[`, or `+`). Don't add semicolons by hand.

`.editorconfig` adds:

```
indent_style = space
indent_size = 2
end_of_line = lf
max_line_length = 120
```

Biome respects the 120 limit when reflowing.

## Common Biome / TypeScript fixes

### "TS6133: 'X' is declared but its value is never read"

Either remove the declaration or use it. If you're keeping it intentionally (e.g., as a parameter for interface conformance), prefix with `_`:

```ts
function noOp(_unused: string): void {
  // genuinely doesn't use _unused
}
```

### "TS2532: Object is possibly 'undefined'"

`strictNullChecks` is fighting you. Options:

```ts
// 1. Optional chaining
emojiLibJsonData[shortcode]?.char

// 2. Default value
emojiLibJsonData[shortcode]?.char ?? ''

// 3. Type guard
const entry = emojiLibJsonData[shortcode]
if (entry) {
  return entry.char
}

// 4. Non-null assertion (last resort)
emojiLibJsonData[shortcode]!.char
```

### "TS7006: Parameter 'X' implicitly has an 'any' type"

Annotate it:

```ts
function f(x: string): void { ... }    // ✅
```

Or, if the type is genuinely unknown, use `unknown` and narrow:

```ts
function f(x: unknown): void {
  if (typeof x === 'string') {
    // x is string here
  }
}
```

### "noConsole" violation

Remove the `console.log`. If you really need logging, the package doesn't ship a logger. Open an issue if the use case is real. (Reminder: `noConsole` is off in `test/**`, so this only fires in `src/`.)

### Formatter violation

Run `npm run biome:fix`. If the auto-fix produces something you don't like, the disagreement is between your editor and Biome; configure your editor to use the Biome formatter.

## Type-driven refactors

### Adding a new option

1. Add the field to `EmojiParseOptionsType` in `src/lib/type.ts`:
   ```ts
   export interface EmojiParseOptionsType {
     // ...
     myNewOption?: boolean
   }
   ```
2. Update `getDefaultOptions` to merge it with a default
3. Update `parse` to act on it
4. Update `docs/API_REFERENCE.md`
5. Tests for both the default and the explicit value

### Adding a new method

1. Add the signature to `UEmojiParserType` in `src/lib/type.ts`
2. TypeScript flags `uEmojiParser` as missing the method — fix by adding the implementation
3. Tests
4. Update `docs/API_REFERENCE.md`

### Changing a return type

This is a breaking change in the `.d.ts`. Treat as a major bump unless:

- The new return type is a subtype (no consumer code breaks)
- The change is internal only (a method prefixed with `__`)

## What we don't enforce

- **No JSDoc lint** — JSDoc is welcome but not required. The current `src/index.ts` is light on JSDoc; adding more is welcome
- **No file-name lint** — `index.ts`, `type.ts`, `emoji-lib.json` follow conventions but no rule enforces them
- **No max-function-length** — functions in `src/index.ts` are all small; if one grows huge, prefer splitting on its own merits

## Future hardening ideas

If you wanted to harden the TypeScript setup further:

- Enable full `strict: true` (would also activate `strictFunctionTypes`, `strictPropertyInitialization`, `alwaysStrict`)
- Turn on Biome's `noExplicitAny` as `error` instead of off
- Enable additional Biome correctness/suspicious rules beyond the recommended set
- Require explicit return types on every exported function via a Biome rule or a stricter `tsconfig` boundary check

These are nice-to-have but not necessary for the current code's quality. If you adopt any, expect a ~50-line diff in `src/index.ts` to clean up.
