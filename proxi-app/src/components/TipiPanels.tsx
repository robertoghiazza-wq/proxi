// Impostazioni · Tipi di evento (per categoria) e tipi di luogo, con colore scelto da un elenco

import { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react'
import { Card } from './Card'
import { ColoreCampo } from './ColoreCampo'
import { Titolo, campo, vuoto, etichetta, ghost } from './SchedaUi'
import { useTipi, useGestioneTipi, type TipoEvento, type TipoLuogo, type CategoriaEvento } from '../hooks/useTipi'
import { useGestore } from '../hooks/useAuth'
import { coloreHex } from '../lib/colori'

type Risorsa = 'categorie-evento' | 'tipi-evento' | 'tipi-luogo'

// Campo nome che salva quando si esce dal campo
function NomeCampo({ valore, onSalva, disabled, grassetto }: { valore: string; onSalva: (v: string) => void; disabled?: boolean; grassetto?: boolean }) {
  const [v, setV] = useState(valore)
  return (
    <input
      value={v} disabled={disabled} maxLength={80}
      onChange={e => setV(e.target.value)}
      onBlur={() => { const t = v.trim(); if (!t) setV(valore); else if (t !== valore) onSalva(t) }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      style={{ ...campo, padding: '8px 10px', fontSize: 14.5, fontWeight: grassetto ? 600 : 500, flex: 1, minWidth: 0 }}
    />
  )
}

function Frecce({ su, giu, onSu, onGiu, disabled }: { su: boolean; giu: boolean; onSu: () => void; onGiu: () => void; disabled?: boolean }) {
  return (
    <span style={{ display: 'inline-flex' }}>
      <button onClick={onSu} disabled={disabled || !su} style={{ ...ghost, opacity: su ? 1 : 0.25 }} aria-label="Sposta su"><ArrowUp size={15} /></button>
      <button onClick={onGiu} disabled={disabled || !giu} style={{ ...ghost, opacity: giu ? 1 : 0.25 }} aria-label="Sposta giù"><ArrowDown size={15} /></button>
    </span>
  )
}

function Attivo({ valore, onChange, disabled }: { valore: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--prox-ink2)', cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={valore} disabled={disabled} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--prox-accent)', width: 16, height: 16 }} />
      In uso
    </label>
  )
}

function NuovoRiga({ segnaposto, onAggiungi, conColore, disabled }: { segnaposto: string; onAggiungi: (nome: string, colore: string) => void; conColore?: boolean; disabled?: boolean }) {
  const [nome, setNome] = useState('')
  const [colore, setColore] = useState<string>(coloreHex('azzurro'))
  const invia = () => { const t = nome.trim(); if (!t) return; onAggiungi(t, colore); setNome('') }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
      <input
        value={nome} disabled={disabled} onChange={e => setNome(e.target.value)} placeholder={segnaposto} maxLength={80}
        onKeyDown={e => { if (e.key === 'Enter') invia() }}
        style={{ ...campo, padding: '8px 10px', flex: 1, minWidth: 140 }}
      />
      {conColore && <ColoreCampo value={colore} onChange={v => setColore(v ?? coloreHex('grigio'))} disabled={disabled} />}
      <button onClick={invia} disabled={disabled || !nome.trim()} style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: nome.trim() ? 1 : 0.5, fontFamily: 'inherit',
      }}><Plus size={14} strokeWidth={2.5} /> Aggiungi</button>
    </div>
  )
}

function useRiordino() {
  const g = useGestioneTipi()
  // Rinumera il gruppo secondo la nuova posizione (aggiorna solo ciò che cambia)
  return (risorsa: Risorsa, gruppo: { id: number; ordine: number }[], da: number, a: number) => {
    const nuovo = [...gruppo]
    const [x] = nuovo.splice(da, 1)
    nuovo.splice(a, 0, x)
    nuovo.forEach((t, i) => { if (t.ordine !== i) g.aggiorna.mutate({ risorsa, id: t.id, ordine: i }) })
  }
}

export function TipiEventoPanel() {
  const { data } = useTipi()
  const g = useGestioneTipi()
  const gestore = useGestore()
  const riordina = useRiordino()
  const [errore, setErrore] = useState('')

  if (!data) return <Card padding="14px 16px"><p style={vuoto}>Caricamento…</p></Card>
  const ko = { onError: (e: unknown) => setErrore((e as Error).message) }
  const ok = { onSuccess: () => setErrore('') }
  const categorie = [...data.categorie].sort((a, b) => a.ordine - b.ordine || a.id - b.id)

  const eliminaCategoria = (c: CategoriaEvento) => g.elimina.mutate({ risorsa: 'categorie-evento', id: c.id }, { ...ko, ...ok })
  const eliminaTipo = (t: TipoEvento) => g.elimina.mutate({ risorsa: 'tipi-evento', id: t.id }, { ...ko, ...ok })

  return (
    <>
      {!gestore && <Card padding="12px 16px"><p style={vuoto}>I tipi di evento li modificano coordinatori e admin.</p></Card>}
      <div style={etichetta}>Le categorie raggruppano i tipi quando si crea un evento. Un tipo senza colore proprio usa quello della categoria. Un tipo già usato da eventi si può disattivare ma non eliminare.</div>
      {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}

      {categorie.map((c, ci) => {
        const tipi = data.tipi_evento.filter(t => t.categoria_id === c.id).sort((a, b) => a.ordine - b.ordine || a.id - b.id)
        return (
          <Card key={c.id} padding="12px 14px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <NomeCampo valore={c.nome} grassetto disabled={!gestore} onSalva={nome => g.aggiorna.mutate({ risorsa: 'categorie-evento', id: c.id, nome }, { ...ko, ...ok })} />
              <Frecce disabled={!gestore} su={ci > 0} giu={ci < categorie.length - 1} onSu={() => riordina('categorie-evento', categorie, ci, ci - 1)} onGiu={() => riordina('categorie-evento', categorie, ci, ci + 1)} />
              <button onClick={() => eliminaCategoria(c)} disabled={!gestore} style={{ ...ghost, color: 'var(--prox-danger)' }} aria-label="Elimina la categoria"><Trash2 size={15} /></button>
            </div>
            <div style={{ margin: '6px 0 8px' }}>
              <ColoreCampo value={c.colore} disabled={!gestore} onChange={v => g.aggiorna.mutate({ risorsa: 'categorie-evento', id: c.id, colore: v ?? coloreHex('grigio') }, { ...ko, ...ok })} />
            </div>

            {tipi.map((t, ti) => (
              <div key={t.id} style={{ padding: '8px 0 8px 10px', borderTop: '1px solid var(--prox-line2)', opacity: t.attivo ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <NomeCampo valore={t.nome} disabled={!gestore} onSalva={nome => g.aggiorna.mutate({ risorsa: 'tipi-evento', id: t.id, nome }, { ...ko, ...ok })} />
                  <Frecce disabled={!gestore} su={ti > 0} giu={ti < tipi.length - 1} onSu={() => riordina('tipi-evento', tipi, ti, ti - 1)} onGiu={() => riordina('tipi-evento', tipi, ti, ti + 1)} />
                  <button onClick={() => eliminaTipo(t)} disabled={!gestore || t.usi > 0} title={t.usi > 0 ? `Usato da ${t.usi} eventi` : 'Elimina'} style={{ ...ghost, color: 'var(--prox-danger)', opacity: t.usi > 0 ? 0.25 : 1 }} aria-label="Elimina il tipo"><Trash2 size={15} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                  <ColoreCampo value={t.colore} vuoto="Come la categoria" disabled={!gestore} onChange={v => g.aggiorna.mutate({ risorsa: 'tipi-evento', id: t.id, colore: v }, { ...ko, ...ok })} />
                  <Attivo valore={t.attivo} disabled={!gestore} onChange={attivo => g.aggiorna.mutate({ risorsa: 'tipi-evento', id: t.id, attivo }, { ...ko, ...ok })} />
                  {t.usi > 0 && <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{t.usi} {t.usi === 1 ? 'evento' : 'eventi'}</span>}
                  <select
                    value={t.categoria_id} disabled={!gestore} aria-label="Categoria"
                    onChange={e => g.aggiorna.mutate({ risorsa: 'tipi-evento', id: t.id, categoria_id: Number(e.target.value) }, { ...ko, ...ok })}
                    style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid var(--prox-line)', background: 'var(--prox-surface)', fontSize: 13, fontFamily: 'inherit', appearance: 'auto' }}
                  >
                    {categorie.map(k => <option key={k.id} value={k.id}>{k.nome}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {gestore && <NuovoRiga segnaposto="Nuovo tipo in questa categoria" onAggiungi={nome => g.crea.mutate({ risorsa: 'tipi-evento', nome, categoria_id: c.id }, { ...ko, ...ok })} />}
          </Card>
        )
      })}

      {gestore && (
        <Card padding="12px 14px">
          <Titolo titolo="Nuova categoria" />
          <NuovoRiga conColore segnaposto="Nome della categoria" onAggiungi={(nome, colore) => g.crea.mutate({ risorsa: 'categorie-evento', nome, colore }, { ...ko, ...ok })} />
        </Card>
      )}
    </>
  )
}

export function TipiLuogoPanel() {
  const { data } = useTipi()
  const g = useGestioneTipi()
  const gestore = useGestore()
  const riordina = useRiordino()
  const [errore, setErrore] = useState('')

  if (!data) return <Card padding="14px 16px"><p style={vuoto}>Caricamento…</p></Card>
  const ko = { onError: (e: unknown) => setErrore((e as Error).message) }
  const ok = { onSuccess: () => setErrore('') }
  const tipi: TipoLuogo[] = [...data.tipi_luogo].sort((a, b) => a.ordine - b.ordine || a.id - b.id)

  return (
    <>
      {!gestore && <Card padding="12px 16px"><p style={vuoto}>I tipi di luogo li modificano coordinatori e admin.</p></Card>}
      <div style={etichetta}>Il colore compare nella barra a sinistra dei luoghi e sulla mappa. "Riservato di default" propone i nuovi luoghi di quel tipo come riservati (non entrano nella mappa generale, letture nel log). Un tipo già usato da luoghi si può disattivare ma non eliminare.</div>
      {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}

      <Card padding="12px 14px">
        {tipi.map((t, i) => (
          <div key={t.id} style={{ padding: '8px 0', borderTop: i ? '1px solid var(--prox-line2)' : 'none', opacity: t.attivo ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <NomeCampo valore={t.nome} disabled={!gestore} onSalva={nome => g.aggiorna.mutate({ risorsa: 'tipi-luogo', id: t.id, nome }, { ...ko, ...ok })} />
              <Frecce disabled={!gestore} su={i > 0} giu={i < tipi.length - 1} onSu={() => riordina('tipi-luogo', tipi, i, i - 1)} onGiu={() => riordina('tipi-luogo', tipi, i, i + 1)} />
              <button onClick={() => g.elimina.mutate({ risorsa: 'tipi-luogo', id: t.id }, { ...ko, ...ok })} disabled={!gestore || t.usi > 0} title={t.usi > 0 ? `Usato da ${t.usi} luoghi` : 'Elimina'} style={{ ...ghost, color: 'var(--prox-danger)', opacity: t.usi > 0 ? 0.25 : 1 }} aria-label="Elimina il tipo"><Trash2 size={15} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
              <ColoreCampo value={t.colore} disabled={!gestore} onChange={v => g.aggiorna.mutate({ risorsa: 'tipi-luogo', id: t.id, colore: v ?? coloreHex('grigio') }, { ...ko, ...ok })} />
              <Attivo valore={t.attivo} disabled={!gestore} onChange={attivo => g.aggiorna.mutate({ risorsa: 'tipi-luogo', id: t.id, attivo }, { ...ko, ...ok })} />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--prox-ink2)', cursor: gestore ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={t.riservato_default} disabled={!gestore} onChange={e => g.aggiorna.mutate({ risorsa: 'tipi-luogo', id: t.id, riservato_default: e.target.checked }, { ...ko, ...ok })} style={{ accentColor: 'var(--prox-accent)', width: 16, height: 16 }} />
                Riservato di default
              </label>
              {t.usi > 0 && <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{t.usi} {t.usi === 1 ? 'luogo' : 'luoghi'}</span>}
            </div>
          </div>
        ))}
        {gestore && <NuovoRiga conColore segnaposto="Nuovo tipo di luogo" onAggiungi={(nome, colore) => g.crea.mutate({ risorsa: 'tipi-luogo', nome, colore }, { ...ko, ...ok })} />}
      </Card>
    </>
  )
}
