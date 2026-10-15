import { describe, expect, it } from 'vitest'
import { analyze, lower, parse, validate } from '../src/index.js'

const check = (src: string) => validate(lower(parse(src)).ir).map((d) => d.message)

describe('validator: prop references', () => {
  it('accepts declared props and loop variables', () => {
    expect(check(`props orders, onOpen\ncol\n  each @orders as o\n    text @o.customer\n    button "Open" on=@onOpen`)).toEqual([])
  })

  it('rejects references not declared in props', () => {
    expect(check(`props stats\ntext @revenue`)).toEqual(["unknown reference '@revenue' — declare it with: props revenue"])
  })

  it('suggests a close declared name', () => {
    expect(check(`props stats\ntext @stat.revenue`)).toEqual(["unknown reference '@stat.revenue' — did you mean '@stats'?"])
  })

  it('checks refs in handlers, each sources, if conditions and user component props', () => {
    const msgs = check(`use A from "./a"\ncol\n  button "x" on=@onSave\n  each @rows as r\n    text "x"\n  if @busy\n    text "x"\n  A x=@y`)
    expect(msgs.map((m) => m.match(/'@(\w+)'/)![1])).toEqual(['onSave', 'rows', 'busy', 'y'])
  })

  it('loop variables are scoped to their block', () => {
    expect(check(`props xs\ncol\n  each @xs as x\n    text @x\n  text @x`)).toEqual(["unknown reference '@x' — did you mean '@xs'?"])
  })

  it('analyze throws with file:line:col', () => {
    expect(() => analyze('props a\ntext @b', 'v.terse')).toThrow(expect.objectContaining({ line: 2, col: 6, file: 'v.terse' }))
  })
})
