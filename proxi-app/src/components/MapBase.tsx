// Basemap condivise (swisstopo, satellite, OSM) + selettore + icona marker

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

export const BASEMAPS = {
  swisstopo: {
    label: 'Mappa',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '&copy; <a href="https://www.swisstopo.admin.ch">swisstopo</a>',
    maxZoom: 19,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
    attribution: '&copy; <a href="https://www.swisstopo.admin.ch">swisstopo</a>',
    maxZoom: 19,
  },
  osm: {
    label: 'OSM (POI)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
} as const

export type BaseKey = keyof typeof BASEMAPS

export function BaseMapSwitch({ value, onChange }: { value: BaseKey; onChange: (k: BaseKey) => void }) {
  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 500,
      display: 'flex', background: 'var(--prox-surface)', borderRadius: 999,
      padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      {(Object.keys(BASEMAPS) as BaseKey[]).map(k => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            border: 'none', cursor: 'pointer', borderRadius: 999,
            padding: '4px 10px', fontSize: 11.5, fontWeight: 600,
            background: value === k ? 'var(--prox-accent)' : 'transparent',
            color: value === k ? '#fff' : 'var(--prox-ink2)',
          }}
        >
          {BASEMAPS[k].label}
        </button>
      ))}
    </div>
  )
}
