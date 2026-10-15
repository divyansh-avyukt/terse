#!/usr/bin/env node
// create-terse-app: scaffold a Vite + React + TS + Tailwind + shadcn/ui app with Terse wired in.
// Usage: npm create terse-app@latest [dir]   (also pnpm create / yarn create / bun create)
import { cpSync, existsSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const TEMPLATE = fileURLToPath(new URL('./template', import.meta.url))

/** The package manager that ran us, from npm_config_user_agent ("pnpm/10.0.0 npm/? node/..."). */
export function packageManager(agent = process.env.npm_config_user_agent ?? '') {
  const name = agent.split('/')[0]
  return ['pnpm', 'yarn', 'bun'].includes(name) ? name : 'npm'
}

/** npm package names: lowercase, no spaces, URL-safe. */
export function toPackageName(dir) {
  return basename(resolve(dir)).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-~._]/g, '-').replace(/^[._-]+/, '') || 'terse-app'
}

/** Copy the template into `dir` (must be missing or empty) and name the project. */
export function scaffold(dir) {
  const target = resolve(dir)
  if (existsSync(target) && readdirSync(target).length) throw new Error(`${target} is not empty`)
  cpSync(TEMPLATE, target, { recursive: true })
  renameSync(join(target, '_gitignore'), join(target, '.gitignore')) // npm drops .gitignore from published packages
  const pkgPath = join(target, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.name = toPackageName(dir)
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  return target
}

async function main(argv) {
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log('Usage: npm create terse-app@latest [directory]')
    return
  }
  let dir = argv.find((a) => !a.startsWith('-'))
  if (!dir) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    dir = (await rl.question('Project name: (terse-app) ')).trim() || 'terse-app'
    rl.close()
  }
  const target = scaffold(dir)
  const pm = packageManager()
  const cd = relative(process.cwd(), target)
  console.log(`\nCreated a Terse app in ${target}\n\nNext:\n${cd ? `  cd ${cd}\n` : ''}  ${pm} install\n  ${pm === 'npm' ? 'npm run' : pm} dev\n`)
  console.log('Then edit src/views/pages/Home.terse. Your agent reads AGENTS.md / CLAUDE.md for the Terse spec.\n')
}

// npm runs bins through a symlink in node_modules/.bin, so compare real paths.
if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(`create-terse-app: ${e.message}`)
    process.exit(1)
  })
}
