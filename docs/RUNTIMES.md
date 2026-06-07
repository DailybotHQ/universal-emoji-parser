# Runtimes

Per-environment reference for Universal Emoji Parser: where it runs, how it's loaded, and what consumers should know. The package is published as a single CommonJS bundle with TypeScript declarations and works in every JS environment that meets the Node engines constraint.

## Summary

| Runtime                                         | Loading                                                 | Notes                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Node.js (≥ 22)                               | `require('universal-emoji-parser')` or `import`         | Primary target; CI runs on Node 24                                                           |
| Browsers (modern)                               | Bundled via Vite/rollup/esbuild by the consumer         | Catalog adds ~543 KB raw to consumer bundles — see [Performance](PERFORMANCE.md#bundle-size) |
| Deno                                            | `npm:universal-emoji-parser`                            | Untested but expected to work — Deno 1.28+ supports `npm:` specifiers                        |
| Bun                                             | `bun add universal-emoji-parser`                        | Untested but expected to work — Bun is Node-compatible                                       |
| Edge runtimes (Cloudflare Workers, Vercel Edge) | Bundled by the framework                                | Catalog inlines fine; bundle size matters at the edge                                        |

The package is **environment-agnostic**: no `process`, no `fs`, no `Buffer`, no DOM APIs. It's a pure string transformer with a JSON catalog and a single `@twemoji/parser` call (inlined into the bundle — zero runtime dependencies).

---

## Node.js

### Installing

```bash
npm install universal-emoji-parser
# or
yarn add universal-emoji-parser
# or
pnpm add universal-emoji-parser
```

### Importing

The package supports both module systems out of the box:

```js
// CommonJS — Node default for .js files / .cjs
const uEmojiParser = require('universal-emoji-parser')
const { emojiLibJsonData, DEFAULT_EMOJI_CDN } = require('universal-emoji-parser')

console.log(uEmojiParser.parse('hello :smile: 🚀'))
```

```ts
// ES modules — .mjs files, "type": "module" packages, or TS with esModuleInterop
import uEmojiParser, { emojiLibJsonData, DEFAULT_EMOJI_CDN } from 'universal-emoji-parser'

console.log(uEmojiParser.parse('hello :smile: 🚀'))
```

The dual export shape is implemented in `src/index.ts`:

```ts
export default uEmojiParser
module.exports = uEmojiParser
module.exports.emojiLibJsonData = emojiLibJsonData
module.exports.DEFAULT_EMOJI_CDN = DEFAULT_EMOJI_CDN
```

This means **both** `require('universal-emoji-parser').parse(...)` and `import uEmojiParser from '...'` give you the same object — see [Architecture → CommonJS reattachment](ARCHITECTURE.md#commonjs-reattachment).

### Engines

`package.json` sets `engines.node: ">=22.0.0"`. npm warns (does not error) when installing on older Node versions; the runtime may still work on Node 20 (EOL April 2026) but those versions are unsupported — security patches stopped landing on them.

CI runs on **Node 24**. If a Node version-specific bug surfaces, that's the reference version to debug against.

### Memory

The catalog is a static `import emojiLibJson from './lib/emoji-lib.json'`. Node loads it once per process; it stays in memory for the lifetime of the process. ~5 MB resident (parsed JS objects expand the 543 KB JSON).

If you're running this in a memory-constrained environment (Lambda with low memory, edge worker), this is the biggest cost — there is no streaming-load mode.

### Threading

The package is synchronous and stateless — safe to call from worker threads (`worker_threads`). Each worker loads its own copy of the catalog (no shared memory).

---

## Browsers

### Bundling

This package is **not** publishable as a static `<script>` import — `dist/index.js` is a CommonJS module that a bundler must resolve. (`@twemoji/parser` is already inlined, so there's no transitive dependency to resolve — only the package's own CJS entry.) Consumers integrate it via:

| Bundler | Integration                                                                |
| ------- | -------------------------------------------------------------------------- |
| Vite    | Works out of the box (Vite uses esbuild + Rollup internally)               |
| Rollup  | Add `@rollup/plugin-commonjs` and `@rollup/plugin-node-resolve`            |
| esbuild | Works out of the box                                                       |
| Parcel  | Works out of the box                                                       |

The package's own bundle (`dist/index.js`) is **CommonJS** (emitted by Vite library mode) — it expects `module.exports` to be writable. All modern bundlers handle this.

### Tree-shaking

The catalog **cannot be tree-shaken**. The whole `emoji-lib.json` is reachable from the runtime (`getEmojiObjectByShortcode` enumerates all keys via `Object.keys(emojiLibJsonData)`). Even if the consumer only ever calls `parseToHtml('hello :smile:')`, the full ~543 KB ships.

If a consumer cares deeply about bundle size, they have two options:

1. **Lazy-load** — `const uEmojiParser = await import('universal-emoji-parser')` defers the catalog parse until first use
2. **Build a custom subset** — fork or wrap the package, load only the emojis they actually use. Out of scope for this package; pattern documented in [Performance → Bundle size](PERFORMANCE.md#bundle-size)

### Output rendering

The HTML the package emits assumes:

```html
<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg" />
```

Consumers typically style with:

```css
img.emoji {
  height: 1em;
  width: 1em;
  margin: 0 0.05em 0 0.1em;
  vertical-align: -0.1em;
}
```

(Recommended snippet from the README.) The `class="emoji"` selector is the contract.

### CDN considerations

The default CDN is `cdn.jsdelivr.net/gh/jdecked/twemoji@latest`. For production, consumers should pin to a specific Twemoji version to avoid surprise changes:

```ts
uEmojiParser.parseToHtml('hello 🚀', 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.1/assets/svg/')
```

See [Emoji Providers → CDN selection](EMOJI_PROVIDERS.md#cdn-selection).

### CORS

Twemoji CDN serves with permissive CORS (`Access-Control-Allow-Origin: *`). If a consumer hosts the SVG assets themselves, they must configure their CDN/server to send CORS headers — otherwise SVGs render but cross-origin canvas access (`getImageData`) fails. Most consumers don't care.

### Image format

Twemoji ships **SVG by default**. The CDN also has `/assets/72x72/` (PNG fallback). If a consumer wants PNGs, they pass:

```ts
uEmojiParser.parseToHtml('🚀', 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/')
```

…but the file extension would still be `.svg` because that's what `@twemoji/parser` returns. The package doesn't yet support automatic extension rewriting; if a consumer needs PNGs, they post-process the output.

---

## Deno

Untested but expected to work via Deno's npm specifier:

```ts
import uEmojiParser from 'npm:universal-emoji-parser@2'

console.log(uEmojiParser.parse('hello :smile:'))
```

Caveats:

- Deno's `npm:` resolver loads CommonJS via shim — slower first call, fine afterwards
- The catalog import (`import emojiLibJson from './lib/emoji-lib.json'`) is bundled into `dist/index.js`, so Deno doesn't need separate `--allow-read` permissions

If a Deno-specific bug surfaces, file an issue. We don't actively test on Deno but accept fixes.

---

## Bun

```bash
bun add universal-emoji-parser
```

Bun is Node-compatible and runs the package without modification. Bun's faster startup makes the catalog parse less noticeable. The Vite-built CJS bundle works as-is.

---

## Edge runtimes

### Cloudflare Workers

```ts
import uEmojiParser from 'universal-emoji-parser'

export default {
  fetch(request: Request): Response {
    const text = new URL(request.url).searchParams.get('text') ?? ''
    return new Response(uEmojiParser.parse(text), {
      headers: { 'content-type': 'text/html' },
    })
  },
}
```

Caveats:

- Worker bundle size limit is 1 MB (Free plan) / 10 MB (Paid). The package alone is ~403 KB minified, so on Free plan you have ~600 KB of headroom for your code
- No `fs`, no `Buffer` — fine, this package doesn't need them
- The Twemoji CDN is reachable from Workers; no proxy needed

### Vercel Edge / Netlify Edge

Same characteristics as Cloudflare Workers. Both support npm packages out of the box. Bundle size is tracked by the platform; large catalogs eat into your edge function quota.

### AWS Lambda

Standard Node Lambda — works as a regular `npm install`. Catalog lives in memory across invocations within the same warm container. Cold-start cost is ~30ms for catalog parse on a 256MB Lambda.

---

## TypeScript users

The package ships `.d.ts` files (built by `npm run build:types` — `tsc -p tsconfig.build.json --emitDeclarationOnly`):

```
dist/
├── index.js
├── index.d.ts        ← types entry
└── lib/
    └── type.d.ts
```

`package.json` `types: "dist/index.d.ts"` is the entry. TypeScript users get full type inference:

```ts
import uEmojiParser, { EmojiType, EmojiLibJsonType, EmojiParseOptionsType } from 'universal-emoji-parser'

const opts: EmojiParseOptionsType = { parseToHtml: true, parseToShortcode: false }
const result: string = uEmojiParser.parse('hello :smile:', opts)

const emoji: EmojiType | undefined = uEmojiParser.getEmojiObjectByShortcode('smile')
```

The exported types are:

- `EmojiType` — one entry in the catalog
- `EmojiLibJsonType` — `{ [key: string]: EmojiType }` (the catalog itself)
- `EmojiParseOptionsType` — the options bag for `parse()`
- `UEmojiParserType` — the type of the default export
- `TwemojiEntity` — what `@twemoji/parser` returns (rarely needed by consumers)

Removing or renaming any of these is a breaking change.

---

## Choosing a target to add

We don't currently target React Native, NativeScript, or any non-V8 runtime. If a consumer asks for one:

| Need                                           | Likely fix                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| React Native                                   | Should work — RN's Metro bundler handles CommonJS. Catalog size matters; consider lazy-load                                     |
| NativeScript                                   | Same as RN — works through their CommonJS shim                                                                                  |
| Browser-direct `<script>` (no bundler)         | Need to ship a UMD bundle. Currently we don't. Adding one means a second Vite library-mode output (`formats: ['umd']`) and a second `dist/` artifact |
| ESM-only consumers (`"type": "module"` strict) | Already works — `import` resolves through the `.d.ts` and Node's CommonJS interop                                               |

For each, the path is: open an issue describing the use case, add CI coverage for the new runtime if possible, document here.

---

## Gotchas across runtimes

1. **Catalog parse is synchronous and eager.** Every runtime pays the catalog parse cost at module load. This is fine for long-lived processes (Node servers, Lambdas), notable for cold-starting edge functions, irrelevant for browsers (the bundler precompiles the JSON into a JS object literal)
2. **`@twemoji/parser` is inlined into the bundle.** It's a `devDependency` baked into `dist/index.js` at build time, not a `dependency` or `peerDependency`. Consumers can't swap it out — and they don't install it separately
3. **`require()` cache is shared.** If a Node app calls `require('universal-emoji-parser')` from multiple files, they all get the same `uEmojiParser` object. Don't mutate it
4. **`process.exit()` mid-`parse`** would leave the catalog parse incomplete; not a real risk because `parse()` is fast (microseconds) and synchronous, but worth knowing
