// Copy that isn't measured: install snippets, the agent prompt and CLAUDE.md excerpt.
export const GITHUB = 'https://github.com/avyuktlabs/terse'

export const INSTALL = `pnpm add -D @terse/vite-plugin \\
  @terse/adapter-shadcn @terse/style-tailwind`

export const VITE_CONFIG = `import terse from '@terse/vite-plugin'
import { shadcn } from '@terse/adapter-shadcn'
import { tailwind } from '@terse/style-tailwind'

export default defineConfig({
  plugins: [
    terse({ components: shadcn(), style: tailwind() }),
    react(),
    tailwindcss(),
  ],
})`

export const FIRST_VIEW = `props user, onWave

card "Hello, Terse" description="A shadcn card in four lines."
  text @user.greeting
  button "Wave" variant=outline on=@onWave`

export const TERSE_CONFIG = `import { shadcn } from '@terse/adapter-shadcn'
import { tailwind } from '@terse/style-tailwind'
import { defineConfig } from '@terse/vite-plugin'

// The compiler only talks to these two interfaces.
// Swap them to target another design system.
export default defineConfig({
  components: shadcn({ ui: '@/components/ui' }), // ComponentAdapter
  style: tailwind(),                              // StyleAdapter
})`

export const CONTAINER = `import { useDashboard } from '@/hooks/useDashboard'
import Dashboard from '@/views/pages/Dashboard.terse'

// TSX owns state, fetching and formatting.
export default function DashboardPage() {
  const { stats, orders, loading, refresh } = useDashboard()
  return (
    <Dashboard
      stats={stats}
      orders={orders}
      loading={loading}
      onRefresh={refresh}
    />
  )
}`

export const VIEW = `use UserAvatar from "@/components/UserAvatar"
props user, stats, orders, loading, onRefresh

page "Dashboard"
  grid cols=1,3
    stat "Revenue" @stats.revenue delta=@stats.delta
    stat "Orders" @stats.orders
    stat "Customers" @stats.customers
  card "Recent orders"
    if @loading
      text "Loading…" tone=muted
    else
      table @orders cols=id,customer,total
  row justify=between
    UserAvatar user=@user size=sm
    button "Refresh" variant=outline on=@onRefresh`

export const CLAUDE_MD = `## UI is written in Terse

- Views are \`.terse\` files in \`src/views/\`. Learn the language from
  https://terse-ui.dev/llms.txt before writing one.
- Views only render. State, effects, fetching and handlers live in TSX
  containers in \`src/pages/\` that pass everything in as props.
- Precompute display strings in TSX; views have no expressions.
- After each change run \`pnpm build\`. Terse errors give file:line:col and
  usually the fix — correct the .terse source, don't work around it.`

export const PROMPT = `Build a web app in this empty directory, using Terse for all UI.

Setup: create a Vite + React + TypeScript app with Tailwind v4 and shadcn/ui,
then add Terse (pnpm add -D @terse/vite-plugin @terse/adapter-shadcn
@terse/style-tailwind) and register terse({ components: shadcn(), style: tailwind() })
in vite.config.ts. Read https://terse-ui.dev/llms.txt in full first; those are
the only components and props that exist.

Rules: views are .terse files in src/views/; TSX containers in src/pages/ own
state, fetching and handlers and pass precomputed values as props. Build one
screen at a time: write the view and container, make \`pnpm build\` pass, check
it in the browser, commit.

The app: <describe the screens, their data and the actions a user can take>`
