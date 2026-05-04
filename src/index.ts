import { EmojiLibJsonType, EmojiParseOptionsType, EmojiType, TwemojiEntity, UEmojiParserType } from './lib/type'
import emojiLibJson from './lib/emoji-lib.json'
import { parse } from '@twemoji/parser'

/**
 * Constances
 */
export const DEFAULT_EMOJI_CDN: string = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/'
export const emojiLibJsonData: EmojiLibJsonType = emojiLibJson

/**
 * Parse text with emoji support
 * @return {string}
 */
const uEmojiParser: UEmojiParserType = {
  getEmojiObjectByShortcode(shortcode: string): EmojiType | undefined {
    shortcode = shortcode.replace(/:/g, '')
    if (
      emojiLibJsonData[shortcode] &&
      typeof emojiLibJsonData[shortcode] === 'object' &&
      emojiLibJsonData[shortcode].char
    ) {
      return emojiLibJsonData[shortcode]
    } else {
      const emojiUnicode: string | undefined = Object.keys(emojiLibJsonData).find((emojiUnicodeItem: string): boolean =>
        emojiLibJsonData[emojiUnicodeItem].keywords.includes(shortcode)
      )
      if (emojiUnicode) {
        return emojiLibJsonData[emojiUnicode]
      }
    }
    return undefined
  },
  getDefaultOptions(options?: EmojiParseOptionsType): EmojiParseOptionsType {
    options = {
      emojiCDN: options && Object.getOwnPropertyDescriptor(options, 'emojiCDN') ? String(options.emojiCDN) : undefined,
      parseToHtml:
        options && Object.getOwnPropertyDescriptor(options, 'parseToHtml') ? Boolean(options.parseToHtml) : true,
      parseToUnicode: options ? Boolean(options.parseToUnicode) : false,
      parseToShortcode: options ? Boolean(options.parseToShortcode) : false,
    }
    return options
  },
  __parseEmojiToHtml(text: string, emojiCDN?: string): string {
    // Parse text to identify Twemoji entities
    const entities: Array<TwemojiEntity> = parse(text)
    // Track processed entities to avoid duplicates
    const entitiesFound: Array<string> = []
    entities.forEach((entity: TwemojiEntity) => {
      if (!entitiesFound.includes(entity.text)) {
        entitiesFound.push(entity.text)
        let emojiUrl: string = entity.url
        // Replace default CDN URL with custom CDN if provided
        if (emojiCDN) {
          const cdnRegex: RegExp = new RegExp(DEFAULT_EMOJI_CDN, 'gi')
          emojiUrl = emojiUrl.replace(cdnRegex, emojiCDN)
        }
        // Insert emoji image tag into text
        const regex = new RegExp(entity.text, 'g')
        text = text.replace(regex, `<img class="emoji" alt="${entity.text}" src="${emojiUrl}"/>`)
      }
    })
    return text
  },
  parseToHtml(text: string, emojiCDN?: string): string {
    text = this.parseToUnicode(text)
    return this.__parseEmojiToHtml(text, emojiCDN)
  },
  parseToUnicode(text: string): string {
    // Allow `+` and `-` so GitHub-style aliases like :+1: and :-1: parse.
    const emojisRegExp: RegExp = /:([\w+-]+):/g
    const emojisShortcodesList: RegExpMatchArray | null = text.match(emojisRegExp)
    if (emojisShortcodesList) {
      emojisShortcodesList.forEach((shortcode: string) => {
        const emoji = this.getEmojiObjectByShortcode(shortcode)
        if (emoji) {
          // split/join replaces literal occurrences without regex metachar pitfalls (e.g. `+` in `:+1:`).
          text = text.split(shortcode).join(emoji.char)
        }
      })
    }
    return text
  },
  parseToShortcode(text: string): string {
    const emojiLibJsonData: EmojiLibJsonType = emojiLibJson
    const emojisUnicodesList: Array<string> = Object.keys(emojiLibJsonData)
    let regexText: string = `(${emojisUnicodesList.join('|')})`
    regexText = regexText.replace(/\*️⃣/g, '\\*️⃣')
    const regexUnicodes = new RegExp(regexText, 'ig')
    const matches: IterableIterator<RegExpMatchArray> = text.matchAll(regexUnicodes)
    for (const match of matches) {
      const emoji: EmojiType = emojiLibJsonData[match[0]]
      if (emoji) {
        const unicodeRegExp: RegExp = new RegExp(emoji.char, 'ig')
        text = text.replace(unicodeRegExp, `:${emoji.slug}:`)
      }
    }

    return text
  },
  parse(text: string, options?: EmojiParseOptionsType): string {
    const optionsResult: EmojiParseOptionsType = this.getDefaultOptions(options)
    if (typeof text !== 'string') {
      throw new Error('The text parameter should be a string.')
    }

    /**
     * Translate emojis unicodes to shortcodes
     */
    if (!optionsResult.parseToHtml && optionsResult.parseToShortcode) {
      text = this.parseToShortcode(text)
    }

    /**
     * Translate emojis shortcodes to unicodes
     */
    if (optionsResult.parseToHtml || optionsResult.parseToUnicode) {
      text = this.parseToUnicode(text)
    }

    /**
     * Parse emojis to html images
     */
    if (optionsResult.parseToHtml) {
      text = this.__parseEmojiToHtml(text, optionsResult.emojiCDN)
    }
    return text
  },
}

export default uEmojiParser

// Exporting for CommonJS modules (require)
module.exports = uEmojiParser
module.exports.emojiLibJsonData = emojiLibJsonData
module.exports.DEFAULT_EMOJI_CDN = DEFAULT_EMOJI_CDN
