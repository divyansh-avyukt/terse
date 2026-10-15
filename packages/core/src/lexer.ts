import { fail, type Loc } from './errors.js'

export type Token =
  | ({ kind: 'word'; value: string } & Loc)
  | ({ kind: 'string'; value: string } & Loc)
  | ({ kind: 'ref'; path: string[] } & Loc)
  | ({ kind: 'attr'; key: string; value: Exclude<Token, { kind: 'attr' }> } & Loc)

export interface Line {
  level: number // indentation level (2 spaces each)
  line: number
  tokens: Token[]
}

const IDENT = /^[A-Za-z_$][\w$]*$/

/** Split source into non-blank lines of tokens. `#` starts a comment at a token boundary. */
export function lex(src: string, file?: string): Line[] {
  const out: Line[] = []
  src.split(/\r?\n/).forEach((text, i) => {
    const line = i + 1
    const indent = /^[ \t]*/.exec(text)![0]
    const rest = text.slice(indent.length)
    if (rest === '' || rest.startsWith('#')) return
    if (indent.includes('\t')) fail('tabs are not allowed for indentation; use 2 spaces', { line, col: indent.indexOf('\t') + 1 }, file)
    if (indent.length % 2) fail(`indentation must be a multiple of 2 spaces (found ${indent.length})`, { line, col: indent.length + 1 }, file)
    out.push({ level: indent.length / 2, line, tokens: tokenize(text, indent.length, line, file) })
  })
  return out
}

function tokenize(text: string, start: number, line: number, file?: string): Token[] {
  const tokens: Token[] = []
  let p = start
  while (p < text.length) {
    if (text[p] === ' ' || text[p] === '\t') { p++; continue }
    if (text[p] === '#') break
    const col = p + 1
    const key = /^([A-Za-z_][\w-]*)=/.exec(text.slice(p))
    if (key) {
      p += key[0].length
      if (p >= text.length || text[p] === ' ') fail(`missing value for '${key[1]}='`, { line, col }, file)
      const [value, next] = readValue(text, p, line, file)
      tokens.push({ kind: 'attr', key: key[1], value, line, col })
      p = next
    } else {
      const [value, next] = readValue(text, p, line, file)
      tokens.push(value)
      p = next
    }
  }
  return tokens
}

function readValue(text: string, p: number, line: number, file?: string): [Exclude<Token, { kind: 'attr' }>, number] {
  const col = p + 1
  const q = text[p]
  if (q === '"' || q === "'") {
    let value = ''
    for (let i = p + 1; i < text.length; i++) {
      const c = text[i]
      if (c === q) return [{ kind: 'string', value, line, col }, i + 1]
      if (c === '\\' && i + 1 < text.length) {
        const n = text[++i]
        value += n === 'n' ? '\n' : n === 't' ? '\t' : n
      } else value += c
    }
    fail('unterminated string', { line, col }, file)
  }
  let end = p
  while (end < text.length && text[end] !== ' ' && text[end] !== '\t') end++
  const raw = text.slice(p, end)
  if (raw.startsWith('@')) {
    const path = raw.slice(1).split('.')
    if (!path.every((s) => IDENT.test(s))) fail(`invalid reference '${raw}' — expected @name or @name.path`, { line, col }, file)
    return [{ kind: 'ref', path, line, col }, end]
  }
  return [{ kind: 'word', value: raw, line, col }, end]
}
