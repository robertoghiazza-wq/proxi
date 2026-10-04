// Home / Oggi — variante Lista cronologica

import { MobileLayout } from '../components/MobileLayout'
import { Card } from '../components/Card'
import { Avatar } from '../components/Avatar'
import { EventTypeDot } from '../components/EventTypeDot'
import { colorForTipo, eventiDelGiorno, minutiLavoratiOggi, luogoById } from '../lib/mock-data'
import type { Evento } from '../types'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const TODAY = '2026-05-31'

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}h ${String(r).padStart(2, '0')}m`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno, Giulia'
  if (h < 18) return 'Buon pomeriggio, Giulia'
  return 'Buonasera, Giulia'
}

function StatoBadge({ stato }: { stato: Evento['stato'] }) {
  if (stato === 'in_corso') return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, color: 'var(--prox-accent)',
      background: 'var(--prox-accent-soft)', borderRadius: 999,
      padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.4,
    }}>Live</span>
  )
  if (stato === 'completato') return (
    <span style={{ color: 'var(--prox-ok)', display: 'flex', alignItems: 'center' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  )
  return null
}

function EventRow({ evento }: { evento: Evento }) {
  const navigate = useNavigate()
  const color = colorForTipo(evento.tipo)
  const luogo = evento.luogo_id ? luogoById(evento.luogo_id) : null

  return (
    <div
      onClick={() => navigate(`/eventi/${evento.id}`)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 0,
        background: 'var(--prox-surface)',
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--prox-line2)',
        boxShadow: '0 1px 2px rgba(20,15,10,0.03)',
        cursor: 'pointer',
      }}
    >
      {/* Barra colore tipo */}
      <div style={{ width: 4, background: color, alignSelf: 'stretch', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '11px 12px', display: 'flex', gap: 10 }}>
        {/* Ora */}
        <div style={{
          width: 42, flexShrink: 0,
          fontSize: 12.5, fontWeight: 600, color: 'var(--prox-ink2)',
          fontFamily: 'ui-monospace, monospace', paddingTop: 1,
        }}>
          {evento.ora_inizio ?? '—'}
        </div>

        {/* Contenuto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <EventTypeDot tipo={evento.tipo} showLabel size={7} />
          </div>

          {/* Persone */}
          {evento.persone && evento.persone.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {evento.persone.slice(0, 3).map(p => (
                <Avatar key={p.id} nome={p.anonimo ? p.soprannome : p.nome} anonimo={p.anonimo} size={22} />
              ))}
            </div>
          )}

          {/* Luogo */}
          {luogo && (
            <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 4 }}>
              {luogo.nome}
            </div>
          )}
        </div>

        {/* Destra: durata + stato */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--prox-ink3)', fontFamily: 'ui-monospace, monospace' }}>
            {evento.durata_min}′
          </span>
          <StatoBadge stato={evento.stato} />
        </div>
      </div>
    </div>
  )
}

export function HomeScreen() {
  const navigate = useNavigate()
  const eventi = eventiDelGiorno(TODAY)
  const minuti = minutiLavoratiOggi(TODAY)
  const chiusi = eventi.filter(e => e.stato === 'completato').length
  const aperti = eventi.filter(e => e.stato !== 'completato').length

  return (
    <MobileLayout>
      <div style={{ padding: '0 16px 16px' }}>
        {/* Header */}
        <div style={{ padding: '20px 2px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--prox-ink3)', fontWeight: 500 }}>
              Domenica 31 maggio
            </div>
            <div className="prox-display" style={{
              fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 2,
            }}>
              {greeting()}
            </div>
          </div>
          <button
            onClick={() => navigate('/eventi/nuovo')}
            style={newBtn}
            aria-label="Nuovo evento"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Card ore + contatori */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div className="prox-label" style={{ marginBottom: 2 }}>Oggi</div>
              <div className="prox-display" style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
                {minToHM(minuti)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{chiusi}</div>
                <div style={{ fontSize: 10.5, color: 'var(--prox-ink3)' }}>chiusi</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{aperti}</div>
                <div style={{ fontSize: 10.5, color: 'var(--prox-ink3)' }}>aperti</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista eventi */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: '4px 2px 10px',
        }}>
          <span className="prox-label">Giornata</span>
          <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{eventi.length} eventi</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {eventi.map(e => <EventRow key={e.id} evento={e} />)}
        </div>
      </div>
    </MobileLayout>
  )
}

const newBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--prox-accent)', color: '#fff',
  border: 'none', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(220,29,39,0.3)',
  marginTop: 4,
}
