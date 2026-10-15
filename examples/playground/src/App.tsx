import { useState } from 'react'
import { Button } from '@/components/ui/button'
import DashboardContainer from '@/pages/DashboardContainer'
import SettingsPage from '@/pages/SettingsPage'

const PAGES = { dashboard: DashboardContainer, settings: SettingsPage }

export default function App() {
  const [page, setPage] = useState<keyof typeof PAGES>('dashboard')
  const Page = PAGES[page]
  return (
    <div className="min-h-screen">
      <nav className="flex gap-2 border-b px-6 py-3">
        {(Object.keys(PAGES) as (keyof typeof PAGES)[]).map((p) => (
          <Button key={p} variant={p === page ? 'secondary' : 'ghost'} size="sm" onClick={() => setPage(p)} className="capitalize">
            {p}
          </Button>
        ))}
      </nav>
      <Page />
    </div>
  )
}
