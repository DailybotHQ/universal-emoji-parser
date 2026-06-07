import { expect } from 'chai'
import { emojiLibJsonData } from '../src/index'
import type { EmojiType } from '../src/lib/type'

describe('Test emoji lib json data', () => {
  describe('Validate json data', () => {
    it('should contains emojis objects metadata', () => {
      // (1) Check emojiLibJsonData keys
      const emojiLibJsonDataKeys: Array<string> = Object.keys(emojiLibJsonData)
      expect(emojiLibJsonDataKeys).to.be.an('array')
      const TOTAL_EMOJIS: number = 1914
      expect(emojiLibJsonDataKeys.length).to.be.equal(TOTAL_EMOJIS)

      // (2) Check emojiLibJsonData values
      let emojiObjectValue: EmojiType = emojiLibJsonData['🤣']
      expect(emojiObjectValue).to.be.an('object')
      expect(emojiObjectValue).to.be.deep.equal({
        name: 'rolling on the floor laughing',
        slug: 'rolling_on_the_floor_laughing',
        group: 'Smileys & Emotion',
        emoji_version: '3.0',
        unicode_version: '3.0',
        skin_tone_support: false,
        char: '🤣',
        keywords: ['rolling_on_the_floor_laughing', 'rolling', 'floor', 'laughing', 'rofl', 'rotfl'],
      })

      // (3) Check emojiLibJsonData values
      emojiObjectValue = emojiLibJsonData['😎']
      expect(emojiObjectValue).to.be.an('object')
      expect(emojiObjectValue).to.be.deep.equal({
        name: 'smiling face with sunglasses',
        slug: 'smiling_face_with_sunglasses',
        group: 'Smileys & Emotion',
        emoji_version: '1.0',
        unicode_version: '1.0',
        skin_tone_support: false,
        char: '😎',
        keywords: ['smiling_face_with_sunglasses', 'cool', 'summer', 'sunglass', 'best', 'friends', 'mutual'],
      })
    })
  })
})
