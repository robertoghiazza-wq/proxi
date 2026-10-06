// Conteggio ore di un dipendente: mese con settimane ed elenco delle ore lavorate, totali e report annuale

import { useTipiEvento } from '../hooks/useTipi'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react'
import { Card } from './Card'
import { BarraSalva, campo, etichetta } from './SchedaUi'
import { useOreMese, useOreAnno, useSalvaVoceMese, type OreMese, type PersonaOre, type VoceMese } from '../hooks/useOre'

const h = (n: number) => `${n.toLocaleString('it-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h`
const hs = (n: number) => `${n > 0 ? '+' : ''}${h(n)}`
const colSaldo = (n: number) => (n < 0 ? 'var(--prox-danger)' : n > 0 ? 'var(--prox-ok)' : 'var(--prox-ink)')
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const g = (iso: string) => new Date(iso + 'T00:00:00')
const breve = (iso: string) => g(iso).toLocaleDateString('it-CH', { day: 'numeric', month: 'short' })

export function OreView({ persona, gestore }: { persona: PersonaOre | null; gestore: boolean }) {
  const oggi = new Date()
  const [anno, setAnno] = useState(oggi.getFullYear())
  const [mese, setMese] = useState(oggi.getMonth() + 1)
  const [vista, setVista] = useState<'mese' | 'anno'>('mese')
  const [sett, setSett] = useState<number | null>(null)

  const { data, isLoading, error } = useOreMese(persona, anno, mese)
  const annuo = useOreAnno(persona, anno, vista === 'anno')

  function vai(delta: number) {
    setSett(null)
    if (vista === 'anno') { setAnno(a => a + delta); return }
    const d = new Date(anno, mese - 1 + delta, 1)
    setAnno(d.getFullYear())
    setMese(d.getMonth() + 1)
  }

  const titolo = vista === 'anno' ? String(anno) : `${MESI[mese - 1]} ${anno}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => vai(-1)} aria-label="Precedente" style={freccia}><ChevronLeft size={18} strokeWidth={2} /></button>
        <div className="prox-display" style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', minWidth: 130, textAlign: 'center' }}>{titolo}</div>
        <button onClick={() => vai(1)} aria-label="Successivo" style={freccia}><ChevronRight size={18} strokeWidth={2} /></button>
        <div style={{ flex: 1 }} />
        <div role="tablist" style={{ display: 'flex', gap: 14 }}>
          {(['mese', 'anno'] as const).map(v => (
            <button key={v} role="tab" aria-selected={vista === v} onClick={() => { setVista(v); setSett(null) }} style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: 14, fontFamily: 'inherit',
              fontWeight: vista === v ? 700 : 500, color: vista === v ? 'var(--prox-ink)' : 'var(--prox-ink3)',
            }}>{v === 'mese' ? 'Mese' : 'Report annuale'}</button>
          ))}
        </div>
      </div>

      {error && <Card padding="14px 16px"><p style={{ margin: 0, fontSize: 13, color: 'var(--prox-danger)' }}>{(error as Error).message}</p></Card>}
      {isLoading && !data && <Card padding="14px 16px"><p style={{ margin: 0, fontSize: 13, color: 'var(--prox-ink3)' }}>Caricamento…</p></Card>}

      {data?.contratto_mancante && (
        <div style={{ background: 'oklch(0.95 0.06 85)', color: 'oklch(0.40 0.11 70)', borderRadius: 12, padding: '10px 14px', fontSize: 13.5 }}>
          Manca un contratto valido per questo periodo: le ore dovute non sono calcolabili.
        </div>
      )}

      {vista === 'mese' && data && <Mese data={data} sett={sett} setSett={setSett} persona={persona} gestore={gestore} />}

      {vista === 'anno' && (
        annuo.data ? (
          <Card padding="14px 16px">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 460 }}>
                <thead>
                  <tr style={{ color: 'var(--prox-ink3)', textAlign: 'right' }}>
                    {['Mese', 'Dovute', 'Lavorate', 'Vac./festivi', 'Corr.', 'Saldo'].map((t, i) => (
                      <th key={t} style={{ fontWeight: 500, padding: '4px 6px', textAlign: i === 0 ? 'left' : 'right' }}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {annuo.data.mesi.map(m => (
                    <tr key={m.mese} onClick={() => { setVista('mese'); setMese(m.mese); setSett(null) }} style={{ cursor: 'pointer', borderTop: '1px solid var(--prox-line2)' }}>
                      <td style={{ padding: '8px 6px', textTransform: 'capitalize' }}>{MESI[m.mese - 1]}</td>
                      <td style={cella}>{m.totali.dovute.toFixed(2)}</td>
                      <td style={cella}>{m.totali.lavorate.toFixed(2)}</td>
                      <td style={cella}>{(m.totali.vacanze_ore + m.totali.festivi_ore).toFixed(2)}</td>
                      <td style={cella}>{m.totali.correzione ? m.totali.correzione.toFixed(2) : '—'}</td>
                      <td style={{ ...cella, fontWeight: 600, color: colSaldo(m.totali.saldo) }}>{m.totali.saldo.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--prox-line)', fontWeight: 700 }}>
                    <td style={{ padding: '10px 6px' }}>Anno {annuo.data.anno}</td>
                    <td style={cella}>{annuo.data.mesi.reduce((s, m) => s + m.totali.dovute, 0).toFixed(2)}</td>
                    <td style={cella}>{annuo.data.mesi.reduce((s, m) => s + m.totali.lavorate, 0).toFixed(2)}</td>
                    <td style={cella}>{annuo.data.mesi.reduce((s, m) => s + m.totali.vacanze_ore + m.totali.festivi_ore, 0).toFixed(2)}</td>
                    <td style={cella}>{annuo.data.mesi.reduce((s, m) => s + m.totali.correzione, 0).toFixed(2)}</td>
                    <td style={{ ...cella, color: colSaldo(annuo.data.saldo_annuo) }}>{annuo.data.saldo_annuo.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p style={{ fontSize: 12, color: 'var(--prox-ink3)', margin: '10px 0 0' }}>Valori in ore. Tocca un mese per vederne il dettaglio.</p>
          </Card>
        ) : annuo.isLoading ? <Card padding="14px 16px"><p style={{ margin: 0, fontSize: 13, color: 'var(--prox-ink3)' }}>Caricamento…</p></Card> : null
      )}
    </div>
  )
}

function Mese({ data, sett, setSett, persona, gestore }: {
  data: OreMese; sett: number | null; setSett: (n: number | null) => void; persona: PersonaOre | null; gestore: boolean
}) {
  const { label: tipoLabel, colore: colorForTipo } = useTipiEvento()
  const salva = useSalvaVoceMese(persona)
  const [modifica, setModifica] = useState(false)
  const [bozza, setBozza] = useState<VoceMese>(data.voce)
  const [errore, setErrore] = useState('')

  const mostrate = sett === null ? data.settimane : data.settimane.filter(s => s.iso === sett)
  const eventi = mostrate.flatMap(s => s.eventi)
  const perGiorno = eventi.reduce<Record<string, typeof eventi>>((acc, e) => { (acc[e.data] ??= []).push(e); return acc }, {})
  const totSel = mostrate.reduce((s, x) => s + x.ore_lavorate, 0)
  const t = data.totali

  const num = (v: string) => (v.trim() === '' ? 0 : Number(v.replace(',', '.')))

  async function conferma() {
    setErrore('')
    try {
      await salva.mutateAsync({ anno: data.anno, mese: data.mese, ...bozza })
      setModifica(false)
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        <Chip attiva={sett === null} onClick={() => setSett(null)} testo="Tutto il mese" sotto={h(data.settimane.reduce((s, x) => s + x.ore_lavorate, 0))} />
        {data.settimane.map(s => (
          <Chip key={s.iso} attiva={sett === s.iso} onClick={() => setSett(s.iso)} testo={`${breve(s.dal)} – ${breve(s.al)}`} sotto={`${h(s.ore_lavorate)} / ${h(s.ore_dovute)}`} />
        ))}
      </div>

      <Card padding="14px 16px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span className="prox-label">Ore lavorate</span>
          <span style={{ fontSize: 13, color: 'var(--prox-ink3)' }}>{h(totSel)}</span>
        </div>
        {eventi.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--prox-ink3)' }}>Nessun evento svolto in questo periodo.</p>
        ) : (
          Object.entries(perGiorno).map(([giorno, es], i) => (
            <div key={giorno} style={{ paddingTop: i ? 10 : 0, marginTop: i ? 10 : 0, borderTop: i ? '1px solid var(--prox-line2)' : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--prox-ink2)', textTransform: 'capitalize', marginBottom: 4 }}>
                {g(giorno).toLocaleDateString('it-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {es.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  <span style={{ width: 4, height: 28, borderRadius: 2, background: colorForTipo(e.tipo), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{tipoLabel(e.tipo)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>{[e.ora_inizio, e.luogo].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{h(e.durata_min / 60)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </Card>

      <Card padding="14px 16px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="prox-label">Totali del mese</span>
          {gestore && !modifica && (
            <button onClick={() => { setBozza(data.voce); setErrore(''); setModifica(true) }} style={{
              display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: 'var(--prox-accent)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}><Edit size={14} strokeWidth={2} /> Vacanze e correzioni</button>
          )}
        </div>

        {modifica ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <label><div style={etichetta}>Vacanze (giorni)</div>
                <input inputMode="decimal" value={bozza.vacanze_giorni || ''} onChange={e => setBozza(b => ({ ...b, vacanze_giorni: num(e.target.value) }))} placeholder="0" style={campo} /></label>
              <label><div style={etichetta}>Festivi (giorni)</div>
                <input inputMode="decimal" value={bozza.festivi_giorni || ''} onChange={e => setBozza(b => ({ ...b, festivi_giorni: num(e.target.value) }))} placeholder="0" style={campo} /></label>
              <label><div style={etichetta}>Correzione (ore, ±)</div>
                <input inputMode="decimal" value={bozza.correzione_ore || ''} onChange={e => setBozza(b => ({ ...b, correzione_ore: num(e.target.value) }))} placeholder="0" style={campo} /></label>
            </div>
            <label><div style={etichetta}>Nota</div>
              <input value={bozza.nota ?? ''} onChange={e => setBozza(b => ({ ...b, nota: e.target.value || null }))} placeholder="Motivo della correzione" style={campo} /></label>
            <p style={{ fontSize: 12, color: 'var(--prox-ink3)', margin: 0 }}>
              Ogni giorno vale {h(data.ore_giornaliere)} (ore settimanali ÷ 5). Le correzioni sono registrate nel log.
            </p>
            <BarraSalva errore={errore} caricamento={salva.isPending} onSalva={conferma} onAnnulla={() => setModifica(false)} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px 16px' }}>
            <Totale l="Ore dovute" v={h(t.dovute)} />
            <Totale l="Ore lavorate" v={h(t.lavorate)} />
            <Totale l="Vacanze" v={`${data.voce.vacanze_giorni.toLocaleString('it-CH')} gg`} sotto={t.vacanze_ore ? h(t.vacanze_ore) : undefined} />
            <Totale l="Festivi" v={`${data.voce.festivi_giorni.toLocaleString('it-CH')} gg`} sotto={t.festivi_ore ? h(t.festivi_ore) : undefined} />
            <Totale l="Correzione" v={t.correzione ? hs(t.correzione) : '—'} sotto={data.voce.nota ?? undefined} />
            <Totale l="Saldo" v={hs(t.saldo)} colore={colSaldo(t.saldo)} grande />
          </div>
        )}
      </Card>
    </>
  )
}

function Chip({ attiva, onClick, testo, sotto }: { attiva: boolean; onClick: () => void; testo: string; sotto: string }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, textAlign: 'left', border: `1.5px solid ${attiva ? 'var(--prox-accent)' : 'var(--prox-line)'}`, borderRadius: 12,
      padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
      background: attiva ? 'var(--prox-accent-soft)' : 'var(--prox-surface)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: attiva ? 'var(--prox-accent-ink)' : 'var(--prox-ink)', whiteSpace: 'nowrap' }}>{testo}</div>
      <div style={{ fontSize: 11, color: 'var(--prox-ink3)', whiteSpace: 'nowrap' }}>{sotto}</div>
    </button>
  )
}

function Totale({ l, v, sotto, colore, grande }: { l: string; v: string; sotto?: string; colore?: string; grande?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', fontWeight: 500 }}>{l}</div>
      <div style={{ fontSize: grande ? 20 : 16, fontWeight: 700, color: colore ?? 'var(--prox-ink)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      {sotto && <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>{sotto}</div>}
    </div>
  )
}

const freccia: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10, border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--prox-ink2)',
}
const cella: React.CSSProperties = { padding: '8px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
