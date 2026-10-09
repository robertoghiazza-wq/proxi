// Servizi — enti della rete: lista con ricerca (stessa tab di Persone)

import { useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { Modal } from '../components/Modal'
import { Card } from '../components/Card'
import { PersoneServiziSwitch } from '../components/PersoneServiziSwitch'
import { useServizi } from '../hooks/useServizi'
import { CampoRicerca, ConteggioRisultati } from '../components/CampoRicerca'

const TINTA = 'oklch(0.58 0.12 245)'

export function ServiziScreen() {
  const navigate = useNavigate()
  const isNuovoOpen = !!useMatch('/servizi/nuovo')
  const isDetailOpen = !!useMatch('/servizi/:id/*') && !isNuovoOpen
  const [query, setQuery] = useState('')

  const { data: tutti = [], isLoading, isError, error } = useServizi()
  const q = query.trim().toLowerCase()
  const servizi = tutti.filter(s => !q
    || s.nome.toLowerCase().includes(q)
    || s.localita?.toLowerCase().includes(q)
    || s.indirizzo?.toLowerCase().includes(q))

  return (
    <MobileLayout>
      <div style={{
        padding: '20px 16px 12px', background: 'var(--prox-surface2)', boxShadow: '0 4px 10px rgba(20,23,28,0.05)',
        borderBottom: '1px solid var(--prox-line)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <PersoneServiziSwitch current="servizi" />
          <button onClick={() => navigate('/servizi/nuovo')} style={newBtn} aria-label="Nuovo servizio">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        <CampoRicerca value={query} onChange={setQuery} placeholder="Cerca servizio, località…" />
        <ConteggioRisultati mostrati={servizi.length} totali={tutti.length} singolare="servizio" plurale="servizi" />
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading && <Msg>Caricamento…</Msg>}
        {isError && <Msg danger>Errore di caricamento<div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>{(error as Error)?.message}</div></Msg>}
        {!isLoading && !isError && servizi.length === 0 && (
          <Msg>{q ? 'Nessun risultato' : 'Nessun servizio. Aggiungi il primo con +'}</Msg>
        )}
        {servizi.map(s => (
          <Card key={s.id} onClick={() => navigate(`/servizi/${s.id}`)} padding={12}
            style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: TINTA + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={21} color={TINTA} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--prox-ink)' }}>{s.nome}</div>
              {(s.indirizzo || s.localita) && (
                <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 2 }}>
                  {[s.indirizzo, s.localita].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {Number(s.persone_count ?? 0)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--prox-ink3)' }}>contatti</div>
            </div>
          </Card>
        ))}
      </div>

      {isNuovoOpen ? (
        <Modal open onClose={() => navigate('/servizi')}><Outlet /></Modal>
      ) : (
        <Drawer open={isDetailOpen} onClose={() => navigate('/servizi')}><Outlet /></Drawer>
      )}
    </MobileLayout>
  )
}

function Msg({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', fontSize: 14,
      color: danger ? 'var(--prox-accent)' : 'var(--prox-ink3)',
    }}>{children}</div>
  )
}

const newBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--prox-accent)', color: '#fff',
  border: 'none', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(220,29,39,0.3)',
}
