// Build-time facts for the landing page. Every number on the page comes from here, measured from
// real files when the site builds, so the copy can't drift from the code.
import { shadcn } from '@terseui/adapter-shadcn'
import { compile } from '@terseui/compiler'
import { analyze, TerseError } from '@terseui/core'
import { tailwind } from '@terseui/style-tailwind'
import { getEncoding } from 'js-tiktoken'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

const ROOT = join(import.meta.dirname, '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const enc = getEncoding('o200k_base')
const tokens = (s: string) => enc.encode(s).length
const lines = (s: string) => s.trimEnd().split('\n').length
const pct = (a: number, b: number) => Math.round(1000 * (1 - a / b)) / 10
const fmt = (n: number) => n.toLocaleString('en-US')

/** The compiler's real message for a snippet, formatted like the CLI/overlay. */
function compileError(file: string, src: string): string {
  try {
    analyze(src, file)
  } catch (e) {
    if (e instanceof TerseError) return `✖ ${file}:${e.line}:${e.col}\n  ${e.message.split('\n')[0]}`
    throw e
  }
  throw new Error(`expected ${file} to fail to compile`)
}

function benchmarks() {
  const dir = 'benchmarks/prompts'
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.terse'))
    .sort()
    .map((f) => {
      const name = f.replace(/\.terse$/, '')
      const terse = tokens(read(`${dir}/${f}`))
      const tsx = tokens(read(`${dir}/${name}.tsx`))
      return { name, terse, tsx, saved: pct(terse, tsx) }
    })
}

/** Where the tokens in the benchmark TSX go. */
function anatomy() {
  let total = 0
  const parts = { imports: 0, types: 0, classNames: 0, closingTags: 0 }
  for (const f of readdirSync(join(ROOT, 'benchmarks/prompts')).filter((f) => f.endsWith('.tsx'))) {
    const src = read(`benchmarks/prompts/${f}`)
    total += tokens(src)
    const sum = (re: RegExp) => [...src.matchAll(re)].reduce((n, m) => n + tokens(m[0]), 0)
    parts.imports += sum(/^import .*$/gm)
    parts.types += sum(/^(?:export )?interface \w+[^]*?^\}/gm)
    parts.classNames += sum(/ className="[^"]*"/g)
    parts.closingTags += sum(/<\/[\w.]*>/g)
  }
  const ceremony = Object.values(parts).reduce((a, b) => a + b, 0)
  return { total, ...parts, rest: total - ceremony }
}

// Snippets shown on the page. The compiled TSX and the errors are real compiler output.
const STEP = `props stats, onRefresh

card "Revenue"
  stat "This month" @stats.revenue delta=@stats.delta
  button "Refresh" variant=outline on=@onRefresh
`
const TYPO = `props stats, onRefresh

row justify=between
  stat "Orders" @stats.orders
  buton "Refresh" on=@onRefresh
`
const TOKEN = `card "Pro plan"
  row gap=13px
    text "$29 / month"
`

export function stats() {
  const rows = benchmarks()
  const terse = rows.reduce((n, r) => n + r.terse, 0)
  const tsx = rows.reduce((n, r) => n + r.tsx, 0)
  const weatherTerse = read('examples/playground/src/pages/weather.terse')
  const weatherTsx = read('examples/playground/src/pages/WeatherTsx.tsx')
  const sectionDir = 'site/src/views/sections'
  const sections = Object.fromEntries(
    readdirSync(join(ROOT, sectionDir))
      .filter((f) => f.endsWith('.terse'))
      .map((f) => {
        const src = read(`${sectionDir}/${f}`)
        return [f.replace(/\.terse$/, ''), { tokens: tokens(src), lines: lines(src) }]
      }),
  )
  const page = Object.values(sections).reduce((a, s) => ({ tokens: a.tokens + s.tokens, lines: a.lines + s.lines }), { tokens: 0, lines: 0 })
  return {
    benchmarks: rows.map((r) => ({ ...r, terse: fmt(r.terse), tsx: fmt(r.tsx), saved: `${r.saved}%` })),
    benchmarkRaw: rows,
    total: { terse, tsx, saved: pct(terse, tsx) },
    weather: {
      terse: { tokens: tokens(weatherTerse), lines: lines(weatherTerse) },
      tsx: { tokens: tokens(weatherTsx), lines: lines(weatherTsx) },
      saved: pct(tokens(weatherTerse), tokens(weatherTsx)),
    },
    anatomy: anatomy(),
    snippets: {
      step: STEP,
      stepError: compileError('Revenue.terse', STEP.replace('variant=outline', 'varient=outline')),
      stepTsx: compile(STEP, { file: 'Revenue.terse', components: shadcn(), style: tailwind() }).code,
      typo: TYPO,
      typoError: compileError('Dashboard.terse', TYPO),
      typoFixed: TYPO.replace('buton', 'button'),
      token: TOKEN,
      tokenError: compileError('Card.terse', TOKEN),
    },
    sections,
    page,
  }
}

const ID = 'virtual:terse-stats'

/** `import stats from "virtual:terse-stats"`, plus /llms.txt (the spec, for agents). */
export function statsPlugin(): Plugin {
  const llms = () => `${read('spec/SPEC.md')}\n\n${read('spec/components.md')}`
  return {
    name: 'terse-site-stats',
    resolveId: (id) => (id === ID ? '\0' + ID : undefined),
    load(id) {
      if (id !== '\0' + ID) return
      const s = stats()
      // The benchmark chart is written in Terse with literal numbers; fail the build if they drift.
      const view = read('site/src/views/sections/Benchmarks.terse')
      for (const [label, key] of [['Terse', 'terse'], ['TSX', 'tsx']] as const) {
        const want = s.benchmarkRaw.map((r) => r[key]).join(',')
        if (!view.includes(`series "${label}" ${want}`)) throw new Error(`Benchmarks.terse: series "${label}" must be ${want} (from pnpm bench)`)
      }
      return `export default ${JSON.stringify(s)}`
    },
    configureServer(server) {
      server.middlewares.use('/llms.txt', (_, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(llms())
      })
      // Section edits change their token counts.
      server.watcher.on('change', (f) => {
        if (!f.endsWith('.terse')) return
        const mod = server.moduleGraph.getModuleById('\0' + ID)
        if (mod) server.reloadModule(mod)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llms() })
    },
  }
}
