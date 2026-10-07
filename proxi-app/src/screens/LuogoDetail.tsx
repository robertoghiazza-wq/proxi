// Luogo detail — mappa placeholder + stats + eventi recenti

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Users, Calendar, Clock, Plus, Edit, Lock, Building2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { ServizioForm } from './ServizioFormScreen'
import { LuogoMap } from '../components/LuogoMap'
import { Tag } from '../components/Tag'
import { EventTypeDot } from '../components/EventTypeDot'
import { useTipiLuogo, useTipiEvento } from '../hooks/useTipi'
import { tenue, scuro } from '../lib/colori'
import { useLuogo } from '../hooks/useLuoghi'
import { useEventi } from '../hooks/useEventi'


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

export function LuogoDetail() {
  const { label: tipoLuogoLabel, colore: coloreLuogo } = useTipiLuogo()
  const { colore: colorForTipo } = useTipiEvento()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: luogo, isLoading } = useLuogo(Number(id))
  const { data: eventiTutti = [] } = useEventi({ luogo_id: Number(id) })
  const eventiRecenti = eventiTutti.slice(0, 5)
  const [creaServizio, setCreaServizio] = useState(false)
  const [servizioCreatoId, setServizioCreatoId] = useState<number | null>(null)

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }

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

  const color = coloreLuogo(luogo.tipo)

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100svh' }}>

      {/* MAPPA HEADER */}
      <div style={{ position: 'relative' }}>
        {luogo.lat != null && luogo.lng != null
          ? <LuogoMap lat={luogo.lat} lng={luogo.lng} />
          : (
            <div style={{
              height: 120, background: 'var(--prox-surface2)', color: 'var(--prox-ink3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, paddingTop: 36,
            }}>
              Posizione non impostata
            </div>
          )}

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
            background: tenue(color, 14), flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={22} color={scuro(color)} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="prox-display" style={{
              fontSize: 22, fontWeight: 700, letterSpacing: -0.3,
              color: 'var(--prox-ink)', margin: 0,
            }}>
              {luogo.nome}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Tag label={tipoLuogoLabel(luogo.tipo)} soft />
              {luogo.visibilita === 'riservato' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'oklch(0.50 0.13 70)', background: 'oklch(0.95 0.06 85)', borderRadius: 999, padding: '2px 8px' }}>
                  <Lock size={11} strokeWidth={2.4} /> Riservato
                </span>
              )}
              {(luogo.indirizzo || luogo.localita) && (
                <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{[luogo.indirizzo, [luogo.npa, luogo.localita].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</span>
              )}
            </div>
            {luogo.comune_politico && (
              <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 3 }}>
                Comune politico: {luogo.comune_politico}{luogo.cantone ? ` (${luogo.cantone})` : ''}
              </div>
            )}
            {luogo.punto_esatto && (
              <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 3 }}>Punto esatto: {luogo.punto_esatto}</div>
            )}
            {luogo.servizio && (
              <button
                onClick={() => navigate(`/servizi/${luogo.servizio!.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--prox-accent)', fontWeight: 600, fontFamily: 'inherit' }}
              >
                <Building2 size={12} strokeWidth={2} /> Ente di riferimento: {luogo.servizio.nome}
              </button>
            )}
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
          <button onClick={() => navigate('/eventi/nuovo', { state: { luogoId: luogo.id } })} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: 'var(--prox-accent)', color: '#fff',
            border: 'none', borderRadius: 999, padding: '11px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={16} strokeWidth={2.5} />
            Nuovo evento qui
          </button>
          <button onClick={() => navigate(`/luoghi/${luogo.id}/modifica`)} style={iconBtnStyle} aria-label="Modifica luogo">
            <Edit size={18} strokeWidth={1.75} color="var(--prox-ink2)" />
          </button>
        </div>
      </div>

      {/* CORPO */}
      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Stats */}
        <Card padding={0}>
          <div style={{ display: 'flex' }}>
            <StatBox icon={<Users size={16} strokeWidth={1.75} color={scuro(color)} />}
              value={Number(luogo.persone_count ?? 0)} label="Persone" />
            <div style={{ width: 1, background: 'var(--prox-line)' }} />
            <StatBox icon={<Calendar size={16} strokeWidth={1.75} color={scuro(color)} />}
              value={Number(luogo.eventi_settimana ?? 0)} label="Eventi/sett" />
            <div style={{ width: 1, background: 'var(--prox-line)' }} />
            <StatBox icon={<Calendar size={16} strokeWidth={1.75} color={scuro(color)} />}
              value={Number(luogo.eventi_totali ?? eventiTutti.length)} label="Totali" />
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

        {servizioCreatoId !== null ? (
          <button onClick={() => navigate(`/servizi/${servizioCreatoId}`)} style={{ ...azioneLuogo, color: 'var(--prox-ok)' }}>
            Servizio creato — aprilo
          </button>
        ) : (
          <button onClick={() => setCreaServizio(true)} style={azioneLuogo}>
            Crea un servizio da questo luogo
          </button>
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

      {creaServizio && luogo && (
        <Modal open onClose={() => setCreaServizio(false)}>
          <ServizioForm
            initial={{
              nome: luogo.nome, indirizzo: luogo.indirizzo, cap: luogo.npa, localita: luogo.localita,
              comune_politico: luogo.comune_politico, bfs: luogo.bfs, cantone: luogo.cantone,
              lat: luogo.lat, lng: luogo.lng, note: luogo.note,
            }}
            onClose={() => setCreaServizio(false)}
            onSaved={sv => { setCreaServizio(false); setServizioCreatoId(sv.id) }}
          />
        </Modal>
      )}
    </div>
  )
}

// ---- helpers ----

const azioneLuogo: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  border: '1.5px solid var(--prox-line)', borderRadius: 999, background: 'transparent',
  color: 'var(--prox-ink2)', padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%',
}

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
