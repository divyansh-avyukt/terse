# AGENTS.md

Terse is a presentation-only UI language that compiles to React TSX (shadcn/ui + Tailwind) at build
time. This file covers two jobs: **writing `.terse` views** in an app, and **changing the toolchain**
in `packages/`. The language itself is defined in [spec/SPEC.md](spec/SPEC.md) and
[spec/components.md](spec/components.md). Read those before writing `.terse`.

## Commands

```sh
pnpm install
pnpm build        # tsc -b all packages → dist/ (the playground and benchmark use dist)
pnpm test         # vitest, runs against package sources, no build needed
pnpm test -u      # update compiler snapshots, only after reviewing the diff
pnpm dev          # playground (builds packages first)
pnpm bench        # token comparison table
pnpm --dir examples/playground exec tsc --noEmit   # type-check the playground
```

## Writing `.terse` views

- Views go in `src/views/` and TSX never does. Screens go in `views/pages/X.terse` (rooted at
  `page`) and are rendered by a container `pages/XPage.tsx`. Reusable views go in
  `views/components/` (rooted at `card`/`section`). See "Project layout" in SPEC.md.
- A view only renders. State, effects, fetching, formatting and any logic stay in the TSX container
  and come in through `props`. If you find yourself wanting an expression in `.terse`, compute it in
  TSX and pass it in.
- Every `@ref` must start with a name declared in `props` or a loop variable. Handlers take no
  arguments: `on=@onSave`. For `onSelect(id)`, write the wrapper in TSX.
- Use `use Name from "@/…"` to import TSX components (default exports) or other views.
- Run `pnpm --dir examples/playground exec vite build`, or watch the dev overlay, to compile. Errors
  give `file:line:col` and usually a "did you mean". Fix them; don't work around them.

## Toolchain architecture (do not break these)

```
core (lexer → parser → AST → lower → IR → validate)    no React, no deps
  ↓ IR
compiler (emit: IR → TSX + line source map)            talks to UI libs ONLY via
  ├─ ComponentAdapter  ← adapter-shadcn                 compiler/src/adapter.ts
  └─ StyleAdapter      ← style-tailwind
vite-plugin (x.terse served as virtual x.terse.tsx)    adapters chosen in terse.config.ts
```

- **Core stays framework-free.** Nothing in `packages/core` may import React, a UI library or the
  compiler.
- **The compiler never names a library.** All shadcn/Tailwind knowledge lives in the two adapter
  packages. A second library (e.g. MUI) must be addable as a new adapter with zero edits to `core`
  or `compiler`. `compiler/test` has a test that guards this.
- **Write Tailwind classes as complete string literals** in the adapters (`'gap-4'`, never
  `` `gap-${n}` ``). The playground's Tailwind scans adapter sources (see `@source` in
  `src/index.css`), so classes that are built at runtime disappear from the CSS.
- **Errors are `TerseError` with an exact line and column.** Syntax errors throw from the
  parser/lexer. Semantic errors are collected in `validator.ts` (or `lower` for argument shape) so
  that all of them get reported. Messages follow the existing style: what is wrong, then
  `— did you mean 'x'?` via `didYouMean()`, or the fix.
- **The Vite plugin's `.terse.tsx` virtual id is load-bearing.** Vite only enables React Fast
  Refresh for paths ending in `x`, and `hotUpdate` maps edits to `x.terse` back onto that module.
  Don't switch it to a query-string id.

## Adding or changing a component

1. `packages/core/src/schema.ts`: positional `args`, `props` with types, `required`, `children`.
2. `spec/components.md`: document it. A test fails if any component or prop is undocumented.
3. `packages/adapter-shadcn/src/index.ts`: add the `case`. Use `ctx.attr`/`ctx.child`/`ctx.expr`
   for values, `ctx.use()` for imports, `style(...)` for tokens and `CHILDREN` for where children go.
4. Add a snippet to `SNIPPETS` in `packages/compiler/test/compiler.test.ts`, run `pnpm test -u`, and
   read the new snapshot.
5. If the component needs a new shadcn file, add it to `examples/playground/src/components/ui/`.

New style tokens go in `TOKENS` (`schema.ts`) plus the maps in `style-tailwind`, and must stay
literal-only.

## Verifying changes

- Always run `pnpm test`. If you touch the emitter or adapters, review the snapshot diffs instead of
  blindly updating them.
- The dev server loads the plugin and adapters from `dist/` through `vite.config.ts`. After changing
  `packages/*`, run `pnpm build` and **restart** `pnpm dev`. HMR covers `.terse`/`.tsx` app files,
  not the toolchain.
- For UI changes, look at the running playground. Tests don't prove that it renders correctly.
- If you change grammar or diagnostics, rebuild and reinstall the editor extension:
  `node editors/vscode/pack.mjs && code --install-extension editors/vscode/terse.vsix --force`.
  The extension bundles `packages/core/dist`, so core changes also need a repack.

## Conventions

- TypeScript strict, ESM, `.js` extensions in relative imports inside `packages/`.
- Keep it small. There are no abstractions without a second user, and a comment explains *why*,
  not what.
- Dependencies: React, Vite, Tailwind, shadcn/ui (and its `cva`/`clsx`/`tailwind-merge`), Vitest and
  `js-tiktoken`. **Ask before adding anything else** to the toolchain packages.
- Benchmarks: `benchmarks/prompts/<name>.terse` and `<name>.tsx` must render the same UI. Keep the
  TSX idiomatic, not padded, or the numbers stop meaning anything.
