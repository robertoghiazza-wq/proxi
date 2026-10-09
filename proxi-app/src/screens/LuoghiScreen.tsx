// Luoghi — lista con ricerca

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { Plus, List, Map as MapIcon, MapPin, Lock } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { Modal } from '../components/Modal'
import { Card } from '../components/Card'
import { LuogoThumb } from '../components/LuogoThumb'
import { LuoghiMap } from '../components/LuoghiMap'
import { useTipiLuogo } from '../hooks/useTipi'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useLuoghi } from '../hooks/useLuoghi'
import { CampoRicerca, ConteggioRisultati } from '../components/CampoRicerca'


export function LuoghiScreen() {
  const navigate = useNavigate()
  const isNuovoOpen  = !!useMatch('/luoghi/nuovo')
  const isDetailOpen = !!useMatch('/luoghi/:id/*') && !isNuovoOpen
  const [query, setQuery] = useState('')
  const [vista, setVista] = useState<'lista' | 'mappa'>('lista')
  const isDesktop = useIsDesktop()
  const [mostraRiservati, setMostraRiservati] = useState(false)
  const { tipi: tipiLuogo, label: tipoLuogoLabel, colore: coloreLuogo } = useTipiLuogo()
  const TIPO_COLOR: Record<string, string> = Object.fromEntries(tipiLuogo.map(t => [t.chiave, coloreLuogo(t.chiave)]))

  // La mappa occupa tutto il corpo: parte dove finisce l'intestazione fissa (misurata) e arriva in fondo
  const headerRef = useRef<HTMLDivElement>(null)
  const [sotto, setSotto] = useState(0)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const misura = () => setSotto(Math.round(el.getBoundingClientRect().bottom))
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(el)
    window.addEventListener('resize', misura)
    return () => { ro.disconnect(); window.removeEventListener('resize', misura) }
  }, [])
  useEffect(() => { if (vista === 'mappa') document.getElementById('area-scorrevole')?.scrollTo(0, 0) }, [vista])

  const { data: tuttiLuoghi = [], isLoading, isError, error } = useLuoghi()

  const [soloDaControllare, setSoloDaControllare] = useState(false)
  const nDaControllare = tuttiLuoghi.filter(l => l.posizione_da_controllare).length
  const luoghi = tuttiLuoghi.filter(l => {
    if (soloDaControllare && !l.posizione_da_controllare) return false
    if (!query) return true
    const q = query.toLowerCase()
    return l.nome.toLowerCase().includes(q) || l.indirizzo?.toLowerCase().includes(q)
  })

  return (
    <MobileLayout>
      {/* Header sticky */}
      <div ref={headerRef} style={{
        padding: '20px 16px 12px',
        background: 'var(--prox-surface2)', boxShadow: '0 4px 10px rgba(20,23,28,0.05)',
        borderBottom: '1px solid var(--prox-line)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="prox-display" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}>
            <MapPin size={18} strokeWidth={1.75} />
            Luoghi
          </div>
          <button onClick={() => navigate('/luoghi/nuovo')} style={newBtn} aria-label="Nuovo luogo">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CampoRicerca value={query} onChange={setQuery} placeholder="Cerca luogo o indirizzo…" style={{ flex: 1 }} />
          <div style={{ display: 'flex', background: 'var(--prox-surface)', borderRadius: 10, padding: 2, border: '1px solid var(--prox-line)' }}>
            {(['lista', 'mappa'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVista(v)}
                aria-label={v === 'lista' ? 'Vista lista' : 'Vista mappa'}
                style={{
                  width: 34, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: vista === v ? 'var(--prox-surface2)' : 'transparent',
                  color: vista === v ? 'var(--prox-ink)' : 'var(--prox-ink3)',
                  boxShadow: vista === v ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {v === 'lista' ? <List size={16} strokeWidth={1.75} /> : <MapIcon size={16} strokeWidth={1.75} />}
              </button>
            ))}
          </div>
        </div>
        <ConteggioRisultati mostrati={luoghi.length} totali={tuttiLuoghi.length} singolare="luogo" plurale="luoghi" />
        {nDaControllare > 0 && (
          <button
            onClick={() => setSoloDaControllare(v => !v)}
            style={{
              marginTop: 10, padding: '4px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
              border: `1px solid ${soloDaControllare ? 'transparent' : 'var(--prox-line)'}`,
              background: soloDaControllare ? 'var(--prox-accent)' : 'var(--prox-surface)', color: soloDaControllare ? '#fff' : 'var(--prox-ink2)',
            }}
          >Posizione da controllare · {nDaControllare}</button>
        )}
      </div>

      {/* Lista */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
          : isError
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-accent)', fontSize: 14 }}>Errore di caricamento<div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>{(error as Error)?.message}</div></div>
            : null
        }
        {vista === 'lista' && luoghi.map(l => {
          const color = coloreLuogo(l.tipo)
          return (
            <Card
              key={l.id}
              onClick={() => navigate(`/luoghi/${l.id}`)}
              padding={10}
              style={{ display: 'flex', gap: 10, alignItems: 'center' }}
            >
              <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
              {/* stessa colonna dell'orario negli eventi, così il nome parte alla stessa distanza */}
              <LuogoThumb lat={l.lat} lng={l.lng} color={color} size={42} radius={8} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2, color: 'var(--prox-ink)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome}</span>
                  {/* provvisorio: fino a quando le posizioni importate non sono verificate */}
                  {l.posizione_da_controllare && (
                    <span style={{
                      flexShrink: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.2, padding: '2px 7px', borderRadius: 999,
                      background: 'oklch(0.93 0.07 80)', color: 'oklch(0.42 0.1 65)',
                    }}>Da controllare</span>
                  )}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--prox-ink3)',
                  display: 'flex', gap: 6, alignItems: 'center', minWidth: 0,
                }}>
                  {l.visibilita === 'riservato' && <Lock size={11} strokeWidth={2.2} style={{ flexShrink: 0 }} aria-label="Riservato" />}
                  <span style={{ flexShrink: 0 }}>{tipoLuogoLabel(l.tipo)}</span>
                  {(l.indirizzo || l.localita) && <><span>·</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[l.indirizzo, l.localita].filter(Boolean).join(', ')}</span></>}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {Number(l.persone_count ?? 0)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--prox-ink3)' }}>persone</div>
              </div>
            </Card>
          )
        })}
      </div>
      {vista === 'mappa' && !isLoading && sotto > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, top: sotto, zIndex: 5,
          bottom: isDesktop ? 0 : 'var(--tabbar)',
        }}>
          <LuoghiMap luoghi={luoghi.filter(l => mostraRiservati || l.visibilita !== 'riservato')} colors={TIPO_COLOR} onOpen={id => navigate(`/luoghi/${id}`)} />
        </div>
      )}
      {vista === 'mappa' && !isLoading && sotto > 0 && luoghi.some(l => l.visibilita === 'riservato') && (
        <button
          onClick={() => setMostraRiservati(m => !m)}
          style={{
            position: isDesktop ? 'fixed' : 'absolute', left: 10, top: sotto + 10, zIndex: 6, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            background: 'var(--prox-surface)', color: mostraRiservati ? 'var(--prox-accent)' : 'var(--prox-ink2)', boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        ><Lock size={12} strokeWidth={2.2} /> {mostraRiservati ? 'Riservati visibili' : 'Mostra i riservati'}</button>
      )}
      {isNuovoOpen ? (
        <Modal open onClose={() => navigate('/luoghi')}>
          <Outlet />
        </Modal>
      ) : (
        <Drawer open={isDetailOpen} onClose={() => navigate('/luoghi')}>
          <Outlet />
        </Drawer>
      )}
    </MobileLayout>
  )
}

const newBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--prox-accent)', color: '#fff',
  border: 'none', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(220,29,39,0.3)',
}
