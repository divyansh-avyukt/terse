import { useEffect, useState } from 'react'

export type Route =
  | { name: 'overview' }
  | { name: 'transactions'; tx?: string }
  | { name: 'customers' }
  | { name: 'customer'; id: string }
  | { name: 'menu' }
  | { name: 'settings' }

export function parse(path: string, search = ''): Route {
  const parts = path.split('/').filter(Boolean)
  const query = new URLSearchParams(search)
  if (parts[0] === 'transactions') return { name: 'transactions', tx: query.get('tx') ?? undefined }
  if (parts[0] === 'customers' && parts[1]) return { name: 'customer', id: parts[1] }
  if (parts[0] === 'customers') return { name: 'customers' }
  if (parts[0] === 'menu') return { name: 'menu' }
  if (parts[0] === 'settings') return { name: 'settings' }
  return { name: 'overview' }
}

export function navigate(to: string) {
  history.pushState(null, '', to)
  dispatchEvent(new PopStateEvent('popstate'))
}

export function useRoute(): Route {
  const read = () => parse(location.pathname, location.search)
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onPop = () => setRoute(read())
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  return route
}
