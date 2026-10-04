// Luoghi — lista con ricerca

import { useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { Search, MapPin, Users, Calendar, Plus } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { TIPO_LUOGO_LABEL } from '../lib/mock-data'
import { useLuoghi } from '../hooks/useLuoghi'
import type { TipoLuogo } from '../types'

const TIPO_COLOR: Record<TipoLuogo, string> = {
  strada:    'oklch(0.62 0.14 40)',
  informale: 'oklch(0.62 0.14 80)',
  diurno:    'oklch(0.62 0.14 160)',
  sanitario: 'oklch(0.62 0.14 200)',
  ufficio:   'oklch(0.62 0.14 280)',
}

export function LuoghiScreen() {
  const navigate = useNavigate()
  const isDetailOpen = !!useMatch('/luoghi/:id')
  const [query, setQuery] = useState('')

  const { data: tuttiLuoghi = [], isLoading, isError } = useLuoghi()

  const luoghi = tuttiLuoghi.filter(l => {
    if (!query) return true
    const q = query.toLowerCase()
    return l.nome.toLowerCase().includes(q) || l.indirizzo?.toLowerCase().includes(q)
  })

  return (
    <MobileLayout>
      {/* Header sticky */}
      <div style={{
        padding: '20px 16px 12px',
        background: 'var(--prox-surface)',
        borderBottom: '1px solid var(--prox-line)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="prox-display" style={{ fontSize: 22, fontWeight: 700 }}>
            Luoghi
          </div>
          <button onClick={() => navigate('/luoghi/nuovo')} style={newBtn} aria-label="Nuovo luogo">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--prox-surface2)', borderRadius: 12,
          padding: '8px 12px', border: '1px solid var(--prox-line)',
        }}>
          <Search size={16} color="var(--prox-ink3)" strokeWidth={1.75} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca luogo o indirizzo…"
            style={{
              flex: 1, border: 'none', background: 'none',
              fontSize: 14, color: 'var(--prox-ink)', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
          : isError
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-accent)', fontSize: 14 }}>Errore di caricamento</div>
            : null
        }
        {luoghi.map(l => {
          const color = TIPO_COLOR[l.tipo]
          return (
            <div
              key={l.id}
              onClick={() => navigate(`/luoghi/${l.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--prox-surface)',
                borderRadius: 14, padding: '12px 14px',
                border: '1px solid var(--prox-line2)',
                boxShadow: '0 1px 2px rgba(20,15,10,0.03)',
                cursor: 'pointer',
              }}
            >
              {/* Pin tile */}
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MapPin size={20} color={color} strokeWidth={1.75} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--prox-ink)' }}>
                  {l.nome}
                </div>
                <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 1 }}>
                  {TIPO_LUOGO_LABEL[l.tipo]}
                  {l.indirizzo ? ` · ${l.indirizzo}` : ''}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: 'var(--prox-ink3)' }}>
                  <Users size={11} strokeWidth={1.75} />
                  {l.persone_count}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: 'var(--prox-ink3)' }}>
                  <Calendar size={11} strokeWidth={1.75} />
                  {l.eventi_settimana}/sett
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Drawer open={isDetailOpen} onClose={() => navigate('/luoghi')}>
        <Outlet />
      </Drawer>
    </MobileLayout>
  )
}

const newBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--prox-accent)', color: '#fff',
  border: 'none', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(220,29,39,0.3)',
}
