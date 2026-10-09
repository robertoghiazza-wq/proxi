// Vista mappa dei luoghi: la mappa con l'occhio dei luoghi riservati (in basso a sinistra, lontano dallo zoom), e la versione a schermo intero per il telefono

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff } from 'lucide-react'
import { BarraScheda } from './BarraScheda'
import { CampoRicerca } from './CampoRicerca'
import { LuoghiMap } from './LuoghiMap'
import { useEsc } from '../lib/esc'
import type { Luogo } from '../types'

interface Props {
  luoghi: Luogo[]
  colors: Record<string, string>
  onOpen: (id: number) => void
}

// La mappa vera e propria: riempie il contenitore che la ospita
export function MappaConOcchio({ luoghi, colors, onOpen }: Props) {
  const [mostraRiservati, setMostraRiservati] = useState(false)
  const visibili = luoghi.filter(l => mostraRiservati || l.visibilita !== 'riservato')
  const nRiservati = luoghi.filter(l => l.visibilita === 'riservato').length

  const occhio = nRiservati > 0 && (
    <button
      onClick={() => setMostraRiservati(m => !m)}
      aria-pressed={mostraRiservati}
      title={mostraRiservati ? 'Nascondi i luoghi riservati' : 'Mostra i luoghi riservati'}
      style={{
        position: 'absolute', left: 10, bottom: 'calc(var(--sab) + 46px)', zIndex: 500, display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        background: 'var(--prox-surface)', color: mostraRiservati ? 'var(--prox-accent)' : 'var(--prox-ink2)', boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {mostraRiservati ? <Eye size={15} strokeWidth={2} /> : <EyeOff size={15} strokeWidth={2} />}
      {mostraRiservati ? 'Riservati visibili' : 'Riservati nascosti'}
    </button>
  )

  return <LuoghiMap luoghi={visibili} colors={colors} onOpen={onOpen} extra={occhio} />
}

// Telefono: mappa a schermo intero (come il dettaglio di un luogo) con «‹ Luoghi» per chiuderla e la ricerca nella barra in alto
export function MappaLuoghiPiena({ luoghi, colors, onOpen, onChiudi, query, onQuery }: Props & {
  onChiudi: () => void
  query: string
  onQuery: (q: string) => void
}) {
  useEsc(true, onChiudi)

  return createPortal(
    <div style={{
      position: 'fixed', top: 'var(--fascia)', left: 0, right: 0, bottom: 0,
      // sopra la barra dei tab; sotto le schede (drawer) che si aprono dai pin
      zIndex: 100,
      background: 'var(--prox-bg)', display: 'flex', flexDirection: 'column', paddingTop: 'var(--sat)', boxSizing: 'border-box',
    }}>
      <BarraScheda
        lista="/luoghi" etichettaLista="Luoghi"
        indietroPersonalizzato={{ etichetta: 'Luoghi', onClick: onChiudi }}
        centro={<CampoRicerca value={query} onChange={onQuery} placeholder={`Cerca in ${luoghi.length} luoghi…`} compatto fondo="surface2" />}
      />
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MappaConOcchio luoghi={luoghi} colors={colors} onOpen={onOpen} />
      </div>
    </div>,
    document.body,
  )
}
