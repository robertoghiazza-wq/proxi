// Persone — lista con ricerca e filtri per ruolo

import { nomePersona, etichettaRuolo } from '../lib/persona'
import { useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { Search, AlertTriangle, Plus } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { Modal } from '../components/Modal'
import { AvatarPersona } from '../components/AvatarPersona'
import { PersoneServiziSwitch } from '../components/PersoneServiziSwitch'
import { usePersone } from '../hooks/usePersone'
import { useRuoli } from '../hooks/useRuoli'
import type { Persona, RuoloPersona } from '../types'

const TAG_VULNERABILI = ['senza fissa dimora', 'minore', 'dipendenza']

function isVulnerabile(p: Persona) {
  return p.tag?.some(t => TAG_VULNERABILI.includes(t)) ?? false
}

const displayName = nomePersona

function PersonaRow({ persona }: { persona: Persona }) {
  const navigate = useNavigate()
  const { data: ruoli = [] } = useRuoli()
  const ruolo = etichettaRuolo(ruoli.find(r => r.id === persona.ruolo_id), persona.sesso)
  const vuln = isVulnerabile(persona)

  return (
    <div
      onClick={() => navigate(`/persone/${persona.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--prox-line2)',
      }}
    >
      <AvatarPersona persona={persona} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--prox-ink)' }}>
            {displayName(persona)}
          </span>
          {vuln && (
            <AlertTriangle size={13} color="oklch(0.60 0.14 70)" strokeWidth={2} />
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 1 }}>
          {[ruolo, persona.eta ? `${persona.eta} anni` : null, persona.lingue?.join(' · ')].filter(Boolean).join(' · ')}
        </div>
        {persona.tag && persona.tag.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
            {persona.tag.slice(0, 3).map(t => (
              <span key={t} style={{
                fontSize: 10.5, background: 'var(--prox-surface2)',
                color: 'var(--prox-ink3)', borderRadius: 999,
                padding: '1px 7px', fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{
        fontSize: 12.5, color: 'var(--prox-ink3)',
        fontFamily: 'ui-monospace, monospace', flexShrink: 0,
      }}>
        {persona.eventi_count ?? 0}
      </div>
    </div>
  )
}

type Filtro = 'tutti' | RuoloPersona

const FILTRI: { key: Filtro; label: string }[] = [
  { key: 'tutti',      label: 'Tutti'    },
  { key: 'utente',     label: 'Utenti'   },
  { key: 'dipendente', label: 'Dipendenti' },
  { key: 'rete',       label: 'Contatti'  },
]

export function PersoneScreen() {
  const navigate = useNavigate()
  const isNuovoOpen = !!useMatch('/persone/nuovo')
  const isDetailOpen = !!useMatch('/persone/:id/*') && !isNuovoOpen
  const [query, setQuery]   = useState('')
  const [filtro, setFiltro] = useState<Filtro>('tutti')

  const { data: tuttePersone = [], isLoading, isError, error } = usePersone()

  const persone = tuttePersone
    .filter(p => filtro === 'tutti' || p.ruolo === filtro)
    .filter(p => {
      if (!query) return true
      const q = query.toLowerCase()
      return (
        p.nome?.toLowerCase().includes(q) ||
        p.cognome?.toLowerCase().includes(q) ||
        p.soprannome?.toLowerCase().includes(q) ||
        p.tag?.some(t => t.includes(q))
      )
    })

  const counts: Record<string, number> = {
    tutti:      tuttePersone.length,
    utente:     tuttePersone.filter(p => p.ruolo === 'utente').length,
    dipendente: tuttePersone.filter(p => p.ruolo === 'dipendente').length,
    rete:       tuttePersone.filter(p => p.ruolo === 'rete').length,
  }

  return (
    <MobileLayout>
      {/* Top bar */}
      <div style={{
        padding: '20px 16px 12px',
        borderBottom: '1px solid var(--prox-line)',
        background: 'var(--prox-surface)',
        position: 'sticky', top: 'var(--sat)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <PersoneServiziSwitch current="persone" />
          <button onClick={() => navigate('/persone/nuovo')} style={newBtn} aria-label="Nuova persona">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--prox-surface2)',
          borderRadius: 12, padding: '8px 12px',
          border: '1px solid var(--prox-line)',
        }}>
          <Search size={16} color="var(--prox-ink3)" strokeWidth={1.75} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca nome, soprannome, tag…"
            style={{
              flex: 1, border: 'none', background: 'none',
              fontSize: 14, color: 'var(--prox-ink)', outline: 'none',
            }}
          />
        </div>

        {/* Filtri ruolo */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {FILTRI.map(({ key, label }) => {
            const active = filtro === key
            return (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                style={{
                  padding: '4px 10px', borderRadius: 999, border: 'none',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: active ? 'var(--prox-accent)' : 'var(--prox-surface2)',
                  color: active ? '#fff' : 'var(--prox-ink2)',
                  transition: 'background 0.15s',
                }}
              >
                {label} <span style={{ opacity: 0.7 }}>{counts[key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      <div style={{ background: 'var(--prox-surface)' }}>
        {isLoading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
          : isError
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-accent)', fontSize: 14 }}>Errore di caricamento<div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 6 }}>{(error as Error)?.message}</div></div>
            : persone.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Nessun risultato</div>
              : persone.map(p => <PersonaRow key={p.id} persona={p} />)
        }
      </div>
      {isNuovoOpen ? (
        <Modal open onClose={() => navigate('/persone')}>
          <Outlet />
        </Modal>
      ) : (
        <Drawer open={isDetailOpen} onClose={() => navigate('/persone')}>
          <Outlet />
        </Drawer>
      )}
    </MobileLayout>
  )
}

const newBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--prox-accent)', color: '#fff',
  border: 'none', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(220,29,39,0.3)',
}
