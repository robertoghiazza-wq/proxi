// Elenco libero di voci (tag, lingue, bisogni) con suggerimenti

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  suggestions?: string[]
}

export function ChipsInput({ values, onChange, placeholder, suggestions = [] }: Props) {
  const [text, setText] = useState('')

  function add(raw: string) {
    const v = raw.trim()
    if (!v) return
    if (values.some(x => x.toLowerCase() === v.toLowerCase())) { setText(''); return }
    onChange([...values, v])
    setText('')
  }

  function remove(v: string) {
    onChange(values.filter(x => x !== v))
  }

  const q = text.trim().toLowerCase()
  const proposte = suggestions
    .filter(s => !values.some(x => x.toLowerCase() === s.toLowerCase()))
    .filter(s => !q || s.toLowerCase().includes(q))
    .slice(0, 8)

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        padding: '8px 10px', borderRadius: 12,
        border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
      }}>
        {values.map(v => (
          <span key={v} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--prox-accent-soft)', color: 'var(--prox-accent-ink)',
            borderRadius: 999, padding: '3px 6px 3px 10px', fontSize: 13, fontWeight: 500,
          }}>
            {v}
            <button onClick={() => remove(v)} aria-label={`Rimuovi ${v}`} style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex',
              color: 'inherit',
            }}>
              <X size={13} strokeWidth={2.2} />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text) }
            else if (e.key === 'Backspace' && !text && values.length) remove(values[values.length - 1])
          }}
          onBlur={() => add(text)}
          placeholder={values.length ? '' : placeholder}
          style={{
            flex: 1, minWidth: 90, border: 'none', background: 'none', outline: 'none',
            fontSize: 14, color: 'var(--prox-ink)', padding: '4px 2px', fontFamily: 'inherit',
          }}
        />
      </div>

      {proposte.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {proposte.map(s => (
            <button key={s} onClick={() => add(s)} style={{
              border: '1px dashed var(--prox-line)', background: 'transparent', cursor: 'pointer',
              borderRadius: 999, padding: '3px 10px', fontSize: 12.5, color: 'var(--prox-ink2)',
            }}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
