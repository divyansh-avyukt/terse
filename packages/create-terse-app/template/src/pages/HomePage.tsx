import { useState } from 'react'
import Home from '@/views/pages/Home.terse'

// A container: TSX owns state, data and handlers, and passes them to the .terse view as props.
const ORDERS = [
  { id: '#1043', customer: 'Ada Lovelace', status: 'Paid', total: '$1,280.00' },
  { id: '#1042', customer: 'Alan Turing', status: 'Pending', total: '$64.00' },
  { id: '#1041', customer: 'Grace Hopper', status: 'Paid', total: '$320.00' },
]

export default function HomePage() {
  const [name, setName] = useState('')
  const [refreshes, setRefreshes] = useState(0)

  return (
    <Home
      greeting={name ? `Hello, ${name}.` : 'Type your name to say hello.'}
      name={name}
      onName={setName}
      stats={{ revenue: '$12,480', orders: String(128 + refreshes), customers: '73' }}
      orders={ORDERS}
      onRefresh={() => setRefreshes((n) => n + 1)}
    />
  )
}
