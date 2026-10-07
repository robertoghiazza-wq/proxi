// Scelte di riservatezza per un report: come mostrare i nomi e se includere il racconto

import type { ModoNomi, OpzioniReport as Opz } from '../hooks/useReport'
import { etichetta } from './SchedaUi'

const MODI: { k: ModoNomi; l: string }[] = [{ k: 'completi', l: 'Completi' }, { k: 'iniziali', l: 'Iniziali' }, { k: 'nessuno', l: 'Nessuno' }]

export function OpzioniReport({ valore, onChange }: { valore: Opz; onChange: (o: Opz) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="prox-label">Nomi</span>
        <div role="radiogroup" style={{ display: 'flex', background: 'var(--prox-surface)', border: '1px solid var(--prox-line)', borderRadius: 999, padding: 2 }}>
          {MODI.map(m => {
            const a = valore.nomi === m.k
            return (
              <button key={m.k} role="radio" aria-checked={a} onClick={() => onChange({ ...valore, nomi: m.k })} style={{
                padding: '4px 12px', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                background: a ? 'var(--prox-accent)' : 'transparent', color: a ? '#fff' : 'var(--prox-ink2)',
              }}>{m.l}</button>
            )
          })}
        </div>
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--prox-ink2)', cursor: 'pointer' }}>
        <input type="checkbox" checked={valore.racconto} onChange={e => onChange({ ...valore, racconto: e.target.checked })} style={{ accentColor: 'var(--prox-accent)', width: 16, height: 16 }} />
        Includi il racconto
      </label>
      {valore.nomi !== 'completi' && valore.racconto && (
        <div style={{ ...etichetta, flexBasis: '100%', margin: 0 }}>Il racconto non viene modificato: se cita dei nomi, compaiono. Per inviare solo i dati, togli il racconto.</div>
      )}
    </div>
  )
}
