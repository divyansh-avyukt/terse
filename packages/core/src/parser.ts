import type { Ast, Node, RefValue, Value } from './ast.js'
import { fail } from './errors.js'
import { lex, type Line, type Token } from './lexer.js'

const IDENT = /^[A-Za-z_$][\w$]*$/
const NAME = /^[A-Za-z][\w-]*$/

/** Parse source into an AST. Throws TerseError on the first syntax error. */
export function parse(src: string, file?: string): Ast {
  const ast: Ast = { file, uses: [], props: [], body: [] }
  // Each frame is a list that nodes at `level` get appended to.
  const stack: { level: number; children: Node[] }[] = [{ level: -1, children: ast.body }]
  const err = (msg: string, at: { line: number; col: number }): never => fail(msg, at, file)

  for (const ln of lex(src, file)) {
    const [head, ...rest] = ln.tokens
    const at = { line: ln.line, col: ln.level * 2 + 1 }
    while (stack[stack.length - 1].level >= ln.level) stack.pop()
    const parent = stack[stack.length - 1]
    if (ln.level > parent.level + 1) {
      err(`unexpected indentation — expected at most ${(parent.level + 1) * 2} spaces here`, at)
    }
    if (head.kind !== 'word') err(`expected a component name at the start of the line, found ${describe(head)}`, head)
    const keyword = head.kind === 'word' ? head.value : ''

    if (keyword === 'use' || keyword === 'props') {
      if (ln.level > 0) err(`'${keyword}' must be at the top level`, at)
      if (keyword === 'use') {
        const [name, from, path, extra] = rest
        if (name?.kind !== 'word' || !NAME.test(name.value) || from?.kind !== 'word' || from.value !== 'from' || path?.kind !== 'string' || extra) {
          err(`expected: use Name from "path"`, at)
        }
        const n = (name as Token & { value: string }).value
        if (!/^[A-Z]/.test(n)) err(`imported component '${n}' must start with a capital letter`, name)
        ast.uses.push({ name: n, from: (path as { value: string }).value, line: ln.line, col: name.col })
      } else {
        for (const t of rest) {
          if (t.kind !== 'word') err(`expected prop names after 'props', found ${describe(t)}`, t)
          let col = t.col
          for (const part of (t as { value: string }).value.split(',')) {
            if (part && !IDENT.test(part)) err(`invalid prop name '${part}'`, { line: t.line, col })
            if (part) ast.props.push({ name: part, line: t.line, col })
            col += part.length + 1
          }
        }
      }
      continue
    }

    let node: Node
    let children: Node[]
    if (keyword === 'else') {
      const prev = parent.children[parent.children.length - 1]
      if (prev?.type !== 'if' || prev.else) err(`'else' must directly follow an 'if' block at the same indentation`, at)
      if (rest.length) err(`'else' takes no arguments`, rest[0])
      children = (prev as { else?: Node[] }).else = []
      stack.push({ level: ln.level, children })
      continue
    } else if (keyword === 'each') {
      const [src, as, name, extra] = rest
      if (src?.kind !== 'ref' || as?.kind !== 'word' || as.value !== 'as' || name?.kind !== 'word' || !IDENT.test(name.value) || extra) {
        err(`expected: each @list as item`, at)
      }
      node = { type: 'each', source: ref(src as RefValue & Token), as: (name as { value: string }).value, children: [], ...at }
      children = node.children
    } else if (keyword === 'if') {
      const negate = rest[0]?.kind === 'word' && rest[0].value === 'not'
      const [cond, extra] = negate ? rest.slice(1) : rest
      if (cond?.kind !== 'ref' || extra) err(`expected: if @condition  (or: if not @condition)`, at)
      node = { type: 'if', cond: ref(cond as RefValue & Token), negate, then: [], ...at }
      children = node.then
    } else {
      if (!NAME.test(keyword)) err(`invalid component name '${keyword}'`, head)
      node = { type: 'element', name: keyword, args: [], attrs: [], children: [], ...at }
      for (const t of rest) {
        if (t.kind === 'attr') {
          if (node.attrs.some((a) => a.key === t.key)) err(`duplicate prop '${t.key}'`, t)
          node.attrs.push({ key: t.key, value: value(t.value), line: t.line, col: t.col })
        } else node.args.push(value(t))
      }
      children = node.children
    }
    parent.children.push(node)
    stack.push({ level: ln.level, children })
  }
  return ast
}

function ref(t: RefValue & Token): RefValue {
  return { kind: 'ref', path: t.path, line: t.line, col: t.col }
}

function value(t: Exclude<Token, { kind: 'attr' }>): Value {
  const at = { line: t.line, col: t.col }
  if (t.kind === 'ref') return ref(t)
  if (t.kind === 'string') return { kind: 'lit', value: t.value, ...at }
  const v = t.value
  if (v === 'true' || v === 'false') return { kind: 'lit', value: v === 'true', ...at }
  if (/^-?\d+(\.\d+)?$/.test(v)) return { kind: 'lit', value: Number(v), ...at }
  return { kind: 'lit', value: v, ...at }
}

function describe(t: Token | Line['tokens'][number]) {
  return t.kind === 'string' ? `string "${t.value}"` : t.kind === 'ref' ? `reference '@${t.path.join('.')}'` : t.kind === 'attr' ? `'${t.key}='` : `'${t.value}'`
}
