// Su iPhone, nella PWA installata, l'area "fixed" può finire sopra la zona dell'indicatore home (non arriva al bordo fisico).
// Qui si imposta --h-app = altezza reale dello schermo (in pt), così le schermate a tutta altezza arrivano fino in fondo.
// In un browser normale (o in orizzontale) la variabile non c'è e valgono le altezze normali.

export function avviaAltezzaApp() {
  const root = document.documentElement
  const aggiorna = () => {
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches
    const verticale = window.innerHeight > window.innerWidth
    const h = Math.max(screen.width, screen.height)
    if (standalone && verticale && h > 0) root.style.setProperty('--h-app', `${h}px`)
    else root.style.removeProperty('--h-app')
  }
  aggiorna()
  window.addEventListener('resize', aggiorna)
  window.addEventListener('orientationchange', aggiorna)
}
