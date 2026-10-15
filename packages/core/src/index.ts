import type { Diagnostic } from './errors.js'
import { TerseError } from './errors.js'
import { lower, type IR } from './ir.js'
import { parse } from './parser.js'
import { validate } from './validator.js'

export * from './ast.js'
export * from './errors.js'
export * from './ir.js'
export * from './inline.js'
export { lex } from './lexer.js'
export { parse } from './parser.js'
export * from './schema.js'
export { validate } from './validator.js'

/** parse → lower → validate. Throws a TerseError carrying every diagnostic, first one as the message. */
export function analyze(src: string, file?: string): IR {
  const { ir, diagnostics } = lower(parse(src, file))
  const all: Diagnostic[] = [...diagnostics, ...validate(ir)].sort((a, b) => a.line - b.line || a.col - b.col)
  if (all.length) {
    const [first] = all
    const more = all.length > 1 ? `\n${all.slice(1).map((d) => `  ${d.line}:${d.col} ${d.message}`).join('\n')}` : ''
    throw new TerseError(first.message + more, first.line, first.col, file, all)
  }
  return ir
}
