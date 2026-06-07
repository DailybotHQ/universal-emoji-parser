---
name: emoji-parser-conventions
description: Deep dive on the parse pipeline, two-tier shortcode lookup, RegExp considerations, and the dual ESM/CommonJS export
---

# Skill: `emoji-parser-conventions`

A reference for the conventions that make Universal Emoji Parser tick. Read this when you're about to make non-trivial changes to `src/index.ts` or when you want to understand _why_ the code looks the way it does.

For day-to-day docs, see [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md). This skill explains the rationale behind the patterns, not the patterns themselves.

## Why this skill exists

The package is intentionally small. With small code, every line is load-bearing — a "tidy" refactor is often a regression. This document captures the reasoning so future contributors don't accidentally undo a deliberate decision.

## The parse pipeline

```
parse(text, options)
  ├── 1. Type guard — throw if text is not a string
  ├── 2. Resolve options via getDefaultOptions()
  ├── 3. If !parseToHtml && parseToShortcode → parseToShortcode(text)
  ├── 4. If parseToHtml || parseToUnicode → parseToUnicode(text)
  └── 5. If parseToHtml → __parseEmojiToHtml(text, emojiCDN)
```

### Why this order

The order matters because each stage transforms the text in a way that affects the next:

- **Shortcodes first** (`parseToShortcode`): only relevant when emitting shortcodes; **never** combined with HTML rendering
- **Unicode resolution** (`parseToUnicode`): converts `:smile:` → 🙂, so HTML rendering only deals with unicode
- **HTML rendering** (`__parseEmojiToHtml`): runs Twemoji's `parse()` on the unicode-resolved text

You can think of it as a pipeline where each stage is optional but the order is fixed.

### Edge case: `parseToHtml: true, parseToShortcode: true`

The condition `if (!parseToHtml && parseToShortcode)` means `parseToShortcode` is **skipped** when `parseToHtml` is true. This is intentional — you can't ask for "convert unicodes to shortcodes" _and_ "render to HTML" at the same time; HTML always wants unicode-to-image.

If a user passes `{ parseToHtml: true, parseToShortcode: true }`, the `parseToShortcode` option is silently ignored. We don't error — we just respect `parseToHtml`'s precedence.

### Edge case: all options false

`{ parseToHtml: false, parseToUnicode: false, parseToShortcode: false }` — every step is skipped, and the function returns the input unchanged. This is technically a no-op, but it's not an error.

## The two-tier shortcode lookup

`getEmojiObjectByShortcode(shortcode)` is the heart of `parseToUnicode`. It does:

```ts
shortcode = shortcode.replace(/:/g, '')

// Tier 1: direct slug hit
if (emojiLibJsonData[shortcode]?.char) {
  return emojiLibJsonData[shortcode]
}

// Tier 2: keyword scan
const emojiUnicode = Object.keys(emojiLibJsonData).find((k) => emojiLibJsonData[k].keywords.includes(shortcode))
return emojiUnicode ? emojiLibJsonData[emojiUnicode] : undefined
```

Wait — but `emojiLibJsonData` is keyed by **unicode emoji char**, not by slug. So how does Tier 1 ever hit?

It doesn't, normally. Tier 1 only hits if `shortcode` is itself a unicode emoji char (e.g., `getEmojiObjectByShortcode('😎')` strips colons, then finds `'😎'` as a top-level key). For real shortcode lookups (`'smile'`, `'thumbsup'`), Tier 1 misses and we fall through to Tier 2.

**Why the two-tier approach?** It's defensive — if someone calls `getEmojiObjectByShortcode('😎')` (passing a unicode char where a shortcode is expected), they still get a sensible answer. The function name suggests "shortcode" but the implementation gracefully handles either input.

**Performance:** Tier 2 is O(M) where M = catalog size (1914). For a single call this is sub-millisecond, but if you're calling `getEmojiObjectByShortcode` in a hot loop, consider caching results.

## The catalog is keyed by unicode, not by slug

This is non-obvious and worth understanding:

```ts
emojiLibJsonData['😎'] // { name: 'smiling face with sunglasses', slug: 'smiling_face_with_sunglasses', ... }
emojiLibJsonData['smiling_face_with_sunglasses'] // undefined
```

The catalog is `{ [unicode_char]: EmojiType }`. To look up by slug, you scan the values.

**Why?** The regenerator pipeline starts from `unicode-emoji-json` (keyed by unicode) and merges keywords from `emojilib` (also keyed by unicode). Both upstream sources are unicode-keyed, so the catalog inherits that.

**Could we add a slug index?** Yes — `{ [slug]: unicode }` — but it would double the bundle size for a marginal speedup. We don't, currently.

## RegExp construction in `parseToShortcode`

```ts
parseToShortcode(text: string): string {
  const emojiLibJsonData: EmojiLibJsonType = emojiLibJson
  const emojisUnicodesList: Array<string> = Object.keys(emojiLibJsonData)
  let regexText: string = `(${emojisUnicodesList.join('|')})`
  regexText = regexText.replace(/\*️⃣/g, '\\*️⃣')
  const regexUnicodes = new RegExp(regexText, 'ig')
  const matches: IterableIterator<RegExpMatchArray> = text.matchAll(regexUnicodes)
  // ...
}
```

Several things to note:

### Why a single alternation?

`(😀|😁|😂|...|🟫)` — 1914 alternates. JavaScript's regex engine handles this fine, but:

- **Construction is O(M)** — every call rebuilds the regex
- **Matching uses NFA-style traversal** — performance depends on input length and pattern overlap

For chat-message-length inputs, this is fast. For megabyte-sized text, it'd be slow — but that's an unrealistic input for an emoji parser.

### The `*️⃣` escape

```ts
regexText = regexText.replace(/\*️⃣/g, '\\*️⃣')
```

The keycap asterisk emoji (`*️⃣`) contains a literal `*` character, which has special regex semantics ("match zero or more of the preceding token"). Without escaping, the alternation `(😀|...|*️⃣|...)` would corrupt to `(😀|...|*️⃣|...)` and the engine would interpret the `*` as a quantifier.

This is a load-bearing line. Don't remove it without verifying every keycap emoji still resolves.

### Why no other escapes?

Almost all emojis are non-ASCII characters that have no special regex meaning. The only ASCII keycap is `*️⃣`. If a future emoji is added that has special regex semantics, this escape needs to be expanded — but Unicode hasn't yet allocated such a character.

## The `entitiesFound` dedup in `__parseEmojiToHtml`

```ts
const entitiesFound: Array<string> = []
entities.forEach((entity: TwemojiEntity) => {
  if (!entitiesFound.includes(entity.text)) {
    entitiesFound.push(entity.text)
    let emojiUrl: string = entity.url
    // ... URL rewrite if emojiCDN ...
    const regex = new RegExp(entity.text, 'g')
    text = text.replace(regex, `<img class="emoji" alt="${entity.text}" src="${emojiUrl}"/>`)
  }
})
```

Why the dedup? `@twemoji/parser`'s `parse()` returns one `TwemojiEntity` per **occurrence** of an emoji, not per unique emoji. If the input has 🚀 three times, `parse()` returns three entries.

If we processed each entry, we'd:

1. First entry: `text.replace(/🚀/g, '<img...>')` — replaces all three at once (because of the `g` flag)
2. Second entry: `text.replace(/🚀/g, '<img...>')` — but there are no 🚀s left; the `<img>` tags don't get matched. Harmless but wasteful
3. Third entry: same as second — wasteful

The dedup ensures we only do the replace once per unique emoji. Saves work; doesn't change correctness.

## The `__` prefix on `__parseEmojiToHtml`

```ts
__parseEmojiToHtml(text: string, emojiCDN?: string): string { ... }
```

Two underscores at the front mark this as **internal** — implementation detail, may change without notice. It's still part of `UEmojiParserType`, so it's reachable from the typed API, but the prefix signals "consumers should use `parseToHtml` instead."

JavaScript / TypeScript don't have a hard `private` for object literals; this is a naming convention. It's documented in [`docs/STANDARDS.md`](../../docs/STANDARDS.md#naming).

If you add a new internal helper to the `uEmojiParser` object, prefix it the same way.

## The dual ESM/CommonJS export

```ts
export default uEmojiParser
try {
  module.exports = uEmojiParser
  module.exports.emojiLibJsonData = emojiLibJsonData
} catch {
  // no-op under native ESM / Vitest, where `module` is undefined
}
```

These lines **look** redundant. They're not. The `try/catch` lets the same source run under both worlds: at runtime in the Vite-built CJS bundle `module.exports` exists and gets the reattachment; under native ESM or Vitest (where `module` is undefined) the assignment throws and is silently swallowed, leaving the `export default` / named exports to do their job.

### What ESM users get

```ts
import uEmojiParser from 'universal-emoji-parser'
// → uEmojiParser is the default export
import { emojiLibJsonData } from 'universal-emoji-parser'
// → from the named export at the top of src/index.ts
```

### What CommonJS users would get without the reattachment

```js
const x = require('universal-emoji-parser')
// → { default: uEmojiParser, DEFAULT_EMOJI_CDN: '...', emojiLibJsonData: {...} }
x.parse(...)        // ❌ TypeError — x doesn't have parse(), x.default does
```

Vite's library `commonjs` output exports the module as `module.exports = { default, DEFAULT_EMOJI_CDN, emojiLibJsonData }`. The `default` key holds `uEmojiParser`, but `require()` consumers don't expect to type `.default`.

### What the reattachment does

```ts
module.exports = uEmojiParser // overwrites the {default, DEFAULT_EMOJI_CDN, ...} object with uEmojiParser itself
```

Now `require('universal-emoji-parser')` returns `uEmojiParser` directly — `x.parse(...)` works.

```ts
module.exports.emojiLibJsonData = emojiLibJsonData
```

But the previous line wiped `emojiLibJsonData` from the exports. We reattach it manually. We **don't** reattach `DEFAULT_EMOJI_CDN` — that's a small omission; if it's needed, add it.

### Why this works for both

- ESM consumers: `export default` and `export const ...` are still in the source. TypeScript's `.d.ts` reports both shapes
- CommonJS consumers: `module.exports = ...` is what `require()` sees at runtime. The default export is the object directly

The `.d.ts` declares both, so TypeScript users with `esModuleInterop: true` get IDE completion for both `import uEmojiParser` and `const uEmojiParser = require(...)`.

### Don't refactor this

Tempting to write:

```ts
// ❌ DON'T
export default uEmojiParser
export { emojiLibJsonData, DEFAULT_EMOJI_CDN }
```

…and trust the bundler. It works for ESM but breaks `require('universal-emoji-parser').parse(...)` because it doesn't manually reattach to `module.exports`.

The current three lines are battle-tested across:

- Node CJS consumers (`require`)
- Node ESM consumers (`.mjs` / `"type": "module"`)
- TypeScript consumers (with and without `esModuleInterop`)
- Bundler consumers (Vite, rollup, webpack, esbuild)

Leave them alone.

## The `getDefaultOptions` "explicit undefined" trick

```ts
emojiCDN: options && Object.getOwnPropertyDescriptor(options, 'emojiCDN')
  ? String(options.emojiCDN)
  : undefined,
```

Why `getOwnPropertyDescriptor` instead of the simpler `options?.emojiCDN`?

Because `parse(text, { emojiCDN: undefined })` should be semantically distinguishable from `parse(text, {})`. The first is "explicitly clearing"; the second is "use the default". `getOwnPropertyDescriptor` distinguishes — `?.` doesn't.

In practice this matters only if a future change makes the default for `emojiCDN` non-undefined. It's defensive code that the author thought about. Don't simplify.

## The error message string

```ts
if (typeof text !== 'string') {
  throw new Error('The text parameter should be a string.')
}
```

The string `'The text parameter should be a string.'` is **part of the API**. A test asserts the throw, and consumers may catch by message. Don't reword it — even to fix a typo. If the message must change, treat it as a major bump.

## CSS class name

```ts
;`<img class="emoji" alt="${entity.text}" src="${emojiUrl}"/>`
```

`class="emoji"` is the contract. Consumers style with:

```css
img.emoji { height: 1em; width: 1em; ... }
```

Changing `class="emoji"` to `class="uemoji"` or anything else is a breaking change for every consumer's stylesheet. Don't.

## Versioning implications

If you change any of:

- The HTML output template
- The error message string
- `DEFAULT_EMOJI_CDN`
- The default option values
- The ESM/CommonJS export shape

…it's a **major version bump**. Even if the change feels small, consumer code may snapshot-test the output or read the constants.

If you change:

- A keyword/alias in the catalog (via `EMOJIS_SPECIAL_CASES`)
- The performance of an existing method

…it's a **patch or minor** depending on intent. Adding aliases: minor. Bug-fixing aliases: patch.

## Performance gotchas

- **Don't construct RegExp in a loop** when the pattern is constant
- **Don't `JSON.parse(JSON.stringify(emojiLibJsonData))`** at runtime — it's a 5 MB clone
- **Don't `console.log` in `src/`** — Biome's `noConsole` blocks it (off in `test/**`); consumers don't want library noise
- **Don't read process.env or global state** — keep the package pure

## Catalog mutation

`emojiLibJsonData` is **conventionally read-only**. Nothing in the runtime mutates it. Tests deep-equal-compare the catalog across runs.

If you find a need to "mutate" — e.g., to add a custom emoji at runtime — that's out of scope. Either fork the package, or wrap it in your consumer code with your own catalog.

## Summary checklist for changes to `src/index.ts`

Before you commit:

- [ ] The dual-export reattachment at the bottom is intact
- [ ] No new RegExp construction in loops
- [ ] No new `console.*` calls
- [ ] The `__` prefix is used for new internal helpers
- [ ] Public method signatures haven't shifted (additions OK; reorder/rename is a major bump)
- [ ] HTML output template untouched (or major bump intended)
- [ ] Error message string untouched (or major bump intended)
- [ ] Tests still pass; lint and format clean
- [ ] Docs updated for any documented behavior change
