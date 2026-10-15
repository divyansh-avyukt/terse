import { TOKENS, type IR, type IRNode, type Loc, type StyleToken, type Value } from '@terse/core'
import { CHILDREN, type ComponentAdapter, type Jsx, type JsxChild, type RenderContext, type StyleAdapter } from './adapter.js'
import { lineMap, type SourceMap } from './sourcemap.js'

export interface EmitOptions {
  components: ComponentAdapter
  style: StyleAdapter
}

type Located = JsxChild & { loc?: Loc }

/** IR → TSX module source plus a line-level source map back to the .terse file. */
export function emit(ir: IR, source: string, opts: EmitOptions): { code: string; map: SourceMap } {
  const imports = new Map<string, Set<string>>()
  const use = (name: string, from: string) => {
    if (!imports.has(from)) imports.set(from, new Set())
    imports.get(from)!.add(name)
    return name
  }

  const ctx: RenderContext = {
    style: opts.style,
    use,
    expr,
    attr: (v) => (v === undefined ? undefined : v.kind === 'lit' && typeof v.value === 'string' && /^[^"&\\\n]*$/.test(v.value) ? `"${v.value}"` : `{${expr(v)}}`),
    child: (v) => (v === undefined ? undefined : v.kind === 'lit' ? text(String(v.value)) : `{${expr(v)}}`),
    lit: (v) => (v?.kind === 'lit' ? v.value : undefined),
    lookup: (v, table, fallback = '') => {
      if (v === undefined) return undefined
      if (v.kind === 'lit') {
        const hit = table[String(v.value)] ?? fallback
        return hit ? `"${hit}"` : undefined
      }
      return `{((${JSON.stringify(table)} as Record<string, string>)[${expr(v)}] ?? ${JSON.stringify(fallback)})}`
    },
    tokens: (node, defaults = {}) => {
      const out: Partial<Record<StyleToken, string>> = { ...defaults }
      for (const key of Object.keys(TOKENS) as StyleToken[]) {
        const v = node.props[key]
        if (v?.kind === 'lit') out[key] = String(v.value)
      }
      return out
    },
  }

  const lower = (nodes: IRNode[]): Located[] =>
    nodes.map((n): Located => {
      const loc = { line: n.line, col: n.col }
      if (n.kind === 'each') return { each: expr(n.source), as: n.as, body: lower(n.children), loc }
      if (n.kind === 'if') {
        const cond = expr(n.cond)
        return { cond: n.negate ? `!${cond}` : cond, then: lower(n.then), else: n.else && lower(n.else), loc }
      }
      const children = lower(n.children)
      const jsx: Jsx = n.builtin
        ? opts.components.render(n, ctx)
        : { tag: n.name, props: Object.fromEntries(Object.entries(n.props).map(([k, v]) => [k, ctx.attr(v)])), children: [CHILDREN] }
      return { ...fill(jsx, children, n.children), loc }
    })

  const body = lower(ir.body)
  const lines: { text: string; loc?: Loc }[] = []
  let fragmentNeeded = false
  const only = body.length === 1 ? body[0] : undefined
  print(only && typeof only === 'object' && 'tag' in only ? only : { tag: '', children: body }, 2, undefined, 0)

  function print(c: Located, depth: number, loc: Loc | undefined, eachDepth: number) {
    loc = c.loc ?? loc
    const pad = '  '.repeat(depth)
    const out = (text: string) => lines.push({ text: pad + text, loc })
    if (typeof c === 'string') return out(c)
    if (c === CHILDREN || 'pick' in c) return
    if ('each' in c) {
      const i = eachDepth ? `i${eachDepth + 1}` : 'i'
      const body = c.body.length === 1 && isJsx(c.body[0]) ? withKey(c.body[0], i) : { tag: 'Fragment', props: { key: `{${i}}` }, children: c.body }
      if (body.tag === 'Fragment') fragmentNeeded = true
      out(`{${c.each}?.map((${c.as}: any, ${i}: number) => (`)
      print(body, depth + 1, loc, eachDepth + 1)
      return out('))}')
    }
    if ('cond' in c) {
      const branch = (b: Located[] | undefined) => (b?.length === 1 && isJsx(b[0]) ? b[0] : { tag: '', children: b ?? [] })
      out(`{${c.cond} ? (`)
      if (c.then.length) print(branch(c.then), depth + 1, loc, eachDepth)
      else lines.push({ text: pad + '  null', loc })
      if (c.else?.length) {
        out(') : (')
        print(branch(c.else), depth + 1, loc, eachDepth)
        return out(')}')
      }
      return out(') : null}')
    }
    const attrs = Object.entries(c.props ?? {})
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => ` ${k}=${v}`)
      .join('')
    const kids = (c.children ?? []).filter((k) => k !== CHILDREN) as Located[]
    if (!kids.length) return out(c.tag ? `<${c.tag}${attrs} />` : 'null')
    const open = `<${c.tag}${attrs}>`
    const close = `</${c.tag}>`
    if (kids.every((k) => typeof k === 'string')) {
      const inline = `${open}${(kids as string[]).join('')}${close}`
      if (pad.length + inline.length <= 100) return out(inline)
    }
    out(open)
    for (const k of kids) print(k, depth + 1, loc, eachDepth)
    out(close)
  }

  if (fragmentNeeded) use('Fragment', 'react')
  const header: string[] = []
  for (const [from, names] of imports) header.push(`import { ${[...names].sort().join(', ')} } from ${JSON.stringify(from)}`)
  for (const u of ir.uses) header.push(`import ${u.name} from ${JSON.stringify(u.from)}`)
  const propNames = ir.props.map((p) => p.name)
  // The file name must not shadow an import (input.terse vs shadcn's Input).
  const taken = new Set([...ir.uses.map((u) => u.name), ...[...imports.values()].flatMap((n) => [...n])])
  const name = taken.has(ir.name) ? `${ir.name}View` : ir.name
  header.push('')
  if (propNames.length) {
    header.push(`export interface ${name}Props {`, ...propNames.map((p) => `  ${p}?: any`), '}', '')
    header.push(`export default function ${name}({ ${propNames.join(', ')} }: ${name}Props) {`)
  } else header.push(`export default function ${name}() {`)
  header.push('  return (')

  const all = [...header.map((text) => ({ text, loc: undefined })), ...lines, { text: '  )', loc: undefined }, { text: '}', loc: undefined }]
  const map = lineMap(all.map((l) => l.loc), ir.file ?? 'input.terse', source)
  return { code: all.map((l) => l.text).join('\n') + '\n', map }
}

/** Replace the CHILDREN and pick() placeholders (anywhere in the adapter's tree) with the node's children,
 *  flattening nested fragments. */
function fill(jsx: Jsx, children: Located[], ir: IRNode[]): Jsx {
  const out = jsx.children?.flatMap((c): JsxChild[] => {
    if (c === CHILDREN) return children
    if (typeof c === 'object' && 'pick' in c) return children.filter((_, i) => c.pick(ir[i]))
    return typeof c === 'object' && 'tag' in c ? [fill(c, children, ir)] : [c]
  })
  return { ...jsx, children: out?.flatMap((c) => (typeof c === 'object' && 'tag' in c && c.tag === '' ? (c.children ?? []) : [c])) }
}

const isJsx = (c: Located): c is Jsx & { loc?: Loc } => typeof c === 'object' && 'tag' in c && c.tag !== ''
const withKey = (j: Jsx, i: string): Jsx => ({ ...j, props: { key: `{${i}}`, ...j.props } })

function expr(v: Value): string {
  if (v.kind === 'lit') return JSON.stringify(v.value)
  const [root, ...rest] = v.path
  return root + rest.map((p) => `?.${p}`).join('')
}

/** JSX text, falling back to a string expression when it has characters JSX would interpret. */
function text(s: string): string {
  return /^[^{}<>&\n]*$/.test(s) && s.trim() === s && s !== '' ? s : `{${JSON.stringify(s)}}`
}
