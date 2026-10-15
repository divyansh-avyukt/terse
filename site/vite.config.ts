import tailwindcss from '@tailwindcss/vite'
import terse from '@terse/vite-plugin'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'
import { statsPlugin } from './stats.ts'
import terseConfig from './terse.config.ts'

export default defineConfig({
  plugins: [terse(terseConfig), react(), tailwindcss(), statsPlugin()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
