# Using the Library

A consumer-oriented walkthrough of Universal Emoji Parser. If you're integrating the package into your own project (rather than developing the package itself), this is the place to start.

For maintainer / contributor docs, see [Environment Setup](ENVIRONMENT_SETUP.md) and [Running Tests](RUNNING_TESTS.md). For the full reference, see [`../API_REFERENCE.md`](../API_REFERENCE.md).

---

## Install

```bash
npm install universal-emoji-parser
# or
yarn add universal-emoji-parser
# or
pnpm add universal-emoji-parser
```

The package has **one runtime dependency** (`@twemoji/parser`) and ships TypeScript declarations.

## Hello world

### CommonJS

```js
const uEmojiParser = require('universal-emoji-parser')

console.log(uEmojiParser.parse('Hello :smile: 🚀'))
// → 'Hello <img class="emoji" alt="🙂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f642.svg"/> <img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
```

### ES modules

```ts
import uEmojiParser from 'universal-emoji-parser'

console.log(uEmojiParser.parse('Hello :smile: 🚀'))
// (same output)
```

Both work. The package implements both export shapes — see [Architecture → CommonJS reattachment](../ARCHITECTURE.md#commonjs-reattachment).

## Required CSS

The HTML output uses `class="emoji"`. Add this to your stylesheet so emojis fit inline with surrounding text:

```css
img.emoji {
  height: 1em;
  width: 1em;
  margin: 0 0.05em 0 0.1em;
  vertical-align: -0.1em;
}
```

Without this CSS, emojis render at full SVG size (typically 36×36 or larger) and don't align with text — which is rarely what you want.

---

## Common patterns

### Render user messages with emoji + HTML escaping

```ts
import uEmojiParser from 'universal-emoji-parser'
import escape from 'lodash.escape'

function renderMessage(text: string): string {
  // 1. HTML-escape user input first
  const safe = escape(text)
  // 2. Then resolve emojis (the package only adds <img> tags; it doesn't unescape anything)
  return uEmojiParser.parseToHtml(safe)
}

document.getElementById('chat').innerHTML = renderMessage(userInput)
```

**Always escape before parsing** if the input is user-controlled. See [`../SECURITY.md`](../SECURITY.md#html-output-safety).

### Convert between unicode and shortcode

```ts
uEmojiParser.parseToShortcode('hello 🚀') // → 'hello :rocket:'
uEmojiParser.parseToUnicode('hello :rocket:') // → 'hello 🚀'
```

Round-tripping isn't lossless: `:thumbsup:` → 👍 → `:thumbs_up:` (output is always the canonical slug).

### Use a custom CDN

Pin to a specific Twemoji version for production:

```ts
const STABLE_CDN = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.1/assets/svg/'

uEmojiParser.parseToHtml('🚀', STABLE_CDN)
// → '<img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.1/assets/svg/1f680.svg"/>'

// Or via the parse() options:
uEmojiParser.parse('🚀', { emojiCDN: STABLE_CDN })
```

Self-hosted CDN works the same:

```ts
uEmojiParser.parseToHtml('🚀', 'https://my-cdn.example.com/emoji/svg/')
```

The `emojiCDN` argument **must** end with `/` and **must** point at the same directory structure as Twemoji's `assets/svg/` (each emoji at `<codepoint>.svg`).

### Look up an emoji by shortcode

```ts
const emoji = uEmojiParser.getEmojiObjectByShortcode('thumbsup')
// → { name: 'thumbs up', slug: 'thumbs_up', char: '👍', keywords: [...], group: '...', ... }

// Both with and without colons work:
uEmojiParser.getEmojiObjectByShortcode(':smile:') // same as 'smile'

// Returns undefined for unknown shortcodes
uEmojiParser.getEmojiObjectByShortcode('not_a_real_emoji') // undefined
```

### Iterate the catalog

```ts
import { emojiLibJsonData } from 'universal-emoji-parser'

const allEmojis = Object.values(emojiLibJsonData)
console.log(`Catalog has ${allEmojis.length} emojis`) // → 1906

// Filter by group
const smileys = allEmojis.filter((e) => e.group === 'Smileys & Emotion')

// Filter by keyword
const coolEmojis = allEmojis.filter((e) => e.keywords.includes('cool'))
```

The catalog is read-only — **don't mutate**. If you need a modified copy:

```ts
const myCatalog = JSON.parse(JSON.stringify(emojiLibJsonData))
// modify myCatalog freely
```

---

## Framework integrations

### React

```tsx
import uEmojiParser from 'universal-emoji-parser'
import { useMemo } from 'react'

function EmojiText({ text }: { text: string }) {
  const html = useMemo(() => uEmojiParser.parseToHtml(text), [text])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// Usage:
;<EmojiText text="hello :smile: 🚀" />
```

**Sanitize before parsing** if `text` is user-controlled:

```tsx
import escape from 'lodash.escape'

function EmojiText({ text }: { text: string }) {
  const html = useMemo(() => uEmojiParser.parseToHtml(escape(text)), [text])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
```

### Vue 3

```vue
<template>
  <span v-html="renderedText" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import uEmojiParser from 'universal-emoji-parser'

const props = defineProps<{ text: string }>()
const renderedText = computed(() => uEmojiParser.parseToHtml(props.text))
</script>
```

### Express / Fastify (server-side rendering)

```ts
import express from 'express'
import uEmojiParser from 'universal-emoji-parser'
import escape from 'lodash.escape'

const app = express()

app.get('/preview', (req, res) => {
  const text = String(req.query.text ?? '')
  const html = uEmojiParser.parseToHtml(escape(text))
  res.send(
    `<html><head><style>img.emoji{height:1em;width:1em;vertical-align:-0.1em}</style></head><body>${html}</body></html>`
  )
})

app.listen(3000)
```

### Markdown post-processor

Run emoji parsing **after** your markdown renderer (e.g., `marked`, `markdown-it`) has produced HTML — the markdown HTML is already trusted, you just want to swap shortcodes for `<img>`:

```ts
import { marked } from 'marked'
import uEmojiParser from 'universal-emoji-parser'

function renderMarkdownWithEmojis(md: string): string {
  const html = marked.parse(md)
  return uEmojiParser.parseToHtml(html)
}
```

---

## Performance notes

For typical inputs (a chat message, a comment), parsing is sub-millisecond. For long inputs or hot loops, see [`../PERFORMANCE.md`](../PERFORMANCE.md).

Bundle-size matters for browser consumers — the catalog adds ~543 KB. Lazy-load if first-paint matters:

```ts
let parserPromise: Promise<typeof import('universal-emoji-parser').default> | null = null

async function lazyParse(text: string): Promise<string> {
  parserPromise ??= import('universal-emoji-parser').then((m) => m.default)
  return (await parserPromise).parse(text)
}
```

---

## TypeScript types

```ts
import uEmojiParser, {
  emojiLibJsonData,
  DEFAULT_EMOJI_CDN,
  type EmojiType,
  type EmojiLibJsonType,
  type EmojiParseOptionsType,
  type UEmojiParserType,
} from 'universal-emoji-parser'

const opts: EmojiParseOptionsType = {
  parseToHtml: true,
  emojiCDN: 'https://my-cdn.example.com/svg/',
}

const result: string = uEmojiParser.parse('hello :smile:', opts)

const emoji: EmojiType | undefined = uEmojiParser.getEmojiObjectByShortcode('smile')
```

Full reference: [`../API_REFERENCE.md`](../API_REFERENCE.md).

---

## Troubleshooting

If something doesn't work as expected, see [Troubleshooting](TROUBLESHOOTING.md) — it covers package-side issues. For consumer-side issues:

- **Emojis are huge / unaligned** — you forgot the [Required CSS](#required-css)
- **Shortcodes pass through unchanged** — they aren't in the catalog. Either it's a typo, or the shortcode is platform-specific (Slack `:neckbeard:`) with no Unicode equivalent — see [Emoji Providers → Unsupported shortcodes](../EMOJI_PROVIDERS.md#unsupported-shortcodes)
- **`parse(...)` throws** — only when input isn't a string. Check upstream code
- **Output contains `:something:` instead of an emoji** — the shortcode isn't in the catalog. If you think it should be, file an issue or add it via [`/add-special-case`](../../.agents/commands/add-special-case.md) (if you're contributing to the package)
- **Bundle is too big** — the catalog dominates. See [Performance → Bundle size](../PERFORMANCE.md#bundle-size) for lazy-load patterns
