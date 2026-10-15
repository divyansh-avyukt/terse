// Formatting and derivations shared by the containers. Views receive these finished strings.
import { customers, menu, NOW, type Customer, type Status, type Transaction } from './data'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const money = (n: number) => inr.format(n)
export const compactMoney = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : money(n))

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
export const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
export const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
export const dateTime = (iso: string) => `${shortDate(iso)}, ${clock(iso)}`

/** "Today, 4:05 pm" / "Yesterday, …" / "12 Oct, …" relative to the app's fixed NOW. */
export function when(iso: string) {
  const day = (d: Date) => Math.floor(d.getTime() / 86400000 - d.getTimezoneOffset() / 1440)
  const diff = day(NOW) - day(new Date(iso))
  return `${diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : shortDate(iso)}, ${clock(iso)}`
}

export const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const pct = (n: number, digits = 1) => `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`

/** The status → badge colour mapping. Terse has no equality test, so it lives here. */
export const STATUS_TONE: Record<Status, string> = { Success: 'success', Failed: 'destructive', Refunded: 'warning' }

const customerById = new Map(customers.map((c) => [c.id, c]))
const menuById = new Map(menu.map((m) => [m.id, m]))
export const customerOf = (t: Transaction): Customer => customerById.get(t.customerId)!
export const menuItem = (id: string) => menuById.get(id)!

/** A transaction as table/list rows show it. */
export function txRow(t: Transaction, onOpen: () => void) {
  const c = customerOf(t)
  return {
    id: t.id,
    time: when(t.time),
    customer: c.name,
    initials: initials(c.name),
    method: t.method,
    amount: money(t.amount),
    status: t.status,
    tone: STATUS_TONE[t.status],
    onOpen,
  }
}
