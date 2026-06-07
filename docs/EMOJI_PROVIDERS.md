# Emoji Providers

This package supports emoji shortcode dialects from multiple chat platforms (Slack, GitHub, Discord, Twitter, Google Chat, Microsoft Teams) and renders to HTML using **Twemoji** as the image source. This guide explains how the dialect support works, how to swap CDNs, and how to add new shortcode aliases.

## Where the dialects live

A single curated catalog (`src/lib/emoji-lib.json`) contains every emoji with:

- **`slug`** — one canonical shortcode per emoji (e.g., `smiling_face_with_sunglasses` for 😎)
- **`keywords`** — array of aliases that resolve to this emoji (e.g., `['smiling_face_with_sunglasses', 'cool', 'summer', 'sunglass']`)

`getEmojiObjectByShortcode(shortcode)` does a two-tier lookup:

1. **Direct slug hit** — `emojiLibJsonData[shortcode]` if `shortcode` is the canonical slug
2. **Keyword scan** — `Object.keys(emojiLibJsonData).find(k => emojiLibJsonData[k].keywords.includes(shortcode))` otherwise

This is what lets all of these resolve to 😎:

| Input                            | Why it works            |
| -------------------------------- | ----------------------- |
| `:smiling_face_with_sunglasses:` | Direct slug hit         |
| `:cool:`                         | In the `keywords` array |
| `:sunglass:`                     | In the `keywords` array |
| `:summer:`                       | In the `keywords` array |

If two emojis share a keyword (e.g., both ☕ and 🤎 had `coffee` upstream), the regenerator's deduplication loop assigns it to whichever emoji has it earliest in their keyword list. `EMOJIS_SPECIAL_CASES` overrides this when the algorithm picks wrong — see [Special-case overrides](#special-case-overrides).

## Supported shortcode dialects

The catalog merges keywords from two upstream sources during regeneration:

- **`unicode-emoji-json`** — provides the canonical slug (matches Unicode CLDR names with underscores)
- **`emojilib`** — provides curated aliases used by GitHub, Slack, Discord, and others

This means the package supports — without per-platform configuration — shortcodes from:

| Platform              | Example aliases                               | How they resolve                                                                                                                                         |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Twitter / Twemoji** | `:smiley:`, `:rocket:`                        | Aliases in `emojilib`'s curated keyword list                                                                                                             |
| **GitHub**            | `:white_check_mark:`, `:thumbsup:`, `:tada:`  | Keywords (some require `EMOJIS_SPECIAL_CASES` overrides)                                                                                                 |
| **Slack**             | `:thumbsup:`, `:neckbeard:`, `:simple_smile:` | Keywords; `:neckbeard:` is a Slack-only emoji that has no Unicode equivalent and is left as text (see [Unsupported shortcodes](#unsupported-shortcodes)) |
| **Discord**           | `:smile:`, `:heart:`, `:fire:`                | Same keyword pool                                                                                                                                        |
| **Google Chat**       | `:thumbsup:`, `:sparkles:`                    | Same                                                                                                                                                     |
| **Microsoft Teams**   | Standard Unicode + a few Teams-only           | Standard ones work; Teams-only are unsupported                                                                                                           |

### Canonical slug vs alias

The canonical slug is **what `parseToShortcode` outputs**. Aliases are **what `parseToUnicode` and `parse` accept as input**.

```ts
uEmojiParser.parseToUnicode(':thumbsup:') // '👍' — alias accepted
uEmojiParser.parseToUnicode(':thumbs_up:') // '👍' — slug also accepted

uEmojiParser.parseToShortcode('👍') // ':thumbs_up:' — always emits the canonical slug
```

This asymmetry is intentional: input is permissive, output is normalized.

## Unsupported shortcodes

Shortcodes that don't map to a Unicode emoji are **left as text**:

```ts
uEmojiParser.parse(':neckbeard:') // ':neckbeard:' (passes through unchanged)
uEmojiParser.parse('hello :not_a_real_emoji:') // 'hello :not_a_real_emoji:'
```

Slack's `:neckbeard:` is the canonical example — it's a custom Slack emoji with no Unicode point. There's a test asserting this passes through (`main.test.ts` includes `:neckbeard:` in a long sentence and expects it unchanged).

If a consumer wants to handle these, they post-process the output looking for any remaining `:[a-z_]+:` patterns.

## CDN selection

The HTML output uses Twemoji's CDN by default:

```ts
export const DEFAULT_EMOJI_CDN: string = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/'
```

A consumer can override this by passing the second argument to `parseToHtml` (or via the `emojiCDN` option to `parse`):

```ts
uEmojiParser.parseToHtml('🚀', 'https://my-cdn.example.com/emoji/svg/')
// → '<img class="emoji" alt="🚀" src="https://my-cdn.example.com/emoji/svg/1f680.svg"/>'

uEmojiParser.parse('🚀', { emojiCDN: 'https://my-cdn.example.com/emoji/svg/' })
// → same
```

How it works internally (`__parseEmojiToHtml`):

1. `@twemoji/parser` returns URLs prefixed with `DEFAULT_EMOJI_CDN`
2. If `emojiCDN` was passed, the package string-replaces `DEFAULT_EMOJI_CDN` with `emojiCDN` in every URL
3. The replaced URL is what lands in the `src` attribute

### Recommended production setup

For production, **pin a Twemoji version** (rather than `@latest`) to avoid surprise asset changes:

```ts
const STABLE_CDN = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.1/assets/svg/'

const html = uEmojiParser.parseToHtml(text, STABLE_CDN)
```

Or self-host the assets — pull `https://github.com/jdecked/twemoji` at a known version, push the `assets/svg/` directory to your CDN, and point `emojiCDN` at it. This isolates you from upstream changes and CDN downtime.

### CDN file format

Twemoji ships SVG by default. The CDN also has `assets/72x72/` (PNG fallback). The package always emits `.svg` filenames because `@twemoji/parser` does — if you point `emojiCDN` at `assets/72x72/` you'll get 404s. PNG support would require post-processing the output (string-replace `.svg` → `.png`), which the package doesn't do today. File an issue if you need it.

### CORS

Twemoji's `cdn.jsdelivr.net` serves with `Access-Control-Allow-Origin: *`. Self-hosted CDNs need to send the same header for cross-origin canvas access (`getImageData`); without it, SVGs render fine but `<canvas>` operations fail. Most consumers don't care.

## Custom dialect support

If a consumer ships internal shortcodes (`:ourcompany_logo:`, `:rocketship:`) that aren't in the catalog:

1. **They aren't supported.** The package doesn't have a public "register custom emoji" API
2. **Workaround:** post-process the output. Run `uEmojiParser.parse(text)` first (which leaves unknown shortcodes alone), then string-replace the remaining ones yourself

If a consumer wants to add a Slack-style alias for an existing Unicode emoji (e.g., `:rocketship:` → 🚀), the right path is to update `EMOJIS_SPECIAL_CASES` and regenerate the catalog. That ships the alias to every consumer.

## Special-case overrides

`EMOJIS_SPECIAL_CASES` in `test/prepareEmojiLibJson.test.ts` lets you force keyword inclusion or exclusion for specific emojis. Current entries:

```ts
const EMOJIS_SPECIAL_CASES: ObjectType = {
  '☕': { include: ['coffee'] },
  '🤎': { exclude: ['coffee'] },
  '❤️': { include: ['heart'] },
  '💘': { exclude: ['heart'] },
  '👮‍♀️': {
    include: ['policewoman', 'female-police-officer'],
    exclude: ['legal', 'arrest'],
  },
  '✅': { include: ['white_check_mark'] },
  '⏸️': { include: ['double_vertical_bar'] },
}
```

How the overrides apply (in the regenerator):

1. **Include** — keyword is unshifted to position 0 of the emoji's `keywords` array (giving it priority in the dedup loop)
2. **Exclude** — keyword is filtered out of that emoji's keywords entirely

After applying, the dedup loop runs and decides which emoji "owns" each shared keyword. Putting an emoji's keyword first ensures it wins.

### Adding a special case

Procedure (full version: [`/add-special-case`](../.agents/commands/add-special-case.md)):

1. Open `test/prepareEmojiLibJson.test.ts`
2. Add an entry to `EMOJIS_SPECIAL_CASES`:
   ```ts
   '🚀': { include: ['rocketship', 'launch'] },
   ```
3. Regenerate the catalog (see [Architecture → The regeneration pipeline](ARCHITECTURE.md#the-regeneration-pipeline))
4. Add a test in `test/main.test.ts` that resolves the new shortcode:
   ```ts
   it('should resolve :rocketship: to 🚀 (regression #X)', () => {
     expect(uEmojiParser.parseToUnicode(':rocketship:')).to.be.equal('🚀')
   })
   ```
5. Run `pnpm test` — expect `emojiLibJson.test.ts` to also still pass (count unchanged) and `main.test.ts` to include the new case
6. Commit all four files: the test override, the catalog, the new test, and any `TOTAL_EMOJIS` update

### Removing a special case

Reverse the include/exclude (or delete the entry), regenerate, update tests, commit. If the override was load-bearing for someone's product (Slack alias support), removing it is a breaking change — bump the major version.

## Twemoji upgrade discipline

`@twemoji/parser` upgrades can change:

- **CDN URL format** — historically rare; if it changes, every existing snapshot test in `main.test.ts` breaks
- **Available emojis** — rare additions; existing emojis don't disappear
- **Variation selector handling** — sometimes Twemoji decides to render an emoji differently with/without VS-16

When bumping `@twemoji/parser`:

1. Read the release notes
2. `pnpm test` — if snapshots break, the URL format changed (or a specific emoji was rerendered)
3. Update test expectations and consider whether this is a major bump for _our_ package
4. Per [Standards](STANDARDS.md#versioning), HTML output changes are major bumps

See [`/bump-deps`](../.agents/commands/bump-deps.md) for the structured workflow.

## Don't

1. ❌ Add a non-Twemoji emoji set without a clear plan — the package's purpose is Twemoji rendering with multi-platform shortcode support. Apple/Google emoji sets are separate products
2. ❌ Hand-edit `src/lib/emoji-lib.json` to add an alias — the next regeneration overwrites it
3. ❌ Add per-platform "modes" (`{ provider: 'slack' }`) — the catalog already accepts every dialect
4. ❌ Hardcode a specific CDN version in `DEFAULT_EMOJI_CDN` — keep it on `@latest` so consumers get bug fixes; consumers who need pinning pass `emojiCDN`
5. ❌ Introduce async behavior — every method is sync; resolution is in-memory

## Do

1. ✅ Add aliases via `EMOJIS_SPECIAL_CASES` and regenerate
2. ✅ Pin a Twemoji version (`@17.0.1`) for production via the `emojiCDN` option
3. ✅ Test new aliases in both directions (`parseToUnicode(':alias:')` → emoji; `parseToShortcode(emoji)` → canonical slug)
4. ✅ Update [TECHNOLOGIES.md](TECHNOLOGIES.md) when the Twemoji major version changes
5. ✅ Treat HTML output changes as major-version events
