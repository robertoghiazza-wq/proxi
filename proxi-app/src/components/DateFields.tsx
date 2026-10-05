// Campi data/ora con due comportamenti (stessa logica di Vivace):
//  • al computer: tre caselle (gg · mm · aaaa, più hh : mm per data e ora). Finite le cifre del giorno si passa al
//    mese e poi all'anno; si può incollare una data in molti formati (15.03.2026, 15/3/26, 2026-03-15, «15 marzo 2026»…);
//    un pulsante apre il calendario.
//  • su telefono e tablet (puntatore «coarse»): il selettore nativo del sistema, quello a scorrimento.
// Il valore è sempre quello dei campi nativi (AAAA-MM-GG, AAAA-MM-GGTHH:mm, HH:mm) e onChange riceve un oggetto
// {target:{value}}, così sostituisce un <input type="date"> senza cambiare il resto del codice.

import { useState, useEffect, useRef } from 'react'
import { parseDateTime, parseTime, validDate, validTime } from '../lib/dateParse'

type Mode = 'date' | 'datetime' | 'time'
type Key = 'd' | 'm' | 'y' | 'h' | 'mi'
type Parts = Record<Key, string>

const LEN: Record<Key, number> = { d: 2, m: 2, y: 4, h: 2, mi: 2 }
const FIRST_PAD: Partial<Record<Key, string>> = { d: '3', m: '1', h: '2', mi: '5' } // una prima cifra oltre questa non può essere seguita da un'altra
const ORDER: Record<Mode, Key[]> = { date: ['d', 'm', 'y'], datetime: ['d', 'm', 'y', 'h', 'mi'], time: ['h', 'mi'] }
const PLACEHOLDER: Record<Key, string> = { d: 'gg', m: 'mm', y: 'aaaa', h: 'hh', mi: 'mm' }
const SEP: Partial<Record<Key, string>> = { m: '.', y: '.', h: ' ', mi: ':' }
const NATIVE: Record<Mode, string> = { date: 'date', datetime: 'datetime-local', time: 'time' }

const VUOTO: Parts = { d: '', m: '', y: '', h: '', mi: '' }

const isTouch = () => typeof window !== 'undefined' && (
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''))

function fromValue(value: string, mode: Mode): Parts {
  const v = String(value || '')
  let r: RegExpMatchArray | null
  if (mode === 'time') return (r = v.match(/^(\d{2}):(\d{2})/)) ? { ...VUOTO, h: r[1], mi: r[2] } : { ...VUOTO }
  r = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  return r ? { ...VUOTO, y: r[1], m: r[2], d: r[3], h: r[4] || '', mi: r[5] || '' } : { ...VUOTO }
}

function compose(p: Parts, mode: Mode): string {
  const full = ORDER[mode].every(k => p[k].length === LEN[k])
  if (!full) return ''
  const date = `${p.y}-${p.m}-${p.d}`
  if (mode !== 'time' && !validDate(p.y, p.m, p.d)) return ''
  if (mode !== 'date' && !validTime(p.h, p.mi)) return ''
  return mode === 'date' ? date : mode === 'time' ? `${p.h}:${p.mi}` : `${date}T${p.h}:${p.mi}`
}

export interface DateFieldProps {
  value: string | null | undefined
  onChange?: (e: { target: { value: string } }) => void
  style?: React.CSSProperties
  min?: string
  max?: string
  disabled?: boolean
  title?: string
  autoFocus?: boolean
}

function SegmentedField({ mode, value, onChange, style = {}, min, max, disabled, title, autoFocus }: DateFieldProps & { mode: Mode }) {
  const v = String(value || '')
  const [parts, setParts] = useState<Parts>(() => fromValue(v, mode))
  const [focus, setFocus] = useState(false)
  const last = useRef(v)
  const refs = useRef<Partial<Record<Key, HTMLInputElement | null>>>({})
  const nativeRef = useRef<HTMLInputElement | null>(null)
  const keys = ORDER[mode]

  // un valore che cambia da fuori (caricamento, azzeramento) si rispecchia nelle caselle; quello che abbiamo
  // appena emesso noi no (altrimenti cancellerebbe quanto si sta digitando)
  useEffect(() => {
    if (v !== last.current) { last.current = v; setParts(fromValue(v, mode)) }
  }, [v, mode])

  function commit(next: Parts) {
    setParts(next)
    let out = compose(next, mode)
    // fuori dai limiti min/max = non valida: il form riceve un valore vuoto, mai una data sbagliata
    if (out && mode !== 'time') {
      const g = out.slice(0, 10)
      if ((min && g < String(min).slice(0, 10)) || (max && g > String(max).slice(0, 10))) out = ''
    }
    if (out !== last.current) { last.current = out; onChange?.({ target: { value: out } }) }
  }

  const focusKey = (k: Key) => { const el = refs.current[k]; if (el) { el.focus(); el.select() } }
  const move = (k: Key, delta: number) => { const next = keys[keys.indexOf(k) + delta]; if (next) focusKey(next) }

  function onSeg(k: Key, e: React.ChangeEvent<HTMLInputElement>) {
    const all = e.target.value.replace(/\D/g, '')
    // più cifre in un colpo solo (compilazione automatica, tastiere veloci, incolla di sole cifre): si leggono
    // come una sequenza e si distribuiscono sulle caselle, senza perderne
    if (all.length > 1) {
      const next = { ...parts }
      let i = keys.indexOf(k), rest = all, lastKey: Key = k
      while (rest && i < keys.length) {
        const kk = keys[i]
        let take: string
        const pad = FIRST_PAD[kk]
        if (pad && rest[0] > pad) { take = '0' + rest[0]; rest = rest.slice(1) } // «5» è già 05
        else { take = rest.slice(0, LEN[kk]); rest = rest.slice(LEN[kk]) }
        next[kk] = take; lastKey = kk; i++
      }
      commit(next)
      const done = next[lastKey].length === LEN[lastKey]
      const dopo = keys[keys.indexOf(lastKey) + 1]
      focusKey(done && dopo ? dopo : lastKey)
      return
    }
    const raw = all.slice(0, LEN[k])
    let val = raw, advance = raw.length === LEN[k]
    const pad = FIRST_PAD[k]
    if (!advance && raw.length === 1 && pad && raw > pad) { val = '0' + raw; advance = true }
    commit({ ...parts, [k]: val })
    if (advance) move(k, 1)
  }

  function onKey(k: Key, e: React.KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget
    if (e.key.length === 1 && /[./\-: ]/.test(e.key) && parts[k] && keys.indexOf(k) < keys.length - 1) {
      e.preventDefault()
      commit({ ...parts, [k]: k !== 'y' && parts[k].length === 1 ? '0' + parts[k] : parts[k] })
      move(k, 1)
    } else if (e.key === 'Backspace' && el.value === '' && keys.indexOf(k) > 0) {
      e.preventDefault(); move(k, -1)
    } else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && el.selectionEnd === 0) {
      e.preventDefault(); move(k, -1)
    } else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length) {
      e.preventDefault(); move(k, 1)
    }
  }

  function onPaste(k: Key, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData?.getData('text') || ''
    if (/^\d{1,4}$/.test(text.trim()) && text.trim().length <= LEN[k]) return // poche cifre: le gestisce la casella
    e.preventDefault()
    if (mode === 'time') {
      const t = parseTime(text)
      if (t) commit({ ...parts, h: t.slice(0, 2), mi: t.slice(3) })
      return
    }
    const r = parseDateTime(text)
    if (!r) return
    const [y, m, d] = r.date.split('-')
    const next = { ...parts, y, m, d }
    if (mode === 'datetime' && r.time) { next.h = r.time.slice(0, 2); next.mi = r.time.slice(3) }
    commit(next)
    focusKey(keys[keys.length - 1])
  }

  // uscendo dal campo si completano le cifre mancanti (5 → 05, 26 → 2026)
  function finalize() {
    const n = { ...parts }
    for (const k of ['d', 'm', 'h', 'mi'] as Key[]) if (n[k].length === 1) n[k] = '0' + n[k]
    if (n.y.length === 2) n.y = String(Number(n.y) <= 49 ? 2000 + Number(n.y) : 1900 + Number(n.y))
    if (JSON.stringify(n) !== JSON.stringify(parts)) commit(n)
  }

  const complete = keys.every(k => parts[k].length === LEN[k])
  const out = compose(parts, mode)
  const datePart = out.slice(0, 10)
  const outOfRange = !!out && ((!!min && datePart < String(min).slice(0, 10)) || (!!max && datePart > String(max).slice(0, 10)))
  const invalid = (complete && !out) || outOfRange

  function openCalendar() {
    const n = nativeRef.current
    if (!n) return
    try { n.showPicker() } catch { n.focus(); n.click() }
  }

  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 1, boxSizing: 'border-box', width: '100%', cursor: 'text', position: 'relative',
    ...style,
    borderColor: invalid ? 'var(--prox-danger)' : focus ? 'var(--prox-accent)' : undefined,
  }
  if (invalid || focus) base.borderStyle = 'solid'
  const seg = (k: Key): React.CSSProperties => ({
    border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: 'inherit', padding: 0, margin: 0,
    textAlign: 'center', width: `calc(${LEN[k]}ch + 2px)`, minWidth: 0, flexShrink: 0,
  })

  // telefono e tablet: il selettore nativo a scorrimento
  if (isTouch()) {
    const nv = mode === 'datetime' ? v.replace(' ', 'T').slice(0, 16) : v
    return (
      <input
        type={NATIVE[mode]} style={style} value={nv} min={min} max={max} disabled={disabled} title={title} autoFocus={autoFocus}
        onChange={e => onChange?.(e)}
      />
    )
  }

  return (
    <div
      role="group" aria-label={title} title={title} style={base}
      onClick={e => { if (e.target === e.currentTarget) focusKey(keys.find(k => !parts[k]) || keys[0]) }}
      onFocus={() => setFocus(true)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setFocus(false); finalize() } }}
    >
      {keys.map((k, i) => (
        <span key={k} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && <span style={{ whiteSpace: 'pre', opacity: 0.55, padding: '0 1px' }}>{SEP[k]}</span>}
          <input
            ref={el => { refs.current[k] = el }} inputMode="numeric" autoComplete="off" aria-label={PLACEHOLDER[k]} placeholder={PLACEHOLDER[k]}
            disabled={disabled} autoFocus={autoFocus && i === 0} value={parts[k]} style={seg(k)}
            onChange={e => onSeg(k, e)} onKeyDown={e => onKey(k, e)} onPaste={e => onPaste(k, e)} onFocus={e => e.target.select()}
          />
        </span>
      ))}
      {mode !== 'time' && !disabled && (
        <>
          <button
            type="button" tabIndex={-1} aria-label="Apri calendario" onClick={openCalendar}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: '0 0 0 6px', cursor: 'pointer', color: 'var(--prox-ink3)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </button>
          <input
            ref={nativeRef} type="date" tabIndex={-1} aria-hidden="true" value={datePart.length === 10 ? datePart : ''}
            min={min ? String(min).slice(0, 10) : undefined} max={max ? String(max).slice(0, 10) : undefined}
            style={{ position: 'absolute', right: 0, bottom: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 0, padding: 0 }}
            onChange={e => {
              const r = parseDateTime(e.target.value)
              if (r) { const [y, m, d] = r.date.split('-'); commit({ ...parts, y, m, d }) }
            }}
          />
        </>
      )}
    </div>
  )
}

export const DateField = (props: DateFieldProps) => <SegmentedField mode="date" {...props} />
export const DateTimeField = (props: DateFieldProps) => <SegmentedField mode="datetime" {...props} />
export const TimeField = (props: DateFieldProps) => <SegmentedField mode="time" {...props} />
