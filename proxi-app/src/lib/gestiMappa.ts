// Gesti della mappa più «da app di mappe»: con due dita lo zoom parte subito, la rotazione solo dopo un angolo minimo
// (così non gira per sbaglio mentre si zooma) e, quando si lascia, si aggancia al nord se è vicina.
// Sostituisce il comportamento di leaflet-rotate, che ruotava a ogni minimo scostamento insieme allo zoom.

import L from 'leaflet'
import 'leaflet-rotate'

export const SOGLIA_ROTAZIONE_TOCCO = 14      // gradi di rotazione prima che la mappa inizi a girare (due dita)
export const SOGLIA_ROTAZIONE_TRACKPAD = 8    // gradi, con il trackpad (più preciso)
export const AGGANCIO_NORD = 8                // gradi: sotto questo valore, a fine gesto la mappa torna al nord

type MappaB = L.Map & { getBearing(): number; setBearing(g: number): void }

export function agganciaAlNord(map: MappaB) {
  const b = ((map.getBearing() % 360) + 360) % 360
  if (b < AGGANCIO_NORD || b > 360 - AGGANCIO_NORD) map.setBearing(0)
}

const RAD_GRADI = 180 / Math.PI

// biome-ignore lint: il plugin non ha tipi
const Gesti = (L.Map as any).TouchGestures
if (Gesti && !Gesti.prototype.__prox) {
  Gesti.prototype.__prox = true
  const inizio = Gesti.prototype._onTouchStart
  const muovi = Gesti.prototype._onTouchMove
  const fine = Gesti.prototype._onTouchEnd

  Gesti.prototype._onTouchStart = function (e: TouchEvent) {
    inizio.call(this, e)
    if (this._rotating) {
      const map = this._map as MappaB
      const a = map.mouseEventToContainerPoint(e.touches[0] as unknown as MouseEvent)
      const b = map.mouseEventToContainerPoint(e.touches[1] as unknown as MouseEvent)
      this._angPrec = Math.atan2(a.y - b.y, a.x - b.x) * RAD_GRADI
      this._angTot = 0
      this._ruotando = false
      this._bearingInizio = map.getBearing()
    }
  }

  Gesti.prototype._onTouchMove = function (e: TouchEvent) {
    const volevaRuotare = this._rotating
    this._rotating = false            // la rotazione la gestiamo noi, sotto; lo zoom resta quello del plugin
    try { muovi.call(this, e) } finally { this._rotating = volevaRuotare }
    if (!volevaRuotare || !e.touches || e.touches.length !== 2) return

    const map = this._map as MappaB
    const a = map.mouseEventToContainerPoint(e.touches[0] as unknown as MouseEvent)
    const b = map.mouseEventToContainerPoint(e.touches[1] as unknown as MouseEvent)
    const ang = Math.atan2(a.y - b.y, a.x - b.x) * RAD_GRADI
    let d = ang - this._angPrec
    if (d > 180) d -= 360
    if (d < -180) d += 360
    this._angPrec = ang
    this._angTot += d

    if (!this._ruotando && Math.abs(this._angTot) > SOGLIA_ROTAZIONE_TOCCO) this._ruotando = true
    if (this._ruotando) {
      // si toglie la soglia, così la mappa non «salta» nel momento in cui inizia a girare
      map.setBearing(this._bearingInizio + this._angTot - Math.sign(this._angTot) * SOGLIA_ROTAZIONE_TOCCO)
    }
  }

  Gesti.prototype._onTouchEnd = function () {
    const ruotava = this._ruotando
    fine.call(this)
    this._ruotando = false
    if (ruotava) agganciaAlNord(this._map as MappaB)
  }
}
