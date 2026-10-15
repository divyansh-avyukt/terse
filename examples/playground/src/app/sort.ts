import { useState } from 'react'
import type { Transaction } from './data'
import { customerOf } from './format'

export type SortKey = 'id' | 'time' | 'customer' | 'amount'

const SORTERS: Record<SortKey, (a: Transaction, b: Transaction) => number> = {
  id: (a, b) => a.id.localeCompare(b.id),
  time: (a, b) => a.time.localeCompare(b.time),
  customer: (a, b) => customerOf(a).name.localeCompare(customerOf(b).name),
  amount: (a, b) => a.amount - b.amount,
}

/** Sort state for TransactionsTable: `sort` and `sortBy` are its props; clicking a column toggles desc ↔ asc. */
export function useTxSort(onChange?: () => void) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'time', dir: 'desc' })
  const sortBy = Object.fromEntries(
    (Object.keys(SORTERS) as SortKey[]).map((key) => [
      key,
      () => {
        onChange?.()
        setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))
      },
    ]),
  )
  const apply = (rows: Transaction[]) => [...rows].sort((a, b) => SORTERS[sort.key](a, b) * (sort.dir === 'asc' ? 1 : -1))
  return { sort: { [sort.key]: sort.dir }, sortBy, apply }
}
