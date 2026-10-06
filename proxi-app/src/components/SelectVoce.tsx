// Tendina alimentata da un elenco (vocabolario) modificabile dall'admin

import { useVocaboli } from '../hooks/useSchedaUtente'

export function SelectVoce({ categoria, value, onChange, style }: {
  categoria: string
  value: string | null
  onChange: (v: string | null) => void
  style?: React.CSSProperties
}) {
  const { data } = useVocaboli()
  const voci = (data?.voci ?? []).filter(v => v.categoria === categoria)
  const fuoriElenco = value && !voci.some(v => v.valore === value)

  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
        border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
        fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit', appearance: 'auto',
        ...style,
      }}
    >
      <option value="">—</option>
      {fuoriElenco && <option value={value}>{value}</option>}
      {voci.map(v => <option key={v.id} value={v.valore}>{v.valore}</option>)}
    </select>
  )
}
