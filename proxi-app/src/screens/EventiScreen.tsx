// Eventi — lista raggruppata per giorno con filtri stato

import { useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { EventTypeDot } from '../components/EventTypeDot'
import { Avatar } from '../components/Avatar'
import { colorForTipo } from '../lib/mock-data'
import { useEventi } from '../hooks/useEventi'
import type { StatoEvento } from '../types'
import { Plus } from 'lucide-react'

type Filtro = 'tutti' | StatoEvento

const FILTRI: { key: Filtro; label: string }[] = [
  { key: 'tutti',       label: 'Tutti'    },
  { key: 'completato',  label: 'Chiusi'   },
  { key: 'pianificato', label: 'Pianif.'  },
  { key: 'in_corso',    label: 'In corso' },
]

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return h > 0 ? `${h}h ${r > 0 ? r + 'm' : ''}` : `${r}m`
}

function fmtData(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('it-CH', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function EventiScreen() {
  const navigate = useNavigate()
  const isDetailOpen = !!useMatch('/eventi/:id')
  const [filtro, setFiltro] = useState<Filtro>('tutti')

  const { data: tuttiEventi = [], isLoading } = useEventi({})

  const filtrati = tuttiEventi
    .filter(e => filtro === 'tutti' || e.stato === filtro)

  // Raggruppa per giorno
  const giorni = [...new Set(filtrati.map(e => e.data))]

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
            Eventi
          </div>
          <button onClick={() => navigate('/eventi/nuovo')} style={newBtn} aria-label="Nuovo evento">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTRI.map(({ key, label }) => {
            const active = filtro === key
            return (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                style={{
                  padding: '4px 10px', borderRadius: 999, border: 'none',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: active ? 'var(--prox-accent)' : 'var(--prox-surface2)',
                  color: active ? '#fff' : 'var(--prox-ink2)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista per giorno */}
      <div style={{ padding: '8px 16px' }}>
        {isLoading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
        )}
        {!isLoading && filtrati.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Nessun evento</div>
        )}
        {giorni.map(data => {
          const eventiGiorno = filtrati.filter(e => e.data === data)
          const totMin = eventiGiorno.reduce((s, e) => s + e.durata_min, 0)

          return (
            <div key={data} style={{ marginBottom: 20 }}>
              {/* Intestazione giorno */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--prox-ink2)',
                  textTransform: 'capitalize',
                }}>
                  {fmtData(data)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--prox-ink3)', fontFamily: 'ui-monospace, monospace' }}>
                  {minToHM(totMin)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {eventiGiorno.map(e => {
                  const color = colorForTipo(e.tipo)
                  const luogo = e.luogo ?? null

                  return (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/eventi/${e.id}`)}
                      style={{
                        display: 'flex', alignItems: 'stretch',
                        background: 'var(--prox-surface)',
                        borderRadius: 12, overflow: 'hidden',
                        border: '1px solid var(--prox-line2)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 4, background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', gap: 10 }}>
                        {/* Ora */}
                        <div style={{
                          width: 40, fontSize: 12, fontWeight: 600,
                          color: 'var(--prox-ink2)', fontFamily: 'ui-monospace, monospace',
                          flexShrink: 0, paddingTop: 1,
                        }}>
                          {e.ora_inizio ?? '—'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <EventTypeDot tipo={e.tipo} showLabel size={7} />
                            {e.stato === 'in_corso' && (
                              <span style={{
                                fontSize: 9.5, fontWeight: 700,
                                color: 'var(--prox-accent)',
                                background: 'var(--prox-accent-soft)',
                                borderRadius: 999, padding: '1px 6px',
                                textTransform: 'uppercase',
                              }}>Live</span>
                            )}
                          </div>

                          {e.persone && e.persone.length > 0 && (
                            <div style={{ display: 'flex', gap: 3 }}>
                              {e.persone.slice(0, 4).map(p => (
                                <Avatar
                                  key={p.id}
                                  nome={p.anonimo ? p.soprannome : p.nome}
                                  anonimo={p.anonimo}
                                  size={20}
                                />
                              ))}
                            </div>
                          )}

                          {luogo && (
                            <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginTop: 3 }}>
                              {luogo.nome}
                            </div>
                          )}
                        </div>

                        <div style={{
                          fontSize: 11, color: 'var(--prox-ink3)',
                          fontFamily: 'ui-monospace, monospace', flexShrink: 0,
                        }}>
                          {e.durata_min}′
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <Drawer open={isDetailOpen} onClose={() => navigate('/eventi')}>
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
