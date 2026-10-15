import { useEffect, useMemo, useState } from 'react'
import { currentUser, notificationCount, stores } from '@/app/data'
import { initials } from '@/app/format'
import { navigate, useRoute, type Route } from '@/app/router'
import Layout from '@/views/cafe/Layout.terse'
import OverviewPage from './OverviewPage'

const TITLES: Record<Route['name'], string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  customers: 'Customers',
  customer: 'Customer',
  menu: 'Menu',
  settings: 'Settings',
}

/** ?theme=dark|light (screenshots) beats the saved choice, which beats the OS setting. */
function initialDark() {
  const param = new URLSearchParams(location.search).get('theme')
  if (param) return param === 'dark'
  try {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
  } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches
}

export default function AppShell() {
  const route = useRoute()
  const [dark, setDark] = useState(initialDark)
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [store, setStore] = useState(stores[0].id)
  const [search, setSearch] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const go = useMemo(() => {
    const to = (path: string) => () => {
      setDrawerOpen(false)
      navigate(path)
    }
    return { overview: to('/'), transactions: to('/transactions'), customers: to('/customers'), menu: to('/menu'), settings: to('/settings') }
  }, [])

  const section = route.name === 'customer' ? 'customers' : route.name
  const page = <OverviewPage store={store} />

  return (
    <Layout
      nav={{ [section]: true }}
      go={go}
      title={TITLES[route.name]}
      content={page}
      collapsed={collapsed}
      onCollapse={() => setCollapsed((c) => !c)}
      drawerOpen={drawerOpen}
      onDrawer={setDrawerOpen}
      onMenu={() => setDrawerOpen(true)}
      stores={stores.map((s) => ({ value: s.id, label: s.name }))}
      store={store}
      onStore={setStore}
      search={search}
      onSearch={(q: string) => {
        setSearch(q)
        if (route.name !== 'transactions') navigate('/transactions')
      }}
      notifications={notificationCount}
      dark={dark}
      onTheme={() => {
        const next = !dark
        setDark(next)
        try {
          localStorage.setItem('theme', next ? 'dark' : 'light')
        } catch {}
      }}
      user={{ ...currentUser, initials: initials(currentUser.name) }}
      onProfile={go.settings}
      onBilling={go.settings}
      onSignOut={() => navigate('/')}
    />
  )
}
