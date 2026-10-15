import { shadcn } from '@terseui/adapter-shadcn'
import { tailwind } from '@terseui/style-tailwind'
import { defineConfig } from '@terseui/vite-plugin'

export default defineConfig({ components: shadcn({ ui: '@/components/ui' }), style: tailwind() })
