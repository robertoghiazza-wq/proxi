// Scheda persona — identità + tab (Contatti, Eventi, Servizi, Note)

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Phone, Edit, Plus, AlertTriangle, Trash2, Mail, MapPin, Cake } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Tag } from '../components/Tag'
import { Card } from '../components/Card'
import { EventTypeDot } from '../components/EventTypeDot'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { InfoPanel, NotePanel, DiarioPanel } from './SchedaUtentePanels'
import { colorForTipo } from '../lib/mock-data'
import { nomeAvatar, nomePersona, etichettaRuolo, etichettaTipo } from '../lib/persona'
import { usePersona, useDeletePersona } from '../hooks/usePersone'
import { useRuoli } from '../hooks/useRuoli'
import type { Persona, Evento } from '../types'

const TAG_VULNERABILI = ['senza fissa dimora', 'minore', 'dipendenza', 'prostituzione']

type TabKey = 'contatti' | 'eventi' | 'servizi' | 'info' | 'note' | 'diario'

function tabPer(p: Persona): { key: TabKey; label: string }[] {
  if (p.ruolo === 'utente') {
    return [
      { key: 'contatti', label: 'Contatti' }, { key: 'eventi', label: 'Eventi' }, { key: 'info', label: 'Info' },
      { key: 'note', label: 'Note' }, { key: 'diario', label: 'Diario' },
    ]
  }
  return [
    { key: 'contatti', label: 'Contatti' },
    ...(p.ruolo === 'rete' ? [{ key: 'servizi' as const, label: 'Servizi' }] : []),
    { key: 'eventi', label: 'Eventi' },
    { key: 'note', label: 'Note' },
  ]
}

function ore(min: number) {
  const h = Math.floor(min / 60)
  const r = min % 60
  return h > 0 ? `${h}h${r > 0 ? ` ${r}m` : ''}` : `${r}m`
}

function fmtData(d: string) {
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-CH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function inizioSettimana(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export function PersonaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: persona, isLoading } = usePersona(Number(id))
  const { data: ruoli = [] } = useRuoli()
  const elimina = useDeletePersona()
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [tab, setTab] = useState<TabKey>('contatti')

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

  const isVuln = persona.tag?.some(t => TAG_VULNERABILI.includes(t))
  const name = nomePersona(persona)
  const ruolo = etichettaRuolo(ruoli.find(r => r.id === persona.ruolo_id), persona.sesso)
  const tabs = tabPer(persona)
  const tabAttiva = tabs.some(t => t.key === tab) ? tab : 'contatti'

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100svh' }}>
      <div style={{
        background: 'linear-gradient(180deg, var(--prox-accent-soft) 0%, var(--prox-bg) 100%)',
        padding: '0 16px 14px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--prox-ink2)', fontSize: 14, fontWeight: 500, padding: '16px 0 0',
          }}
        >
          <ChevronLeft size={20} strokeWidth={1.75} />
          Persone
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Avatar nome={nomeAvatar(persona)} anonimo={persona.anonimo} size={72} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <h1 className="prox-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4, color: 'var(--prox-ink)', margin: 0 }}>
                {name}
              </h1>
              {isVuln && <AlertTriangle size={16} color="oklch(0.60 0.14 70)" strokeWidth={2} />}
            </div>

            <div style={{ fontSize: 13, color: 'var(--prox-ink3)', marginTop: 4 }}>
              {[
                etichettaTipo(persona.ruolo) + (ruolo ? ` · ${ruolo}` : ''),
                persona.eta != null ? `${persona.eta} anni` : null,
                persona.sesso === 'M' ? 'M' : persona.sesso === 'F' ? 'F' : null,
                persona.lingue?.join(' · '),
              ].filter(Boolean).join(' · ')}
            </div>

            {persona.tag && persona.tag.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 10 }}>
                {persona.tag.map(t => (
                  <Tag key={t} label={t} warn={TAG_VULNERABILI.includes(t)} soft={!TAG_VULNERABILI.includes(t)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            onClick={() => navigate('/eventi/nuovo', { state: { personaId: persona.id } })}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'var(--prox-accent)', color: '#fff', border: 'none', borderRadius: 999,
              padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
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

      <div style={{
        display: 'flex', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)',
        borderBottom: '1px solid var(--prox-line)', overflowX: 'auto',
      }}>
        {tabs.map(t => {
          const attiva = t.key === tabAttiva
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '12px 14px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: 'transparent', fontSize: 14, fontWeight: attiva ? 700 : 500,
              color: attiva ? 'var(--prox-accent)' : 'var(--prox-ink3)',
              borderBottom: `2px solid ${attiva ? 'var(--prox-accent)' : 'transparent'}`,
            }}>
              {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '14px 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tabAttiva === 'contatti' && <PannelloContatti persona={persona} />}
        {tabAttiva === 'eventi' && <PannelloEventi eventi={persona.eventi ?? []} onApri={eid => navigate(`/eventi/${eid}`)} />}
        {tabAttiva === 'servizi' && (
          <Section title="Servizi" count={persona.servizi?.length ?? 0}>
            {(persona.servizi ?? []).length === 0
              ? <Vuoto>Nessun servizio collegato</Vuoto>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {persona.servizi!.map(sv => (
                    <div key={sv.id} onClick={() => navigate(`/servizi/${sv.id}`)} style={{ cursor: 'pointer', fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{sv.nome}</div>
                      {sv.localita && <div style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{sv.localita}</div>}
                    </div>
                  ))}
                </div>
              )}
          </Section>
        )}
        {tabAttiva === 'info' && persona.ruolo === 'utente' && <InfoPanel persona={persona} />}
        {tabAttiva === 'diario' && persona.ruolo === 'utente' && <DiarioPanel persona={persona} />}
        {tabAttiva === 'note' && persona.ruolo === 'utente' && <NotePanel persona={persona} />}
        {tabAttiva === 'note' && persona.ruolo !== 'utente' && (
          <>
            {persona.bisogni && persona.bisogni.length > 0 && (
              <Section title="Bisogni attivi">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {persona.bisogni.map(b => <Tag key={b} label={b} />)}
                </div>
              </Section>
            )}
            <Section title="Note">
              {persona.note
                ? <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{persona.note}</p>
                : <Vuoto>Nessuna nota</Vuoto>}
            </Section>
          </>
        )}

        <button
          onClick={() => setConfermaElimina(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            border: '1.5px solid var(--prox-line)', borderRadius: 999, background: 'transparent',
            color: 'var(--prox-danger)', padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%',
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

function PannelloContatti({ persona }: { persona: Persona }) {
  const telefoni = persona.telefoni?.length ? persona.telefoni : persona.telefono ? [{ etichetta: null, numero: persona.telefono }] : []
  const comune = [persona.npa, persona.localita].filter(Boolean).join(' ')
  const haIndirizzo = !!(persona.indirizzo || comune)
  const vuoto = !persona.email && telefoni.length === 0 && !haIndirizzo && !persona.data_nascita && !persona.note_contatti

  if (vuoto) {
    return <Section title="Contatti"><Vuoto>Nessun contatto inserito. Aggiungili con “Modifica”.</Vuoto></Section>
  }

  return (
    <>
      {(persona.email || telefoni.length > 0 || persona.data_nascita) && (
        <Section title="Recapiti">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            {telefoni.map((t, i) => (
              <a key={i} href={`tel:${t.numero.replace(/\s+/g, '')}`} style={riga}>
                <Phone size={15} strokeWidth={1.75} />
                <span>{t.numero}{t.etichetta ? <span style={{ color: 'var(--prox-ink3)' }}> · {t.etichetta}</span> : null}</span>
              </a>
            ))}
            {persona.email && (
              <a href={`mailto:${persona.email}`} style={riga}><Mail size={15} strokeWidth={1.75} /> {persona.email}</a>
            )}
            {persona.data_nascita && (
              <div style={{ ...riga, cursor: 'default' }}>
                <Cake size={15} strokeWidth={1.75} />
                <span>{fmtData(persona.data_nascita)}{persona.eta != null ? <span style={{ color: 'var(--prox-ink3)' }}> · {persona.eta} anni</span> : null}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {haIndirizzo && (
        <Section title="Indirizzo">
          <div style={{ ...riga, alignItems: 'flex-start', cursor: 'default', fontSize: 14 }}>
            <MapPin size={15} strokeWidth={1.75} style={{ marginTop: 3 }} />
            <div>
              {persona.indirizzo && <div>{persona.indirizzo}</div>}
              {comune && <div>{comune}</div>}
              {(persona.comune_politico || persona.cantone) && (
                <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 3 }}>
                  Comune politico: {persona.comune_politico ?? '—'}{persona.cantone ? ` (${persona.cantone})` : ''}
                </div>
              )}
              {persona.paese && persona.paese !== 'Svizzera' && <div style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{persona.paese}</div>}
            </div>
          </div>
        </Section>
      )}

      {persona.note_contatti && (
        <Section title="Note sui contatti">
          <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{persona.note_contatti}</p>
        </Section>
      )}
    </>
  )
}

function PannelloEventi({ eventi, onApri }: { eventi: Evento[]; onApri: (id: number) => void }) {
  const [solo, setSolo] = useState<'tutti' | 'settimana'>('tutti')
  const ordinati = eventi.slice().sort((a, b) => b.data.localeCompare(a.data))
  const visibili = solo === 'settimana' ? ordinati.filter(e => e.data.slice(0, 10) >= inizioSettimana()) : ordinati
  const minuti = visibili.reduce((s, e) => s + e.durata_min, 0)

  return (
    <Section title="Storico eventi" count={visibili.length}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {([['tutti', 'Tutti'], ['settimana', 'Questa settimana']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSolo(k)} style={{
            padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
            background: solo === k ? 'var(--prox-accent)' : 'var(--prox-surface2)',
            color: solo === k ? '#fff' : 'var(--prox-ink2)',
          }}>{l}</button>
        ))}
      </div>

      {visibili.length === 0
        ? <Vuoto>Nessun evento registrato</Vuoto>
        : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibili.map(e => (
                <div key={e.id} onClick={() => onApri(e.id)} style={{
                  display: 'flex', alignItems: 'stretch', borderRadius: 10, overflow: 'hidden',
                  border: '1px solid var(--prox-line2)', background: 'var(--prox-surface)', cursor: 'pointer',
                }}>
                  <div style={{ width: 4, background: colorForTipo(e.tipo), flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: '9px 11px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div>
                      <EventTypeDot tipo={e.tipo} showLabel size={7} />
                      {e.luogo && <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginTop: 2 }}>{e.luogo.nome}</div>}
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>{fmtData(e.data)}</div>
                      <div style={{ fontSize: 11, color: 'var(--prox-ink3)', fontFamily: 'ui-monospace, monospace' }}>{ore(e.durata_min)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10,
              borderTop: '1px solid var(--prox-line2)', fontSize: 13, color: 'var(--prox-ink2)',
            }}>
              <span>Totale incontri <strong>{visibili.length}</strong></span>
              <span>Totale ore <strong>{ore(minuti)}</strong></span>
            </div>
          </>
        )}
    </Section>
  )
}

const riga: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, color: 'var(--prox-ink2)', textDecoration: 'none',
}

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 999, background: 'var(--prox-surface)',
  border: '1px solid var(--prox-line)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}

function Vuoto({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--prox-ink3)', margin: 0 }}>{children}</p>
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <Card padding="14px 16px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="prox-label">{title}</span>
        {count !== undefined && <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{count}</span>}
      </div>
      {children}
    </Card>
  )
}
