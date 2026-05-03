---
name: regenerate-emoji-lib
description: Regenerate src/lib/emoji-lib.json from upstream emojilib and unicode-emoji-json
---

# Command: `/regenerate-emoji-lib`

Rebuild the emoji catalog from the upstream `emojilib` and `unicode-emoji-json` packages, applying any `EMOJIS_SPECIAL_CASES` overrides.

## When to use

- An upstream package added new emojis or changed metadata
- A new entry was added to `EMOJIS_SPECIAL_CASES` (via [`/add-special-case`](add-special-case.md))
- A bug report indicates a stale or wrong catalog entry
- Routine maintenance after bumping `emojilib` or `unicode-emoji-json`

## Inputs to confirm

- **Why** — what triggered the regeneration (new upstream release, special-case addition, etc.)
- **Expected delta** — roughly how many entries should change

## Procedure

### 1. Verify the working tree is clean

```bash
git status
```

If there are uncommitted changes, stash or commit them first. Regeneration produces large diffs and you don't want them mixed with unrelated work.

### 2. Make sure deps are current

```bash
npm install
```

If `package-lock.json` doesn't exist (it's gitignored), `npm install` resolves from `package.json`. The regenerator uses `emojilib` and `unicode-emoji-json` — both are `devDependencies`.

### 3. Enable the regenerator test

Open `test/prepareEmojiLibJson.test.ts` and find:

```ts
it.skip('create emojis lib json file', () => {
```

Change `it.skip(` to `it(`:

```ts
it('create emojis lib json file', () => {
```

### 4. Run the regenerator

```bash
npm test
```

Expected:

- ~10 seconds total (the dedup loop is O(n²))
- One spec file (`prepareEmojiLibJson.test.ts`) passes
- `src/lib/emoji-lib-output.json` is written (gitignored — that's expected)

### 5. Diff against the committed catalog

```bash
diff src/lib/emoji-lib.json src/lib/emoji-lib-output.json | head -100
```

Or for a structured view:

```bash
node -e "
const a = require('./src/lib/emoji-lib.json');
const b = require('./src/lib/emoji-lib-output.json');
const aKeys = new Set(Object.keys(a));
const bKeys = new Set(Object.keys(b));
const added = [...bKeys].filter(k => !aKeys.has(k));
const removed = [...aKeys].filter(k => !bKeys.has(k));
console.log('Added emojis:', added.length, added.slice(0, 10));
console.log('Removed emojis:', removed.length, removed.slice(0, 10));
console.log('Total before:', aKeys.size, '-> after:', bKeys.size);
"
```

Sanity-check the diff:

- **Expected count change** matches what you anticipated
- **Special-case overrides** show up in the modified emoji's `keywords` array
- **No accidental wholesale changes** — if every emoji shows a diff, something went wrong (e.g., dedup ordering changed)

### 6. Promote the output

If the diff is sane:

```bash
cp src/lib/emoji-lib-output.json src/lib/emoji-lib.json
```

### 7. Update `TOTAL_EMOJIS` if needed

Open `test/emojiLibJson.test.ts`. If the count changed:

```ts
const TOTAL_EMOJIS: number = 1906 // ← update this number to match
```

### 8. Re-skip the regenerator

Open `test/prepareEmojiLibJson.test.ts` and change `it(` back to `it.skip(`. **Don't forget this step** — leaving the regenerator un-skipped makes every CI run regenerate the catalog into the gitignored output file (a wasted run, not a leak, but still wrong).

### 9. Verify the suite passes against the new catalog

```bash
npm test
```

If `emojiLibJson.test.ts` fails on the deep-equal of a sample emoji (🤣, 😎), the upstream metadata changed for that emoji. Update the expected object in `emojiLibJson.test.ts` to match, then commit both.

If `main.test.ts` fails because a previously-resolved shortcode no longer resolves, that's a regression — the regeneration removed an alias you depend on. Add it back via `EMOJIS_SPECIAL_CASES` and regenerate again.

### 10. Commit

```bash
git add src/lib/emoji-lib.json test/prepareEmojiLibJson.test.ts test/emojiLibJson.test.ts
git commit -m "chore: regenerate emoji catalog"
```

If the regeneration was driven by a new special case, mention it in the message:

```
chore: regenerate emoji catalog with :rocketship: alias for 🚀
```

If the regeneration was driven by an upstream version bump, that bump should be a separate prior commit:

```
chore: bump unicode-emoji-json to 0.9.0
chore: regenerate emoji catalog
```

## Pitfalls

1. **Forgetting to re-skip** — the most common mistake. The CI then writes `emoji-lib-output.json` on every run; nothing breaks but it wastes resources
2. **Not reviewing the diff** — the dedup algorithm reassigns keywords across emojis when upstream changes. A single new keyword in `unicode-emoji-json` can shift many emojis' `keywords` arrays. Spot-check before committing
3. **Forgetting `TOTAL_EMOJIS`** — `emojiLibJson.test.ts` will fail with a count mismatch. The fix is one digit, but the failed CI run looks confusing without context
4. **Mixed commits** — committing the regeneration alongside unrelated code changes makes review hard. Always make the regeneration its own commit
5. **Missing dependency** — if `npm install` hasn't been run since the last `package.json` change, `emojilib` or `unicode-emoji-json` may be missing. The regenerator will fail with `Cannot find module`

## Don't

- ❌ Commit `src/lib/emoji-lib-output.json` — it's gitignored intentionally
- ❌ Hand-edit `src/lib/emoji-lib.json` after regeneration — round-trip through the regenerator instead
- ❌ Skip step 8 (re-skipping the test) — it's the easiest mistake to miss
- ❌ Bump `emojilib` and regenerate in the same commit — split into two commits for clean history

## Do

- ✅ Make the regeneration its own commit
- ✅ Update `TOTAL_EMOJIS` in the same commit
- ✅ Spot-check the diff for sanity (10–20 entries, not catastrophic)
- ✅ Run `npm test` after restoring `it.skip` to verify the suite passes against the new catalog

## Verification checklist

- [ ] Working tree was clean before starting
- [ ] `it.skip` is **re-applied** in `prepareEmojiLibJson.test.ts`
- [ ] `src/lib/emoji-lib-output.json` is **not** staged
- [ ] `TOTAL_EMOJIS` matches `Object.keys(emojiLibJsonData).length`
- [ ] `npm test` passes (all specs)
- [ ] Diff was reviewed and looks correct
- [ ] Single, well-named commit
