import stats from 'virtual:terse-stats'

const { anatomy: a, total } = stats
const pct = (n: number) => `${((100 * n) / a.total).toFixed(0)}%`
const fmt = (n: number) => n.toLocaleString('en-US')

const SEGMENTS = [
  { label: 'Class names', value: a.classNames, className: 'bg-foreground/55' },
  { label: 'Imports', value: a.imports, className: 'bg-foreground/40' },
  { label: 'Prop types', value: a.types, className: 'bg-foreground/30' },
  { label: 'Closing tags', value: a.closingTags, className: 'bg-foreground/20' },
  { label: 'Everything else', value: a.rest, className: 'bg-foreground/[0.08]' },
]

/** Where the tokens in hand-written TSX go, next to the same five screens in Terse. */
export default function TokenAnatomy() {
  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-xs text-muted-foreground">
          <span>Hand-written TSX · 5 screens</span>
          <span className="tabular-nums">{fmt(a.total)} tokens</span>
        </div>
        <div className="flex h-9 w-full overflow-hidden rounded-lg" role="img" aria-label={SEGMENTS.map((s) => `${s.label} ${pct(s.value)}`).join(', ')}>
          {SEGMENTS.map((s) => (
            <div key={s.label} className={s.className} style={{ width: pct(s.value) }} title={`${s.label}: ${fmt(s.value)} tokens`} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-xs text-muted-foreground">
          <span>The same screens in Terse</span>
          <span className="tabular-nums text-primary">{fmt(total.terse)} tokens</span>
        </div>
        <div className="h-9 rounded-lg bg-primary" style={{ width: `${(100 * total.terse) / a.total}%` }} />
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {SEGMENTS.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className={`size-2.5 rounded-sm ${s.className}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono tabular-nums">{pct(s.value)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Measured across the five benchmark screens with <code className="font-mono">o200k_base</code>. Class names, imports, prop types and closing tags
        alone are {pct(a.classNames + a.imports + a.types + a.closingTags)} of the TSX. Terse has no class names, prop types or closing tags, and only imports your own components.
      </p>
    </div>
  )
}
