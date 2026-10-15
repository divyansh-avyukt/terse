import { shadcn } from '@terse/adapter-shadcn'
import { tailwind } from '@terse/style-tailwind'
import { defineConfig } from '@terse/vite-plugin'

export default defineConfig({ components: shadcn({ ui: '@/components/ui' }), style: tailwind() })
