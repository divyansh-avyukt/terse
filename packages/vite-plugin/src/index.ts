import { compile, type ComponentAdapter, type StyleAdapter } from '@terse/compiler'
import { TerseError } from '@terse/core'
import { readFile } from 'node:fs/promises'
import type { Plugin } from 'vite'

export interface TerseConfig {
  components: ComponentAdapter
  style: StyleAdapter
}

/** Typed helper for terse.config.ts. */
export const defineConfig = (config: TerseConfig) => config

// x.terse is served as the virtual module x.terse.tsx, so Vite's TSX transform and
// React Fast Refresh handle the compiled output like any other .tsx file.
const SUFFIX = '.tsx'

export default function terse(config: TerseConfig): Plugin {
  return {
    name: 'terse',
    enforce: 'pre',
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
        return compile(src, { ...config, file })
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
