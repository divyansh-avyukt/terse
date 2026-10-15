import { CHILDREN, named, pick, type ComponentAdapter, type Jsx, type JsxChild, type RenderContext } from '@terse/compiler'
import { expandList, TOKENS, type IRComponent, type IRNode } from '@terse/core'

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
/** Static classes plus a ctx.lookup() result, which is either `"x"` or `{expr}`. */
const clsWith = (fixed: string, dynamic: string | undefined) => {
  if (!dynamic) return cls(fixed)
  if (dynamic.startsWith('"')) return cls(fixed, dynamic.slice(1, -1))
  return `{${JSON.stringify(fixed + ' ')} + ${dynamic.slice(1, -1)}}`
}
const humanize = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())
const pascal = (s: string) => s.replace(/(^|[-_\s]+)(\w)/g, (_, __, c: string) => c.toUpperCase())
const ICON_PX: Record<string, number> = { sm: 16, md: 20, lg: 24 }
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const components = (nodes: IRNode[]) => nodes.filter((c): c is IRComponent => c.kind === 'component')
const notTrigger = (n: IRNode) => !named('trigger')(n)
const NO_DOM_ROOT = new Set(['', 'Select', 'Tabs', 'Dialog', 'Sheet', 'DropdownMenu'])
// Keyboard access for clickable non-button elements (cards, table rows).
const pressable = (on: string) => ({
  role: '"button"',
  tabIndex: '{0}',
  onClick: `{${on}}`,
  onKeyDown: `{(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ${on}?.(e) } }}`,
})

export interface ShadcnOptions {
  /** Import path of the shadcn/ui components folder. */
  ui?: string
}

export function shadcn({ ui = '@/components/ui' }: ShadcnOptions = {}): ComponentAdapter {
  const render = (node: IRComponent, ctx: RenderContext): Jsx => {
    const p = node.props
    const lib = (file: string, ...names: string[]) => names.map((n) => ctx.use(n, `${ui}/${file}`))
    const style = (defaults = {}) => ctx.style.classes(node.name, ctx.tokens(node, defaults))
    const str = (key: string) => {
      const v = ctx.lit(p[key])
      return v === undefined ? undefined : String(v)
    }
    // lucide's `<Name>Icon` aliases can't collide with shadcn names (Badge, Table, ...).
    const icon = (name: string, size?: string, className?: string) =>
      h(ctx.use(`${pascal(name)}Icon`, 'lucide-react'), { size: size && `{${ICON_PX[size]}}`, className })
    /** Every value of a token on this component → its classes, for ctx.lookup() of a runtime @ref. */
    const tokenTable = (key: 'tone', only: readonly string[] = TOKENS[key]) =>
      Object.fromEntries(only.map((v) => [v, ctx.style.classes(node.name, { [key]: v })]))
    // A trigger wraps a lone button directly; anything else (an avatar) gets the trigger's own button.
    const triggerAsChild = () => {
      const t = components(node.children).find((c) => c.name === 'trigger')
      const first = t && components(t.children)[0]
      return first?.name === 'button' && t!.children.length === 1 ? '{true}' : undefined
    }
    /** Label above a form control, with an inline error under it. */
    const field = (control: Jsx, id: string | undefined) => {
      if (!p.label && !p.error) return control
      const [Label] = lib('label', 'Label')
      return h('div', { className: '"grid gap-2"' },
        p.label && h(Label, { htmlFor: id ? `"${id}"` : undefined }, ctx.child(p.label)),
        control,
        p.error && { cond: ctx.expr(p.error), then: [h('p', { className: '"text-destructive text-sm"' }, ctx.child(p.error))] })
    }
    const fieldId = () => {
      const id = str('name') ?? slug(str('label') ?? str('placeholder') ?? '')
      return id || undefined
    }
    // Controlled only when there is a handler to report changes to.
    const valueProp = (key: string) => (p.on ? key : `default${key[0].toUpperCase()}${key.slice(1)}`)

    switch (node.name) {
      case 'page':
        return h('main', { className: cls('mx-auto flex w-full flex-col', style({ gap: 'lg', pad: 'lg', size: 'lg' })) },
          p.title && h('h1', { className: '"text-3xl font-bold tracking-tight"' }, ctx.child(p.title)), CHILDREN)
      case 'section':
        return h('section', { className: cls('flex flex-col', style({ gap: 'md' })) },
          (p.title || p.description) && h('div', { className: '"flex flex-col gap-1"' },
            p.title && h('h2', { className: '"text-xl font-semibold tracking-tight"' }, ctx.child(p.title)),
            p.description && h('p', { className: '"text-muted-foreground text-sm"' }, ctx.child(p.description))),
          CHILDREN)
      case 'row':
        return h('div', { className: cls('flex flex-row', style({ gap: 'md', align: 'center' })) }, CHILDREN)
      case 'col':
        return h('div', { className: cls('flex flex-col', style({ gap: 'md' })) }, CHILDREN)
      case 'grid':
        return h('div', { className: cls('grid', style({ gap: 'md', cols: '3' })) }, CHILDREN)
      case 'spacer':
        return h('div', { className: '"flex-1"' })
      case 'card': {
        const [Card, CardHeader, CardTitle, CardDescription, CardContent] = lib('card', 'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent')
        const t = ctx.tokens(node, { gap: 'md' })
        return h(Card, {
          className: cls(ctx.style.classes('card', { tone: t.tone, span: t.span }), p.on ? 'cursor-pointer transition-colors hover:bg-accent/50' : ''),
          ...(p.on && pressable(ctx.expr(p.on))),
        },
          (p.title || p.description) && h(CardHeader, {},
            p.title && h(CardTitle, {}, ctx.child(p.title)),
            p.description && h(CardDescription, {}, ctx.child(p.description))),
          node.children.length > 0 && h(CardContent, { className: cls('flex flex-col', ctx.style.classes('card', { gap: t.gap, pad: t.pad })) }, CHILDREN))
      }
      case 'heading': {
        const level = str('level') ?? '2'
        return h(`h${level}`, { className: cls('font-semibold tracking-tight', style({ size: level === '1' ? 'lg' : level === '2' ? 'md' : 'sm' })) }, ctx.child(p.text))
      }
      case 'text':
        return h('p', { className: clsWith(ctx.style.classes('text', { size: str('size') ?? 'sm' }), ctx.lookup(p.tone, tokenTable('tone'))) }, ctx.child(p.text))
      case 'button': {
        const [Button] = lib('button', 'Button')
        const variant = str('variant')
        const iconOnly = str('size') === 'icon'
        return h(Button, {
          className: cls('w-fit', p.count ? 'relative' : ''), // w-fit: don't stretch inside flex columns
          type: ctx.attr(p.type),
          variant: variant && variant !== 'default' ? `"${variant}"` : undefined,
          size: { sm: '"sm"', lg: '"lg"', icon: '"icon"' }[str('size') ?? ''],
          disabled: ctx.attr(p.disabled),
          onClick: ctx.attr(p.on),
          'aria-label': iconOnly ? ctx.attr(p.label) : undefined,
        },
          p.icon && icon(str('icon')!, 'sm'),
          !iconOnly && ctx.child(p.label),
          p.count && {
            cond: ctx.expr(p.count),
            then: [h('span', { className: '"bg-destructive absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"' }, ctx.child(p.count))],
          })
      }
      case 'input': {
        const [Input] = lib('input', 'Input')
        const id = fieldId()
        const control = h(Input, {
          id: id && `"${id}"`,
          name: ctx.attr(p.name),
          type: ctx.attr(p.type),
          placeholder: ctx.attr(p.placeholder),
          [valueProp('value')]: ctx.attr(p.value),
          onChange: p.on && `{(e) => ${ctx.expr(p.on)}?.(e.target.value)}`,
          disabled: ctx.attr(p.disabled),
          'aria-invalid': p.error && `{!!${ctx.expr(p.error)}}`,
          className: p.icon && '"pl-8"',
        })
        return field(p.icon
          ? h('div', { className: '"relative"' }, icon(str('icon')!, 'sm', '"text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"'), control)
          : control, id)
      }
      case 'textarea': {
        const [Textarea] = lib('textarea', 'Textarea')
        const id = fieldId()
        return field(h(Textarea, {
          id: id && `"${id}"`,
          name: ctx.attr(p.name),
          placeholder: ctx.attr(p.placeholder),
          rows: p.rows && `{${ctx.expr(p.rows)}}`,
          [valueProp('value')]: ctx.attr(p.value),
          onChange: p.on && `{(e) => ${ctx.expr(p.on)}?.(e.target.value)}`,
          disabled: ctx.attr(p.disabled),
          'aria-invalid': p.error && `{!!${ctx.expr(p.error)}}`,
        }), id)
      }
      case 'select': {
        const [Select, SelectTrigger, SelectValue, SelectContent, SelectItem] = lib('select', 'Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem')
        const id = fieldId()
        const opts = p.options
        // A literal list renders static items; a @ref maps over strings or { value, label } objects.
        const items: JsxChild[] = opts.kind === 'lit'
          ? expandList(String(opts.value)).map((o) => h(SelectItem, { value: `"${o}"` }, o))
          : [{ each: ctx.expr(opts), as: 'opt', body: [h(SelectItem, { value: '{opt?.value ?? opt}' }, '{opt?.label ?? opt}')] }]
        return field(h(Select, {
          name: ctx.attr(p.name),
          [valueProp('value')]: ctx.attr(p.value),
          onValueChange: ctx.attr(p.on),
          disabled: ctx.attr(p.disabled),
        },
          h(SelectTrigger, { id: id && `"${id}"`, className: '"w-full"', 'aria-invalid': p.error && `{!!${ctx.expr(p.error)}}` }, h(SelectValue, { placeholder: ctx.attr(p.placeholder) })),
          h(SelectContent, {}, ...items)), id)
      }
      case 'switch':
      case 'checkbox': {
        // Wrapping in the label associates it without an id, so these are safe inside `each`.
        const [Label] = lib('label', 'Label')
        const isSwitch = node.name === 'switch'
        const [Control] = isSwitch ? lib('switch', 'Switch') : lib('checkbox', 'Checkbox')
        const control = h(Control, { checked: ctx.attr(p.checked), onCheckedChange: ctx.attr(p.on), disabled: ctx.attr(p.disabled) })
        const text = (p.label || p.description) && h('span', { className: '"flex flex-col gap-1"' },
          p.label && h('span', {}, ctx.child(p.label)),
          p.description && h('span', { className: '"text-muted-foreground text-sm font-normal"' }, ctx.child(p.description)))
        return isSwitch
          ? h(Label, { className: '"flex items-center justify-between gap-4"' }, text, control)
          : h(Label, { className: '"flex items-start gap-3"' }, control, text)
      }
      case 'tabs': {
        const [Tabs, TabsList, TabsTrigger] = lib('tabs', 'Tabs', 'TabsList', 'TabsTrigger')
        const tabs = components(node.children)
        const value = (t: IRComponent) => (t.props.value ? ctx.attr(t.props.value) : ctx.attr(t.props.label))
        return h(Tabs, p.value ? { value: ctx.attr(p.value), onValueChange: ctx.attr(p.on) } : { defaultValue: tabs[0] && value(tabs[0]), onValueChange: ctx.attr(p.on) },
          h(TabsList, {}, ...tabs.map((t) => h(TabsTrigger, { value: value(t) },
            t.props.icon && icon(String(ctx.lit(t.props.icon)), 'sm'),
            ctx.child(t.props.label)))),
          CHILDREN)
      }
      case 'tab': {
        if (!node.children.length) return h('') // a trigger only; the tabs line renders it
        const [TabsContent] = lib('tabs', 'TabsContent')
        return h(TabsContent, { value: p.value ? ctx.attr(p.value) : ctx.attr(p.label), className: '"flex flex-col gap-4 pt-2"' }, CHILDREN)
      }
      case 'badge': {
        const [Badge] = lib('badge', 'Badge')
        const variant = { default: 'secondary', muted: 'outline', primary: 'default', success: 'secondary', warning: 'secondary', destructive: 'destructive' }
        return h(Badge, {
          variant: ctx.lookup(p.tone, variant, 'secondary') ?? '"secondary"',
          className: ctx.lookup(p.tone, tokenTable('tone', ['success', 'warning'])),
        }, ctx.child(p.text))
      }
      case 'avatar': {
        const [Avatar, AvatarImage, AvatarFallback] = lib('avatar', 'Avatar', 'AvatarImage', 'AvatarFallback')
        return h(Avatar, { className: cls(style({ size: 'sm' })) },
          p.src && h(AvatarImage, { src: ctx.attr(p.src), alt: '""' }),
          h(AvatarFallback, { className: '"text-xs"' }, ctx.child(p.fallback)))
      }
      case 'progress': {
        const [Progress] = lib('progress', 'Progress')
        return h(Progress, { value: `{${ctx.expr(p.value)}}`, className: '"min-w-20"' }) // keeps a width inside auto-sized table cells
      }
      case 'skeleton': {
        const [Skeleton] = lib('skeleton', 'Skeleton')
        const n = Math.max(1, Number(str('lines') ?? 1) || 1)
        const bar = () => h(Skeleton, { className: cls('w-full', style({ size: 'sm' })) })
        return n === 1 ? bar() : h('div', { className: '"flex flex-col gap-2"' }, ...Array.from({ length: n }, bar))
      }
      case 'stat': {
        const [Card, CardContent] = lib('card', 'Card', 'CardContent')
        const t = ctx.tokens(node)
        return h(Card, { className: '"flex-1"' },
          h(CardContent, { className: cls('flex flex-col', ctx.style.classes('stat', { gap: 'sm', align: t.align })) },
            p.icon && icon(str('icon')!, 'md'),
            h('p', { className: '"text-sm text-muted-foreground"' }, ctx.child(p.label)),
            h('p', { className: '"text-2xl font-bold"' }, ctx.child(p.value)),
            p.delta && h('p', { className: clsWith('text-xs', ctx.lookup(p.tone ?? { kind: 'lit', value: 'muted', line: 0, col: 0 }, tokenTable('tone'))) }, ctx.child(p.delta))))
      }
      case 'icon':
        return icon(str('name')!, str('size'), cls(ctx.style.classes('icon', { tone: str('tone') })))
      case 'callout': {
        const [Alert, AlertTitle, AlertDescription] = lib('alert', 'Alert', 'AlertTitle', 'AlertDescription')
        return h(Alert, { variant: str('tone') === 'destructive' ? '"destructive"' : undefined },
          p.icon && icon(str('icon')!),
          h(AlertTitle, {}, ctx.child(p.title)),
          p.description && h(AlertDescription, {}, ctx.child(p.description)),
          node.children.length > 0 && h('div', { className: '"col-start-2 mt-2 flex flex-wrap gap-2"' }, CHILDREN))
      }
      case 'list':
        return h('ul', {}, CHILDREN)
      case 'item':
        return h('li', { className: '"flex justify-between gap-4 border-b py-2 last:border-b-0"' },
          h('span', {}, ctx.child(p.label)),
          p.value && h('span', { className: '"text-right"' }, ctx.child(p.value)))
      case 'series':
        return h('') // rendered by its chart
      case 'chart':
        return chart(node, ctx, lib)
      case 'table': {
        const [Table, TableHeader, TableBody, TableRow, TableHead, TableCell] = lib('table', 'Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell')
        if (node.children.length) return h(Table, {}, pick(named('thead')), h(TableBody, {}, pick((n) => !named('thead')(n))))
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
      case 'thead': {
        const [TableHeader, TableRow] = lib('table', 'TableHeader', 'TableRow')
        return h(TableHeader, {}, h(TableRow, {}, CHILDREN))
      }
      case 'th': {
        const [TableHead] = lib('table', 'TableHead')
        const className = cls(style())
        if (!p.on) return h(TableHead, { className }, ctx.child(p.label))
        const [Button] = lib('button', 'Button')
        const sort = p.sort && ctx.expr(p.sort)
        const sortIcon = (name: string) => icon(name, 'sm', '"text-muted-foreground"')
        return h(TableHead, { className, 'aria-sort': p.sort && ctx.lookup(p.sort, { asc: 'ascending', desc: 'descending' }, 'none') },
          h(Button, { variant: '"ghost"', size: '"sm"', className: '"-mx-3 h-8"', onClick: ctx.attr(p.on) },
            ctx.child(p.label),
            sort
              ? { cond: `${sort} === "asc"`, then: [sortIcon('arrow-up')], else: [{ cond: `${sort} === "desc"`, then: [sortIcon('arrow-down')], else: [sortIcon('arrow-up-down')] }] }
              : sortIcon('arrow-up-down')))
      }
      case 'tr': {
        const [TableRow] = lib('table', 'TableRow')
        return h(TableRow, p.on ? { className: '"cursor-pointer"', ...pressable(ctx.expr(p.on)) } : {}, CHILDREN)
      }
      case 'td': {
        const [TableCell] = lib('table', 'TableCell')
        return h(TableCell, { className: cls(style()) }, ctx.child(p.text), CHILDREN)
      }
      case 'image':
        return h('img', { src: ctx.attr(p.src), alt: ctx.attr(p.alt) ?? '""', className: cls('rounded-md object-cover', style({ size: 'md' })) })
      case 'link':
        return h('a', { href: ctx.attr(p.href), className: cls('font-medium underline-offset-4 hover:underline', style({ tone: 'primary' })) }, ctx.child(p.label))
      case 'separator': {
        const [Separator] = lib('separator', 'Separator')
        return h(Separator)
      }
      case 'slot':
        return h('', {}, ctx.child(p.content))
      case 'shell':
        return h('div', { className: '"flex min-h-svh w-full"' }, CHILDREN)
      case 'sidebar': {
        // A rail on md+ (icons only below lg, or when collapsed) and a drawer below md: the same children, twice.
        const [Sheet, SheetContent, SheetTitle] = lib('sheet', 'Sheet', 'SheetContent', 'SheetTitle')
        return h('', {},
          h('aside', {
            'data-collapsed': ctx.attr(p.collapsed),
            className: '"group/sidebar bg-muted/40 sticky top-0 hidden h-svh w-16 shrink-0 flex-col gap-1 border-r p-2 transition-[width] md:flex lg:w-60 lg:data-[collapsed=true]:w-16"',
          }, CHILDREN),
          h(Sheet, { open: ctx.attr(p.open), onOpenChange: ctx.attr(p.on) },
            h(SheetContent, { side: '"left"', className: '"flex w-64 flex-col gap-1 p-2 pt-10"' },
              h(SheetTitle, { className: '"sr-only"' }, 'Navigation'),
              CHILDREN)))
      }
      case 'navitem': {
        const [Button] = lib('button', 'Button')
        return h(Button, {
          variant: '"ghost"',
          title: ctx.attr(p.label),
          'data-active': ctx.attr(p.active),
          'aria-current': p.active && `{${ctx.expr(p.active)} ? "page" : undefined}`,
          onClick: ctx.attr(p.on),
          className: '"text-muted-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground w-full justify-start gap-3 px-3 font-normal md:max-lg:justify-center group-data-[collapsed=true]/sidebar:justify-center"',
        },
          p.icon && icon(str('icon')!, 'sm'),
          h('span', { className: cls('truncate', ctx.style.classes('navitem', { hide: 'collapsed' })) }, ctx.child(p.label)))
      }
      case 'bar': {
        const top = (str('side') ?? 'top') === 'top'
        return h(top ? 'header' : 'div', {
          className: cls(
            top ? 'bg-background/95 sticky top-0 z-20 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur' : 'bg-background/95 sticky bottom-0 z-20 flex items-center border-t px-4 py-3 backdrop-blur',
            style({ gap: 'sm' }),
          ),
        }, CHILDREN)
      }
      case 'menu': {
        const [DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator] =
          lib('dropdown-menu', 'DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuLabel', 'DropdownMenuSeparator')
        const asChild = triggerAsChild()
        return h(DropdownMenu, {},
          h(DropdownMenuTrigger, asChild ? { asChild } : { className: '"focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-[3px]"' }, pick(named('trigger'))),
          h(DropdownMenuContent, { align: `"${str('align') ?? 'end'}"`, className: '"min-w-48"' },
            p.label && h(DropdownMenuLabel, {}, ctx.child(p.label)),
            p.label && h(DropdownMenuSeparator),
            pick(notTrigger)))
      }
      case 'menuitem': {
        const [DropdownMenuItem] = lib('dropdown-menu', 'DropdownMenuItem')
        return h(DropdownMenuItem, { variant: str('tone') === 'destructive' ? '"destructive"' : undefined, onClick: ctx.attr(p.on) },
          p.icon && icon(str('icon')!, 'sm'),
          ctx.child(p.label))
      }
      case 'dialog':
      case 'sheet': {
        const isSheet = node.name === 'sheet'
        const [Root, Trigger, Content, Header, Title, Description] = isSheet
          ? lib('sheet', 'Sheet', 'SheetTrigger', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription')
          : lib('dialog', 'Dialog', 'DialogTrigger', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription')
        const hasTrigger = node.children.some(named('trigger'))
        return h(Root, { open: ctx.attr(p.open), onOpenChange: ctx.attr(p.on) },
          hasTrigger && h(Trigger, { asChild: triggerAsChild() }, pick(named('trigger'))),
          h(Content, { className: isSheet ? '"w-full gap-0 overflow-y-auto sm:max-w-md"' : '"max-h-[90svh] overflow-y-auto sm:max-w-lg"' },
            h(Header, {},
              h(Title, {}, ctx.child(p.title)),
              p.description && h(Description, {}, ctx.child(p.description))),
            h('div', { className: isSheet ? '"flex flex-col gap-4 px-4 pb-4"' : '"flex flex-col gap-4"' }, pick(notTrigger))))
      }
      case 'trigger':
        return h('', {}, CHILDREN) // placed by its menu/dialog/sheet
    }
    throw new Error(`shadcn adapter: no mapping for '${node.name}'`)
  }

  return {
    name: 'shadcn',
    render(node, ctx) {
      const jsx = render(node, ctx)
      const hide = ctx.lit(node.props.hide)
      if (!hide) return jsx
      const extra = ctx.style.classes(node.name, { hide: String(hide) })
      // Components without a DOM root of their own get a `contents` wrapper, which stays out of layout.
      if (NO_DOM_ROOT.has(jsx.tag)) return h('div', { className: cls('contents', extra) }, jsx)
      const c = jsx.props?.className
      const className = !c ? cls(extra) : c.startsWith('"') ? cls(c.slice(1, -1), extra) : `{${c.slice(1, -1)} + ${JSON.stringify(' ' + extra)}}`
      return { ...jsx, props: { ...jsx.props, className } }
    },
  }
}

function chart(node: IRComponent, ctx: RenderContext, lib: (file: string, ...names: string[]) => string[]): Jsx {
  const p = node.props
  const type = String(ctx.lit(p.type))
  const series = components(node.children)
  const key = (i: number) => `s${i + 1}`
  const color = (i: number) => `var(--chart-${(i % 5) + 1})`
  const literal = p.x.kind === 'lit' && series.every((s) => s.props.values.kind === 'lit')
  const [ChartContainer] = lib('chart', 'ChartContainer')
  const tooltip = String(ctx.lit(p.tooltip)) === 'true'
  const legend = String(ctx.lit(p.legend)) === 'true'
  const size = { className: `"aspect-auto w-full ${ctx.style.classes('chart', { size: String(ctx.lit(p.size) ?? 'md') })}"` }

  // Literal data is inlined; with any @ref the rows are zipped from the arrays at runtime.
  let data: string
  if (literal) {
    const xs = expandList(String(ctx.lit(p.x)))
    const values = series.map((s) => expandList(String(ctx.lit(s.props.values))).map(Number))
    data = type === 'donut'
      ? `[${xs.map((x, j) => `{ x: ${JSON.stringify(x)}, value: ${values[0]?.[j] ?? null}, fill: "${color(j)}" }`).join(', ')}]`
      : `[${xs.map((x, j) => `{ x: ${JSON.stringify(x)}, ${series.map((_, i) => `${key(i)}: ${values[i][j] ?? null}`).join(', ')} }`).join(', ')}]`
  } else {
    const xs = p.x.kind === 'lit' ? JSON.stringify(expandList(String(p.x.value))) : `(${ctx.expr(p.x)} ?? [])`
    const vals = series.map((s) => (s.props.values.kind === 'lit' ? JSON.stringify(expandList(String(s.props.values.value)).map(Number)) : ctx.expr(s.props.values)))
    data = type === 'donut'
      ? `${xs}.map((x: any, j: number) => ({ x, value: ${vals[0]}?.[j], fill: \`var(--chart-\${(j % 5) + 1})\` }))`
      : `${xs}.map((x: any, j: number) => ({ x, ${vals.map((v, i) => `${key(i)}: ${v}?.[j]`).join(', ')} }))`
  }

  const tip = (hideLabel = false) => tooltip && h(lib('chart', 'ChartTooltip')[0], { content: `{<${lib('chart', 'ChartTooltipContent')[0]}${hideLabel ? ' hideLabel' : ''} />}` })

  if (type === 'donut') {
    const [PieChart, Pie] = ['PieChart', 'Pie'].map((n) => ctx.use(n, 'recharts'))
    // No config entry: tooltip and legend then name each slice by its category.
    return h(ChartContainer, { config: '{{}}', ...size },
      h(PieChart, {},
        tip(true),
        h(Pie, { data: `{${data}}`, dataKey: '"value"', nameKey: '"x"', innerRadius: '{"55%"}', outerRadius: '{"80%"}', strokeWidth: '{2}' }),
        legend && h(lib('chart', 'ChartLegend')[0], { content: `{<${lib('chart', 'ChartLegendContent')[0]} />}` })))
  }

  const [Root, Mark] = { bar: ['BarChart', 'Bar'], area: ['AreaChart', 'Area'], line: ['LineChart', 'Line'] }[type]!.map((n) => ctx.use(n, 'recharts'))
  const [CartesianGrid, XAxis, YAxis] = ['CartesianGrid', 'XAxis', 'YAxis'].map((n) => ctx.use(n, 'recharts'))
  const config = series.map((s, i) => `${key(i)}: { label: ${ctx.expr(s.props.label)}, color: "${color(i)}" }`)
  const label = (v: typeof p.xlabel, extra: string) => v && `{{ value: ${ctx.expr(v)}, ${extra}, className: "fill-muted-foreground" }}`
  const mark = (i: number) => {
    const c = `"var(--color-${key(i)})"`
    if (type === 'bar') return h(Mark, { dataKey: `"${key(i)}"`, fill: c, radius: '{4}' })
    if (type === 'line') return h(Mark, { dataKey: `"${key(i)}"`, type: ctx.attr(p.curve) ?? '"monotone"', stroke: c, strokeWidth: '{2}', dot: '{false}' })
    return h(Mark, { dataKey: `"${key(i)}"`, type: ctx.attr(p.curve), fill: c, fillOpacity: '{0.4}', stroke: c })
  }
  return h(ChartContainer, { config: `{{ ${config.join(', ')} }}`, ...size },
    h(Root, { data: `{${data}}`, margin: (p.xlabel || p.ylabel) && `{{ left: ${p.ylabel ? 8 : 0}, bottom: ${p.xlabel ? 20 : 0} }}` },
      h(CartesianGrid, { vertical: '{false}' }),
      h(XAxis, { dataKey: '"x"', tickLine: '{false}', axisLine: '{false}', tickMargin: '{8}', minTickGap: '{24}', label: label(p.xlabel, 'position: "insideBottom", offset: -14') }),
      h(YAxis, { tickLine: '{false}', axisLine: '{false}', label: label(p.ylabel, 'angle: -90, position: "insideLeft"') }),
      tip(),
      // A bottom legend would sit on the x-axis title, so it moves to the top.
      legend && h(lib('chart', 'ChartLegend')[0], p.xlabel
        ? { verticalAlign: '"top"', content: `{<${lib('chart', 'ChartLegendContent')[0]} verticalAlign="top" />}` }
        : { content: `{<${lib('chart', 'ChartLegendContent')[0]} />}` }),
      ...series.map((_, i) => mark(i))))
}
