import { useMemo, useState } from 'react'
import { currentUser, customers, NOW } from '@/app/data'
import { customerSummary, initials, longDate, menuItem, money, shortDate, TIER_TONE, txRow } from '@/app/format'
import { navigate } from '@/app/router'
import { useTxSort } from '@/app/sort'
import CustomerDetail from '@/views/cafe/pages/CustomerDetail.terse'

const NOTE_MAX = 280
// Mon..Sun, matching the chart's x axis.
const weekday = (iso: string) => (new Date(iso).getDay() + 6) % 7
const ago = (iso: string) => {
  const days = Math.floor((NOW.getTime() - new Date(iso).getTime()) / 86400000)
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

export default function CustomerDetailPage({ id }: { id: string }) {
  const customer = customers.find((c) => c.id === id)
  const [tab, setTab] = useState('overview')
  const [notes, setNotes] = useState(() => customer?.notes ?? [])
  const [draft, setDraft] = useState('')
  const [noteError, setNoteError] = useState('')
  const { sort, sortBy, apply } = useTxSort()

  const view = useMemo(() => {
    if (!customer) return undefined
    const s = customerSummary(customer)
    const visits = [0, 0, 0, 0, 0, 0, 0]
    for (const t of s.paid) visits[weekday(t.time)]++
    const counts = new Map<string, number>()
    for (const t of s.paid) for (const l of t.items) counts.set(l.itemId, (counts.get(l.itemId) ?? 0) + l.qty)
    return {
      summary: s,
      stats: [
        { label: 'Visits', value: String(s.visits) },
        { label: 'Total spent', value: money(s.spent) },
        { label: 'Avg ticket', value: s.visits ? money(s.spent / s.visits) : '—' },
        { label: 'Last visit', value: s.last ? shortDate(s.last) : '—', delta: s.last ? ago(s.last) : undefined },
      ],
      visits,
      favorites: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([itemId, n]) => ({ name: menuItem(itemId).name, count: `${n} ordered` })),
    }
  }, [customer])

  const addNote = () => {
    const text = draft.trim()
    if (!text) return setNoteError('Write something before adding a note.')
    if (text.length > NOTE_MAX) return setNoteError(`Notes are limited to ${NOTE_MAX} characters (this one is ${text.length}).`)
    setNotes((ns) => [{ id: `new-${ns.length}`, text, at: new Date().toISOString(), author: currentUser.name }, ...ns])
    setDraft('')
    setNoteError('')
  }

  return (
    <CustomerDetail
      customer={
        customer && {
          name: customer.name,
          initials: initials(customer.name),
          joined: `Customer since ${longDate(customer.joined)} · ${customer.email}`,
          tier: customer.tier,
          tierTone: TIER_TONE[customer.tier],
          palmEnrolled: customer.palmEnrolled,
          phone: customer.phone,
        }
      }
      onBack={() => navigate('/customers')}
      tab={tab}
      onTab={setTab}
      stats={view?.stats}
      visits={view?.visits}
      favorites={view?.favorites ?? []}
      rows={view ? apply(view.summary.txs).map((t) => txRow(t, () => navigate(`/transactions?tx=${t.id}`))) : []}
      sort={sort}
      sortBy={sortBy}
      notes={notes.map((n) => ({ text: n.text, meta: `${n.author.split(' (')[0]} · ${shortDate(n.at)}` }))}
      draft={draft}
      onDraft={(v: string) => {
        setDraft(v)
        if (noteError) setNoteError('')
      }}
      noteError={noteError}
      onAddNote={addNote}
    />
  )
}
