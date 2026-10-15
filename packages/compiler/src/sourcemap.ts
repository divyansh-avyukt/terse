const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function vlq(n: number): string {
  let v = n < 0 ? (-n << 1) | 1 : n << 1
  let s = ''
  do {
    let digit = v & 31
    v >>>= 5
    if (v) digit |= 32
    s += B64[digit]
  } while (v)
  return s
}

export interface SourceMap {
  version: 3
  file?: string
  sources: string[]
  sourcesContent: string[]
  names: string[]
  mappings: string
}

/** Line-level source map: generated line i maps to source position locs[i] (1-based), or nothing. */
export function lineMap(locs: ({ line: number; col: number } | undefined)[], source: string, content: string): SourceMap {
  let prevLine = 0
  let prevCol = 0
  const mappings = locs
    .map((loc) => {
      if (!loc) return ''
      // generated col 0, source index 0, then source line/col deltas
      const seg = 'AA' + vlq(loc.line - 1 - prevLine) + vlq(loc.col - 1 - prevCol)
      prevLine = loc.line - 1
      prevCol = loc.col - 1
      return seg
    })
    .join(';')
  return { version: 3, sources: [source], sourcesContent: [content], names: [], mappings }
}
