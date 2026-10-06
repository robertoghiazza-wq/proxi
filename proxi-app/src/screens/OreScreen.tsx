// Conteggio ore: ognuno vede le proprie; coordinatori e admin scelgono il dipendente

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { OreView } from '../components/OreView'
import { getCurrentUser } from '../lib/api-client'
import { usePersone } from '../hooks/usePersone'
import { nomePersona } from '../lib/persona'

export function OreScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const gestore = ['coordinatore', 'admin'].includes(getCurrentUser()?.role ?? '')
  const { data: persone = [] } = usePersone()
  const dipendenti = persone.filter(p => p.ruolo === 'dipendente')

  const [scelta, setScelta] = useState<number | null>(Number(params.get('persona')) || null)
  const personaId = gestore ? (scelta ?? dipendenti[0]?.id ?? null) : ('me' as const)

  return (
    <MobileLayout>
      <div style={{
        padding: '16px 16px 12px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
        position: 'sticky', top: 'var(--sat)', zIndex: 10,
      }}>
        <button onClick={() => navigate('/profilo')} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--prox-ink2)', fontSize: 13.5, fontWeight: 500, padding: 0, marginBottom: 6,
        }}>
          <ChevronLeft size={18} strokeWidth={1.75} /> Profilo
        </button>
        <div className="prox-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: gestore ? 10 : 0 }}>Conteggio ore</div>
        {gestore && (
          <select
            value={personaId ?? ''}
            onChange={e => { const v = Number(e.target.value); setScelta(v); setParams({ persona: String(v) }, { replace: true }) }}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--prox-line)',
              background: 'var(--prox-surface2)', fontSize: 14, color: 'var(--prox-ink)', fontFamily: 'inherit', appearance: 'auto',
            }}
          >
            {dipendenti.length === 0 && <option value="">Nessun dipendente</option>}
            {dipendenti.map(p => <option key={p.id} value={p.id}>{nomePersona(p)}</option>)}
          </select>
        )}
      </div>

      <div style={{ padding: '14px 16px 24px', maxWidth: 760 }}>
        <OreView persona={personaId} gestore={gestore} />
      </div>
    </MobileLayout>
  )
}
