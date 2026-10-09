// Scheda persona — identità + tab (Contatti, Eventi, Servizi, Note)

import { useTipiEvento } from '../hooks/useTipi'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit, Plus, AlertTriangle, Trash2, Mail, MapPin, Phone, MessageSquare } from 'lucide-react'
import { useTitoloSticky } from '../components/RiferimentoSticky'
import { BarraScheda } from '../components/BarraScheda'
import { RigaContatti, IconaWhatsApp } from '../components/RigaContatti'
import { linkSms, linkTel, linkWhatsApp } from '../lib/contatti'
import { AvatarPersona } from '../components/AvatarPersona'
import { FotoPersona } from '../components/FotoPersona'
import { Tag } from '../components/Tag'
import { Card } from '../components/Card'
import { EventTypeDot } from '../components/EventTypeDot'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { InfoPanel, NotePanel, DiarioPanel } from './SchedaUtentePanels'
import { ContrattoPanel, AccountPanel } from './SchedaDipendentePanels'
import { DocumentiPanel } from './SchedaDocumenti'
import { OreView } from '../components/OreView'
import { BarraTab, BarraSalva, BtnModifica, Titolo, Voce, testoStile } from '../components/SchedaUi'
import {
  AnagraficaCampi, ContattiCampi, NoteCampi, anagraficaDa, contattiDa, noteDa,
  datiAnagrafica, datiContatti, datiNote,
} from '../components/PersonaCampi'
import { useGestore } from '../hooks/useAuth'
import { nomePersona, etichettaRuolo, etichettaTipo } from '../lib/persona'
import { usePersona, useDeletePersona, useUpdatePersona } from '../hooks/usePersone'
import { useRuoli } from '../hooks/useRuoli'
import type { Persona, Evento } from '../types'

const TAG_VULNERABILI = ['senza fissa dimora', 'minore', 'dipendenza', 'prostituzione']

type TabKey = 'anagrafica' | 'contatti' | 'eventi' | 'servizi' | 'info' | 'note' | 'diario' | 'ore' | 'documenti' | 'contratto' | 'user'

function tabPer(p: Persona, gestore: boolean): { key: TabKey; label: string }[] {
  const base = [{ key: 'anagrafica' as const, label: 'Anagrafica' }, { key: 'contatti' as const, label: 'Contatti' }]
  if (p.ruolo === 'utente') {
    return [...base, { key: 'eventi', label: 'Eventi' }, { key: 'info', label: 'Info' }, { key: 'note', label: 'Note' }, { key: 'diario', label: 'Diario' }, { key: 'documenti', label: 'Documenti' }]
  }
  if (p.ruolo === 'dipendente') {
    // contratto e ore subito dopo i dati base: su mobile le ultime tab restano fuori schermo
    return [
      ...base,
      ...(gestore ? [{ key: 'contratto' as const, label: 'Contratto' }, { key: 'ore' as const, label: 'Ore' }] : []),
      { key: 'eventi', label: 'Eventi' }, { key: 'note', label: 'Note' },
      ...(gestore ? [{ key: 'documenti' as const, label: 'Documenti' }, { key: 'user' as const, label: 'User' }] : []),
    ]
  }
  return [...base, { key: 'servizi', label: 'Servizi' }, { key: 'eventi', label: 'Eventi' }, { key: 'note', label: 'Note' }, { key: 'documenti', label: 'Documenti' }]
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

export function PersonaDetail({ apriInModifica }: { apriInModifica?: boolean }) {
  const { setTitolo, fuori } = useTitoloSticky()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: persona, isLoading } = usePersona(Number(id))
  const { data: ruoli = [] } = useRuoli()
  const elimina = useDeletePersona()
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [tab, setTab] = useState<TabKey>(apriInModifica ? 'anagrafica' : 'contatti')
  const [modificaAnag, setModificaAnag] = useState(!!apriInModifica)
  const gestore = useGestore()

  if (isLoading) {
    return <><BarraScheda lista="/persone" etichettaLista="Persone" /><div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div></>
  }

  if (!persona) {
    return (
      <>
        <BarraScheda lista="/persone" etichettaLista="Persone" />
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Persona non trovata</div>
      </>
    )
  }

  const isVuln = persona.tag?.some(t => TAG_VULNERABILI.includes(t))
  const name = nomePersona(persona)
  const ruolo = etichettaRuolo(ruoli.find(r => r.id === persona.ruolo_id), persona.sesso)
  const tabs = tabPer(persona, gestore)
  const tabAttiva = tabs.some(t => t.key === tab) ? tab : 'anagrafica'

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100%' }}>
      <BarraScheda
        lista="/persone" etichettaLista="Persone" titolo={name} titoloVisibile={fuori}
        sottotitolo={[etichettaTipo(persona.ruolo), ruolo].filter(Boolean).join(' · ')}
        icona={<AvatarPersona persona={persona} size={28} />}
        azioni={[
          { etichetta: 'Nuovo evento', icona: <Plus size={17} strokeWidth={2.5} />, primaria: true, onClick: () => navigate('/eventi/nuovo', { state: { personaId: persona.id } }) },
          { etichetta: 'Modifica anagrafica', icona: <Edit size={18} strokeWidth={1.75} />, onClick: () => { setTab('anagrafica'); setModificaAnag(true) } },
        ]}
        menu={[{ etichetta: 'Elimina persona', icona: <Trash2 size={16} />, pericolo: true, onClick: () => setConfermaElimina(true) }]}
      />
      <div style={{
        background: 'linear-gradient(180deg, var(--prox-accent-soft) 0%, var(--prox-bg) 100%)',
        padding: '0 16px 14px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <FotoPersona persona={persona} size={72} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <h1 ref={setTitolo} className="prox-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4, color: 'var(--prox-ink)', margin: 0 }}>
                {name}
              </h1>
              {isVuln && <AlertTriangle size={16} color="oklch(0.60 0.14 70)" strokeWidth={2} />}
            </div>

            <div style={{ fontSize: 13, color: 'var(--prox-ink3)', marginTop: 4 }}>
              {[
                etichettaTipo(persona.ruolo) + (ruolo ? ` · ${ruolo}` : ''),
                persona.eta != null ? `${persona.eta} anni` : null,
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

        <RigaContatti telefono={persona.telefono ?? persona.telefoni?.[0]?.numero} email={persona.email} style={{ marginTop: 16 }} />
      </div>

      <BarraTab tabs={tabs} attiva={tabAttiva} onScegli={setTab} />

      <div style={{ padding: '14px 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tabAttiva === 'anagrafica' && <PannelloAnagrafica persona={persona} modifica={modificaAnag} setModifica={setModificaAnag} />}
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
        {tabAttiva === 'note' && persona.ruolo !== 'utente' && <PannelloNote persona={persona} />}
        {tabAttiva === 'documenti' && <DocumentiPanel persona={persona} />}
        {tabAttiva === 'ore' && persona.ruolo === 'dipendente' && gestore && <OreView persona={persona.id} gestore />}
        {tabAttiva === 'contratto' && persona.ruolo === 'dipendente' && gestore && <ContrattoPanel persona={persona} />}
        {tabAttiva === 'user' && persona.ruolo === 'dipendente' && gestore && <AccountPanel persona={persona} />}
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

const dataBreve = (d: string) => new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })

function PannelloAnagrafica({ persona, modifica, setModifica }: { persona: Persona; modifica: boolean; setModifica: (b: boolean) => void }) {
  const { data: ruoli = [] } = useRuoli()
  const aggiorna = useUpdatePersona(persona.id)
  const [bozza, setBozza] = useState(() => anagraficaDa(persona))
  const [errore, setErrore] = useState('')

  async function salva() {
    const r = datiAnagrafica(bozza)
    if ('errore' in r) { setErrore(r.errore); return }
    setErrore('')
    try { await aggiorna.mutateAsync(r.dati); setModifica(false) }
    catch (e) { setErrore((e as Error).message || 'Errore nel salvataggio') }
  }

  if (modifica) {
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo="Anagrafica" />
          <AnagraficaCampi value={bozza} onChange={p => setBozza(b => ({ ...b, ...p }))} />
        </Card>
        <BarraSalva errore={errore} caricamento={aggiorna.isPending} onSalva={salva} onAnnulla={() => { setBozza(anagraficaDa(persona)); setErrore(''); setModifica(false) }} />
      </>
    )
  }

  const ruolo = etichettaRuolo(ruoli.find(r => r.id === persona.ruolo_id), persona.sesso)
  const sesso = persona.sesso === 'M' ? 'Maschio' : persona.sesso === 'F' ? 'Femmina' : persona.sesso === 'altro' ? 'Altro' : '—'
  return (
    <Card padding="14px 16px">
      <Titolo titolo="Anagrafica" azione={<BtnModifica onClick={() => { setBozza(anagraficaDa(persona)); setModifica(true) }} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px 16px' }}>
        <Voce l="Tipo" v={etichettaTipo(persona.ruolo)} />
        <Voce l="Ruolo" v={ruolo || '—'} />
        <Voce l="Nome" v={persona.nome ?? '—'} />
        <Voce l="Cognome" v={persona.cognome ?? '—'} />
        <Voce l="Soprannome" v={persona.soprannome ?? '—'} />
        <Voce l="Sesso" v={sesso} />
        <Voce l="Data di nascita" v={persona.data_nascita ? dataBreve(persona.data_nascita) : '—'} />
        <Voce l="Età" v={persona.eta != null ? `${persona.eta} anni${persona.data_nascita ? '' : ' (circa)'}` : '—'} />
        <Voce l="Persona anonima" v={persona.anonimo ? 'Sì' : 'No'} />
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginBottom: 4, fontWeight: 500 }}>Lingue</div>
          {persona.lingue?.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{persona.lingue.map(l => <Tag key={l} label={l} soft />)}</div> : <Vuoto>—</Vuoto>}
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginBottom: 4, fontWeight: 500 }}>Tag</div>
          {persona.tag?.length
            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{persona.tag.map(t => <Tag key={t} label={t} warn={TAG_VULNERABILI.includes(t)} soft={!TAG_VULNERABILI.includes(t)} />)}</div>
            : <Vuoto>—</Vuoto>}
        </div>
      </div>
    </Card>
  )
}

function PannelloNote({ persona }: { persona: Persona }) {
  const aggiorna = useUpdatePersona(persona.id)
  const [modifica, setModifica] = useState(false)
  const [bozza, setBozza] = useState(() => noteDa(persona))
  const [errore, setErrore] = useState('')

  if (modifica) {
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo="Note" />
          <NoteCampi value={bozza} onChange={p => setBozza(b => ({ ...b, ...p }))} utente={false} />
        </Card>
        <BarraSalva errore={errore} caricamento={aggiorna.isPending} onAnnulla={() => { setModifica(false); setErrore('') }}
          onSalva={async () => {
            setErrore('')
            try { await aggiorna.mutateAsync(datiNote(bozza, false)); setModifica(false) }
            catch (e) { setErrore((e as Error).message || 'Errore nel salvataggio') }
          }} />
      </>
    )
  }
  return (
    <Card padding="14px 16px">
      <Titolo titolo="Note" azione={<BtnModifica onClick={() => { setBozza(noteDa(persona)); setModifica(true) }} />} />
      {persona.note ? <p style={testoStile}>{persona.note}</p> : <Vuoto>Nessuna nota</Vuoto>}
    </Card>
  )
}

function PannelloContatti({ persona }: { persona: Persona }) {
  const aggiorna = useUpdatePersona(persona.id)
  const [modifica, setModifica] = useState(false)
  const [bozza, setBozza] = useState(() => contattiDa(persona))
  const [errore, setErrore] = useState('')

  if (modifica) {
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo="Contatti" />
          <ContattiCampi value={bozza} onChange={p => setBozza(b => ({ ...b, ...p }))} />
        </Card>
        <BarraSalva errore={errore} caricamento={aggiorna.isPending} onAnnulla={() => { setModifica(false); setErrore('') }}
          onSalva={async () => {
            setErrore('')
            const r = await datiContatti(bozza)
            if ('errore' in r) { setErrore(r.errore); return }
            try { await aggiorna.mutateAsync(r.dati); setModifica(false) }
            catch (e) { setErrore((e as Error).message || 'Errore nel salvataggio') }
          }} />
      </>
    )
  }

  const telefoni = persona.telefoni?.length ? persona.telefoni : persona.telefono ? [{ etichetta: null, numero: persona.telefono }] : []
  const comune = [persona.npa, persona.localita].filter(Boolean).join(' ')
  const haIndirizzo = !!(persona.indirizzo || comune)
  const vuotoTutto = !persona.email && telefoni.length === 0 && !haIndirizzo && !persona.note_contatti
  const avvia = () => { setBozza(contattiDa(persona)); setErrore(''); setModifica(true) }

  return (
    <>
      {vuotoTutto && <Section title="Contatti" azione={<BtnModifica onClick={avvia} />}><Vuoto>Nessun contatto inserito.</Vuoto></Section>}

      {(persona.email || telefoni.length > 0) && (
        <Section title="Recapiti" azione={<BtnModifica onClick={avvia} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            {telefoni.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={linkTel(t.numero) ?? undefined} style={{ ...riga, flex: 1, minWidth: 0 }}>
                  <Phone size={15} strokeWidth={1.75} />
                  <span>{t.numero}{t.etichetta ? <span style={{ color: 'var(--prox-ink3)' }}> · {t.etichetta}</span> : null}</span>
                </a>
                {linkSms(t.numero) && <a href={linkSms(t.numero)!} aria-label={`Messaggio a ${t.numero}`} title="Messaggio" style={{ ...riga, padding: 6 }}><MessageSquare size={16} strokeWidth={1.75} /></a>}
                {linkWhatsApp(t.numero) && <a href={linkWhatsApp(t.numero)!} target="_blank" rel="noreferrer" aria-label={`WhatsApp a ${t.numero}`} title="WhatsApp" style={{ ...riga, padding: 6, color: '#1f9d55' }}><IconaWhatsApp size={17} /></a>}
              </div>
            ))}
            {persona.email && <a href={`mailto:${persona.email}`} style={riga}><Mail size={15} strokeWidth={1.75} /> {persona.email}</a>}
          </div>
        </Section>
      )}

      {haIndirizzo && (
        <Section title="Indirizzo" azione={!persona.email && telefoni.length === 0 ? <BtnModifica onClick={avvia} /> : undefined}>
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
        <Section title="Note sui contatti"><p style={testoStile}>{persona.note_contatti}</p></Section>
      )}
    </>
  )
}

function PannelloEventi({ eventi, onApri }: { eventi: Evento[]; onApri: (id: number) => void }) {
  const { colore: colorForTipo } = useTipiEvento()
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

function Vuoto({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--prox-ink3)', margin: 0 }}>{children}</p>
}

function Section({ title, count, azione, children }: { title: string; count?: number; azione?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card padding="14px 16px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="prox-label">{title}</span>
        {azione ?? (count !== undefined && <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{count}</span>)}
      </div>
      {children}
    </Card>
  )
}
