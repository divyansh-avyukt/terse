// Token counts for the stress-test app. Run from the repo root after `pnpm build`:
//   node benchmarks/results/stress/count.ts
// With ANTHROPIC_API_KEY set and @anthropic-ai/sdk installed, counts use Claude's tokenizer
// (messages.countTokens). Otherwise js-tiktoken o200k_base, which is only an approximation for Claude.
import { shadcn } from '@terse/adapter-shadcn'
import { compile } from '@terse/compiler'
import { tailwind } from '@terse/style-tailwind'
import { getEncoding } from 'js-tiktoken'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '../../..')
const app = join(root, 'examples/playground/src')
const opts = { components: shadcn({ ui: '@/components/ui' }), style: tailwind() }

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

async function tokenizer(): Promise<{ label: string; count: (s: string) => Promise<number> }> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk' as string)
      const client = new Anthropic()
      const model = 'claude-opus-5-5'
      const raw = async (s: string) => (await client.messages.countTokens({ model, messages: [{ role: 'user', content: s }] })).input_tokens as number
      // Every request carries a fixed message overhead; measure it once and subtract it.
      const overhead = (await raw('.')) - 1
      return { label: `Anthropic count_tokens (${model})`, count: async (s) => (await raw(s)) - overhead }
    } catch (e) {
      console.warn(`ANTHROPIC_API_KEY is set but count_tokens failed (${(e as Error).message}); falling back to js-tiktoken.`)
    }
  }
  const enc = getEncoding('o200k_base')
  return { label: 'js-tiktoken o200k_base (APPROXIMATION: not Claude’s tokenizer)', count: async (s) => enc.encode(s).length }
}

const { label, count } = await tokenizer()
const rel = (p: string) => relative(app, p)
const read = (p: string) => readFileSync(p, 'utf8')
const files = (dir: string, ext: RegExp) => walk(join(app, dir)).filter((p) => ext.test(p)).sort()

const views = []
for (const p of files('views/cafe', /\.terse$/)) {
  const src = read(p)
  const compiled = compile(src, { ...opts, file: p }).code
  views.push({ file: rel(p), lines: src.trim().split('\n').length, terse: await count(src), compiled: await count(compiled) })
}
const containers = []
for (const p of files('pages/cafe', /\.tsx$/)) containers.push({ file: rel(p), tokens: await count(read(p)) })
const helpers = []
for (const p of files('app', /\.ts$/)) helpers.push({ file: rel(p), tokens: await count(read(p)) })

// Calibration: two views written by hand as idiomatic TSX that render pixel-identically (see README).
const pairs = [
  ['views/cafe/pages/Overview.terse', 'calibration/OverviewView.tsx'],
  ['views/cafe/pages/Settings.terse', 'calibration/SettingsView.tsx'],
]
const calibration = []
for (const [terseFile, tsxFile] of pairs) {
  const v = views.find((x) => x.file === terseFile)!
  calibration.push({ view: terseFile, terse: v.terse, compiled: v.compiled, hand: await count(read(join(app, tsxFile))) })
}

const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0)
const totals = {
  terse: sum(views, (v) => v.terse),
  compiled: sum(views, (v) => v.compiled),
  containers: sum(containers, (c) => c.tokens),
  helpers: sum(helpers, (h) => h.tokens),
}
const calTerse = sum(calibration, (c) => c.terse)
const calHand = sum(calibration, (c) => c.hand)
const calCompiled = sum(calibration, (c) => c.compiled)
const estimate = {
  handPerTerse: calHand / calTerse,
  handPerCompiled: calHand / calCompiled,
  byTerseRatio: Math.round(totals.terse * (calHand / calTerse)),
  byCompiledRatio: Math.round(totals.compiled * (calHand / calCompiled)),
}

console.log(`Tokenizer: ${label}\n`)
console.table(Object.fromEntries(views.map((v) => [v.file, { lines: v.lines, '.terse': v.terse, compiled: v.compiled, 'compiled / terse': (v.compiled / v.terse).toFixed(1) }])))
console.table(Object.fromEntries(calibration.map((c) => [c.view, { '.terse': c.terse, 'hand TSX': c.hand, 'compiled TSX': c.compiled, 'hand / terse': (c.hand / c.terse).toFixed(2) }])))
console.log({ totals, estimate })
writeFileSync(join(import.meta.dirname, 'counts.json'), JSON.stringify({ tokenizer: label, views, containers, helpers, calibration, totals, estimate }, null, 2) + '\n')
