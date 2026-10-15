import { analyze } from '@terseui/core'
import { describe, expect, it } from 'vitest'
import { declarations } from '../src/index.js'

const dts = (src: string) => declarations(analyze(src, 'View.terse'))

describe('declarations: prop types inferred from usage', () => {
  it('objects from paths, arrays from each, functions from handlers, unions from token refs', () => {
    const d = dts(`props stats, tasks, move, loading
col
  stat "Revenue" @stats.revenue tone=@stats.tone
  each @tasks as task key=id
    button @task.title pressed=@task.done on=@move(@task.id, 1)
  button "Go" disabled=@loading`)
    expect(d).toContain('stats?: {\n    revenue?: ReactNode\n    tone?: "default" | "muted" | "primary" | "success" | "warning" | "destructive" | (string & {})\n  }')
    expect(d).toContain('tasks?: Array<{\n    id: string | number | null | undefined\n    title: ReactNode\n    done: boolean | null | undefined\n  }>')
    expect(d).toContain('move?: (...args: any[]) => void')
    expect(d).toContain('loading?: boolean')
    expect(d).toContain('declare const View: ComponentType<ViewProps>')
  })

  it('table rows get their cols as fields; .length keeps a list a list', () => {
    const d = dts('props orders\ncol\n  if not @orders.length\n    text "Empty"\n  table @orders cols=id,total')
    expect(d).toContain('orders?: Array<{\n    id?: ReactNode\n    total?: ReactNode\n  }>')
  })

  it('unused props and props given to your own components accept anything', () => {
    const d = dts('use Avatar from "./Avatar"\nprops user, extra\nAvatar user=@user')
    expect(d).toContain('user?: unknown')
    expect(d).toContain('extra?: unknown')
  })

  it('falls back to any when uses disagree, never to a wrong type', () => {
    expect(dts('props x\ncol\n  text @x\n  each @x as i\n    text "a"')).toContain('x?: any')
  })

  it('slot content is a ReactNode, select options are strings or {value,label}', () => {
    const d = dts('props content, opts\ncol\n  slot @content\n  select "Store" options=@opts')
    expect(d).toContain('content?: ReactNode')
    expect(d).toContain('opts?: Array<string | { value: string; label?: string }>')
    expect(d).toContain("import type { ComponentType, ReactNode } from 'react'")
  })

  it('each items get required keys (catching typos like isfirst), other objects stay partial', () => {
    const d = dts('props tasks, errors, move\ncol\n  text @errors.email\n  each @tasks as t\n    button "x" disabled=@t.isFirst on=@t.open')
    expect(d).toContain('isFirst: boolean | null | undefined')
    expect(d).toContain('open: ((...args: any[]) => void) | null | undefined')
    expect(d).toContain('errors?: {\n    email?: ReactNode\n  }')
  })
})
