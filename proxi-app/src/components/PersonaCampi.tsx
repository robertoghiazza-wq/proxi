// Campi della scheda persona divisi per sezione: servono sia al modal di creazione sia alla modifica nelle tab del drawer

import { X } from 'lucide-react'
import { ChipsInput } from './ChipsInput'
import { DateField } from './DateFields'
import { IndirizzoField } from './IndirizzoField'
import { INDIRIZZO_VUOTO, validaIndirizzo, type Indirizzo } from '../lib/geo'
import { etichettaRuolo, etichettaTipo } from '../lib/persona'
import { useRuoli } from '../hooks/useRuoli'
import { usePersone } from '../hooks/usePersone'
import { campo, ghost } from './SchedaUi'
import { TelefonoCampo } from './TelefonoCampo'
import { normalizza } from '../lib/telefono'
import type { Persona, RuoloPersona, Telefono } from '../types'

const TIPI: { key: RuoloPersona; hint: string }[] = [
  { key: 'utente',     hint: 'Persona seguita dal servizio' },
  { key: 'dipendente', hint: 'Operatore dell’ente' },
  { key: 'rete',       hint: 'Medico, docente, referente… (persone fuori dall’ente)' },
]
const SESSI: { key: 'M' | 'F' | 'altro'; label: string }[] = [
  { key: 'M', label: 'Maschio' }, { key: 'F', label: 'Femmina' }, { key: 'altro', label: 'Altro' },
]
const LINGUE = ['IT', 'DE', 'FR', 'EN', 'ES', 'PT', 'AR', 'PL', 'SQ', 'SR', 'TR', 'RO']
const TAG_BASE = ['senza fissa dimora', 'minore', 'dipendenza', 'migrante', 'prostituzione', 'anziano', 'salute']
// «Cellulare» e non «Natel»: lo capiscono tutti, anche i partner d'oltre confine. I valori già salvati (es. Natel) restano e si vedono.
const ETICHETTE_TEL = ['Cellulare', 'Diretto', 'Ufficio', 'Centralino', 'Casa', 'Privato', 'Genitore', 'Altro']

// ─── bozze (stato dei moduli) ─────────────────────────────────────────────

export interface AnagraficaBozza {
  ruolo: RuoloPersona
  ruoloId: number | null
  anonimo: boolean
  nome: string
  cognome: string
  soprannome: string
  sesso: Persona['sesso']
  dataNascita: string
  eta: string
  lingue: string[]
  tag: string[]
}

export interface ContattiBozza {
  email: string
  telefoni: Telefono[]
  addr: Indirizzo
  noteContatti: string
}

export interface NoteBozza {
  note: string
  bisogni: string[]
}

export const anagraficaDa = (p?: Persona, ruoloIniziale?: RuoloPersona): AnagraficaBozza => ({
  ruolo: p?.ruolo ?? ruoloIniziale ?? 'utente',
  ruoloId: p?.ruolo_id ?? null,
  anonimo: p?.anonimo ?? false,
  nome: p?.nome ?? '',
  cognome: p?.cognome ?? '',
  soprannome: p?.soprannome ?? '',
  sesso: p?.sesso ?? null,
  dataNascita: p?.data_nascita?.slice(0, 10) ?? '',
  eta: p?.eta != null && !p?.data_nascita ? String(p.eta) : '',
  lingue: p?.lingue ?? [],
  tag: p?.tag ?? [],
})

export const contattiDa = (p?: Persona): ContattiBozza => ({
  email: p?.email ?? '',
  telefoni: p?.telefoni?.length ? p.telefoni : p?.telefono ? [{ etichetta: null, numero: p.telefono }] : [],
  addr: {
    ...INDIRIZZO_VUOTO,
    indirizzo: p?.indirizzo ?? '', npa: p?.npa ?? '', localita: p?.localita ?? '',
    comune_politico: p?.comune_politico ?? '', bfs: p?.bfs ?? '', cantone: p?.cantone ?? '', paese: p?.paese ?? 'Svizzera',
  },
  noteContatti: p?.note_contatti ?? '',
})

export const noteDa = (p?: Persona): NoteBozza => ({ note: p?.note ?? '', bisogni: p?.bisogni ?? [] })

// ─── conversione in dati per il server (con controlli) ────────────────────

export function datiAnagrafica(b: AnagraficaBozza): { errore: string } | { dati: Partial<Persona> } {
  if (!b.nome.trim() && !b.cognome.trim() && !b.soprannome.trim()) return { errore: 'Inserisci almeno un nome o un soprannome' }
  if (b.anonimo && !b.soprannome.trim()) return { errore: 'Una persona anonima ha bisogno di un soprannome' }
  if (b.eta && (Number(b.eta) < 0 || Number(b.eta) > 120)) return { errore: 'Età non valida' }
  return {
    dati: {
      ruolo: b.ruolo, ruolo_id: b.ruoloId, anonimo: b.anonimo,
      nome: b.nome.trim() || null, cognome: b.cognome.trim() || null, soprannome: b.soprannome.trim() || null,
      sesso: b.sesso, data_nascita: b.dataNascita || null, eta: b.dataNascita ? null : b.eta ? Number(b.eta) : null,
      lingue: b.lingue, tag: b.tag,
    },
  }
}

export async function datiContatti(b: ContattiBozza): Promise<{ errore: string } | { dati: Partial<Persona>; indirizzo: Indirizzo }> {
  const v = await validaIndirizzo(b.addr)
  if (!v.ok) return { errore: v.errore }
  const a = { ...b.addr, ...(v.patch ?? {}) }
  return {
    indirizzo: a,
    dati: {
      email: b.email.trim() || null,
      telefoni: b.telefoni.filter(t => t.numero.trim()).map(t => ({ etichetta: t.etichetta?.trim() || null, numero: normalizza(t.numero) })),
      indirizzo: a.indirizzo.trim() || null, npa: a.npa.trim() || null, localita: a.localita.trim() || null,
      comune_politico: a.comune_politico.trim() || null, bfs: a.bfs.trim() || null, cantone: a.cantone.trim() || null,
      paese: a.paese.trim() || null, note_contatti: b.noteContatti.trim() || null,
    },
  }
}

export const datiNote = (b: NoteBozza, utente: boolean): Partial<Persona> => ({
  note: b.note.trim() || null,
  ...(utente ? { bisogni: b.bisogni } : {}),
})

// ─── campi ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="prox-label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function Pill({ attiva, onClick, children }: { attiva: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
      background: attiva ? 'var(--prox-accent)' : 'var(--prox-surface2)', color: attiva ? '#fff' : 'var(--prox-ink2)',
    }}>{children}</button>
  )
}

const colonna: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 }

function etaDa(iso: string): string {
  const n = new Date(iso)
  const oggi = new Date()
  let anni = oggi.getFullYear() - n.getFullYear()
  if (oggi < new Date(oggi.getFullYear(), n.getMonth(), n.getDate())) anni--
  return `${anni} anni`
}

export function AnagraficaCampi({ value: v, onChange }: { value: AnagraficaBozza; onChange: (patch: Partial<AnagraficaBozza>) => void }) {
  const { data: ruoli = [] } = useRuoli()
  const { data: tutte = [] } = usePersone()
  const tagSuggeriti = [...new Set([...tutte.flatMap(p => p.tag ?? []), ...TAG_BASE])]

  return (
    <div style={colonna}>
      <Field label="Tipo">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIPI.map(t => <Pill key={t.key} attiva={v.ruolo === t.key} onClick={() => onChange({ ruolo: t.key })}>{etichettaTipo(t.key)}</Pill>)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>{TIPI.find(t => t.key === v.ruolo)?.hint}</div>
      </Field>

      <Field label="Ruolo">
        <select value={v.ruoloId ?? ''} onChange={e => onChange({ ruoloId: e.target.value ? Number(e.target.value) : null })} style={{ ...campo, appearance: 'auto' }}>
          <option value="">— nessun ruolo —</option>
          {ruoli.map(r => <option key={r.id} value={r.id}>{etichettaRuolo(r, v.sesso)}</option>)}
        </select>
        <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>
          Il ruolo predefinito negli eventi; in ogni evento si può cambiare. La forma (maschile/femminile) segue il sesso.
        </div>
      </Field>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--prox-surface)',
        border: '1px solid var(--prox-line)', borderRadius: 12, cursor: 'pointer',
      }}>
        <input type="checkbox" checked={v.anonimo} onChange={e => onChange({ anonimo: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--prox-accent)' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Persona anonima</div>
          <div style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>Nelle liste compare solo il soprannome</div>
        </div>
      </label>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label={v.anonimo ? 'Nome (non mostrato)' : 'Nome'}><input value={v.nome} onChange={e => onChange({ nome: e.target.value })} style={campo} /></Field></div>
        <div style={{ flex: 1 }}><Field label={v.anonimo ? 'Cognome (non mostrato)' : 'Cognome'}><input value={v.cognome} onChange={e => onChange({ cognome: e.target.value })} style={campo} /></Field></div>
      </div>
      <Field label={v.anonimo ? 'Soprannome *' : 'Soprannome'}>
        <input value={v.soprannome} onChange={e => onChange({ soprannome: e.target.value })} placeholder="Come lo chiamano" style={campo} />
      </Field>

      <Field label="Sesso">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SESSI.map(x => <Pill key={x.key} attiva={v.sesso === x.key} onClick={() => onChange({ sesso: v.sesso === x.key ? null : x.key })}>{x.label}</Pill>)}
        </div>
      </Field>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Data di nascita">
            <DateField value={v.dataNascita} max={new Date().toISOString().slice(0, 10)} onChange={e => onChange({ dataNascita: e.target.value })} style={campo} title="Data di nascita" />
          </Field>
        </div>
        <div style={{ width: 110 }}>
          <Field label="Età">
            {v.dataNascita
              ? <div style={{ ...campo, background: 'var(--prox-surface2)', color: 'var(--prox-ink2)' }}>{etaDa(v.dataNascita)}</div>
              : <input value={v.eta} onChange={e => onChange({ eta: e.target.value.replace(/\D/g, '').slice(0, 3) })} inputMode="numeric" placeholder="circa" style={campo} />}
          </Field>
        </div>
      </div>

      <Field label="Lingue"><ChipsInput values={v.lingue} onChange={lingue => onChange({ lingue })} placeholder="Aggiungi una lingua" suggestions={LINGUE} /></Field>
      <Field label="Tag"><ChipsInput values={v.tag} onChange={tag => onChange({ tag })} placeholder="Es. minore, dipendenza…" suggestions={tagSuggeriti} /></Field>
    </div>
  )
}

export function ContattiCampi({ value: v, onChange }: { value: ContattiBozza; onChange: (patch: Partial<ContattiBozza>) => void }) {
  return (
    <div style={colonna}>
      <Field label="Email">
        <input value={v.email} onChange={e => onChange({ email: e.target.value })} inputMode="email" autoCapitalize="none" placeholder="nome@esempio.ch" style={campo} />
      </Field>

      <Field label="Telefoni">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {v.telefoni.map((t, i) => {
            const tipi = t.etichetta && !ETICHETTE_TEL.includes(t.etichetta) ? [...ETICHETTE_TEL, t.etichetta] : ETICHETTE_TEL
            const cambia = (patch: Partial<Telefono>) => onChange({ telefoni: v.telefoni.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 14, border: '1px solid var(--prox-line2)', background: 'var(--prox-surface2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select value={t.etichetta ?? ''} onChange={e => cambia({ etichetta: e.target.value || null })} aria-label="Tipo di numero"
                    style={{ ...campo, width: 'auto', padding: '6px 10px', fontSize: 13, fontWeight: 600 }}>
                    <option value="">Tipo non indicato</option>
                    {tipi.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <span style={{ flex: 1 }} />
                  <button type="button" onClick={() => onChange({ telefoni: v.telefoni.filter((_, j) => j !== i) })} aria-label="Rimuovi telefono" style={ghost}>
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
                <TelefonoCampo value={t.numero} onChange={numero => cambia({ numero })} />
              </div>
            )
          })}
          <button type="button" onClick={() => onChange({ telefoni: [...v.telefoni, { etichetta: v.telefoni.length ? 'Casa' : 'Cellulare', numero: '' }] })} style={{
            alignSelf: 'flex-start', border: '1px dashed var(--prox-line)', background: 'transparent', cursor: 'pointer',
            borderRadius: 999, padding: '6px 14px', fontSize: 13, color: 'var(--prox-ink2)',
          }}>+ Aggiungi telefono</button>
        </div>
      </Field>

      <Field label="Indirizzo"><IndirizzoField value={v.addr} onChange={patch => onChange({ addr: { ...v.addr, ...patch } })} /></Field>

      <Field label="Note sui contatti">
        <textarea value={v.noteContatti} onChange={e => onChange({ noteContatti: e.target.value })} rows={2}
          placeholder="Altri indirizzi, numeri, orari per essere raggiunti…" style={{ ...campo, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>
    </div>
  )
}

export function NoteCampi({ value: v, onChange, utente }: { value: NoteBozza; onChange: (patch: Partial<NoteBozza>) => void; utente: boolean }) {
  const { data: tutte = [] } = usePersone()
  const suggeriti = [...new Set(tutte.flatMap(p => p.bisogni ?? []))]
  return (
    <div style={colonna}>
      {utente && (
        <Field label="Bisogni attivi">
          <ChipsInput values={v.bisogni} onChange={bisogni => onChange({ bisogni })} placeholder="Es. alloggio, documenti…" suggestions={suggeriti} />
        </Field>
      )}
      <Field label="Note generali">
        <textarea value={v.note} onChange={e => onChange({ note: e.target.value })} rows={4}
          placeholder="Contesto, orari preferiti, cose da ricordare…" style={{ ...campo, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>
    </div>
  )
}
