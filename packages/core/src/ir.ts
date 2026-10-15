import type { Ast, Node, RefValue, Use, Value } from './ast.js'
import type { Diagnostic, Loc } from './errors.js'
import { COMPONENTS } from './schema.js'

export interface IRComponent extends Loc {
  kind: 'component'
  name: string
  builtin: boolean // false: a user component imported with `use`
  props: Record<string, Value> // positional args resolved to named props
  children: IRNode[]
}

export interface IREach extends Loc {
  kind: 'each'
  source: RefValue
  as: string
  key?: string[]
  children: IRNode[]
}

export interface IRIf extends Loc {
  kind: 'if'
  cond: RefValue
  negate: boolean
  then: IRNode[]
  else?: IRNode[]
}

export type IRNode = IRComponent | IREach | IRIf

export interface IR {
  file?: string
  name: string // PascalCase component name, from the file name
  uses: Use[]
  props: ({ name: string } & Loc)[]
  body: IRNode[]
}

/** Resolve positional args to named props. Reports arg-shape errors; semantic checks live in validate(). */
export function lower(ast: Ast): { ir: IR; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = []
  const report = (message: string, at: Loc) => diagnostics.push({ message, line: at.line, col: at.col })

  const node = (n: Node): IRNode => {
    if (n.type === 'each') return { kind: 'each', source: n.source, as: n.as, key: n.key, children: n.children.map(node), line: n.line, col: n.col }
    if (n.type === 'if') {
      return { kind: 'if', cond: n.cond, negate: n.negate, then: n.then.map(node), else: n.else?.map(node), line: n.line, col: n.col }
    }
    const spec = COMPONENTS[n.name]
    const props: Record<string, Value> = {}
    if (spec) {
      n.args.forEach((arg, i) => {
        const key = spec.args[i]
        if (!key) {
          const names = spec.args.length ? ` (${spec.args.join(', ')})` : ''
          report(`'${n.name}' takes ${spec.args.length} positional argument${spec.args.length === 1 ? '' : 's'}${names}, got ${n.args.length}`, arg)
        } else props[key] = arg
      })
    } else if (/^[A-Z]/.test(n.name) && n.args.length) {
      report(`user component '${n.name}' takes key=value props only, not positional arguments`, n.args[0])
    }
    for (const a of n.attrs) {
      if (a.key in props) report(`'${a.key}' is given both positionally and as ${a.key}=`, a)
      props[a.key] = a.value
    }
    return { kind: 'component', name: n.name, builtin: !!spec, props, children: n.children.map(node), line: n.line, col: n.col }
  }

  return { ir: { file: ast.file, name: componentName(ast.file), uses: ast.uses, props: ast.props, body: ast.body.map(node) }, diagnostics }
}

export function componentName(file?: string): string {
  const base = file?.split(/[\\/]/).pop()?.replace(/\..*$/, '') ?? ''
  const name = base.replace(/(^|[^A-Za-z0-9]+)([A-Za-z0-9])/g, (_, __, c: string) => c.toUpperCase())
  return /^[A-Z]/.test(name) ? name : `Terse${name}`
}
