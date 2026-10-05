// Elenco dei ruoli (maschile/femminile) dell'ente — modifica solo per coordinatori e admin

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'
import { useRuoli, useCreateRuolo, useUpdateRuolo, useDeleteRuolo } from '../hooks/useRuoli'
import { getCurrentUser } from '../lib/api-client'
import type { Ruolo } from '../types'

export function RuoliManager({ onClose }: { onClose: () => void }) {
  const { data: ruoli = [], isLoading } = useRuoli()
  const puoModificare = ['coordinatore', 'admin'].includes(getCurrentUser()?.role ?? '')
  const [modifica, setModifica] = useState<Ruolo | 'nuovo' | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visibili = ruoli.filter(r => !q || r.nome_m.toLowerCase().includes(q) || r.nome_f?.toLowerCase().includes(q))

  return (
    <Modal open onClose={onClose} width={520}>
      <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={onClose} aria-label="Chiudi" style={ghost}><X size={20} strokeWidth={1.75} /></button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Ruoli</div>
          {puoModificare
            ? <button onClick={() => setModifica('nuovo')} aria-label="Nuovo ruolo" style={ghost}><Plus size={20} strokeWidth={2} /></button>
            : <div style={{ width: 36 }} />}
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line2)' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca un ruolo…" style={input} />
          <p style={{ fontSize: 12, color: 'var(--prox-ink3)', margin: '8px 0 0' }}>
            Il ruolo di una persona e quello predefinito negli eventi. La forma segue il sesso della persona;
            se non è indicato si usa la forma mista (es. Educatore/trice).
            {!puoModificare && ' Solo coordinatori e admin possono modificare l’elenco.'}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading && <div style={{ padding: 28, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>}
          {visibili.map(r => (
            <button key={r.id} disabled={!puoModificare} onClick={() => setModifica(r)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none',
              borderBottom: '1px solid var(--prox-line2)', background: 'var(--prox-surface)',
              cursor: puoModificare ? 'pointer' : 'default',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.nome_m}</div>
              <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 1 }}>
                {r.nome_f ? `${r.nome_f}  ·  ${r.nome_misto ?? `${r.nome_m} / ${r.nome_f}`}` : 'Invariabile'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {modifica && <RuoloForm ruolo={modifica === 'nuovo' ? undefined : modifica} onClose={() => setModifica(null)} />}
    </Modal>
  )
}

function RuoloForm({ ruolo, onClose }: { ruolo?: Ruolo; onClose: () => void }) {
  const create = useCreateRuolo()
  const update = useUpdateRuolo()
  const elimina = useDeleteRuolo()
  const [m, setM] = useState(ruolo?.nome_m ?? '')
  const [f, setF] = useState(ruolo?.nome_f ?? '')
  const [misto, setMisto] = useState(ruolo?.nome_misto ?? '')
  const [errore, setErrore] = useState('')
  const [conferma, setConferma] = useState(false)
  const lavora = create.isPending || update.isPending

  async function salva() {
    if (!m.trim()) { setErrore('Il nome al maschile è obbligatorio'); return }
    setErrore('')
    const dati = { nome_m: m.trim(), nome_f: f.trim() || null, nome_misto: f.trim() ? (misto.trim() || null) : null }
    try {
      if (ruolo) await update.mutateAsync({ id: ruolo.id, ...dati })
      else await create.mutateAsync(dati)
      onClose()
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <Modal open onClose={onClose} width={440}>
      <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={onClose} aria-label="Chiudi" style={ghost}><X size={20} strokeWidth={1.75} /></button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
            {ruolo ? 'Modifica ruolo' : 'Nuovo ruolo'}
          </div>
          <div style={{ width: 36 }} />
        </div>
        {errore && <div style={{ padding: '8px 16px', fontSize: 13, background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)' }}>{errore}</div>}

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Campo label="Maschile *"><input value={m} onChange={e => setM(e.target.value)} placeholder="Educatore" style={input} autoFocus /></Campo>
          <Campo label="Femminile">
            <input value={f} onChange={e => setF(e.target.value)} placeholder="Educatrice (vuoto se invariabile)" style={input} />
          </Campo>
          {f.trim() && (
            <Campo label="Forma mista (sesso non indicato)">
              <input value={misto} onChange={e => setMisto(e.target.value)} placeholder="Educatore/trice" style={input} />
            </Campo>
          )}
          {ruolo && (
            <button onClick={() => setConferma(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1.5px solid var(--prox-line)',
              borderRadius: 999, background: 'transparent', color: 'var(--prox-danger)', padding: '11px 0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              <Trash2 size={16} strokeWidth={1.75} /> Elimina ruolo
            </button>
          )}
        </div>

        <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, var(--sab))', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
          <button onClick={salva} disabled={lavora} style={{
            width: '100%', padding: '13px 0', borderRadius: 999, border: 'none', background: 'var(--prox-accent)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: lavora ? 0.6 : 1,
          }}>
            {lavora ? 'Salvo…' : 'Salva'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={conferma}
        danger
        title="Eliminare il ruolo?"
        message="Le persone che lo avevano restano, ma senza ruolo."
        confirmLabel="Elimina"
        loading={elimina.isPending}
        error={elimina.isError ? (elimina.error as Error).message : null}
        onCancel={() => { setConferma(false); elimina.reset() }}
        onConfirm={() => ruolo && elimina.mutate(ruolo.id, { onSuccess: onClose })}
      />
    </Modal>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="prox-label" style={{ marginBottom: 6 }}>{label}</div>{children}</div>
}

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}

const ghost: React.CSSProperties = {
  width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
  color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
