# Terse app

Created with `create-terse-app`: Vite + React + TypeScript, Tailwind v4, shadcn/ui and
[Terse](https://terse-ui.dev).

```sh
npm install
npm run dev
```

- **Views** (`.terse`) are in `src/views/`. Start with `src/views/pages/Home.terse`.
- **Containers** (`.tsx`) are in `src/pages/`. They hold state and data and pass them to views as props.
- **Agents:** `AGENTS.md` and `CLAUDE.md` point your coding agent at the Terse spec in
  `node_modules/@terseui/core`.
