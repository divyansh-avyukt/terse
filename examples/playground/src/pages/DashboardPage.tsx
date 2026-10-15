import { useCallback, useEffect, useState } from 'react'
import { fetchDashboard } from '@/api'
import Dashboard from '@/views/pages/Dashboard.terse'

type Data = Awaited<ReturnType<typeof fetchDashboard>>

/** TSX owns state and fetching; the .terse view only renders what it is given. */
export default function DashboardPage() {
  const [data, setData] = useState<Data>()
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setData(await fetchDashboard())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return <Dashboard user={data?.user} stats={data?.stats} orders={data?.orders} loading={loading} onRefresh={refresh} />
}
