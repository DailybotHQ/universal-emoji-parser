# Product Spec — Universal Emoji Parser

> The non-technical "why" and "for whom" of this repository. Read this first to
> understand what the project is and the value it delivers, before the _how_ in
> the other guides.

## The problem

Emoji look different on every platform, and they arrive in text in inconsistent
forms. The same idea might appear as a raw unicode character (`😎`) or as one of
several competing shortcode dialects (`:smiling_face_with_sunglasses:` on one
platform, `:sunglasses:` on another). When an application renders that text, the
result depends on the user's operating system and font — so the same message can
look different, broken, or blank for different readers. Teams that aggregate
messages from many sources (chat, forms, comments) need emoji to render the
**same way for everyone**, and need to translate freely between unicode and
shortcode forms.

## What this product is

**Universal Emoji Parser** is an open-source ([MIT](../LICENSE)) JavaScript/
TypeScript library, published on npm as
[`universal-emoji-parser`](https://www.npmjs.com/package/universal-emoji-parser).
Given any text, it finds the emoji inside it and converts them:

- **unicode or shortcode → HTML** `<img>` tags backed by the
  [Twemoji](https://github.com/jdecked/twemoji) CDN, so emoji render identically
  in every browser regardless of the user's device;
- **between forms** — shortcode → unicode, or unicode → shortcode.

It ships a single curated emoji dictionary so it recognizes the shortcode
dialects used by **Twitter, GitHub, Slack, Discord, Google Chat, and Microsoft
Teams** through one normalized catalog.

## Who it is for

This is a library, so its "users" are the **developers and applications that
consume it** — and the end users they serve:

- **Application & product developers** who display user-generated text and want
  consistent, accessible emoji rendering without shipping their own emoji assets.
- **Chat, messaging, and collaboration tools** (the original driver: DailyBot)
  that ingest text from multiple platforms and must normalize emoji across them.
- **Content and CMS pipelines** that transform text to HTML and want emoji to
  survive that transformation cleanly.
- **Both runtimes:** Node.js services (server-side rendering, message
  processing) and browser apps (it bundles via webpack/rollup/vite), with dual
  CommonJS and ES Module entry points.

## Why they choose it

- **Cross-platform consistency** — Twemoji-backed images look the same
  everywhere, sidestepping OS/font differences.
- **One dictionary, many dialects** — Slack-style (`:thumbsup:`) and canonical
  (`:thumbs_up:`) shortcodes both resolve to the same emoji.
- **Accessibility & copy-paste preserved** — rendered images keep the real
  unicode emoji in their `alt` text.
- **Drop-in and tiny surface** — a small, stable API (`parse`, `parseToHtml`,
  `parseToUnicode`, `parseToShortcode`, …) and a single runtime dependency.
- **Configurable CDN** — point emoji images at a custom/self-hosted CDN when
  needed.

## Key capabilities

- Parse a string and replace every emoji with a consistent HTML `<img>` tag.
- Convert text from shortcodes to unicode, or from unicode to shortcodes.
- Resolve a shortcode (across supported dialects) to its emoji object.
- Override the emoji image CDN for self-hosting or pinning.

## Success criteria

- A consumer can render emoji that look the same across browsers and devices.
- Common shortcode dialects from the six supported platforms resolve correctly.
- The public API and HTML output contract stay stable across non-major releases,
  so upgrades don't break consumers' rendered output.
- The package stays lightweight enough to bundle into browser applications.

## Non-goals

- **Not an emoji picker / UI component** — it transforms text; it renders no
  interactive widget.
- **Not an emoji image host** — it delegates image URLs to the Twemoji CDN (or a
  CDN you configure); it ships no image assets of its own.
- **Not a general Markdown or rich-text processor** — it only touches emoji,
  leaving the surrounding text untouched.
- **Not a moderation/sanitization tool** — it transforms text the consuming app
  already considers safe; it does not HTML-escape surrounding content.
- **Not a per-emoji metadata database** — the catalog carries only what parsing
  needs (canonical slug + keywords), to keep the bundle small.

---

_The mechanics behind these goals live in the rest of [`docs/`](README.md):
[ARCHITECTURE.md](ARCHITECTURE.md) for design, [API_REFERENCE.md](API_REFERENCE.md)
for the public surface, and [EMOJI_PROVIDERS.md](EMOJI_PROVIDERS.md) for CDN and
dialect details._
