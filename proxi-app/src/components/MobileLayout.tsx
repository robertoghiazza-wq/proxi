import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Calendar, MapPin, User } from 'lucide-react'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useMe } from '../hooks/useAuth'
import { getCurrentUser } from '../lib/api-client'
import { ProxiLogo } from './ProxiLogo'
import { OrgLogo } from './OrgLogo'
import { Avatar } from './Avatar'

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
  const { data: me } = useMe()
  const ente         = me?.institution?.name
  const gestore      = ['coordinatore', 'admin'].includes(me?.role ?? getCurrentUser()?.role ?? '')
  // Su desktop il profilo è l'avatar a destra; le ore stanno nel menu per chi gestisce l'équipe
  const tabsDesktop  = [
    ...TABS.filter(t => t.path !== '/profilo'),
    ...(gestore ? [{ path: '/ore', label: 'Ore' }] : []),
  ]

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 4px)', background: 'var(--prox-bg)' }}>

        {/* ── Topbar (come nel design: logo Proxi | ente | navigazione | utente) ── */}
        <header style={{
          flexShrink: 0, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 16,
          borderBottom: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
        }}>
          <ProxiLogo height={26} />
          <div style={{ width: 1, height: 22, background: 'var(--prox-line)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <OrgLogo nome={ente} size={28} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1, color: 'var(--prox-ink)' }}>{ente ?? 'Proxi'}</div>
              <div style={{ fontSize: 10, color: 'var(--prox-ink3)', marginTop: 1 }}>Servizio di prossimità</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <nav style={{ display: 'flex', gap: 4 }}>
            {tabsDesktop.map(({ path, label }) => {
              const active = tabAttiva(pathname, path)
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: active ? 'var(--prox-accent-soft)' : 'transparent',
                    color: active ? 'var(--prox-accent-ink)' : 'var(--prox-ink2)',
                    fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: 'inherit',
                    transition: 'background 0.12s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div style={{ flex: 1 }} />

          <button
            onClick={() => navigate('/profilo')}
            title={me?.name ?? 'Profilo'}
            aria-label="Profilo"
            style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 2, borderRadius: '50%',
              outline: pathname.startsWith('/profilo') ? '2px solid var(--prox-accent)' : 'none', outlineOffset: 1,
            }}
          >
            <Avatar nome={me?.name} size={32} />
          </button>
        </header>

        {/* ── Contenuto ── */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', minWidth: 0, background: 'var(--prox-bg)' }}>
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
      {/* Contesto: sotto la fascia rossa della notch, logo Proxi e dell'ente (fissa in alto) */}
      <div style={{
        flexShrink: 0, height: 'var(--marchio)', padding: '0 16px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12,
        position: 'sticky', top: 'var(--sat)', zIndex: 11,
      }}>
        <ProxiLogo height={22} />
        <div style={{ width: 1, height: 22, background: 'var(--prox-line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <OrgLogo nome={ente} size={26} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1, color: 'var(--prox-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ente ?? 'Proxi'}</div>
            <div style={{ fontSize: 10, color: 'var(--prox-ink3)', marginTop: 1 }}>Servizio di prossimità</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, paddingBottom: 'var(--tabbar)' }}>
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
        height: 'var(--tabbar)', paddingBottom: 'var(--tab-sotto)', boxSizing: 'border-box',
      }}>
        {TABS.map(({ path, icon: Icon, label }) => {
          const active = tabAttiva(pathname, path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1, height: 'var(--tab-h)', padding: '0 4px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
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
