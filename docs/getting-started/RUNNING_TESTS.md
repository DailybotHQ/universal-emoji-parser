# Running Tests

How to run, watch, filter, and debug Mocha specs in Universal Emoji Parser. Each section explains what to do, why it works, and how to confirm the suite is healthy.

If you haven't installed dependencies yet, start with [Environment Setup](ENVIRONMENT_SETUP.md). For full Mocha/Chai conventions see [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md).

What healthy output looks like — `npm test`:

```
  Test emoji parser
    Using default options
      ✔ should parse emojis from unicode (45ms)
      ✔ should parse emojis from shortcode
      ✔ should parse a sentence with emojis from emoji unicode and shortcode
      ✔ Test emoji parser translating emojis unicodes to shortcodes
      ✔ Test emoji parser translating emojis shortcodes to unicodes
      ✔ should throw error with not string parameter
    Using custom options
      ✔ ... (etc)

  Test emoji lib json data
    Validate json data
      ✔ should contains emojis objects metadata

  N passing (Xs)
```

Total: ~5 seconds for the full suite.

---

## 1. Run all tests

```bash
npm test
```

Internally: `tsx ./node_modules/mocha/bin/mocha.js 'test/**/*.ts' --timeout 25000 --colors`. **tsx** executes `.ts` on the fly — no separate compile step.

Tests live in `test/*.test.ts`. There are three files:

- `test/main.test.ts` — public API behavior (the bulk of the suite)
- `test/emojiLibJson.test.ts` — catalog validation (count + sample entries)
- `test/prepareEmojiLibJson.test.ts` — regenerator (skipped by default; see [Regenerator](#5-running-the-regenerator))

---

## 2. Watch mode (TDD inner loop)

```bash
npm run test:watch
```

Re-runs the suite on every save in `src/` or `test/`. ~1 second per re-run after the first compile. **This is the recommended default loop** for any code change.

To stop: `Ctrl+C`.

---

## 3. Run a single file

```bash
npx tsx ./node_modules/mocha/bin/mocha.js test/main.test.ts --colors
```

Useful when iterating on `main.test.ts` and you don't care about catalog tests.

---

## 4. Filter by name

Mocha's `--grep` matches against the concatenated `describe` + `it` names:

```bash
# Run only "should parse emojis from unicode"
npx tsx ./node_modules/mocha/bin/mocha.js test/main.test.ts --grep "should parse emojis from unicode" --colors

# Run all tests in the "Using default options" describe block
npx tsx ./node_modules/mocha/bin/mocha.js test/main.test.ts --grep "Using default options" --colors

# Run anything mentioning "shortcode"
npx tsx ./node_modules/mocha/bin/mocha.js test/main.test.ts --grep "shortcode" --colors
```

---

## 5. Running the regenerator

`test/prepareEmojiLibJson.test.ts` is the **only** way to rebuild `src/lib/emoji-lib.json` from upstream sources. It's `it.skip`-guarded so it never runs by default:

```ts
it.skip('create emojis lib json file', () => { ... })
```

To regenerate:

```bash
# 1. Open the file
$EDITOR test/prepareEmojiLibJson.test.ts

# 2. Change `it.skip(` to `it(`

# 3. Run tests
npm test
# This time the regenerator runs (~10 seconds for the O(n²) dedup) and writes:
#   src/lib/emoji-lib-output.json

# 4. Diff against the committed catalog
diff src/lib/emoji-lib.json src/lib/emoji-lib-output.json | head -50

# 5. If happy, copy over
cp src/lib/emoji-lib-output.json src/lib/emoji-lib.json

# 6. Update TOTAL_EMOJIS in test/emojiLibJson.test.ts if the count changed

# 7. Re-skip the regenerator
$EDITOR test/prepareEmojiLibJson.test.ts
# Change `it(` back to `it.skip(`

# 8. Verify the test pass with the new catalog
npm test

# 9. Commit
git add src/lib/emoji-lib.json test/prepareEmojiLibJson.test.ts test/emojiLibJson.test.ts
git commit -m "chore: regenerate emoji catalog"
```

**Don't** commit `src/lib/emoji-lib-output.json` — it's gitignored intentionally. The regeneration result lives only in `emoji-lib.json` after copying.

Full procedure: [`/regenerate-emoji-lib`](../../.agents/commands/regenerate-emoji-lib.md).

---

## 6. Debugging a test

### Quick inspection — `console.log`

Tests are exempt from the `no-console` ESLint rule in `src/` (that rule targets library code). Drop a `console.log` in the test, run `npm test`, look at the output.

```ts
it('should parse :smile:', () => {
  const result = uEmojiParser.parse(':smile:')
  console.log('Result:', result) // ← debugging
  expect(result).to.contain('alt="🙂"')
})
```

Don't commit the `console.log` — but during dev, no problem.

### Step-through with Node Inspector

```bash
# Run tests with the inspector enabled, paused at start
node --import tsx --inspect-brk ./node_modules/mocha/bin/mocha.js test/main.test.ts --timeout 999999 --colors
```

Then in Chrome: `chrome://inspect` → "Open dedicated DevTools for Node" → set breakpoints in `src/index.ts` (TypeScript with source maps via **tsx**).

VS Code users: configure a launch config:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Mocha tests",
  "runtimeExecutable": "node",
  "runtimeArgs": ["--import", "tsx"],
  "args": ["./node_modules/mocha/bin/mocha.js", "test/**/*.ts", "--timeout", "999999", "--colors"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Set breakpoints in `.ts` files and hit F5.

### Reproducing in `tmp/`

For ad-hoc inspection without test infrastructure:

```bash
# tmp/repro.ts
cat > tmp/repro.ts <<'EOF'
import uEmojiParser from '../src/index'
const result = uEmojiParser.parse('hello :smile: 🚀', { parseToHtml: false, parseToShortcode: true })
console.log(JSON.stringify(result))
EOF

npx ts-node tmp/repro.ts
```

`tmp/` is gitignored, so it's safe for throwaway scripts.

---

## 7. CI mirroring

To match what the CI does on a PR:

```bash
npm install                          # Or skip if node_modules is current
npm run eslint:check                 # Lint
npm run prettier:check               # Format
npm test                             # Mocha
npm run build                        # Webpack — only if you want full CI parity (the PR `code_check.yml` doesn't build)
```

The release workflow does the same plus `npm run build` and `npm version patch`. See [Build & Deploy](../BUILD_DEPLOY.md).

---

## 8. Adding new tests

Follow the patterns in `test/main.test.ts`:

```ts
import { expect } from 'chai'
import uEmojiParser from '../src/index'

describe('Test <subject>', () => {
  describe('<scenario>', () => {
    it('should <observable behavior>', () => {
      // Arrange
      const text: string = ':smile:'

      // Act
      const result: string = uEmojiParser.parse(text)

      // Assert
      expect(result).to.contain('alt="🙂"')
    })
  })
})
```

Conventions in [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md). Skill: [`/write-tests`](../../.agents/commands/write-tests.md).

---

## 9. Quick reference

| Goal                 | Command                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Run all tests        | `npm test`                                                                                                   |
| Watch mode (TDD)     | `npm run test:watch`                                                                                         |
| Run a single file    | `npx tsx ./node_modules/mocha/bin/mocha.js test/main.test.ts --colors`                                       |
| Filter by name       | `npx tsx ./node_modules/mocha/bin/mocha.js 'test/**/*.ts' --grep "<pattern>" --colors`                       |
| Debug with inspector | `node --import tsx --inspect-brk ./node_modules/mocha/bin/mocha.js 'test/**/*.ts' --timeout 999999 --colors` |
| Quick repro          | `npx ts-node tmp/repro.ts`                                                                                   |
| CI parity            | `npm install && npm run eslint:check && npm run prettier:check && npm test && npm run build`                 |

If a test doesn't run, check [Troubleshooting](TROUBLESHOOTING.md) — every issue we've actually hit is in there.
