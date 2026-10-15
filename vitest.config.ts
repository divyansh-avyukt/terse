import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const pkg = (name: string) => fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url))

// Tests run against sources, no build needed.
export default defineConfig({
  resolve: {
    alias: {
      '@terseui/core': pkg('core'),
      '@terseui/compiler': pkg('compiler'),
      '@terseui/adapter-shadcn': pkg('adapter-shadcn'),
      '@terseui/style-tailwind': pkg('style-tailwind'),
    },
  },
  test: { include: ['packages/*/test/**/*.test.ts'] },
})
