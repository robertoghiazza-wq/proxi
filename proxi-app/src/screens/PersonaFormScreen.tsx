// Nuova persona (modal): tre tab liberamente esplorabili — Anagrafica, Contatti, Note

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { BarraTab } from '../components/SchedaUi'
import {
  AnagraficaCampi, ContattiCampi, NoteCampi,
  anagraficaDa, contattiDa, noteDa, datiAnagrafica, datiContatti, datiNote,
  type AnagraficaBozza, type ContattiBozza, type NoteBozza,
} from '../components/PersonaCampi'
import { useCreatePersona } from '../hooks/usePersone'
import type { Persona, RuoloPersona } from '../types'

type Tab = 'anagrafica' | 'contatti' | 'note'

export function PersonaFormScreen() {
  return <PersonaForm />
}

export function PersonaForm({ initialRuolo, onClose, onSaved }: {
  initialRuolo?: RuoloPersona
  onClose?: () => void
  onSaved?: (p: Persona) => void
}) {
  const navigate = useNavigate()
  const create = useCreatePersona()
  const chiudi = onClose ?? (() => navigate('/persone'))

  const [tab, setTab] = useState<Tab>('anagrafica')
  const [ana, setAna] = useState<AnagraficaBozza>(() => anagraficaDa(undefined, initialRuolo))
  const [con, setCon] = useState<ContattiBozza>(() => contattiDa())
  const [not, setNot] = useState<NoteBozza>(() => noteDa())
  const [errore, setErrore] = useState('')

  async function salva() {
    const a = datiAnagrafica(ana)
    if ('errore' in a) { setTab('anagrafica'); setErrore(a.errore); return }
    const c = await datiContatti(con)
    if ('errore' in c) { setTab('contatti'); setErrore(c.errore); return }
    setErrore('')
    try {
      const saved = await create.mutateAsync({ ...a.dati, ...c.dati, ...datiNote(not, ana.ruolo === 'utente') })
      if (onSaved) onSaved(saved)
      else chiudi()
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
          width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--prox-ink2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={20} strokeWidth={1.75} /></button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Nuova persona</div>
        <div style={{ width: 36 }} />
      </div>

      <BarraTab
        tabs={[{ key: 'anagrafica', label: 'Anagrafica' }, { key: 'contatti', label: 'Contatti' }, { key: 'note', label: 'Note' }]}
        attiva={tab}
        onScegli={setTab}
      />

      {errore && (
        <div style={{
          padding: '8px 16px', fontSize: 13, fontWeight: 500, background: 'oklch(0.96 0.04 25)',
          color: 'var(--prox-danger)', borderBottom: '1px solid var(--prox-line)',
        }}>{errore}</div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        {tab === 'anagrafica' && <AnagraficaCampi value={ana} onChange={p => setAna(a => ({ ...a, ...p }))} />}
        {tab === 'contatti' && <ContattiCampi value={con} onChange={p => setCon(c => ({ ...c, ...p }))} />}
        {tab === 'note' && <NoteCampi value={not} onChange={p => setNot(n => ({ ...n, ...p }))} utente={ana.ruolo === 'utente'} />}
      </div>

      <div style={{
        padding: '12px 16px', paddingBottom: 'max(12px, var(--sab))',
        background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)',
      }}>
        <button onClick={salva} disabled={create.isPending} style={{
          width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
          background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', opacity: create.isPending ? 0.6 : 1,
        }}>
          {create.isPending ? 'Salvo…' : 'Crea persona'}
        </button>
      </div>
    </div>
  )
}
