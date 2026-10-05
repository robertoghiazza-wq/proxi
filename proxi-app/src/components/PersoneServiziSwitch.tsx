// Interruttore Persone | Servizi (stessa tab)

import { useNavigate } from 'react-router-dom'

export function PersoneServiziSwitch({ current }: { current: 'persone' | 'servizi' }) {
  const navigate = useNavigate()
  const voci = [
    { key: 'persone', label: 'Persone' },
    { key: 'servizi', label: 'Servizi' },
  ] as const

  return (
    <div style={{
      display: 'flex', background: 'var(--prox-surface2)', borderRadius: 10, padding: 2,
      border: '1px solid var(--prox-line)', marginBottom: 10,
    }}>
      {voci.map(v => {
        const active = current === v.key
        return (
          <button
            key={v.key}
            onClick={() => !active && navigate(`/${v.key}`)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600,
              background: active ? 'var(--prox-surface)' : 'transparent',
              color: active ? 'var(--prox-ink)' : 'var(--prox-ink3)',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}
