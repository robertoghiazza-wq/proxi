// Scelta del colore: pallina con il colore attuale; al tocco si apre il pannello con le scorciatoie della palette,
// il selettore di colore e il campo esadecimale (come nel Brand). Il salvataggio parte quando ci si ferma.

import { useEffect, useRef, useState } from 'react'
import { PALETTE, coloreDa, coloreHex, eColoreHex } from '../lib/colori'

export function ColoreCampo({ value, onChange, vuoto, disabled }: {
  value: string | null
  onChange: (v: string | null) => void
  vuoto?: string          // se presente, il colore può essere "nessuno" (es. "Come la categoria")
  disabled?: boolean
}) {
  const [aperto, setAperto] = useState(false)
  const [bozza, setBozza] = useState(value ? coloreHex(value) : '')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // se il valore cambia da fuori (ricaricamento), la bozza lo segue
  useEffect(() => { setBozza(value ? coloreHex(value) : '') }, [value])
  useEffect(() => () => clearTimeout(timer.current), [])

  const imposta = (hex: string, subito = false) => {
    setBozza(hex)
    clearTimeout(timer.current)
    if (!eColoreHex(hex)) return
    const invia = () => { if (hex.toLowerCase() !== (value ? coloreHex(value) : '')) onChange(hex.toLowerCase()) }
    if (subito) invia()
    else timer.current = setTimeout(invia, 450)
  }

  const mostrato = value ? coloreDa(value) : 'transparent'

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        type="button" disabled={disabled} onClick={() => setAperto(a => !a)} aria-expanded={aperto} aria-label="Cambia colore"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 6px', borderRadius: 999, cursor: disabled ? 'default' : 'pointer',
          border: '1px solid var(--prox-line)', background: 'var(--prox-surface)', fontFamily: 'inherit', fontSize: 13, color: 'var(--prox-ink2)',
        }}
      >
        <span style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: mostrato,
          border: value ? '1px solid rgba(20,23,28,0.12)' : '1.5px dashed var(--prox-ink3)',
        }} />
        {value ? coloreHex(value) : (vuoto ?? 'Nessuno')}
      </button>

      {aperto && !disabled && (
        <div style={{
          marginTop: 8, padding: 10, borderRadius: 12, border: '1px solid var(--prox-line)', background: 'var(--prox-surface2)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PALETTE.map(p => {
              const hex = coloreHex(p.key)
              const attivo = bozza.toLowerCase() === hex
              return (
                <button
                  key={p.key} type="button" title={p.label} aria-label={p.label} onClick={() => imposta(hex, true)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: hex, padding: 0, cursor: 'pointer',
                    border: attivo ? '3px solid var(--prox-surface)' : '3px solid transparent', outline: attivo ? `2px solid ${hex}` : 'none',
                  }}
                />
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color" value={eColoreHex(bozza) ? bozza.toLowerCase() : '#888888'} onChange={e => imposta(e.target.value)} aria-label="Scegli un colore"
              style={{ width: 44, height: 36, padding: 2, borderRadius: 10, border: '1px solid var(--prox-line)', background: 'var(--prox-surface)', cursor: 'pointer' }}
            />
            <input
              value={bozza} onChange={e => imposta(e.target.value.trim())} spellCheck={false} maxLength={7} aria-label="Codice colore"
              style={{
                width: 100, padding: '8px 10px', borderRadius: 10, border: `1px solid ${bozza && !eColoreHex(bozza) ? 'var(--prox-danger)' : 'var(--prox-line)'}`,
                background: 'var(--prox-surface)', fontSize: 14, fontFamily: 'ui-monospace, Menlo, monospace', color: 'var(--prox-ink)',
              }}
            />
            {vuoto !== undefined && value && (
              <button type="button" onClick={() => { clearTimeout(timer.current); setBozza(''); onChange(null); setAperto(false) }} style={{
                border: 'none', background: 'none', cursor: 'pointer', color: 'var(--prox-accent)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              }}>{vuoto}</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
