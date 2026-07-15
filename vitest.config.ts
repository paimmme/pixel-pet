import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    // Default environment for main-process code
    environment: 'node',
  },
})
