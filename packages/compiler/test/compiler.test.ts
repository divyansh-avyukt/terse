import { shadcn } from '@terseui/adapter-shadcn'
import { tailwind } from '@terseui/style-tailwind'
import { COMPONENTS } from '@terseui/core'
import { describe, expect, it } from 'vitest'
import { compile, type ComponentAdapter } from '../src/index.js'

const opts = { components: shadcn(), style: tailwind() }
const tsx = (src: string, file = 'view.terse') => compile(src, { ...opts, file }).code

// One representative snippet per component in the v0 vocabulary.
const SNIPPETS: Record<string, string> = {
  page: `page "Dashboard" gap=md size=md\n  text "hi"`,
  section: `section "Billing"\n  text "hi"`,
  row: `row gap=sm justify=between wrap=true\n  text "a"\n  text "b"`,
  col: `col gap=lg align=start\n  text "a"`,
  grid: `grid cols=2,4 gap=lg\n  text "a"`,
  card: `card "Plan" description="Your current plan" tone=transparent\n  text "Pro" size=xl`,
  heading: `heading "Settings" level=1`,
  text: `props user\ntext @user.name size=lg tone=muted`,
  button: `props onSave, saving\nbutton "Save" variant=outline size=sm on=@onSave disabled=@saving type=submit`,
  input: `props email, onEmail\ninput "Email" type=email placeholder="you@example.com" value=@email on=@onEmail`,
  badge: `badge "Active" tone=primary`,
  stat: `props stats\nstat "Revenue" @stats.revenue delta=@stats.delta icon=dollar-sign align=center`,
  table: `props orders\ntable @orders cols=id,customer,createdAt headers=ID,Customer,Date`,
  image: `image "/logo.png" alt="Logo" size=sm`,
  link: `link "Docs" "https://example.com" tone=muted`,
  separator: `separator`,
  band: `band id=start tone=inverse pad=xl size=md align=center\n  heading "Ship **less** code" size=xl align=center`,
  code: `props snippet\ncol\n  code "page \\"Hi\\"" lang=terse title="hello.terse"\n  code @snippet lang=tsx`,
  icon: `icon cloud-rain size=lg`,
  callout: `callout "Heads up" "Fog expected" icon=info`,
  list: `list
  item "9:00 AM" "70°F"
  item "11:00 AM"`,
  item: `props hours
list
  each @hours as h
    item @h.time @h.temp`,
  chart: `chart bar x=Thu..Sat xlabel=Day ylabel="°F" tooltip=true legend=true
  series "High" 72,68,65
  series "Low" 55,52,50`,
  series: `chart area x=1..3 size=sm curve=natural
  series "Rain" 0.0,0.1,0.4`,
  spacer: `row\n  text "left"\n  spacer\n  text "right"`,
  textarea: `props note, onNote, err\ntextarea "Note" placeholder="Add a note" rows=3 value=@note on=@onNote error=@err`,
  select: `props status, statuses, onStatus\ncol\n  select "Status" value=@status options=@statuses on=@onStatus\n  select "Schedule" options=Daily,Weekly placeholder="Pick one"`,
  switch: `props on, onToggle\nswitch "Palm" description="Accept palm payments" checked=@on on=@onToggle`,
  checkbox: `props daily, onDaily\ncheckbox "Daily summary" checked=@daily on=@onDaily`,
  tabs: `props range, onRange\ntabs value=@range on=@onRange\n  tab "7d"\n  tab "30d"`,
  tab: `tabs\n  tab "Overview" icon=chart-line\n    text "a"\n  tab "Notes" value=notes\n    text "b"`,
  avatar: `props c\navatar @c.photo fallback=@c.initials size=md`,
  progress: `props share\nprogress @share`,
  skeleton: `skeleton lines=3 size=md`,
  thead: `props rows, sort, onSortAmount\ntable\n  thead\n    th "ID"\n    th "Amount" align=end sort=@sort.amount on=@onSortAmount\n  each @rows as r\n    tr on=@r.onOpen\n      td @r.id\n      td @r.amount align=end`,
  th: `props sort, onSort\ntable\n  thead\n    th "Amount" align=end sort=@sort on=@onSort`,
  tr: `props rows\ntable\n  each @rows as r\n    tr on=@r.onOpen\n      td @r.id`,
  td: `props r\ntable\n  tr\n    td\n      row gap=sm\n        avatar fallback=@r.initials\n        text @r.name`,
  slot: `props content\ncol\n  slot @content`,
  shell: `props content\nshell\n  col grow=true\n    slot @content`,
  sidebar: `props collapsed, open, onOpen, go\nsidebar collapsed=@collapsed open=@open on=@onOpen\n  navitem "Overview" icon=layout-dashboard active=true on=@go.overview\n  spacer\n  text "v1" hide=collapsed`,
  navitem: `props active, onGo\nnavitem "Customers" icon=users active=@active on=@onGo`,
  bar: `props title\nbar justify=between\n  heading @title level=1 size=sm\n  button "Menu" size=icon icon=menu variant=ghost hide=desktop`,
  menu: `props user, onSignOut\nmenu label="My account"\n  trigger\n    avatar fallback=@user.initials\n  menuitem "Profile" icon=user\n  separator\n  menuitem "Sign out" tone=destructive on=@onSignOut`,
  menuitem: `menu\n  trigger\n    button "Open" variant=outline\n  menuitem "Billing" icon=credit-card`,
  dialog: `props open, onOpen, onSave\ndialog "Add item" description="New menu item" open=@open on=@onOpen\n  trigger\n    button "Add item" icon=plus\n  input "Name"\n  button "Save" on=@onSave`,
  sheet: `props open, onOpen\nsheet "Transaction" open=@open on=@onOpen\n  text "details"`,
  trigger: `dialog "Confirm"\n  trigger\n    button "Delete" variant=destructive\n  text "Sure?"`,
}

describe('compiler snapshots', () => {
  it('covers every component in the vocabulary', () => {
    expect(Object.keys(SNIPPETS).sort()).toEqual(Object.keys(COMPONENTS).sort())
  })

  for (const [name, src] of Object.entries(SNIPPETS)) {
    it(name, () => expect(tsx(src, `${name}.terse`)).toMatchSnapshot())
  }

  it('spec example: user components, each, if/else', () => {
    expect(
      tsx(
        `use UserAvatar from "@/components/UserAvatar"
props user, orders, loading, onRefresh

page "Dashboard"
  if @loading
    text "Loading…"
  else
    each @orders as order
      text @order.customer
      badge @order.status
  if not @orders
    text "No orders"
  row justify=between
    UserAvatar user=@user size=sm
    button "Refresh" variant=outline on=@onRefresh
`,
        'dashboard.terse',
      ),
    ).toMatchSnapshot()
  })

  it('expands ranges and rejects bad lists and misplaced children', () => {
    expect(tsx(`chart bar x=Sat..Mon\n  series "A" 1,2,3`)).toContain('{ x: "Sat", s1: 1 }, { x: "Sun", s1: 2 }, { x: "Mon", s1: 3 }')
    expect(() => tsx(`chart bar x=Thu..Foo\n  series "A" 1`)).toThrow("invalid range 'Thu..Foo'")
    expect(() => tsx(`chart bar x=a,b\n  series "A" 1,x`)).toThrow("'x' is not a number")
    expect(() => tsx(`chart bar x=a\n  text "no"`)).toThrow("'chart' can only contain 'series' lines")
    expect(() => tsx(`item "orphan"`)).toThrow("'item' must be inside a 'list'")
    expect(() => tsx(`props n\nicon @n`)).toThrow("'name' on 'icon' must be a literal")
  })

  it('runtime tokens: dynamic props take a @ref, others still must be literal', () => {
    const code = tsx(`props t\nbadge "Paid" tone=@t.tone`)
    expect(code).toContain('variant={(({"default":"secondary"')
    expect(code).toContain(')[t?.tone] ?? "secondary")}')
    expect(() => tsx(`props t\nheading "x" tone=@t`)).toThrow("'tone' on 'heading' must be a literal")
  })

  it('charts take @ref data and zip it at runtime', () => {
    const code = tsx(`props rev\nchart line x=@rev.labels\n  series "Revenue" @rev.values`)
    expect(code).toContain('data={(rev?.labels ?? []).map((x: any, j: number) => ({ x, s1: rev?.values?.[j] }))}')
    expect(tsx(`chart donut x=Palm,Card\n  series "Share" 60,40`)).toContain('{ x: "Palm", value: 60, fill: "var(--chart-1)" }')
  })

  it('hide merges into the root className (or wraps a root with no DOM node); tables need rows+cols or children', () => {
    expect(tsx(`button "x" hide=mobile`)).toContain('<Button className="w-fit max-md:hidden">')
    expect(tsx(`props t\ntext "x" tone=@t hide=desktop`)).toMatch(/className=\{"text-sm " \+ \(\(.*\[t\] \?\? ""\) \+ " md:hidden"\}/)
    expect(tsx(`select options=a,b hide=collapsed`)).toContain('<div className="contents md:max-lg:hidden')
    expect(() => tsx(`table`)).toThrow("'table' requires 'rows' (or children)")
    expect(() => tsx(`td "x"`)).toThrow("'td' must be inside a 'tr'")
    expect(() => tsx(`trigger\n  text "x"`)).toThrow("'trigger' must be inside a 'menu' or a 'dialog' or a 'sheet'")
  })

  it('pick() routes a trigger and the rest of the children into different slots', () => {
    const code = tsx(`menu\n  trigger\n    button "Open"\n  menuitem "A"`)
    expect(code.indexOf('<Button')).toBeLessThan(code.indexOf('<DropdownMenuContent'))
    expect(code).toMatch(/<DropdownMenuTrigger asChild={true}>\s*<Button/)
  })

  it('icon buttons stay square (no w-fit over size-9)', () => {
    expect(tsx(`button "Close" size=icon icon=x`)).toContain('<Button size="icon" aria-label="Close">')
  })

  it('escapes text that JSX would interpret', () => {
    const code = tsx(`text "a {b} <c> & d"\n`)
    expect(code).toContain(`<p className="text-sm">{"a {b} <c> & d"}</p>`)
  })
})

describe('inline markup and links', () => {
  it('renders **strong**, *em*, `code` and [links](url) inside text, keeping spaces', () => {
    const code = tsx('text "Run `pnpm dev`, then **edit** a *view* — [docs](https://terse-ui.dev)."')
    expect(code).toContain('{"Run "}')
    expect(code).toContain('<code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">pnpm dev</code>')
    expect(code).toContain('<strong className="font-semibold text-foreground">edit</strong>')
    expect(code).toContain('<a href="https://terse-ui.dev" className="font-medium text-primary underline underline-offset-4" target="_blank" rel="noreferrer">')
  })

  it('accents emphasis in headings', () => {
    expect(tsx('heading "Make it **write less**."')).toContain('<strong className="text-primary">write less</strong>')
  })

  it('button href renders a link with button styles', () => {
    const code = tsx('button "GitHub" href="https://github.com/x" variant=outline size=lg')
    expect(code).toContain('import { buttonVariants } from "@/components/ui/button"')
    expect(code).toContain('<a href="https://github.com/x" className={buttonVariants({ variant: "outline", size: "lg" }) + " w-fit"} target="_blank" rel="noreferrer">')
  })
})

describe('source maps', () => {
  it('maps JSX lines back to .terse lines', () => {
    const src = `props a\n\ncol\n  text "x"\n  text @a`
    const { code, map } = compile(src, { ...opts, file: 'm.terse' })
    expect(map.sources).toEqual(['m.terse'])
    expect(map.sourcesContent).toEqual([src])
    // decode: every segment here is single-char VLQ, [genCol, src, lineDelta, colDelta]
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const dec = (c: string) => { const v = B64.indexOf(c); return v & 1 ? -(v >> 1) : v >> 1 }
    let line = 0
    const lines = map.mappings.split(';').map((seg) => (seg ? (line += dec(seg[2])) + 1 : undefined))
    const gen = code.split('\n')
    expect(lines[gen.findIndex((l) => l.includes('<div'))]).toBe(3)
    expect(lines[gen.findIndex((l) => l.includes('>x<'))]).toBe(4)
    expect(lines[gen.findIndex((l) => l.includes('{a}'))]).toBe(5)
  })
})

describe('adapter boundary', () => {
  it('a different ComponentAdapter changes output without touching core', () => {
    const plain: ComponentAdapter = {
      name: 'plain',
      render: (node, ctx) => ({ tag: ctx.use('Box', 'my-ui'), props: { kind: `"${node.name}"` }, children: [ctx.child(node.props.text ?? node.props.label) ?? ''] }),
    }
    const code = compile(`button "Go"`, { components: plain, style: tailwind(), file: 'x.terse' }).code
    expect(code).toContain('import { Box } from "my-ui"')
    expect(code).toContain('<Box kind="button">Go</Box>')
  })
})
