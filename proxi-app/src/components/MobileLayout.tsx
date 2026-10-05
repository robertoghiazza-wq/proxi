import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Calendar, MapPin, User } from 'lucide-react'
import { useIsDesktop } from '../hooks/useIsDesktop'

const TABS = [
  { path: '/',        icon: Home,     label: 'Oggi'    },
  { path: '/persone', icon: Users,    label: 'Persone' },
  { path: '/eventi',  icon: Calendar, label: 'Eventi'  },
  { path: '/luoghi',  icon: MapPin,   label: 'Luoghi'  },
  { path: '/profilo', icon: User,     label: 'Profilo' },
]

// I servizi stanno nella tab Persone
function tabAttiva(pathname: string, path: string): boolean {
  if (path === '/persone' && (pathname === '/servizi' || pathname.startsWith('/servizi/'))) return true
  return pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
}

interface MobileLayoutProps {
  children: React.ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const isDesktop    = useIsDesktop()

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100dvh', background: 'var(--prox-bg)' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: 'var(--prox-surface)',
          borderRight: '1px solid var(--prox-line)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Logo */}
          <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--prox-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--prox-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>P</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--prox-ink)', lineHeight: 1 }}>Proxi</div>
                <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginTop: 2 }}>Prometheus</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === '/'
                ? pathname === '/'
                : tabAttiva(pathname, path)
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: active ? 'var(--prox-accent-soft)' : 'none',
                    border: 'none', cursor: 'pointer', width: '100%',
                    color: active ? 'var(--prox-accent)' : 'var(--prox-ink2)',
                    fontSize: 13.5, fontWeight: active ? 600 : 500,
                    transition: 'background 0.12s',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.75} />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Footer sidebar */}
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--prox-line)',
            fontSize: 11, color: 'var(--prox-ink3)',
          }}>
            Proxi v0.1.0-dev
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{
          flex: 1, overflowY: 'auto',
          position: 'relative',
          minWidth: 0,
          background: 'var(--prox-bg)',
        }}>
          {children}
        </main>
      </div>
    )
  }

  // ── Mobile ──
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100svh', background: 'var(--prox-bg)',
      width: '100%',
    }}>
      <div style={{ flex: 1, paddingBottom: 'calc(60px + var(--sab))' }}>
        {children}
      </div>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.92)',
        borderTop: '1px solid var(--prox-line)',
        display: 'flex',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99,
        paddingBottom: 'var(--sab)',
      }}>
        {TABS.map(({ path, icon: Icon, label }) => {
          const active = tabAttiva(pathname, path)
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
