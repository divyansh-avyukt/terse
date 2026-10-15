import { describe, expect, it } from 'vitest'
import { analyze, parse, TerseError } from '../src/index.js'

const DASHBOARD = `use UserAvatar from "@/components/UserAvatar"
props user, stats, orders, onRefresh

page "Dashboard"
  row gap=md
    stat "Revenue" @stats.revenue delta=@stats.delta
    stat "Orders" @stats.count
  card "Recent orders"
    table @orders cols=id,customer,total
  row justify=between
    UserAvatar user=@user size=sm
    button "Refresh" variant=outline on=@onRefresh
`

/** Expect analyze() to throw a TerseError at line:col whose message matches. */
function expectError(src: string, message: RegExp | string, line: number, col: number) {
  try {
    analyze(src, 'test.terse')
  } catch (e) {
    expect(e).toBeInstanceOf(TerseError)
    const err = e as TerseError
    expect(err.message).toMatch(message)
    expect([err.line, err.col]).toEqual([line, col])
    return err
  }
  throw new Error('expected a compile error')
}

describe('parser: valid files', () => {
  it('parses the spec example', () => {
    const ast = parse(DASHBOARD, 'dashboard.terse')
    expect(ast.uses).toEqual([{ name: 'UserAvatar', from: '@/components/UserAvatar', line: 1, col: 5 }])
    expect(ast.props.map((p) => p.name)).toEqual(['user', 'stats', 'orders', 'onRefresh'])
    const page = ast.body[0]
    expect(page).toMatchObject({ type: 'element', name: 'page', args: [{ kind: 'lit', value: 'Dashboard' }] })
    expect(page.type === 'element' && page.children.map((c) => c.type === 'element' && c.name)).toEqual(['row', 'card', 'row'])
  })

  it('analyze resolves positional args and names the component from the file', () => {
    const ir = analyze(DASHBOARD, '/src/pages/sales-dashboard.terse')
    expect(ir.name).toBe('SalesDashboard')
    const stat = (ir.body[0] as any).children[0].children[0]
    expect(stat.props.label).toMatchObject({ kind: 'lit', value: 'Revenue' })
    expect(stat.props.value).toMatchObject({ kind: 'ref', path: ['stats', 'revenue'] })
    expect(stat.props.delta).toMatchObject({ kind: 'ref', path: ['stats', 'delta'] })
  })

  it('parses values: strings with escapes, numbers, booleans, refs, lists', () => {
    const ast = parse(`text "say \\"hi\\"" x=12 y=true z=a,b w='single q'`)
    const el = ast.body[0] as any
    expect(el.args[0].value).toBe('say "hi"')
    expect(el.attrs.map((a: any) => a.value.value)).toEqual([12, true, 'a,b', 'single q'])
  })

  it('parses each, if/else, if not, comments and blank lines', () => {
    const ast = parse(`props items, loading
# a comment

col
  if @loading   # trailing comment
    text "Loading…"
  else
    each @items as item
      text @item.name
  if not @items
    text "Empty"
`)
    const col = ast.body[0] as any
    expect(col.children[0]).toMatchObject({ type: 'if', negate: false, cond: { path: ['loading'] } })
    expect(col.children[0].else[0]).toMatchObject({ type: 'each', as: 'item', source: { path: ['items'] } })
    expect(col.children[1]).toMatchObject({ type: 'if', negate: true })
  })

  it('allows dedenting several levels at once', () => {
    const ast = parse(`col\n  card\n    row\n      text "a"\ntext "b"`)
    expect(ast.body.map((n: any) => n.name)).toEqual(['col', 'text'])
  })
})

describe('parser: indentation errors', () => {
  it('rejects odd indentation', () => expectError('col\n   text "x"', 'multiple of 2 spaces (found 3)', 2, 4))
  it('rejects tabs', () => expectError('col\n\ttext "x"', 'tabs are not allowed', 2, 1))
  it('rejects jumping more than one level', () => expectError('col\n    text "x"', 'expected at most 2 spaces', 2, 5))
  it('rejects indented first line', () => expectError('  col', 'expected at most 0 spaces', 1, 3))
  it('rejects else without if', () => expectError('col\n  else', "'else' must directly follow an 'if'", 2, 3))
})

describe('parser: syntax errors', () => {
  it('unterminated string', () => expectError('text "oops', 'unterminated string', 1, 6))
  it('line starting with a string', () => expectError('"hello"', 'expected a component name', 1, 1))
  it('bad each', () => expectError('props xs\neach @xs item', 'expected: each @list as item', 2, 1))
  it('bad use', () => expectError('use Foo "x"', 'expected: use Name from "path"', 1, 1))
  it('missing value', () => expectError('button "x" on=', "missing value for 'on='", 1, 12))
  it('duplicate prop', () => expectError('text "a" tone=muted tone=primary', "duplicate prop 'tone'", 1, 21))
})

describe('unknown components', () => {
  it('suggests the closest builtin', () => expectError('buton "Save"', "unknown component 'buton' — did you mean 'button'?", 1, 1))
  it('suggests importing user components', () => expectError('Avatar', 'import it with: use Avatar from', 1, 1))
  it('suggests a close imported name', () =>
    expectError('use UserAvatar from "./a"\nUserAvtar', "did you mean 'UserAvatar'?", 2, 1))
})

describe('bad props', () => {
  it('unknown prop with suggestion', () => expectError('text "a" tonee=muted', "unknown prop 'tonee' on 'text' — did you mean 'tone'?", 1, 10))
  it('invalid enum value', () => expectError('row gap=huge', "invalid value \"huge\" for 'gap' on 'row' — expected none|xs|sm|md|lg|xl", 1, 9))
  it('style tokens must be literal', () => expectError('props g\nrow gap=@g', 'must be a literal', 2, 9))
  it('handlers must be refs', () => expectError('button "Go" on=save', "'on' on 'button' must be a reference like @onSave", 1, 16))
  it('too many positional args', () => expectError('button "a" "b"', "'button' takes 1 positional argument (label), got 2", 1, 12))
  it('missing required prop', () => expectError('table', "'table' requires 'rows'", 1, 1))
  it('children on a leaf', () => expectError('text "a"\n  text "b"', "'text' cannot have children", 2, 3))
  it('reports every error, first as the message', () => {
    const err = expectError('buton "a"\ntext "b" tonee=x', /unknown component/, 1, 1)
    expect(err.diagnostics).toHaveLength(2)
  })
})
