// Nuovo luogo — form singola pagina con selettore su mappa

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { MapPicker, type LatLng, type ParteIndirizzo } from '../components/MapPicker'
import { IndirizzoField } from '../components/IndirizzoField'
import { INDIRIZZO_VUOTO, validaIndirizzo, type Indirizzo } from '../lib/geo'
import { useTipiLuogo } from '../hooks/useTipi'
import { useServizi } from '../hooks/useServizi'
import { Lock, Globe } from 'lucide-react'
import { useCreateLuogo, useLuogo, useUpdateLuogo } from '../hooks/useLuoghi'
import type { Luogo, TipoLuogo } from '../types'

export function NuovoLuogoScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: luogo, isLoading } = useLuogo(Number(id))

  if (!id) return <LuogoForm />
  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  }
  if (!luogo) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Luogo non trovato
        <br />
        <button onClick={() => navigate('/luoghi')} style={{ marginTop: 12, cursor: 'pointer' }}>← Torna alla lista</button>
      </div>
    )
  }
  return <LuogoForm luogo={luogo} />
}

export function LuogoForm({ luogo, initial, onClose, onSaved }: {
  luogo?: Luogo
  initial?: Partial<Luogo>
  onClose?: () => void
  onSaved?: (luogo: Luogo) => void
}) {
  const navigate = useNavigate()
  const create = useCreateLuogo()
  const update = useUpdateLuogo(luogo?.id ?? 0)
  const mutation = luogo ? update : create
  const chiudi = onClose ?? (() => navigate(luogo ? `/luoghi/${luogo.id}` : '/luoghi'))

  const base = luogo ?? initial
  const [nome, setNome] = useState(base?.nome ?? '')
  const { attivi, tipi: tipiTutti, label: tipoLuogoLabel } = useTipiLuogo()
  const [tipoScelto, setTipo] = useState<TipoLuogo | null>(base?.tipo ?? null)
  const tipo: TipoLuogo = tipoScelto ?? attivi[0]?.chiave ?? 'strada'
  // i tipi disattivati non si propongono, ma quello già assegnato a questo luogo resta visibile
  const TIPI = attivi.map(t => t.chiave).concat(attivi.some(t => t.chiave === tipo) ? [] : [tipo])
  const [addr, setAddr] = useState<Indirizzo>({
    ...INDIRIZZO_VUOTO,
    indirizzo: base?.indirizzo ?? '',
    npa: base?.npa ?? '',
    localita: base?.localita ?? '',
    comune_politico: base?.comune_politico ?? '',
    bfs: base?.bfs ?? '',
    cantone: base?.cantone ?? '',
  })
  const [orari, setOrari] = useState(base?.orari ?? '')
  const [puntoEsatto, setPuntoEsatto] = useState(base?.punto_esatto ?? '')
  const [servizioId, setServizioId] = useState<number | null>(base?.servizio_id ?? null)
  const { data: servizi = [] } = useServizi()
  // pubblico di default; riservato se il tipo scelto lo è (es. Abitazioni private), finché non lo si cambia a mano
  const [visibilitaScelta, setVisibilita] = useState<'pubblico' | 'riservato' | null>(base?.visibilita ?? null)
  const visibilita = visibilitaScelta ?? (tipiTutti.find(t => t.chiave === tipo)?.riservato_default ? 'riservato' : 'pubblico')
  const [note, setNote] = useState(base?.note ?? '')
  const [pos, setPos] = useState<LatLng | null>(
    base?.lat != null && base?.lng != null ? { lat: base.lat, lng: base.lng } : null,
  )
  const [errore, setErrore] = useState('')

  function onMapChange(p: LatLng, testo?: string, parti?: ParteIndirizzo) {
    setPos(p)
    setAddr(a => ({
      ...a,
      ...(parti?.via || testo ? { indirizzo: parti?.via ?? testo ?? a.indirizzo } : {}),
      ...(parti?.cap ? { npa: parti.cap } : {}),
      ...(parti?.localita ? { localita: parti.localita } : {}),
      ...(parti?.comune ? { comune_politico: parti.comune, bfs: parti.bfs ?? '', cantone: parti.cantone ?? a.cantone } : {}),
    }))
  }

  async function salva() {
    if (!nome.trim()) { setErrore('Il nome è obbligatorio'); return }
    setErrore('')
    const v = await validaIndirizzo(addr)
    if (!v.ok) { setErrore(v.errore); return }
    const a = { ...addr, ...(v.patch ?? {}) }
    setAddr(a)
    try {
      const saved = await mutation.mutateAsync({
        nome: nome.trim(),
        tipo,
        visibilita,
        punto_esatto: puntoEsatto.trim() || null,
        servizio_id: servizioId,
        indirizzo: a.indirizzo.trim() || null,
        npa: a.npa.trim() || null,
        localita: a.localita.trim() || null,
        comune_politico: a.comune_politico.trim() || null,
        bfs: a.bfs.trim() || null,
        cantone: a.cantone.trim() || null,
        orari: orari.trim() || null,
        note: note.trim() || null,
        lat: pos ? Number(pos.lat.toFixed(7)) : null,
        lng: pos ? Number(pos.lng.toFixed(7)) : null,
        ...(luogo ? {} : { attivo: true }),
      })
      if (onSaved) onSaved(saved as Luogo)
      else chiudi()
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  return (
    <div style={{
      background: 'var(--prox-bg)', flex: 1, display: 'flex',
      flexDirection: 'column', width: '100%', overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={chiudi} style={ghostBtn} aria-label="Chiudi">
          <X size={20} strokeWidth={1.75} />
        </button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
          {luogo ? 'Modifica luogo' : 'Nuovo luogo'}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {errore && (
        <div style={{
          padding: '8px 16px', fontSize: 13, fontWeight: 500,
          background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)',
          borderBottom: '1px solid var(--prox-line)',
        }}>
          {errore}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Nome *">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Piazza Manzoni" style={input} />
        </Field>

        <Field label="Tipo">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TIPI.map(t => {
              const active = tipo === t
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  style={{
                    padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: active ? 'var(--prox-accent)' : 'var(--prox-surface2)',
                    color: active ? '#fff' : 'var(--prox-ink2)',
                  }}
                >
                  {tipoLuogoLabel(t)}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6 }}>
            Scegli che cosa c'è lì (es. un supermercato), anche se ti fermi nel suo parcheggio.
          </div>
        </Field>

        <Field label="Visibilità">
          <div style={{ display: 'flex', gap: 6 }}>
            {([['pubblico', 'Pubblico', Globe], ['riservato', 'Riservato', Lock]] as const).map(([v, etichetta, Icona]) => {
              const attivo = visibilita === v
              return (
                <button
                  key={v} onClick={() => setVisibilita(v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                    border: `1px solid ${attivo ? 'var(--prox-accent)' : 'var(--prox-line)'}`, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    background: attivo ? 'var(--prox-accent-soft)' : 'var(--prox-surface)', color: attivo ? 'var(--prox-accent-ink)' : 'var(--prox-ink2)',
                  }}
                ><Icona size={14} strokeWidth={2} /> {etichetta}</button>
              )
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6 }}>
            {visibilita === 'riservato'
              ? 'Solo per il vostro servizio (es. case di persone). Non compare sulla mappa generale e le consultazioni restano nel log.'
              : 'Luogo pubblico, utilizzabile da tutto il servizio.'}
          </div>
        </Field>

        <Field label="Posizione">
          <MapPicker value={pos} onChange={onMapChange} />
        </Field>

        <Field label="Indirizzo">
          <IndirizzoField
            value={addr}
            senzaPaese
            onChange={patch => setAddr(a => ({ ...a, ...patch }))}
            onPosizione={(lat, lng) => setPos({ lat, lng })}
          />
        </Field>

        <Field label="Punto esatto">
          <input value={puntoEsatto} onChange={e => setPuntoEsatto(e.target.value)} placeholder="Es. parcheggio, campo dietro la palestra" maxLength={120} style={input} />
        </Field>

        <Field label="Ente di riferimento">
          <select value={servizioId ?? ''} onChange={e => setServizioId(e.target.value ? Number(e.target.value) : null)} style={{ ...input, appearance: 'auto' }}>
            <option value="">— nessuno —</option>
            {servizi.map(sv => <option key={sv.id} value={sv.id}>{sv.nome}</option>)}
          </select>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 6 }}>
            Chi gestisce o organizza (es. IdéeSport per i Midnight). Si sceglie tra gli enti dell'elenco Servizi.
          </div>
        </Field>

        <Field label="Orari">
          <input value={orari} onChange={e => setOrari(e.target.value)} placeholder="Es. lun–ven 18:00–22:00" style={input} />
        </Field>

        <Field label="Note">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} />
        </Field>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
        <button
          onClick={salva}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
            background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', opacity: mutation.isPending ? 0.6 : 1,
          }}
        >
          {mutation.isPending ? 'Salvo…' : luogo ? 'Salva modifiche' : 'Crea luogo'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="prox-label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
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
