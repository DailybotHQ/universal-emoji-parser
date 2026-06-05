# `src/` — Universal Emoji Parser source

The library's entire implementation. This is the only module that produces public
exports; everything under `lib/` is an internal implementation detail that
consumers must not import directly.

## Layout

| Path                        | Responsibility                                                                                                                                                                                                                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                  | The **single public entry point**. Defines `uEmojiParser` (`parse`, `parseToHtml`, `parseToUnicode`, `parseToShortcode`, `getEmojiObjectByShortcode`, `getDefaultOptions`) and the named exports `emojiLibJsonData` + `DEFAULT_EMOJI_CDN`. Holds the dual ESM/CommonJS export reattachment at the bottom of the file. |
| `lib/type.ts`               | Shared TypeScript interfaces (`EmojiType`, `EmojiParseOptionsType`, `EmojiLibJsonType`, …).                                                                                                                                                                                                                           |
| `lib/emoji-lib.json`        | The curated emoji catalog (committed, ~1906 entries). **Never edit by hand** — regenerate via the skipped test (see below).                                                                                                                                                                                           |
| `lib/emoji-lib-output.json` | Last regeneration output (git-ignored scratch).                                                                                                                                                                                                                                                                       |

## Public surface

`src/index.ts` is the authority for the package's API shape. The dual export
(`export default` + `module.exports` reattachment) is **load-bearing**: every
`export const X` must also be reattached as `module.exports.X = X`, or it ships as
`undefined` to `require()` consumers. `test/exports.test.ts` enforces this.

Full reference: [`docs/API_REFERENCE.md`](../docs/API_REFERENCE.md). Pipeline and
design rationale: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## How it's tested

Specs live in [`test/`](../test) and run with `tsx` + Mocha (no compile step):

```bash
npm test            # run all Mocha specs
npm run test:watch  # TDD inner loop while editing index.ts
```

- `test/main.test.ts` — integration tests for the public parse methods.
- `test/emojiLibJson.test.ts` — snapshot validation of the catalog (asserts the
  `TOTAL_EMOJIS` count).
- `test/prepareEmojiLibJson.test.ts` — the `it.skip`-guarded regenerator for
  `lib/emoji-lib.json`; never commit it un-skipped (it writes to disk).

Add a regression test next to every parsing fix, pasting the exact failing input.
See [`docs/TESTING_GUIDE.md`](../docs/TESTING_GUIDE.md).

## The one data rule

The runtime never imports `emojilib` or `unicode-emoji-json` directly —
everything flows through `lib/emoji-lib.json`. To change catalog data, edit
`EMOJIS_SPECIAL_CASES` in `test/prepareEmojiLibJson.test.ts` and regenerate via
`/regenerate-emoji-lib`; commit the JSON diff.
