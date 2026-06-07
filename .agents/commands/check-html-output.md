---
name: check-html-output
description: Verify the HTML output contract of parseToHtml for a given input
---

# Command: `/check-html-output`

Run a given input through `uEmojiParser.parseToHtml` (or `parse` with `parseToHtml: true`) and verify the output conforms to the contract defined in [`docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md#html-output-contract).

## When to use

- The user reports unexpected HTML for a specific input
- You're about to change something in `__parseEmojiToHtml` and want to confirm current behavior
- You want to verify a custom `emojiCDN` produces expected URLs
- You want to confirm a regression fix actually emits valid HTML

## Inputs to confirm

- **Input string** — the text to parse, verbatim
- **Optional CDN** — if testing the `emojiCDN` override
- **Expected behavior** — what should the output look like?

## The contract

Every emoji in the output MUST match this template:

```html
<img class="emoji" alt="<unicode-emoji>" src="<cdn-url>" />
```

| Attribute | Required value         | Notes                                                    |
| --------- | ---------------------- | -------------------------------------------------------- |
| `class`   | `"emoji"` (literal)    | Exact string; used by consumer CSS                       |
| `alt`     | The unicode emoji char | Not the shortcode                                        |
| `src`     | A valid URL            | Defaults to Twemoji CDN; `emojiCDN` overrides the prefix |
| Tag       | Self-closing `/>`      | Required for XHTML/JSX compatibility                     |

**No additional attributes** (`loading`, `decoding`, `width`, `height`, `style`, etc.). Their absence is part of the contract.

## Procedure

### 1. Run the input through the parser

In a Node REPL or `tmp/check.ts`:

```bash
cat > tmp/check.ts <<'EOF'
import uEmojiParser from '../src/index'

const input: string = process.argv[2] ?? 'hello :smile: 🚀'
const cdn: string | undefined = process.argv[3]

console.log('--- Input ---')
console.log(JSON.stringify(input))
console.log('--- Output ---')
console.log(uEmojiParser.parseToHtml(input, cdn))
EOF

npx tsx tmp/check.ts 'hello :smile: 🚀'
npx tsx tmp/check.ts 'hello 🚀' 'https://my-cdn.example.com/svg/'
```

### 2. Verify the output structure

Inspect the HTML for each emoji `<img>`:

```html
<img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg" />
```

Check:

- [ ] Starts with `<img ` (lowercase)
- [ ] `class="emoji"` (exact, no extra classes)
- [ ] `alt="<unicode>"` (single character or grapheme cluster, **not** the shortcode)
- [ ] `src="<url>"` (a complete URL, not a relative path)
- [ ] Self-closing `/>` (not `></img>`)
- [ ] **No** `loading`, `decoding`, `width`, `height`, `style`, or other attributes

### 3. Verify the URL

For default CDN:

- Should start with `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/`
- Should end with `<codepoint>.svg` where `<codepoint>` is the lowercase hex Unicode codepoint

For custom `emojiCDN`:

- Should start with the CDN you passed
- Should end with the same `<codepoint>.svg`

The codepoint can be verified:

```bash
node -e "console.log('🚀'.codePointAt(0).toString(16))"   # → 1f680
```

So `🚀` should produce `.../1f680.svg`.

### 4. Verify shortcode handling

Run with shortcode input:

```bash
npx tsx tmp/check.ts ':rocket:'
```

Expected: same HTML as if you'd run `🚀` directly. The `parseToHtml` chain calls `parseToUnicode` first, so shortcodes resolve before HTML rendering.

### 5. Verify multi-emoji and mixed-content

```bash
npx tsx tmp/check.ts 'hello 🚀 world :smile: again 🚀'
```

Expected:

- Three `<img>` tags
- Surrounding text preserved (`hello`, `world`, `again`)
- Both 🚀 instances replaced (the dedup in `__parseEmojiToHtml` ensures global replacement of each unique emoji)

### 6. Verify error case

```bash
npx tsx -e "import u from './src/index'; u.parse(undefined as any)"
```

Expected: `Error: The text parameter should be a string.`

### 7. Verify edge cases

| Input                             | Expected behavior                                                       |
| --------------------------------- | ----------------------------------------------------------------------- |
| `''` (empty string)               | Returns `''`                                                            |
| `'no emojis here'`                | Returns the text unchanged                                              |
| `':not_a_real_emoji:'`            | Returns the text unchanged (unmatched shortcodes pass through)          |
| Long input (10 KB)                | Runs well within the Vitest test timeout; HTML output dominates length  |
| Variation selector emoji (`'⭐️'`) | Resolves; alt contains the VS-16 modifier                               |
| ZWJ sequence (`'👨‍👩‍👧'`)             | Resolves to the family emoji as one entity                              |

If any of these behave wrongly, that's a bug — file a regression test (see [`/write-tests`](write-tests.md)).

## Common findings

### "The output is missing the closing `/`"

Older versions or accidental refactors may emit `<img class="emoji" alt="..." src="...">` (HTML5-style, no self-closing). The current `__parseEmojiToHtml` template uses `/>`. If you find missing self-close, verify the template hasn't been edited.

### "The CDN URL has the wrong prefix"

`emojiCDN` is applied via string-replace of `DEFAULT_EMOJI_CDN`. If the wrong prefix appears:

- **Likely:** `DEFAULT_EMOJI_CDN` constant changed and `__parseEmojiToHtml`'s regex didn't update
- **Or:** Twemoji's `parse()` returned URLs with a different prefix than `DEFAULT_EMOJI_CDN`. Check if a Twemoji bump moved the CDN

### "An emoji isn't being replaced"

- **Twemoji doesn't recognize it** — the package can only render what `@twemoji/parser` finds. Check `parse('your-emoji')` directly:
  ```bash
  npx tsx -e "import { parse } from '@twemoji/parser'; console.log(parse('🚀'))"
  ```
- **Variation selector mismatch** — `⭐️` (with VS-16) vs `⭐` (without) are different bytes. Check your input's actual codepoints

### "Shortcode passes through as text"

The shortcode isn't in the catalog. Check:

```bash
node -e "console.log(require('./dist/index.js').getEmojiObjectByShortcode('your_shortcode'))"
```

If `undefined`, the shortcode isn't supported. Either:

- It's a valid alias missing from the catalog → add via [`/add-special-case`](add-special-case.md)
- It's a platform-specific custom emoji (e.g., Slack `:neckbeard:`) → unsupported by design

### "The output has extra attributes"

If `__parseEmojiToHtml` was modified to add `loading="lazy"` or similar, **revert**. Adding attributes is a breaking change — see [`docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md#html-output-contract).

## Cleanup

Remove `tmp/check.ts` when done — it's gitignored, so leaving it is harmless, but tidy is better:

```bash
rm tmp/check.ts
```

## Don't

- ❌ Modify the HTML output template casually — it's a public contract
- ❌ Add validation in `__parseEmojiToHtml` that throws on bad inputs — bad input falls through as text by design
- ❌ Change `class="emoji"` to anything else — consumer CSS depends on it

## Do

- ✅ Use `tmp/` for ad-hoc verification scripts
- ✅ Write a regression test if you find unexpected output (see [`/write-tests`](write-tests.md))
- ✅ Bump the major version if you intentionally change the output template

## Verification checklist

- [ ] Output `<img>` matches the contract template exactly
- [ ] `alt` is a unicode literal, not a shortcode
- [ ] `src` is a complete URL (no relative paths)
- [ ] No extra HTML attributes
- [ ] Self-closing `/>` preserved
- [ ] Custom `emojiCDN` produces URLs with the new prefix
- [ ] Edge cases (empty, no-emoji, unmatched shortcode) behave as documented
