// Servizio (ente della rete) — nuovo e modifica

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { MapPicker, type LatLng, type ParteIndirizzo } from '../components/MapPicker'
import { IndirizzoField } from '../components/IndirizzoField'
import { INDIRIZZO_VUOTO, validaIndirizzo, type Indirizzo } from '../lib/geo'
import { useServizio, useCreateServizio, useUpdateServizio } from '../hooks/useServizi'
import type { Servizio } from '../types'

export function ServizioFormScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: servizio, isLoading } = useServizio(Number(id))

  if (!id) return <ServizioForm />
  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }
  if (!servizio) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Servizio non trovato
        <br />
        <button onClick={() => navigate('/servizi')} style={{ marginTop: 12, cursor: 'pointer' }}>← Torna alla lista</button>
      </div>
    )
  }
  return <ServizioForm servizio={servizio} />
}

export function ServizioForm({ servizio, initial, onClose, onSaved }: {
  servizio?: Servizio
  initial?: Partial<Servizio>
  onClose?: () => void
  onSaved?: (s: Servizio) => void
}) {
  const navigate = useNavigate()
  const create = useCreateServizio()
  const update = useUpdateServizio(servizio?.id ?? 0)
  const mutation = servizio ? update : create
  const chiudi = onClose ?? (() => navigate(servizio ? `/servizi/${servizio.id}` : '/servizi'))

  const base = servizio ?? initial
  const [nome, setNome] = useState(base?.nome ?? '')
  const [addr, setAddr] = useState<Indirizzo>({
    ...INDIRIZZO_VUOTO,
    indirizzo: base?.indirizzo ?? '',
    npa: base?.cap ?? '',
    localita: base?.localita ?? '',
    comune_politico: base?.comune_politico ?? '',
    bfs: base?.bfs ?? '',
    cantone: base?.cantone ?? '',
    paese: base?.paese ?? 'Svizzera',
  })
  const [telefono, setTelefono] = useState(base?.telefono ?? '')
  const [email, setEmail] = useState(base?.email ?? '')
  const [sito, setSito] = useState(base?.sito ?? '')
  const [note, setNote] = useState(base?.note ?? '')
  const [pos, setPos] = useState<LatLng | null>(
    base?.lat != null && base?.lng != null ? { lat: base.lat, lng: base.lng } : null,
  )
  const [errore, setErrore] = useState('')

  function onMapChange(p: LatLng, testo?: string, parti?: ParteIndirizzo) {
    setPos(p)
    setAddr(a => ({
      ...a,
      ...(parti?.via || testo ? { indirizzo: parti?.via ?? testo ?? a.indirizzo } : {}),
      ...(parti?.cap ? { npa: parti.cap } : {}),
      ...(parti?.localita ? { localita: parti.localita } : {}),
      ...(parti?.comune ? { comune_politico: parti.comune, bfs: parti.bfs ?? '', cantone: parti.cantone ?? a.cantone } : {}),
    }))
  }

  async function salva() {
    if (!nome.trim()) { setErrore('Il nome è obbligatorio'); return }
    setErrore('')
    const v = await validaIndirizzo(addr)
    if (!v.ok) { setErrore(v.errore); return }
    const a = { ...addr, ...(v.patch ?? {}) }
    setAddr(a)
    try {
      const saved = await mutation.mutateAsync({
        nome: nome.trim(),
        indirizzo: a.indirizzo.trim() || null,
        cap: a.npa.trim() || null,
        localita: a.localita.trim() || null,
        comune_politico: a.comune_politico.trim() || null,
        bfs: a.bfs.trim() || null,
        cantone: a.cantone.trim() || null,
        paese: a.paese.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        sito: sito.trim() || null,
        note: note.trim() || null,
        lat: pos ? Number(pos.lat.toFixed(7)) : null,
        lng: pos ? Number(pos.lng.toFixed(7)) : null,
      })
      if (onSaved) onSaved(saved as Servizio)
      else chiudi()
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
      <div style={{
        background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={chiudi} aria-label="Chiudi" style={ghostBtn}><X size={20} strokeWidth={1.75} /></button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
          {servizio ? 'Modifica servizio' : 'Nuovo servizio'}
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
        <Field label="Nome servizio *">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Ufficio Famiglie e Giovani (UFaG)" style={input} />
        </Field>

        <Field label="Posizione">
          <MapPicker value={pos} onChange={onMapChange} />
        </Field>

        <Field label="Indirizzo">
          <IndirizzoField
            value={addr}
            onChange={patch => setAddr(a => ({ ...a, ...patch }))}
            onPosizione={(lat, lng) => setPos({ lat, lng })}
          />
        </Field>

        <Field label="Telefono">
          <input value={telefono} onChange={e => setTelefono(e.target.value)} inputMode="tel" placeholder="091 000 00 00" style={input} />
        </Field>
        <Field label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoCapitalize="none" placeholder="info@servizio.ch" style={input} />
        </Field>
        <Field label="Sito web">
          <input value={sito} onChange={e => setSito(e.target.value)} inputMode="url" autoCapitalize="none" placeholder="www.servizio.ch" style={input} />
        </Field>

        <Field label="Note">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
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
          {mutation.isPending ? 'Salvo…' : servizio ? 'Salva modifiche' : 'Crea servizio'}
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

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
  color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
