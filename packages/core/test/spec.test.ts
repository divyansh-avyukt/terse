import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COMPONENTS, UNIVERSAL_PROPS } from '../src/index.js'

const doc = readFileSync(new URL('../../../spec/components.md', import.meta.url), 'utf8')

describe('spec/components.md matches the schema', () => {
  for (const [name, spec] of Object.entries(COMPONENTS)) {
    it(name, () => {
      const section = doc.split(/^### /m).find((s) => s.startsWith(`${name}\n`))
      expect(section, `missing "### ${name}"`).toBeDefined()
      for (const prop of Object.keys(spec.props)) expect(section, `${name}.${prop} undocumented`).toMatch(new RegExp(`\\b${prop}\\b`))
    })
  }
  it('universal props', () => {
    const section = doc.split(/^## /m).find((s) => s.startsWith('Universal props\n'))
    for (const prop of Object.keys(UNIVERSAL_PROPS)) expect(section, `universal ${prop} undocumented`).toMatch(new RegExp(`\\b${prop}\\b`))
  })
})
