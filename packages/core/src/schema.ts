/**
 * The v0 component vocabulary. Language-level only (no React): which positional
 * args and props each component takes. Adapters decide how they render.
 */

/** 'text': literal or @ref. 'ref': @ref only. 'handler': @ref to a function prop. 'bool': true/false or @ref.
 *  'list': comma-separated literal (a,b,c). string[]: literal from a fixed set (style tokens). */
export type PropType = 'text' | 'ref' | 'handler' | 'bool' | 'list' | readonly string[]

export interface ComponentSpec {
  args: readonly string[] // positional args fill these props, in order
  props: Record<string, PropType>
  required?: readonly string[]
  children?: boolean
}

const SPACE = ['none', 'xs', 'sm', 'md', 'lg', 'xl']

/** Shared layout/style tokens. Values must be literals so styles resolve at compile time. */
export const TOKENS = {
  gap: SPACE,
  pad: SPACE,
  align: ['start', 'center', 'end', 'stretch'],
  justify: ['start', 'center', 'end', 'between', 'around'],
  cols: ['1', '2', '3', '4', '5', '6', '12'],
  tone: ['default', 'muted', 'primary', 'destructive'],
  size: ['sm', 'md', 'lg'],
  wrap: ['true', 'false'],
} as const satisfies Record<string, readonly string[]>

export type StyleToken = keyof typeof TOKENS
const { gap, pad, align, justify, cols, tone, size, wrap } = TOKENS

export const COMPONENTS: Record<string, ComponentSpec> = {
  page: { args: ['title'], props: { title: 'text', gap, pad }, children: true },
  section: { args: ['title'], props: { title: 'text', gap, pad }, children: true },
  row: { args: [], props: { gap, pad, align, justify, wrap }, children: true },
  col: { args: [], props: { gap, pad, align, justify }, children: true },
  grid: { args: [], props: { cols, gap, pad }, children: true },
  card: { args: ['title'], props: { title: 'text', description: 'text', gap, pad }, children: true },
  heading: { args: ['text'], props: { text: 'text', level: ['1', '2', '3', '4'], size, tone }, required: ['text'] },
  text: { args: ['text'], props: { text: 'text', size, tone }, required: ['text'] },
  button: {
    args: ['label'],
    props: {
      label: 'text',
      variant: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
      size,
      on: 'handler',
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
  stat: { args: ['label', 'value'], props: { label: 'text', value: 'text', delta: 'text', tone }, required: ['label', 'value'] },
  table: { args: ['rows'], props: { rows: 'ref', cols: 'list', headers: 'list' }, required: ['rows', 'cols'] },
  image: { args: ['src'], props: { src: 'text', alt: 'text', size }, required: ['src'] },
  link: { args: ['label', 'href'], props: { label: 'text', href: 'text', tone }, required: ['label', 'href'] },
  separator: { args: [], props: {} },
}
