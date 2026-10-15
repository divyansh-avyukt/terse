# CLAUDE.md

This app's UI is written in **Terse**: `.terse` files that compile at build time to React TSX
(shadcn/ui + Tailwind). The language spec and component reference are imported below. Follow them
exactly.

@/Users/divyansh/projects/terse/spec/SPEC.md
@/Users/divyansh/projects/terse/spec/components.md

## How UI is built here

- **Views are `.terse`, under `src/views/`.** Screens go in `src/views/pages/X.terse` (rooted at
  `page`). Reusable pieces go in `src/views/components/X.terse` (rooted at `card` or `section`).
  Never write presentational JSX in `.tsx` when Terse can express it.
- **Logic is TSX, never in views.** Each screen has a container `src/pages/XPage.tsx` that owns
  state, effects, fetching, derived and formatted values, and handlers. It renders the view:
  `import X from "@/views/pages/X.terse"`, passing every name in the view's `props`.
- **Precompute in TSX.** Views have no expressions, so pass the final strings and numbers
  (`"$1,200"`, `"+12% from last month"`) and booleans for `if`. For `if` on lists, use `@items.length`.
- **Handlers take no arguments.** For per-item actions, pass a ready-made callback, or render the item
  through a small TSX component imported with `use`.
- **Escape hatch.** If something truly can't be expressed in Terse (custom widget, third-party
  component), write a focused TSX component in `src/components/` and `use` it from the view. Keep
  that rare.
- **shadcn components** live in `src/components/ui/`. Add missing ones with
  `pnpm dlx shadcn@latest add <name>`. Don't hand-edit them.

## Verify every change

1. `pnpm exec tsc -b` passes.
2. `pnpm build` passes. Terse errors give `file:line:col` and usually "did you mean …". Fix the
   `.terse` source; don't work around the compiler.
3. Look at it in the running app (`pnpm dev`). A build that compiles can still look wrong.

## Dependencies

Ask before adding runtime dependencies beyond React, shadcn/ui (and what its CLI installs) and
Tailwind.
