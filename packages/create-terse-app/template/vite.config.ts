import tailwindcss from '@tailwindcss/vite'
import { shadcn } from '@terseui/adapter-shadcn'
import { tailwind } from '@terseui/style-tailwind'
import terse from '@terseui/vite-plugin'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  // terse() compiles src/**/*.terse; swap the adapters to target another UI library.
  plugins: [terse({ components: shadcn({ ui: '@/components/ui' }), style: tailwind() }), react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
