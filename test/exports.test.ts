import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import uEmojiParser, { DEFAULT_EMOJI_CDN, emojiLibJsonData } from '../src/index'

const EXPECTED_METHODS: ReadonlyArray<keyof typeof uEmojiParser> = [
  'parse',
  'parseToHtml',
  'parseToUnicode',
  'parseToShortcode',
  'getEmojiObjectByShortcode',
  'getDefaultOptions',
]

const repoRoot = process.cwd()
const sourcePath = resolve(repoRoot, 'src/index.ts')
const distPath = resolve(repoRoot, 'dist/index.js')

function newestMtimeUnder(dir: string): number {
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeUnder(full))
    } else if (entry.isFile()) {
      newest = Math.max(newest, statSync(full).mtimeMs)
    }
  }
  return newest
}

// The built-bundle suite needs an up-to-date dist/index.js. Compute staleness up front
// and skip the suite (with a hint) when dist/ is missing or older than src/, so
// `npm test` never fails spuriously before a build.
function bundleSkipReason(): string | null {
  if (!existsSync(distPath)) return 'dist/index.js not built — run `npm run build`'
  if (statSync(distPath).mtimeMs < newestMtimeUnder(resolve(repoRoot, 'src'))) {
    return 'dist/index.js is older than src/ — run `npm run build`'
  }
  return null
}

const skipReason = bundleSkipReason()
if (skipReason) {
  console.log(`       (skipping bundle suite: ${skipReason})`)
}

describe('Public exports surface', () => {
  describe('Source (src/index.ts)', () => {
    it('exposes the documented methods on the default export', () => {
      for (const method of EXPECTED_METHODS) {
        expect(uEmojiParser[method], `default.${method}`).toBeTypeOf('function')
      }
    })

    it('exposes DEFAULT_EMOJI_CDN as a non-empty string', () => {
      expect(DEFAULT_EMOJI_CDN).toBeTypeOf('string')
      expect(DEFAULT_EMOJI_CDN.length).toBeGreaterThan(0)
    })

    it('exposes emojiLibJsonData with the curated catalog', () => {
      expect(emojiLibJsonData).toBeTypeOf('object')
      expect(Object.keys(emojiLibJsonData).length).toBeGreaterThan(1500)
    })

    /**
     * Vite's library `commonjs` output assigns `module.exports = uEmojiParser`, which wipes the
     * named exports. Every `export const` in src/index.ts must therefore be reattached on
     * `module.exports` manually, or it will arrive as `undefined` to `require()` consumers
     * (and `import`'s named-export interop will also fail in Node ESM).
     *
     * Static analysis here so the rule is enforced even when CI runs `npm test` without a
     * `dist/` build (the bundle suite below covers the same property at runtime).
     */
    it('reattaches every `export const` onto `module.exports` (static check)', () => {
      const source = readFileSync(sourcePath, 'utf8')
      const declaredExports = [...source.matchAll(/^\s*export\s+const\s+(\w+)/gm)].map((m) => m[1])
      const reattachedExports = [...source.matchAll(/^\s*module\.exports\.(\w+)\s*=/gm)].map((m) => m[1])

      const missing = declaredExports.filter((name) => !reattachedExports.includes(name))
      expect(
        missing,
        `These named exports must be reattached at the bottom of src/index.ts:\n` +
          missing.map((name) => `  module.exports.${name} = ${name}`).join('\n')
      ).toEqual([])
    })
  })

  describe.skipIf(skipReason !== null)('Built bundle (dist/index.js, CommonJS consumer shape)', () => {
    // `require(distPath)` MUST run inside a hook, not at describe-collection time.
    // The describe callback executes when Vitest collects tests, even when `skipIf`
    // marks the inner tests as skipped — so loading `dist/` here would throw
    // `MODULE_NOT_FOUND` in CI (where the suite runs before the build job).
    let dist: Record<string, unknown>
    beforeAll(() => {
      const require = createRequire(import.meta.url)
      dist = require(distPath) as Record<string, unknown>
    })

    it('reattaches DEFAULT_EMOJI_CDN onto module.exports for require() consumers', () => {
      expect(dist.DEFAULT_EMOJI_CDN).toBeTypeOf('string')
      expect((dist.DEFAULT_EMOJI_CDN as string).length).toBeGreaterThan(0)
      expect(dist.DEFAULT_EMOJI_CDN).toBe(DEFAULT_EMOJI_CDN)
    })

    it('reattaches emojiLibJsonData onto module.exports for require() consumers', () => {
      expect(dist.emojiLibJsonData).toBeTypeOf('object')
      expect(Object.keys(dist.emojiLibJsonData as object).length).toBe(Object.keys(emojiLibJsonData).length)
    })

    it('exposes all documented methods via require()', () => {
      for (const method of EXPECTED_METHODS) {
        expect(dist[method], `require()['${method}']`).toBeTypeOf('function')
      }
    })

    it('parse() works through the require() entry point', () => {
      const html = (dist as { parse: (text: string) => string }).parse(':rocket:')
      expect(html).toMatch(/<img class="emoji" alt="🚀" src="https:\/\/.+1f680\.svg"\/>/)
    })
  })
})
