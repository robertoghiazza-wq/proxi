// Scelta del colore da un elenco (select) con l'anteprima del colore a fianco

import { PALETTE, coloreDa } from '../lib/colori'

export function ColoreSelect({ value, onChange, vuoto, disabled, mostraAnteprima = true }: {
  value: string | null
  onChange: (v: string | null) => void
  vuoto?: string          // se presente, voce "nessun colore proprio" (es. "Come la categoria")
  disabled?: boolean
  mostraAnteprima?: boolean
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {mostraAnteprima && (
        <span style={{
          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
          background: value ? coloreDa(value) : 'transparent', border: value ? 'none' : '1.5px dashed var(--prox-ink3)',
        }} />
      )}
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value || null)}
        aria-label="Colore"
        style={{
          padding: '7px 10px', borderRadius: 10, border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
          fontSize: 14, color: 'var(--prox-ink)', fontFamily: 'inherit', appearance: 'auto', minWidth: 110,
        }}
      >
        {vuoto !== undefined && <option value="">{vuoto}</option>}
        {PALETTE.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
    </span>
  )
}
