# Running Tests

How to run, watch, filter, and debug Vitest specs in Universal Emoji Parser. Each section explains what to do, why it works, and how to confirm the suite is healthy.

If you haven't installed dependencies yet, start with [Environment Setup](ENVIRONMENT_SETUP.md). For full Vitest conventions see [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md).

What healthy output looks like — `pnpm test`:

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
pnpm test
```

Internally: `vitest run` (config in `vitest.config.ts`). **Vitest** transpiles `.ts` on the fly via esbuild — no separate compile step.

Tests live in `test/*.test.ts`. There are three files:

- `test/main.test.ts` — public API behavior (the bulk of the suite)
- `test/emojiLibJson.test.ts` — catalog validation (count + sample entries)
- `test/prepareEmojiLibJson.test.ts` — regenerator (skipped by default; see [Regenerator](#5-running-the-regenerator))

---

## 2. Watch mode (TDD inner loop)

```bash
pnpm run test:watch
```

Runs `vitest` (watch mode), re-running affected specs on every save in `src/` or `test/`. ~1 second per re-run after the first compile. **This is the recommended default loop** for any code change.

To stop: `Ctrl+C` (or `q` in Vitest's interactive watch).

---

## 3. Run a single file

```bash
pnpm dlx vitest run test/main.test.ts
```

Useful when iterating on `main.test.ts` and you don't care about catalog tests.

---

## 4. Filter by name

Vitest's `-t` (`--testNamePattern`) matches against the concatenated `describe` + `it` names:

```bash
# Run only "should parse emojis from unicode"
pnpm dlx vitest run test/main.test.ts -t "should parse emojis from unicode"

# Run all tests in the "Using default options" describe block
pnpm dlx vitest run test/main.test.ts -t "Using default options"

# Run anything mentioning "shortcode"
pnpm dlx vitest run test/main.test.ts -t "shortcode"
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
pnpm test
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
pnpm test

# 9. Commit
git add src/lib/emoji-lib.json test/prepareEmojiLibJson.test.ts test/emojiLibJson.test.ts
git commit -m "chore: regenerate emoji catalog"
```

**Don't** commit `src/lib/emoji-lib-output.json` — it's gitignored intentionally. The regeneration result lives only in `emoji-lib.json` after copying.

Full procedure: [`/regenerate-emoji-lib`](../../.agents/commands/regenerate-emoji-lib.md).

---

## 6. Debugging a test

### Quick inspection — `console.log`

Tests are exempt from the `no-console` Biome rule that targets `src/` library code. Drop a `console.log` in the test, run `pnpm test`, look at the output.

```ts
it('should parse :smile:', () => {
  const result = uEmojiParser.parse(':smile:')
  console.log('Result:', result) // ← debugging
  expect(result).toContain('alt="🙂"')
})
```

Don't commit the `console.log` — but during dev, no problem.

### Step-through with Node Inspector

```bash
# Run tests with the inspector enabled, paused at start
pnpm dlx vitest run test/main.test.ts --inspect-brk --no-file-parallelism
```

Then in Chrome: `chrome://inspect` → "Open dedicated DevTools for Node" → set breakpoints in `src/index.ts` (TypeScript with source maps via **Vitest**/esbuild).

VS Code users: configure a launch config:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dlx", "vitest", "run", "test/main.test.ts", "--no-file-parallelism"],
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

pnpm dlx vite-node tmp/repro.ts
```

`tmp/` is gitignored, so it's safe for throwaway scripts. (`vite-node` ships with Vitest and runs `.ts` directly.)

---

## 7. CI mirroring

To match what the CI does on a PR:

```bash
pnpm install                         # Or skip if node_modules is current
pnpm run biome:check                 # Lint + format (single Biome step)
pnpm test                            # Vitest
pnpm run build                       # Vite — only if you want full CI parity (the PR `code_check.yml` doesn't build)
```

The release workflow does the same plus `pnpm run build` and the patch bump via `.github/scripts/prepare_release.sh`. See [Build & Deploy](../BUILD_DEPLOY.md).

---

## 8. Adding new tests

Follow the patterns in `test/main.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import uEmojiParser from '../src/index'

describe('Test <subject>', () => {
  describe('<scenario>', () => {
    it('should <observable behavior>', () => {
      // Arrange
      const text: string = ':smile:'

      // Act
      const result: string = uEmojiParser.parse(text)

      // Assert
      expect(result).toContain('alt="🙂"')
    })
  })
})
```

Conventions in [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md). Skill: [`/write-tests`](../../.agents/commands/write-tests.md).

---

## 9. Quick reference

| Goal                 | Command                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Run all tests        | `pnpm test`                                                           |
| Watch mode (TDD)     | `pnpm run test:watch`                                                 |
| Run a single file    | `pnpm dlx vitest run test/main.test.ts`                              |
| Filter by name       | `pnpm dlx vitest run -t "<pattern>"`                                 |
| Debug with inspector | `pnpm dlx vitest run test/main.test.ts --inspect-brk --no-file-parallelism` |
| Quick repro          | `pnpm dlx vite-node tmp/repro.ts`                                    |
| CI parity            | `pnpm install && pnpm run biome:check && pnpm test && pnpm run build` |

If a test doesn't run, check [Troubleshooting](TROUBLESHOOTING.md) — every issue we've actually hit is in there.
