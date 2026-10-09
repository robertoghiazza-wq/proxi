// Campo telefono con prefisso internazionale obbligatorio: bandiera + prefisso (menu dei paesi, vicini per primi, con ricerca)
// e numero formattato mentre si scrive. Il valore che esce è sempre «+41 79 123 45 67» (vuoto se non c'è il numero).

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useEsc } from '../lib/esc'
import {
  PAESI_VICINI, bandiera, cercaPaesi, componi, esempioNazionale, formattaNazionale, numeroPlausibile, paeseDaPrefisso,
  prefissoDi, scomponi, soloCifre, type Paese,
} from '../lib/telefono'

export function TelefonoCampo({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: CSSProperties }) {
  const iniziale = scomponi(value)
  const [paese, setPaese] = useState<Paese>(iniziale.paese)
  const [testo, setTesto] = useState(iniziale.nazionale)
  const ultimo = useRef(value)

  // il valore cambia da fuori (altra scheda, ricarica dati): si rilegge; se l'abbiamo emesso noi non serve
  useEffect(() => {
    if (value === ultimo.current) return
    ultimo.current = value
    const s = scomponi(value)
    setPaese(s.paese); setTesto(s.nazionale)
  }, [value])

  const emetti = (p: Paese, nazionale: string) => {
    const v = componi(p, nazionale)
    ultimo.current = v
    onChange(v)
  }

  function alCambio(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value
    // numero incollato o scritto con il prefisso: «+39 312…» / «0039 312…» cambia anche il paese
    if (/^\s*(\+|00)/.test(raw)) {
      const m = paeseDaPrefisso(soloCifre(raw.replace(/^\s*(\+|00)/, '')))
      if (m) {
        const nazionale = formattaNazionale(m.paese, m.resto)
        setPaese(m.paese); setTesto(nazionale); emetti(m.paese, nazionale)
        return
      }
      raw = soloCifre(raw)
    }
    let cifre = soloCifre(raw)
    // si è cancellato solo uno spazio: toglie anche la cifra prima, altrimenti non si riuscirebbe a cancellare
    if (raw.length < testo.length && cifre === soloCifre(testo)) cifre = cifre.slice(0, -1)
    const nazionale = formattaNazionale(paese, cifre)
    setTesto(nazionale)
    emetti(paese, nazionale)
  }

  function scegliPaese(p: Paese) {
    const nazionale = formattaNazionale(p, soloCifre(testo))
    setPaese(p); setTesto(nazionale); emetti(p, nazionale)
  }

  const incompleto = testo !== '' && !numeroPlausibile(componi(paese, testo))

  return (
    <div style={style}>
      <div style={{ display: 'flex', gap: 8 }}>
        <SelettorePrefisso paese={paese} onScegli={scegliPaese} />
        <input
          value={testo} onChange={alCambio} type="tel" inputMode="tel" autoComplete="tel-national"
          placeholder={esempioNazionale(paese) || 'Numero'}
          style={{ ...campoBase, flex: 1, minWidth: 0, borderColor: incompleto ? 'oklch(0.75 0.12 70)' : 'var(--prox-line)' }}
        />
      </div>
      {incompleto && <div style={{ fontSize: 11.5, color: 'oklch(0.50 0.13 70)', marginTop: 4 }}>Numero incompleto o non valido per {prefissoDi(paese)}</div>}
    </div>
  )
}

function SelettorePrefisso({ paese, onScegli }: { paese: Paese; onScegli: (p: Paese) => void }) {
  const isDesktop = useIsDesktop()
  const [aperto, setAperto] = useState(false)
  const [q, setQ] = useState('')
  const bottone = useRef<HTMLButtonElement>(null)
  useEsc(aperto, () => setAperto(false))
  const r = aperto ? bottone.current?.getBoundingClientRect() : undefined
  const paesi = cercaPaesi(q)
  const chiudi = () => { setAperto(false); setQ('') }

  const elenco = (
    <>
      <div style={{ padding: 10, borderBottom: '1px solid var(--prox-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={15} color="var(--prox-ink3)" />
        <input
          data-senza-avviso autoFocus={isDesktop} value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca stato o prefisso…"
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', outline: 'none', fontSize: 14, color: 'var(--prox-ink)' }}
        />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: isDesktop ? 280 : '55vh' }}>
        {paesi.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'var(--prox-ink3)' }}>Nessun risultato</div>}
        {paesi.map((p, i) => (
          <div key={p.codice}>
            {!q && i === PAESI_VICINI.length && <div style={{ borderTop: '1px solid var(--prox-line)', margin: '2px 0' }} />}
            <button type="button" onClick={() => { onScegli(p.codice); chiudi() }} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: isDesktop ? '8px 12px' : '12px 16px', fontSize: 14, color: 'var(--prox-ink)',
              background: p.codice === paese ? 'var(--prox-accent-soft)' : 'transparent',
            }}>
              <span style={{ fontSize: 18, width: 24 }}>{bandiera(p.codice)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
              <span style={{ color: 'var(--prox-ink3)', fontVariantNumeric: 'tabular-nums' }}>{p.prefisso}</span>
            </button>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <>
      <button
        type="button" ref={bottone} onClick={() => setAperto(a => !a)} aria-label={`Prefisso ${prefissoDi(paese)}: cambia stato`} aria-haspopup="listbox" aria-expanded={aperto}
        style={{ ...campoBase, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '0 8px 0 10px', fontVariantNumeric: 'tabular-nums' }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{bandiera(paese)}</span>
        <span style={{ fontWeight: 600 }}>{prefissoDi(paese)}</span>
        <ChevronDown size={15} color="var(--prox-ink3)" />
      </button>

      {aperto && createPortal(
        <>
          <div onClick={chiudi} style={{ position: 'fixed', inset: 0, zIndex: 399, background: isDesktop ? 'transparent' : 'rgba(0,0,0,0.35)' }} />
          {isDesktop && r ? (
            <div style={{
              position: 'fixed', zIndex: 400, left: Math.min(r.left, window.innerWidth - 328), width: 320, overflow: 'hidden',
              // se sotto non c'è spazio la lista si apre verso l'alto
              ...(window.innerHeight - r.bottom < 360 && r.top > window.innerHeight - r.bottom ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
              background: 'var(--prox-surface)', border: '1px solid var(--prox-line)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
            }}>{elenco}</div>
          ) : (
            <div style={{
              position: 'fixed', zIndex: 400, left: 0, right: 0, bottom: 0, background: 'var(--prox-surface)', borderRadius: '18px 18px 0 0',
              paddingBottom: 'var(--sab)', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}>{elenco}</div>
          )}
        </>,
        document.body,
      )}
    </>
  )
}

const campoBase: CSSProperties = {
  height: 42, boxSizing: 'border-box', border: '1px solid var(--prox-line)', borderRadius: 12, background: 'var(--prox-surface)',
  color: 'var(--prox-ink)', fontSize: 15, fontFamily: 'inherit', padding: '0 12px', outline: 'none',
}
