// Renames the old npm scope (@terse) to @terseui in every tracked text file (except the lockfile),
// then you run `pnpm install` to regenerate pnpm-lock.yaml. Safe to run twice.
// Run after merging branches:  node scripts/rename-scope.mjs && pnpm install
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter((f) => f && f !== 'pnpm-lock.yaml')
// Built from parts so running this script can't rewrite its own search string.
const FROM = '@' + 'terse/'
const TO = '@' + 'terseui/'
let changed = 0
for (const f of files) {
  let src
  try {
    src = readFileSync(f, 'utf8')
  } catch {
    continue
  }
  if (src.includes('\u0000') || !src.includes(FROM)) continue // binary, or nothing to do
  writeFileSync(f, src.replaceAll(FROM, TO))
  changed++
  console.log('renamed in', f)
}
console.log(`${changed} files updated. Now run: pnpm install`)
