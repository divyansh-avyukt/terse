import { useMemo, useState } from 'react'
import { dailyRevenue, NOW, stores, transactions, type Method } from '@/app/data'
import { compactMoney, menuItem, money, pct, shortDate, txRow } from '@/app/format'
import { navigate } from '@/app/router'
import Overview from '@/views/cafe/pages/Overview.terse'

const METHODS: Method[] = ['Palm', 'UPI', 'Card', 'Cash']
const RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const
// Daily revenue is chain-wide; each store's share of it.
const STORE_SHARE: Record<string, number> = { indiranagar: 0.41, koramangala: 0.34, hsr: 0.25 }
const DAY = 86400000

const delta = (now: number, before: number) => {
  const change = before ? ((now - before) / before) * 100 : 0
  return { delta: `${pct(change)} vs last week`, tone: change >= 0 ? 'success' : 'destructive' }
}

export default function OverviewPage({ store }: { store: string }) {
  const [range, setRange] = useState<keyof typeof RANGES>('30d')

  const view = useMemo(() => {
    const share = STORE_SHARE[store] ?? 1 / stores.length
    const days = dailyRevenue.map((d) => ({ ...d, revenue: Math.round(d.revenue * share), orders: Math.round(d.orders * share) }))
    const sum = (xs: typeof days, k: 'revenue' | 'orders') => xs.reduce((s, d) => s + d[k], 0)
    const week = days.slice(-7)
    const prev = days.slice(-14, -7)
    const [rev, prevRev, orders, prevOrders] = [sum(week, 'revenue'), sum(prev, 'revenue'), sum(week, 'orders'), sum(prev, 'orders')]

    const storeTx = transactions.filter((t) => t.storeId === store)
    const cutoff = NOW.getTime() - 7 * DAY
    const recentTx = storeTx.filter((t) => new Date(t.time).getTime() >= cutoff)
    const olderTx = storeTx.filter((t) => new Date(t.time).getTime() < cutoff)
    const repeatRate = (txs: typeof storeTx, seenBefore: Set<string>) => {
      const ids = new Set(txs.map((t) => t.customerId))
      return ids.size ? ([...ids].filter((id) => seenBefore.has(id)).length / ids.size) * 100 : 0
    }
    const repeat = repeatRate(recentTx, new Set(olderTx.map((t) => t.customerId)))
    const prevRepeat = repeatRate(olderTx, new Set(olderTx.slice(Math.floor(olderTx.length / 2)).map((t) => t.customerId)))

    const ok = recentTx.filter((t) => t.status === 'Success')
    const methods = METHODS.map((m) => Math.round((ok.filter((t) => t.method === m).length / Math.max(ok.length, 1)) * 100))

    const byItem = new Map<string, { sold: number; revenue: number }>()
    for (const t of ok) {
      for (const line of t.items) {
        const agg = byItem.get(line.itemId) ?? { sold: 0, revenue: 0 }
        agg.sold += line.qty
        agg.revenue += line.qty * menuItem(line.itemId).price
        byItem.set(line.itemId, agg)
      }
    }
    const total = [...byItem.values()].reduce((s, x) => s + x.revenue, 0)
    const topItems = [...byItem.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, x]) => ({ name: menuItem(id).name, sold: x.sold, revenue: money(x.revenue), share: Math.round((x.revenue / total) * 100) }))

    return {
      days,
      kpis: [
        { label: 'Revenue (7d)', value: compactMoney(rev), ...delta(rev, prevRev) },
        { label: 'Transactions', value: orders.toLocaleString('en-IN'), ...delta(orders, prevOrders) },
        { label: 'Avg ticket', value: money(rev / orders), ...delta(rev / orders, prevRev / prevOrders) },
        { label: 'Repeat customers', value: `${repeat.toFixed(0)}%`, delta: `${pct(repeat - prevRepeat)} pts vs last week`, tone: repeat >= prevRepeat ? 'success' : 'destructive' },
      ],
      methods,
      topItems,
      recent: storeTx.slice(0, 8).map((t) => txRow(t, () => navigate(`/transactions?tx=${t.id}`))),
    }
  }, [store])

  const shown = view.days.slice(-RANGES[range])
  return (
    <Overview
      kpis={view.kpis}
      range={range}
      onRange={(r: string) => setRange(r as keyof typeof RANGES)}
      revenue={{
        caption: `${compactMoney(shown.reduce((s, d) => s + d.revenue, 0))} over the last ${RANGES[range]} days`,
        labels: shown.map((d) => shortDate(d.date)),
        values: shown.map((d) => d.revenue),
      }}
      methods={view.methods}
      topItems={view.topItems}
      recent={view.recent}
    />
  )
}
