// Luogo detail — mappa placeholder + stats + eventi recenti

import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Users, Calendar, Clock, Plus, Edit } from 'lucide-react'
import { Card } from '../components/Card'
import { Tag } from '../components/Tag'
import { EventTypeDot } from '../components/EventTypeDot'
import { MOCK_LUOGHI, MOCK_EVENTI, TIPO_LUOGO_LABEL, colorForTipo } from '../lib/mock-data'
import type { TipoLuogo } from '../types'

const TIPO_COLOR: Record<TipoLuogo, string> = {
  strada:    'oklch(0.62 0.14 40)',
  informale: 'oklch(0.62 0.14 80)',
  diurno:    'oklch(0.62 0.14 160)',
  sanitario: 'oklch(0.62 0.14 200)',
  ufficio:   'oklch(0.62 0.14 280)',
}

function fmtData(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('it-CH', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return h > 0 ? `${h}h ${r > 0 ? r + 'm' : ''}` : `${r}m`
}

// Placeholder mappa stilizzata (verrà sostituita con Leaflet + map.geo.admin.ch)
function MapPlaceholder({ color }: { color: string }) {
  return (
    <div style={{
      height: 200, background: '#e8ebe8',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8, position: 'relative', overflow: 'hidden',
    }}>
      {/* Griglia strade stilizzata */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
        {[0, 40, 80, 120, 160, 200].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="100%" y2={y} stroke="#888" strokeWidth="1" />
        ))}
        {[0, 60, 120, 180, 240, 300, 360, 420].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100%" stroke="#888" strokeWidth="1" />
        ))}
        {/* Strade principali */}
        <line x1="0" y1="70" x2="100%" y2="90" stroke="#bbb" strokeWidth="4" />
        <line x1="120" y1="0" x2="140" y2="100%" stroke="#bbb" strokeWidth="4" />
      </svg>
      {/* Pin */}
      <div style={{
        width: 40, height: 40, borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: color,
        boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
        position: 'relative', zIndex: 1,
      }} />
      <span style={{
        fontSize: 11, color: '#555', fontWeight: 500,
        position: 'relative', zIndex: 1, marginTop: 4,
      }}>
        Mappa — integrazione map.geo.admin.ch
      </span>
    </div>
  )
}

export function LuogoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const luogo = MOCK_LUOGHI.find(l => l.id === Number(id))

  if (!luogo) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Luogo non trovato
        <br />
        <button onClick={() => navigate('/luoghi')} style={{ marginTop: 12, cursor: 'pointer' }}>
          ← Torna alla lista
        </button>
      </div>
    )
  }

  const color = TIPO_COLOR[luogo.tipo]
  const eventiRecenti = MOCK_EVENTI
    .filter(e => e.luogo_id === luogo.id)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5)

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100svh' }}>

      {/* MAPPA HEADER */}
      <div style={{ position: 'relative' }}>
        <MapPlaceholder color={color} />

        {/* Back button sovrapposto alla mappa */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.9)', border: 'none',
            borderRadius: 999, padding: '6px 12px 6px 8px',
            cursor: 'pointer', color: 'var(--prox-ink2)',
            fontSize: 13, fontWeight: 500,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
          Luoghi
        </button>
      </div>

      {/* INTESTAZIONE */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: color + '22', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={22} color={color} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="prox-display" style={{
              fontSize: 22, fontWeight: 700, letterSpacing: -0.3,
              color: 'var(--prox-ink)', margin: 0,
            }}>
              {luogo.nome}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Tag label={TIPO_LUOGO_LABEL[luogo.tipo]} soft />
              {luogo.indirizzo && (
                <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{luogo.indirizzo}</span>
              )}
            </div>
            {luogo.orari && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--prox-ink3)' }}>
                <Clock size={12} strokeWidth={1.75} />
                {luogo.orari}
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: 'var(--prox-accent)', color: '#fff',
            border: 'none', borderRadius: 999, padding: '11px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={16} strokeWidth={2.5} />
            Nuovo evento qui
          </button>
          <button style={iconBtnStyle}>
            <Edit size={18} strokeWidth={1.75} color="var(--prox-ink2)" />
          </button>
        </div>
      </div>

      {/* CORPO */}
      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Stats */}
        <Card padding={0}>
          <div style={{ display: 'flex' }}>
            <StatBox icon={<Users size={16} strokeWidth={1.75} color={color} />}
              value={luogo.persone_count ?? 0} label="Persone" />
            <div style={{ width: 1, background: 'var(--prox-line)' }} />
            <StatBox icon={<Calendar size={16} strokeWidth={1.75} color={color} />}
              value={luogo.eventi_settimana ?? 0} label="Eventi/sett" />
            <div style={{ width: 1, background: 'var(--prox-line)' }} />
            <StatBox icon={<Calendar size={16} strokeWidth={1.75} color={color} />}
              value={eventiRecenti.length} label="Storici" />
          </div>
        </Card>

        {/* Note */}
        {luogo.note && (
          <Card padding="14px 16px">
            <div className="prox-label" style={{ marginBottom: 8 }}>Note operative</div>
            <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.6, margin: 0 }}>
              {luogo.note}
            </p>
          </Card>
        )}

        {/* Eventi recenti */}
        <Card padding="14px 16px">
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
          }}>
            <span className="prox-label">Eventi recenti</span>
            <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{eventiRecenti.length}</span>
          </div>

          {eventiRecenti.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--prox-ink3)', margin: 0 }}>Nessun evento in questo luogo</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {eventiRecenti.map(e => {
                  const eColor = colorForTipo(e.tipo)
                  return (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/eventi/${e.id}`)}
                      style={{
                        display: 'flex', alignItems: 'stretch',
                        borderRadius: 10, overflow: 'hidden',
                        border: '1px solid var(--prox-line2)',
                        background: 'var(--prox-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 4, background: eColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: '9px 11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <EventTypeDot tipo={e.tipo} showLabel size={7} />
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>{fmtData(e.data)}</div>
                          <div style={{ fontSize: 11, color: 'var(--prox-ink3)', fontFamily: 'ui-monospace, monospace' }}>
                            {minToHM(e.durata_min)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>
      </div>
    </div>
  )
}

// ---- helpers ----

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 999,
  background: 'var(--prox-surface)',
  border: '1px solid var(--prox-line)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div style={{ flex: 1, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {icon}
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--prox-ink)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--prox-ink3)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}
