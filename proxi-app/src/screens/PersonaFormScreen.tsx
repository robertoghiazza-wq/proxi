// Scheda persona — nuova e modifica (stesso modulo)

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { ChipsInput } from '../components/ChipsInput'
import { IndirizzoField } from '../components/IndirizzoField'
import { INDIRIZZO_VUOTO, validaIndirizzo, type Indirizzo } from '../lib/geo'
import { etichettaRuolo, etichettaTipo } from '../lib/persona'
import { useRuoli } from '../hooks/useRuoli'
import { usePersone, usePersona, useCreatePersona, useUpdatePersona } from '../hooks/usePersone'
import type { Persona, RuoloPersona, Telefono } from '../types'

const TIPI: { key: RuoloPersona; hint: string }[] = [
  { key: 'utente',     hint: 'Persona seguita dal servizio' },
  { key: 'dipendente', hint: 'Operatore dell’ente' },
  { key: 'rete',       hint: 'Medico, docente, referente… (persone fuori dall’ente)' },
]

const ETICHETTE_TEL = ['Natel', 'Casa', 'Lavoro', 'Genitore', 'Altro']

const SESSI: { key: 'M' | 'F' | 'altro'; label: string }[] = [
  { key: 'M', label: 'Maschio' },
  { key: 'F', label: 'Femmina' },
  { key: 'altro', label: 'Altro' },
]

const LINGUE = ['IT', 'DE', 'FR', 'EN', 'ES', 'PT', 'AR', 'PL', 'SQ', 'SR', 'TR', 'RO']
const TAG_BASE = ['senza fissa dimora', 'minore', 'dipendenza', 'migrante', 'prostituzione', 'anziano', 'salute']

export function PersonaFormScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: persona, isLoading } = usePersona(Number(id))

  if (!id) return <PersonaForm />
  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }
  if (!persona) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Persona non trovata
        <br />
        <button onClick={() => navigate('/persone')} style={{ marginTop: 12, cursor: 'pointer' }}>← Torna alla lista</button>
      </div>
    )
  }
  return <PersonaForm persona={persona} />
}

export function PersonaForm({ persona, initialRuolo, onClose, onSaved }: {
  persona?: Persona
  initialRuolo?: RuoloPersona
  onClose?: () => void
  onSaved?: (p: Persona) => void
}) {
  const navigate = useNavigate()
  const create = useCreatePersona()
  const update = useUpdatePersona(persona?.id ?? 0)
  const mutation = persona ? update : create
  const chiudi = onClose ?? (() => navigate(persona ? `/persone/${persona.id}` : '/persone'))
  const { data: tutte = [] } = usePersone()
  const { data: ruoli = [] } = useRuoli()

  const [ruolo, setRuolo] = useState<RuoloPersona>(persona?.ruolo ?? initialRuolo ?? 'utente')
  const [ruoloId, setRuoloId] = useState<number | null>(persona?.ruolo_id ?? null)
  const [anonimo, setAnonimo] = useState(persona?.anonimo ?? false)
  const [nome, setNome] = useState(persona?.nome ?? '')
  const [cognome, setCognome] = useState(persona?.cognome ?? '')
  const [soprannome, setSoprannome] = useState(persona?.soprannome ?? '')
  const [dataNascita, setDataNascita] = useState(persona?.data_nascita?.slice(0, 10) ?? '')
  const [eta, setEta] = useState(persona?.eta != null ? String(persona.eta) : '')
  const [sesso, setSesso] = useState<Persona['sesso']>(persona?.sesso ?? null)
  const [lingue, setLingue] = useState<string[]>(persona?.lingue ?? [])
  const [tag, setTag] = useState<string[]>(persona?.tag ?? [])
  const [bisogni, setBisogni] = useState<string[]>(persona?.bisogni ?? [])
  const [telefoni, setTelefoni] = useState<Telefono[]>(
    persona?.telefoni?.length ? persona.telefoni
      : persona?.telefono ? [{ etichetta: null, numero: persona.telefono }] : [],
  )
  const [addr, setAddr] = useState<Indirizzo>({
    ...INDIRIZZO_VUOTO,
    indirizzo: persona?.indirizzo ?? '',
    npa: persona?.npa ?? '',
    localita: persona?.localita ?? '',
    comune_politico: persona?.comune_politico ?? '',
    bfs: persona?.bfs ?? '',
    cantone: persona?.cantone ?? '',
    paese: persona?.paese ?? 'Svizzera',
  })
  const [noteContatti, setNoteContatti] = useState(persona?.note_contatti ?? '')
  const [email, setEmail] = useState(persona?.email ?? '')
  const [note, setNote] = useState(persona?.note ?? '')
  const [errore, setErrore] = useState('')

  const tagSuggeriti = [...new Set([...tutte.flatMap(p => p.tag ?? []), ...TAG_BASE])]
  const bisogniSuggeriti = [...new Set(tutte.flatMap(p => p.bisogni ?? []))]

  async function salva() {
    const n = nome.trim()
    const c = cognome.trim()
    const s = soprannome.trim()
    if (!n && !c && !s) { setErrore('Inserisci almeno un nome o un soprannome'); return }
    if (anonimo && !s) { setErrore('Una persona anonima ha bisogno di un soprannome'); return }
    if (eta && (Number(eta) < 0 || Number(eta) > 120)) { setErrore('Età non valida'); return }
    setErrore('')
    const v = await validaIndirizzo(addr)
    if (!v.ok) { setErrore(v.errore); return }
    const a = { ...addr, ...(v.patch ?? {}) }
    setAddr(a)
    try {
      const saved = await mutation.mutateAsync({
        ruolo,
        anonimo,
        ruolo_id: ruoloId,
        nome: n || null,
        cognome: c || null,
        soprannome: s || null,
        data_nascita: dataNascita || null,
        eta: dataNascita ? null : eta ? Number(eta) : null,
        sesso,
        lingue,
        tag,
        bisogni: ruolo === 'utente' ? bisogni : [],
        telefoni: telefoni
          .filter(t => t.numero.trim())
          .map(t => ({ etichetta: t.etichetta?.trim() || null, numero: t.numero.trim() })),
        email: email.trim() || null,
        indirizzo: a.indirizzo.trim() || null,
        npa: a.npa.trim() || null,
        localita: a.localita.trim() || null,
        comune_politico: a.comune_politico.trim() || null,
        bfs: a.bfs.trim() || null,
        cantone: a.cantone.trim() || null,
        paese: a.paese.trim() || null,
        note_contatti: noteContatti.trim() || null,
        note: note.trim() || null,
      })
      if (onSaved) onSaved(saved as Persona)
      else chiudi()
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <div style={{
      background: 'var(--prox-bg)', flex: 1, display: 'flex',
      flexDirection: 'column', width: '100%', overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={chiudi} aria-label="Chiudi" style={ghostBtn}>
          <X size={20} strokeWidth={1.75} />
        </button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
          {persona ? 'Modifica persona' : 'Nuova persona'}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {errore && (
        <div style={{
          padding: '8px 16px', fontSize: 13, fontWeight: 500,
          background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)',
          borderBottom: '1px solid var(--prox-line)',
        }}>{errore}</div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Titolo>Identità</Titolo>

        <Field label="Tipo">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIPI.map(t => <Pill key={t.key} active={ruolo === t.key} onClick={() => setRuolo(t.key)}>{etichettaTipo(t.key)}</Pill>)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>
            {TIPI.find(t => t.key === ruolo)?.hint}
          </div>
        </Field>

        <Field label="Ruolo">
          <select
            value={ruoloId ?? ''}
            onChange={e => setRuoloId(e.target.value ? Number(e.target.value) : null)}
            style={{ ...input, appearance: 'auto' }}
          >
            <option value="">— nessun ruolo —</option>
            {ruoli.map(r => <option key={r.id} value={r.id}>{etichettaRuolo(r, sesso)}</option>)}
          </select>
          <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>
            Il ruolo predefinito negli eventi; in ogni evento si può cambiare. La forma (maschile/femminile) segue il sesso.
          </div>
        </Field>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
          background: 'var(--prox-surface)', border: '1px solid var(--prox-line)',
          borderRadius: 12, cursor: 'pointer',
        }}>
          <input type="checkbox" checked={anonimo} onChange={e => setAnonimo(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--prox-accent)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Persona anonima</div>
            <div style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>Nelle liste compare solo il soprannome</div>
          </div>
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label={anonimo ? 'Nome (non mostrato)' : 'Nome'}>
              <input value={nome} onChange={e => setNome(e.target.value)} style={input} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label={anonimo ? 'Cognome (non mostrato)' : 'Cognome'}>
              <input value={cognome} onChange={e => setCognome(e.target.value)} style={input} />
            </Field>
          </div>
        </div>
        <Field label={anonimo ? 'Soprannome *' : 'Soprannome'}>
          <input value={soprannome} onChange={e => setSoprannome(e.target.value)} placeholder="Come lo chiamano" style={input} />
        </Field>

        <Field label="Sesso">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SESSI.map(x => (
              <Pill key={x.key} active={sesso === x.key} onClick={() => setSesso(sesso === x.key ? null : x.key)}>{x.label}</Pill>
            ))}
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Data di nascita">
              <input type="date" value={dataNascita} max={new Date().toISOString().slice(0, 10)}
                onChange={e => setDataNascita(e.target.value)} style={input} />
            </Field>
          </div>
          <div style={{ width: 110 }}>
            <Field label="Età">
              {dataNascita
                ? <div style={{ ...input, background: 'var(--prox-surface2)', color: 'var(--prox-ink2)' }}>{etaDa(dataNascita)}</div>
                : <input value={eta} onChange={e => setEta(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    inputMode="numeric" placeholder="circa" style={input} />}
            </Field>
          </div>
        </div>

        <Field label="Lingue">
          <ChipsInput values={lingue} onChange={setLingue} placeholder="Aggiungi una lingua" suggestions={LINGUE} />
        </Field>

        <Field label="Tag">
          <ChipsInput values={tag} onChange={setTag} placeholder="Es. minore, dipendenza…" suggestions={tagSuggeriti} />
        </Field>

        {ruolo === 'utente' && (
          <Field label="Bisogni attivi">
            <ChipsInput values={bisogni} onChange={setBisogni} placeholder="Es. alloggio, documenti…" suggestions={bisogniSuggeriti} />
          </Field>
        )}

        <Titolo>Contatti</Titolo>

        <Field label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoCapitalize="none" placeholder="nome@esempio.ch" style={input} />
        </Field>

        <Field label="Telefoni">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {telefoni.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input
                  list="etichette-tel"
                  value={t.etichetta ?? ''}
                  onChange={e => setTelefoni(ts => ts.map((x, j) => j === i ? { ...x, etichetta: e.target.value } : x))}
                  placeholder="Natel"
                  style={{ ...input, width: 108, flexShrink: 0 }}
                />
                <input
                  value={t.numero}
                  inputMode="tel"
                  onChange={e => setTelefoni(ts => ts.map((x, j) => j === i ? { ...x, numero: e.target.value } : x))}
                  placeholder="079 000 00 00"
                  style={{ ...input, flex: 1, minWidth: 0 }}
                />
                <button onClick={() => setTelefoni(ts => ts.filter((_, j) => j !== i))} aria-label="Rimuovi telefono" style={ghostBtn}>
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
            ))}
            <button onClick={() => setTelefoni(ts => [...ts, { etichetta: ts.length ? null : 'Natel', numero: '' }])} style={{
              alignSelf: 'flex-start', border: '1px dashed var(--prox-line)', background: 'transparent', cursor: 'pointer',
              borderRadius: 999, padding: '6px 14px', fontSize: 13, color: 'var(--prox-ink2)',
            }}>
              + Aggiungi telefono
            </button>
            <datalist id="etichette-tel">{ETICHETTE_TEL.map(e => <option key={e} value={e} />)}</datalist>
          </div>
        </Field>

        <Field label="Indirizzo">
          <IndirizzoField value={addr} onChange={patch => setAddr(a => ({ ...a, ...patch }))} />
        </Field>

        <Field label="Note sui contatti">
          <textarea value={noteContatti} onChange={e => setNoteContatti(e.target.value)} rows={2}
            placeholder="Altri indirizzi, numeri, orari per essere raggiunti…" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>

        <Titolo>Note</Titolo>
        <Field label="Note">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Contesto, orari preferiti, cose da ricordare…" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
      </div>

      <div style={{
        padding: '12px 16px', paddingBottom: 'max(12px, var(--sab))',
        background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)',
      }}>
        <button onClick={salva} disabled={mutation.isPending} style={{
          width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
          background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', opacity: mutation.isPending ? 0.6 : 1,
        }}>
          {mutation.isPending ? 'Salvo…' : persona ? 'Salva modifiche' : 'Crea persona'}
        </button>
      </div>
    </div>
  )
}

function etaDa(iso: string): string {
  const n = new Date(iso)
  const oggi = new Date()
  let anni = oggi.getFullYear() - n.getFullYear()
  if (oggi < new Date(oggi.getFullYear(), n.getMonth(), n.getDate())) anni--
  return `${anni} anni`
}

function Titolo({ children }: { children: React.ReactNode }) {
  return (
    <div className="prox-display" style={{
      fontSize: 15, fontWeight: 700, paddingTop: 6, borderTop: '1px solid var(--prox-line)', marginTop: 4,
    }}>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="prox-label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
      fontSize: 13.5, fontWeight: 600,
      background: active ? 'var(--prox-accent)' : 'var(--prox-surface2)',
      color: active ? '#fff' : 'var(--prox-ink2)',
    }}>
      {children}
    </button>
  )
}

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
  color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
