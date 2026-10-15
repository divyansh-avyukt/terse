import tailwindcss from '@tailwindcss/vite'
import terse from '@terse/vite-plugin'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import terseConfig from './terse.config.ts'

export default defineConfig({
  plugins: [terse(terseConfig), react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
