import { describe, expect, it } from 'vitest'
import { analyze, parse, TerseError } from '../src/index.js'

function expectError(src: string, message: RegExp | string, line: number, col: number) {
  try {
    analyze(src, 't.terse')
  } catch (e) {
    expect(e).toBeInstanceOf(TerseError)
    const err = e as TerseError
    expect(err.message).toMatch(message)
    expect([err.line, err.col]).toEqual([line, col])
    return
  }
  throw new Error('expected a compile error')
}

describe('handler arguments', () => {
  it('parses @refs and literals, with or without spaces', () => {
    const el = parse('props move\nbutton "x" on=@move(@task.id, 1, "a b", true, done)').body[0] as any
    const on = el.attrs[0].value
    expect(on.path).toEqual(['move'])
    expect(on.args.map((a: any) => (a.kind === 'ref' ? '@' + a.path.join('.') : a.value))).toEqual(['@task.id', 1, 'a b', true, 'done'])
    expect((parse('button "x" on=@go()').body[0] as any).attrs[0].value.args).toEqual([])
  })

  it('checks references inside arguments', () =>
    expectError('props move\nbutton "x" on=@move(@tsk.id)', "unknown reference '@tsk.id' — declare it with: props tsk", 2, 21))

  it('only allows arguments on handlers', () =>
    expectError('props fmt, x\ntext @fmt(@x)', "'text' on 'text' isn't a handler, so it can't take arguments", 2, 6))

  it('rejects calls inside arguments', () => expectError('button "x" on=@a(@b(1))', "arguments can't contain calls", 1, 20))
  it('rejects an unclosed (', () => expectError('button "x" on=@a(@b, 1', "unclosed '('", 1, 17))
  it('rejects empty arguments', () => expectError('button "x" on=@a(1,,2)', 'empty argument', 1, 20))
  it('is not allowed on each sources', () => expectError('props xs\neach @xs(1) as x\n  text "a"', 'expected: each @list as item', 2, 1))
})

describe('each key=', () => {
  it('parses a field path', () => {
    const each = parse('props xs\neach @xs as x key=meta.id\n  text "a"').body[0] as any
    expect(each.key).toEqual(['meta', 'id'])
  })
  it('rejects anything but key=field', () => expectError('props xs\neach @xs as x id=1\n  text "a"', 'expected key=field', 2, 15))
})

describe('named imports', () => {
  it('parses use { A, B } from "x", with or without inner spaces', () => {
    expect(parse('use { A, B } from "x"').uses.map((u) => [u.name, u.named])).toEqual([['A', true], ['B', true]])
    expect(parse('use {A,B} from "x"').uses.map((u) => u.name)).toEqual(['A', 'B'])
    expect(parse('use A from "x"').uses[0].named).toBeUndefined()
  })
  it('requires capitalized names', () => expectError('use { a } from "x"', "imported component 'a' must start with a capital letter", 1, 5))
  it('rejects a malformed use', () => expectError('use A B from "x"', 'expected: use Name from "path"', 1, 1))
})

describe('button variant', () => {
  it('still rejects unknown literal variants', () => expectError('button "x" variant=outlined', "invalid value \"outlined\" for 'variant' on 'button' — did you mean 'outline'?", 1, 20))
})
