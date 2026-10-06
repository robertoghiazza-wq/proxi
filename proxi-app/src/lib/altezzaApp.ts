// iOS (PWA installata, barra di stato translucida) a volte accorcia la finestra della pagina di quanto è alta la fascia in alto
// (misurato: innerHeight 793 su schermo 852): la zona sotto non è disegnabile e la tab bar resta "alta". iOS ricalcola l'altezza
// da solo solo dopo certi gesti. Qui lo forziamo con due tecniche, controllando ogni volta l'esito. Il log è visibile nella diagnostica.

export const logAltezza: string[] = []

const standalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches
const verticale = () => window.innerHeight > window.innerWidth
const mancante = () => Math.max(screen.width, screen.height) - window.innerHeight
const attesa = (ms: number) => new Promise(r => setTimeout(r, ms))

function nota(t: string) {
  logAltezza.push(`${new Date().toLocaleTimeString('it-CH')} ${t}`)
  if (logAltezza.length > 12) logAltezza.shift()
}

async function tecnicaViewport() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  const originale = meta.getAttribute('content') ?? ''
  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
  await attesa(150)
  meta.setAttribute('content', originale)
}

async function tecnicaScroll() {
  const html = document.documentElement
  const eraBloccato = html.classList.contains('app-shell')
  html.classList.remove('app-shell')
  const sonda = document.createElement('div')
  sonda.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:3000px;pointer-events:none;opacity:0'
  document.body.appendChild(sonda)
  window.scrollTo(0, 8)
  await attesa(120)
  window.scrollTo(0, 0)
  await attesa(60)
  sonda.remove()
  if (eraBloccato) html.classList.add('app-shell')
}

let inCorso = false
let tentativi = 0

export async function ripara(motivo: string) {
  if (inCorso || !standalone() || !verticale()) return
  if (mancante() <= 2) { nota(`${motivo}: ok (innerHeight ${window.innerHeight})`); return }
  if (tentativi >= 4) return
  inCorso = true
  tentativi++
  nota(`${motivo}: mancano ${mancante()}pt, provo`)
  for (const [nome, fn] of [['viewport', tecnicaViewport], ['scroll', tecnicaScroll]] as const) {
    await fn()
    await attesa(350)
    nota(`dopo ${nome}: innerHeight ${window.innerHeight} (mancano ${mancante()})`)
    if (mancante() <= 2) break
  }
  inCorso = false
}

export function avviaAltezzaApp() {
  setTimeout(() => ripara('avvio'), 500)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { tentativi = 0; setTimeout(() => ripara('ritorno'), 400) } })
  window.addEventListener('orientationchange', () => { tentativi = 0 })
}
