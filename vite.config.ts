import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Library build for universal-emoji-parser.
//
// Output contract (must match what consumers have always received):
//   - dist/index.js          single minified CommonJS bundle (libraryTarget commonjs2
//                            equivalent). @twemoji/parser and the emoji catalog are
//                            INLINED -> the package ships with ZERO runtime deps.
//   - dist/index.d.ts +      emitted separately by `tsc --emitDeclarationOnly`
//     dist/lib/type.d.ts     (see the `build` script in package.json).
//
// The dual CommonJS/ESM export shape is preserved by the `module.exports = uEmojiParser`
// tail in src/index.ts (the Rollup MIXED_EXPORTS warning is cosmetic and does not break
// `require()` — verified by test/exports.test.ts).
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    // No `rollupOptions.external`: inline everything (including @twemoji/parser) so the
    // published package has no runtime dependencies.
  },
})
