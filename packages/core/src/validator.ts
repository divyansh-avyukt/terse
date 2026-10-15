import type { RefValue, Value } from './ast.js'
import { didYouMean, type Diagnostic, type Loc } from './errors.js'
import type { IR, IRNode } from './ir.js'
import { COMPONENTS } from './schema.js'

/** Semantic checks: component names, props and their values, and that every @ref is in scope. */
export function validate(ir: IR): Diagnostic[] {
  const out: Diagnostic[] = []
  const report = (message: string, at: Loc) => out.push({ message, line: at.line, col: at.col })
  const uses = new Map(ir.uses.map((u) => [u.name, u]))

  const seen = new Set<string>()
  for (const p of ir.props) {
    if (seen.has(p.name)) report(`prop '${p.name}' is declared twice`, p)
    seen.add(p.name)
  }
  if (uses.size !== ir.uses.length) {
    const dup = ir.uses.find((u, i) => ir.uses.findIndex((v) => v.name === u.name) !== i)!
    report(`'${dup.name}' is imported twice`, dup)
  }

  const checkRef = (r: RefValue, scope: Set<string>) => {
    const root = r.path[0]
    if (scope.has(root)) return
    const hint = didYouMean(root, scope, '@')
    report(`unknown reference '@${r.path.join('.')}'${hint || ` — declare it with: props ${root}`}`, r)
  }

  const walk = (nodes: IRNode[], scope: Set<string>) => {
    for (const n of nodes) {
      if (n.kind === 'each') {
        checkRef(n.source, scope)
        walk(n.children, new Set(scope).add(n.as))
        continue
      }
      if (n.kind === 'if') {
        checkRef(n.cond, scope)
        walk(n.then, scope)
        if (n.else) walk(n.else, scope)
        continue
      }

      const spec = COMPONENTS[n.name]
      if (!spec && !uses.has(n.name)) {
        const user = /^[A-Z]/.test(n.name)
        const hint = didYouMean(n.name, user ? uses.keys() : Object.keys(COMPONENTS))
        report(`unknown component '${n.name}'${hint || (user ? ` — import it with: use ${n.name} from "..."` : '')}`, n)
      }

      for (const [key, v] of Object.entries(n.props)) {
        if (v.kind === 'ref') checkRef(v, scope)
        if (!spec) continue // user component props pass through unchanged
        const type = spec.props[key]
        if (!type) {
          const valid = Object.keys(spec.props)
          report(`unknown prop '${key}' on '${n.name}'${didYouMean(key, valid) || (valid.length ? ` — valid props: ${valid.join(', ')}` : ' — it takes no props')}`, { line: v.line, col: v.col - key.length - 1 }) // point at key=
        } else checkValue(n.name, key, v, type, report)
      }
      for (const r of spec?.required ?? []) if (!(r in n.props)) report(`'${n.name}' requires '${r}'`, n)
      if (spec && !spec.children && n.children.length) report(`'${n.name}' cannot have children`, n.children[0])
      walk(n.children, scope)
    }
  }

  walk(ir.body, new Set(ir.props.map((p) => p.name)))
  return out.sort((a, b) => a.line - b.line || a.col - b.col)
}

function checkValue(comp: string, key: string, v: Value, type: (typeof COMPONENTS)[string]['props'][string], report: (m: string, at: Loc) => void) {
  const shown = v.kind === 'ref' ? `@${v.path.join('.')}` : JSON.stringify(v.value)
  if (Array.isArray(type)) {
    if (v.kind === 'ref') report(`'${key}' on '${comp}' must be a literal (${type.join('|')}), not a reference`, v)
    else if (!type.includes(String(v.value))) {
      report(`invalid value ${shown} for '${key}' on '${comp}'${didYouMean(String(v.value), type)} — expected ${type.join('|')}`, v)
    }
  } else if ((type === 'ref' || type === 'handler') && v.kind !== 'ref') {
    report(`'${key}' on '${comp}' must be a reference like @${type === 'handler' ? 'onSave' : 'items'}, got ${shown}`, v)
  } else if (type === 'bool' && v.kind === 'lit' && typeof v.value !== 'boolean') {
    report(`'${key}' on '${comp}' must be true, false or a reference, got ${shown}`, v)
  } else if (type === 'list' && v.kind === 'ref') {
    report(`'${key}' on '${comp}' must be a literal list like a,b,c`, v)
  }
}
