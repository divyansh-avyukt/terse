import { shadcn } from '@terse/adapter-shadcn'
import { tailwind } from '@terse/style-tailwind'
import { defineConfig } from '@terse/vite-plugin'

// Swap these to target another component library or styling system.
export default defineConfig({
  components: shadcn({ ui: '@/components/ui' }),
  style: tailwind(),
})
