import stats from 'virtual:terse-stats'
import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '@/components/ui/code-block'
import { cn } from '@/lib/utils'
// The hero demo is the playground's real weather screen, in both forms.
import Weather from '../../../examples/playground/src/pages/weather.terse'
import weatherTerse from '../../../examples/playground/src/pages/weather.terse?raw'
import weatherTsx from '../../../examples/playground/src/pages/WeatherTsx.tsx?raw'

type Stage = 'tsx' | 'terse' | 'ui'
const { weather } = stats
const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Counts from `from` to `to` when `to` changes. */
function useCount(to: number, ms = 1100) {
  const [n, setN] = useState(to)
  const from = useRef(to)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      setN(a + (to - a) * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return n
}

const TABS: { id: Stage; label: string; sub: string }[] = [
  { id: 'tsx', label: 'WeatherTsx.tsx', sub: `${weather.tsx.lines} lines` },
  { id: 'terse', label: 'weather.terse', sub: `${weather.terse.lines} lines` },
  { id: 'ui', label: 'Rendered', sub: 'same UI' },
]

/** Hero: the hand-written TSX collapses into the Terse source, then into the rendered screen. */
export default function Collapse() {
  const [stage, setStage] = useState<Stage>('tsx')
  const [auto, setAuto] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const count = useCount(stage === 'tsx' ? weather.tsx.tokens : weather.terse.tokens)

  // Play once when the demo scrolls into view; any click takes over.
  useEffect(() => {
    if (!auto || reducedMotion()) return
    let timers: number[] = []
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || timers.length) return
      timers = [window.setTimeout(() => setStage('terse'), 1800), window.setTimeout(() => setStage('ui'), 5200)]
    }, { threshold: 0.25 })
    io.observe(ref.current!)
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [auto])

  const pick = (s: Stage) => {
    setAuto(false)
    setStage(s)
  }
  const replay = () => {
    setStage('tsx')
    setAuto(false)
    setTimeout(() => setStage('terse'), 900)
    setTimeout(() => setStage('ui'), 4200)
  }

  return (
    <div ref={ref} className="w-full">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/5">
        <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
          <div className="flex gap-1.5 px-1" aria-hidden>
            <span className="size-3 rounded-full bg-muted-foreground/25" />
            <span className="size-3 rounded-full bg-muted-foreground/25" />
            <span className="size-3 rounded-full bg-muted-foreground/25" />
          </div>
          <div role="tablist" aria-label="Demo" className="flex flex-1 gap-1 overflow-x-auto max-sm:order-last max-sm:basis-full">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={stage === t.id}
                onClick={() => pick(t.id)}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs transition',
                  stage === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label} <span className="hidden opacity-60 sm:inline">· {t.sub}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-baseline gap-2 px-2 font-mono" aria-live="polite">
            <span className={cn('text-lg font-semibold tabular-nums transition-colors', stage === 'tsx' ? 'text-foreground' : 'text-primary')}>
              {fmt(count)}
            </span>
            <span className="text-xs text-muted-foreground">tokens</span>
            <span
              className={cn(
                'rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground transition-all duration-500',
                stage === 'tsx' ? 'scale-75 opacity-0' : 'scale-100 opacity-100',
              )}
            >
              −{weather.saved}%
            </span>
          </div>
        </div>

        <div className="relative h-[460px] sm:h-[540px]">
          <Pane active={stage === 'tsx'} leave="origin-top scale-y-[0.35] blur-sm">
            <CodeBlock code={weatherTsx} lang="tsx" className="h-full rounded-none border-0 bg-transparent" />
          </Pane>
          <Pane active={stage === 'terse'} leave="scale-[0.98]">
            <CodeBlock code={weatherTerse} lang="terse" className="h-full rounded-none border-0 bg-transparent" />
          </Pane>
          <Pane active={stage === 'ui'} leave="translate-y-4">
            <div className="text-left">
              <Weather />
            </div>
          </Pane>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Same UI, same React. <strong className="font-semibold text-foreground">{fmt(weather.tsx.tokens)} → {fmt(weather.terse.tokens)} tokens.</strong>
        </span>
        <button onClick={replay} className="font-medium text-primary underline-offset-4 hover:underline">
          Replay
        </button>
      </div>
    </div>
  )
}

function Pane({ active, leave, children }: { active: boolean; leave: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!active}
      inert={!active}
      className={cn(
        'absolute inset-0 overflow-auto transition-all duration-700 ease-out',
        active ? 'z-10 opacity-100' : cn('pointer-events-none opacity-0', leave),
      )}
    >
      {children}
    </div>
  )
}
