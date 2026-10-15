import { compile, type ComponentAdapter, type StyleAdapter } from '@terseui/compiler'
import { TerseError } from '@terseui/core'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'

export interface TerseConfig {
  components: ComponentAdapter
  style: StyleAdapter
  /** Write `X.d.terse.ts` next to each view so containers get typed props (needs `allowArbitraryExtensions`). Default true. */
  types?: boolean
}

/** Typed helper for terse.config.ts. */
export const defineConfig = (config: TerseConfig) => config

// x.terse is served as the virtual module x.terse.tsx, so Vite's TSX transform and
// React Fast Refresh handle the compiled output like any other .tsx file.
const SUFFIX = '.tsx'

// `import X from "./X.terse"` resolves to X.d.terse.ts when tsconfig has allowArbitraryExtensions.
const declarationPath = (file: string) => file.replace(/\.terse$/, '.d.terse.ts')

/** Write a declaration only when it changed, so the file watcher isn't triggered for nothing. */
function writeTypes(file: string, dts: string) {
  const target = declarationPath(file)
  if (existsSync(target) && readFileSync(target, 'utf8') === dts) return
  writeFileSync(target, dts)
}

/** Every .terse file under `dir`, skipping dependencies, build output and dot-folders. */
function findViews(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) findViews(path, out)
    else if (entry.name.endsWith('.terse')) out.push(path)
  }
  return out
}

export default function terse(config: TerseConfig): Plugin {
  const types = config.types !== false
  let root = process.cwd()
  return {
    name: 'terse',
    enforce: 'pre',
    configResolved(resolved) {
      root = resolved.root
    },
    // Declarations for every view up front, so `tsc` and editors see typed props before a view is loaded.
    buildStart() {
      if (!types) return
      for (const file of findViews(root)) {
        try {
          writeTypes(file, compile(readFileSync(file, 'utf8'), { ...config, file }).dts)
        } catch {
          // a view with a compile error keeps its previous declaration; the error shows when it loads
        }
      }
    },
    // The dep optimizer's scanner resolves through plugins but loads files itself. Teach it to
    // compile views, so deps reached only through .terse (recharts, radix, ...) get pre-bundled
    // up front instead of triggering a reload on first visit.
    config: () => ({
      optimizeDeps: {
        rolldownOptions: {
          plugins: [
            {
              name: 'terse:scan',
              async load(id: string) {
                if (!id.endsWith('.terse' + SUFFIX)) return
                const file = id.slice(0, -SUFFIX.length)
                try {
                  return { code: compile(await readFile(file, 'utf8'), { ...config, file }).code, moduleType: 'tsx' as const }
                } catch {
                  return { code: 'export default null', moduleType: 'js' as const } // reported when the page loads it
                }
              },
            },
          ],
        },
      },
    }),
    async resolveId(source, importer, options) {
      const path = source.split('?')[0]
      if (!path.endsWith('.terse') && !path.endsWith('.terse' + SUFFIX)) return
      if (path.endsWith('.terse') && source !== path) return // x.terse?raw etc.: leave to Vite
      const real = path.endsWith(SUFFIX) ? path.slice(0, -SUFFIX.length) : path
      const resolved = await this.resolve(real, importer, { ...options, skipSelf: true })
      return resolved && resolved.id + SUFFIX
    },
    async load(id) {
      if (!id.endsWith('.terse' + SUFFIX)) return
      const file = id.slice(0, -SUFFIX.length)
      this.addWatchFile(file)
      const src = await readFile(file, 'utf8')
      try {
        const { code, map, dts } = compile(src, { ...config, file })
        if (types) writeTypes(file, dts)
        return { code, map }
      } catch (e) {
        if (!(e instanceof TerseError)) throw e
        this.error({
          message: e.message,
          id: file,
          loc: { file, line: e.line, column: e.col },
          frame: codeFrame(src, e.line, e.col),
        })
      }
    },
    // An edit to x.terse hot-updates the x.terse.tsx module (a Fast Refresh boundary).
    hotUpdate({ file, modules }) {
      if (!file.endsWith('.terse')) return
      const compiled = this.environment.moduleGraph.getModulesByFile(file + SUFFIX)
      return compiled ? [...modules, ...compiled] : modules
    },
  }
}

function codeFrame(src: string, line: number, col: number): string {
  const lines = src.split(/\r?\n/)
  const out: string[] = []
  for (let n = Math.max(1, line - 2); n <= Math.min(lines.length, line + 1); n++) {
    out.push(`${n === line ? '>' : ' '} ${String(n).padStart(3)} | ${lines[n - 1]}`)
    if (n === line) out.push(`      | ${' '.repeat(col - 1)}^`)
  }
  return out.join('\n')
}
