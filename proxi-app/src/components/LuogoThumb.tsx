// Anteprima luogo: ritaglio satellitare swisstopo centrato sul punto, icona se mancano le coordinate

import { useState } from 'react'
import { MapPin } from 'lucide-react'

export function satelliteUrl(lat: number, lng: number, px: number, metri = 22) {
  const d = metri / 111320
  const dl = d / Math.cos(lat * Math.PI / 180)
  const bbox = `${lat - d},${lng - dl},${lat + d},${lng + dl}`
  const size = Math.round(px * 3)
  return 'https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap'
    + `&LAYERS=ch.swisstopo.swissimage&STYLES=&CRS=EPSG:4326&BBOX=${bbox}`
    + `&WIDTH=${size}&HEIGHT=${size}&FORMAT=image/jpeg`
}

interface Props {
  lat: number | null
  lng: number | null
  color: string
  size?: number
  radius?: number
}

export function LuogoThumb({ lat, lng, color, size = 44, radius = 10 }: Props) {
  const [failed, setFailed] = useState(false)
  const box: React.CSSProperties = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    position: 'relative', overflow: 'hidden',
  }

  if (lat == null || lng == null || failed) {
    return (
      <div style={{ ...box, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MapPin size={Math.round(size / 2)} color={color} strokeWidth={1.75} />
      </div>
    )
  }

  return (
    <div style={{ ...box, background: color + '22' }}>
      <img
        src={satelliteUrl(lat, lng, size)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <span style={{
        position: 'absolute', left: '50%', top: '50%', width: 16, height: 16,
        transform: 'translate(-50%, -92%)', display: 'block',
      }}>
        <MapPin size={16} color="#fff" strokeWidth={4.2} style={{ position: 'absolute', inset: 0 }} />
        <MapPin size={16} color={color} strokeWidth={2.2} style={{ position: 'absolute', inset: 0 }} />
      </span>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: radius,
        boxShadow: `inset 0 0 0 1.5px ${color}`, pointerEvents: 'none',
      }} />
    </div>
  )
}
