import { CHILDREN, type ComponentAdapter, type Jsx, type JsxChild } from '@terseui/compiler'
import { expandList, parseInline, type IRComponent, type Value } from '@terseui/core'

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
const pascal = (s: string) => s.replace(/(^|[-_\s]+)(\w)/g, (_, __, c: string) => c.toUpperCase())
const ICON_PX: Record<string, number> = { sm: 16, md: 20, lg: 24 }
const external = (href: string) => (/^https?:/.test(href) ? { target: '"_blank"', rel: '"noreferrer"' } : {})
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
      // lucide's `<Name>Icon` aliases can't collide with shadcn names (Badge, Table, ...).
      const icon = (name: string, size?: string) => h(ctx.use(`${pascal(name)}Icon`, 'lucide-react'), { size: size && `{${ICON_PX[size]}}` })

      /** Text content with inline markup (**strong**, *em*, `code`, [link](href)); a @ref renders as-is. */
      const rich = (v: Value | undefined, strong = '"font-semibold text-foreground"'): JsxChild[] => {
        if (v?.kind !== 'lit' || typeof v.value !== 'string') return [ctx.child(v)].filter((c) => c !== undefined)
        return parseInline(v.value).map((seg): JsxChild => {
          const text = ctx.child({ ...v, value: seg.text })!
          if (seg.kind === 'strong') return h('strong', { className: strong }, text)
          if (seg.kind === 'em') return h('em', {}, text)
          if (seg.kind === 'code') return h('code', { className: '"rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"' }, text)
          if (seg.kind === 'link') return h('a', { href: `"${seg.href}"`, className: '"font-medium text-primary underline underline-offset-4"', ...external(seg.href) }, text)
          return text
        })
      }

      switch (node.name) {
        case 'page':
          return h('main', { className: cls('mx-auto flex w-full flex-col', style({ gap: 'lg', pad: 'lg', size: 'lg' })) },
            p.title && h('h1', { className: '"text-3xl font-bold tracking-tight"' }, ctx.child(p.title)), CHILDREN)
        case 'section':
          return h('section', { className: cls('flex flex-col', style({ gap: 'md' })) },
            p.title && h('h2', { className: '"text-xl font-semibold tracking-tight"' }, ctx.child(p.title)), CHILDREN)
        case 'row':
          return h('div', { className: cls('flex flex-row', style({ gap: 'md', align: 'center' })) }, CHILDREN)
        case 'col':
          return h('div', { className: cls('flex flex-col', style({ gap: 'md' })) }, CHILDREN)
        case 'grid':
          return h('div', { className: cls('grid', style({ gap: 'md', cols: '3' })) }, CHILDREN)
        case 'card': {
          const [Card, CardHeader, CardTitle, CardDescription, CardContent] = lib('card', 'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent')
          const t = ctx.tokens(node, { gap: 'md' })
          return h(Card, { className: cls(ctx.style.classes('card', { tone: t.tone })) },
            (p.title || p.description) && h(CardHeader, {},
              p.title && h(CardTitle, {}, ctx.child(p.title)),
              p.description && h(CardDescription, {}, ctx.child(p.description))),
            node.children.length > 0 && h(CardContent, { className: cls('flex flex-col', ctx.style.classes('card', { gap: t.gap, pad: t.pad })) }, CHILDREN))
        }
        case 'heading': {
          const level = str('level') ?? '2'
          // Emphasis in a heading is the accent colour.
          return h(`h${level}`, { className: cls('font-semibold tracking-tight text-balance', style({ size: level === '1' ? 'lg' : level === '2' ? 'md' : 'sm' })) },
            ...rich(p.text, '"text-primary"'))
        }
        case 'text':
          return h('p', { className: cls(style({ size: 'sm' })) }, ...rich(p.text))
        case 'button': {
          const variant = str('variant')
          const size = { sm: '"sm"', lg: '"lg"' }[str('size') ?? '']
          if (p.href) {
            const [buttonVariants] = lib('button', 'buttonVariants')
            const opts = [variant && variant !== 'default' && `variant: "${variant}"`, size && `size: ${size}`].filter(Boolean).join(', ')
            return h('a', { href: ctx.attr(p.href), className: `{${buttonVariants}({ ${opts} }) + " w-fit"}`, ...(p.href.kind === 'lit' ? external(String(p.href.value)) : {}) },
              ctx.child(p.label))
          }
          const [Button] = lib('button', 'Button')
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
          const [Card, CardContent] = lib('card', 'Card', 'CardContent')
          const t = ctx.tokens(node, { tone: 'muted' })
          return h(Card, { className: '"flex-1"' },
            h(CardContent, { className: cls('flex flex-col', ctx.style.classes('stat', { gap: 'sm', align: t.align })) },
              p.icon && icon(str('icon')!, 'md'),
              h('p', { className: '"text-sm text-muted-foreground"' }, ctx.child(p.label)),
              h('p', { className: '"text-2xl font-bold"' }, ctx.child(p.value)),
              p.delta && h('p', { className: cls('text-xs', ctx.style.classes('stat', { tone: t.tone })) }, ctx.child(p.delta))))
        }
        case 'icon':
          return icon(str('name')!, str('size'))
        case 'callout': {
          const [Alert, AlertTitle, AlertDescription] = lib('alert', 'Alert', 'AlertTitle', 'AlertDescription')
          return h(Alert, {},
            p.icon && icon(str('icon')!),
            h(AlertTitle, {}, ctx.child(p.title)),
            p.description && h(AlertDescription, {}, ctx.child(p.description)))
        }
        case 'list':
          return h('ul', {}, CHILDREN)
        case 'item':
          return h('li', { className: '"flex justify-between border-b py-2 last:border-b-0"' },
            h('span', {}, ctx.child(p.label)),
            p.value && h('span', { className: '"text-right"' }, ctx.child(p.value)))
        case 'series':
          return h('') // rendered by its chart
        case 'chart': {
          const bar = str('type') === 'bar'
          const series = node.children.filter((c): c is IRComponent => c.kind === 'component')
          const key = (i: number) => `s${i + 1}`
          const xs = expandList(str('x')!)
          const values = series.map((s) => expandList(String(ctx.lit(s.props.values))).map(Number))
          const config = series.map((s, i) => `${key(i)}: { label: ${ctx.expr(s.props.label)}, color: "var(--chart-${(i % 5) + 1})" }`)
          const data = xs.map((x, j) => `{ x: ${JSON.stringify(x)}, ${series.map((_, i) => `${key(i)}: ${values[i][j] ?? null}`).join(', ')} }`)
          const label = (v: typeof p.xlabel, extra: string) => v && `{{ value: ${ctx.expr(v)}, ${extra}, className: "fill-muted-foreground" }}`
          const [ChartContainer] = lib('chart', 'ChartContainer')
          const [Root, Mark, CartesianGrid, XAxis, YAxis] = [bar ? 'BarChart' : 'AreaChart', bar ? 'Bar' : 'Area', 'CartesianGrid', 'XAxis', 'YAxis'].map((n) => ctx.use(n, 'recharts'))
          return h(ChartContainer, { config: `{{ ${config.join(', ')} }}`, className: cls('aspect-auto w-full', ctx.style.classes('chart', { size: str('size') ?? 'md' })) },
            h(Root, { data: `{[${data.join(', ')}]}`, margin: (p.xlabel || p.ylabel) && `{{ left: ${p.ylabel ? 8 : 0}, bottom: ${p.xlabel ? 20 : 0} }}` },
              h(CartesianGrid, { vertical: '{false}' }),
              h(XAxis, { dataKey: '"x"', tickLine: '{false}', axisLine: '{false}', tickMargin: '{8}', label: label(p.xlabel, 'position: "insideBottom", offset: -14') }),
              h(YAxis, { tickLine: '{false}', axisLine: '{false}', label: label(p.ylabel, 'angle: -90, position: "insideLeft"') }),
              str('tooltip') === 'true' && h(lib('chart', 'ChartTooltip')[0], { content: `{<${lib('chart', 'ChartTooltipContent')[0]} />}` }),
              // A bottom legend would sit on the x-axis title, so it moves to the top.
              str('legend') === 'true' && h(lib('chart', 'ChartLegend')[0], p.xlabel
                ? { verticalAlign: '"top"', content: `{<${lib('chart', 'ChartLegendContent')[0]} verticalAlign="top" />}` }
                : { content: `{<${lib('chart', 'ChartLegendContent')[0]} />}` }),
              ...series.map((_, i) =>
                bar
                  ? h(Mark, { dataKey: `"${key(i)}"`, fill: `"var(--color-${key(i)})"`, radius: '{4}' })
                  : h(Mark, { dataKey: `"${key(i)}"`, type: ctx.attr(p.curve), fill: `"var(--color-${key(i)})"`, fillOpacity: '{0.4}', stroke: `"var(--color-${key(i)})"` }))))
        }
        case 'table': {
          const [Table, TableHeader, TableBody, TableRow, TableHead, TableCell] = lib('table', 'Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell')
          const cols = expandList(str('cols') ?? '')
          const headers = str('headers') === undefined ? undefined : expandList(str('headers')!)
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
        case 'band':
          return h('section', { id: ctx.attr(p.id), className: cls('w-full scroll-mt-16', ctx.style.classes('band', { tone: str('tone') ?? 'default', pad: str('pad') ?? 'lg' })) },
            h('div', { className: cls('mx-auto flex w-full flex-col px-6', ctx.style.classes('band', { size: str('size') ?? 'lg', gap: str('gap') ?? 'lg', align: str('align') ?? 'stretch' })) }, CHILDREN))
        case 'code': {
          // shadcn has no code block; the app provides components/ui/code-block (see docs/code-block.tsx).
          const [CodeBlock] = lib('code-block', 'CodeBlock')
          return h(CodeBlock, { code: p.source.kind === 'lit' ? `{${JSON.stringify(p.source.value)}}` : ctx.attr(p.source), lang: ctx.attr(p.lang), title: ctx.attr(p.title) })
        }
        case 'separator': {
          const [Separator] = lib('separator', 'Separator')
          return h(Separator)
        }
      }
      throw new Error(`shadcn adapter: no mapping for '${node.name}'`)
    },
  }
}
