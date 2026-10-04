// Selettore posizione su mappa — swisstopo (preciso, CH) o OSM (ha i POI), ricerca via api3.geo.admin.ch

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Search, Loader2 } from 'lucide-react'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

export interface LatLng { lat: number; lng: number }

interface Props {
  value: LatLng | null
  onChange: (pos: LatLng, indirizzo?: string) => void
}

interface Risultato { label: string; lat: number; lng: number }

const CENTRO_TICINO: [number, number] = [46.0, 8.95]
const GEO = 'https://api3.geo.admin.ch/rest/services'

const BASEMAPS = {
  swisstopo: {
    label: 'Swisstopo',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
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

type BaseKey = keyof typeof BASEMAPS

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')

async function cerca(testo: string, signal: AbortSignal): Promise<Risultato[]> {
  const url = `${GEO}/api/SearchServer?type=locations&searchText=${encodeURIComponent(testo)}`
    + `&lang=it&sr=4326&limit=6&origins=address,gazetteer,zipcode`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const json = await res.json()
  return (json.results ?? []).map((r: { attrs: { label: string; lat: number; lon: number } }) => ({
    label: stripTags(r.attrs.label),
    lat: r.attrs.lat,
    lng: r.attrs.lon,
  }))
}

async function indirizzoDa(pos: LatLng): Promise<string | undefined> {
  const d = 0.001
  const url = `${GEO}/ech/MapServer/identify?geometryType=esriGeometryPoint`
    + `&geometry=${pos.lng},${pos.lat}&sr=4326&layers=all:ch.bfs.gebaeude_wohnungs_register`
    + `&tolerance=15&mapExtent=${pos.lng - d},${pos.lat - d},${pos.lng + d},${pos.lat + d}`
    + `&imageDisplay=100,100,96&returnGeometry=false&lang=it`
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const json = await res.json()
    const a = json.results?.[0]?.attributes
    if (!a?.strname_deinr) return undefined
    const plz = String(a.plz_plz6 ?? '').split('/')[0]
    return `${a.strname_deinr}, ${plz} ${a.ggdename}`.trim()
  } catch {
    return undefined
  }
}

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: e => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    if (!target) return
    if (first.current) { first.current = false; map.setView([target.lat, target.lng], 17); return }
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 17), { duration: 0.6 })
  }, [target, map])
  return null
}

export function MapPicker({ value, onChange }: Props) {
  const [base, setBase] = useState<BaseKey>('swisstopo')
  const [query, setQuery] = useState('')
  const [risultati, setRisultati] = useState<Risultato[]>([])
  const [loading, setLoading] = useState(false)
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(value)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) { setRisultati([]); return }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      try {
        setRisultati(await cerca(q, ac.signal))
      } catch { /* abort o rete */ }
      finally { if (!ac.signal.aborted) setLoading(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  function scegliRisultato(r: Risultato) {
    const pos = { lat: r.lat, lng: r.lng }
    setFlyTarget(pos)
    setRisultati([])
    setQuery('')
    onChange(pos, r.label)
  }

  async function clickMappa(pos: LatLng) {
    onChange(pos)
    const ind = await indirizzoDa(pos)
    if (ind) onChange(pos, ind)
  }

  const bm = BASEMAPS[base]

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--prox-surface)', borderRadius: 12,
          padding: '9px 12px', border: '1px solid var(--prox-line)',
        }}>
          {loading
            ? <Loader2 size={16} color="var(--prox-ink3)" className="spin" />
            : <Search size={16} color="var(--prox-ink3)" strokeWidth={1.75} />}
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca indirizzo, luogo, CAP…"
            style={{ flex: 1, border: 'none', background: 'none', fontSize: 14, color: 'var(--prox-ink)', outline: 'none' }}
          />
        </div>
        {risultati.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 1000,
            background: 'var(--prox-surface)', border: '1px solid var(--prox-line)',
            borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}>
            {risultati.map((r, i) => (
              <button
                key={i}
                onClick={() => scegliRisultato(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 12px', border: 'none', cursor: 'pointer',
                  background: 'none', fontSize: 13.5, color: 'var(--prox-ink)',
                  borderTop: i ? '1px solid var(--prox-line2)' : 'none',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--prox-line)' }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : CENTRO_TICINO}
          zoom={value ? 17 : 11}
          style={{ height: 280, width: '100%', zIndex: 0 }}
          scrollWheelZoom
        >
          <TileLayer key={base} url={bm.url} attribution={bm.attribution} maxZoom={bm.maxZoom} />
          <ClickHandler onPick={clickMappa} />
          <FlyTo target={flyTarget} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend: e => clickMappa((e.target as L.Marker).getLatLng()),
              }}
            />
          )}
        </MapContainer>

        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 500,
          display: 'flex', background: 'var(--prox-surface)', borderRadius: 999,
          padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          {(Object.keys(BASEMAPS) as BaseKey[]).map(k => (
            <button
              key={k}
              onClick={() => setBase(k)}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: 999,
                padding: '4px 10px', fontSize: 11.5, fontWeight: 600,
                background: base === k ? 'var(--prox-accent)' : 'transparent',
                color: base === k ? '#fff' : 'var(--prox-ink2)',
              }}
            >
              {BASEMAPS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6 }}>
        {value
          ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} — tocca la mappa o trascina il pin per correggere`
          : 'Cerca un indirizzo o tocca la mappa per posizionare il pin'}
      </div>
    </div>
  )
}
