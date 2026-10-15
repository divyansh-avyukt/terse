import { COMPONENTS, UNIVERSAL_PROPS, expandList, type IR, type IRNode, type RefValue, type Value } from '@terseui/core'

// Prop types inferred from how a view uses its props, for `X.d.terse.ts` declarations: `@task.title`
// makes `task` an object with `title`, `each @tasks` makes an array, `on=@x` a function, `tone=@t` a
// union of tones. Every prop and field is optional (containers pass undefined while loading), so the
// value is catching typos and wrong shapes, not missing data.

// `req`: an `each` item. Its fields are required keys, so an item built without a field the view reads (a typo
// like isfirst for isFirst) is a type error. Other objects (error maps, drafts, lookups) are partial by nature.
type Ty = (
  | { k: 'unknown' }
  | { k: 'any' }
  | { k: 'fn' }
  | { k: 'leaf'; t: Set<string> }
  | { k: 'obj'; f: Map<string, Ty> }
  | { k: 'arr'; item: Ty }
) & { req?: boolean }

const unknown = (): Ty => ({ k: 'unknown' })
// Rendered text. ReactNode (not string | number) so null from real API data isn't a false error.
const TEXT = ['ReactNode']
const KEY = ['string', 'number']

/** Turn `node` into `kind` in place, or into `any` when two uses disagree. */
function become(node: Ty, kind: 'obj' | 'arr' | 'fn'): Ty {
  if (node.k === kind || node.k === 'any') return node
  if (node.k === 'unknown') Object.assign(node, kind === 'obj' ? { k: 'obj', f: new Map() } : kind === 'arr' ? { k: 'arr', item: unknown() } : { k: 'fn' })
  // `if @orders.length` before `each @orders`: an object holding only `length` is really an array.
  else if (kind === 'arr' && node.k === 'obj' && [...node.f.keys()].every((k) => k === 'length')) Object.assign(node, { k: 'arr', item: unknown(), f: undefined })
  else Object.assign(node, { k: 'any' })
  return node
}

function leaf(node: Ty, types: string[]) {
  if (node.k === 'unknown') Object.assign(node, { k: 'leaf', t: new Set(types) })
  else if (node.k === 'leaf') types.forEach((t) => node.t.add(t))
  else if (node.k !== 'any') Object.assign(node, { k: 'any' })
}

// A required key may still hold null/undefined (API data, loading). Function types need parentheses in a union.
const nullable = (t: string) => (/^(unknown|any|ReactNode)$/.test(t) ? t : `${t.includes('=>') ? `(${t})` : t} | null | undefined`)

function print(t: Ty, indent = ''): string {
  switch (t.k) {
    case 'unknown': return 'unknown'
    case 'any': return 'any'
    case 'fn': return '(...args: any[]) => void'
    case 'leaf': return [...t.t].join(' | ')
    case 'arr': {
      const item = print(t.item, indent)
      return /^[\w.]+$/.test(item) ? `${item}[]` : `Array<${item}>`
    }
    case 'obj': {
      if (!t.f.size) return 'Record<string, unknown>'
      const inner = indent + '  '
      const name = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k))
      const fields = [...t.f].map(([k, v]) => `${inner}${name(k)}${t.req ? `: ${nullable(print(v, inner))}` : `?: ${print(v, inner)}`}`)
      return `{\n${fields.join('\n')}\n${indent}}`
    }
  }
}

/** The `X.d.terse.ts` declaration for a view: its props interface and a typed default export. */
export function declarations(ir: IR): string {
  const props = new Map(ir.props.map((p) => [p.name, unknown()]))

  const resolve = (r: RefValue, scope: Map<string, Ty>): Ty => {
    let node = scope.get(r.path[0]) ?? unknown()
    for (const seg of r.path.slice(1)) {
      if (node.k === 'arr' && seg === 'length') return { k: 'leaf', t: new Set(['number']) }
      if (node.k === 'any') return node
      const obj = become(node, 'obj')
      if (obj.k !== 'obj') return obj
      if (!obj.f.has(seg)) obj.f.set(seg, unknown())
      node = obj.f.get(seg)!
    }
    return node
  }

  const useValue = (comp: string, builtin: boolean, key: string, v: Value, scope: Map<string, Ty>, cols?: string) => {
    if (v.kind !== 'ref') return
    for (const a of v.args ?? []) if (a.kind === 'ref') resolve(a, scope)
    const node = resolve(v, scope)
    if (v.args) return void become(node, 'fn')
    if (!builtin) return // your own components: props pass through untyped
    const type = COMPONENTS[comp]?.props[key] ?? UNIVERSAL_PROPS[key]
    // Token unions keep editor autocomplete, plus (string & {}) so `tone: 'success'` in a plain object
    // literal (which TypeScript widens to string) isn't a false error; unknown tones fall back at runtime.
    if (Array.isArray(type)) return leaf(node, [...type.map((x) => JSON.stringify(x)), '(string & {})'])
    if (type === 'text') return leaf(node, TEXT)
    if (type === 'bool') return leaf(node, ['boolean'])
    if (type === 'handler') return void become(node, 'fn')
    if (type === 'numbers') return leaf(node, ['number[]'])
    if (type === 'items') return leaf(node, comp === 'select' ? ['Array<string | { value: string; label?: string }>'] : ['Array<string | number>'])
    if (type === 'ref' && comp === 'slot') return leaf(node, ['ReactNode'])
    if (type === 'ref' && comp === 'table') {
      // `table @rows cols=id,total`: an array of objects with those fields.
      const list = become(node, 'arr')
      const row = list.k === 'arr' ? become(list.item, 'obj') : list
      if (row.k !== 'obj') return
      for (const c of cols ? expandList(cols) : []) {
        if (!row.f.has(c)) row.f.set(c, unknown())
        leaf(row.f.get(c)!, TEXT)
      }
    }
  }

  const walk = (nodes: IRNode[], scope: Map<string, Ty>) => {
    for (const n of nodes) {
      if (n.kind === 'each') {
        const list = become(resolve(n.source, scope), 'arr')
        const item = list.k === 'arr' ? list.item : unknown()
        item.req = true
        if (n.key) leaf(resolve({ ...n.source, path: ['__item', ...n.key] }, new Map([['__item', item]])), KEY)
        walk(n.children, new Map(scope).set(n.as, item))
      } else if (n.kind === 'if') {
        resolve(n.cond, scope)
        walk(n.then, scope)
        if (n.else) walk(n.else, scope)
      } else {
        const cols = n.props.cols?.kind === 'lit' ? String(n.props.cols.value) : undefined
        for (const [key, v] of Object.entries(n.props)) useValue(n.name, n.builtin, key, v, scope, cols)
        walk(n.children, scope)
      }
    }
  }
  walk(ir.body, props)

  const body = [...props].map(([name, t]) => `  ${name}?: ${print(t, '  ')}`).join('\n')
  const usesNode = body.includes('ReactNode')
  return [
    `// Generated by Terse from ${ir.file?.split(/[\\/]/).pop() ?? 'a .terse file'}. Do not edit.`,
    `import type { ComponentType${usesNode ? ', ReactNode' : ''} } from 'react'`,
    '',
    `export interface ${ir.name}Props {`,
    ...(body ? [body] : []),
    '}',
    '',
    `declare const ${ir.name}: ComponentType<${ir.name}Props>`,
    `export default ${ir.name}`,
    '',
  ].join('\n')
}
