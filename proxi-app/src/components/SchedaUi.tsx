// Elementi comuni delle schede (titolo di sezione, barra Salva/Annulla, voce etichetta+valore, stili dei campi)

import { useEffect, useRef, useState } from 'react'
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react'

export const etichetta: React.CSSProperties = { fontSize: 11.5, color: 'var(--prox-ink3)', marginBottom: 3, fontWeight: 500 }
export const vuoto: React.CSSProperties = { fontSize: 13, color: 'var(--prox-ink3)', margin: 0 }
export const testoStile: React.CSSProperties = { fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }
export const campo: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}
export const ghost: React.CSSProperties = {
  border: 'none', background: 'none', cursor: 'pointer', color: 'var(--prox-ink2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6,
}
export const btn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 999, border: '1px solid var(--prox-line)', background: 'var(--prox-surface2)',
  color: 'var(--prox-ink2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
export const azione: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none',
  color: 'var(--prox-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

export function Titolo({ titolo, azione: a, conto }: { titolo: string; azione?: React.ReactNode; conto?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span className="prox-label">{titolo}{conto !== undefined && <span style={{ marginLeft: 8, fontWeight: 500 }}>{conto}</span>}</span>
      {a}
    </div>
  )
}

export function BtnModifica({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={azione}>
      <Edit size={14} strokeWidth={2} /> Modifica
    </button>
  )
}

export function Voce({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div style={etichetta}>{l}</div>
      <div style={{
        fontSize: 14, wordBreak: 'break-word', fontFamily: mono ? 'ui-monospace, monospace' : undefined,
        color: v === '—' ? 'var(--prox-ink3)' : 'var(--prox-ink)',
      }}>{v}</div>
    </div>
  )
}

export function BarraSalva({ errore, caricamento, onSalva, onAnnulla }: {
  errore: string; caricamento: boolean; onSalva: () => void; onAnnulla: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAnnulla} style={{ ...btn, flex: 1, padding: '12px 0' }}>Annulla</button>
        <button onClick={onSalva} disabled={caricamento} style={{
          flex: 2, padding: '12px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700, opacity: caricamento ? 0.6 : 1,
        }}>
          {caricamento ? 'Salvo…' : 'Salva'}
        </button>
      </div>
    </div>
  )
}

// Barra di tab orizzontale (scorre se non c'è spazio, con sfumatura e freccia sul lato dove ce ne sono altre);
// `avviso` mette un puntino ambra sulla tab. La tab attiva viene portata in vista.
export function BarraTab<K extends string>({ tabs, attiva, onScegli }: {
  tabs: { key: K; label: string; avviso?: boolean }[]
  attiva: K
  onScegli: (k: K) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [lati, setLati] = useState({ sx: false, dx: false })

  const aggiorna = () => {
    const el = scroller.current
    if (!el) return
    setLati({ sx: el.scrollLeft > 4, dx: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }
  useEffect(() => {
    aggiorna()
    window.addEventListener('resize', aggiorna)
    return () => window.removeEventListener('resize', aggiorna)
  }, [tabs.length])
  useEffect(() => {
    scroller.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [attiva])

  const sfuma = (lato: 'sx' | 'dx'): React.CSSProperties => ({
    position: 'absolute', top: 0, bottom: 0, [lato === 'sx' ? 'left' : 'right']: 0, width: 34, pointerEvents: 'none',
    display: 'flex', alignItems: 'center', justifyContent: lato === 'sx' ? 'flex-start' : 'flex-end', color: 'var(--prox-ink3)',
    background: `linear-gradient(to ${lato === 'sx' ? 'right' : 'left'}, var(--prox-surface) 35%, transparent)`,
  })

  return (
    <div style={{ position: 'relative', flexShrink: 0, borderTop: '1px solid var(--prox-line)', borderBottom: '1px solid var(--prox-line)', background: 'var(--prox-surface)' }}>
      <div ref={scroller} onScroll={aggiorna} role="tablist" style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {tabs.map(t => {
          const a = t.key === attiva
          return (
            <button key={t.key} role="tab" aria-selected={a} onClick={() => onScegli(t.key)} style={{
              flex: '1 0 auto', padding: '12px 13px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: 'transparent', fontSize: 14, fontWeight: a ? 700 : 500, fontFamily: 'inherit',
              color: a ? 'var(--prox-accent)' : 'var(--prox-ink3)',
              borderBottom: `2px solid ${a ? 'var(--prox-accent)' : 'transparent'}`,
            }}>
              {t.label}
              {t.avviso && <span title="Da completare" style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginLeft: 6, verticalAlign: 'middle',
                background: 'oklch(0.72 0.14 80)',
              }} />}
            </button>
          )
        })}
      </div>
      {lati.sx && <div style={sfuma('sx')}><ChevronLeft size={16} strokeWidth={2.2} /></div>}
      {lati.dx && <div style={sfuma('dx')}><ChevronRight size={16} strokeWidth={2.2} /></div>}
    </div>
  )
}
