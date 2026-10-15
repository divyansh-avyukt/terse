import type { IRComponent, Literal, StyleToken, Value } from '@terseui/core'

/** Placeholder in an adapter's output where the node's own children go. */
export const CHILDREN = Symbol('children')

/** A JSX element. Prop values are raw JSX attribute values: `"text"` or `{expr}`; undefined props are skipped. */
export interface Jsx {
  tag: string
  props?: Record<string, string | undefined>
  children?: JsxChild[]
}

/** `{source.map((as, i) => body)}`, keyed by the compiler. */
export interface JsxEach {
  each: string
  as: string
  body: JsxChild[]
}

/** `{cond ? then : else}` */
export interface JsxIf {
  cond: string
  then: JsxChild[]
  else?: JsxChild[]
}

/** A string child is raw JSX: escaped text or `{expr}`. */
export type JsxChild = Jsx | JsxEach | JsxIf | string | typeof CHILDREN

export interface RenderContext {
  style: StyleAdapter
  /** Add `import { name } from "from"`; returns the local name. */
  use(name: string, from: string): string
  /** A JS expression for a value. */
  expr(v: Value): string
  /** A JSX attribute value (`"x"` or `{expr}`), or undefined when v is. */
  attr(v: Value | undefined): string | undefined
  /** A JSX child (escaped text or `{expr}`), or undefined when v is. */
  child(v: Value | undefined): string | undefined
  /** The literal value of a prop, or undefined when it is missing or a reference. */
  lit(v: Value | undefined): Literal | undefined
  /** The node's style-token props (gap, tone, ...) as strings, over the given defaults. */
  tokens(node: IRComponent, defaults?: Partial<Record<StyleToken, string>>): Partial<Record<StyleToken, string>>
}

/** Maps built-in IR components to a UI library's components. */
export interface ComponentAdapter {
  name: string
  render(node: IRComponent, ctx: RenderContext): Jsx
}

/** Maps style tokens to class names. */
export interface StyleAdapter {
  name: string
  /** e.g. ('row', { gap: 'md', align: 'center' }) → 'gap-4 items-center' */
  classes(component: string, tokens: Partial<Record<StyleToken, string>>): string
}
