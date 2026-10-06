// Modifica evento — pagina unica con tutti i campi

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { StepTipo, StepQuando, DURATE, type WizardState, type SetFn } from './NuovoEventoScreen'
import { LuogoPicker } from '../components/LuogoPicker'
import { BarraTab } from '../components/SchedaUi'
import { PersonePicker } from '../components/PersonePicker'
import { useEvento, useUpdateEvento } from '../hooks/useEventi'
import type { Evento, StatoEvento } from '../types'

const STATI: { key: StatoEvento; label: string }[] = [
  { key: 'completato',  label: 'Svolto'      },
  { key: 'in_corso',    label: 'In corso'    },
  { key: 'pianificato', label: 'Pianificato' },
]

export function EventoEditScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: evento, isLoading } = useEvento(Number(id))

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }
  if (!evento) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Evento non trovato
        <br />
        <button onClick={() => navigate('/eventi')} style={{ marginTop: 12, cursor: 'pointer' }}>← Torna agli eventi</button>
      </div>
    )
  }
  return <EventoForm evento={evento} />
}

function EventoForm({ evento }: { evento: Evento }) {
  const navigate = useNavigate()
  const update = useUpdateEvento(evento.id)
  const chiudi = () => navigate(`/eventi/${evento.id}`)

  const [form, setForm] = useState<WizardState>({
    tipo:       evento.tipo,
    data:       evento.data.slice(0, 10),
    oraInizio:  evento.ora_inizio?.slice(0, 5) ?? '',
    durata:     evento.durata_min,
    soste:      [],
    personeIds: (evento.persone ?? []).map(p => p.id),
    note:       evento.note ?? '',
    savedId:    evento.id,
  })
  const [luogoId, setLuogoId] = useState<number | null>(evento.luogo_id)
  const [stato, setStato] = useState<StatoEvento>(evento.stato)
  const [errore, setErrore] = useState('')
  const [tab, setTab] = useState<'tipo' | 'quando' | 'luogo' | 'persone' | 'note'>('tipo')

  const set: SetFn = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function togglePersona(pid: number) {
    set('personeIds', form.personeIds.includes(pid)
      ? form.personeIds.filter(x => x !== pid)
      : [...form.personeIds, pid])
  }

  async function salva() {
    if (!form.tipo) { setErrore('Scegli il tipo di evento'); return }
    if (!form.data) { setErrore('La data è obbligatoria'); return }
    if (luogoId === null) { setErrore('Il luogo è obbligatorio'); return }
    setErrore('')
    try {
      await update.mutateAsync({
        tipo:        form.tipo,
        data:        form.data,
        ora_inizio:  form.oraInizio || null,
        durata_min:  form.durata,
        luogo_id:    luogoId,
        stato,
        note:        form.note.trim() || null,
        persone_ids: form.personeIds,
      } as Partial<Evento> & { persone_ids: number[] })
      chiudi()
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
      <div style={{
        background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={chiudi} aria-label="Chiudi" style={{
          width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
          color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={20} strokeWidth={1.75} />
        </button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
          Modifica evento
        </div>
        <div style={{ width: 36 }} />
      </div>

      <BarraTab
        tabs={[
          { key: 'tipo', label: 'Tipo' },
          { key: 'quando', label: 'Quando' },
          { key: 'luogo', label: 'Luogo', avviso: luogoId === null },
          { key: 'persone', label: 'Persone', avviso: form.personeIds.length === 0 },
          { key: 'note', label: 'Note', avviso: form.note.trim() === '' },
        ]}
        attiva={tab}
        onScegli={setTab}
      />

      {errore && (
        <div style={{
          padding: '8px 16px', fontSize: 13, fontWeight: 500,
          background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)',
          borderBottom: '1px solid var(--prox-line)',
        }}>{errore}</div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'tipo' && <StepTipo form={form} set={set} />}

        {tab === 'quando' && (
          <>
            <StepQuando form={form} set={set} allowFuture />
            {!DURATE.includes(form.durata) && (
              <p style={{ fontSize: 12.5, color: 'var(--prox-ink3)', margin: '-8px 16px 16px' }}>
                Durata attuale: {form.durata} min — scegline una per cambiarla.
              </p>
            )}
            <div style={{ padding: '0 16px 24px' }}>
              <div className="prox-label" style={{ marginBottom: 8 }}>Stato</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {STATI.map(({ key, label }) => {
                  const active = stato === key
                  return (
                    <button key={key} onClick={() => setStato(key)} style={{
                      padding: '9px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--prox-accent)' : 'var(--prox-line)'}`,
                      background: active ? 'var(--prox-accent)' : 'var(--prox-surface)',
                      color: active ? '#fff' : 'var(--prox-ink2)',
                    }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'luogo' && <LuogoPicker value={luogoId} onChange={setLuogoId} />}

        {tab === 'persone' && <PersonePicker selectedIds={form.personeIds} onToggle={togglePersona} />}

        {tab === 'note' && (
          <div style={{ padding: '16px 16px 24px' }}>
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={8}
              placeholder="Osservazioni, contesto, bisogni emersi, follow-up…"
              style={{
                width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--prox-line)',
                borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'var(--prox-ink)',
                background: 'var(--prox-surface)', resize: 'vertical', outline: 'none',
                fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: 12.5, color: 'var(--prox-ink3)', margin: '8px 0 0' }}>
              Le note non sono obbligatorie, ma senza note l’evento resta “da completare”.
            </p>
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 16px', paddingBottom: 'max(12px, var(--sab))',
        background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)',
      }}>
        <button onClick={salva} disabled={update.isPending} style={{
          width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
          background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', opacity: update.isPending ? 0.6 : 1,
        }}>
          {update.isPending ? 'Salvo…' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}
