import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
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
  })

  describe('Built bundle (dist/index.js, CommonJS consumer shape)', () => {
    const distPath = resolve(process.cwd(), 'dist/index.js')
    let dist: Record<string, unknown> | null = null

    before(function () {
      // Skip when running against source only (e.g. test:watch without a build).
      if (!existsSync(distPath)) {
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
