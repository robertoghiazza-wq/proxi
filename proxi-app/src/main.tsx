import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { applyTenantTheme } from './lib/theme'

try {
  const accent = localStorage.getItem('proxi_accent')
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) applyTenantTheme(accent)
} catch { /* ignora */ }

registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => { reg.update().catch(() => {}) }
    setInterval(check, 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
