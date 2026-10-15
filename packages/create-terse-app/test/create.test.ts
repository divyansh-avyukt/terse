import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain JS module
import { packageManager, scaffold, toPackageName } from '../index.js'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'cta-'))
  dirs.push(d)
  return d
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

describe('create-terse-app', () => {
  it('scaffolds the template, names the package and restores .gitignore', () => {
    const target = scaffold(join(tmp(), 'My Cool App'))
    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('my-cool-app')
    expect(pkg.devDependencies['@terseui/vite-plugin']).toMatch(/^\^0\./)
    expect(existsSync(join(target, '.gitignore'))).toBe(true)
    expect(existsSync(join(target, '_gitignore'))).toBe(false)
    for (const f of ['vite.config.ts', 'src/views/pages/Home.terse', 'src/pages/HomePage.tsx', 'src/components/ui/code-block.tsx', 'AGENTS.md', 'CLAUDE.md']) {
      expect(existsSync(join(target, f)), f).toBe(true)
    }
  })

  it('refuses a non-empty directory', () => {
    const d = tmp()
    writeFileSync(join(d, 'keep.txt'), 'x')
    expect(() => scaffold(d)).toThrow(/not empty/)
  })

  it('detects the package manager and sanitizes names', () => {
    expect(packageManager('pnpm/12.8.1 npm/? node/v22')).toBe('pnpm')
    expect(packageManager('')).toBe('npm')
    expect(toPackageName('/x/.Hidden App!')).toBe('hidden-app-')
  })
})
