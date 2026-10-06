// Luoghi — lista con ricerca

import { useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { Search, Plus, List, Map as MapIcon, MapPin } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { Modal } from '../components/Modal'
import { Card } from '../components/Card'
import { LuogoThumb } from '../components/LuogoThumb'
import { LuoghiMap } from '../components/LuoghiMap'
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
  const isNuovoOpen  = !!useMatch('/luoghi/nuovo')
  const isDetailOpen = !!useMatch('/luoghi/:id/*') && !isNuovoOpen
  const [query, setQuery] = useState('')
  const [vista, setVista] = useState<'lista' | 'mappa'>('lista')

  const { data: tuttiLuoghi = [], isLoading, isError, error } = useLuoghi()

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
        position: 'sticky', top: 'var(--sat)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="prox-display" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}>
            <MapPin size={22} strokeWidth={2.2} />
            Luoghi
          </div>
          <button onClick={() => navigate('/luoghi/nuovo')} style={newBtn} aria-label="Nuovo luogo">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flex: 1,
            background: 'var(--prox-surface2)', borderRadius: 12,
            padding: '8px 12px', border: '1px solid var(--prox-line)',
          }}>
            <Search size={16} color="var(--prox-ink3)" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca luogo o indirizzo…"
              style={{
                flex: 1, minWidth: 0, border: 'none', background: 'none',
                fontSize: 14, color: 'var(--prox-ink)', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--prox-surface2)', borderRadius: 10, padding: 2, border: '1px solid var(--prox-line)' }}>
            {(['lista', 'mappa'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVista(v)}
                aria-label={v === 'lista' ? 'Vista lista' : 'Vista mappa'}
                style={{
                  width: 34, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: vista === v ? 'var(--prox-surface)' : 'transparent',
                  color: vista === v ? 'var(--prox-ink)' : 'var(--prox-ink3)',
                  boxShadow: vista === v ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {v === 'lista' ? <List size={16} strokeWidth={1.75} /> : <MapIcon size={16} strokeWidth={1.75} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
          : isError
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-accent)', fontSize: 14 }}>Errore di caricamento<div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>{(error as Error)?.message}</div></div>
            : null
        }
        {vista === 'mappa' && !isLoading && (
          <LuoghiMap luoghi={luoghi} colors={TIPO_COLOR} onOpen={id => navigate(`/luoghi/${id}`)} />
        )}
        {vista === 'lista' && luoghi.map(l => {
          const color = TIPO_COLOR[l.tipo]
          return (
            <Card
              key={l.id}
              onClick={() => navigate(`/luoghi/${l.id}`)}
              padding={12}
              style={{ display: 'flex', gap: 12, alignItems: 'center' }}
            >
              <LuogoThumb lat={l.lat} lng={l.lng} color={color} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--prox-ink)' }}>
                  {l.nome}
                </div>
                <div style={{
                  fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 2,
                  display: 'flex', gap: 6, alignItems: 'center', minWidth: 0,
                }}>
                  <span style={{ flexShrink: 0 }}>{TIPO_LUOGO_LABEL[l.tipo]}</span>
                  {(l.indirizzo || l.localita) && <><span>·</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[l.indirizzo, l.localita].filter(Boolean).join(', ')}</span></>}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {Number(l.persone_count ?? 0)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--prox-ink3)' }}>persone</div>
              </div>
            </Card>
          )
        })}
      </div>
      {isNuovoOpen ? (
        <Modal open onClose={() => navigate('/luoghi')}>
          <Outlet />
        </Modal>
      ) : (
        <Drawer open={isDetailOpen} onClose={() => navigate('/luoghi')}>
          <Outlet />
        </Drawer>
      )}
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
