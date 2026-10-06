// Evento detail — tipo, orario, durata, persone, luogo, note, educatore

import { useTipiEvento } from '../hooks/useTipi'
import { nomeAvatar, nomePersona, etichettaRuolo } from '../lib/persona'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Clock, FileText, Edit, CheckCircle, Circle, PlayCircle, Trash2, CircleDashed } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Tag } from '../components/Tag'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { daCompletare, mancantiTesto } from '../lib/completezza'
import { useEvento, useUpdateEvento, useDeleteEvento } from '../hooks/useEventi'
import { useRuoli } from '../hooks/useRuoli'
import type { StatoEvento } from '../types'

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return h > 0 ? `${h}h ${r > 0 ? r + 'm' : ''}` : `${r}m`
}

function fmtData(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('it-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function StatoInfo({ stato }: { stato: StatoEvento }) {
  const configs: Record<StatoEvento, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    completato:  { icon: <CheckCircle size={16} strokeWidth={2} />, label: 'Svolto',      color: 'var(--prox-ok)',     bg: 'oklch(0.96 0.05 155)' },
    in_corso:    { icon: <PlayCircle size={16} strokeWidth={2} />,  label: 'In corso',    color: 'var(--prox-accent)', bg: 'var(--prox-accent-soft)' },
    pianificato: { icon: <Circle size={16} strokeWidth={2} />,      label: 'Pianificato', color: 'var(--prox-ink3)',   bg: 'var(--prox-surface2)' },
  }
  const c = configs[stato]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: 12.5, fontWeight: 600,
    }}>
      {c.icon}{c.label}
    </span>
  )
}

export function EventoDetail() {
  const { label: tipoLabel, colore: colorForTipo } = useTipiEvento()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: evento, isLoading, error } = useEvento(Number(id))
  const aggiorna = useUpdateEvento(Number(id))
  const { data: ruoli = [] } = useRuoli()
  const elimina = useDeleteEvento()
  const [confermaElimina, setConfermaElimina] = useState(false)

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }

  if (error || !evento) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        {error ? (error as Error).message : 'Evento non trovato'}
        <br />
        <button onClick={() => navigate('/eventi')} style={{ marginTop: 12, cursor: 'pointer' }}>
          ← Torna agli eventi
        </button>
      </div>
    )
  }

  const color     = colorForTipo(evento.tipo)
  const luogo     = evento.luogo ?? null
  const educatore = evento.educatore ?? null

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100svh' }}>

      {/* HEADER con barra colore */}
      <div style={{
        background: 'var(--prox-surface)',
        borderBottom: `3px solid ${color}`,
        padding: '14px 16px 16px',
      }}>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--prox-ink2)', fontSize: 13, fontWeight: 500,
            padding: '0 0 12px',
          }}
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
          Indietro
        </button>

        {/* Tipo + stato */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h1 className="prox-display" style={{
            fontSize: 22, fontWeight: 700, letterSpacing: -0.3,
            color: 'var(--prox-ink)', margin: 0,
          }}>
            {tipoLabel(evento.tipo)}
          </h1>
          <StatoInfo stato={evento.stato} />
        </div>

        {/* Data e orario */}
        <div style={{ fontSize: 13, color: 'var(--prox-ink3)', textTransform: 'capitalize' }}>
          {fmtData(evento.data)}
          {evento.ora_inizio && ` · ore ${evento.ora_inizio.slice(0, 5)}`}
        </div>
      </div>

      {/* CORPO */}
      <div style={{ padding: '14px 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {daCompletare(evento) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
            borderRadius: 14, background: 'oklch(0.95 0.06 85)', color: 'oklch(0.40 0.11 70)',
          }}>
            <CircleDashed size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.4 }}>
              <strong>Da completare.</strong> Mancano: {mancantiTesto(evento.mancanti)}.
            </div>
            <button
              onClick={() => navigate(`/eventi/${evento.id}/modifica`)}
              style={{
                border: 'none', borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
                background: 'oklch(0.40 0.11 70)', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0,
              }}
            >
              Completa
            </button>
          </div>
        )}
        {evento.stato === 'completato' && evento.completo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
            borderRadius: 14, background: 'oklch(0.96 0.05 155)', color: 'var(--prox-ok)',
            fontSize: 13.5, fontWeight: 600,
          }}>
            <CheckCircle size={16} strokeWidth={2.2} />
            Completo
          </div>
        )}

        {/* Info principali */}
        <Card padding={0}>
          <Row icon={<Clock size={16} strokeWidth={1.75} color={color} />} label="Durata">
            <span className="prox-mono" style={{ fontSize: 15, fontWeight: 600 }}>
              {minToHM(evento.durata_min)}
            </span>
          </Row>

          {luogo && (
            <>
              <Divider />
              <Row
                icon={<MapPin size={16} strokeWidth={1.75} color={color} />}
                label="Luogo"
                onClick={() => navigate(`/luoghi/${luogo.id}`)}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--prox-ink)' }}>
                  {luogo.nome}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>
                  {luogo.indirizzo}
                </span>
              </Row>
            </>
          )}
        </Card>

        {/* Persone coinvolte */}
        {evento.persone && evento.persone.length > 0 && (
          <Card padding="14px 16px">
            <div className="prox-label" style={{ marginBottom: 10 }}>
              Persone coinvolte
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {evento.persone.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/persone/${p.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <Avatar
                    nome={nomeAvatar(p)}
                    anonimo={p.anonimo}
                    size={36}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {nomePersona(p)}
                    </div>
                    {p.ruolo_id && (
                      <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>
                        {etichettaRuolo(ruoli.find(r => r.id === p.ruolo_id), p.sesso)}
                      </div>
                    )}
                    {p.tag && p.tag.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
                        {p.tag.slice(0, 2).map(t => (
                          <Tag key={t} label={t} soft style={{ fontSize: 10 }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronLeft size={16} strokeWidth={1.75} color="var(--prox-ink3)"
                    style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Note */}
        {evento.note && (
          <Card padding="14px 16px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FileText size={14} strokeWidth={1.75} color="var(--prox-ink3)" />
              <span className="prox-label">Note</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.6, margin: 0 }}>
              {evento.note}
            </p>
          </Card>
        )}

        {/* Educatore */}
        {educatore && (
          <Card padding="14px 16px">
            <div className="prox-label" style={{ marginBottom: 10 }}>Registrato da</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar nome={educatore.name} size={32} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{educatore.name}</span>
            </div>
          </Card>
        )}

        {/* Azioni */}
        {evento.stato !== 'completato' && (
          <button
            onClick={() => aggiorna.mutate({ stato: 'completato' })}
            disabled={aggiorna.isPending}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              border: 'none', borderRadius: 999, width: '100%',
              background: 'var(--prox-ok)', color: '#fff',
              padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              opacity: aggiorna.isPending ? 0.6 : 1,
            }}
          >
            <CheckCircle size={16} strokeWidth={2.2} />
            Segna come svolto
          </button>
        )}
        {aggiorna.isError && (
          <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{(aggiorna.error as Error).message}</div>
        )}

        <button
          onClick={() => navigate(`/eventi/${evento.id}/modifica`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            border: '1.5px solid var(--prox-line)', borderRadius: 999,
            background: 'var(--prox-surface)', color: 'var(--prox-ink2)',
            padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            width: '100%',
          }}
        >
          <Edit size={16} strokeWidth={1.75} />
          Modifica evento
        </button>

        <button
          onClick={() => setConfermaElimina(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            border: '1.5px solid var(--prox-line)', borderRadius: 999,
            background: 'transparent', color: 'var(--prox-danger)',
            padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            width: '100%',
          }}
        >
          <Trash2 size={16} strokeWidth={1.75} />
          Elimina evento
        </button>
      </div>

      <ConfirmDialog
        open={confermaElimina}
        danger
        title="Eliminare l'evento?"
        message="L'operazione resta registrata nel log."
        confirmLabel="Elimina"
        loading={elimina.isPending}
        error={elimina.isError ? (elimina.error as Error).message : null}
        onCancel={() => { setConfermaElimina(false); elimina.reset() }}
        onConfirm={() => elimina.mutate(evento.id, { onSuccess: () => navigate('/eventi') })}
      />
    </div>
  )
}

// ---- helpers ----

function Row({
  icon, label, children, onClick,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 16px',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginBottom: 2, fontWeight: 500 }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {children}
        </div>
      </div>
      {onClick && (
        <ChevronLeft size={16} strokeWidth={1.75} color="var(--prox-ink3)"
          style={{ transform: 'rotate(180deg)', flexShrink: 0, marginTop: 2 }} />
      )}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--prox-line)', margin: '0 16px' }} />
}
