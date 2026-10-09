// Barra di ricerca comune a tutte le liste: lente, campo, «×» per svuotare. Con ConteggioRisultati sotto mostra totali e filtrati.

import type { CSSProperties, ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { suggerisci, ultimaParola, type FiltroCat } from '../lib/filtriCategoria'

// Con `candidati` il campo suggerisce, dopo 4 lettere, le categorie che coincidono (come pill sotto la barra);
// scelta una, diventa un filtro attivo (`filtri` / `onFiltri`) che si mostra sotto la barra, accanto al conteggio (ConteggioRisultati).
export function CampoRicerca({ value, onChange, placeholder, fondo = 'surface', compatto, autoFocus, icona, style, candidati, filtri = [], onFiltri }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  fondo?: 'surface' | 'surface2'
  compatto?: boolean
  autoFocus?: boolean
  icona?: ReactNode
  style?: CSSProperties
  candidati?: FiltroCat[]
  filtri?: FiltroCat[]
  onFiltri?: (f: FiltroCat[]) => void
}) {
  const suggeriti = candidati && onFiltri ? suggerisci(value, candidati, filtri) : []
  const scegli = (f: FiltroCat) => {
    onFiltri?.([...filtri, f])
    onChange(ultimaParola(value).prima.trimEnd())
  }
  return (
    <div style={{ minWidth: 0, ...style }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap',
      background: `var(--prox-${fondo})`, borderRadius: 12,
      padding: compatto ? '9px 12px' : '8px 12px', border: '1px solid var(--prox-line)',
    }}>
      {icona ?? <Search size={compatto ? 15 : 16} color="var(--prox-ink3)" strokeWidth={1.75} style={{ flexShrink: 0 }} />}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Backspace' && !value && filtri.length) onFiltri?.(filtri.slice(0, -1)) }}
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
    {suggeriti.length > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>Filtra per</span>
        {suggeriti.map(f => (
          <button
            key={`${f.gruppo}:${f.id}`} type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => scegli(f)}
            style={{
              padding: '3px 10px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              border: '1px dashed var(--prox-accent)', background: 'transparent', color: 'var(--prox-accent)',
            }}
          ><span style={{ opacity: 0.7, fontWeight: 500 }}>{f.gruppo}:</span> {f.label}</button>
        ))}
      </div>
    )}
    </div>
  )
}

// «12 persone» oppure, se la ricerca o i filtri ne nascondono qualcuna, «3 di 12 persone»; accanto, i filtri a pill attivi
export function ConteggioRisultati({ mostrati, totali, singolare, plurale, style, filtri = [], onFiltri }: {
  mostrati: number; totali: number; singolare: string; plurale: string; style?: CSSProperties
  filtri?: FiltroCat[]; onFiltri?: (f: FiltroCat[]) => void
}) {
  const unita = totali === 1 ? singolare : plurale
  return (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6, ...style }}>
      <span>{mostrati === totali ? `${totali} ${unita}` : `${mostrati} di ${totali} ${unita}`}</span>
      {filtri.map(f => (
        <span key={`${f.gruppo}:${f.id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 3px 1px 8px', borderRadius: 999,
          fontSize: 11.5, fontWeight: 600, background: 'var(--prox-accent-soft)', color: 'var(--prox-accent)',
        }}>
          <span style={{ opacity: 0.7, fontWeight: 500 }}>{f.gruppo}:</span> {f.label}
          <button
            type="button" aria-label={`Togli il filtro ${f.label}`}
            onClick={() => onFiltri?.(filtri.filter(x => x !== f))}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'inherit' }}
          ><X size={11} strokeWidth={2.5} /></button>
        </span>
      ))}
    </div>
  )
}
