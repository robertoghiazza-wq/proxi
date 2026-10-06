// Vista mappa di tutti i luoghi con coordinate

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { BASEMAPS, BaseMapSwitch, type BaseKey } from './MapBase'
import type { Luogo } from '../types'

function FitBounds({ luoghi }: { luoghi: Luogo[] }) {
  const map = useMap()
  useEffect(() => {
    if (luoghi.length === 0) return
    const b = L.latLngBounds(luoghi.map(l => [l.lat as number, l.lng as number]))
    map.fitBounds(b, { padding: [40, 40], maxZoom: 16 })
  }, [luoghi, map])
  return null
}

function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid #fff;`
      + `box-shadow:0 2px 6px rgba(0,0,0,.35);color:#fff;font:600 12px Inter,system-ui,sans-serif;`
      + `display:flex;align-items:center;justify-content:center">${label}</div>`,
  })
}

interface Props {
  luoghi: Luogo[]
  colors: Record<string, string>
  onOpen: (id: number) => void
}

// Riempie il contenitore che la ospita (nessun box, bordo o raggio)
export function LuoghiMap({ luoghi, colors, onOpen }: Props) {
  const [base, setBase] = useState<BaseKey>('swisstopo')
  const conCoord = luoghi.filter(l => l.lat != null && l.lng != null)
  const bm = BASEMAPS[base]

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer center={[46.0, 8.95]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
        <FitBounds luoghi={conCoord} />
        {conCoord.map(l => (
          <Marker
            key={l.id}
            position={[l.lat as number, l.lng as number]}
            icon={pinIcon(colors[l.tipo], String(Number(l.persone_count ?? 0)))}
            eventHandlers={{ click: () => onOpen(l.id) }}
          >
            <Tooltip direction="top" offset={[0, -14]}>{l.nome}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
      <BaseMapSwitch value={base} onChange={setBase} />
      {conCoord.length < luoghi.length && (
        <div style={{
          position: 'absolute', left: 8, bottom: 22, zIndex: 500, fontSize: 11.5,
          background: 'var(--prox-surface)', borderRadius: 999, padding: '3px 10px',
          color: 'var(--prox-ink3)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}>
          {luoghi.length - conCoord.length} senza posizione
        </div>
      )}
    </div>
  )
}
