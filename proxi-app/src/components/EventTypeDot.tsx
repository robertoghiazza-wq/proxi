// Pallino colorato per tipo evento + etichetta opzionale

import { useTipiEvento } from '../hooks/useTipi'

interface EventTypeDotProps {
  tipo: string
  showLabel?: boolean
  size?: number
}

export function EventTypeDot({ tipo, showLabel, size = 8 }: EventTypeDotProps) {
  const { colore, label } = useTipiEvento()
  const color = colore(tipo)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: size, height: size, borderRadius: '50%',
        background: color, flexShrink: 0, display: 'inline-block',
      }} />
      {showLabel && (
        <span style={{ fontSize: 12, color: 'var(--prox-ink2)', fontWeight: 500 }}>
          {label(tipo)}
        </span>
      )}
    </span>
  )
}
