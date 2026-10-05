// Scheda persona — nuova e modifica (stesso modulo)

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { ChipsInput } from '../components/ChipsInput'
import { usePersone, usePersona, useCreatePersona, useUpdatePersona } from '../hooks/usePersone'
import type { Persona, RuoloPersona } from '../types'

const RUOLI: { key: RuoloPersona; label: string; hint: string }[] = [
  { key: 'utente',     label: 'Utente',  hint: 'Persona seguita dal servizio' },
  { key: 'dipendente', label: 'Équipe',  hint: 'Operatore dell’ente' },
  { key: 'rete',       label: 'Rete',    hint: 'Medico, volontario, referente' },
]

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

  const [ruolo, setRuolo] = useState<RuoloPersona>(persona?.ruolo ?? initialRuolo ?? 'utente')
  const [anonimo, setAnonimo] = useState(persona?.anonimo ?? false)
  const [nome, setNome] = useState(persona?.nome ?? '')
  const [soprannome, setSoprannome] = useState(persona?.soprannome ?? '')
  const [eta, setEta] = useState(persona?.eta != null ? String(persona.eta) : '')
  const [sesso, setSesso] = useState<Persona['sesso']>(persona?.sesso ?? null)
  const [lingue, setLingue] = useState<string[]>(persona?.lingue ?? [])
  const [tag, setTag] = useState<string[]>(persona?.tag ?? [])
  const [bisogni, setBisogni] = useState<string[]>(persona?.bisogni ?? [])
  const [telefono, setTelefono] = useState(persona?.telefono ?? '')
  const [email, setEmail] = useState(persona?.email ?? '')
  const [note, setNote] = useState(persona?.note ?? '')
  const [errore, setErrore] = useState('')

  const tagSuggeriti = [...new Set([...tutte.flatMap(p => p.tag ?? []), ...TAG_BASE])]
  const bisogniSuggeriti = [...new Set(tutte.flatMap(p => p.bisogni ?? []))]

  async function salva() {
    const n = nome.trim()
    const s = soprannome.trim()
    if (!n && !s) { setErrore('Inserisci almeno un nome o un soprannome'); return }
    if (anonimo && !s) { setErrore('Una persona anonima ha bisogno di un soprannome'); return }
    if (eta && (Number(eta) < 0 || Number(eta) > 120)) { setErrore('Età non valida'); return }
    setErrore('')
    try {
      const saved = await mutation.mutateAsync({
        ruolo,
        anonimo,
        nome: n || null,
        soprannome: s || null,
        eta: eta ? Number(eta) : null,
        sesso,
        lingue,
        tag,
        bisogni: ruolo === 'utente' ? bisogni : [],
        telefono: telefono.trim() || null,
        email: email.trim() || null,
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
        <Field label="Chi è">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RUOLI.map(r => <Pill key={r.key} active={ruolo === r.key} onClick={() => setRuolo(r.key)}>{r.label}</Pill>)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>
            {RUOLI.find(r => r.key === ruolo)?.hint}
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

        <Field label={anonimo ? 'Nome (non mostrato)' : 'Nome'}>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome e cognome" style={input} />
        </Field>
        <Field label={anonimo ? 'Soprannome *' : 'Soprannome'}>
          <input value={soprannome} onChange={e => setSoprannome(e.target.value)} placeholder="Come lo chiamano" style={input} />
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 110 }}>
            <Field label="Età">
              <input value={eta} onChange={e => setEta(e.target.value.replace(/\D/g, '').slice(0, 3))}
                inputMode="numeric" placeholder="—" style={input} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Sesso">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SESSI.map(s => (
                  <Pill key={s.key} active={sesso === s.key} onClick={() => setSesso(sesso === s.key ? null : s.key)}>{s.label}</Pill>
                ))}
              </div>
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

        <Field label="Telefono">
          <input value={telefono} onChange={e => setTelefono(e.target.value)} inputMode="tel" placeholder="+41 79 000 00 00" style={input} />
        </Field>
        <Field label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoCapitalize="none" placeholder="nome@esempio.ch" style={input} />
        </Field>

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
