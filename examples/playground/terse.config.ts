import { shadcn } from '@terseui/adapter-shadcn'
import { tailwind } from '@terseui/style-tailwind'
import { defineConfig } from '@terseui/vite-plugin'

// Swap these to target another component library or styling system.
export default defineConfig({
  components: shadcn({ ui: '@/components/ui' }),
  style: tailwind(),
})
