/** Inline markup inside text literals: **strong**, *em*, `code`, [label](href). No nesting. */
export type Inline =
  | { kind: 'text' | 'strong' | 'em' | 'code'; text: string }
  | { kind: 'link'; text: string; href: string }

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((\S+?)\)/g

export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of s.matchAll(INLINE)) {
    if (m.index > last) out.push({ kind: 'text', text: s.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ kind: 'strong', text: m[1] })
    else if (m[2] !== undefined) out.push({ kind: 'em', text: m[2] })
    else if (m[3] !== undefined) out.push({ kind: 'code', text: m[3] })
    else out.push({ kind: 'link', text: m[4], href: m[5] })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ kind: 'text', text: s.slice(last) })
  return out
}
