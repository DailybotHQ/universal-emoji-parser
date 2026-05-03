import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect } from 'chai'
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

describe('Public exports surface', () => {
  describe('Source (src/index.ts)', () => {
    it('exposes the documented methods on the default export', () => {
      for (const method of EXPECTED_METHODS) {
        expect(uEmojiParser[method], `default.${method}`).to.be.a('function')
      }
    })

    it('exposes DEFAULT_EMOJI_CDN as a non-empty string', () => {
      expect(DEFAULT_EMOJI_CDN).to.be.a('string')
      expect(DEFAULT_EMOJI_CDN.length).to.be.greaterThan(0)
    })

    it('exposes emojiLibJsonData with the curated catalog', () => {
      expect(emojiLibJsonData).to.be.an('object')
      expect(Object.keys(emojiLibJsonData).length).to.be.greaterThan(1500)
    })

    /**
     * Webpack's `commonjs2` output assigns `module.exports = uEmojiParser`, which wipes the
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
      ).to.deep.equal([])
    })
  })

  describe('Built bundle (dist/index.js, CommonJS consumer shape)', () => {
    let dist: Record<string, unknown> | null = null

    before(function () {
      if (!existsSync(distPath)) {
        // eslint-disable-next-line no-console
        console.log('       (skipping bundle suite: dist/index.js not built — run `npm run build`)')
        this.skip()
      }
      const distMtime = statSync(distPath).mtimeMs
      const newestSrcMtime = newestMtimeUnder(resolve(repoRoot, 'src'))
      if (distMtime < newestSrcMtime) {
        // eslint-disable-next-line no-console
        console.log('       (skipping bundle suite: dist/index.js is older than src/ — run `npm run build`)')
        this.skip()
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      dist = require(distPath) as Record<string, unknown>
    })

    it('reattaches DEFAULT_EMOJI_CDN onto module.exports for require() consumers', () => {
      expect(dist).to.have.property('DEFAULT_EMOJI_CDN').that.is.a('string')
      expect((dist!.DEFAULT_EMOJI_CDN as string).length).to.be.greaterThan(0)
      expect(dist!.DEFAULT_EMOJI_CDN).to.equal(DEFAULT_EMOJI_CDN)
    })

    it('reattaches emojiLibJsonData onto module.exports for require() consumers', () => {
      expect(dist).to.have.property('emojiLibJsonData').that.is.an('object')
      expect(Object.keys(dist!.emojiLibJsonData as object).length).to.equal(Object.keys(emojiLibJsonData).length)
    })

    it('exposes all documented methods via require()', () => {
      for (const method of EXPECTED_METHODS) {
        expect(dist![method], `require()['${method}']`).to.be.a('function')
      }
    })

    it('parse() works through the require() entry point', () => {
      const html = (dist as { parse: (text: string) => string }).parse(':rocket:')
      expect(html).to.match(/<img class="emoji" alt="🚀" src="https:\/\/.+1f680\.svg"\/>/)
    })
  })
})
