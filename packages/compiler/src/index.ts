import { analyze } from '@terseui/core'
import { emit, type EmitOptions } from './emit.js'
import { declarations } from './types.js'

export * from './adapter.js'
export { emit, type EmitOptions } from './emit.js'
export type { SourceMap } from './sourcemap.js'
export { declarations } from './types.js'

export interface CompileOptions extends EmitOptions {
  file?: string
}

/** Compile .terse source to a TSX module, plus its `.d.terse.ts` declaration (`dts`). Throws TerseError on invalid input. */
export function compile(src: string, opts: CompileOptions) {
  const ir = analyze(src, opts.file)
  return { ...emit(ir, src, opts), dts: declarations(ir) }
}
