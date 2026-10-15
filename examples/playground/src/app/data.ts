// Mock data for the Brewpay cafe dashboard. Seeded, so every reload (and every screenshot) is identical.

export type Method = 'Palm' | 'UPI' | 'Card' | 'Cash'
export type Status = 'Success' | 'Failed' | 'Refunded'

export interface Store {
  id: string
  name: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  joined: string // ISO date
  tier: 'VIP' | 'Regular' | 'New'
  palmEnrolled: boolean
  notes: { id: string; text: string; at: string; author: string }[]
}

export interface MenuItem {
  id: string
  name: string
  category: 'Coffee' | 'Tea' | 'Cold drinks' | 'Bakery' | 'Food'
  price: number
  available: boolean
  soldToday: number
  description: string
  image: string
}

export interface Transaction {
  id: string
  time: string // ISO
  customerId: string
  storeId: string
  method: Method
  status: Status
  items: { itemId: string; qty: number }[]
  amount: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Manager' | 'Barista'
}

/** "Now" for the whole app, so relative dates don't drift. */
export const NOW = new Date('2026-10-15T18:30:00+05:30')

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261015)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
const daysAgo = (d: number, hour = 9, min = 0) => {
  const t = new Date(NOW)
  t.setDate(t.getDate() - d)
  t.setHours(hour, min, 0, 0)
  return t
}

export const stores: Store[] = [
  { id: 'indiranagar', name: 'Indiranagar' },
  { id: 'koramangala', name: 'Koramangala' },
  { id: 'hsr', name: 'HSR Layout' },
]

export const menu: MenuItem[] = [
  { id: 'm01', name: 'Filter Coffee', category: 'Coffee', price: 120, description: 'South Indian decoction with chicory, frothed with hot milk.' },
  { id: 'm02', name: 'Cappuccino', category: 'Coffee', price: 180, description: 'Double shot, steamed milk, thick foam.' },
  { id: 'm03', name: 'Flat White', category: 'Coffee', price: 200, description: 'Ristretto shots with silky microfoam.' },
  { id: 'm04', name: 'Americano', category: 'Coffee', price: 160, description: 'Espresso lengthened with hot water.' },
  { id: 'm05', name: 'Mocha', category: 'Coffee', price: 220, description: 'Espresso, dark chocolate and steamed milk.' },
  { id: 'm06', name: 'Masala Chai', category: 'Tea', price: 90, description: 'Assam tea brewed with ginger, cardamom and clove.' },
  { id: 'm07', name: 'Green Tea', category: 'Tea', price: 110, description: 'Darjeeling first flush, served in a pot.' },
  { id: 'm08', name: 'Matcha Latte', category: 'Tea', price: 240, description: 'Ceremonial-grade matcha with oat milk.' },
  { id: 'm09', name: 'Cold Brew', category: 'Cold drinks', price: 210, description: 'Steeped 18 hours, served over ice.' },
  { id: 'm10', name: 'Iced Latte', category: 'Cold drinks', price: 200, description: 'Double shot over ice and cold milk.' },
  { id: 'm11', name: 'Lemon Iced Tea', category: 'Cold drinks', price: 150, description: 'Black tea, fresh lemon, a little mint.' },
  { id: 'm12', name: 'Mango Smoothie', category: 'Cold drinks', price: 230, description: 'Alphonso mango, yoghurt and honey.' },
  { id: 'm13', name: 'Butter Croissant', category: 'Bakery', price: 140, description: 'Laminated in-house every morning.' },
  { id: 'm14', name: 'Almond Croissant', category: 'Bakery', price: 180, description: 'Twice-baked with frangipane.' },
  { id: 'm15', name: 'Banana Bread', category: 'Bakery', price: 120, description: 'Walnuts, brown butter, a slice.' },
  { id: 'm16', name: 'Blueberry Muffin', category: 'Bakery', price: 130, description: 'Crumb-topped, blueberries throughout.' },
  { id: 'm17', name: 'Avocado Toast', category: 'Food', price: 320, description: 'Sourdough, smashed avocado, chilli flakes.' },
  { id: 'm18', name: 'Paneer Sandwich', category: 'Food', price: 260, description: 'Tandoori paneer, mint chutney, on focaccia.' },
  { id: 'm19', name: 'Masala Omelette', category: 'Food', price: 220, description: 'Three eggs, onion, green chilli, toast.' },
  { id: 'm20', name: 'Granola Bowl', category: 'Food', price: 280, description: 'House granola, yoghurt, seasonal fruit.' },
].map((m) => ({
  ...(m as Omit<MenuItem, 'available' | 'soldToday' | 'image'>),
  available: rand() > 0.15,
  soldToday: between(4, 96),
  image: '',
}))

const FIRST = ['Aarav', 'Diya', 'Ishaan', 'Ananya', 'Kabir', 'Meera', 'Rohan', 'Saanvi', 'Vihaan', 'Aditi', 'Arjun', 'Kavya', 'Neel', 'Priya', 'Reyansh', 'Tara', 'Dev', 'Nisha', 'Karan', 'Zara', 'Aditya', 'Riya', 'Siddharth', 'Pooja', 'Varun']
const LAST = ['Sharma', 'Iyer', 'Reddy', 'Nair', 'Mehta', 'Kapoor', 'Rao', 'Menon', 'Gupta', 'Das', 'Pillai', 'Shetty', 'Bose', 'Kulkarni', 'Hegde', 'Joshi', 'Khan', 'Fernandes']
const NOTES = [
  'Prefers oat milk in everything.',
  'Regular at the 8am rush; usually orders ahead.',
  'Asked about bulk orders for office events.',
  'Allergic to nuts: flag almond croissant.',
  'Enrolled in palm pay after a demo at the counter.',
  'Complained about wait time on a Saturday; offered a free refill.',
]
const AUTHORS = ['Ritu (Manager)', 'Sameer (Barista)', 'Anjali (Owner)']

export const customers: Customer[] = Array.from({ length: 50 }, (_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = pick(LAST)
  const joinedDaysAgo = between(3, 720)
  const noteCount = rand() < 0.4 ? between(1, 3) : 0
  return {
    id: `C${String(1001 + i)}`,
    name: `${first} ${last}`,
    email: `${first}.${last}`.toLowerCase() + '@example.com',
    phone: `+91 9${between(100000000, 999999999)}`,
    joined: daysAgo(joinedDaysAgo).toISOString(),
    tier: joinedDaysAgo < 30 ? 'New' : rand() < 0.2 ? 'VIP' : 'Regular',
    palmEnrolled: rand() < 0.45,
    notes: Array.from({ length: noteCount }, (_, n) => ({
      id: `n${i}-${n}`,
      text: pick(NOTES),
      at: daysAgo(between(1, 60), between(8, 20)).toISOString(),
      author: pick(AUTHORS),
    })),
  }
})

const METHOD_WEIGHTS: [Method, number][] = [['UPI', 0.42], ['Card', 0.24], ['Palm', 0.22], ['Cash', 0.12]]
function weightedMethod(palm: boolean): Method {
  if (palm && rand() < 0.6) return 'Palm'
  let r = rand()
  for (const [m, w] of METHOD_WEIGHTS) if ((r -= w) < 0) return m
  return 'UPI'
}

// ~200 transactions over the last 14 days; the busiest customers repeat.
export const transactions: Transaction[] = Array.from({ length: 204 }, (_, i): Transaction => {
  const customer = customers[rand() < 0.55 ? between(0, 14) : between(0, 49)]
  const lines = Array.from({ length: between(1, 3) }, () => ({ itemId: pick(menu).id, qty: rand() < 0.8 ? 1 : 2 }))
  const amount = lines.reduce((sum, l) => sum + menu.find((m) => m.id === l.itemId)!.price * l.qty, 0)
  const r = rand()
  return {
    id: `TX-${48210 + i}`,
    time: daysAgo(Math.floor((i / 204) * 14), between(7, 21), between(0, 59)).toISOString(),
    customerId: customer.id,
    storeId: pick(stores).id,
    method: weightedMethod(customer.palmEnrolled),
    status: r < 0.88 ? 'Success' : r < 0.95 ? 'Failed' : 'Refunded',
    items: lines,
    amount,
  }
}).sort((a, b) => b.time.localeCompare(a.time))

/** Chain-wide revenue per day, oldest first (the transaction list above is only a sample of it). */
export const dailyRevenue: { date: string; revenue: number; orders: number }[] = Array.from({ length: 180 }, (_, i) => {
  const d = daysAgo(179 - i)
  const weekend = d.getDay() === 0 || d.getDay() === 6
  const trend = 1 + i / 600
  const orders = Math.round((weekend ? 410 : 330) * trend * (0.85 + rand() * 0.3))
  return { date: d.toISOString(), orders, revenue: Math.round(orders * (178 + rand() * 24)) }
})

export const team: TeamMember[] = [
  { id: 'u1', name: 'Anjali Rao', email: 'anjali@brewpay.in', role: 'Owner' },
  { id: 'u2', name: 'Ritu Menon', email: 'ritu@brewpay.in', role: 'Manager' },
  { id: 'u3', name: 'Sameer Khan', email: 'sameer@brewpay.in', role: 'Barista' },
  { id: 'u4', name: 'Leela Das', email: 'leela@brewpay.in', role: 'Barista' },
]

export const currentUser = { name: 'Anjali Rao', email: 'anjali@brewpay.in', avatar: '' }

export const notificationCount = 3
