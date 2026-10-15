import { CHILDREN, type ComponentAdapter, type Jsx, type JsxChild } from '@terse/compiler'

const IDENT = /^[A-Za-z_$][\w$]*$/

const h = (tag: string, props: Jsx['props'] = {}, ...children: (JsxChild | undefined | false)[]): Jsx => ({
  tag,
  props,
  children: children.filter((c): c is JsxChild => c !== undefined && c !== false),
})
const cls = (...parts: string[]) => {
  const s = parts.filter(Boolean).join(' ')
  return s ? `"${s}"` : undefined
}
const humanize = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export interface ShadcnOptions {
  /** Import path of the shadcn/ui components folder. */
  ui?: string
}

export function shadcn({ ui = '@/components/ui' }: ShadcnOptions = {}): ComponentAdapter {
  return {
    name: 'shadcn',
    render(node, ctx) {
      const p = node.props
      const lib = (file: string, ...names: string[]) => names.map((n) => ctx.use(n, `${ui}/${file}`))
      const style = (defaults = {}) => ctx.style.classes(node.name, ctx.tokens(node, defaults))
      const str = (key: string) => {
        const v = ctx.lit(p[key])
        return v === undefined ? undefined : String(v)
      }

      switch (node.name) {
        case 'page':
          return h('main', { className: cls('mx-auto flex w-full max-w-6xl flex-col', style({ gap: 'lg', pad: 'lg' })) },
            p.title && h('h1', { className: '"text-3xl font-bold tracking-tight"' }, ctx.child(p.title)), CHILDREN)
        case 'section':
          return h('section', { className: cls('flex flex-col', style({ gap: 'md' })) },
            p.title && h('h2', { className: '"text-xl font-semibold tracking-tight"' }, ctx.child(p.title)), CHILDREN)
        case 'row':
          return h('div', { className: cls('flex flex-row', style({ gap: 'md', align: 'center' })) }, CHILDREN)
        case 'col':
          return h('div', { className: cls('flex flex-col', style({ gap: 'md' })) }, CHILDREN)
        case 'grid':
          return h('div', { className: cls('grid grid-cols-1', style({ gap: 'md', cols: '3' })) }, CHILDREN)
        case 'card': {
          const [Card, CardHeader, CardTitle, CardDescription, CardContent] = lib('card', 'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent')
          return h(Card, {},
            (p.title || p.description) && h(CardHeader, {},
              p.title && h(CardTitle, {}, ctx.child(p.title)),
              p.description && h(CardDescription, {}, ctx.child(p.description))),
            node.children.length > 0 && h(CardContent, { className: cls('flex flex-col', style({ gap: 'md' })) }, CHILDREN))
        }
        case 'heading': {
          const level = str('level') ?? '2'
          return h(`h${level}`, { className: cls('font-semibold tracking-tight', style({ size: level === '1' ? 'lg' : level === '2' ? 'md' : 'sm' })) }, ctx.child(p.text))
        }
        case 'text':
          return h('p', { className: cls(style({ size: 'sm' })) }, ctx.child(p.text))
        case 'button': {
          const [Button] = lib('button', 'Button')
          const variant = str('variant')
          const size = { sm: '"sm"', lg: '"lg"' }[str('size') ?? '']
          return h(Button, {
            className: '"w-fit"', // don't stretch inside flex columns
            type: ctx.attr(p.type),
            variant: variant && variant !== 'default' ? `"${variant}"` : undefined,
            size,
            disabled: ctx.attr(p.disabled),
            onClick: ctx.attr(p.on),
          }, ctx.child(p.label))
        }
        case 'input': {
          const [Input] = lib('input', 'Input')
          const id = str('name') ?? slug(str('label') ?? str('placeholder') ?? '')
          const field = h(Input, {
            id: id ? `"${id}"` : undefined,
            name: ctx.attr(p.name),
            type: ctx.attr(p.type),
            placeholder: ctx.attr(p.placeholder),
            // Controlled only when there is a handler to report changes to.
            [p.on ? 'value' : 'defaultValue']: ctx.attr(p.value),
            onChange: p.on && `{(e) => ${ctx.expr(p.on)}?.(e.target.value)}`,
            disabled: ctx.attr(p.disabled),
          })
          if (!p.label) return field
          const [Label] = lib('label', 'Label')
          return h('div', { className: '"grid gap-2"' }, h(Label, { htmlFor: id ? `"${id}"` : undefined }, ctx.child(p.label)), field)
        }
        case 'badge': {
          const [Badge] = lib('badge', 'Badge')
          const variant = { default: 'secondary', muted: 'outline', primary: undefined, destructive: 'destructive' }[str('tone') ?? 'default']
          return h(Badge, { variant: variant && `"${variant}"` }, ctx.child(p.text))
        }
        case 'stat': {
          const [Card, CardHeader, CardTitle, CardDescription, CardContent] = lib('card', 'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent')
          return h(Card, { className: '"flex-1"' },
            h(CardHeader, {},
              h(CardDescription, {}, ctx.child(p.label)),
              h(CardTitle, { className: '"text-3xl font-semibold tabular-nums"' }, ctx.child(p.value))),
            p.delta && h(CardContent, {}, h('p', { className: cls('text-xs', style({ tone: 'muted' })) }, ctx.child(p.delta))))
        }
        case 'table': {
          const [Table, TableHeader, TableBody, TableRow, TableHead, TableCell] = lib('table', 'Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell')
          const cols = (str('cols') ?? '').split(',').map((c) => c.trim()).filter(Boolean)
          const headers = str('headers')?.split(',').map((c) => c.trim())
          return h(Table, {},
            h(TableHeader, {}, h(TableRow, {}, ...cols.map((c, i) => h(TableHead, {}, headers?.[i] ?? humanize(c))))),
            h(TableBody, {}, {
              each: ctx.expr(p.rows),
              as: 'row',
              body: [h(TableRow, {}, ...cols.map((c) => h(TableCell, {}, `{row${IDENT.test(c) ? `?.${c}` : `?.[${JSON.stringify(c)}]`}}`)))],
            }))
        }
        case 'image':
          return h('img', { src: ctx.attr(p.src), alt: ctx.attr(p.alt) ?? '""', className: cls('rounded-md object-cover', style({ size: 'md' })) })
        case 'link':
          return h('a', { href: ctx.attr(p.href), className: cls('font-medium underline-offset-4 hover:underline', style({ tone: 'primary' })) }, ctx.child(p.label))
        case 'separator': {
          const [Separator] = lib('separator', 'Separator')
          return h(Separator)
        }
      }
      throw new Error(`shadcn adapter: no mapping for '${node.name}'`)
    },
  }
}
