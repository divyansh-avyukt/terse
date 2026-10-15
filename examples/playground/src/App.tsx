import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import DashboardPage from '@/pages/DashboardPage'
import SettingsPage from '@/pages/SettingsPage'
import LoginPage from '@/pages/LoginPage'
import WeatherTsx from '@/pages/WeatherTsx'
import Weather from '@/pages/weather.terse'

const PAGES = { dashboard: DashboardPage, settings: SettingsPage, login: LoginPage, 'weather-tsx': WeatherTsx, 'weather-terse': Weather }

type PageKey = keyof typeof PAGES
const pageFromPath = (): PageKey => {
  const p = location.pathname.slice(1)
  return p in PAGES ? (p as PageKey) : 'dashboard'
}

export default function App() {
  const [page, setPageState] = useState<PageKey>(pageFromPath)
  const setPage = (p: PageKey) => {
    history.pushState(null, '', `/${p}`)
    setPageState(p)
  }
  useEffect(() => {
    const onPop = () => setPageState(pageFromPath())
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  const Page = PAGES[page]
  return (
    <div className="flex min-h-screen">
      <nav className="flex w-48 shrink-0 flex-col gap-1 border-r p-3">
        {(Object.keys(PAGES) as PageKey[]).map((p) => (
          <Button key={p} variant={p === page ? 'secondary' : 'ghost'} size="sm" onClick={() => setPage(p)} className="justify-start capitalize">
            {p}
          </Button>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        <Page />
      </div>
    </div>
  )
}
