import { MobileLayout } from '../components/MobileLayout'
import { Card } from '../components/Card'
import { Avatar } from '../components/Avatar'
import { EventTypeDot } from '../components/EventTypeDot'
import { colorForTipo } from '../lib/mock-data'
import { useEventi } from '../hooks/useEventi'
import { usePersone } from '../hooks/usePersone'
import { getCurrentUser } from '../lib/api-client'
import { useIsDesktop } from '../hooks/useIsDesktop'
import type { Evento, Persona } from '../types'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Clock, Calendar } from 'lucide-react'

const TODAY = new Date().toISOString().slice(0, 10)

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}h ${String(r).padStart(2, '0')}m`
}

function greeting() {
  const user = getCurrentUser()
  const name = user?.name?.split(' ')[0] ?? ''
  const h = new Date().getHours()
  const saluto = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  return name ? `${saluto}, ${name}` : saluto
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
  const luogo = evento.luogo ?? null

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
      <div style={{ width: 4, background: color, alignSelf: 'stretch', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '11px 12px', display: 'flex', gap: 10 }}>
        <div style={{
          width: 42, flexShrink: 0,
          fontSize: 12.5, fontWeight: 600, color: 'var(--prox-ink2)',
          fontFamily: 'ui-monospace, monospace', paddingTop: 1,
        }}>
          {evento.ora_inizio ?? '—'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <EventTypeDot tipo={evento.tipo} showLabel size={7} />
          </div>
          {evento.persone && evento.persone.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {evento.persone.slice(0, 3).map(p => (
                <Avatar key={p.id} nome={p.anonimo ? p.soprannome : p.nome} anonimo={p.anonimo} size={22} />
              ))}
            </div>
          )}
          {luogo && (
            <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 4 }}>{luogo.nome}</div>
          )}
        </div>
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

function KpiCard({ icon, value, label, accent }: {
  icon: React.ReactNode; value: string | number; label: string; accent?: boolean
}) {
  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: accent ? 'var(--prox-accent-soft)' : 'var(--prox-surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent ? 'var(--prox-accent)' : 'var(--prox-ink3)',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--prox-ink3)', fontWeight: 500 }}>{label}</span>
      </div>
      <div className="prox-display" style={{
        fontSize: 26, fontWeight: 700, letterSpacing: -0.5,
        color: accent ? 'var(--prox-accent)' : 'var(--prox-ink)',
      }}>
        {value}
      </div>
    </Card>
  )
}

function PersonaRecente({ persona }: { persona: Persona }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/persone/${persona.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0', cursor: 'pointer',
        borderBottom: '1px solid var(--prox-line2)',
      }}
    >
      <Avatar nome={persona.anonimo ? persona.soprannome : persona.nome} anonimo={persona.anonimo} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--prox-ink)' }}>
          {persona.anonimo && persona.soprannome ? `"${persona.soprannome}"` : persona.nome ?? '—'}
        </div>
        {persona.tag && persona.tag.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginTop: 1 }}>
            {persona.tag.slice(0, 2).join(' · ')}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Desktop dashboard ──────────────────────────────────────────────────────

function DesktopHome({ eventi, isLoading }: { eventi: Evento[]; isLoading: boolean }) {
  const navigate = useNavigate()
  const { data: persone = [] } = usePersone()

  const minuti       = eventi.reduce((s, e) => s + e.durata_min, 0)
  const chiusi       = eventi.filter(e => e.stato === 'completato').length
  const aperti       = eventi.filter(e => e.stato !== 'completato').length

  // Persone uniche incontrate oggi
  const personeOggi = [
    ...new Map(
      eventi.flatMap(e => e.persone ?? []).map(p => [p.id, p])
    ).values(),
  ]

  const todayFmt = new Date().toLocaleDateString('it-CH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--prox-ink3)', fontWeight: 500, textTransform: 'capitalize' }}>
            {todayFmt}
          </div>
          <h1 className="prox-display" style={{
            fontSize: 26, fontWeight: 700, letterSpacing: -0.4,
            color: 'var(--prox-ink)', marginTop: 3,
          }}>
            {greeting()}
          </h1>
        </div>
        <button
          onClick={() => navigate('/eventi/nuovo')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--prox-accent)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '10px 16px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220,29,39,0.28)',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Nuovo evento
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <KpiCard
          icon={<Clock size={18} strokeWidth={1.75} />}
          value={minuti > 0 ? minToHM(minuti) : '—'}
          label="Ore oggi"
          accent
        />
        <KpiCard
          icon={<Users size={18} strokeWidth={1.75} />}
          value={personeOggi.length}
          label="Contatti oggi"
        />
        <KpiCard
          icon={<Calendar size={18} strokeWidth={1.75} />}
          value={`${chiusi} / ${eventi.length}`}
          label="Chiusi / Totale"
        />
        <KpiCard
          icon={<Calendar size={18} strokeWidth={1.75} />}
          value={aperti}
          label="Ancora aperti"
        />
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Colonna sinistra: eventi di oggi */}
        <Card padding="16px 18px">
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 14,
          }}>
            <span className="prox-label">Giornata</span>
            <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{eventi.length} eventi</span>
          </div>
          {isLoading
            ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
            : eventi.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>
                  Nessun evento oggi
                </div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {eventi.map(e => <EventRow key={e.id} evento={e} />)}
                </div>
          }
        </Card>

        {/* Colonna destra */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Persone incontrate oggi */}
          <Card padding="16px 18px">
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 12,
            }}>
              <span className="prox-label">Incontrati oggi</span>
              <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{personeOggi.length}</span>
            </div>
            {personeOggi.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--prox-ink3)' }}>
                  Nessuna persona nei contatti di oggi
                </div>
              : personeOggi.map(p => <PersonaRecente key={p.id} persona={p} />)
            }
          </Card>

          {/* Rubrica rapida: persone recenti nel DB */}
          {personeOggi.length === 0 && persone.length > 0 && (
            <Card padding="16px 18px">
              <div style={{ marginBottom: 12 }}>
                <span className="prox-label">Persone nel registro</span>
              </div>
              {persone.slice(0, 5).map(p => (
                <PersonaRecente key={p.id} persona={p} />
              ))}
              <button
                onClick={() => navigate('/persone')}
                style={{
                  marginTop: 12, width: '100%',
                  background: 'none', border: '1.5px solid var(--prox-line)',
                  borderRadius: 8, padding: '8px 0',
                  fontSize: 12.5, fontWeight: 600, color: 'var(--prox-ink2)',
                  cursor: 'pointer',
                }}
              >
                Vedi tutte →
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile home (originale) ─────────────────────────────────────────────────

function MobileHome({ eventi, isLoading }: { eventi: Evento[]; isLoading: boolean }) {
  const navigate = useNavigate()
  const minuti = eventi.reduce((s, e) => s + e.durata_min, 0)
  const chiusi = eventi.filter(e => e.stato === 'completato').length
  const aperti = eventi.filter(e => e.stato !== 'completato').length

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ padding: '20px 2px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--prox-ink3)', fontWeight: 500 }}>
            {new Date().toLocaleDateString('it-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="prox-display" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>
            {greeting()}
          </div>
        </div>
        <button onClick={() => navigate('/eventi/nuovo')} style={newBtn} aria-label="Nuovo evento">
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px 10px' }}>
        <span className="prox-label">Giornata</span>
        <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{eventi.length} eventi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading
          ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
          : eventi.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Nessun evento oggi</div>
            : eventi.map(e => <EventRow key={e.id} evento={e} />)
        }
      </div>
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const isDesktop = useIsDesktop()
  const { data: eventi = [], isLoading } = useEventi({ data: TODAY })

  return (
    <MobileLayout>
      {isDesktop
        ? <DesktopHome eventi={eventi} isLoading={isLoading} />
        : <MobileHome  eventi={eventi} isLoading={isLoading} />
      }
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
