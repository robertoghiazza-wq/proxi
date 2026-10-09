// Vista mappa di tutti i luoghi con coordinate

import { useEffect, useState, type ReactNode } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-rotate'   // prova: rotazione con due dita, Maiusc+trascinamento, gesto del trackpad (Safari)
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
  touchRotate?: { enable(): void; disable(): void; enabled(): boolean }
}

const sulTocco = () => window.matchMedia('(pointer: coarse)').matches

// Su telefono la rotazione con due dita si attiva con il tasto dedicato (altrimenti si confonde con lo zoom); sul computer c'è sempre
export const opzioniRotazione = () => ({ rotate: true, touchRotate: !sulTocco(), shiftKeyRotate: true, rotateControl: { closeOnZeroBearing: true } }) as object

const ICONA_RUOTA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>'

export function ComandoRotazione() {
  const map = useMap() as MappaRuotabile
  useEffect(() => {
    if (!sulTocco()) return
    map.touchRotate?.disable()
    const Comando = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
        const a = L.DomUtil.create('a', '', div) as HTMLAnchorElement
        a.href = '#'
        a.setAttribute('role', 'button')
        a.title = 'Ruota la mappa con due dita'
        a.setAttribute('aria-label', 'Attiva la rotazione con due dita')
        a.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#444'
        a.innerHTML = ICONA_RUOTA
        L.DomEvent.disableClickPropagation(div)
        L.DomEvent.on(a, 'click', (e: Event) => {
          L.DomEvent.stop(e)
          const attiva = !map.touchRotate?.enabled()
          if (attiva) map.touchRotate?.enable(); else map.touchRotate?.disable()
          a.style.background = attiva ? 'var(--prox-accent)' : ''
          a.style.color = attiva ? '#fff' : '#444'
          a.setAttribute('aria-pressed', String(attiva))
        })
        return div
      },
    })
    const controllo = new Comando({ position: 'topleft' })
    map.addControl(controllo)
    return () => { map.removeControl(controllo) }
  }, [map])
  return null
}



// Safari su Mac e iPad: rotazione (e pizzico) del trackpad = eventi «gesture», che Leaflet non conosce
export function GestiTrackpad() {
  const map = useMap() as MappaRuotabile
  useEffect(() => {
    const el = map.getContainer()
    let rot0 = 0, zoom0 = 0
    const inizio = (e: Event) => { e.preventDefault(); rot0 = map.getBearing?.() ?? 0; zoom0 = map.getZoom() }
    const cambia = (e: Event) => {
      e.preventDefault()
      const g = e as unknown as { rotation: number; scale: number }
      map.setBearing?.(rot0 + g.rotation)   // come in Mappe di macOS: le dita girano in senso orario, la mappa gira con loro
      map.setZoom(zoom0 + Math.log2(g.scale), { animate: false })
    }
    el.addEventListener('gesturestart', inizio)
    el.addEventListener('gesturechange', cambia)
    return () => { el.removeEventListener('gesturestart', inizio); el.removeEventListener('gesturechange', cambia) }
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
        <ComandoRotazione />
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
