// Riga con azione di eliminazione: swipe verso destra su mobile, cestino al passaggio del mouse su desktop

import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useIsDesktop } from '../hooks/useIsDesktop'

const ACTION_W = 84
const OPEN_THRESHOLD = 56

interface Props {
  onDelete: () => void
  label?: string
  radius?: number
  children: React.ReactNode
}

export function SwipeRow({ onDelete, label = 'Elimina', radius = 14, children }: Props) {
  const isDesktop = useIsDesktop()
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const moved = useRef(false)
  const locked = useRef<'h' | 'v' | null>(null)

  if (isDesktop) {
    return (
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
        {hover && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            aria-label={label}
            title={label}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 32, borderRadius: 10, border: '1px solid var(--prox-line)',
              background: 'var(--prox-surface)', color: 'var(--prox-danger)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            <Trash2 size={16} strokeWidth={1.9} />
          </button>
        )}
      </div>
    )
  }

  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY, base: dx }
    moved.current = false
    locked.current = null
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = start.current
    if (!s) return
    const mx = e.clientX - s.x
    const my = e.clientY - s.y
    if (!locked.current) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return
      locked.current = Math.abs(mx) > Math.abs(my) ? 'h' : 'v'
      if (locked.current === 'h') {
        setDragging(true)
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }
    }
    if (locked.current !== 'h') return
    moved.current = true
    setDx(Math.max(0, Math.min(ACTION_W + 16, s.base + mx)))
  }

  function onPointerEnd() {
    if (!start.current) return
    start.current = null
    setDragging(false)
    if (locked.current === 'h') setDx(d => (d >= OPEN_THRESHOLD ? ACTION_W : 0))
  }

  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; return }
    if (dx > 0) { e.stopPropagation(); e.preventDefault(); setDx(0) }
  }

  return (
    <div style={{ position: 'relative', borderRadius: radius, overflow: dx > 0 ? 'hidden' : 'visible' }}>
      <button
        onClick={() => { setDx(0); onDelete() }}
        aria-label={label}
        tabIndex={dx > 0 ? 0 : -1}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: ACTION_W,
          background: 'var(--prox-danger)', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, fontSize: 11.5, fontWeight: 600,
          visibility: dx > 0 ? 'visible' : 'hidden',
        }}
      >
        <Trash2 size={18} strokeWidth={2} />
        {label}
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}
