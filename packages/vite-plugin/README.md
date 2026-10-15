# @terseui/vite-plugin

Compiles `*.terse` files in Vite, with React Fast Refresh, source maps back to `.terse` lines and compile errors in the Vite overlay.

```ts
// vite.config.ts
import terse from '@terseui/vite-plugin'
import { shadcn } from '@terseui/adapter-shadcn'
import { tailwind } from '@terseui/style-tailwind'

export default defineConfig({
  plugins: [terse({ components: shadcn(), style: tailwind() }), react(), tailwindcss()],
})
```

For `import X from "./x.terse"` to type-check, add `"@terseui/vite-plugin/client"` to `compilerOptions.types`.

Docs, spec and getting started: https://terse-ui.dev · Source: https://github.com/divyansh-avyukt/terse

MIT © AVYUKT TECH LABS
