// Fake backend so the playground runs offline.
export interface User {
  name: string
  email: string
  role: string
  plan: string
}

const user: User = { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', plan: 'Pro plan' }

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function fetchDashboard() {
  await delay(500)
  const n = Math.floor(Math.random() * 50)
  return {
    user,
    stats: {
      revenue: `$${(45231 + n * 97).toLocaleString()}`,
      revenueDelta: '+20.1% from last month',
      orders: 2350 + n,
      ordersDelta: '+180 since yesterday',
      customers: 573,
      topProducts: [
        { name: 'Aesthetic chair', sales: 412 },
        { name: 'Standing desk', sales: 301 },
        { name: 'Monitor arm', sales: 188 },
      ],
    },
    orders: [
      { id: `#${3210 + n}`, customer: 'Olivia Martin', status: 'Paid', total: '$1,999.00' },
      { id: '#3209', customer: 'Jackson Lee', status: 'Pending', total: '$39.00' },
      { id: '#3208', customer: 'Isabella Nguyen', status: 'Paid', total: '$299.00' },
      { id: '#3207', customer: 'William Kim', status: 'Refunded', total: '$99.00' },
    ],
  }
}

export async function fetchUser() {
  await delay(200)
  return user
}
