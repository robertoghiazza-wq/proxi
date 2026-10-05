// Selezione multipla di persone con creazione al volo

import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Avatar } from './Avatar'
import { Modal } from './Modal'
import { usePersone, useCreatePersona } from '../hooks/usePersone'
import type { Persona } from '../types'

interface Props {
  selectedIds: number[]
  onToggle: (id: number) => void
  sticky?: boolean
}

export function PersonePicker({ selectedIds, onToggle, sticky }: Props) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const { data: persone = [], isLoading, isError } = usePersone()

  const q = query.trim().toLowerCase()
  const filtrate = persone
    .filter(p => p.ruolo === 'utente')
    .filter(p => !q
      || p.nome?.toLowerCase().includes(q)
      || p.soprannome?.toLowerCase().includes(q)
      || p.tag?.some(t => t.toLowerCase().includes(q)))

  const nSel = selectedIds.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 16px', background: 'var(--prox-surface)',
        borderBottom: '1px solid var(--prox-line2)',
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 5 } : {}),
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--prox-surface2)', borderRadius: 12,
          padding: '9px 12px', border: '1px solid var(--prox-line)',
        }}>
          <Search size={15} color="var(--prox-ink3)" strokeWidth={1.75} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca nome, soprannome, tag…"
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', fontSize: 14, color: 'var(--prox-ink)', outline: 'none' }}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Cancella ricerca" style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--prox-ink3)', padding: 0, display: 'flex',
            }}>
              <X size={15} />
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--prox-ink3)', margin: '8px 0 0' }}>
          {nSel === 0
            ? 'Opzionale — puoi saltare questo step'
            : `${nSel} person${nSel === 1 ? 'a selezionata' : 'e selezionate'}`}
        </p>
      </div>

      <button onClick={() => setCreating(true)} style={rowBtn}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'var(--prox-accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus size={15} color="var(--prox-accent)" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Nuova persona</div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>
            {q ? `Crea “${query.trim()}”` : 'Non è in elenco? Creala ora'}
          </div>
        </div>
      </button>

      {isLoading && <Msg>Caricamento…</Msg>}
      {isError && <Msg danger>Impossibile caricare le persone</Msg>}
      {!isLoading && !isError && filtrate.length === 0 && (
        <Msg>{q ? `Nessun risultato per “${query.trim()}”` : 'Nessuna persona in elenco'}</Msg>
      )}

      {filtrate.map(p => (
        <PersonaRow key={p.id} persona={p} selected={selectedIds.includes(p.id)} onToggle={() => onToggle(p.id)} />
      ))}

      {creating && (
        <NuovaPersonaModal
          initialNome={query.trim()}
          onClose={() => setCreating(false)}
          onCreated={p => { setCreating(false); setQuery(''); onToggle(p.id) }}
        />
      )}
    </div>
  )
}

function Msg({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      padding: '28px 16px', textAlign: 'center', fontSize: 14,
      color: danger ? 'var(--prox-danger)' : 'var(--prox-ink3)',
    }}>
      {children}
    </div>
  )
}

function PersonaRow({ persona, selected, onToggle }: { persona: Persona; selected: boolean; onToggle: () => void }) {
  const nome = persona.anonimo
    ? (persona.soprannome ? `"${persona.soprannome}"` : '—')
    : (persona.nome ?? persona.soprannome ?? '—')

  return (
    <button onClick={onToggle} style={{
      ...rowBtn,
      background: selected ? 'var(--prox-accent-soft)' : 'var(--prox-surface)',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? 'var(--prox-accent)' : 'var(--prox-line)'}`,
        background: selected ? 'var(--prox-accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <Avatar nome={persona.anonimo ? persona.soprannome : persona.nome} anonimo={persona.anonimo} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? 'var(--prox-accent-ink)' : 'var(--prox-ink)' }}>
          {nome}
        </div>
        {persona.tag && persona.tag.length > 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>{persona.tag.slice(0, 2).join(' · ')}</div>
        )}
      </div>
    </button>
  )
}

function NuovaPersonaModal({ initialNome, onClose, onCreated }: {
  initialNome: string
  onClose: () => void
  onCreated: (p: Persona) => void
}) {
  const create = useCreatePersona()
  const [nome, setNome] = useState(initialNome)
  const [soprannome, setSoprannome] = useState('')
  const [anonimo, setAnonimo] = useState(false)
  const [errore, setErrore] = useState('')

  async function salva() {
    const n = nome.trim()
    const s = soprannome.trim()
    if (anonimo && !s) { setErrore('Una persona anonima ha bisogno di un soprannome'); return }
    if (!n && !s) { setErrore('Inserisci almeno un nome o un soprannome'); return }
    setErrore('')
    try {
      const p = await create.mutateAsync({
        ruolo: 'utente', nome: n || null, soprannome: s || null, anonimo,
      })
      onCreated(p)
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
          <button onClick={onClose} aria-label="Chiudi" style={{
            width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={20} strokeWidth={1.75} />
          </button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Nuova persona</div>
          <div style={{ width: 36 }} />
        </div>

        {errore && (
          <div style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)',
            borderBottom: '1px solid var(--prox-line)',
          }}>{errore}</div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            <div className="prox-label" style={{ marginBottom: 6 }}>Nome</div>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome e cognome" style={input} autoFocus />
          </label>
          <label>
            <div className="prox-label" style={{ marginBottom: 6 }}>Soprannome</div>
            <input value={soprannome} onChange={e => setSoprannome(e.target.value)} placeholder="Come lo chiamano" style={input} />
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: 'var(--prox-surface)', border: '1px solid var(--prox-line)',
            borderRadius: 12, cursor: 'pointer',
          }}>
            <input type="checkbox" checked={anonimo} onChange={e => setAnonimo(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--prox-accent)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Persona anonima</div>
              <div style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>Nelle liste compare solo il soprannome</div>
            </div>
          </label>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
          <button onClick={salva} disabled={create.isPending} style={{
            width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
            background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', opacity: create.isPending ? 0.6 : 1,
          }}>
            {create.isPending ? 'Salvo…' : 'Crea e seleziona'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const rowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '11px 16px', width: '100%',
  background: 'var(--prox-surface)', border: 'none',
  borderBottom: '1px solid var(--prox-line2)',
  cursor: 'pointer', textAlign: 'left',
}

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}
