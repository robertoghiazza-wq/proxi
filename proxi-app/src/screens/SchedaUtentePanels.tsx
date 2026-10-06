// Schede Info, Note e Diario di una persona di tipo "utente"

import { useState } from 'react'
import { Edit, Plus, Trash2, X } from 'lucide-react'
import { Card } from '../components/Card'
import { SelectVoce } from '../components/SelectVoce'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DateField } from '../components/DateFields'
import { Tag } from '../components/Tag'
import { Titolo, BtnModifica, BarraSalva, etichetta, vuoto, testoStile as testo, campo, ghost, btn as btnPiccolo } from '../components/SchedaUi'
import { useScheda, useSalvaScheda, useDiario } from '../hooks/useSchedaUtente'
import { useUpdatePersona } from '../hooks/usePersone'
import { NoteCampi, noteDa, datiNote, type NoteBozza } from '../components/PersonaCampi'
import { getCurrentUser } from '../lib/api-client'
import type { Persona, ProfiloUtente, Sostanza, VoceDiario } from '../types'

type CampoInfo = { key: keyof ProfiloUtente; label: string; categoria?: string }

const CAMPI_INFO: CampoInfo[] = [
  { key: 'situazione_familiare', label: 'Situazione familiare', categoria: 'situazione_familiare' },
  { key: 'fratelli', label: 'Fratelli', categoria: 'fratelli' },
  { key: 'modalita_educativa', label: 'Modalità educativa', categoria: 'modalita_educativa' },
  { key: 'liberta_uscita', label: 'Libertà di uscita', categoria: 'liberta_uscita' },
  { key: 'origine', label: 'Origine', categoria: 'origine' },
  { key: 'madrelingua', label: 'Madrelingua', categoria: 'madrelingua' },
  { key: 'formazione_madre', label: 'Formazione madre', categoria: 'formazione' },
  { key: 'formazione_padre', label: 'Formazione padre', categoria: 'formazione' },
  { key: 'occupazione', label: 'Occupazione', categoria: 'occupazione' },
  { key: 'patente', label: 'Patente' },
  { key: 'sport_hobby', label: 'Sport e hobby' },
]

const AREE_NOTE: { key: keyof ProfiloUtente; label: string }[] = [
  { key: 'storia_familiare', label: 'Storia familiare e personale' },
  { key: 'storia_scolastica', label: 'Storia scolastica e lavorativa' },
  { key: 'storia_medica', label: 'Storia medica' },
  { key: 'progetti_interventi', label: 'Progetti e interventi' },
]

const SOSTANZA_VUOTA: Sostanza = { sostanza: null, con_chi: null, frequenza: null, abuso: null, note: null }

function Caricamento({ isLoading, error }: { isLoading: boolean; error: unknown }) {
  if (isLoading) return <p style={vuoto}>Caricamento…</p>
  return <p style={{ ...vuoto, color: 'var(--prox-danger)' }}>{(error as Error)?.message ?? 'Errore di caricamento'}</p>
}

// ─── INFO ─────────────────────────────────────────────────────────────────

export function InfoPanel({ persona }: { persona: Persona }) {
  const { data, isLoading, error } = useScheda(persona.id)
  const salva = useSalvaScheda(persona.id)
  const [modifica, setModifica] = useState(false)
  const [profilo, setProfilo] = useState<Partial<ProfiloUtente>>({})
  const [sostanze, setSostanze] = useState<Sostanza[]>([])
  const [errore, setErrore] = useState('')

  if (!data) return <Card padding="14px 16px"><Caricamento isLoading={isLoading} error={error} /></Card>

  function inizia() {
    setProfilo(Object.fromEntries(CAMPI_INFO.map(c => [c.key, data!.profilo[c.key]])))
    setSostanze(data!.sostanze.map(s => ({ ...s })))
    setErrore('')
    setModifica(true)
  }

  async function conferma() {
    setErrore('')
    try {
      await salva.mutateAsync({ ...profilo, sostanze })
      setModifica(false)
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  if (!modifica) {
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo="Profilo" azione={<BtnModifica onClick={inizia} />} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px 16px' }}>
            {CAMPI_INFO.map(c => (
              <div key={c.key}>
                <div style={etichetta}>{c.label}</div>
                <div style={{ fontSize: 14, color: data.profilo[c.key] ? 'var(--prox-ink)' : 'var(--prox-ink3)' }}>
                  {data.profilo[c.key] ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="14px 16px">
          <Titolo titolo="Consumo di sostanze" />
          {data.sostanze.length === 0
            ? <p style={vuoto}>Nessuna sostanza registrata</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.sostanze.map((s, i) => (
                  <div key={i} style={{ paddingTop: i ? 10 : 0, borderTop: i ? '1px solid var(--prox-line2)' : 'none' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <strong style={{ fontSize: 14 }}>{s.sostanza ?? '—'}</strong>
                      {s.con_chi && <Tag label={s.con_chi} soft />}
                      {s.frequenza && <Tag label={s.frequenza} soft />}
                      {s.abuso && <Tag label={`Abuso: ${s.abuso}`} warn={s.abuso !== 'No'} soft={s.abuso === 'No'} />}
                    </div>
                    {s.note && <div style={{ fontSize: 13, color: 'var(--prox-ink2)', marginTop: 4 }}>{s.note}</div>}
                  </div>
                ))}
              </div>
            )}
        </Card>
      </>
    )
  }

  const imposta = (k: keyof ProfiloUtente, v: string | null) => setProfilo(p => ({ ...p, [k]: v }))
  const impostaSost = (i: number, k: keyof Sostanza, v: string | null) =>
    setSostanze(ss => ss.map((s, j) => (j === i ? { ...s, [k]: v } : s)))

  return (
    <>
      <Card padding="14px 16px">
        <Titolo titolo="Profilo" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CAMPI_INFO.map(c => (
            <label key={c.key} style={{ display: 'block' }}>
              <div style={etichetta}>{c.label}</div>
              {c.categoria
                ? <SelectVoce categoria={c.categoria} value={profilo[c.key] ?? null} onChange={v => imposta(c.key, v)} />
                : <input value={profilo[c.key] ?? ''} onChange={e => imposta(c.key, e.target.value || null)} style={campo} />}
            </label>
          ))}
        </div>
      </Card>

      <Card padding="14px 16px">
        <Titolo titolo="Consumo di sostanze" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sostanze.map((s, i) => (
            <div key={i} style={{ background: 'var(--prox-surface2)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}><SelectVoce categoria="sostanza" value={s.sostanza} onChange={v => impostaSost(i, 'sostanza', v)} /></div>
                <button onClick={() => setSostanze(ss => ss.filter((_, j) => j !== i))} aria-label="Rimuovi sostanza" style={ghost}>
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                <SelectVoce categoria="con_chi" value={s.con_chi} onChange={v => impostaSost(i, 'con_chi', v)} />
                <SelectVoce categoria="frequenza" value={s.frequenza} onChange={v => impostaSost(i, 'frequenza', v)} />
                <SelectVoce categoria="abuso" value={s.abuso} onChange={v => impostaSost(i, 'abuso', v)} />
              </div>
              <input value={s.note ?? ''} onChange={e => impostaSost(i, 'note', e.target.value || null)} placeholder="Note" style={campo} />
            </div>
          ))}
          <button onClick={() => setSostanze(ss => [...ss, { ...SOSTANZA_VUOTA }])} style={aggiungi}>
            <Plus size={15} strokeWidth={2.4} /> Aggiungi sostanza
          </button>
        </div>
      </Card>

      <BarraSalva errore={errore} caricamento={salva.isPending} onSalva={conferma} onAnnulla={() => setModifica(false)} />
    </>
  )
}

// ─── NOTE ─────────────────────────────────────────────────────────────────

export function NotePanel({ persona }: { persona: Persona }) {
  const { data, isLoading, error } = useScheda(persona.id)
  const salva = useSalvaScheda(persona.id)
  const aggiornaPersona = useUpdatePersona(persona.id)
  const [modifica, setModifica] = useState(false)
  const [testi, setTesti] = useState<Partial<ProfiloUtente>>({})
  const [generali, setGenerali] = useState<NoteBozza>(() => noteDa(persona))
  const [errore, setErrore] = useState('')

  function inizia() {
    if (!data) return
    setTesti(Object.fromEntries(AREE_NOTE.map(x => [x.key, data.profilo[x.key]])))
    setGenerali(noteDa(persona))
    setErrore('')
    setModifica(true)
  }

  async function conferma() {
    setErrore('')
    try {
      await aggiornaPersona.mutateAsync(datiNote(generali, true))
      await salva.mutateAsync(testi)
      setModifica(false)
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  if (!data) return <Card padding="14px 16px"><Caricamento isLoading={isLoading} error={error} /></Card>

  if (modifica) {
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo="Bisogni e note generali" />
          <NoteCampi value={generali} onChange={p => setGenerali(g => ({ ...g, ...p }))} utente />
        </Card>
        {AREE_NOTE.map(a => (
          <Card key={a.key} padding="14px 16px">
            <Titolo titolo={a.label} />
            <textarea
              value={testi[a.key] ?? ''}
              onChange={e => setTesti(t => ({ ...t, [a.key]: e.target.value }))}
              rows={5}
              style={{ ...campo, resize: 'vertical', lineHeight: 1.55 }}
            />
          </Card>
        ))}
        <BarraSalva errore={errore} caricamento={salva.isPending || aggiornaPersona.isPending} onAnnulla={() => setModifica(false)} onSalva={conferma} />
      </>
    )
  }

  return (
    <>
      <Card padding="14px 16px">
        <Titolo titolo="Bisogni e note generali" azione={<BtnModifica onClick={inizia} />} />
        {persona.bisogni && persona.bisogni.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: persona.note ? 10 : 0 }}>
            {persona.bisogni.map(b => <Tag key={b} label={b} />)}
          </div>
        )}
        {persona.note ? <p style={testo}>{persona.note}</p> : !persona.bisogni?.length && <p style={vuoto}>Nessun bisogno o nota inseriti</p>}
      </Card>
      {AREE_NOTE.map(a => (
        <Card key={a.key} padding="14px 16px">
          <Titolo titolo={a.label} />
          {data.profilo[a.key] ? <p style={testo}>{data.profilo[a.key]}</p> : <p style={vuoto}>Nessuna nota</p>}
        </Card>
      ))}
    </>
  )
}

// ─── DIARIO ───────────────────────────────────────────────────────────────

const oggi = () => new Date().toISOString().slice(0, 10)

function fmt(d: string) {
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

export function DiarioPanel({ persona }: { persona: Persona }) {
  const { data, isLoading, error } = useScheda(persona.id)
  const diario = useDiario(persona.id)
  const utente = getCurrentUser()
  const gestore = utente?.role === 'coordinatore' || utente?.role === 'admin'

  const [data_, setData] = useState(oggi())
  const [nota, setNota] = useState('')
  const [errore, setErrore] = useState('')
  const [inModifica, setInModifica] = useState<number | null>(null)
  const [bozza, setBozza] = useState({ data: '', nota: '' })
  const [daEliminare, setDaEliminare] = useState<VoceDiario | null>(null)

  async function aggiungi() {
    if (!data_) { setErrore('Inserisci una data valida'); return }
    if (!nota.trim()) { setErrore('Scrivi la nota'); return }
    setErrore('')
    try {
      await diario.aggiungi.mutateAsync({ data: data_, nota: nota.trim() })
      setNota('')
      setData(oggi())
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <>
      <Card padding="14px 16px">
        <Titolo titolo="Nuova voce" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 170 }}>
              <DateField value={data_} max={oggi()} onChange={e => setData(e.target.value)} style={campo} title="Data" />
            </div>
            <span style={{ fontSize: 13, color: 'var(--prox-ink3)' }}>{utente?.name}</span>
          </div>
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3} placeholder="Nota del diario…" style={{ ...campo, resize: 'vertical', lineHeight: 1.55 }} />
          {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}
          <button onClick={aggiungi} disabled={diario.aggiungi.isPending} style={{
            alignSelf: 'flex-start', padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: diario.aggiungi.isPending ? 0.6 : 1,
          }}>
            {diario.aggiungi.isPending ? 'Salvo…' : 'Aggiungi voce'}
          </button>
        </div>
      </Card>

      <Card padding="14px 16px">
        <Titolo titolo="Diario" conto={data?.diario.length} />
        {!data ? <Caricamento isLoading={isLoading} error={error} /> : data.diario.length === 0
          ? <p style={vuoto}>Nessuna voce</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.diario.map((v, i) => {
                const mia = v.autore_id === utente?.id
                const modificabile = mia || gestore
                return (
                  <div key={v.id} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--prox-line2)' : 'none' }}>
                    {inModifica === v.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ width: 170 }}>
                          <DateField value={bozza.data} max={oggi()} onChange={e => setBozza(b => ({ ...b, data: e.target.value }))} style={campo} title="Data" />
                        </div>
                        <textarea value={bozza.nota} onChange={e => setBozza(b => ({ ...b, nota: e.target.value }))} rows={4} style={{ ...campo, resize: 'vertical', lineHeight: 1.55 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={async () => {
                            if (!bozza.data || !bozza.nota.trim()) return
                            await diario.modifica.mutateAsync({ id: v.id, data: bozza.data, nota: bozza.nota.trim() })
                            setInModifica(null)
                          }} style={{ ...btnPiccolo, background: 'var(--prox-accent)', color: '#fff' }}>Salva</button>
                          <button onClick={() => setInModifica(null)} style={btnPiccolo}>Annulla</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{fmt(v.data)}</span>
                          <span style={{ fontSize: 12, color: 'var(--prox-ink3)', flex: 1 }}>{v.autore?.name ?? '—'}</span>
                          {modificabile && (
                            <>
                              <button onClick={() => { setInModifica(v.id); setBozza({ data: v.data.slice(0, 10), nota: v.nota }) }} aria-label="Modifica voce" style={ghost}>
                                <Edit size={15} strokeWidth={1.75} />
                              </button>
                              <button onClick={() => setDaEliminare(v)} aria-label="Elimina voce" style={{ ...ghost, color: 'var(--prox-danger)' }}>
                                <Trash2 size={15} strokeWidth={1.75} />
                              </button>
                            </>
                          )}
                        </div>
                        <p style={{ ...testo, marginTop: 4 }}>{v.nota}</p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
      </Card>

      <ConfirmDialog
        open={daEliminare !== null}
        danger
        title="Eliminare la voce?"
        message="La voce sparisce dal diario, ma resta nel log."
        confirmLabel="Elimina"
        loading={diario.elimina.isPending}
        error={diario.elimina.isError ? (diario.elimina.error as Error).message : null}
        onCancel={() => { setDaEliminare(null); diario.elimina.reset() }}
        onConfirm={() => daEliminare && diario.elimina.mutate(daEliminare.id, { onSuccess: () => setDaEliminare(null) })}
      />
    </>
  )
}

// ─── elementi comuni ──────────────────────────────────────────────────────

const aggiungi: React.CSSProperties = {
  alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, border: '1px dashed var(--prox-line)',
  background: 'transparent', cursor: 'pointer', borderRadius: 999, padding: '6px 14px', fontSize: 13, color: 'var(--prox-ink2)',
}
