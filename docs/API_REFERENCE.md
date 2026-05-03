# API Reference

Complete reference for the public API of Universal Emoji Parser. Every export, every method, every option, every return value.

For a quick "here's how to use it" overview, see the [README](../README.md). This file is the canonical specification.

## Imports

```ts
// Default import — the parser object
import uEmojiParser from 'universal-emoji-parser'

// Named imports
import { emojiLibJsonData, DEFAULT_EMOJI_CDN } from 'universal-emoji-parser'

// Type imports (TypeScript)
import type {
  EmojiType,
  EmojiLibJsonType,
  EmojiParseOptionsType,
  UEmojiParserType,
  TwemojiEntity,
} from 'universal-emoji-parser'

// CommonJS — same shape
const uEmojiParser = require('universal-emoji-parser')
const { emojiLibJsonData, DEFAULT_EMOJI_CDN } = require('universal-emoji-parser')
```

Both `import` and `require` produce the same object — see [Architecture → CommonJS reattachment](ARCHITECTURE.md#commonjs-reattachment).

---

## `uEmojiParser` (default export)

An object implementing `UEmojiParserType`:

```ts
interface UEmojiParserType {
  getEmojiObjectByShortcode: (shortcode: string) => EmojiType | undefined
  getDefaultOptions(options?: EmojiParseOptionsType): EmojiParseOptionsType
  __parseEmojiToHtml(text: string, emojiCDN?: string): string
  parseToHtml: (text: string, emojiCDN?: string) => string
  parseToUnicode: (text: string) => string
  parseToShortcode: (text: string) => string
  parse: (text: string, options?: EmojiParseOptionsType) => string
}
```

### `parse(text, options?): string`

The primary entry point. Dispatches to one of the specialized methods based on `options`.

**Parameters:**

- `text: string` — the input text to transform. **Must** be a string; throws `Error('The text parameter should be a string.')` otherwise
- `options?: EmojiParseOptionsType` — see [Options](#options-emojiparseoptionstype). Defaults: `parseToHtml: true`, `parseToUnicode: false`, `parseToShortcode: false`, `emojiCDN: undefined`

**Returns:** `string` — the transformed text

**Behavior:**

| `parseToHtml`    | `parseToUnicode` | `parseToShortcode` | What runs                                                                                |
| ---------------- | ---------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `true` (default) | (any)            | (any)              | `parseToUnicode` (resolve `:smile:` → 🙂) → `__parseEmojiToHtml` → returns HTML          |
| `false`          | `true`           | (any)              | `parseToUnicode` only — input shortcodes become unicodes; existing unicodes pass through |
| `false`          | `false`          | `true`             | `parseToShortcode` only — input unicodes become canonical `:slug:`                       |
| `false`          | `false`          | `false`            | Returns text unchanged (no-op)                                                           |

**Examples:**

```ts
uEmojiParser.parse('Hello :smile: 🚀')
// → 'Hello <img class="emoji" alt="🙂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f642.svg"/> <img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'

uEmojiParser.parse(':smile: 🚀', { parseToHtml: false, parseToUnicode: true })
// → '🙂 🚀'

uEmojiParser.parse('🙂 🚀', { parseToHtml: false, parseToShortcode: true })
// → ':slightly_smiling_face: :rocket:'

uEmojiParser.parse(undefined as any)
// throws Error('The text parameter should be a string.')
```

---

### `parseToHtml(text, emojiCDN?): string`

Convert all emojis in `text` (both unicodes and shortcodes) to `<img>` tags.

**Parameters:**

- `text: string` — input
- `emojiCDN?: string` — optional CDN URL prefix to use instead of `DEFAULT_EMOJI_CDN`. Must end with `/`

**Returns:** `string` — HTML output following the [HTML output contract](#html-output-contract)

**Equivalent to:** `parse(text, { parseToHtml: true, emojiCDN })`

**Internally:** runs `parseToUnicode` first (so `:smile:` becomes 🙂), then `__parseEmojiToHtml`.

**Examples:**

```ts
uEmojiParser.parseToHtml('🚀')
// → '<img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'

uEmojiParser.parseToHtml('🚀', 'https://my-cdn.example.com/emoji/svg/')
// → '<img class="emoji" alt="🚀" src="https://my-cdn.example.com/emoji/svg/1f680.svg"/>'

uEmojiParser.parseToHtml(':rocket:')
// Same as the first example — :rocket: is resolved to 🚀 first
```

---

### `parseToUnicode(text): string`

Replace shortcodes (`:smile:`) in `text` with their unicode emoji characters. Existing unicode emojis pass through unchanged.

**Parameters:**

- `text: string` — input

**Returns:** `string` — text with shortcodes replaced by unicode

**Behavior:**

- Matches `/:(\w+):/g` (any sequence of word characters between colons)
- Looks up each match via `getEmojiObjectByShortcode`
- Replaces hits with `emoji.char`; leaves misses as text

**Examples:**

```ts
uEmojiParser.parseToUnicode(':thumbsup:') // → '👍'  (alias)
uEmojiParser.parseToUnicode(':thumbs_up:') // → '👍'  (slug)
uEmojiParser.parseToUnicode(':smile: hi :rocket:') // → '🙂 hi 🚀'
uEmojiParser.parseToUnicode(':not_an_emoji:') // → ':not_an_emoji:' (unchanged)
uEmojiParser.parseToUnicode('🚀 already unicode') // → '🚀 already unicode'
```

---

### `parseToShortcode(text): string`

Replace unicode emojis in `text` with their canonical shortcode. Existing shortcodes pass through unchanged.

**Parameters:**

- `text: string` — input

**Returns:** `string` — text with unicodes replaced by `:slug:`

**Behavior:**

- Builds an alternation regex from `Object.keys(emojiLibJsonData)` (every unicode emoji in the catalog)
- Escapes `*️⃣` (the keycap asterisk has special regex semantics)
- Runs `text.matchAll(regex)` and replaces each match with `:emoji.slug:`

**Note on output:** This always emits the **canonical slug**, not whatever input alias might have produced the emoji. Round-tripping `:thumbsup:` → 👍 → `:thumbs_up:` is **not** lossless.

**Examples:**

```ts
uEmojiParser.parseToShortcode('👍') // → ':thumbs_up:'
uEmojiParser.parseToShortcode('🚀 ⭐️') // → ':rocket: :glowing_star:'
uEmojiParser.parseToShortcode(':smile: text') // → ':smile: text' (already shortcode-form)
uEmojiParser.parseToShortcode('hello world') // → 'hello world' (no emojis)
```

---

### `getEmojiObjectByShortcode(shortcode): EmojiType | undefined`

Look up an emoji by shortcode. Returns the full catalog entry or `undefined` if not found.

**Parameters:**

- `shortcode: string` — with or without surrounding colons (`'smile'` and `':smile:'` both work; the function strips colons)

**Returns:** `EmojiType | undefined`

**Lookup order:**

1. **Direct hit:** `emojiLibJsonData[shortcode]` — fast path for canonical slugs
2. **Keyword scan:** searches every emoji's `keywords` array for a match — fallback for dialect aliases

**Examples:**

```ts
uEmojiParser.getEmojiObjectByShortcode('smiling_face_with_sunglasses')
// → { name: 'smiling face with sunglasses', slug: 'smiling_face_with_sunglasses', char: '😎', ... }

uEmojiParser.getEmojiObjectByShortcode(':cool:')
// → same as above (cool is a keyword for 😎)

uEmojiParser.getEmojiObjectByShortcode('not_a_real_emoji')
// → undefined
```

---

### `getDefaultOptions(options?): EmojiParseOptionsType`

Merge user options with defaults. Rarely called directly — `parse` uses it internally.

**Parameters:**

- `options?: EmojiParseOptionsType` — partial options

**Returns:** `EmojiParseOptionsType` — fully populated options

**Defaults:**

- `parseToHtml: true`
- `parseToUnicode: false`
- `parseToShortcode: false`
- `emojiCDN: undefined`

**Subtle behavior:** Uses `Object.getOwnPropertyDescriptor(options, 'emojiCDN')` to distinguish "explicitly undefined" from "not set". For booleans, `undefined → false` is fine, so it just calls `Boolean(options.x)`. The exception is `parseToHtml`, whose default is `true` — that's why it also uses `getOwnPropertyDescriptor`.

---

### `__parseEmojiToHtml(text, emojiCDN?): string`

**Internal.** The double-underscore prefix means "implementation detail; may change without notice". Don't call directly.

Replaces unicode emojis in `text` with `<img>` tags. Doesn't resolve shortcodes — call `parseToHtml` (which calls `parseToUnicode` first) instead.

If you do call it directly with shortcodes in the input, they'll be left as text.

---

## Named exports

### `DEFAULT_EMOJI_CDN: string`

The default Twemoji CDN URL prefix. Currently:

```ts
export const DEFAULT_EMOJI_CDN: string = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/'
```

**Stable** — changing this is a major bump. Consumers may compare against this constant.

### `emojiLibJsonData: EmojiLibJsonType`

The full emoji catalog. Read-only — **do not mutate**.

```ts
const sunglasses = emojiLibJsonData['😎']
// → { name: 'smiling face with sunglasses', slug: 'smiling_face_with_sunglasses', char: '😎', keywords: [...], ... }

Object.keys(emojiLibJsonData).length
// → 1906
```

---

## Types

### `EmojiType`

```ts
export interface EmojiType {
  name: string // "smiling face with sunglasses"
  slug: string // "smiling_face_with_sunglasses" — canonical shortcode
  group: string // "Smileys & Emotion"
  emoji_version: string // "1.0"
  unicode_version: string // "1.0"
  skin_tone_support: boolean // false for most; true for emojis with U+1F3FB-U+1F3FF skin variants
  char: string // "😎" — the unicode literal
  keywords: Array<string> // ["smiling_face_with_sunglasses", "cool", "summer", "sunglass", ...]
  keyword_index_found?: number // Used internally by the regenerator; ignore
}
```

### `EmojiLibJsonType`

```ts
export interface EmojiLibJsonType {
  [key: string]: EmojiType // keyed by emoji char (e.g., "😎"), not by slug
}
```

### `EmojiParseOptionsType`

```ts
export interface EmojiParseOptionsType {
  emojiCDN?: string // CDN URL prefix; must end with "/"
  parseToHtml?: boolean // default: true
  parseToUnicode?: boolean // default: false
  parseToShortcode?: boolean // default: false
}
```

### `UEmojiParserType`

The type of the default export — see [`uEmojiParser`](#uemojiparser-default-export).

### `TwemojiEntity`

```ts
export interface TwemojiEntity {
  url: string // e.g., "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"
  indices: Array<number> // [start, end] in the input text
  text: string // the unicode emoji literal
  type: string // "emoji"
}
```

Returned by `@twemoji/parser`'s `parse()` function. Rarely used by consumers directly; exported for type-completeness.

---

## HTML output contract

Every emoji rendered to HTML by `parseToHtml` (or `parse` with `parseToHtml: true`) follows **this exact structure**:

```html
<img class="emoji" alt="<unicode-emoji>" src="<cdn-url>" />
```

| Attribute         | Value                                            | Why                                                                              |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `class`           | `"emoji"` (literal, exact)                       | Consumers style with `img.emoji { ... }` (see [README](../README.md#css-styles)) |
| `alt`             | The unicode emoji literal (e.g., `😎`)           | Accessibility + copy-paste survives the rendering                                |
| `src`             | CDN URL (Twemoji default or `emojiCDN` override) | Asset URL                                                                        |
| Self-closing `/>` | Always                                           | XHTML/JSX compatibility                                                          |

**No additional attributes are added.** Adding `loading="lazy"`, `decoding="async"`, `width`, `height`, etc. is a **breaking change** — consumers' snapshot tests rely on the exact output. Bump the major version if changing.

### Output examples

```ts
uEmojiParser.parseToHtml('😎')
// → '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'

uEmojiParser.parseToHtml('hello 😎')
// → 'hello <img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'

uEmojiParser.parseToHtml('😎 😎')
// Both occurrences replaced (Twemoji parse returns one entity per occurrence; entitiesFound dedup ensures we replace ALL instances of each unique emoji once with a global regex):
// → '<img class="emoji" alt="😎" src="..."/> <img class="emoji" alt="😎" src="..."/>'
```

### CSS recipe

Recommended global CSS so emojis fit inline with text:

```css
img.emoji {
  height: 1em;
  width: 1em;
  margin: 0 0.05em 0 0.1em;
  vertical-align: -0.1em;
}
```

This is the snippet quoted in the README and the contract that consumers depend on.

---

## Error handling

The package throws **only one** error type, **only one** time:

```ts
if (typeof text !== 'string') {
  throw new Error('The text parameter should be a string.')
}
```

In `parse(text, options)`. Other inputs (unmatched shortcodes, garbage characters, empty strings, very long strings) are handled silently — no errors, no warnings.

The error message string is **part of the API**. A test asserts the throw, and consumers may catch by message. Don't reword it.

---

## Stability guarantees

| Surface                                      | Stability                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Method names (`parse`, `parseToHtml`, …)     | Stable across minor versions                                                                      |
| Method signatures                            | Adding optional parameters: minor bump. Reordering / renaming / required params: major bump       |
| Default option values                        | Changes are major bumps                                                                           |
| HTML output template                         | Changes are major bumps — **all consumers' snapshot tests would break**                           |
| `DEFAULT_EMOJI_CDN` value                    | Changes are major bumps                                                                           |
| `EmojiType` shape                            | Adding optional fields: minor bump. Removing or renaming: major bump                              |
| Catalog content (which slugs/keywords exist) | Adding new shortcode aliases: patch or minor (depending on intent). Removing slugs/aliases: major |
| `__parseEmojiToHtml`                         | **Internal.** No stability guarantees. May change in patches                                      |
| `keyword_index_found` field                  | **Internal.** Consumers should not read it                                                        |

When in doubt about whether a change is breaking, **assume it is** and let a reviewer downgrade the bump.

---

## Versioning

Current version: see `package.json` `"version"`. The CI release pipeline auto-patches every PR merge to `main` — see [Build & Deploy](BUILD_DEPLOY.md).

To skip the auto-bump for a non-patch release, edit `package.json` `"version"` manually in the same PR. The CI's `npm version patch` will then bump from your minor/major to its `+1` patch — fine.

---

## Compatibility

- **Node.js** ≥ 20.19.0 (`engines.node` constraint; CI runs on Node 24)
- **TypeScript** ≥ 4.0 for consumers (the `.d.ts` uses modern features but nothing 5.0-only)
- **Bundlers** — webpack, rollup, vite, esbuild, parcel all handle `commonjs2` output. See [Runtimes](RUNTIMES.md)
- **Browsers** — anything modern. The catalog inlines into the bundle; no runtime fetch
