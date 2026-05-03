# Testing Guide

How to write and run tests in Universal Emoji Parser. The package uses **Mocha + Chai** with `ts-node/register` so specs run as `.ts` directly — no transpile step.

## Where tests live

All specs live in `test/*.test.ts`:

| File | Coverage |
|---|---|
| `test/main.test.ts` | The public API: `parse`, `parseToHtml`, `parseToUnicode`, `parseToShortcode`, plus error cases and option permutations |
| `test/emojiLibJson.test.ts` | Catalog metadata: total count (`TOTAL_EMOJIS = 1906`), shape of `EmojiType` entries, presence of canonical emojis |
| `test/prepareEmojiLibJson.test.ts` | The regenerator — `it.skip`-guarded; runs only when explicitly enabled to rebuild `src/lib/emoji-lib.json` |

There is no separation by source-file ↔ test-file pairing — `main.test.ts` covers everything in `src/index.ts` because the API is small.

## Running tests

```bash
npm test                         # Everything
npm run test:watch               # Re-runs on file change (TDD inner loop)

# Single file
npx mocha --require ts-node/register test/main.test.ts --colors

# Filter by name
npx mocha --require ts-node/register test/main.test.ts --grep "should parse" --colors

# Single it()
npx mocha --require ts-node/register test/main.test.ts --grep "should throw error with not string parameter" --colors
```

Mocha config is inline in the `test` script: `--timeout 25000 --colors`. The 25-second timeout exists for one slow path (the regenerator's O(n²) dedup loop); regular specs finish in milliseconds.

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
  expect(result).to.be.equal(
    '<img class="emoji" alt="🙂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f642.svg"/>'
  )
})
```

Most existing tests use a single statement style (no comment markers); the explicit AAA blocks above are recommended for new tests where the sections aren't obvious. The existing tests **don't** use blank-line section separators — keep that style for consistency.

## Chai assertion idioms used in this repo

```ts
import { expect } from 'chai'

// Equality (primitives)
expect(result).to.be.equal('expected')
expect(count).to.be.equal(1906)

// Deep equality (objects, arrays)
expect(emojiObject).to.be.deep.equal({ name: '...', slug: '...', ... })

// Type checks
expect(arr).to.be.an('array')
expect(obj).to.be.an('object')
expect(str).to.be.a('string')

// Length
expect(emojiLibJsonDataKeys.length).to.be.equal(TOTAL_EMOJIS)

// Throws
expect(() => { uEmojiParser.parse(text) }).to.throw(Error)

// File system existence
expect(fs.existsSync(filePath)).to.be.true     // requires // eslint-disable-next-line @typescript-eslint/no-unused-expressions
```

> **Note**: Chai 4's `expect(x).to.be.true` style is a "no-op expression" by ESLint rules. Suppress with `// eslint-disable-next-line @typescript-eslint/no-unused-expressions` immediately above the line.

## Catalog tests (`emojiLibJson.test.ts`)

This file validates the curated catalog. Every assertion is **deterministic** — the catalog is committed JSON, so the count and entries are exact:

```ts
const TOTAL_EMOJIS: number = 1906
expect(emojiLibJsonDataKeys.length).to.be.equal(TOTAL_EMOJIS)
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

- Twemoji's own behavior — that's covered by the upstream package. Don't test that "🚀" → some-Twemoji-URL; just test that *our* code correctly hands off to `@twemoji/parser`
- Performance regressions — we don't have benchmark infrastructure. If you add one, also add a doc page

## Adding a regression test

When fixing a parsing bug:

1. **Get the exact input.** Copy-paste from the bug report; preserve every byte (variation selectors like `️`, ZWJ sequences, etc. matter)
2. **Stand it up as a failing test:**
   ```ts
   it('should parse :star: even with VS-16 (regression #123)', () => {
     const text: string = ':star:️'   // note the trailing variation selector
     const result: string = uEmojiParser.parse(text)
     expect(result).to.contain('alt="⭐️"')
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

There is **no coverage tool wired**. To add one (Istanbul / nyc):

```bash
npm install --save-dev nyc
```

Update `package.json`:

```json
{
  "scripts": {
    "test": "nyc mocha --require ts-node/register test/**.ts --timeout 25000 --colors",
    "coverage": "nyc report --reporter=text-summary"
  },
  "nyc": {
    "extension": [".ts"],
    "include": ["src/**/*.ts"],
    "exclude": ["**/*.test.ts"],
    "reporter": ["text", "html"],
    "all": true
  }
}
```

Then `npm test` produces a coverage report and `coverage/` (add to `.gitignore`). Document the addition in [Technologies](TECHNOLOGIES.md) and update this file.

## Speed tips

- `npm run test:watch` is the fastest loop — sub-second after the initial Mocha startup
- Filter aggressively with `--grep` when iterating on a single behavior
- The regenerator test (`prepareEmojiLibJson.test.ts`) is **slow** when un-skipped — O(n²) over 1906 emojis takes ~10 seconds. Don't enable it just to "see what happens"

## Mocking

The package has no external services — everything is in-memory data + a synchronous Twemoji call. There is **no mocking** in the test suite. Adding a mock is a smell; if you find yourself wanting one, the production code probably has IO it shouldn't have.

## Pre-push checklist

```bash
npm run eslint:check
npm run prettier:check
npm test
npm run build
```

All four must succeed. CI runs the same set on every PR.
