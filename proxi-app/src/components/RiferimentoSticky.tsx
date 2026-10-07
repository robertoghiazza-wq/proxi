// Barra di riferimento fissa in alto nelle schede (persona, luogo, servizio, evento): appare quando il titolo grande esce dalla vista

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'

// Da usare sul titolo grande: `ref={setTitolo}`; `fuori` diventa true quando il titolo non si vede più
export function useTitoloSticky() {
  const [titolo, setTitolo] = useState<HTMLElement | null>(null)
  const [fuori, setFuori] = useState(false)
  useEffect(() => {
    if (!titolo) return
    const io = new IntersectionObserver(([e]) => setFuori(!e.isIntersecting), { threshold: 0 })
    io.observe(titolo)
    return () => io.disconnect()
  }, [titolo])
  return { setTitolo, fuori }
}

export function RiferimentoSticky({ visibile, titolo, sottotitolo, icona, onIndietro, etichettaIndietro = 'Indietro' }: {
  visibile: boolean
  titolo: string
  sottotitolo?: string
  icona?: React.ReactNode
  onIndietro: () => void
  etichettaIndietro?: string
}) {
  // (su mobile il drawer ha già il padding della zona notch: top 0 si ferma sotto la fascia rossa)
  // il contenitore ha altezza 0: non sposta il contenuto; la barra vera scivola dall'alto
  return (
    <div style={{ position: 'sticky', top: 0, height: 0, zIndex: 30, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 48, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)', boxShadow: '0 4px 10px rgba(20,23,28,0.06)',
        transform: visibile ? 'translateY(0)' : 'translateY(-110%)', opacity: visibile ? 1 : 0, pointerEvents: visibile ? 'auto' : 'none',
        transition: 'transform 0.18s ease, opacity 0.18s ease',
      }}>
        <button onClick={onIndietro} aria-label={etichettaIndietro} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', background: 'none',
          cursor: 'pointer', color: 'var(--prox-ink2)', flexShrink: 0, padding: 0,
        }}><ChevronLeft size={22} strokeWidth={1.75} /></button>
        {icona}
        <div style={{ minWidth: 0 }}>
          <div className="prox-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--prox-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titolo}</div>
          {sottotitolo && <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sottotitolo}</div>}
        </div>
      </div>
    </div>
  )
}
