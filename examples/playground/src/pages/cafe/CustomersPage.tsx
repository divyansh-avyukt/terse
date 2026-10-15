import { useMemo, useState } from 'react'
import { customers } from '@/app/data'
import { customerSummary, initials, money, TIER_TONE, when } from '@/app/format'
import { navigate } from '@/app/router'
import Customers from '@/views/cafe/pages/Customers.terse'

type View = 'grid' | 'list'

function savedView(): View {
  try {
    return localStorage.getItem('customers-view') === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export default function CustomersPage() {
  const [view, setView] = useState<View>(savedView)
  const [search, setSearch] = useState('')

  const rows = useMemo(
    () =>
      customers
        .map((c) => ({ c, s: customerSummary(c) }))
        .sort((a, b) => b.s.spent - a.s.spent)
        .map(({ c, s }) => ({
          name: c.name,
          email: c.email,
          initials: initials(c.name),
          tier: c.tier,
          tierTone: TIER_TONE[c.tier],
          visitCount: s.visits,
          visits: `${s.visits} visit${s.visits === 1 ? '' : 's'}`,
          spent: money(s.spent),
          lastVisit: s.last ? when(s.last) : 'No visits yet',
          onOpen: () => navigate(`/customers/${c.id}`),
        })),
    [],
  )
  const q = search.trim().toLowerCase()
  const shown = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.includes(q)) : rows

  return (
    <Customers
      customers={shown}
      count={`${shown.length} of ${rows.length} customers, by total spend`}
      search={search}
      onSearch={setSearch}
      view={view}
      isGrid={view === 'grid'}
      onView={(v: View) => {
        setView(v)
        try {
          localStorage.setItem('customers-view', v)
        } catch {}
      }}
    />
  )
}
