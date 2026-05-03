---
name: write-tests
description: Author Mocha + Chai tests for a parsing bug or new feature
---

# Command: `/write-tests`

Add Mocha + Chai specs for code that just changed or that lacks coverage. The runner is `tsx ./node_modules/mocha/bin/mocha.js 'test/**/*.ts'` so specs run as `.ts` directly (Chai 6 is ESM — `ts-node/register` alone is not used for the suite).

## When to use

- The user just shipped untested code and wants tests
- A bug was found and needs a regression test
- The user asks "write tests for X"
- Adding a new public method / option / `EMOJIS_SPECIAL_CASES` entry

## Inputs to confirm

- **What's being tested** — public method, internal helper, catalog behavior
- **For bug fixes** — the exact failing input (paste verbatim, don't summarize)
- **For new features** — the expected behavior including edge cases

## Decide where the test lives

| Code under test                             | Test file                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Anything in `src/index.ts` (public methods) | `test/main.test.ts`                                                                       |
| Catalog content / shape                     | `test/emojiLibJson.test.ts`                                                               |
| Regenerator pipeline                        | `test/prepareEmojiLibJson.test.ts` (rare — usually you don't test the regenerator itself) |

Most tests go in `test/main.test.ts`.

## Procedure

### 1. Read the code under test

Don't write tests blindly. Read the function / branch to understand:

- What inputs are valid?
- What edge cases exist (empty string, undefined, non-string, very long input, garbage characters)?
- What's the expected output for each?

### 2. Reproduce the bug or behavior in `tmp/`

For a quick check before writing the test:

```bash
cat > tmp/repro.ts <<'EOF'
import uEmojiParser from '../src/index'
console.log(JSON.stringify(uEmojiParser.parse(':smile: 🚀')))
EOF
npx ts-node tmp/repro.ts
```

This confirms what the **current** behavior is so the test asserts the **right** value.

### 3. Pick the right `describe` block

Existing structure in `main.test.ts`:

```ts
describe('Test emoji parser', () => {
  describe('Using default options', () => {
    it('should parse emojis from unicode', ...)
    it('should parse emojis from shortcode', ...)
    // ...
  })
  describe('Using custom options', () => {
    // ...
  })
})
```

Place new tests under the closest matching scenario. If none fits, add a new `describe('Using <scenario>', ...)`.

### 4. Write the test

Follow the project conventions (no semicolons, single quotes, AAA structure):

```ts
it('should resolve :thumbsup: to 👍 even when nested in text', () => {
  // Arrange
  const text: string = 'great work :thumbsup: keep it up'

  // Act
  const result: string = uEmojiParser.parseToUnicode(text)

  // Assert
  expect(result).to.be.equal('great work 👍 keep it up')
})
```

For HTML output assertions, paste the literal expected string:

```ts
it('should render 🚀 as <img class="emoji">', () => {
  const result: string = uEmojiParser.parseToHtml('🚀')
  expect(result).to.be.equal(
    '<img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
  )
})
```

For error paths:

```ts
it('should throw when input is undefined', () => {
  let text: any = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
  expect(() => {
    uEmojiParser.parse(text)
  }).to.throw(Error)
})
```

For object equality:

```ts
it('should return the full EmojiType object for :smile:', () => {
  const emoji = uEmojiParser.getEmojiObjectByShortcode('smile')
  expect(emoji).to.be.an('object')
  expect(emoji?.char).to.be.equal('🙂')
})
```

### 5. Run the test

```bash
npm run test:watch
```

Confirm:

- New test runs (Mocha lists it in the output)
- Test fails (if you wrote a regression test against a known bug) **or** passes (if testing existing behavior)
- No other tests broke

### 6. Fix the bug (if applicable)

If the test was a regression:

1. Edit `src/index.ts` to make it pass
2. Watch the test go green
3. Verify other tests still pass

### 7. Verify

```bash
npm test                      # All specs
npm run eslint:check          # Lint (catches no-console accidents)
npm run prettier:check        # Format
```

### 8. Commit

```bash
git add test/main.test.ts src/index.ts
git commit -m "fix: resolve :thumbsup: when nested in text (regression #123)"
```

For new feature tests:

```bash
git commit -m "test: cover :rocketship: alias resolution"
```

## Conventions

### Test names

- Start with `'should '`
- Describe **observable behavior**, not implementation (`should resolve :smile: to 🙂`, not `should call getEmojiObjectByShortcode`)
- Mention the **regression issue** in parentheses for bug fixes (`(regression #123)`)
- Keep under ~80 characters

### Structure

```ts
it('should <behavior>', () => {
  // Arrange — declare inputs (one or two `const`s)
  const text: string = 'input'

  // Act — call the code under test (one statement)
  const result: string = uEmojiParser.parse(text)

  // Assert — verify (one or more expects)
  expect(result).to.be.equal('expected')
})
```

The existing tests in `main.test.ts` **don't** use the explicit AAA comments — keep the structure but don't add comments unless the sections aren't obvious.

### Multi-step tests

For tests that exercise several inputs of the same shape, use comment-numbered sections:

```ts
it('should parse emojis from shortcode', () => {
  // (1) Smile
  let text: string = ':smile:'
  let result: string = uEmojiParser.parse(text)
  expect(result).to.contain('alt="🙂"')

  // (2) Sunglasses
  text = ':smiling_face_with_sunglasses:'
  result = uEmojiParser.parse(text)
  expect(result).to.contain('alt="😎"')

  // (3) Rocket
  text = ':rocket:'
  result = uEmojiParser.parse(text)
  expect(result).to.contain('alt="🚀"')
})
```

This matches the existing style in `main.test.ts`. Use it when the cases are variations of the same behavior; use separate `it` blocks when they're distinct behaviors.

### Don't use mocking libraries

The package has no external IO — everything is in-memory. There's no need (or pre-installed support) for `sinon`, `jest.mock`, etc. Use real inputs.

## Pitfalls

1. **Forgetting `import { expect } from 'chai'`** — Mocha's `it`/`describe` are global, but `expect` is not
2. **Using `console.log` in `src/`** — ESLint blocks it. In tests it's fine (the lint rule applies to `.ts` files but the failure is on `src/`)
3. **Testing the wrong shape** — `parseToHtml` returns full HTML; `parseToUnicode` returns text with unicode emojis; `parseToShortcode` returns text with `:slug:`. Match the test to the method
4. **Snapshot fragility** — pasting full HTML output into a test means the test breaks on Twemoji bumps. That's intentional — we want to know when the URL format changes — but use `.contain()` instead of `.equal()` if you only care about specific substrings
5. **Not running watch mode** — slow inner loops mean fewer tests get written. Use `npm run test:watch`

## Don't

- ❌ Skip the test because "it's obvious" — bugs hide in obvious code
- ❌ Use mocking libraries — there's nothing to mock
- ❌ Test internal helpers in isolation when the public method covers them — duplicate work
- ❌ Use `runBlocking` patterns or `async/await` in tests — every method is sync; `async` adds complexity for nothing

## Do

- ✅ Use the existing patterns in `main.test.ts` as templates
- ✅ Paste failing inputs verbatim — preserve every byte (variation selectors, ZWJ sequences)
- ✅ One behavior per `it`, but allow numbered sub-cases for variations
- ✅ Run `npm run test:watch` while writing
- ✅ Commit fix + test together with `fix:` conventional message

## Verification checklist

- [ ] New test added in the right `describe` block
- [ ] Test fails before the fix (for regression tests) or passes (for behavior tests)
- [ ] Other tests still pass
- [ ] No `console.log` left in `src/` or in production tests
- [ ] Lint + format pass
- [ ] Commit message uses conventional format
