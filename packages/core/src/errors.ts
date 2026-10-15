export interface Loc {
  line: number // 1-based
  col: number // 1-based
}

export interface Diagnostic extends Loc {
  message: string
}

/** A compile error with a precise location. `diagnostics` holds every error found, first one is `this`. */
export class TerseError extends Error {
  constructor(
    message: string,
    public line: number,
    public col: number,
    public file?: string,
    public diagnostics: Diagnostic[] = [{ message, line, col }],
  ) {
    super(message)
    this.name = 'TerseError'
  }

  toString() {
    return `${this.file ?? '<terse>'}:${this.line}:${this.col}: ${this.message}`
  }
}

export function fail(message: string, loc: Loc, file?: string): never {
  throw new TerseError(message, loc.line, loc.col, file)
}

/** Closest candidate within edit distance 2, for "did you mean" hints. */
export function suggest(word: string, candidates: Iterable<string>): string | undefined {
  let best: string | undefined
  let bestD = Math.min(3, Math.ceil(word.length / 2) + 1)
  for (const c of candidates) {
    const d = distance(word.toLowerCase(), c.toLowerCase())
    if (d < bestD) [best, bestD] = [c, d]
  }
  return best
}

export const didYouMean = (word: string, candidates: Iterable<string>, prefix = '') => {
  const s = suggest(word, candidates)
  return s ? ` — did you mean '${prefix}${s}'?` : ''
}

function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}
