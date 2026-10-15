import stats from 'virtual:terse-stats'
import { useEffect, useState, type ComponentType } from 'react'
import { CodeBlock } from '@/components/ui/code-block'
import { CLAUDE_MD, CONTAINER, FIRST_VIEW, GITHUB, INSTALL, PROMPT, TERSE_CONFIG, VIEW, VITE_CONFIG } from '@/content'
import Adapters from '@/views/sections/Adapters.terse'
import Benchmarks from '@/views/sections/Benchmarks.terse'
import Errors from '@/views/sections/Errors.terse'
import Footer from '@/views/sections/Footer.terse'
import ForAgents from '@/views/sections/ForAgents.terse'
import GetStarted from '@/views/sections/GetStarted.terse'
import Guardrails from '@/views/sections/Guardrails.terse'
import Hero from '@/views/sections/Hero.terse'
import HowItWorks from '@/views/sections/HowItWorks.terse'
import Interop from '@/views/sections/Interop.terse'
import Manifesto from '@/views/sections/Manifesto.terse'
import Nav from '@/views/sections/Nav.terse'
import Problem from '@/views/sections/Problem.terse'

// Each section's own source, for view-source mode.
const SOURCES = import.meta.glob<string>('./views/sections/*.terse', { query: '?raw', import: 'default', eager: true })
const source = (name: string) => SOURCES[`./views/sections/${name}.terse`]
const fmt = (n: number) => n.toLocaleString('en-US')

/** Copy text; the label reads "Copied" for a moment. */
function useCopy(label: string, text: string) {
  const [copied, setCopied] = useState(false)
  return [
    copied ? 'Copied ✓' : label,
    () => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    },
  ] as const
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') ? localStorage.getItem('theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {}
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

/** The landing page container: every section is a .terse view; this file only owns state and data. */
export default function App() {
  const [viewSource, setViewSource] = useState(false)
  const [dark, toggleTheme] = useTheme()
  const [promptLabel, copyPrompt] = useCopy('Copy the agent prompt', PROMPT)
  const [claudeLabel, copyClaude] = useCopy('Copy for CLAUDE.md', CLAUDE_MD)
  const s = stats.snippets

  const sections: [string, ComponentType<any>, object][] = [
    ['Hero', Hero, { copyLabel: promptLabel, onCopyPrompt: copyPrompt }],
    ['Problem', Problem, {}],
    ['HowItWorks', HowItWorks, { step1: s.step, step2: s.stepError, step3: s.stepTsx }],
    [
      'Benchmarks',
      Benchmarks,
      {
        rows: stats.benchmarks,
        saved: `${stats.total.saved}%`,
        pair: `${fmt(stats.total.terse)} vs ${fmt(stats.total.tsx)}`,
        weather: `${fmt(stats.weather.terse.tokens)} vs ${fmt(stats.weather.tsx.tokens)}`,
      },
    ],
    ['Errors', Errors, { bad: s.typo, error: s.typoError, fixed: s.typoFixed }],
    ['Guardrails', Guardrails, { snippet: s.token, error: s.tokenError }],
    ['Interop', Interop, { container: CONTAINER, view: VIEW }],
    ['Adapters', Adapters, { config: TERSE_CONFIG }],
    ['ForAgents', ForAgents, { claudeMd: CLAUDE_MD, claudeLabel, onCopyClaude: copyClaude, promptLabel, onCopyPrompt: copyPrompt }],
    ['Manifesto', Manifesto, {}],
    ['GetStarted', GetStarted, { install: INSTALL, config: VITE_CONFIG, first: FIRST_VIEW, github: GITHUB }],
    [
      'Footer',
      Footer,
      { pageStats: `This page is ${Object.keys(stats.sections).length} Terse views: ${fmt(stats.page.lines)} lines, ${fmt(stats.page.tokens)} tokens.`, github: GITHUB },
    ],
  ]

  return (
    <>
      <a href="#why" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:p-3">
        Skip to content
      </a>
      {/* ponytail: hides two secondary nav links on phones from here; switch to Terse's `hide=mobile` once landing-site merges with stress-test. */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur max-sm:[&_a[href='#benchmarks']]:hidden max-sm:[&_a[href='/llms.txt']]:hidden">
        <Nav
          sourceLabel={viewSource ? 'View page' : 'View source'}
          onSource={() => setViewSource((v) => !v)}
          themeLabel={dark ? 'Light' : 'Dark'}
          onTheme={toggleTheme}
          github={GITHUB}
        />
      </header>
      <main>
        {viewSource && <SourceBlock name="Nav" />}
        {sections.map(([name, View, props]) => (viewSource ? <SourceBlock key={name} name={name} /> : <View key={name} {...props} />))}
      </main>
    </>
  )
}

function SourceBlock({ name }: { name: string }) {
  const s = stats.sections[name]
  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <CodeBlock code={source(name)} lang="terse" title={`views/sections/${name}.terse · ${s.lines} lines · ${fmt(s.tokens)} tokens`} />
    </div>
  )
}
