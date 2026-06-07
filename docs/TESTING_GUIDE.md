# Testing Guide

How to write and run tests in Universal Emoji Parser. The package uses **Vitest** — specs run as `.ts` directly with no separate compile step (Vitest is ESM-native and esbuild-powered). Configuration lives in `vitest.config.ts`.

## Where tests live

All specs live in `test/*.test.ts`:

| File                               | Coverage                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `test/main.test.ts`                | The public API: `parse`, `parseToHtml`, `parseToUnicode`, `parseToShortcode`, plus error cases and option permutations |
| `test/emojiLibJson.test.ts`        | Catalog metadata: total count (`TOTAL_EMOJIS = 1914`), shape of `EmojiType` entries, presence of canonical emojis      |
| `test/exports.test.ts`             | Dual-export contract: static check of `src/index.ts`, plus a `dist/index.js` bundle smoke test via `createRequire` + `describe.skipIf` |
| `test/prepareEmojiLibJson.test.ts` | The regenerator — `it.skip`-guarded; runs only when explicitly enabled to rebuild `src/lib/emoji-lib.json`             |

There is no separation by source-file ↔ test-file pairing — `main.test.ts` covers everything in `src/index.ts` because the API is small.

## Running tests

```bash
npm test                         # Everything (vitest run)
npm run test:watch               # Re-runs on file change (TDD inner loop — vitest)

# Single file
npx vitest run test/main.test.ts

# Filter by name (-t / --testNamePattern)
npx vitest run test/main.test.ts -t "should parse"

# Single it()
npx vitest run test/main.test.ts -t "should throw error with not string parameter"
```

Vitest is configured in `vitest.config.ts`. Most specs finish in milliseconds; the only slow path is the regenerator's O(n²) dedup loop (and it's `it.skip`-guarded by default).

## Conventions

### File and test naming

```ts
describe('Test emoji parser', () => {                         // Top-level: subject under test
  describe('Using default options', () => {                   // Nested: scenario / configuration
    it('should parse emojis from unicode', () => { ... })      // Single behavior
    it('should parse emojis from shortcode', () => { ... })
  })

  describe('Using custom options', () => {
    it('should parse emojis to shortcode only', () => { ... })
  })
})
```

- **Top-level `describe`** matches the module under test (`Test emoji parser`, `Test emoji lib json data`)
- **Nested `describe`** groups by scenario (`Using default options`, `Validate json data`)
- **`it` names start with "should"** describing observable behavior — never internal mechanics

### One behavior per `it`

If you need "and" in an `it` name, split the test:

```ts
// ❌ tests two behaviors
it('should parse emojis and handle the empty string', ...)

// ✅
it('should parse emojis from unicode', ...)
it('should return empty string when input is empty', ...)
```

### Arrange / Act / Assert structure

```ts
it('should parse emojis from shortcode', () => {
  // Arrange — declare inputs + expectations
  const text: string = ':smile:'

  // Act — call the code under test
  const result: string = uEmojiParser.parse(text)

  // Assert — verify the output
  expect(result).toBe(
    '<img class="emoji" alt="🙂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f642.svg"/>'
  )
})
```

Most existing tests use a single statement style (no comment markers); the explicit AAA blocks above are recommended for new tests where the sections aren't obvious. The existing tests **don't** use blank-line section separators — keep that style for consistency.

## Vitest assertion idioms used in this repo

```ts
import { describe, it, expect } from 'vitest'

// Equality (primitives)
expect(result).toBe('expected')
expect(count).toBe(1914)

// Deep equality (objects, arrays)
expect(emojiObject).toEqual({ name: '...', slug: '...', ... })

// Type checks
expect(arr).toBeTypeOf('object')        // arrays are typeof 'object'
expect(str).toBeTypeOf('string')
expect(Array.isArray(arr)).toBe(true)   // when you specifically need "is an array"

// Length
expect(emojiLibJsonDataKeys.length).toBe(TOTAL_EMOJIS)

// Numeric comparisons
expect(count).toBeGreaterThan(0)

// Throws
expect(() => { uEmojiParser.parse(text) }).toThrow(Error)

// Substring / pattern
expect(result).toMatch('alt="⭐️"')

// File system existence
expect(fs.existsSync(filePath)).toBe(true)
```

`expect(x).toBe(true)` is a normal call expression, so no special lint suppression is needed for boolean assertions.

## Catalog tests (`emojiLibJson.test.ts`)

This file validates the curated catalog. Every assertion is **deterministic** — the catalog is committed JSON, so the count and entries are exact:

```ts
const TOTAL_EMOJIS: number = 1914
expect(emojiLibJsonDataKeys.length).toBe(TOTAL_EMOJIS)
```

If you regenerate the catalog and the count changes, **update `TOTAL_EMOJIS`** in this file as part of the same commit. The PR diff makes the count change reviewable.

The deep-equal checks pin the shape of specific emojis (🤣, 😎). Update these only if the upstream `unicode-emoji-json` changes the metadata — typically you don't.

## The regenerator (`prepareEmojiLibJson.test.ts`)

This is the **only** way to rebuild `src/lib/emoji-lib.json`. Key facts:

- **`it.skip(...)`** — disabled by default; running `npm test` does not regenerate
- Imports `emojilib` and `unicode-emoji-json` (devDependencies) and merges them
- Applies `EMOJIS_SPECIAL_CASES` overrides (include/exclude per emoji)
- Runs an O(n²) dedup loop to ensure each keyword appears on at most one emoji (the most-canonical one)
- Writes `src/lib/emoji-lib-output.json` (gitignored)

Procedure to regenerate:

1. Edit `it.skip(...)` → `it(...)` in `prepareEmojiLibJson.test.ts`
2. `npm test` — the test runs and writes the output file
3. `diff src/lib/emoji-lib.json src/lib/emoji-lib-output.json` — review changes
4. `cp src/lib/emoji-lib-output.json src/lib/emoji-lib.json` if happy
5. Update `TOTAL_EMOJIS` in `emojiLibJson.test.ts` if the count changed
6. **Restore `it.skip`** in `prepareEmojiLibJson.test.ts`
7. `npm test` (without `.skip` reverted, this would re-run; with skip it's safe)
8. Commit all four files together: `prepareEmojiLibJson.test.ts`, `emoji-lib.json`, `emojiLibJson.test.ts`, and any test changes that motivated the regen

Full walkthrough: [`/regenerate-emoji-lib`](../.agents/commands/regenerate-emoji-lib.md).

## What to test

**Always:**

- A new public method or option flag — exhaustive permutations of the new dimension
- A regression — paste the failing input verbatim, assert the corrected output
- A new keyword/alias added via `EMOJIS_SPECIAL_CASES` — at least one test that resolves the new shortcode

**Sometimes:**

- HTML output snapshots — when adding a new emoji-rendering path. Be aware these are large and noisy in diffs
- Internal helpers (`getEmojiObjectByShortcode`, `getDefaultOptions`) — when changing their behavior; they're typed as part of `UEmojiParserType`, so consumers can technically rely on them

**Rarely:**

- Twemoji's own behavior — that's covered by the upstream package. Don't test that "🚀" → some-Twemoji-URL; just test that _our_ code correctly hands off to `@twemoji/parser`
- Performance regressions — we don't have benchmark infrastructure. If you add one, also add a doc page

## Adding a regression test

When fixing a parsing bug:

1. **Get the exact input.** Copy-paste from the bug report; preserve every byte (variation selectors like `️`, ZWJ sequences, etc. matter)
2. **Stand it up as a failing test:**
   ```ts
   it('should parse :star: even with VS-16 (regression #123)', () => {
     const text: string = ':star:️' // note the trailing variation selector
     const result: string = uEmojiParser.parse(text)
     expect(result).toMatch('alt="⭐️"')
   })
   ```
3. Run `npm run test:watch`; watch the new test fail
4. Fix `src/index.ts` until it passes
5. Commit fix + test together with a `fix:` conventional message

## Snapshot-style assertions

The integration tests in `main.test.ts` use **literal expected output strings** for full HTML, not a snapshot library. This is deliberate:

- The diff shows up clearly in PR review (no opaque `__snapshots__` folder)
- Updating an expectation requires intent — it's a real code change
- No additional dev dependency

When adding a new snapshot-style assertion, manually run the input through the current code, paste the output literally, then verify it visually before committing.

## Coverage

There is **no coverage tool wired**. Vitest has first-class coverage support, so adding it is one dev dependency:

```bash
npm install --save-dev @vitest/coverage-v8
```

Then run with the flag, or wire a script:

```bash
npx vitest run --coverage
```

```json
{
  "scripts": {
    "coverage": "vitest run --coverage"
  }
}
```

Configure includes/excludes under `test.coverage` in `vitest.config.ts`. Coverage output lands in `coverage/` (add to `.gitignore`). Document the addition in [Technologies](TECHNOLOGIES.md) and update this file.

## Speed tips

- `npm run test:watch` is the fastest loop — sub-second after the initial Vitest startup
- Filter aggressively with `-t "<name>"` when iterating on a single behavior
- The regenerator test (`prepareEmojiLibJson.test.ts`) is **slow** when un-skipped — O(n²) over 1914 emojis takes ~10 seconds. Don't enable it just to "see what happens"

## Mocking

The package has no external services — everything is in-memory data + a synchronous Twemoji call. There is **no mocking** in the test suite. Adding a mock is a smell; if you find yourself wanting one, the production code probably has IO it shouldn't have.

## Pre-push checklist

```bash
npm run biome:check
npm test
npm run build
```

All three must succeed. CI runs the same set on every PR.
