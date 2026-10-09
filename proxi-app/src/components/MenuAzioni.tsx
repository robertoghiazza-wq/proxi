// Menu «⋯» con le azioni meno frequenti o pericolose: tendina su desktop, foglio dal basso su mobile

import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useEsc } from '../lib/esc'

export interface VoceMenu {
  etichetta: string
  icona?: ReactNode
  onClick: () => void
  pericolo?: boolean
  nascosta?: boolean
}

export function MenuAzioni({ voci, etichetta = 'Altre azioni' }: { voci: VoceMenu[]; etichetta?: string }) {
  const visibili = voci.filter(v => !v.nascosta)
  const isDesktop = useIsDesktop()
  const [aperto, setAperto] = useState(false)
  const bottone = useRef<HTMLButtonElement>(null)
  useEsc(aperto, () => setAperto(false))
  if (visibili.length === 0) return null

  const r = aperto ? bottone.current?.getBoundingClientRect() : undefined
  const voce = (v: VoceMenu, i: number) => (
    <button
      key={i} role="menuitem"
      onClick={() => { setAperto(false); v.onClick() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: isDesktop ? 14 : 16, fontWeight: 500, padding: isDesktop ? '10px 14px' : '15px 20px',
        color: v.pericolo ? 'var(--prox-danger)' : 'var(--prox-ink)',
        borderTop: i > 0 && v.pericolo ? '1px solid var(--prox-line)' : 'none',
      }}
    >
      <span style={{ display: 'flex', width: 18, justifyContent: 'center', opacity: 0.85 }}>{v.icona}</span>
      {v.etichetta}
    </button>
  )

  return (
    <>
      <button
        ref={bottone} onClick={() => setAperto(a => !a)} aria-label={etichetta} title={etichetta} aria-haspopup="menu" aria-expanded={aperto}
        style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: aperto ? 'var(--prox-surface2)' : 'transparent', color: 'var(--prox-ink2)',
        }}
      ><MoreHorizontal size={20} strokeWidth={1.9} /></button>

      {aperto && createPortal(
        <>
          <div onClick={() => setAperto(false)} style={{ position: 'fixed', inset: 0, zIndex: 399, background: isDesktop ? 'transparent' : 'rgba(0,0,0,0.35)' }} />
          {isDesktop && r ? (
            <div role="menu" style={{
              position: 'fixed', zIndex: 400, top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right), minWidth: 230, overflow: 'hidden',
              background: 'var(--prox-surface)', border: '1px solid var(--prox-line)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
            }}>{visibili.map(voce)}</div>
          ) : (
            <div role="menu" style={{
              position: 'fixed', zIndex: 400, left: 0, right: 0, bottom: 0, background: 'var(--prox-surface)', borderRadius: '18px 18px 0 0',
              paddingBottom: 'calc(var(--sab) + 8px)', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--prox-line)', margin: '10px auto 6px' }} />
              {visibili.map(voce)}
              <button onClick={() => setAperto(false)} style={{
                display: 'block', width: 'calc(100% - 32px)', margin: '8px 16px 0', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'var(--prox-surface2)', color: 'var(--prox-ink2)', fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
              }}>Annulla</button>
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  )
}
