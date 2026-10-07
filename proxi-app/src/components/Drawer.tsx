import { useIsDesktop } from '../hooks/useIsDesktop'

interface DrawerProps {
  open: boolean
  onClose?: () => void
  children: React.ReactNode
  width?: number
}

export function Drawer({ open, onClose, children, width = 600 }: DrawerProps) {
  const isDesktop = useIsDesktop()

  if (!open) return null

  if (!isDesktop) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--prox-bg)',
        zIndex: 200, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)',
        boxSizing: 'border-box',
      }} className="prox-drawer">
        {children}
      </div>
    )
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 'var(--fascia)', left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.06)',
          zIndex: 89,
        }}
      />
      <div style={{
        // a tutta altezza, anche sopra il menu (sotto resta solo la striscia rossa); ferma anche se la lista sotto è scrollata
        position: 'fixed', right: 0, top: 'var(--fascia)', bottom: 0,
        width,
        background: 'var(--prox-surface)',
        borderLeft: '1px solid var(--prox-line)',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        zIndex: 90,   // sopra il menu, sotto modal (100) e conferme (500)
        boxShadow: '-6px 0 32px rgba(0,0,0,0.10)',
        animation: 'drawerIn 0.18s ease',
      }} className="prox-drawer">
        {children}
      </div>
    </>
  )
}
