---
name: add-special-case
description: Add a keyword include/exclude override to EMOJIS_SPECIAL_CASES and regenerate the catalog
---

# Command: `/add-special-case`

Add a keyword override (include or exclude) for a specific emoji in `EMOJIS_SPECIAL_CASES`, then regenerate the catalog so the override takes effect.

## When to use

- A Slack/GitHub/Discord shortcode alias should resolve to a specific emoji but currently doesn't (e.g., `:rocketship:` → 🚀)
- A keyword is being assigned to the wrong emoji by the dedup algorithm (e.g., `coffee` was going to 🤎 instead of ☕)
- You want to remove an inappropriate keyword from an emoji (e.g., remove `legal` from 👮‍♀️)

## Inputs to confirm

- **Emoji** — the unicode literal (e.g., `🚀`, `☕`)
- **Include** — keywords to add and prioritize (optional)
- **Exclude** — keywords to remove (optional)
- **Why** — a sentence explaining the use case (Slack alias, common typo, etc.)

## Procedure

### 1. Find the emoji's current entry

```bash
node -e "
const data = require('./src/lib/emoji-lib.json');
const emoji = '🚀';   // ← change this
console.log(JSON.stringify(data[emoji], null, 2));
"
```

Expected: a JSON object with `name`, `slug`, `char`, `keywords`, etc. If `undefined`, the emoji isn't in the catalog and a special case won't help — file an issue against `unicode-emoji-json` instead.

### 2. Edit `EMOJIS_SPECIAL_CASES`

Open `test/prepareEmojiLibJson.test.ts`. Find the `EMOJIS_SPECIAL_CASES` constant near the top:

```ts
const EMOJIS_SPECIAL_CASES: ObjectType = {
  '☕': { include: ['coffee'] },
  '🤎': { exclude: ['coffee'] },
  // ...
}
```

Add an entry. For an include-only case:

```ts
'🚀': {
  include: ['rocketship', 'launch'],
},
```

For an exclude-only case:

```ts
'💘': {
  exclude: ['heart'],
},
```

For both:

```ts
'👮‍♀️': {
  include: ['policewoman', 'female-police-officer'],
  exclude: ['legal', 'arrest'],
},
```

**Order matters** for the dedup loop — `include` keywords are unshifted to position 0, giving them priority when the same keyword is assigned across multiple emojis. If two emojis both `include` the same keyword, the algorithm picks the first one alphabetically (which is rare; if it happens, a comment in the special-cases block helps).

### 3. Regenerate the catalog

Follow [`/regenerate-emoji-lib`](regenerate-emoji-lib.md):

1. Change `it.skip` → `it` in `prepareEmojiLibJson.test.ts`
2. `npm test` (writes `src/lib/emoji-lib-output.json`)
3. Diff against `src/lib/emoji-lib.json`
4. Verify the override took effect:

   ```bash
   node -e "
   const data = require('./src/lib/emoji-lib-output.json');
   console.log(data['🚀'].keywords);
   "
   ```

   Expected: `['rocket', 'rocketship', 'launch', ...]` (your includes appear, in unshifted order)

5. `cp src/lib/emoji-lib-output.json src/lib/emoji-lib.json`
6. Restore `it.skip` in `prepareEmojiLibJson.test.ts`

### 4. Add a regression test

Open `test/main.test.ts`. Add a new `it` block under "Using default options" (or wherever the closest match is):

```ts
it('should resolve :rocketship: to 🚀 (special case)', () => {
  // Arrange
  const text: string = ':rocketship:'

  // Act
  const result: string = uEmojiParser.parseToUnicode(text)

  // Assert
  expect(result).to.be.equal('🚀')
})
```

For an exclude case:

```ts
it('should not resolve :heart: to 💘 (excluded keyword)', () => {
  const result: string = uEmojiParser.parseToUnicode(':heart:')
  expect(result).to.be.equal('❤️') // resolves to red heart, not heart-with-arrow
})
```

### 5. Run the full test suite

```bash
npm test
```

Expected: all green. If `emojiLibJson.test.ts` fails on `TOTAL_EMOJIS`, the count changed during regeneration — update the constant.

If a previously-passing test in `main.test.ts` now fails, the regeneration broke an existing alias. That alias may need to be added to `EMOJIS_SPECIAL_CASES` as an explicit `include` to survive the dedup.

### 6. Commit

Single commit, all related changes:

```bash
git add test/prepareEmojiLibJson.test.ts src/lib/emoji-lib.json test/main.test.ts test/emojiLibJson.test.ts
git commit -m "feat: add :rocketship: alias for 🚀"
```

Conventional commit type:

- `feat:` — new alias / new shortcode behavior
- `fix:` — restoring a previously-working alias that broke
- `chore:` — cleanup of an outdated special case

## Pitfalls

1. **Adding an alias that already resolves** — `getEmojiObjectByShortcode` does a keyword scan as a fallback. If `rocketship` is already in `🚀`'s keywords (from upstream `emojilib`), no special case is needed. Check first via the regression test as a no-op
2. **Conflicting includes** — if two special cases both `include: ['heart']`, the dedup algorithm picks one based on keyword position. If both have `unshift`-ed it to position 0, the result is undefined. Avoid by being explicit about which emoji owns each keyword
3. **Forgetting to add a test** — without it, a future regeneration that drops the alias goes unnoticed until a consumer reports it
4. **Regenerating twice** — if you regenerate, edit `EMOJIS_SPECIAL_CASES` again, and regenerate again, the second output may include artifacts of the first. Always start with a clean catalog

## Don't

- ❌ Hand-edit `src/lib/emoji-lib.json` to add a keyword — the override won't survive the next regeneration
- ❌ Add an alias without a corresponding test — there's no way to detect drift later
- ❌ Use a keyword that's already someone else's slug — `slug`s are unique; aliasing one to a different emoji is confusing

## Do

- ✅ Use lowercase + underscores for keyword spelling (matches the catalog convention)
- ✅ Add a regression test that exercises both directions if they apply (`parseToUnicode` for resolution; `parseToShortcode` if you also want it to round-trip)
- ✅ Note in the commit message _why_ the alias was added (Slack support, common typo, etc.)

## Verification checklist

- [ ] `EMOJIS_SPECIAL_CASES` has the new entry
- [ ] Regenerated catalog reflects the override (verified via inline check)
- [ ] `it.skip` is restored
- [ ] New regression test in `test/main.test.ts`
- [ ] `npm test` passes
- [ ] `TOTAL_EMOJIS` updated if count changed
- [ ] Single commit with descriptive message
