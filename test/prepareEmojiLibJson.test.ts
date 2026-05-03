import { expect } from 'chai'
import { EmojiLibJsonType, EmojiType, ObjectType } from '../src/lib/type'
import emojilib from 'emojilib'
import unicodeEmojiJson from 'unicode-emoji-json'
import * as fs from 'fs'

describe('Prepare emoji parser assets', () => {
  const EMOJIS_SPECIAL_CASES: ObjectType = {
    '☕': {
      include: ['coffee'],
    },
    '🤎': {
      exclude: ['coffee'],
    },
    '❤️': {
      include: ['heart'],
    },
    '💘': {
      exclude: ['heart'],
    },
    '👮‍♀️': {
      include: ['policewoman', 'female-police-officer'],
      exclude: ['legal', 'arrest'],
    },
    '✅': {
      include: ['white_check_mark'],
    },
    '⏸️': {
      include: ['double_vertical_bar'],
    },
  }

  /**
   * This test allows you to recreate the emoji-lib.json file,
   * which contains the definition of all unicode emojis with their respective aliases.
   *
   * Note: By default this test is disabled, reactivate it only if you need to regenerate the file.
   ***/
  it.skip('create emojis lib json file', () => {
    // Initialize the data structure for storing emoji data from unicodeEmojiJson
    const unicodeEmojiJsonData: ObjectType = unicodeEmojiJson
    // Retrieve the set of keywords from emojilib
    const keywordSet: ObjectType = emojilib
    // Iterate over each emoji in the unicodeEmojiJsonData
    for (const emoji in unicodeEmojiJsonData) {
      // Assign the emoji character itself to the 'char' property
      unicodeEmojiJsonData[emoji].char = emoji
      // If the emoji has predefined keywords in emojilib, use them
      if (keywordSet[emoji]) {
        unicodeEmojiJsonData[emoji].keywords = keywordSet[emoji]
      } else {
        // Otherwise, use the slug as the keyword
        unicodeEmojiJsonData[emoji].keywords = [unicodeEmojiJsonData[emoji].slug]
      }
      // Ensure the slug is included in the keywords list
      if (!unicodeEmojiJsonData[emoji].keywords.includes(unicodeEmojiJsonData[emoji].slug)) {
        unicodeEmojiJsonData[emoji].keywords.unshift(unicodeEmojiJsonData[emoji].slug)
      }
      // Handle special cases for specific emojis
      if (EMOJIS_SPECIAL_CASES[emoji]) {
        // Include additional keywords if specified
        if (EMOJIS_SPECIAL_CASES[emoji].include) {
          EMOJIS_SPECIAL_CASES[emoji].include.forEach((keyword: string) => {
            if (!unicodeEmojiJsonData[emoji].keywords.includes(keyword)) {
              unicodeEmojiJsonData[emoji].keywords.unshift(keyword)
            }
          })
        }
        // Exclude certain keywords if specified
        if (EMOJIS_SPECIAL_CASES[emoji].exclude) {
          unicodeEmojiJsonData[emoji].keywords = unicodeEmojiJsonData[emoji].keywords.filter(
            (keywordInternal: string) => !EMOJIS_SPECIAL_CASES[emoji].exclude.includes(keywordInternal)
          )
        }
      }
    }

    /**
     * These are some updates that allow you to eliminate duplicates in keywords related to emojis,
     * to prevent multiple keywords from being associated with the same emoji,
     * which will allow more precise and efficient transformations at runtime.
     *
     * This algorithm is O(n2), so it's inefficient, but it only needs to be run once to generate the emoji-lib.json file.
     */
    const emojiLibJson: EmojiLibJsonType = unicodeEmojiJsonData
    const emojiLibJsonKeys: Array<string> = Object.keys(emojiLibJson)
    emojiLibJsonKeys.forEach((unicodeEmoji: string) => {
      const emojiObject: EmojiType = JSON.parse(JSON.stringify(emojiLibJson[unicodeEmoji]))
      emojiObject.keywords.forEach((keyword: string) => {
        let emojisObjectsFoundPerKeyword: Array<EmojiType> = []
        emojiLibJsonKeys.forEach((unicodeEmojiInternal: string) => {
          const emojiObjectInternal: EmojiType = JSON.parse(JSON.stringify(emojiLibJson[unicodeEmojiInternal]))
          if (emojiObjectInternal.keywords.includes(keyword)) {
            emojiObjectInternal.keyword_index_found = emojiObjectInternal.keywords.indexOf(keyword)
            emojisObjectsFoundPerKeyword.push(emojiObjectInternal)
          }
        })
        if (emojisObjectsFoundPerKeyword.length) {
          emojisObjectsFoundPerKeyword = emojisObjectsFoundPerKeyword.sort(
            (item1: EmojiType, item2: EmojiType) => item1.keyword_index_found! - item2.keyword_index_found!
          )
          emojisObjectsFoundPerKeyword.splice(0, 1)
          if (emojisObjectsFoundPerKeyword.length) {
            emojisObjectsFoundPerKeyword.forEach((emojiObjectFound: EmojiType) => {
              if (emojiObjectFound.keyword_index_found !== 0) {
                emojiLibJson[emojiObjectFound.char].keywords.splice(emojiObjectFound.keyword_index_found!, 1)
              }
            })
          }
        }
      })
    })

    /**
     * Write emoji lib json output into a file
     */
    const filePath: string = 'src/lib/emoji-lib-output.json'
    fs.writeFileSync(filePath, JSON.stringify(emojiLibJson, null, 2))
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(fs.existsSync(filePath)).to.be.true
  })
})
