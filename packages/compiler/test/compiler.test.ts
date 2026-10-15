import { shadcn } from '@terse/adapter-shadcn'
import { tailwind } from '@terse/style-tailwind'
import { COMPONENTS } from '@terse/core'
import { describe, expect, it } from 'vitest'
import { compile, type ComponentAdapter } from '../src/index.js'

const opts = { components: shadcn(), style: tailwind() }
const tsx = (src: string, file = 'view.terse') => compile(src, { ...opts, file }).code

// One representative snippet per component in the v0 vocabulary.
const SNIPPETS: Record<string, string> = {
  page: `page "Dashboard" gap=md\n  text "hi"`,
  section: `section "Billing"\n  text "hi"`,
  row: `row gap=sm justify=between wrap=true\n  text "a"\n  text "b"`,
  col: `col gap=lg align=start\n  text "a"`,
  grid: `grid cols=4 gap=lg\n  text "a"`,
  card: `card "Plan" description="Your current plan"\n  text "Pro"`,
  heading: `heading "Settings" level=1`,
  text: `props user\ntext @user.name size=lg tone=muted`,
  button: `props onSave, saving\nbutton "Save" variant=outline size=sm on=@onSave disabled=@saving type=submit`,
  input: `props email, onEmail\ninput "Email" type=email placeholder="you@example.com" value=@email on=@onEmail`,
  badge: `badge "Active" tone=primary`,
  stat: `props stats\nstat "Revenue" @stats.revenue delta=@stats.delta`,
  table: `props orders\ntable @orders cols=id,customer,createdAt headers=ID,Customer,Date`,
  image: `image "/logo.png" alt="Logo" size=sm`,
  link: `link "Docs" "https://example.com" tone=muted`,
  separator: `separator`,
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

  it('escapes text that JSX would interpret', () => {
    const code = tsx(`text "a {b} <c> & d"\n`)
    expect(code).toContain(`<p className="text-sm">{"a {b} <c> & d"}</p>`)
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
