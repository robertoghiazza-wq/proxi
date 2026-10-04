// Shell mobile: contenuto scrollabile + tab bar fissa in basso
// Nessun FAB volante — ogni schermata ha il proprio pulsante contestuale nell'header

import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Calendar, MapPin, User } from 'lucide-react'

const TABS = [
  { path: '/',        icon: Home,     label: 'Oggi'    },
  { path: '/persone', icon: Users,    label: 'Persone' },
  { path: '/eventi',  icon: Calendar, label: 'Eventi'  },
  { path: '/luoghi',  icon: MapPin,   label: 'Luoghi'  },
  { path: '/profilo', icon: User,     label: 'Io'      },
]

interface MobileLayoutProps {
  children: React.ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const navigate      = useNavigate()
  const { pathname }  = useLocation()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100svh', background: 'var(--prox-bg)',
      width: '100%',
    }}>
      {/* Contenuto scrollabile — padding bottom = altezza tab bar */}
      <div style={{ flex: 1, paddingBottom: 60 }}>
        {children}
      </div>

      {/* Tab bar — full width, sempre in fondo */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.92)',
        borderTop: '1px solid var(--prox-line)',
        display: 'flex',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}>
        {TABS.map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1, padding: '8px 4px 7px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: active ? 'var(--prox-accent)' : 'var(--prox-ink3)',
                transition: 'color 0.15s',
                minWidth: 0,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.75} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500 }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
