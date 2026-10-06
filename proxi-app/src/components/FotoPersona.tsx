// Avatar grande della scheda con il pulsante per scattare/scegliere la foto (facoltativa; non per le persone anonime)

import { useRef, useState } from 'react'
import { Camera, Trash2, ImagePlus } from 'lucide-react'
import { AvatarPersona } from './AvatarPersona'
import { useGestioneFoto } from '../hooks/useDocumenti'
import { ritagliaQuadrata } from '../lib/immagine'
import type { Persona } from '../types'

export function FotoPersona({ persona, size = 72 }: { persona: Persona; size?: number }) {
  const { carica, rimuovi } = useGestioneFoto(persona.id)
  const input = useRef<HTMLInputElement>(null)
  const [menu, setMenu] = useState(false)
  const [errore, setErrore] = useState('')
  const occupato = carica.isPending || rimuovi.isPending

  async function scelta(file: File | undefined) {
    setMenu(false)
    if (!file) return
    setErrore('')
    try {
      carica.mutate(await ritagliaQuadrata(file), { onError: e => setErrore((e as Error).message) })
    } catch (e) {
      setErrore((e as Error).message || 'Foto non leggibile')
    }
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', opacity: occupato ? 0.5 : 1 }}>
        <AvatarPersona persona={persona} size={size} />
        {!persona.anonimo && (
          <button
            onClick={() => (persona.ha_foto ? setMenu(m => !m) : input.current?.click())}
            disabled={occupato}
            aria-label={persona.ha_foto ? 'Cambia o rimuovi la foto' : 'Aggiungi una foto'}
            style={{
              position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: '50%',
              border: '2px solid var(--prox-bg)', background: 'var(--prox-surface)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--prox-ink2)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)', padding: 0,
            }}
          >
            <Camera size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {menu && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
          <div style={{
            position: 'absolute', top: size + 6, zIndex: 21, minWidth: 180,
            background: 'var(--prox-surface)', border: '1px solid var(--prox-line)', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)', overflow: 'hidden',
          }}>
            <button onClick={() => input.current?.click()} style={voce}><ImagePlus size={15} /> Cambia foto</button>
            <button onClick={() => { setMenu(false); rimuovi.mutate() }} style={{ ...voce, color: 'var(--prox-danger)', borderTop: '1px solid var(--prox-line2)' }}>
              <Trash2 size={15} /> Rimuovi foto
            </button>
          </div>
        </>
      )}

      {errore && <div style={{ fontSize: 12, color: 'var(--prox-danger)', marginTop: 6 }}>{errore}</div>}

      <input
        ref={input} type="file" accept="image/*" hidden
        onChange={e => { scelta(e.target.files?.[0]); e.target.value = '' }}
      />
    </div>
  )
}

const voce: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', border: 'none',
  background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--prox-ink)', textAlign: 'left', fontFamily: 'inherit',
}
