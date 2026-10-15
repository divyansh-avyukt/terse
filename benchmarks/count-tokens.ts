// Token comparison: .terse vs the equivalent idiomatic TSX, plus the TSX Terse compiles to.
// Run: pnpm bench   (tokenizer: o200k_base via js-tiktoken — an approximation of any LLM's tokenizer)
import { shadcn } from '@terseui/adapter-shadcn'
import { compile } from '@terseui/compiler'
import { tailwind } from '@terseui/style-tailwind'
import { getEncoding } from 'js-tiktoken'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, 'prompts')
const enc = getEncoding('o200k_base')
const count = (s: string) => enc.encode(s).length
const opts = { components: shadcn(), style: tailwind() }

const rows = readdirSync(dir)
  .filter((f) => f.endsWith('.terse'))
  .sort()
  .map((f) => {
    const name = f.replace(/\.terse$/, '')
    const terse = readFileSync(join(dir, f), 'utf8')
    const tsx = readFileSync(join(dir, `${name}.tsx`), 'utf8')
    const compiled = compile(terse, { ...opts, file: f }).code
    return { name, terse: count(terse), tsx: count(tsx), compiled: count(compiled) }
  })

const total = rows.reduce((t, r) => ({ name: 'TOTAL', terse: t.terse + r.terse, tsx: t.tsx + r.tsx, compiled: t.compiled + r.compiled }), { name: 'TOTAL', terse: 0, tsx: 0, compiled: 0 })
const pct = (a: number, b: number) => `${(100 * (1 - a / b)).toFixed(1)}%`

console.table(
  Object.fromEntries(
    [...rows, total].map((r) => [
      r.name,
      { '.terse': r.terse, TSX: r.tsx, saved: pct(r.terse, r.tsx), 'compiled TSX': r.compiled, 'ratio vs compiled': `${(r.compiled / r.terse).toFixed(1)}x` },
    ]),
  ),
)
