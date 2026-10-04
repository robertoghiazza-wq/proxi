// Nuovo luogo — form singola pagina con selettore su mappa

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { MapPicker, type LatLng } from '../components/MapPicker'
import { TIPO_LUOGO_LABEL } from '../lib/mock-data'
import { useCreateLuogo } from '../hooks/useLuoghi'
import type { TipoLuogo } from '../types'

const TIPI = Object.keys(TIPO_LUOGO_LABEL) as TipoLuogo[]

export function NuovoLuogoScreen() {
  const navigate = useNavigate()
  const create = useCreateLuogo()

  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoLuogo>('strada')
  const [indirizzo, setIndirizzo] = useState('')
  const [orari, setOrari] = useState('')
  const [note, setNote] = useState('')
  const [pos, setPos] = useState<LatLng | null>(null)
  const [errore, setErrore] = useState('')

  function onMapChange(p: LatLng, ind?: string) {
    setPos(p)
    if (ind) setIndirizzo(ind)
  }

  async function salva() {
    if (!nome.trim()) { setErrore('Il nome è obbligatorio'); return }
    setErrore('')
    try {
      await create.mutateAsync({
        nome: nome.trim(),
        tipo,
        indirizzo: indirizzo.trim() || null,
        orari: orari.trim() || null,
        note: note.trim() || null,
        lat: pos ? Number(pos.lat.toFixed(7)) : null,
        lng: pos ? Number(pos.lng.toFixed(7)) : null,
        attivo: true,
      })
      navigate('/luoghi')
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
        <button onClick={() => navigate('/luoghi')} style={ghostBtn} aria-label="Chiudi">
          <X size={20} strokeWidth={1.75} />
        </button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
          Nuovo luogo
        </div>
        <div style={{ width: 36 }} />
      </div>

      {errore && (
        <div style={{
          padding: '8px 16px', fontSize: 13, fontWeight: 500,
          background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)',
          borderBottom: '1px solid var(--prox-line)',
        }}>
          {errore}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Nome *">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Piazza Manzoni" style={input} />
        </Field>

        <Field label="Tipo">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TIPI.map(t => {
              const active = tipo === t
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  style={{
                    padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: active ? 'var(--prox-accent)' : 'var(--prox-surface2)',
                    color: active ? '#fff' : 'var(--prox-ink2)',
                  }}
                >
                  {TIPO_LUOGO_LABEL[t]}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Posizione">
          <MapPicker value={pos} onChange={onMapChange} />
        </Field>

        <Field label="Indirizzo">
          <input value={indirizzo} onChange={e => setIndirizzo(e.target.value)} placeholder="Compilato dalla mappa, modificabile" style={input} />
        </Field>

        <Field label="Orari">
          <input value={orari} onChange={e => setOrari(e.target.value)} placeholder="Es. lun–ven 18:00–22:00" style={input} />
        </Field>

        <Field label="Note">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} />
        </Field>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
        <button
          onClick={salva}
          disabled={create.isPending}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
            background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', opacity: create.isPending ? 0.6 : 1,
          }}
        >
          {create.isPending ? 'Salvo…' : 'Crea luogo'}
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
