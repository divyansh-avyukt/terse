# create-terse-app

Create a Vite + React + TypeScript app with Tailwind v4, shadcn/ui and [Terse](https://terse-ui.dev)
already wired in:

```sh
npm create terse-app@latest my-app
cd my-app && npm install && npm run dev
```

Works with `pnpm create`, `yarn create` and `bun create` too.

You get an example view (`src/views/pages/Home.terse`) and its TSX container (`src/pages/HomePage.tsx`),
the shadcn/ui components Terse renders to, and `AGENTS.md` / `CLAUDE.md` that point your coding
agent at the Terse spec in `node_modules/@terseui/core`.

MIT © AVYUKT TECH LABS
