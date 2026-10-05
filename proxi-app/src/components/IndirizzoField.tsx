// Indirizzo svizzero con completamento: via → NPA, località, Comune politico e Cantone compilati in automatico

import { useEffect, useRef, useState } from 'react'
import {
  CANTONI, cercaComune, cercaLocalita, cercaNpa, cercaVia, comuneDaNpaLocalita, eSvizzera, rifinisciComune,
  type Indirizzo,
} from '../lib/geo'

interface Props {
  value: Indirizzo
  onChange: (patch: Partial<Indirizzo>) => void
  onPosizione?: (lat: number, lng: number) => void
  senzaPaese?: boolean
}

interface Voce { chiave: string; titolo: string; sotto?: string; applica: () => void }

export function IndirizzoField({ value, onChange, onPosizione, senzaPaese }: Props) {
  const ch = eSvizzera(value.paese)
  const manca = ch && !value.comune_politico && !!(value.indirizzo.trim() || value.npa.trim() || value.localita.trim())

  async function dopoScelta(patch: Partial<Indirizzo>, rifinisci?: { npa: string; localita: string; bfs: string }) {
    onChange({ ...patch, paese: 'Svizzera' })
    if (rifinisci) {
      const c = await rifinisciComune(rifinisci)
      if (c) onChange({ comune_politico: c.nome, bfs: c.bfs, cantone: c.cantone })
    }
  }

  async function risolviManuale() {
    if (!ch || value.comune_politico) return
    const c = await comuneDaNpaLocalita(value.npa, value.localita)
    if (c) onChange({ comune_politico: c.nome, bfs: c.bfs, cantone: c.cantone })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Campo label="Via e numero">
        <Auto
          value={value.indirizzo}
          placeholder="Es. Via Ferri 1"
          attivo={ch}
          cerca={(q, s) => cercaVia(q, s).then(rs => rs.map<Voce>(r => ({
            chiave: `${r.label}|${r.lat}`,
            titolo: r.label,
            sotto: r.comune ? `Comune politico: ${r.comune}${r.cantone ? ` (${r.cantone})` : ''}` : undefined,
            applica: () => {
              dopoScelta(
                { indirizzo: r.via, npa: r.npa, localita: r.localita, comune_politico: r.comune, bfs: r.bfs, cantone: r.cantone },
                r.bfs ? { npa: r.npa, localita: r.localita, bfs: r.bfs } : undefined,
              )
              onPosizione?.(r.lat, r.lng)
            },
          })))}
          onText={t => onChange({ indirizzo: t })}
          minimo={4}
        />
      </Campo>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 104 }}>
          <Campo label="NPA">
            <Auto
              value={value.npa}
              placeholder="6900"
              attivo={ch}
              inputMode="numeric"
              cerca={(q, s) => cercaNpa(q, s).then(rs => rs.map<Voce>(l => ({
                chiave: `${l.npa}|${l.localita}|${l.bfs}`,
                titolo: `${l.npa} ${l.localita}`,
                sotto: `${l.comune} (${l.cantone})`,
                applica: () => dopoScelta({ npa: l.npa, localita: l.localita, comune_politico: l.comune, bfs: l.bfs, cantone: l.cantone }),
              })))}
              onText={t => onChange({ npa: t.replace(/\D/g, '').slice(0, 4) })}
              onBlur={risolviManuale}
              minimo={2}
            />
          </Campo>
        </div>
        <div style={{ flex: 1 }}>
          <Campo label="Località">
            <Auto
              value={value.localita}
              placeholder="Lugano"
              attivo={ch}
              cerca={(q, s) => cercaLocalita(q, s).then(rs => rs.map<Voce>(l => ({
                chiave: `${l.npa}|${l.localita}|${l.bfs}`,
                titolo: `${l.localita} · ${l.npa}`,
                sotto: `${l.comune} (${l.cantone})`,
                applica: () => dopoScelta({ npa: l.npa, localita: l.localita, comune_politico: l.comune, bfs: l.bfs, cantone: l.cantone }),
              })))}
              onText={t => onChange({ localita: t })}
              onBlur={risolviManuale}
              minimo={2}
            />
          </Campo>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Campo label={ch ? 'Comune politico *' : 'Comune politico'}>
            <Auto
              value={value.comune_politico}
              placeholder="Si compila da solo"
              attivo={ch}
              cerca={(q, s) => cercaComune(q, s).then(rs => rs.map<Voce>(c => ({
                chiave: c.bfs,
                titolo: c.nome,
                sotto: c.cantone,
                applica: () => onChange({ comune_politico: c.nome, bfs: c.bfs, cantone: c.cantone }),
              })))}
              onText={t => onChange({ comune_politico: t, bfs: '' })}
              minimo={2}
              avviso={manca}
            />
          </Campo>
        </div>
        <div style={{ width: 92 }}>
          <Campo label={ch ? 'Cantone *' : 'Cantone'}>
            <select
              value={value.cantone}
              onChange={e => onChange({ cantone: e.target.value })}
              style={{ ...stileInput, borderColor: manca && !value.cantone ? AMBRA : undefined, appearance: 'auto' }}
            >
              <option value="">—</option>
              {CANTONI.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
        </div>
      </div>

      {manca && (
        <div style={{ fontSize: 12, color: 'oklch(0.50 0.13 70)', background: 'oklch(0.95 0.06 85)', borderRadius: 10, padding: '6px 10px' }}>
          Comune politico e Cantone mancano: scegli un indirizzo dall’elenco o cerca il comune.
        </div>
      )}
      {ch && value.comune_politico && value.bfs && (
        <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>
          Comune politico: {value.comune_politico} · n. UST {value.bfs}{value.cantone ? ` · ${value.cantone}` : ''}
        </div>
      )}

      {!senzaPaese && (
        <Campo label="Paese">
          <input
            value={value.paese}
            onChange={e => onChange({ paese: e.target.value })}
            style={stileInput}
          />
        </Campo>
      )}
    </div>
  )
}

const AMBRA = 'oklch(0.72 0.14 80)'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="prox-label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function Auto({ value, onText, cerca, placeholder, attivo, inputMode, onBlur, minimo, avviso }: {
  value: string
  onText: (t: string) => void
  cerca: (q: string, signal: AbortSignal) => Promise<Voce[]>
  placeholder?: string
  attivo: boolean
  inputMode?: 'numeric'
  onBlur?: () => void
  minimo: number
  avviso?: boolean
}) {
  const [voci, setVoci] = useState<Voce[]>([])
  const [aperto, setAperto] = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const attivoRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!attivoRef.current || !attivo || value.trim().length < minimo) { setVoci([]); return }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setCaricamento(true)
      try {
        const r = await cerca(value.trim(), ac.signal)
        if (!ac.signal.aborted) { setVoci(r); setAperto(true) }
      } finally {
        if (!ac.signal.aborted) setCaricamento(false)
      }
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, attivo])

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        onChange={e => { attivoRef.current = true; onText(e.target.value) }}
        onFocus={() => voci.length && setAperto(true)}
        onBlur={() => { setAperto(false); attivoRef.current = false; onBlur?.() }}
        style={{ ...stileInput, borderColor: avviso ? AMBRA : undefined }}
      />
      {caricamento && <span style={{ position: 'absolute', right: 10, top: 11, fontSize: 11, color: 'var(--prox-ink3)' }}>…</span>}
      {aperto && voci.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 700,
          background: 'var(--prox-surface)', border: '1px solid var(--prox-line)', borderRadius: 12,
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200,
        }}>
          {voci.map((v, i) => (
            <button
              key={v.chiave + i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { attivoRef.current = false; abortRef.current?.abort(); v.applica(); setAperto(false); setVoci([]) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none',
                background: 'none', cursor: 'pointer', borderTop: i ? '1px solid var(--prox-line2)' : 'none',
              }}
            >
              <div style={{ fontSize: 13.5, color: 'var(--prox-ink)' }}>{v.titolo}</div>
              {v.sotto && <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>{v.sotto}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const stileInput: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}
