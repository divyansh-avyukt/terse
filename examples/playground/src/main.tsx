import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppShell from './pages/cafe/AppShell'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The cafe dashboard is the app; the earlier demo pages live under /demo. */}
    {location.pathname.startsWith('/demo') ? <App /> : <AppShell />}
  </StrictMode>,
)
