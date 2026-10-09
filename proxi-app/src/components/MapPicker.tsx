// Selettore posizione su mappa — swisstopo (preciso, CH) o OSM (ha i POI), ricerca via api3.geo.admin.ch

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import type L from 'leaflet'
import { BASEMAPS, BaseMapSwitch, type BaseKey } from './MapBase'
import { Loader2, LocateFixed } from 'lucide-react'
import { comuneDaCoordinate } from '../lib/geo'
import { CampoRicerca } from './CampoRicerca'


export interface LatLng { lat: number; lng: number }

export interface ParteIndirizzo {
  via?: string; cap?: string; localita?: string
  comune?: string; bfs?: string; cantone?: string
}

interface Props {
  value: LatLng | null
  onChange: (pos: LatLng, indirizzo?: string, parti?: ParteIndirizzo) => void
}

interface Risultato { label: string; lat: number; lng: number; parti?: ParteIndirizzo }

const CENTRO_TICINO: [number, number] = [46.0, 8.95]
const GEO = 'https://api3.geo.admin.ch/rest/services'

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')

async function cerca(testo: string, signal: AbortSignal): Promise<Risultato[]> {
  const url = `${GEO}/api/SearchServer?type=locations&searchText=${encodeURIComponent(testo)}`
    + `&lang=it&sr=4326&limit=6&origins=address,gazetteer,zipcode`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const json = await res.json()
  return (json.results ?? []).map((r: { attrs: { label: string; detail?: string; lat: number; lon: number } }) => {
    const m = r.attrs.label.match(/^(.*?)\s*<b>(\d{4})\s+(.+?)<\/b>/)
    const d = r.attrs.detail?.match(/\b\d{4}\s+.+?\s+(\d{4,5})\s+(.+?)\s+ch\s+([a-z]{2})\b/i)
    return {
      label: stripTags(r.attrs.label),
      lat: r.attrs.lat,
      lng: r.attrs.lon,
      parti: m ? {
        via: m[1].trim() || undefined, cap: m[2], localita: m[3].trim(),
        comune: d ? d[2].replace(/(^|[\s'’-])(\p{L})/gu, (_x: string, sep: string, c: string) => sep + c.toUpperCase()) : undefined,
        bfs: d?.[1], cantone: d?.[3].toUpperCase(),
      } : undefined,
    }
  })
}

async function indirizzoDa(pos: LatLng): Promise<{ testo: string; parti: ParteIndirizzo } | undefined> {
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
    return {
      testo: `${a.strname_deinr}, ${plz} ${a.ggdename}`.trim(),
      parti: {
        via: a.strname_deinr, cap: plz, localita: a.ggdename,
        comune: a.ggdename, bfs: a.ggdenr != null ? String(a.ggdenr) : undefined, cantone: a.gdekt,
      },
    }
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
  const [gps, setGps] = useState<'idle' | 'busy'>('idle')
  const [gpsErr, setGpsErr] = useState('')
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
    onChange(pos, r.label, r.parti)
  }

  async function clickMappa(pos: LatLng) {
    onChange(pos)
    const ind = await indirizzoDa(pos)
    if (ind) { onChange(pos, ind.testo, ind.parti); return }
    const c = await comuneDaCoordinate(pos.lat, pos.lng)
    if (c) onChange(pos, undefined, { comune: c.nome, bfs: c.bfs, cantone: c.cantone })
  }

  function locate() {
    if (!navigator.geolocation) { setGpsErr('GPS non disponibile su questo dispositivo'); return }
    setGps('busy')
    setGpsErr('')
    navigator.geolocation.getCurrentPosition(
      p => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude }
        setFlyTarget(pos)
        setGps('idle')
        clickMappa(pos)
      },
      err => {
        setGps('idle')
        setGpsErr(err.code === err.PERMISSION_DENIED
          ? 'Permesso di localizzazione negato'
          : 'Posizione non disponibile, riprova all\'aperto')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const bm = BASEMAPS[base]

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <CampoRicerca
          value={query} onChange={setQuery} placeholder="Cerca indirizzo, luogo, CAP…" compatto
          icona={loading ? <Loader2 size={16} color="var(--prox-ink3)" className="spin" style={{ flexShrink: 0 }} /> : undefined}
        />
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

        <BaseMapSwitch value={base} onChange={setBase} />

        <button
          onClick={locate}
          disabled={gps === 'busy'}
          aria-label="Usa la mia posizione"
          style={{
            position: 'absolute', bottom: 24, right: 8, zIndex: 500,
            width: 38, height: 38, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--prox-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {gps === 'busy'
            ? <Loader2 size={18} color="var(--prox-accent)" className="spin" />
            : <LocateFixed size={18} color="var(--prox-accent)" strokeWidth={2} />}
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6 }}>
        {gpsErr
          ? <span style={{ color: 'var(--prox-danger)' }}>{gpsErr}</span>
          : value
          ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} — tocca la mappa o trascina il pin per correggere`
          : 'Cerca un indirizzo o tocca la mappa per posizionare il pin'}
      </div>
    </div>
  )
}
