// Titolo che fa da interruttore Persone | Servizi (stessa tab): quello attivo in nero, l'altro in grigio

import { useNavigate } from 'react-router-dom'
import { Users, Building2 } from 'lucide-react'

export function PersoneServiziSwitch({ current }: { current: 'persone' | 'servizi' }) {
  const navigate = useNavigate()
  const voci = [
    { key: 'persone', label: 'Persone', icona: Users },
    { key: 'servizi', label: 'Servizi', icona: Building2 },
  ] as const

  return (
    <div role="tablist" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      {voci.map(v => {
        const attivo = current === v.key
        return (
          <button
            key={v.key}
            role="tab"
            aria-selected={attivo}
            onClick={() => !attivo && navigate(`/${v.key}`)}
            className="prox-display"
            style={{
              padding: 0, border: 'none', background: 'none', cursor: attivo ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 22, fontWeight: 700, color: attivo ? 'var(--prox-ink)' : 'var(--prox-ink3)',
              opacity: attivo ? 1 : 0.7,
            }}
          >
            <v.icona size={22} strokeWidth={attivo ? 2.2 : 1.75} />
            {v.label}
          </button>
        )
      })}
    </div>
  )
}
