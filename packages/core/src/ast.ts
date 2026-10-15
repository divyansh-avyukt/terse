import type { Loc } from './errors.js'

export type Literal = string | number | boolean
export type LitValue = { kind: 'lit'; value: Literal } & Loc
/** `@fn(@a, 1)`: a handler reference with arguments (refs or literals, no expressions). */
export type RefValue = { kind: 'ref'; path: string[]; args?: Value[] } & Loc
export type Value = LitValue | RefValue

export interface Attr extends Loc {
  key: string
  value: Value
}

export interface ElementNode extends Loc {
  type: 'element'
  name: string
  args: Value[]
  attrs: Attr[]
  children: Node[]
}

export interface EachNode extends Loc {
  type: 'each'
  source: RefValue
  as: string
  key?: string[] // `key=id`: React key from this field of the item instead of its index
  children: Node[]
}

export interface IfNode extends Loc {
  type: 'if'
  cond: RefValue
  negate: boolean
  then: Node[]
  else?: Node[]
}

export type Node = ElementNode | EachNode | IfNode

export interface Use extends Loc {
  name: string
  from: string
  named?: boolean // `use { Name } from`, vs a default import
}

export interface Ast {
  file?: string
  uses: Use[]
  props: ({ name: string } & Loc)[]
  body: Node[]
}
