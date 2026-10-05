// Persona detail — hero + bisogni + note + storico eventi

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Phone, Edit, Plus, AlertTriangle, Trash2, Mail } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Tag } from '../components/Tag'
import { Card } from '../components/Card'
import { EventTypeDot } from '../components/EventTypeDot'
import { colorForTipo } from '../lib/mock-data'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { usePersona, useDeletePersona } from '../hooks/usePersone'

const TAG_VULNERABILI = ['senza fissa dimora', 'minore', 'dipendenza', 'prostituzione']

function displayName(p: { nome?: string | null; soprannome?: string | null; anonimo?: boolean }): string {
  if (p.soprannome && p.anonimo) return `"${p.soprannome}"`
  if (p.nome) return p.nome
  if (p.soprannome) return `"${p.soprannome}"`
  return '—'
}

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return h > 0 ? `${h}h ${r > 0 ? r + 'm' : ''}` : `${r}m`
}

function fmtData(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('it-CH', {
    day: 'numeric', month: 'short',
  })
}

export function PersonaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: persona, isLoading } = usePersona(Number(id))
  const elimina = useDeletePersona()
  const [confermaElimina, setConfermaElimina] = useState(false)

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }

  if (!persona) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Persona non trovata
        <br />
        <button onClick={() => navigate('/persone')} style={{ marginTop: 12, cursor: 'pointer' }}>
          ← Torna alla lista
        </button>
      </div>
    )
  }

  const eventi = (persona.eventi ?? []).slice().sort((a, b) => b.data.localeCompare(a.data))

  const isVuln = persona.tag?.some(t => TAG_VULNERABILI.includes(t))
  const name = displayName(persona)

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100svh' }}>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(180deg, var(--prox-accent-soft) 0%, var(--prox-bg) 100%)',
        padding: '0 16px 20px',
      }}>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--prox-ink2)', fontSize: 14, fontWeight: 500,
            padding: '16px 0 0',
          }}
        >
          <ChevronLeft size={20} strokeWidth={1.75} />
          Persone
        </button>

        {/* Avatar + nome */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Avatar
            nome={persona.anonimo ? persona.soprannome : persona.nome}
            anonimo={persona.anonimo}
            size={72}
          />

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <h1 className="prox-display" style={{
                fontSize: 24, fontWeight: 700, letterSpacing: -0.4,
                color: 'var(--prox-ink)', margin: 0,
              }}>
                {name}
              </h1>
              {isVuln && <AlertTriangle size={16} color="oklch(0.60 0.14 70)" strokeWidth={2} />}
            </div>

            {/* Età · sesso · lingue */}
            <div style={{ fontSize: 13, color: 'var(--prox-ink3)', marginTop: 4 }}>
              {[
                persona.eta ? `${persona.eta} anni` : null,
                persona.sesso === 'M' ? 'M' : persona.sesso === 'F' ? 'F' : null,
                persona.lingue?.join(' · '),
              ].filter(Boolean).join(' · ')}
            </div>

            {/* Tag */}
            {persona.tag && persona.tag.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 10 }}>
                {persona.tag.map(t => (
                  <Tag
                    key={t}
                    label={t}
                    warn={TAG_VULNERABILI.includes(t)}
                    soft={!TAG_VULNERABILI.includes(t)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => navigate('/eventi/nuovo', { state: { personaId: persona.id } })}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'var(--prox-accent)', color: '#fff',
              border: 'none', borderRadius: 999, padding: '11px 0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nuovo evento
          </button>
          {persona.telefono && (
            <a href={`tel:${persona.telefono.replace(/\s+/g, '')}`} style={iconBtnStyle} aria-label="Chiama">
              <Phone size={18} strokeWidth={1.75} color="var(--prox-ink2)" />
            </a>
          )}
          <button onClick={() => navigate(`/persone/${persona.id}/modifica`)} style={iconBtnStyle} aria-label="Modifica persona">
            <Edit size={18} strokeWidth={1.75} color="var(--prox-ink2)" />
          </button>
        </div>
      </div>

      {/* CORPO */}
      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Bisogni attivi */}
        {persona.bisogni && persona.bisogni.length > 0 && (
          <Section title="Bisogni attivi">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {persona.bisogni.map(b => (
                <Tag key={b} label={b} />
              ))}
            </div>
          </Section>
        )}

        {/* Contatti */}
        {(persona.telefono || persona.email) && (
          <Section title="Contatti">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              {persona.telefono && (
                <a href={`tel:${persona.telefono.replace(/\s+/g, '')}`} style={contactLink}>
                  <Phone size={15} strokeWidth={1.75} /> {persona.telefono}
                </a>
              )}
              {persona.email && (
                <a href={`mailto:${persona.email}`} style={contactLink}>
                  <Mail size={15} strokeWidth={1.75} /> {persona.email}
                </a>
              )}
            </div>
          </Section>
        )}

        {/* Note */}
        {persona.note && (
          <Section title="Note">
            <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.6, margin: 0 }}>
              {persona.note}
            </p>
          </Section>
        )}

        {/* Storico eventi */}
        <Section title={`Storico eventi`} count={eventi.length}>
          {eventi.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--prox-ink3)', margin: 0 }}>Nessun evento registrato</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {eventi.map(e => {
                  const color = colorForTipo(e.tipo)
                  const luogo = e.luogo ?? null
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
                      <div style={{ width: 4, background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: '9px 11px', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <EventTypeDot tipo={e.tipo} showLabel size={7} />
                          </div>
                          {luogo && (
                            <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginTop: 2 }}>
                              {luogo.nome}
                            </div>
                          )}
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>{fmtData(e.data)}</div>
                          <div style={{
                            fontSize: 11, color: 'var(--prox-ink3)',
                            fontFamily: 'ui-monospace, monospace',
                          }}>
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
        </Section>

        <button
          onClick={() => setConfermaElimina(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            border: '1.5px solid var(--prox-line)', borderRadius: 999,
            background: 'transparent', color: 'var(--prox-danger)',
            padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%',
          }}
        >
          <Trash2 size={16} strokeWidth={1.75} />
          Elimina persona
        </button>
      </div>

      <ConfirmDialog
        open={confermaElimina}
        danger
        title="Eliminare la persona?"
        message={`${name} sparisce dall'elenco e dagli eventi, ma la scheda resta nel log.`}
        confirmLabel="Elimina"
        loading={elimina.isPending}
        error={elimina.isError ? (elimina.error as Error).message : null}
        onCancel={() => { setConfermaElimina(false); elimina.reset() }}
        onConfirm={() => elimina.mutate(persona.id, { onSuccess: () => navigate('/persone') })}
      />
    </div>
  )
}

// ---- helpers ----

const contactLink: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, color: 'var(--prox-ink2)', textDecoration: 'none',
}

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 999,
  background: 'var(--prox-surface)',
  border: '1px solid var(--prox-line)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}

function Section({
  title, count, children,
}: {
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <Card padding="14px 16px">
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 10,
      }}>
        <span className="prox-label">{title}</span>
        {count !== undefined && (
          <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{count}</span>
        )}
      </div>
      {children}
    </Card>
  )
}
