/**
 * The v0 component vocabulary. Language-level only (no React): which positional
 * args and props each component takes. Adapters decide how they render.
 */

/** 'text': literal or @ref. 'ref': @ref only. 'handler': @ref to a function prop. 'bool': true/false or @ref.
 *  'literal': any literal, not a @ref. 'list': comma-separated literal (a,b,c), ranges allowed (Mon..Fri, 1..5).
 *  'items': a 'list' literal or a @ref to an array. 'numbers': a list of numbers, or a @ref to one.
 *  string[]: literal from a fixed set (style tokens). */
export type PropType = 'text' | 'ref' | 'handler' | 'bool' | 'literal' | 'list' | 'items' | 'numbers' | readonly string[]

export interface ComponentSpec {
  args: readonly string[] // positional args fill these props, in order
  props: Record<string, PropType>
  required?: readonly string[]
  requiredWithoutChildren?: readonly string[] // required only when the node has no children
  children?: boolean | string // a string: only that component, as direct children
  parent?: string | readonly string[] // must sit inside (one of) these components (through each/if)
  dynamic?: readonly string[] // token props that may also be a @ref, resolved at runtime from the same fixed set
}

const SPACE = ['none', 'xs', 'sm', 'md', 'lg', 'xl']

/** Shared layout/style tokens. Values must be literals so styles resolve at compile time. */
export const TOKENS = {
  gap: SPACE,
  pad: SPACE,
  align: ['start', 'center', 'end', 'stretch'],
  justify: ['start', 'center', 'end', 'between', 'around'],
  // 'a,b': a columns below md, b from md up
  // 'a,b,c': a below md, b from md, c from lg (md with a sidebar is often too narrow for side-by-side cards)
  cols: ['1', '2', '3', '4', '5', '6', '12', '1,2', '1,3', '1,4', '2,3', '2,4', '2,6', '3,6', '1,1,2', '1,1,3', '1,2,3', '1,2,4', '2,2,4'],
  tone: ['default', 'muted', 'primary', 'success', 'warning', 'destructive'],
  size: ['sm', 'md', 'lg'],
  wrap: ['true', 'false'],
  grow: ['true', 'false'],
  span: ['1', '2', '3'], // grid columns taken from lg up
  // mobile: below md. desktop: md and up. collapsed: while the enclosing sidebar shows icons only.
  hide: ['mobile', 'desktop', 'collapsed'],
} as const satisfies Record<string, readonly string[]>

export type StyleToken = keyof typeof TOKENS
const { gap, pad, align, justify, cols, tone, size, wrap, grow, span } = TOKENS

/** Props every built-in component accepts. */
export const UNIVERSAL_PROPS: Record<string, PropType> = { hide: TOKENS.hide }

const field = { label: 'text', placeholder: 'text', value: 'text', name: 'text', on: 'handler', disabled: 'bool', error: 'text' } as const

export const COMPONENTS: Record<string, ComponentSpec> = {
  page: { args: ['title'], props: { title: 'text', gap, pad, size }, children: true },
  section: { args: ['title'], props: { title: 'text', description: 'text', gap, pad }, children: true },
  row: { args: [], props: { gap, pad, align, justify, wrap, grow }, children: true },
  col: { args: [], props: { gap, pad, align, justify, grow, span, size }, children: true }, // size: max width
  grid: { args: [], props: { cols, gap, pad }, children: true },
  spacer: { args: [], props: {} },
  card: {
    args: ['title'],
    props: { title: 'text', description: 'text', gap, pad, tone: ['default', 'transparent', 'destructive'], span, on: 'handler', href: 'text' },
    children: true,
  },
  heading: { args: ['text'], props: { text: 'text', level: ['1', '2', '3', '4'], size: [...size, 'xl'], tone, align }, required: ['text'] },
  text: { args: ['text'], props: { text: 'text', size: [...size, 'xl'], tone, align }, required: ['text'], dynamic: ['tone'] },
  button: {
    args: ['label'],
    props: {
      label: 'text',
      variant: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
      size: [...size, 'icon'],
      icon: 'literal',
      count: 'text',
      on: 'handler',
      href: 'text', // renders a link styled as a button
      pressed: 'bool', // a toggle: solid when pressed, `variant` (outline by default) when not
      disabled: 'bool',
      type: ['button', 'submit'],
    },
    required: ['label'],
    dynamic: ['variant'],
  },
  input: {
    args: ['label'],
    props: { ...field, type: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date'], icon: 'literal' },
  },
  textarea: { args: ['label'], props: { ...field, rows: 'literal' } },
  select: { args: ['label'], props: { ...field, options: 'items' }, required: ['options'] },
  switch: { args: ['label'], props: { label: 'text', description: 'text', checked: 'bool', on: 'handler', disabled: 'bool' } },
  checkbox: { args: ['label'], props: { label: 'text', description: 'text', checked: 'bool', on: 'handler', disabled: 'bool' } },
  tabs: { args: [], props: { value: 'text', on: 'handler' }, children: 'tab' },
  tab: { args: ['label'], props: { label: 'text', value: 'literal', icon: 'literal' }, required: ['label'], children: true, parent: 'tabs' },
  // Filter chips / segmented controls. multiple=true makes value an array of the selected values.
  togglegroup: { args: [], props: { value: 'text', on: 'handler', multiple: ['true', 'false'], variant: ['default', 'outline'], size }, children: 'toggle' },
  toggle: { args: ['label'], props: { label: 'text', value: 'literal', icon: 'literal', disabled: 'bool' }, required: ['label'], parent: 'togglegroup' },
  badge: { args: ['text'], props: { text: 'text', tone }, required: ['text'], dynamic: ['tone'] },
  avatar: { args: ['src'], props: { src: 'text', fallback: 'text', size }, required: ['fallback'] },
  progress: { args: ['value'], props: { value: 'text' }, required: ['value'] },
  skeleton: { args: [], props: { lines: 'literal', size } },
  stat: {
    args: ['label', 'value'],
    props: { label: 'text', value: 'text', delta: 'text', tone, icon: 'literal', align },
    required: ['label', 'value'],
    dynamic: ['tone'],
  },
  icon: { args: ['name'], props: { name: 'literal', size, tone }, required: ['name'] },
  callout: {
    args: ['title', 'description'],
    props: { title: 'text', description: 'text', icon: 'literal', tone: ['default', 'destructive'] },
    required: ['title'],
    children: true,
  },
  list: { args: [], props: {}, children: true },
  item: { args: ['label', 'value'], props: { label: 'text', value: 'text' }, required: ['label'], parent: 'list' },
  chart: {
    args: ['type'],
    props: {
      type: ['bar', 'area', 'line', 'donut'],
      x: 'items',
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
  table: { args: ['rows'], props: { rows: 'ref', cols: 'list', headers: 'list' }, requiredWithoutChildren: ['rows', 'cols'], children: true },
  thead: { args: [], props: {}, children: 'th', parent: 'table' },
  th: { args: ['label'], props: { label: 'text', align, sort: 'text', on: 'handler' }, parent: 'thead' },
  tr: { args: [], props: { on: 'handler' }, children: 'td', parent: 'table' },
  td: { args: ['text'], props: { text: 'text', align }, children: true, parent: 'tr' },
  image: { args: ['src'], props: { src: 'text', alt: 'text', size: [...size, 'fill'], ratio: ['square', 'video', 'portrait'] }, required: ['src'] },
  link: { args: ['label', 'href'], props: { label: 'text', href: 'text', tone }, required: ['label', 'href'] },
  separator: { args: [], props: {} },
  // Submits on Enter and with a type=submit button; the default page reload is prevented.
  form: { args: [], props: { on: 'handler', gap }, required: ['on'], children: true },
  // Full-bleed horizontal band (landing pages): background across the viewport, content centered at `size`.
  band: {
    args: [],
    props: { id: 'literal', tone: ['default', 'muted', 'inverse', 'primary'], pad, gap, size, align },
    children: true,
  },
  code: { args: ['source'], props: { source: 'text', lang: 'literal', title: 'text' }, required: ['source'] },
  slot: { args: ['content'], props: { content: 'ref' }, required: ['content'] },
  // App chrome
  shell: { args: [], props: {}, children: true },
  sidebar: { args: [], props: { collapsed: 'bool', open: 'bool', on: 'handler' }, children: true },
  navitem: { args: ['label'], props: { label: 'text', icon: 'literal', active: 'bool', on: 'handler' }, required: ['label'] },
  bar: { args: [], props: { side: ['top', 'bottom'], gap, justify }, children: true },
  // Overlays: an optional `trigger` child opens them; the other children are the content.
  menu: { args: [], props: { label: 'text', align: ['start', 'center', 'end'] }, children: true },
  menuitem: { args: ['label'], props: { label: 'text', icon: 'literal', on: 'handler', tone: ['default', 'destructive'] }, required: ['label'], parent: 'menu' },
  dialog: { args: ['title'], props: { title: 'text', description: 'text', open: 'bool', on: 'handler' }, required: ['title'], children: true },
  sheet: { args: ['title'], props: { title: 'text', description: 'text', open: 'bool', on: 'handler' }, required: ['title'], children: true },
  trigger: { args: [], props: {}, children: true, parent: ['menu', 'dialog', 'sheet'] },
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
