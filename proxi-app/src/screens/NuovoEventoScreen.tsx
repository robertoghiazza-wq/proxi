// Nuovo Evento — wizard 5 step
// 1 Tipo | 2 Quando | 3 Luogo (GPS) | 4 Persone (suggerite dal luogo) | 5 Note

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronLeft, Search, Navigation, MapPin, Plus } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import {
  MOCK_PERSONE, MOCK_LUOGHI, MOCK_EVENTI,
  MACRO_CATEGORIE, TIPI_EVENTO,
  tipoLabel, hueToColor,
} from '../lib/mock-data'
import type { Luogo } from '../types'

// ─── util ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function nowRounded(): string {
  const d = new Date()
  const m = Math.round(d.getMinutes() / 5) * 5
  const h = d.getHours() + (m === 60 ? 1 : 0)
  return `${String(h % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function minToLabel(m: number) {
  if (m < 60) return `${m}′`
  const h = Math.floor(m / 60), r = m % 60
  return r > 0 ? `${h}h ${r}′` : `${h}h`
}

function calcFine(oraInizio: string, durataMin: number): string {
  const [h, m] = oraInizio.split(':').map(Number)
  const tot = h * 60 + m + durataMin
  return `${String(Math.floor(tot / 60) % 24).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}

// Haversine — distanza in metri
function distanzaM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDistanza(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

// Conta quante volte una persona è stata in un luogo (dai mock)
function scorePersonaPerLuogo(personaId: number, luogoId: number): number {
  return MOCK_EVENTI.filter(
    e => e.luogo_id === luogoId && e.persone?.some(p => p.id === personaId)
  ).length
}

// ─── stato wizard ──────────────────────────────────────────────────────────

export interface Sosta {
  luogoId:  number | null   // null = nessun luogo specifico
  dalle:    string          // HH:MM
  alle:     string          // HH:MM
}

interface WizardState {
  tipo:       string | null
  data:       string
  oraInizio:  string
  durata:     number
  soste:      Sosta[]       // zero o più luoghi con orario
  personeIds: number[]
  note:       string
  savedId:    number | null // ID evento creato dopo step Luoghi
}

const DURATE = [15, 30, 45, 60, 90, 120]
const STEPS  = ['Tipo', 'Quando', 'Luoghi', 'Persone', 'Note']
// step 2 = Luoghi → "Crea evento"; step 3+ = arricchimento facoltativo
const STEP_CREA = 2

type SetFn = <K extends keyof WizardState>(key: K, val: WizardState[K]) => void

// ─── componente principale ─────────────────────────────────────────────────

export function NuovoEventoScreen() {
  const navigate = useNavigate()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState<WizardState>({
    tipo:       null,
    data:       todayISO(),
    oraInizio:  nowRounded(),
    durata:     30,
    soste:      [],
    personeIds: [],
    note:       '',
    savedId:    null,
  })

  function set<K extends keyof WizardState>(key: K, val: WizardState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function togglePersona(id: number) {
    set('personeIds', form.personeIds.includes(id)
      ? form.personeIds.filter(x => x !== id)
      : [...form.personeIds, id]
    )
  }

  const canProceed = [
    form.tipo !== null,   // step 0 — tipo obbligatorio
    form.data !== '',     // step 1 — data obbligatoria
    true,                 // step 2 — luoghi facoltativi
    true,                 // step 3 — persone facoltative
    true,                 // step 4 — note facoltative
  ][step]

  const isEnrichment = form.savedId !== null   // evento già creato
  const isLast = step === STEPS.length - 1

  // Crea l'evento (step STEP_CREA) e continua per arricchirlo
  async function handleCrea() {
    setSaving(true)
    // TODO: POST /api/eventi → riceve ID
    await new Promise(r => setTimeout(r, 600))
    const fakeId = Date.now()
    setForm(f => ({ ...f, savedId: fakeId }))
    setSaving(false)
    setStep(s => s + 1)
  }

  // Salva arricchimenti (persone, note) e chiude
  async function handleSalva() {
    setSaving(true)
    // TODO: PATCH /api/eventi/:id
    await new Promise(r => setTimeout(r, 400))
    navigate('/eventi')
  }

  // Chiude senza salvare ulteriori arricchimenti (evento già creato)
  function handleChiudi() {
    navigate('/eventi')
  }

  // Avanza o crea
  function handleContinua() {
    if (step === STEP_CREA) { handleCrea(); return }
    if (isLast) { handleSalva(); return }
    setStep(s => s + 1)
  }

  const btnLabel = saving
    ? 'Salvo…'
    : step === STEP_CREA ? 'Crea evento'
    : isLast ? 'Salva e chiudi'
    : 'Continua'

  return (
    <div style={{
      background: 'var(--prox-bg)',
      flex: 1, display: 'flex', flexDirection: 'column', width: '100%',
      overflow: 'hidden',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'var(--prox-surface)',
        borderBottom: '1px solid var(--prox-line)',
        padding: '14px 16px 12px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => step === 0 ? navigate('/eventi') : setStep(s => s - 1)}
            style={ghostBtn}
          >
            {step === 0 ? <X size={20} strokeWidth={1.75}/> : <ChevronLeft size={20} strokeWidth={1.75}/>}
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 700 }}>
              Nuovo evento
            </div>
            <div style={{ fontSize: 11, color: 'var(--prox-ink3)', marginTop: 1 }}>
              {step + 1} / {STEPS.length} — {STEPS[step]}
              {isEnrichment && (
                <span style={{ color: 'var(--prox-ok)', marginLeft: 5, fontWeight: 600 }}>
                  ✓ creato
                </span>
              )}
            </div>
          </div>

          {/* Chiudi (dopo creazione) */}
          {isEnrichment
            ? <button onClick={handleChiudi} style={{ ...ghostBtn, fontSize: 13, color: 'var(--prox-ink3)' }}>
                Chiudi
              </button>
            : <div style={{ width: 48 }} />
          }
        </div>

        <ProgressBar current={step} total={STEPS.length} created={isEnrichment} />
      </div>

      {/* ── CONTENUTO ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {step === 0 && <StepTipo    form={form} set={set} />}
        {step === 1 && <StepQuando  form={form} set={set} />}
        {step === 2 && <StepLuoghi  form={form} set={set} />}
        {step === 3 && <StepPersone form={form} togglePersona={togglePersona} />}
        {step === 4 && <StepNote    form={form} set={set} />}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'var(--prox-surface)',
        borderTop: '1px solid var(--prox-line)',
        display: 'flex', gap: 10,
      }}>
        {/* Indietro (solo prima della creazione) */}
        {step > 0 && !isEnrichment && (
          <button onClick={() => setStep(s => s - 1)} style={backBtn}>
            Indietro
          </button>
        )}

        <button
          onClick={handleContinua}
          disabled={!canProceed || saving}
          style={{
            ...continueBtn,
            background: canProceed ? 'var(--prox-accent)' : 'var(--prox-line)',
            color: canProceed ? '#fff' : 'var(--prox-ink3)',
            cursor: canProceed ? 'pointer' : 'default',
          }}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  )
}

// ─── STEP 1: TIPO (due livelli) ────────────────────────────────────────────

// Icone per le macro categorie (Lucide inline)
function MacroIcon({ id, size = 18 }: { id: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    territorio: <><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></>,
    riunioni:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    interno:    <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>,
    sviluppo:   <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    assenze:    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths[id] ?? null}
    </svg>
  )
}

function StepTipo({ form, set }: { form: WizardState; set: SetFn }) {
  // Macro selezionata: se ho già un tipo scelto, preseleziona la sua macro
  const macroDefault = form.tipo
    ? (TIPI_EVENTO[form.tipo]?.macro ?? MACRO_CATEGORIE[0].id)
    : MACRO_CATEGORIE[0].id
  const [macroAttiva, setMacroAttiva] = useState<string>(macroDefault)

  const tipiMacro = Object.entries(TIPI_EVENTO)
    .filter(([, def]) => def.macro === macroAttiva)

  const macroColor = hueToColor(MACRO_CATEGORIE.find(m => m.id === macroAttiva)?.hue ?? 200)

  return (
    <div>
      {/* ── Chip macro (scrollabili) ── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '16px 16px 12px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}>
        {MACRO_CATEGORIE.map(m => {
          const active = macroAttiva === m.id
          const c = hueToColor(m.hue)
          return (
            <button
              key={m.id}
              onClick={() => setMacroAttiva(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px 7px 10px', borderRadius: 999,
                border: `1.5px solid ${active ? c : 'var(--prox-line)'}`,
                background: active ? c + '18' : 'var(--prox-surface)',
                color: active ? c : 'var(--prox-ink3)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <MacroIcon id={m.id} size={16} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* ── Lista sub-tipi ── */}
      <div style={{
        margin: '0 16px', borderRadius: 14,
        border: '1px solid var(--prox-line2)',
        background: 'var(--prox-surface)',
        overflow: 'hidden',
      }}>
        {tipiMacro.map(([key, def], i) => {
          const active = form.tipo === key
          return (
            <button
              key={key}
              onClick={() => { set('tipo', key); setMacroAttiva(def.macro) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '13px 14px',
                background: active ? macroColor + '12' : 'transparent',
                border: 'none',
                borderTop: i > 0 ? '1px solid var(--prox-line2)' : 'none',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              {/* Radio */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? macroColor : 'var(--prox-line)'}`,
                background: active ? macroColor : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}>
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : 500,
                color: active ? 'var(--prox-ink)' : 'var(--prox-ink2)',
              }}>
                {def.label}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}

// ─── STEP 2: QUANDO ────────────────────────────────────────────────────────

function StepQuando({ form, set }: { form: WizardState; set: SetFn }) {
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StepIntro>Quando si è svolto?</StepIntro>

      <Field label="Data">
        <input type="date" value={form.data} max={todayISO()}
          onChange={e => set('data', e.target.value)} style={inputStyle} />
      </Field>

      <Field label="Ora di inizio">
        <input type="time" value={form.oraInizio}
          onChange={e => set('oraInizio', e.target.value)} style={inputStyle} />
      </Field>

      <Field label="Durata">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DURATE.map(d => {
            const active = form.durata === d
            return (
              <button key={d} onClick={() => set('durata', d)} style={{
                padding: '9px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.12s',
                border: `1.5px solid ${active ? 'var(--prox-accent)' : 'var(--prox-line)'}`,
                background: active ? 'var(--prox-accent)' : 'var(--prox-surface)',
                color: active ? '#fff' : 'var(--prox-ink2)',
              }}>
                {minToLabel(d)}
              </button>
            )
          })}
        </div>
        {form.oraInizio && (
          <p style={{ fontSize: 12.5, color: 'var(--prox-ink3)', margin: '10px 0 0' }}>
            Fine stimata: <strong style={{ color: 'var(--prox-ink2)' }}>
              {calcFine(form.oraInizio, form.durata)}
            </strong>
          </p>
        )}
      </Field>
    </div>
  )
}

// ─── STEP 3: LUOGHI (multi-sosta con orario) ──────────────────────────────

type GeoState = 'idle' | 'loading' | 'ok' | 'denied'

interface LuogoConDistanza extends Luogo { distanzaM?: number }

function nextOra(ora: string, minuti = 30): string {
  const [h, m] = ora.split(':').map(Number)
  const tot = h * 60 + m + minuti
  return `${String(Math.floor(tot / 60) % 24).padStart(2,'0')}:${String(tot % 60).padStart(2,'0')}`
}

function StepLuoghi({ form, set }: { form: WizardState; set: SetFn }) {
  const [query,    setQuery]    = useState('')
  const [geoState, setGeoState] = useState<GeoState>('idle')
  const [userPos,  setUserPos]  = useState<{ lat: number; lng: number } | null>(null)
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    if (!navigator.geolocation) { setGeoState('denied'); return }
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoState('ok') },
      () => setGeoState('denied'),
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // Distanze e ordinamento
  const luoghiOrdinati: LuogoConDistanza[] = MOCK_LUOGHI.map(l => ({
    ...l,
    distanzaM: (userPos && l.lat != null && l.lng != null)
      ? distanzaM(userPos.lat, userPos.lng, l.lat!, l.lng!)
      : undefined,
  })).sort((a, b) => {
    if (a.distanzaM !== undefined && b.distanzaM !== undefined) return a.distanzaM - b.distanzaM
    if (a.distanzaM !== undefined) return -1
    if (b.distanzaM !== undefined) return 1
    return 0
  })

  const filtrati = luoghiOrdinati.filter(l =>
    !query || l.nome.toLowerCase().includes(query.toLowerCase())
      || l.indirizzo?.toLowerCase().includes(query.toLowerCase())
  )
  const vicini = geoState === 'ok' ? filtrati.filter(l => l.distanzaM !== undefined && l.distanzaM < 1000) : []
  const altri  = geoState === 'ok' ? filtrati.filter(l => !vicini.includes(l)) : filtrati

  // Aggiunge una sosta con orari pre-calcolati
  function aggiungiSosta(luogoId: number | null) {
    const ultima = form.soste[form.soste.length - 1]
    const dalle  = ultima ? ultima.alle : form.oraInizio
    const ale    = nextOra(dalle, 30)
    const nuova: Sosta = { luogoId, dalle, alle: ale }
    set('soste', [...form.soste, nuova])
    setQuery('')
  }

  function removeSosta(i: number) {
    set('soste', form.soste.filter((_, idx) => idx !== i))
  }

  function updateSosta(i: number, field: 'dalle' | 'alle', val: string) {
    set('soste', form.soste.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  // Luoghi già usati (per non mostrare duplicati nella lista)
  const luoghiUsati = new Set(form.soste.map(s => s.luogoId).filter(Boolean))

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Soste già aggiunte ── */}
      {form.soste.length > 0 && (
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="prox-label" style={{ marginBottom: 10 }}>
            Soste ({form.soste.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.soste.map((sosta, i) => {
              const luogo = sosta.luogoId ? MOCK_LUOGHI.find(l => l.id === sosta.luogoId) : null
              return (
                <div key={i} style={{
                  background: 'var(--prox-surface)',
                  borderRadius: 12, padding: '11px 13px',
                  border: '1px solid var(--prox-line2)',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {/* Riga titolo + elimina */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="var(--prox-accent)" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                      {luogo?.nome ?? 'Spostamento / esterno'}
                    </span>
                    <button onClick={() => removeSosta(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--prox-ink3)', padding: 2, borderRadius: 4,
                    }}>
                      <X size={15} strokeWidth={2} />
                    </button>
                  </div>
                  {/* Orari */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>dalle</span>
                    <input type="time" value={sosta.dalle}
                      onChange={e => updateSosta(i, 'dalle', e.target.value)}
                      style={{ ...timeInput }} />
                    <span style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>alle</span>
                    <input type="time" value={sosta.alle}
                      onChange={e => updateSosta(i, 'alle', e.target.value)}
                      style={{ ...timeInput }} />
                    <span style={{ fontSize: 11.5, color: 'var(--prox-ink3)', fontFamily: 'ui-monospace, monospace', marginLeft: 4 }}>
                      {durSosta(sosta)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Divisore */}
          <div style={{ height: 1, background: 'var(--prox-line)', margin: '14px 0 0' }} />
        </div>
      )}

      {/* ── Ricerca / aggiungi ── */}
      <div style={{
        padding: '12px 16px', background: 'var(--prox-surface)',
        borderBottom: '1px solid var(--prox-line2)',
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Aggiungi un luogo…" />
        {geoState === 'loading' && <GpsBanner icon={<Navigation size={13} strokeWidth={2}/>} color="var(--prox-ink3)">Ricerca posizione…</GpsBanner>}
        {geoState === 'ok' && vicini.length > 0 && <GpsBanner icon={<Navigation size={13} strokeWidth={2}/>} color="var(--prox-ok)">{vicini.length} vicino/i</GpsBanner>}
        {geoState === 'denied' && <GpsBanner icon={<MapPin size={13} strokeWidth={2}/>} color="var(--prox-ink3)">Posizione non disponibile</GpsBanner>}
      </div>

      {/* "Spostamento / esterno" — sempre disponibile */}
      {!query && (
        <AddLuogoRow
          label="Spostamento / esterno"
          sublabel="Nessun luogo specifico"
          onAdd={() => aggiungiSosta(null)}
        />
      )}

      {/* Vicini */}
      {vicini.length > 0 && !luoghiUsati.has(null) && (
        <>
          <SectionDivider label="Vicino a te" />
          {vicini.filter(l => !luoghiUsati.has(l.id)).map(l => (
            <AddLuogoRow key={l.id}
              label={l.nome} sublabel={l.indirizzo ?? undefined}
              badge={l.distanzaM !== undefined ? fmtDistanza(l.distanzaM) : undefined}
              onAdd={() => aggiungiSosta(l.id)}
            />
          ))}
        </>
      )}

      {/* Altri */}
      {altri.filter(l => !luoghiUsati.has(l.id)).length > 0 && (
        <>
          <SectionDivider label={vicini.length > 0 ? 'Altri luoghi' : 'Luoghi'} />
          {altri.filter(l => !luoghiUsati.has(l.id)).map(l => (
            <AddLuogoRow key={l.id}
              label={l.nome} sublabel={l.indirizzo ?? undefined}
              badge={l.distanzaM !== undefined ? fmtDistanza(l.distanzaM) : undefined}
              onAdd={() => aggiungiSosta(l.id)}
            />
          ))}
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}

// helper durata sosta
function durSosta(s: Sosta): string {
  const [h1, m1] = s.dalle.split(':').map(Number)
  const [h2, m2] = s.alle.split(':').map(Number)
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (diff <= 0) return ''
  const h = Math.floor(diff / 60), m = diff % 60
  return h > 0 ? (m > 0 ? `${h}h${m}′` : `${h}h`) : `${m}′`
}

function AddLuogoRow({ label, sublabel, badge, onAdd }: {
  label: string; sublabel?: string; badge?: string; onAdd: () => void
}) {
  return (
    <button onClick={onAdd} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', width: '100%',
      background: 'var(--prox-surface)', border: 'none',
      borderBottom: '1px solid var(--prox-line2)',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'var(--prox-accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plus size={15} color="var(--prox-accent)" strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--prox-ink)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>{sublabel}</div>}
      </div>
      {badge && <span style={{
        fontSize: 11, fontWeight: 600, fontFamily: 'ui-monospace, monospace',
        color: 'var(--prox-ok)', background: 'oklch(0.96 0.05 155)',
        borderRadius: 999, padding: '2px 7px', flexShrink: 0,
      }}>{badge}</span>}
    </button>
  )
}

const timeInput: React.CSSProperties = {
  border: '1.5px solid var(--prox-line)', borderRadius: 8,
  padding: '5px 8px', fontSize: 13, fontFamily: 'ui-monospace, monospace',
  color: 'var(--prox-ink)', background: 'var(--prox-surface2)',
  outline: 'none', width: 78,
}

// ─── STEP 4: PERSONE (suggerite dai luoghi) ────────────────────────────────

function StepPersone({
  form, togglePersona,
}: { form: WizardState; togglePersona: (id: number) => void }) {
  const [query, setQuery] = useState('')

  const utenti = MOCK_PERSONE.filter(p => p.ruolo === 'utente')

  // Score persona = somma delle presenze in tutti i luoghi delle soste
  const conScore = utenti.map(p => ({
    ...p,
    score: form.soste.reduce((tot, s) =>
      tot + (s.luogoId ? scorePersonaPerLuogo(p.id, s.luogoId) : 0), 0
    ),
  }))

  // Separa suggerite (score > 0) da tutte le altre
  const suggerite = conScore
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)

  const altre = conScore.filter(p => p.score === 0)

  // Filtra per ricerca
  function matches(p: typeof conScore[0]) {
    if (!query) return true
    const q = query.toLowerCase()
    return p.nome?.toLowerCase().includes(q)
      || p.soprannome?.toLowerCase().includes(q)
      || p.tag?.some(t => t.includes(q))
  }

  const suggeriteFiltrate = suggerite.filter(matches)
  const altreFiltrate     = altre.filter(matches)
  const nSel = form.personeIds.length

  const luoghiNomi = form.soste
    .map(s => s.luogoId ? MOCK_LUOGHI.find(l => l.id === s.luogoId)?.nome : null)
    .filter(Boolean)
  const luogoNome = luoghiNomi.length > 0 ? luoghiNomi.join(', ') : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Barra ricerca sticky */}
      <div style={{
        padding: '12px 16px', background: 'var(--prox-surface)',
        borderBottom: '1px solid var(--prox-line2)',
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Cerca nome, soprannome, tag…"
        />
        <p style={{ fontSize: 12, color: 'var(--prox-ink3)', margin: '8px 0 0' }}>
          {nSel === 0
            ? 'Opzionale — puoi saltare questo step'
            : `${nSel} person${nSel === 1 ? 'a selezionata' : 'e selezionate'}`}
        </p>
      </div>

      {/* Suggerite dal luogo */}
      {suggeriteFiltrate.length > 0 && (
        <>
          <SectionDivider
            label={luogoNome ? `Frequentano ${luogoNome}` : 'Frequenti in questo luogo'}
          />
          {suggeriteFiltrate.map(p => (
            <PersonaRow
              key={p.id}
              persona={p}
              score={p.score}
              selected={form.personeIds.includes(p.id)}
              onToggle={() => togglePersona(p.id)}
            />
          ))}
        </>
      )}

      {/* Tutte le altre */}
      {altreFiltrate.length > 0 && (
        <>
          <SectionDivider label={suggeriteFiltrate.length > 0 ? 'Altre persone' : 'Persone'} />
          {altreFiltrate.map(p => (
            <PersonaRow
              key={p.id}
              persona={p}
              score={0}
              selected={form.personeIds.includes(p.id)}
              onToggle={() => togglePersona(p.id)}
            />
          ))}
        </>
      )}

      {suggeriteFiltrate.length === 0 && altreFiltrate.length === 0 && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>
          Nessun risultato per "{query}"
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  )
}

// ─── STEP 5: NOTE & RIEPILOGO ──────────────────────────────────────────────

function StepNote({ form, set }: { form: WizardState; set: SetFn }) {
  const luoghiRep = form.soste.length === 0
    ? 'Nessuno'
    : form.soste.map(s => {
        const n = s.luogoId ? (MOCK_LUOGHI.find(l => l.id === s.luogoId)?.nome ?? '?') : 'Esterno'
        return `${n} ${s.dalle}–${s.alle}`
      }).join(', ')
  const nPers = form.personeIds.length

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StepIntro>Aggiungi le note di rendicontazione.</StepIntro>

      <textarea
        value={form.note}
        onChange={e => set('note', e.target.value)}
        placeholder="Osservazioni, contesto, bisogni emersi, follow-up…"
        rows={5}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1.5px solid var(--prox-line)', borderRadius: 12,
          padding: '12px 14px', fontSize: 14, color: 'var(--prox-ink)',
          background: 'var(--prox-surface)', resize: 'vertical', outline: 'none',
          fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--prox-accent)'}
        onBlur={e  => e.target.style.borderColor = 'var(--prox-line)'}
      />

      {/* Riepilogo */}
      <div style={{
        background: 'var(--prox-surface)',
        borderRadius: 14, border: '1px solid var(--prox-line2)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px 8px' }}>
          <span className="prox-label">Riepilogo</span>
        </div>
        <RRow label="Tipo"    value={form.tipo ? tipoLabel(form.tipo) : '—'} />
        <RRow label="Data"    value={form.data
          ? new Date(form.data + 'T00:00:00').toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })
          : '—'} />
        <RRow label="Orario"  value={form.oraInizio
          ? `${form.oraInizio} → ${calcFine(form.oraInizio, form.durata)}`
          : '—'} />
        <RRow label="Durata"  value={minToLabel(form.durata)} />
        <RRow label="Luoghi"  value={luoghiRep} />
        <RRow label="Persone" value={nPers === 0 ? 'Nessuna' : `${nPers} person${nPers === 1 ? 'a' : 'e'}`} last />
      </div>
    </div>
  )
}

// ─── COMPONENTI CONDIVISI ──────────────────────────────────────────────────

function ProgressBar({ current, total, created }: { current: number; total: number; created?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done    = i < current
        const active  = i === current
        const isPost  = created && i > STEP_CREA   // step di arricchimento
        const color   = isPost
          ? (done ? 'var(--prox-ok)' : active ? 'var(--prox-ok)' : 'oklch(0.92 0.05 155)')
          : (i <= current ? 'var(--prox-accent)' : 'var(--prox-line)')
        return (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: color,
            transition: 'background 0.25s',
          }} />
        )
      })}
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--prox-surface2)', borderRadius: 12,
      padding: '9px 12px', border: '1px solid var(--prox-line)',
    }}>
      <Search size={15} color="var(--prox-ink3)" strokeWidth={1.75} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', background: 'none',
          fontSize: 14, color: 'var(--prox-ink)', outline: 'none',
        }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--prox-ink3)', lineHeight: 1, padding: 0,
        }}>×</button>
      )}
    </div>
  )
}

function GpsBanner({ icon, color, children }: {
  icon: React.ReactNode; color: string; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      marginTop: 8, fontSize: 12, color, fontWeight: 500,
    }}>
      {icon}{children}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 16px 6px',
      background: 'var(--prox-bg)',
    }}>
      <span className="prox-label">{label}</span>
    </div>
  )
}


function PersonaRow({ persona, score, selected, onToggle }: {
  persona: typeof MOCK_PERSONE[0]
  score: number
  selected: boolean
  onToggle: () => void
}) {
  const nome = persona.anonimo
    ? (persona.soprannome ? `"${persona.soprannome}"` : '—')
    : (persona.nome ?? '—')

  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px', width: '100%',
      background: selected ? 'var(--prox-accent-soft)' : 'var(--prox-surface)',
      border: 'none', borderBottom: '1px solid var(--prox-line2)',
      cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
    }}>
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? 'var(--prox-accent)' : 'var(--prox-line)'}`,
        background: selected ? 'var(--prox-accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>

      <Avatar nome={persona.anonimo ? persona.soprannome : persona.nome} anonimo={persona.anonimo} size={36} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: selected ? 'var(--prox-accent-ink)' : 'var(--prox-ink)',
        }}>{nome}</div>
        {persona.tag && persona.tag.length > 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>
            {persona.tag.slice(0, 2).join(' · ')}
          </div>
        )}
      </div>

      {/* Badge eventi nel luogo */}
      {score > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 600, fontFamily: 'ui-monospace, monospace',
          color: 'var(--prox-accent-ink)', flexShrink: 0,
          background: 'var(--prox-accent-soft)', borderRadius: 999, padding: '2px 8px',
        }}>
          {score} ev.
        </span>
      )}
    </button>
  )
}

function RRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '10px 16px', fontSize: 13,
      borderTop: '1px solid var(--prox-line2)',
      borderBottomLeftRadius: last ? 14 : 0,
      borderBottomRightRadius: last ? 14 : 0,
    }}>
      <span style={{ color: 'var(--prox-ink3)' }}>{label}</span>
      <span style={{ color: 'var(--prox-ink)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function StepIntro({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: 'var(--prox-ink3)', marginBottom: 16, lineHeight: 1.5 }}>
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="prox-label" style={{ display: 'block', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}

// ─── stili costanti ────────────────────────────────────────────────────────

const ghostBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  background: 'none', border: 'none',
  cursor: 'pointer', color: 'var(--prox-ink2)', padding: 4, borderRadius: 8,
}

const backBtn: React.CSSProperties = {
  flex: 1, padding: '13px 0', borderRadius: 999,
  background: 'var(--prox-surface2)', border: '1px solid var(--prox-line)',
  color: 'var(--prox-ink2)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
}

const continueBtn: React.CSSProperties = {
  flex: 2, padding: '13px 0', borderRadius: 999, border: 'none',
  fontSize: 15, fontWeight: 700, transition: 'background 0.15s',
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.5px solid var(--prox-line)', borderRadius: 12,
  padding: '12px 14px', fontSize: 15, color: 'var(--prox-ink)',
  background: 'var(--prox-surface)', outline: 'none',
  fontFamily: "'Inter', sans-serif", appearance: 'none',
}
