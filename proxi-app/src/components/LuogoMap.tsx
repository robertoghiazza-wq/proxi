// Mappa di sola lettura per il dettaglio luogo/servizio, con il tasto per aprirla a schermo intero (dove si può anche ruotare)

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { Maximize2 } from 'lucide-react'
import 'leaflet-rotate'
import { BASEMAPS, BaseMapSwitch, type BaseKey } from './MapBase'
import { GestiTrackpad } from './LuoghiMap'
import { BarraScheda } from './BarraScheda'
import { useEsc } from '../lib/esc'

const SENZA_COMPASSO = { rotateControl: false } as object
const CON_ROTAZIONE = { rotate: true, touchRotate: true, shiftKeyRotate: true, rotateControl: { closeOnZeroBearing: true } } as object

export function LuogoMap({ lat, lng, height = 220, titolo }: { lat: number; lng: number; height?: number; titolo?: string }) {
  const [base, setBase] = useState<BaseKey>('satellite')
  const [grande, setGrande] = useState(false)
  const bm = BASEMAPS[base]

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer center={[lat, lng]} zoom={17} style={{ height, width: '100%', zIndex: 0 }} {...SENZA_COMPASSO}>
        <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
        <Marker position={[lat, lng]} />
      </MapContainer>
      <BaseMapSwitch value={base} onChange={setBase} />
      <button
        onClick={() => setGrande(true)} aria-label="Apri la mappa a schermo intero" title="Apri la mappa a schermo intero"
        style={{
          position: 'absolute', left: 10, bottom: 26, zIndex: 500, width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--prox-surface)', color: 'var(--prox-ink2)', boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
        }}
      ><Maximize2 size={17} strokeWidth={1.9} /></button>
      {grande && <MappaGrande lat={lat} lng={lng} titolo={titolo} base={base} onBase={setBase} onChiudi={() => setGrande(false)} />}
    </div>
  )
}

function MappaGrande({ lat, lng, titolo, base, onBase, onChiudi }: {
  lat: number; lng: number; titolo?: string; base: BaseKey; onBase: (b: BaseKey) => void; onChiudi: () => void
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
        <MapContainer center={[lat, lng]} zoom={17} style={{ height: '100%', width: '100%', zIndex: 0 }} {...CON_ROTAZIONE}>
          <GestiTrackpad />
          <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
          <Marker position={[lat, lng]} />
        </MapContainer>
        <BaseMapSwitch value={base} onChange={onBase} />
      </div>
    </div>,
    document.body,
  )
}
