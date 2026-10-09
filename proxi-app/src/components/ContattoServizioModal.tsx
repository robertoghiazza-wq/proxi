// Collega una persona a un servizio (con ruolo) o modifica/scollega un collegamento

import { nomeAvatar, nomePersona } from '../lib/persona'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { PersonaForm } from '../screens/PersonaFormScreen'
import { usePersone } from '../hooks/usePersone'
import { useSyncContatti, type ContattoServizio } from '../hooks/useServizi'
import type { Persona, Servizio } from '../types'
import { CampoRicerca, ConteggioRisultati } from './CampoRicerca'

type Contatto = NonNullable<Servizio['persone']>[number]

interface Props {
  servizio: Servizio
  modifica?: Contatto
  onClose: () => void
}

export function ContattoServizioModal({ servizio, modifica, onClose }: Props) {
  const sync = useSyncContatti(servizio.id)
  const { data: tutte = [] } = usePersone()
  const esistenti = servizio.persone ?? []

  const [scelta, setScelta] = useState<Pick<Persona, 'id' | 'nome' | 'cognome' | 'soprannome' | 'anonimo'> | null>(modifica ?? null)
  const [ruolo, setRuolo] = useState(modifica?.pivot.ruolo ?? '')
  const [query, setQuery] = useState('')
  const [creando, setCreando] = useState(false)
  const [errore, setErrore] = useState('')

  const righe = (): ContattoServizio[] => esistenti.map(p => ({
    persona_id: p.id, ruolo: p.pivot.ruolo, principale: p.pivot.principale,
  }))

  async function applica(lista: ContattoServizio[]) {
    setErrore('')
    try {
      await sync.mutateAsync(lista)
      onClose()
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  function salva() {
    if (!scelta) return
    const r = ruolo.trim() || null
    if (modifica) {
      applica(righe().map(x => x.persona_id === scelta.id ? { ...x, ruolo: r } : x))
    } else {
      applica([...righe(), { persona_id: scelta.id, ruolo: r, principale: esistenti.length === 0 }])
    }
  }

  function scollega() {
    if (modifica) applica(righe().filter(x => x.persona_id !== modifica.id))
  }

  const q = query.trim().toLowerCase()
  const disponibili = tutte.filter(p => !esistenti.some(e => e.id === p.id))
  const candidate = disponibili
    .filter(p => !q || p.nome?.toLowerCase().includes(q) || p.cognome?.toLowerCase().includes(q) || p.soprannome?.toLowerCase().includes(q))
    .sort((a, b) => Number(b.ruolo === 'rete') - Number(a.ruolo === 'rete'))

  return (
    <Modal open onClose={onClose} width={460}>
      <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={onClose} aria-label="Chiudi" style={ghostBtn}><X size={20} strokeWidth={1.75} /></button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
            {modifica ? 'Collegamento' : 'Collega persona'}
          </div>
          <div style={{ width: 36 }} />
        </div>

        {errore && (
          <div style={{ padding: '8px 16px', fontSize: 13, background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)' }}>{errore}</div>
        )}

        {!scelta ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line2)' }}>
              <CampoRicerca value={query} onChange={setQuery} placeholder="Cerca una persona…" fondo="surface2" compatto autoFocus />
              <ConteggioRisultati mostrati={candidate.length} totali={disponibili.length} singolare="persona" plurale="persone" />
            </div>

            <button onClick={() => setCreando(true)} style={row}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--prox-accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Plus size={15} color="var(--prox-accent)" strokeWidth={2.5} /></div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Nuova persona</div>
                <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>Non è in elenco? Creala ora</div>
              </div>
            </button>

            {candidate.map(p => (
              <button key={p.id} onClick={() => setScelta(p)} style={row}>
                <Avatar nome={nomeAvatar(p)} anonimo={p.anonimo} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{nomePersona(p)}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>
                    {p.ruolo === 'rete' ? 'Rete' : p.ruolo === 'dipendente' ? 'Équipe' : 'Utente'}
                  </div>
                </div>
              </button>
            ))}
            {candidate.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', fontSize: 14, color: 'var(--prox-ink3)' }}>Nessuna persona trovata</div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              background: 'var(--prox-surface)', borderRadius: 14, border: '1px solid var(--prox-line2)',
            }}>
              <Avatar nome={nomeAvatar(scelta)} anonimo={scelta.anonimo} size={40} />
              <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{nomePersona(scelta)}</div>
              {!modifica && (
                <button onClick={() => setScelta(null)} style={{
                  border: 'none', background: 'none', color: 'var(--prox-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Cambia</button>
              )}
            </div>

            <label>
              <div className="prox-label" style={{ marginBottom: 6 }}>Ruolo nel servizio</div>
              <input value={ruolo} onChange={e => setRuolo(e.target.value)} placeholder={`Es. Referente ${servizio.nome.match(/\(([^)]+)\)/)?.[1] ?? ''}`.trim()}
                style={input} autoFocus />
            </label>

            {modifica && (
              <button onClick={scollega} disabled={sync.isPending} style={{
                border: '1.5px solid var(--prox-line)', borderRadius: 999, background: 'transparent',
                color: 'var(--prox-danger)', padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Scollega dal servizio
              </button>
            )}
          </div>
        )}

        {scelta && (
          <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, var(--sab))', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
            <button onClick={salva} disabled={sync.isPending} style={{
              width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
              background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', opacity: sync.isPending ? 0.6 : 1,
            }}>
              {sync.isPending ? 'Salvo…' : modifica ? 'Salva ruolo' : 'Collega'}
            </button>
          </div>
        )}
      </div>

      {creando && (
        <Modal open onClose={() => setCreando(false)}>
          <PersonaForm initialRuolo="rete" onClose={() => setCreando(false)}
            onSaved={p => { setCreando(false); setScelta(p) }} />
        </Modal>
      )}
    </Modal>
  )
}

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', width: '100%',
  background: 'var(--prox-surface)', border: 'none', borderBottom: '1px solid var(--prox-line2)',
  cursor: 'pointer', textAlign: 'left',
}

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
  color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
