// Riquadro di misura per capire dove arriva davvero lo schermo su iPhone (si apre toccando 5 volte il logo Proxi)

import { useEffect, useRef, useState } from 'react'

export function Diagnostica({ onChiudi }: { onChiudi: () => void }) {
  const [righe, setRighe] = useState<string[]>([])
  const refs = {
    a: useRef<HTMLDivElement>(null), vh: useRef<HTMLDivElement>(null), svh: useRef<HTMLDivElement>(null),
    lvh: useRef<HTMLDivElement>(null), dvh: useRef<HTMLDivElement>(null), env: useRef<HTMLDivElement>(null),
  }

  useEffect(() => {
    const misura = () => {
      const h = (r: React.RefObject<HTMLDivElement | null>) => Math.round(r.current?.getBoundingClientRect().height ?? -1)
      const cs = refs.env.current ? getComputedStyle(refs.env.current) : null
      const vv = window.visualViewport
      const nav = document.querySelector('nav')?.getBoundingClientRect()
      const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
      setRighe([
        `standalone: ${standalone} · display-mode: ${window.matchMedia('(display-mode: standalone)').matches}`,
        `innerHeight ${window.innerHeight} · innerWidth ${window.innerWidth}`,
        `outerHeight ${window.outerHeight} · outerWidth ${window.outerWidth}`,
        `screen ${screen.width}x${screen.height} · avail ${screen.availWidth}x${screen.availHeight}`,
        `visualViewport ${Math.round(vv?.width ?? 0)}x${Math.round(vv?.height ?? 0)} · offsetTop ${Math.round(vv?.offsetTop ?? 0)} · scale ${vv?.scale}`,
        `clientHeight html ${document.documentElement.clientHeight} · body ${document.body.clientHeight}`,
        `100vh ${h(refs.vh)} · 100svh ${h(refs.svh)} · 100lvh ${h(refs.lvh)} · 100dvh ${h(refs.dvh)}`,
        `fixed bottom:0 → bottom ${Math.round(refs.a.current?.getBoundingClientRect().bottom ?? -1)}`,
        `safe area top ${cs?.paddingTop} · bottom ${cs?.paddingBottom}`,
        `tab bar top ${Math.round(nav?.top ?? -1)} · bottom ${Math.round(nav?.bottom ?? -1)} · h ${Math.round(nav?.height ?? -1)}`,
        `--sat ${getComputedStyle(document.documentElement).getPropertyValue('--sat').trim().slice(0, 40)}`,
      ])
    }
    misura()
    const t = setInterval(misura, 700)
    window.addEventListener('resize', misura)
    return () => { clearInterval(t); window.removeEventListener('resize', misura) }
  }, [])

  const sonda = (r: React.RefObject<HTMLDivElement | null>, h: string): React.ReactNode =>
    <div ref={r} style={{ position: 'fixed', left: 0, top: 0, width: 1, height: h, visibility: 'hidden', pointerEvents: 'none' }} />

  return (
    <>
      {sonda(refs.vh, '100vh')}{sonda(refs.svh, '100svh')}{sonda(refs.lvh, '100lvh')}{sonda(refs.dvh, '100dvh')}
      <div ref={refs.a} style={{ position: 'fixed', left: 0, bottom: 0, width: 1, height: 0, pointerEvents: 'none' }} />
      <div ref={refs.env} style={{
        position: 'fixed', visibility: 'hidden', pointerEvents: 'none',
        paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }} />
      {/* linea magenta = dove arriva "bottom: 0"; linea ciano = fondo di 100lvh */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 3, background: 'magenta', zIndex: 2001, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: 'calc(100lvh - 3px)', height: 3, background: 'cyan', zIndex: 2001, pointerEvents: 'none' }} />
      <div onClick={onChiudi} style={{
        position: 'fixed', left: 8, right: 8, top: 'calc(var(--sat) + 56px)', zIndex: 2000, padding: 10, borderRadius: 10,
        background: 'rgba(0,0,0,0.85)', color: '#fff', font: '11px/1.5 ui-monospace, Menlo, monospace',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Diagnostica · tocca per chiudere</div>
        {righe.map((r, i) => <div key={i}>{r}</div>)}
        <div style={{ marginTop: 4, opacity: 0.7 }}>magenta = fondo di bottom:0 · ciano = fondo di 100lvh</div>
      </div>
    </>
  )
}
