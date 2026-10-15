# Using Terse in a new project

This sets up a Vite + React + TypeScript app with shadcn/ui, Tailwind v4 and Terse. Every step was
run end to end in a fresh folder outside this repo.

Terse isn't published yet, so the app **links** the packages from your local checkout
(`TERSE=/Users/divyansh/projects/terse`). Build that checkout once first, and again after you pull or
change it:

```sh
cd $TERSE && pnpm install && pnpm build
```

## 1. Vite + React + TS

```sh
pnpm create vite@latest my-app --template react-ts --no-interactive   # or `.` for the current (empty) dir
cd my-app && pnpm install
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @types/node
```

## 2. The `@/` alias (shadcn needs it)

`tsconfig.json`: add a `compilerOptions` block:

```json
{
  "files": [],
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json`: inside `compilerOptions`, add `paths`, and the Terse types to `types`:

```json
"types": ["vite/client", "@terse/vite-plugin/client"],
"paths": { "@/*": ["./src/*"] },
```

Don't add `baseUrl`. TypeScript 6 rejects it, and `paths` works without it.

`src/index.css`: replace its contents with `@import "tailwindcss";`

## 3. shadcn/ui and the components Terse uses

```sh
pnpm dlx shadcn@latest init -t vite -b radix -p nova -y --no-monorepo
pnpm dlx shadcn@latest add alert badge button card chart input label separator table -y
```

This also installs `lucide-react` (for `icon`) and `recharts` (for `chart`). The `nova` preset is
neutral, so chart series render in greys. For coloured charts, pick another preset or edit
`--chart-1`…`--chart-5` in `src/index.css`.

## 4. Terse

```sh
pnpm add -D link:$TERSE/packages/vite-plugin link:$TERSE/packages/adapter-shadcn link:$TERSE/packages/style-tailwind
```

`terse.config.ts` (project root) selects the component and style adapters:

```ts
import { shadcn } from '@terse/adapter-shadcn'
import { tailwind } from '@terse/style-tailwind'
import { defineConfig } from '@terse/vite-plugin'

export default defineConfig({ components: shadcn({ ui: '@/components/ui' }), style: tailwind() })
```

`vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'
import terse from '@terse/vite-plugin'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'
import terseConfig from './terse.config.ts'

export default defineConfig({
  plugins: [terse(terseConfig), react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
```

`src/index.css`: right after `@import "tailwindcss";`, add these lines so Tailwind generates the
classes that compiled views use:

```css
@source "../node_modules/@terse/adapter-shadcn/src";
@source "../node_modules/@terse/style-tailwind/src";
```

## 5. Project layout and agent instructions

```
src/
  views/pages/Home.terse         # a screen's view, rooted at `page`
  views/components/*.terse       # reusable views, rooted at `card`/`section`
  pages/HomePage.tsx             # container: state, fetching, handlers → renders the view
  components/*.tsx               # TSX components usable from .terse via `use`
  components/ui/                 # shadcn (generated, don't edit by hand)
```

Copy [`docs/CLAUDE.template.md`](./CLAUDE.template.md) to `my-app/CLAUDE.md` (or `AGENTS.md`). It
imports the Terse spec, so Claude Code knows the language in every session.

## 6. Check it

```sh
pnpm exec tsc -b       # .terse imports type-check via @terse/vite-plugin/client
pnpm dev               # edit a .terse file: hot reload; make a typo: error overlay with file:line:col
pnpm build
```

## Editor

Install the VS Code extension for highlighting and live errors:
`node $TERSE/editors/vscode/pack.mjs && code --install-extension $TERSE/editors/vscode/terse.vsix --force`

## Gotchas

- **After you change or pull `$TERSE`**, run `pnpm build` there, then restart `pnpm dev` in the app.
  The plugin and adapters are loaded from their `dist/`.
- **Missing shadcn component**: an error like `Failed to resolve import "@/components/ui/alert"`
  means a component the view uses wasn't added. Run `pnpm dlx shadcn@latest add <name>`.
