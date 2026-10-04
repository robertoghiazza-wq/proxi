import { useEffect } from 'react'
import { useIsDesktop } from '../hooks/useIsDesktop'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  width?: number
}

export function Modal({ open, onClose, children, width = 600 }: ModalProps) {
  const isDesktop = useIsDesktop()

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  if (!isDesktop) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--prox-bg)',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--prox-bg)',
          borderRadius: 20,
          width: `min(${width}px, calc(100vw - 48px))`,
          height: 'min(720px, 92vh)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
