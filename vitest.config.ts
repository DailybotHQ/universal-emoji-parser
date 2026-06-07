import { defineConfig } from 'vitest/config'

// Vitest reuses the Vite pipeline; TypeScript is handled natively.
// Specs import { describe, it, expect } from 'vitest' explicitly (no globals).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
