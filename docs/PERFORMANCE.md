# Performance

Performance characteristics of Universal Emoji Parser and the levers you have when something gets slow. The package is intentionally simple — most "performance" work here is about *not* introducing slow paths in new code.

## Hot paths

### `parse(text, options)` end-to-end

```
parse()
  ├── getDefaultOptions()              ← O(1) — small object merge
  ├── parseToShortcode(text)?          ← O(N · M) where N = text length, M = catalog size
  ├── parseToUnicode(text)?            ← O(K · M_avg) where K = #shortcodes in text
  └── __parseEmojiToHtml(text)?        ← O(E + N · E) where E = #emoji entities
```

For typical inputs (a chat message with 1–10 emojis), the whole pipeline runs in under a millisecond. The catalog lookups are O(1) on direct slug hits and O(M) on keyword-scan fallbacks.

### `parseToShortcode` is the slowest

It builds a single regex from `Object.keys(emojiLibJsonData).join('|')` — a 1906-alternation pattern — and runs `text.matchAll` over it. Two costs:

1. **RegExp construction** is O(M) and happens **on every call**. With 1906 alternates and the keycap escape, this is the dominant cost for short inputs
2. **Matching** is O(N · M) in the worst case (alternation regexes don't backtrack as efficiently as character classes)

If a consumer calls `parseToShortcode` in a hot loop, **the regex construction dominates**. Caching it would help but introduces stateful behavior — currently the package recreates it every call.

### Catalog lookup priority

`getEmojiObjectByShortcode(shortcode)`:

1. **Direct hit** — `emojiLibJsonData[shortcode]` — O(1)
2. **Keyword scan** — `Object.keys(...).find(...)` — O(M · K_avg) where K_avg ≈ 5 (average keywords per emoji)

For canonical slugs the fast path always wins. For dialect aliases (`:thumbsup:` → 👍), the scan is unavoidable. There's no inverted index — it would double the catalog memory for a marginal speedup.

## Optimizations already in place

| Optimization | Where | Why it matters |
|---|---|---|
| Catalog as static JSON import | `import emojiLibJson from './lib/emoji-lib.json'` | Bundlers inline it as a JS object literal — no JSON.parse at runtime |
| Single Twemoji parse per HTML conversion | `__parseEmojiToHtml` | Twemoji is the slowest single op; calling it twice is wasted work |
| `entitiesFound` dedup | `__parseEmojiToHtml` | Same emoji appearing 5× → 1 regex replace, not 5 |
| Two-tier shortcode lookup | `getEmojiObjectByShortcode` | Slug path is O(1); keyword scan only when needed |
| Frozen-by-convention catalog | `emojiLibJsonData` | Consumers can safely cache references; nothing mutates |

## Optimizations *not* applied (and why)

| Not done | Reason |
|---|---|
| RegExp caching for `parseToShortcode` | Adds stateful module-level cache; tests pass without it; speeds matter only in tight loops |
| Inverted keyword index (`{ keyword: emoji }`) | Doubles memory of the catalog (~5 MB resident) for marginal speedup; current scan is fast enough |
| Streaming/chunked parsing for very long inputs | Unrealistic input size for this package's domain (chat messages, blog posts) |
| Web Worker offload | Not the package's job — consumers can `worker.postMessage(text)` themselves |
| Async API | Adds complexity without benefit; everything is in-memory |

If a consumer benchmarks a real workload and finds these to be the bottleneck, file an issue with numbers and we'll reconsider.

## Bundle size

The package adds ~600 KB minified (~543 KB JSON catalog + ~50 KB code + Twemoji) to consumer bundles. This dominates everything:

```bash
ls -lh dist/index.js                          # ~600 KB minified
ls -lh src/lib/emoji-lib.json                  # ~543 KB raw
```

### Why so big?

The catalog has 1906 entries × average ~250 bytes per entry (name, slug, group, version, char, keywords array). Most of the size is keyword arrays and the `name` field.

### What we won't drop

- `name` — useful for accessibility (`alt=` could use it; we currently use the unicode char instead)
- `slug` — the canonical shortcode for `parseToShortcode`
- `keywords` — the alias support is the package's main value-add
- `char` — used by `parseToUnicode` and `__parseEmojiToHtml`

### What might drop in a future major

- `group`, `emoji_version`, `unicode_version`, `skin_tone_support` — currently exported as part of `EmojiType` but **never read by the runtime**. They're metadata for consumers using `emojiLibJsonData` directly. Removing them would save ~30% of the catalog size but breaks any consumer that reads them. Slate for a 3.x migration discussion

### Lazy-loading for consumers

A consumer worried about initial-load performance can lazy-import:

```ts
let parserPromise: Promise<typeof import('universal-emoji-parser').default> | null = null

async function parseLazy(text: string): Promise<string> {
  parserPromise ??= import('universal-emoji-parser').then(m => m.default)
  return (await parserPromise).parse(text)
}
```

Webpack/Vite/Rollup turn this into a code-split chunk — the catalog only ships when first needed. Trade-off: first call awaits a network fetch.

### Tree-shaking

The catalog is **not tree-shakeable** — `getEmojiObjectByShortcode` enumerates all keys via `Object.keys(emojiLibJsonData)`, so every emoji is reachable. Even consumers who only call `parseToHtml` ship the whole catalog.

A custom subset (e.g., "only emojis used in our app") would require a fork or a wrapper package that pre-filters at build time. Out of scope for this package.

## Memory footprint

Per-process overhead:

- **Catalog** — ~5 MB resident (parsed JS object representation of the 543 KB JSON)
- **Code** — ~50 KB
- **`@twemoji/parser`** — ~50 KB

Loaded once per process; doesn't grow with usage.

In Node, the catalog is the biggest single string-heavy object in `process.memoryUsage().heapUsed` for any app that uses this package and not much else. Not a problem for typical Node servers; relevant for memory-constrained environments (256 MB Lambdas, Cloudflare Workers).

## Throughput benchmarks

We don't have a wired-up benchmark suite. Rough numbers from manual measurement (Node 22 on M1):

| Operation | Input | Latency |
|---|---|---|
| `parse('hello')` | No emojis | < 0.1 ms |
| `parse('hello :smile: 🚀')` | 2 emojis, 1 shortcode | ~0.3 ms |
| `parse(<200 char chat message with 5 emojis>)` | Realistic chat | ~0.5 ms |
| `parseToShortcode('🚀 ⭐️ ❤️ 😎 🔥')` | 5 unicodes | ~0.8 ms (regex construction dominates) |
| `parseToShortcode(<1 KB text>)` | Same alternation regex, longer scan | ~1.5 ms |
| `parseToHtml(<1 KB text with 20 emojis>)` | Full pipeline | ~2 ms |

Twemoji's `parse()` is the dominant cost in `parseToHtml`. Catalog lookups are sub-microsecond.

If a consumer reports >10 ms latencies on realistic input, that's a bug — open an issue.

## Adding new code paths — performance checklist

When adding a new method or feature:

- [ ] **No async.** Don't introduce `Promise` returns or `await` calls — the catalog is in-memory; sync is faster and simpler
- [ ] **No catalog mutation.** `emojiLibJsonData` must remain a reference-stable, deep-frozen-by-convention object
- [ ] **Cache RegExp where possible.** If a regex doesn't depend on the input, build it once at module init, not per call
- [ ] **No iteration of the catalog** if a direct lookup will do. `emojiLibJsonData[slug]` is always faster than `Object.keys(...).find(...)`
- [ ] **No new fields on `EmojiType`** without measuring the bundle-size delta. Each field × 1906 entries × every consumer's bundle adds up
- [ ] **Test with realistic input.** `:smile:` is fine for unit tests; don't optimize for the trivial case at the cost of long inputs

## Profiling

Quick profile of a hot call:

```bash
node --prof -e "const u = require('./dist/index.js'); for (let i = 0; i < 10000; i++) u.parse('hello :smile: 🚀 ⭐️ ❤️ 😎')"
node --prof-process isolate-*.log
```

The output will show you which functions dominate. Expected: `RegExp.prototype[@@matchAll]` and the alternation regex construction in `parseToShortcode` — confirming the analysis above.

For browser perf, Chrome DevTools' Performance panel works on bundles built by `npm run build:dev` (production minification obscures function names).

## Common performance mistakes

1. **Constructing a new `RegExp` per loop iteration** — pull it out:
   ```ts
   // ❌
   for (const t of texts) {
     const r = new RegExp(...)    // built every iteration
     t.match(r)
   }
   // ✅
   const r = new RegExp(...)
   for (const t of texts) t.match(r)
   ```
2. **Cloning the catalog** — `JSON.parse(JSON.stringify(emojiLibJsonData))` is the regenerator's pattern; never do it at runtime
3. **`for-in` over the catalog** — `for-in` is slower than `Object.keys(...).forEach`. The package uses `Object.keys` consistently
4. **`indexOf` chains** — `array.indexOf(x) !== -1` is slower than `array.includes(x)` and harder to read
5. **Reading `emojiLibJsonData.length`** — there's no `length`; it's an object, not an array. Use `Object.keys(emojiLibJsonData).length`
