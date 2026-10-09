// Barra di ricerca comune a tutte le liste: lente, campo, «×» per svuotare. Con ConteggioRisultati sotto mostra totali e filtrati.

import type { CSSProperties, ReactNode } from 'react'
import { Search, X } from 'lucide-react'

export function CampoRicerca({ value, onChange, placeholder, fondo = 'surface', compatto, autoFocus, icona, style }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  fondo?: 'surface' | 'surface2'
  compatto?: boolean
  autoFocus?: boolean
  icona?: ReactNode
  style?: CSSProperties
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
      background: `var(--prox-${fondo})`, borderRadius: 12,
      padding: compatto ? '9px 12px' : '8px 12px', border: '1px solid var(--prox-line)',
      ...style,
    }}>
      {icona ?? <Search size={compatto ? 15 : 16} color="var(--prox-ink3)" strokeWidth={1.75} style={{ flexShrink: 0 }} />}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', fontSize: 14, color: 'var(--prox-ink)', outline: 'none' }}
      />
      {value && (
        <button
          type="button"
          aria-label="Cancella la ricerca"
          onMouseDown={e => e.preventDefault()}
          onClick={() => onChange('')}
          style={{
            flexShrink: 0, width: 20, height: 20, padding: 0, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--prox-ink3)', color: 'var(--prox-surface)',
          }}
        ><X size={12} strokeWidth={2.5} /></button>
      )}
    </div>
  )
}

// «12 persone» oppure, se la ricerca o i filtri ne nascondono qualcuna, «3 di 12 persone»
export function ConteggioRisultati({ mostrati, totali, singolare, plurale, style }: {
  mostrati: number; totali: number; singolare: string; plurale: string; style?: CSSProperties
}) {
  const unita = totali === 1 ? singolare : plurale
  return (
    <div aria-live="polite" style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6, ...style }}>
      {mostrati === totali ? `${totali} ${unita}` : `${mostrati} di ${totali} ${unita}`}
    </div>
  )
}
