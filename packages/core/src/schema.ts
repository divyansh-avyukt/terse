/**
 * The v0 component vocabulary. Language-level only (no React): which positional
 * args and props each component takes. Adapters decide how they render.
 */

/** 'text': literal or @ref. 'ref': @ref only. 'handler': @ref to a function prop. 'bool': true/false or @ref.
 *  'literal': any literal, not a @ref. 'list': comma-separated literal (a,b,c), ranges allowed (Mon..Fri, 1..5).
 *  'numbers': a list of numbers. string[]: literal from a fixed set (style tokens). */
export type PropType = 'text' | 'ref' | 'handler' | 'bool' | 'literal' | 'list' | 'numbers' | readonly string[]

export interface ComponentSpec {
  args: readonly string[] // positional args fill these props, in order
  props: Record<string, PropType>
  required?: readonly string[]
  children?: boolean | string // a string: only that component, as direct children
  parent?: string // must sit inside this component (through each/if)
}

const SPACE = ['none', 'xs', 'sm', 'md', 'lg', 'xl']

/** Shared layout/style tokens. Values must be literals so styles resolve at compile time. */
export const TOKENS = {
  gap: SPACE,
  pad: SPACE,
  align: ['start', 'center', 'end', 'stretch'],
  justify: ['start', 'center', 'end', 'between', 'around'],
  // 'a,b': a columns below md, b from md up
  cols: ['1', '2', '3', '4', '5', '6', '12', '1,2', '1,3', '1,4', '2,3', '2,4', '2,6', '3,6'],
  tone: ['default', 'muted', 'primary', 'destructive'],
  size: ['sm', 'md', 'lg'],
  wrap: ['true', 'false'],
} as const satisfies Record<string, readonly string[]>

export type StyleToken = keyof typeof TOKENS
const { gap, pad, align, justify, cols, tone, size, wrap } = TOKENS

export const COMPONENTS: Record<string, ComponentSpec> = {
  page: { args: ['title'], props: { title: 'text', gap, pad, size }, children: true },
  section: { args: ['title'], props: { title: 'text', gap, pad }, children: true },
  row: { args: [], props: { gap, pad, align, justify, wrap }, children: true },
  col: { args: [], props: { gap, pad, align, justify, size }, children: true }, // size: max width
  grid: { args: [], props: { cols, gap, pad }, children: true },
  card: { args: ['title'], props: { title: 'text', description: 'text', gap, pad, tone: ['default', 'transparent'] }, children: true },
  heading: { args: ['text'], props: { text: 'text', level: ['1', '2', '3', '4'], size: [...size, 'xl'], tone, align }, required: ['text'] },
  text: { args: ['text'], props: { text: 'text', size: [...size, 'xl'], tone, align }, required: ['text'] },
  button: {
    args: ['label'],
    props: {
      label: 'text',
      variant: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
      size,
      on: 'handler',
      href: 'text', // renders a link styled as a button
      disabled: 'bool',
      type: ['button', 'submit'],
    },
    required: ['label'],
  },
  input: {
    args: ['label'],
    props: {
      label: 'text',
      placeholder: 'text',
      type: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date'],
      value: 'text',
      name: 'text',
      on: 'handler',
      disabled: 'bool',
    },
  },
  badge: { args: ['text'], props: { text: 'text', tone }, required: ['text'] },
  stat: {
    args: ['label', 'value'],
    props: { label: 'text', value: 'text', delta: 'text', tone, icon: 'literal', align },
    required: ['label', 'value'],
  },
  icon: { args: ['name'], props: { name: 'literal', size }, required: ['name'] },
  callout: { args: ['title', 'description'], props: { title: 'text', description: 'text', icon: 'literal' }, required: ['title'] },
  list: { args: [], props: {}, children: true },
  item: { args: ['label', 'value'], props: { label: 'text', value: 'text' }, required: ['label'], parent: 'list' },
  chart: {
    args: ['type'],
    props: {
      type: ['bar', 'area'],
      x: 'list',
      xlabel: 'text',
      ylabel: 'text',
      size,
      curve: ['linear', 'monotone', 'natural'],
      tooltip: wrap,
      legend: wrap,
    },
    required: ['type', 'x'],
    children: 'series',
  },
  series: { args: ['label', 'values'], props: { label: 'text', values: 'numbers' }, required: ['label', 'values'], parent: 'chart' },
  table: { args: ['rows'], props: { rows: 'ref', cols: 'list', headers: 'list' }, required: ['rows', 'cols'] },
  image: { args: ['src'], props: { src: 'text', alt: 'text', size }, required: ['src'] },
  link: { args: ['label', 'href'], props: { label: 'text', href: 'text', tone }, required: ['label', 'href'] },
  separator: { args: [], props: {} },
  // Full-bleed horizontal band (landing pages): background across the viewport, content centered at `size`.
  band: {
    args: [],
    props: { id: 'literal', tone: ['default', 'muted', 'inverse', 'primary'], pad, gap, size, align },
    children: true,
  },
  code: { args: ['source'], props: { source: 'text', lang: 'literal', title: 'text' }, required: ['source'] },
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Split a list literal, expanding ranges: weekdays wrap (Thu..Wed), integers count up or down (1..5).
 *  Throws on a range it can't expand. */
export function expandList(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean).flatMap((item) => {
    const m = /^(\w+)\.\.(\w+)$/.exec(item)
    if (!m) return [item]
    const [a, b] = [m[1], m[2]]
    if (/^-?\d+$/.test(a) && /^-?\d+$/.test(b)) {
      const [from, to] = [Number(a), Number(b)]
      const step = from <= to ? 1 : -1
      return Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => String(from + i * step))
    }
    const day = (d: string) => WEEKDAYS.findIndex((w) => w.toLowerCase() === d.toLowerCase())
    const [from, to] = [day(a), day(b)]
    if (from < 0 || to < 0) throw new Error(`invalid range '${item}' — expected weekdays like Mon..Fri or integers like 1..5`)
    return Array.from({ length: ((to - from + 7) % 7) + 1 }, (_, i) => WEEKDAYS[(from + i) % 7])
  })
}
