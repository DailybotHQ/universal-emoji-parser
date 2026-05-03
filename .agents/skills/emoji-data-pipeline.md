---
name: emoji-data-pipeline
description: Step-by-step explanation of how src/lib/emoji-lib.json is regenerated from upstream sources
---

# Skill: `emoji-data-pipeline`

A reference for the data pipeline that produces `src/lib/emoji-lib.json` from upstream `emojilib` and `unicode-emoji-json`. Read this when you need to understand *why* the catalog has the shape it does, or before debugging a regeneration that produced unexpected output.

For a procedural walkthrough of running the regeneration, see [`/regenerate-emoji-lib`](../commands/regenerate-emoji-lib.md). This skill explains the algorithm.

## The two upstream sources

### `unicode-emoji-json`

A pure-data npm package — a JSON object keyed by unicode emoji literal:

```json
{
  "😎": {
    "name": "smiling face with sunglasses",
    "slug": "smiling_face_with_sunglasses",
    "group": "Smileys & Emotion",
    "emoji_version": "1.0",
    "unicode_version": "1.0",
    "skin_tone_support": false
  },
  "🚀": { ... },
  ...
}
```

This is the **authoritative source** for canonical metadata: what the emoji is named, what its CLDR slug is, which Unicode version introduced it.

The slug (`smiling_face_with_sunglasses`) follows Unicode CLDR conventions — lowercase with underscores, derived from the official emoji name.

### `emojilib`

Another data-only package — keyed by unicode emoji literal, values are arrays of curated keywords:

```js
{
  "😎": ["smiling_face_with_sunglasses", "cool", "summer", "sunglass"],
  "🚀": ["rocket", "launch", "ship", "staffmode", "NASA", "space", "fly"],
  ...
}
```

This is the **authoritative source** for **aliases**: what shortcodes (other than the canonical slug) should resolve to each emoji. The keyword arrays come from a community-curated list that GitHub, Slack, Discord, and others use.

## The merge step

The regenerator (`test/prepareEmojiLibJson.test.ts`) merges both:

```ts
const unicodeEmojiJsonData: ObjectType = unicodeEmojiJson
const keywordSet: ObjectType = emojilib

for (const emoji in unicodeEmojiJsonData) {
  unicodeEmojiJsonData[emoji].char = emoji
  if (keywordSet[emoji]) {
    unicodeEmojiJsonData[emoji].keywords = keywordSet[emoji]
  } else {
    unicodeEmojiJsonData[emoji].keywords = [unicodeEmojiJsonData[emoji].slug]
  }
  if (!unicodeEmojiJsonData[emoji].keywords.includes(unicodeEmojiJsonData[emoji].slug)) {
    unicodeEmojiJsonData[emoji].keywords.unshift(unicodeEmojiJsonData[emoji].slug)
  }
  // ... apply EMOJIS_SPECIAL_CASES (next section) ...
}
```

For each emoji in `unicode-emoji-json`:

1. **Set `char`** — the unicode literal becomes a property on the entry (so consumers can do `entry.char` instead of looking up by unicode key)
2. **Use `emojilib` keywords if available** — most emojis have curated keyword arrays
3. **Fall back to `[slug]`** — for emojis where `emojilib` has no entry, the keywords are just the slug
4. **Ensure slug is in keywords** — `unshift(slug)` if it's not already there (some `emojilib` arrays don't include the slug; we want consistent behavior — `getEmojiObjectByShortcode(slug)` should always work via the keyword scan)

## The `EMOJIS_SPECIAL_CASES` overrides

Hand-curated overrides for emojis where the upstream merge produces wrong results:

```ts
const EMOJIS_SPECIAL_CASES: ObjectType = {
  '☕': { include: ['coffee'] },
  '🤎': { exclude: ['coffee'] },
  '❤️': { include: ['heart'] },
  '💘': { exclude: ['heart'] },
  '👮‍♀️': {
    include: ['policewoman', 'female-police-officer'],
    exclude: ['legal', 'arrest'],
  },
  '✅': { include: ['white_check_mark'] },
  '⏸️': { include: ['double_vertical_bar'] },
}
```

For each entry:

- **`include`** — keywords to add (with priority — they get `unshift`-ed to the start of the keyword array)
- **`exclude`** — keywords to remove

Applied during the merge:

```ts
if (EMOJIS_SPECIAL_CASES[emoji]) {
  if (EMOJIS_SPECIAL_CASES[emoji].include) {
    EMOJIS_SPECIAL_CASES[emoji].include.forEach(keyword => {
      if (!unicodeEmojiJsonData[emoji].keywords.includes(keyword)) {
        unicodeEmojiJsonData[emoji].keywords.unshift(keyword)
      }
    })
  }
  if (EMOJIS_SPECIAL_CASES[emoji].exclude) {
    unicodeEmojiJsonData[emoji].keywords = unicodeEmojiJsonData[emoji].keywords.filter(
      k => !EMOJIS_SPECIAL_CASES[emoji].exclude.includes(k)
    )
  }
}
```

The `unshift` is important — `include` keywords go to position 0, giving them maximum priority in the dedup loop (next section).

## The deduplication loop

This is the most complex part. Problem: a keyword like `coffee` is naturally associated with multiple emojis (☕ in `emojilib`, 🤎 sometimes, etc.). If both keep `coffee` in their keyword arrays, then `:coffee:` resolves ambiguously — `getEmojiObjectByShortcode('coffee')` returns whichever emoji `Object.keys(emojiLibJsonData).find(...)` hits first, which is unpredictable.

Solution: **assign each keyword to exactly one emoji** — the one where it's most prominent. The dedup loop:

```ts
const emojiLibJson: EmojiLibJsonType = unicodeEmojiJsonData
const emojiLibJsonKeys: Array<string> = Object.keys(emojiLibJson)

emojiLibJsonKeys.forEach((unicodeEmoji: string) => {
  const emojiObject: EmojiType = JSON.parse(JSON.stringify(emojiLibJson[unicodeEmoji]))

  emojiObject.keywords.forEach((keyword: string) => {
    let emojisObjectsFoundPerKeyword: Array<EmojiType> = []

    emojiLibJsonKeys.forEach((unicodeEmojiInternal: string) => {
      const emojiObjectInternal: EmojiType = JSON.parse(JSON.stringify(emojiLibJson[unicodeEmojiInternal]))
      if (emojiObjectInternal.keywords.includes(keyword)) {
        emojiObjectInternal.keyword_index_found = emojiObjectInternal.keywords.indexOf(keyword)
        emojisObjectsFoundPerKeyword.push(emojiObjectInternal)
      }
    })

    if (emojisObjectsFoundPerKeyword.length) {
      emojisObjectsFoundPerKeyword = emojisObjectsFoundPerKeyword.sort(
        (a, b) => a.keyword_index_found! - b.keyword_index_found!
      )
      emojisObjectsFoundPerKeyword.splice(0, 1)
      if (emojisObjectsFoundPerKeyword.length) {
        emojisObjectsFoundPerKeyword.forEach((emojiObjectFound: EmojiType) => {
          if (emojiObjectFound.keyword_index_found !== 0) {
            emojiLibJson[emojiObjectFound.char].keywords.splice(emojiObjectFound.keyword_index_found!, 1)
          }
        })
      }
    }
  })
})
```

Walking through:

### For each emoji in the catalog:

#### For each of its keywords:

1. **Find every emoji that has this keyword** — `emojisObjectsFoundPerKeyword` collects them, with each one's `keyword_index_found` (the position of the keyword in their array)
2. **Sort by `keyword_index_found` ascending** — the emoji where this keyword appears earliest wins
3. **Drop the winner** (`splice(0, 1)`) from the list — they keep the keyword
4. **For all losers**, remove the keyword from their arrays

The `keyword_index_found !== 0` guard prevents removing a keyword that's at position 0 (the canonical slug). This is intentional — the slug must always be in its emoji's keywords for `parseToShortcode` to round-trip.

### Why O(n²)

`emojiLibJsonKeys.forEach(...)` outer × `emojiObject.keywords.forEach(...)` inner × `emojiLibJsonKeys.forEach(...)` innermost = O(n × k × n) where n=1906, k≈5 average keywords. Total iterations ≈ 18 million. Each is a cheap array operation, so the whole loop runs in ~10 seconds.

This is fine because regeneration is a manual, opt-in operation. Optimizing this loop would be a 2-day project for a result that runs once a month.

### The `JSON.parse(JSON.stringify(...))` clones

```ts
const emojiObject: EmojiType = JSON.parse(JSON.stringify(emojiLibJson[unicodeEmoji]))
```

The dedup loop **mutates** `emojiLibJson[someEmoji].keywords` while iterating. Cloning the entry first prevents the mutation from affecting the iteration. Without clones, the algorithm produces inconsistent results.

This is the **only** sanctioned use of `JSON.parse(JSON.stringify(...))` in the codebase. Don't replicate this pattern at runtime — it's expensive.

## The output

After the merge + special cases + dedup, `emojiLibJson` is the final catalog. The regenerator writes it:

```ts
const filePath: string = 'src/lib/emoji-lib-output.json'
fs.writeFileSync(filePath, JSON.stringify(emojiLibJson, null, 2))
```

The output file is **gitignored** (`.gitignore` includes `emoji-lib-output.json`). To make it the runtime catalog, you copy it manually:

```bash
cp src/lib/emoji-lib-output.json src/lib/emoji-lib.json
```

This separation lets you review the regenerated catalog before promoting it. If the diff is wrong, you can iterate on `EMOJIS_SPECIAL_CASES` and re-run without committing a broken intermediate state.

## Reading the diff

After regeneration, the diff between `emoji-lib.json` (committed) and `emoji-lib-output.json` (just generated) shows what changed. Common patterns:

### "All emojis show a diff in keyword order"

The dedup algorithm is **sensitive to iteration order** — `Object.keys()` in JS is mostly insertion-order, but for non-integer string keys (which unicode emojis are), order is officially "implementation-defined." If `unicode-emoji-json` reorders its entries between versions, the dedup picks different winners.

This usually means an upstream version bump rearranged things. Spot-check a few specific emojis to confirm the *meaningful* keywords are still correct, then accept.

### "A specific emoji has a totally different keywords array"

Either:

- **`emojilib` updated its keywords** for that emoji
- **A new emoji was added that shares keywords** and won the dedup over the existing one

Check `EMOJIS_SPECIAL_CASES` — if the affected emoji is one we explicitly support an alias for, add an `include` override.

### "A previously-resolving shortcode now returns undefined"

The keyword was reassigned to a different emoji during dedup. Add an `EMOJIS_SPECIAL_CASES` `include` for the original emoji to lock in the keyword.

### "Catalog count went down"

`unicode-emoji-json` removed entries. Rare. Check the upstream changelog. If the removal is a bug, pin to the previous version of `unicode-emoji-json` and file an issue upstream.

## Adding a new shortcode alias

Use case: someone wants `:rocketship:` to resolve to 🚀.

1. Open `test/prepareEmojiLibJson.test.ts`
2. Add to `EMOJIS_SPECIAL_CASES`:
   ```ts
   '🚀': { include: ['rocketship'] },
   ```
3. Regenerate
4. Confirm 🚀's keyword array now starts with `rocketship` (because of `unshift`)
5. The dedup loop will give 🚀 priority over any other emoji that had `rocketship` (unlikely — `rocketship` isn't in `emojilib`'s defaults)

After regeneration, `getEmojiObjectByShortcode('rocketship')` finds 🚀 via the keyword scan.

Procedure: [`/add-special-case`](../commands/add-special-case.md).

## Removing an unwanted alias

Use case: `:legal:` was resolving to 👮‍♀️ (police officer), which is wrong — `legal` should be unrelated to police imagery.

1. Add to `EMOJIS_SPECIAL_CASES`:
   ```ts
   '👮‍♀️': { exclude: ['legal'] },
   ```
2. Regenerate

Now `getEmojiObjectByShortcode('legal')` returns whatever other emoji has `legal` in its keywords (or undefined).

## Why the dedup ordering can surprise

Suppose two emojis (A and B) both have keyword `cool` at the same position (say, index 2). The dedup sorts by `keyword_index_found` ascending — when ties happen, JavaScript's `Array.sort` is **stable** in modern engines (V8, JSC), but historically wasn't guaranteed. This means tied-position emojis are ordered by **catalog iteration order**, which is `Object.keys(emojiLibJsonData)`.

If `unicode-emoji-json` changes its insertion order between versions, ties resolve differently — even if neither `emojilib` nor our overrides changed. This is the "unexpected diffs after upstream bump" scenario.

To force a specific outcome, use `EMOJIS_SPECIAL_CASES.include` to push the keyword to position 0 in the emoji you want to win.

## What the regenerator doesn't do

- **Doesn't validate slugs** — if `unicode-emoji-json` ships a malformed slug, it propagates. Sanity-check `slug.match(/^[a-z0-9_]+$/)` for any new entries
- **Doesn't sort keywords alphabetically** — order matters for dedup, so we preserve `emojilib`'s curation
- **Doesn't deduplicate keywords *within* a single emoji's array** — if `emojilib` has `["smile", "happy", "smile"]`, the duplicate stays. Hasn't been a problem yet
- **Doesn't enforce a maximum number of keywords per emoji** — if upstream bloats, the catalog bloats. Bundle size is the constraint

## Future improvements

If the regeneration becomes painful:

- **Cache the dedup output** by hash of input — re-running with unchanged inputs would be instant
- **Replace O(n²) with an inverted index** — for each keyword, build a list of (emoji, position), then for each list keep the lowest-position one
- **Move regeneration out of the test suite** into a dedicated script (`scripts/regenerate-catalog.ts`) — `it.skip` is a clever hack but brittle

None of these are urgent. The current pipeline runs once a month and takes 10 seconds.
