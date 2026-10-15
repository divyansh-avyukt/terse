import { useCallback, useEffect, useMemo, useState } from 'react'
import { stores, transactions, type Status, type Transaction } from '@/app/data'
import { customerOf, dateTime, longDate, menuItem, money, STATUS_TONE, txRow } from '@/app/format'
import { navigate } from '@/app/router'
import Transactions from '@/views/cafe/pages/Transactions.terse'

const PAGE_SIZE = 20
type SortKey = 'id' | 'time' | 'customer' | 'amount'
type Filters = { search: string; status: string; method: string; from: string; to: string }
const NO_FILTERS: Filters = { search: '', status: 'All', method: 'All', from: '', to: '' }

const SORTERS: Record<SortKey, (a: Transaction, b: Transaction) => number> = {
  id: (a, b) => a.id.localeCompare(b.id),
  time: (a, b) => a.time.localeCompare(b.time),
  customer: (a, b) => customerOf(a).name.localeCompare(customerOf(b).name),
  amount: (a, b) => a.amount - b.amount,
}

/** Fake fetch. `?state=loading` never resolves and `?state=error` fails the first load, for screenshots. */
function useTransactions() {
  const mode = new URLSearchParams(location.search).get('state')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: Transaction[] }>({ loading: true })
  useEffect(() => {
    setState({ loading: true })
    if (mode === 'loading') return
    const timer = setTimeout(() => {
      setState(mode === 'error' && attempt === 0 ? { loading: false, error: 'The payments service timed out (504). Your data is safe.' } : { loading: false, data: transactions })
    }, 400)
    return () => clearTimeout(timer)
  }, [attempt, mode])
  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

/** The detail sheet's view of one transaction. */
function details(t: Transaction, status: Status) {
  const c = customerOf(t)
  const at = (secs: number) => dateTime(new Date(new Date(t.time).getTime() + secs * 1000).toISOString())
  const events = [
    { label: `Payment started (${t.method})`, time: at(0) },
    status === 'Failed' ? { label: 'Declined by issuer', time: at(4) } : { label: 'Authorized', time: at(3) },
    ...(status !== 'Failed' ? [{ label: `Settled to ${stores.find((s) => s.id === t.storeId)!.name}`, time: at(6) }] : []),
    ...(status === 'Refunded' ? [{ label: 'Refunded to customer', time: at(3600) }] : []),
  ]
  return {
    ...txRow(t, () => {}),
    status,
    tone: STATUS_TONE[status],
    email: c.email,
    date: `${longDate(t.time)}, ${dateTime(t.time).split(', ')[1]}`,
    store: stores.find((s) => s.id === t.storeId)!.name,
    lines: t.items.map((l) => ({ label: `${l.qty} × ${menuItem(l.itemId).name}`, total: money(l.qty * menuItem(l.itemId).price) })),
    events,
    cannotRefund: status !== 'Success',
  }
}

export default function TransactionsPage(props: { store: string; search: string; onSearch: (q: string) => void; openTx?: string }) {
  const { store, search, onSearch, openTx } = props
  const { loading, error, data, retry } = useTransactions()
  const [filters, setFilters] = useState<Omit<Filters, 'search'>>(NO_FILTERS)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'time', dir: 'desc' })
  const [page, setPage] = useState(0)
  const [refunded, setRefunded] = useState<Set<string>>(new Set())
  const statusOf = useCallback((t: Transaction): Status => (refunded.has(t.id) ? 'Refunded' : t.status), [refunded])

  const all: Filters = { ...filters, search }
  const set = (k: keyof Filters) => (v: string) => {
    setPage(0)
    if (k === 'search') onSearch(v)
    else setFilters((f) => ({ ...f, [k]: v }))
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = (data ?? []).filter((t) => {
      if (t.storeId !== store) return false
      if (q && !t.id.toLowerCase().includes(q) && !customerOf(t).name.toLowerCase().includes(q)) return false
      if (filters.status !== 'All' && statusOf(t) !== filters.status) return false
      if (filters.method !== 'All' && t.method !== filters.method) return false
      const day = t.time.slice(0, 10)
      if (filters.from && day < filters.from) return false
      if (filters.to && day > filters.to) return false
      return true
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return rows.sort((a, b) => SORTERS[sort.key](a, b) * dir)
  }, [data, store, search, filters, sort, statusOf])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const slice = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const selected = openTx ? transactions.find((t) => t.id === openTx) : undefined
  const open = (id?: string) => navigate(id ? `/transactions?tx=${id}` : '/transactions')

  const sortBy = Object.fromEntries(
    (Object.keys(SORTERS) as SortKey[]).map((key) => [key, () => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))]),
  )

  const download = (t: Transaction) => {
    const d = details(t, statusOf(t))
    const text = [`Brewpay receipt ${t.id}`, d.date, d.store, '', ...d.lines.map((l) => `${l.label}  ${l.total}`), '', `Total  ${d.amount}`, `Paid by ${t.method} (${d.status})`].join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: `${t.id}.txt` })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Transactions
      filters={all}
      onSearch={set('search')}
      onStatus={set('status')}
      onMethod={set('method')}
      onFrom={set('from')}
      onTo={set('to')}
      onClear={() => {
        setFilters(NO_FILTERS)
        onSearch('')
        setPage(0)
      }}
      noFilters={!search && JSON.stringify(filters) === JSON.stringify(NO_FILTERS)}
      loading={loading}
      error={error}
      onRetry={retry}
      empty={!filtered.length}
      rows={slice.map((t) => ({ ...txRow(t, () => open(t.id)), status: statusOf(t), tone: STATUS_TONE[statusOf(t)] }))}
      sort={{ [sort.key]: sort.dir }}
      sortBy={sortBy}
      showing={`Showing ${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + slice.length} of ${filtered.length}`}
      onPrev={() => setPage(current - 1)}
      onNext={() => setPage(current + 1)}
      noPrev={current === 0}
      noNext={current >= pages - 1}
      selected={selected && details(selected, statusOf(selected))}
      sheetOpen={!!selected}
      onSheetOpen={(o: boolean) => !o && open()}
      onRefund={() => selected && setRefunded((r) => new Set(r).add(selected.id))}
      onDownload={() => selected && download(selected)}
    />
  )
}
