export interface ObjectType {
  [key: string]: any
}

export interface Class<T> {
  new (...args: any): T
}

export interface EmojiType {
  name: string
  slug: string
  group: string
  emoji_version: string
  unicode_version: string
  skin_tone_support: boolean
  char: string
  keywords: Array<string>
  keyword_index_found?: number
}

export interface EmojiLibJsonType {
  [key: string]: EmojiType
}

export interface UEmojiParserType {
  getEmojiObjectByShortcode: (emojiCode: string) => EmojiType | undefined
  getDefaultOptions(options?: EmojiParseOptionsType): EmojiParseOptionsType
  __parseEmojiToHtml(text: string, emojiCDN?: string): string
  parseToHtml: (text: string, emojiCDN?: string) => string
  parseToUnicode: (text: string) => string
  parseToShortcode: (text: string) => string
  parse: (text: string, options?: EmojiParseOptionsType) => string
}

export interface EmojiParseOptionsType {
  emojiCDN?: string
  parseToHtml?: boolean
  parseToUnicode?: boolean
  parseToShortcode?: boolean
}

export interface TwemojiEntity {
  url: string
  indices: Array<number>
  text: string
  type: string
}
