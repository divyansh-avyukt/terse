import { analyze } from '@terseui/core'
import { emit, type EmitOptions } from './emit.js'

export * from './adapter.js'
export { emit, type EmitOptions } from './emit.js'
export type { SourceMap } from './sourcemap.js'

export interface CompileOptions extends EmitOptions {
  file?: string
}

/** Compile .terse source to a TSX module. Throws TerseError on invalid input. */
export function compile(src: string, opts: CompileOptions) {
  return emit(analyze(src, opts.file), src, opts)
}
