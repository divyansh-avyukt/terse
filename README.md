# Terse

A token-efficient, presentation-only UI language for LLM agents. It compiles at build time to
React TSX (shadcn/ui + Tailwind). See [spec/SPEC.md](spec/SPEC.md).

```sh
npm create terse-app@latest my-app   # start a new app with Terse

# working on Terse itself:
pnpm install
pnpm test            # parser, validator, compiler snapshots, spec drift
pnpm dev             # playground at http://localhost:5173 (builds packages first)
pnpm bench           # token comparison: .terse vs the equivalent TSX
```

| package | role |
|---|---|
| `packages/core` | lexer, parser, AST, IR, validator, component schema (no React) |
| `packages/compiler` | IR → TSX emitter, `ComponentAdapter` / `StyleAdapter` interfaces, source maps |
| `packages/adapter-shadcn` | IR components → shadcn/ui JSX |
| `packages/style-tailwind` | style tokens → Tailwind classes |
| `packages/create-terse-app` | `npm create terse-app`: scaffolds a Vite + React + shadcn/ui app with Terse |
| `packages/vite-plugin` | `*.terse` → TSX module, with HMR, source maps and the error overlay |
| `examples/playground` | Vite app: `.terse` views in `src/views/`, TSX containers in `src/pages/` |
| `benchmarks/` | 5 UIs in both forms + `count-tokens.ts` |
