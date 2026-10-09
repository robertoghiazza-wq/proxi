// Vista mappa di tutti i luoghi con coordinate

import { useEffect, useState, type ReactNode } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-rotate'   // rotazione: due dita, Maiusc+trascinamento, gesto del trackpad (Safari)
import { SOGLIA_ROTAZIONE_TRACKPAD, agganciaAlNord } from '../lib/gestiMappa'
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

type MappaRuotabile = L.Map & {
  getBearing?: () => number
  setBearing?: (g: number) => void
}

const sulTocco = () => window.matchMedia('(pointer: coarse)').matches

// La rotazione con due dita parte solo dopo un angolo minimo (lib/gestiMappa): niente tasto per bloccarla
export const opzioniRotazione = () => ({ rotate: true, touchRotate: true, shiftKeyRotate: true, rotateControl: { closeOnZeroBearing: true } }) as object

// Safari su Mac: rotazione e pizzico del trackpad sono eventi «gesture», che Leaflet non conosce.
// Come sul telefono, la rotazione parte solo dopo un piccolo angolo (si può fare zoom senza girare la mappa) e a fine gesto si aggancia al nord.
export function GestiTrackpad() {
  const map = useMap() as MappaRuotabile
  useEffect(() => {
    // su telefono e tablet iOS genera gli stessi eventi con due dita: lì gestisce tutto lib/gestiMappa, qui non si interviene
    if (sulTocco()) return
    const el = map.getContainer()
    let rot0 = 0, zoom0 = 0, ruota = false
    const inizio = (e: Event) => { e.preventDefault(); rot0 = map.getBearing?.() ?? 0; zoom0 = map.getZoom(); ruota = false }
    const cambia = (e: Event) => {
      e.preventDefault()
      const g = e as unknown as { rotation: number; scale: number }
      if (!ruota && Math.abs(g.rotation) > SOGLIA_ROTAZIONE_TRACKPAD) ruota = true
      // come in Mappe di macOS: le dita girano in senso orario, la mappa gira con loro (togliendo la soglia, per non far «saltare» la mappa)
      if (ruota) map.setBearing?.(rot0 + g.rotation - Math.sign(g.rotation) * SOGLIA_ROTAZIONE_TRACKPAD)
      map.setZoom(zoom0 + Math.log2(g.scale), { animate: false })
    }
    const fine = (e: Event) => { e.preventDefault(); if (ruota) agganciaAlNord(map as Parameters<typeof agganciaAlNord>[0]) }
    el.addEventListener('gesturestart', inizio)
    el.addEventListener('gesturechange', cambia)
    el.addEventListener('gestureend', fine)
    return () => { el.removeEventListener('gesturestart', inizio); el.removeEventListener('gesturechange', cambia); el.removeEventListener('gestureend', fine) }
  }, [map])
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
  extra?: ReactNode   // comandi sovrapposti alla mappa (es. occhio dei luoghi riservati)
}

// Riempie il contenitore che la ospita (nessun box, bordo o raggio)
export function LuoghiMap({ luoghi, colors, onOpen, extra }: Props) {
  const [base, setBase] = useState<BaseKey>('swisstopo')
  const conCoord = luoghi.filter(l => l.lat != null && l.lng != null)
  const bm = BASEMAPS[base]

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={[46.0, 8.95]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}
        {...opzioniRotazione()}
      >
        <GestiTrackpad />
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
      {extra}
      {conCoord.length < luoghi.length && (
        <div style={{
          position: 'absolute', left: 10, bottom: 'calc(var(--sab) + 14px)', zIndex: 500, fontSize: 11.5,
          background: 'var(--prox-surface)', borderRadius: 999, padding: '3px 10px',
          color: 'var(--prox-ink3)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}>
          {luoghi.length - conCoord.length} senza posizione
        </div>
      )}
    </div>
  )
}
