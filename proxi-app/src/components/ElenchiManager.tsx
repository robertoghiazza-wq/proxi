// Elenchi a tendina (situazione familiare, origine, sostanze…) — modifica solo per coordinatori e admin

import { useState } from 'react'
import { X, Trash2, Check } from 'lucide-react'
import { Modal } from './Modal'
import { useVocaboli, useSalvaVocabolo, useEliminaVocabolo } from '../hooks/useSchedaUtente'
import { getCurrentUser } from '../lib/api-client'

export function ElenchiManager({ onClose }: { onClose: () => void }) {
  const { data } = useVocaboli()
  const salva = useSalvaVocabolo()
  const elimina = useEliminaVocabolo()
  const puoModificare = ['coordinatore', 'admin'].includes(getCurrentUser()?.role ?? '')

  const categorie = Object.entries(data?.categorie ?? {})
  const [scelta, setScelta] = useState<string | null>(null)
  const categoria = scelta ?? categorie[0]?.[0] ?? ''
  const voci = (data?.voci ?? []).filter(v => v.categoria === categoria)

  const [nuova, setNuova] = useState('')
  const [inModifica, setInModifica] = useState<{ id: number; valore: string } | null>(null)
  const [errore, setErrore] = useState('')

  async function esegui(f: () => Promise<unknown>) {
    setErrore('')
    try { await f() } catch (e) { setErrore((e as Error).message || 'Errore') }
  }

  return (
    <Modal open onClose={onClose} width={520}>
      <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={onClose} aria-label="Chiudi" style={ghost}><X size={20} strokeWidth={1.75} /></button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Elenchi</div>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line2)' }}>
          {categorie.map(([key, label]) => (
            <button key={key} onClick={() => { setScelta(key); setInModifica(null); setErrore('') }} style={{
              padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              fontSize: 13, fontWeight: 600,
              background: key === categoria ? 'var(--prox-accent)' : 'var(--prox-surface2)',
              color: key === categoria ? '#fff' : 'var(--prox-ink2)',
            }}>{label}</button>
          ))}
        </div>

        {errore && <div style={{ padding: '8px 16px', fontSize: 13, background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)' }}>{errore}</div>}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {puoModificare ? (
            <form
              onSubmit={e => {
                e.preventDefault()
                if (!nuova.trim()) return
                esegui(async () => { await salva.mutateAsync({ categoria, valore: nuova.trim() }); setNuova('') })
              }}
              style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line2)' }}
            >
              <input value={nuova} onChange={e => setNuova(e.target.value)} placeholder="Nuova voce…" style={input} />
              <button type="submit" disabled={!nuova.trim() || salva.isPending} style={{
                padding: '0 18px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--prox-accent)',
                color: '#fff', fontSize: 14, fontWeight: 600, opacity: nuova.trim() ? 1 : 0.5,
              }}>Aggiungi</button>
            </form>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--prox-ink3)', padding: '12px 16px', margin: 0 }}>
              Solo coordinatori e admin possono modificare gli elenchi.
            </p>
          )}

          {voci.map(v => (
            <div key={v.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line2)',
            }}>
              {inModifica?.id === v.id ? (
                <>
                  <input value={inModifica.valore} onChange={e => setInModifica({ id: v.id, valore: e.target.value })} style={{ ...input, padding: '7px 10px' }} autoFocus />
                  <button aria-label="Conferma" onClick={() => esegui(async () => { await salva.mutateAsync({ id: v.id, valore: inModifica.valore.trim() }); setInModifica(null) })} style={ghost}>
                    <Check size={18} strokeWidth={2.2} color="var(--prox-ok)" />
                  </button>
                  <button aria-label="Annulla" onClick={() => setInModifica(null)} style={ghost}><X size={18} strokeWidth={1.75} /></button>
                </>
              ) : (
                <>
                  <button disabled={!puoModificare} onClick={() => setInModifica({ id: v.id, valore: v.valore })} style={{
                    flex: 1, textAlign: 'left', border: 'none', background: 'none', fontSize: 14, color: 'var(--prox-ink)',
                    padding: '6px 0', cursor: puoModificare ? 'pointer' : 'default', fontFamily: 'inherit',
                  }}>{v.valore}</button>
                  {puoModificare && (
                    <button aria-label={`Elimina ${v.valore}`} onClick={() => esegui(() => elimina.mutateAsync(v.id))} style={{ ...ghost, color: 'var(--prox-danger)' }}>
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          {voci.length === 0 && <p style={{ padding: 28, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Nessuna voce</p>}
          <p style={{ fontSize: 12, color: 'var(--prox-ink3)', padding: '12px 16px' }}>
            Se rinomini o elimini una voce, le schede che la usavano la conservano com’è scritta.
          </p>
        </div>
      </div>
    </Modal>
  )
}

const input: React.CSSProperties = {
  flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}

const ghost: React.CSSProperties = {
  width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
  color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
