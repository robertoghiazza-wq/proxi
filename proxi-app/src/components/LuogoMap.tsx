// Mappa di sola lettura per il dettaglio luogo

import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { BASEMAPS, BaseMapSwitch, type BaseKey } from './MapBase'

export function LuogoMap({ lat, lng, height = 220 }: { lat: number; lng: number; height?: number }) {
  const [base, setBase] = useState<BaseKey>('swisstopo')
  const bm = BASEMAPS[base]

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer center={[lat, lng]} zoom={17} style={{ height, width: '100%', zIndex: 0 }}>
        <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
        <Marker position={[lat, lng]} />
      </MapContainer>
      <BaseMapSwitch value={base} onChange={setBase} />
    </div>
  )
}
