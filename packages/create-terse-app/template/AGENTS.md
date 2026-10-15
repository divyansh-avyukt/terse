# AGENTS.md

This app's UI is written in **Terse**: `.terse` files that compile at build time to React TSX
(shadcn/ui + Tailwind). Before writing or editing a `.terse` file, read the language spec and the
component reference that ship with the installed compiler:

- `node_modules/@terseui/core/SPEC.md`
- `node_modules/@terseui/core/components.md`

Those are the only components and props that exist. Don't invent any.

## How UI is built here

- **Views are `.terse`, under `src/views/`.** Screens go in `src/views/pages/X.terse` (rooted at
  `page`). Reusable pieces go in `src/views/components/X.terse` (rooted at `card` or `section`).
  Don't write presentational JSX in `.tsx` when Terse can express it.
- **Logic is TSX, never in views.** Each screen has a container `src/pages/XPage.tsx` that owns
  state, effects, fetching, derived and formatted values, and handlers. It renders the view
  (`import X from "@/views/pages/X.terse"`) and passes every name listed in the view's `props`.
- **Precompute in TSX.** Views have no expressions, so pass final strings and numbers, and booleans
  for `if`. For `if` on lists, use `@items.length`.
- **Handlers take no arguments.** For per-item actions, pass ready-made callbacks.
- **Escape hatch:** if something can't be expressed in Terse, write a small TSX component in
  `src/components/` and bring it in with `use Name from "@/components/Name"`.
- **shadcn/ui components** live in `src/components/ui/`. Add missing ones with
  `npx shadcn@latest add <name>`; don't hand-edit them.

## Verify every change

1. `npm run build` passes (compile plus type-check). The Terse plugin writes a `X.d.terse.ts` next to
   each view with its props inferred from usage, so a container passing a misspelled or wrong-shaped
   prop fails type-checking. Terse errors give `file:line:col` and usually
   "did you mean …". Fix the `.terse` source; don't work around the compiler.
2. Check the result in the running app (`npm run dev`).
