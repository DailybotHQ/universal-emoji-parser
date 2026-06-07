import { defineConfig } from 'vitest/config'

// Vitest reuses the Vite pipeline (TypeScript handled natively — no tsx/ts-node).
// Specs import { describe, it, expect } from 'vitest' explicitly (no globals).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
