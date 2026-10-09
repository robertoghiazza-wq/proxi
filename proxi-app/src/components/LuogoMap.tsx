// Mappa di sola lettura per il dettaglio luogo/servizio, con il tasto per aprirla a schermo intero (dove si può anche ruotare)

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import type L from 'leaflet'
import { Maximize2 } from 'lucide-react'
import 'leaflet-rotate'
import { BASEMAPS, BaseMapSwitch, type BaseKey } from './MapBase'
import { ComandoPosizione, GestiTrackpad, opzioniRotazione } from './LuoghiMap'
import { BarraScheda } from './BarraScheda'
import { useEsc } from '../lib/esc'

const SENZA_COMPASSO = { rotateControl: false } as object

// Tiene a portata di mano la mappa dell'anteprima, per sapere dove l'hai spostata quando la apri a schermo intero
function Cattura({ rif }: { rif: { current: L.Map | null } }) {
  const map = useMap()
  useEffect(() => { rif.current = map; return () => { rif.current = null } }, [map, rif])
  return null
}

export function LuogoMap({ lat, lng, height = 220, titolo }: { lat: number; lng: number; height?: number; titolo?: string }) {
  const [base, setBase] = useState<BaseKey>('satellite')
  const [grande, setGrande] = useState<{ centro: [number, number]; zoom: number } | null>(null)   // vista con cui si apre la mappa grande
  const anteprima = useRef<L.Map | null>(null)
  const bm = BASEMAPS[base]

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer center={[lat, lng]} zoom={17} style={{ height, width: '100%', zIndex: 0 }} {...SENZA_COMPASSO}>
        <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
        <Marker position={[lat, lng]} />
        <Cattura rif={anteprima} />
      </MapContainer>
      <BaseMapSwitch value={base} onChange={setBase} />
      <button
        onClick={() => {
          // la mappa grande parte esattamente da dove sta l'anteprima (centro e zoom)
          const m = anteprima.current
          const c = m?.getCenter()
          setGrande({ centro: c ? [c.lat, c.lng] : [lat, lng], zoom: m?.getZoom() ?? 17 })
        }} aria-label="Apri la mappa a schermo intero" title="Apri la mappa a schermo intero"
        style={{
          position: 'absolute', left: 10, bottom: 26, zIndex: 500, width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--prox-surface)', color: 'var(--prox-ink2)', boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
        }}
      ><Maximize2 size={17} strokeWidth={1.9} /></button>
      {grande && <MappaGrande lat={lat} lng={lng} centro={grande.centro} zoom={grande.zoom} titolo={titolo} base={base} onBase={setBase} onChiudi={() => setGrande(null)} />}
    </div>
  )
}

function MappaGrande({ lat, lng, centro, zoom, titolo, base, onBase, onChiudi }: {
  lat: number; lng: number; centro: [number, number]; zoom: number; titolo?: string; base: BaseKey; onBase: (b: BaseKey) => void; onChiudi: () => void
}) {
  const bm = BASEMAPS[base]
  useEsc(true, onChiudi)
  return createPortal(
    <div style={{
      position: 'fixed', top: 'var(--fascia)', left: 0, right: 0, bottom: 0, zIndex: 130,   // sopra la scheda da cui si apre
      background: 'var(--prox-bg)', display: 'flex', flexDirection: 'column', paddingTop: 'var(--sat)', boxSizing: 'border-box',
    }}>
      <BarraScheda lista="/luoghi" etichettaLista="Indietro" titolo={titolo} indietroPersonalizzato={{ etichetta: 'Indietro', onClick: onChiudi }} />
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MapContainer center={centro} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }} {...opzioniRotazione()}>
          <GestiTrackpad />
          <ComandoPosizione />
          <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
          <Marker position={[lat, lng]} />
        </MapContainer>
        <BaseMapSwitch value={base} onChange={onBase} />
      </div>
    </div>,
    document.body,
  )
}
