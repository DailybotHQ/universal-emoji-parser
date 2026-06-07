import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Library build for universal-emoji-parser.
//
// (vite.config.ts — see vitest.config.ts for the test runner setup.)
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
    rollupOptions: {
      // The `module.exports = uEmojiParser` tail in src/index.ts is the intentional
      // CommonJS-interop pattern that lets `require('universal-emoji-parser').parse(...)`
      // work for CJS consumers. Rollup flags this with two cosmetic warnings — silence
      // them so they don't drown CI output. The runtime behavior is covered by
      // test/exports.test.ts (static check + built-bundle smoke).
      onwarn(warning, defaultHandler) {
        if (warning.code === 'COMMONJS_VARIABLE_IN_ESM') return
        if (warning.code === 'MIXED_EXPORTS') return
        defaultHandler(warning)
      },
    },
  },
})
