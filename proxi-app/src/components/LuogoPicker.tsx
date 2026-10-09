// Selezione di un singolo luogo con creazione al volo

import { useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { NuovoLuogoModal } from './NuovoLuogoModal'
import { useLuoghi } from '../hooks/useLuoghi'
import type { Luogo } from '../types'
import { CampoRicerca, ConteggioRisultati } from './CampoRicerca'
import { useRicercaEstesa } from '../hooks/useRicerca'

export function LuogoPicker({ value, onChange }: {
  value: number | null
  onChange: (id: number) => void
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const { data: luoghi = [], isLoading } = useLuoghi()

  const q = query.trim().toLowerCase()
  const trovati = useRicercaEstesa('luoghi', query)
  const filtrati = luoghi.filter(l => !q || (trovati
    ? trovati.has(l.id)
    : l.nome.toLowerCase().includes(q) || l.indirizzo?.toLowerCase().includes(q)))

  return (
    <div>
      <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line2)' }}>
        <CampoRicerca value={query} onChange={setQuery} placeholder="Cerca un luogo…" fondo="surface2" compatto />
        <ConteggioRisultati mostrati={filtrati.length} totali={luoghi.length} singolare="luogo" plurale="luoghi" />
      </div>

      <button onClick={() => setCreating(true)} style={row}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'var(--prox-accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus size={15} color="var(--prox-accent)" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Nuovo luogo</div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>Non è in elenco? Crealo ora</div>
        </div>
      </button>

      {isLoading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>}

      {filtrati.map((l: Luogo) => {
        const sel = value === l.id
        return (
          <button key={l.id} onClick={() => onChange(l.id)} style={{
            ...row, background: sel ? 'var(--prox-accent-soft)' : 'var(--prox-surface)',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${sel ? 'var(--prox-accent)' : 'var(--prox-line)'}`,
              background: sel ? 'var(--prox-accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
            </div>
            <MapPin size={16} color="var(--prox-ink3)" strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: sel ? 'var(--prox-accent-ink)' : 'var(--prox-ink)' }}>{l.nome}</div>
              {l.indirizzo && <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>{l.indirizzo}</div>}
            </div>
          </button>
        )
      })}

      {creating && (
        <NuovoLuogoModal
          onClose={() => setCreating(false)}
          onCreated={l => { setCreating(false); setQuery(''); onChange(l.id) }}
        />
      )}
    </div>
  )
}

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px', width: '100%',
  background: 'var(--prox-surface)', border: 'none',
  borderBottom: '1px solid var(--prox-line2)',
  cursor: 'pointer', textAlign: 'left',
}
