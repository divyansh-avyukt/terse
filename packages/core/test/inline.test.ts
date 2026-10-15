import { describe, expect, it } from 'vitest'
import { parseInline } from '../src/index.js'

describe('parseInline', () => {
  it('plain text is one segment', () => expect(parseInline('hello')).toEqual([{ kind: 'text', text: 'hello' }]))

  it('splits strong, em, code and links', () => {
    expect(parseInline('a **b** *c* `d` [e](https://f.dev) g')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', text: 'b' },
      { kind: 'text', text: ' ' },
      { kind: 'em', text: 'c' },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'd' },
      { kind: 'text', text: ' ' },
      { kind: 'link', text: 'e', href: 'https://f.dev' },
      { kind: 'text', text: ' g' },
    ])
  })

  it('leaves unpaired markers alone', () => expect(parseInline('5 * 3 = 15')).toEqual([{ kind: 'text', text: '5 * 3 = 15' }]))
})
