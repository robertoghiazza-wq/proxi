// Pannelli della sezione Report: resoconto settimanale, estratti di eventi, invio automatico, registro degli invii

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Send, Copy, Check } from 'lucide-react'
import { Card } from './Card'
import { ChipsInput } from './ChipsInput'
import { DateField } from './DateFields'
import { InviaReportModal } from './InviaReportModal'
import { OpzioniReport } from './OpzioniReport'
import { ReportView } from './ReportView'
import { Titolo, BarraSalva, campo, vuoto, btn, etichetta } from './SchedaUi'
import {
  useReportSettimana, useReportEstratto, scaricaPdfReport, useInviaSettimana, useInviaEstratto,
  useAutomatico, useGestioneAutomatico, useInvii, type OpzioniReport as Opz, type DocumentoReport,
} from '../hooks/useReport'
import { useEventi } from '../hooks/useEventi'
import { useTipiEvento } from '../hooks/useTipi'
import { useRuolo } from '../hooks/useAuth'
import { eAdmin } from '../lib/ruoli'
import { etichettaSettimana, settimanaIso, spostaSettimana } from '../lib/settimana'
import { CampoRicerca, ConteggioRisultati } from './CampoRicerca'
import { useRicercaEstesa } from '../hooks/useRicerca'

const OPZ_PREDEFINITE: Opz = { nomi: 'completi', racconto: true }

function AzioniDocumento({ doc, onPdf, onInvia, occupato }: { doc?: DocumentoReport; onPdf: () => void; onInvia: () => void; occupato: boolean }) {
  const vuotoDoc = !doc || doc.totali.eventi === 0
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={onPdf} disabled={vuotoDoc || occupato || doc?.pdf_disponibile === false} style={{ ...btn, display: 'flex', alignItems: 'center', gap: 6, opacity: vuotoDoc ? 0.5 : 1 }}>
        <Download size={15} /> Scarica PDF
      </button>
      <button onClick={onInvia} disabled={vuotoDoc} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: vuotoDoc ? 0.5 : 1,
      }}><Send size={15} /> Invia per e-mail</button>
      {doc && doc.pdf_disponibile === false && <div style={{ ...etichetta, flexBasis: '100%', color: 'var(--prox-danger)' }}>La libreria PDF non è ancora installata sul server: il PDF non è disponibile (l'invio mette il resoconto nel corpo dell'e-mail).</div>}
    </div>
  )
}

// ─── Settimanale ──────────────────────────────────────────────────────────

export function PannelloSettimanale() {
  const [sett, setSett] = useState(() => settimanaIso(new Date()))
  const [opz, setOpz] = useState<Opz>(OPZ_PREDEFINITE)
  const [modal, setModal] = useState(false)
  const [errore, setErrore] = useState('')
  const [scarico, setScarico] = useState(false)
  const { data: doc, isLoading, error } = useReportSettimana(sett.anno, sett.settimana, opz)
  const invia = useInviaSettimana(sett.anno, sett.settimana, opz)
  const corrente = settimanaIso(new Date())
  const eCorrente = corrente.anno === sett.anno && corrente.settimana === sett.settimana

  async function pdf() {
    setErrore(''); setScarico(true)
    try { await scaricaPdfReport(`/report/settimana/pdf?anno=${sett.anno}&settimana=${sett.settimana}&nomi=${opz.nomi}&racconto=${opz.racconto ? 1 : 0}`, `Resoconto-settimana-${sett.settimana}-${sett.anno}.pdf`) }
    catch (e) { setErrore((e as Error).message) } finally { setScarico(false) }
  }

  return (
    <>
      <Card padding="10px 12px">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setSett(s => spostaSettimana(s.anno, s.settimana, -1))} aria-label="Settimana precedente" style={frecciaStile}><ChevronLeft size={20} /></button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="prox-display" style={{ fontSize: 16, fontWeight: 700 }}>Settimana {sett.settimana} · {sett.anno}</div>
            <div style={{ fontSize: 12, color: 'var(--prox-ink3)' }}>{etichettaSettimana(sett.anno, sett.settimana)}</div>
          </div>
          <button onClick={() => setSett(s => spostaSettimana(s.anno, s.settimana, 1))} aria-label="Settimana successiva" style={frecciaStile}><ChevronRight size={20} /></button>
        </div>
        {!eCorrente && <button onClick={() => setSett(corrente)} style={{ display: 'block', margin: '6px auto 0', border: 'none', background: 'none', color: 'var(--prox-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Vai alla settimana corrente</button>}
      </Card>

      <OpzioniReport valore={opz} onChange={setOpz} />
      <AzioniDocumento doc={doc} onPdf={pdf} onInvia={() => setModal(true)} occupato={scarico} />
      {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}

      {isLoading && <Card padding="14px 16px"><p style={vuoto}>Caricamento…</p></Card>}
      {error && <Card padding="14px 16px"><p style={{ ...vuoto, color: 'var(--prox-danger)' }}>{(error as Error).message}</p></Card>}
      {doc && <ReportView doc={doc} />}

      <InviaReportModal aperto={modal} onChiudi={() => setModal(false)} titolo={doc?.titolo ?? 'Resoconto settimanale'} opz={opz}
        invia={p => invia.mutateAsync(p)} inviando={invia.isPending} />
    </>
  )
}

const frecciaStile: React.CSSProperties = { width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }

// ─── Estratti ─────────────────────────────────────────────────────────────

const oggi = () => new Date().toISOString().slice(0, 10)
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

export function PannelloEstratti({ eventoIniziale }: { eventoIniziale?: number }) {
  const { data: eventi = [], isLoading } = useEventi({ stato: 'completato' })
  const { label } = useTipiEvento()
  const [dal, setDal] = useState(giorniFa(30))
  const [al, setAl] = useState(oggi())
  const [cerca, setCerca] = useState('')
  const [scelti, setScelti] = useState<number[]>(eventoIniziale ? [eventoIniziale] : [])
  const [opz, setOpz] = useState<Opz>({ nomi: 'iniziali', racconto: false })
  const [modal, setModal] = useState(false)
  const [errore, setErrore] = useState('')

  // con un evento preselezionato (dalla sua scheda) l'elenco parte dal suo giorno
  useEffect(() => {
    if (!eventoIniziale) return
    const e = eventi.find(x => x.id === eventoIniziale)
    if (e) { setDal(e.data.slice(0, 10)); setAl(e.data.slice(0, 10)) }
  }, [eventoIniziale, eventi.length])

  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const trovati = useRicercaEstesa('eventi', cerca)
  const visibili = useMemo(() => eventi.filter(e => {
    const d = e.data.slice(0, 10)
    if (d < dal || d > al) return false
    if (!cerca.trim()) return true
    if (trovati) return trovati.has(e.id)
    return norm([label(e.tipo), e.luogo?.nome, e.note].filter(Boolean).join(' ')).includes(norm(cerca.trim()))
  }), [eventi, dal, al, cerca, trovati])

  const idsScelti = scelti.filter(id => eventi.some(e => e.id === id))
  const { data: doc } = useReportEstratto(idsScelti, opz)
  const invia = useInviaEstratto(idsScelti, opz)
  const tuttiSelezionati = visibili.length > 0 && visibili.every(e => scelti.includes(e.id))

  async function pdf() {
    setErrore('')
    try { await scaricaPdfReport('/report/estratto/pdf', 'Estratto-eventi.pdf', { ids: idsScelti, ...opz }) } catch (e) { setErrore((e as Error).message) }
  }

  return (
    <>
      <Card padding="12px 14px">
        <Titolo titolo="Scegli gli eventi" conto={idsScelti.length} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={etichetta}>Dal</span><DateField value={dal} onChange={e => setDal(e.target.value || dal)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={etichetta}>al</span><DateField value={al} onChange={e => setAl(e.target.value || al)} /></div>
          <CampoRicerca value={cerca} onChange={setCerca} placeholder="Cerca tipo, luogo, nota…" fondo="surface2" style={{ flex: 1, minWidth: 160 }} />
        </div>
        {!isLoading && <ConteggioRisultati mostrati={visibili.length} totali={eventi.length} singolare="evento" plurale="eventi" style={{ marginTop: -2, marginBottom: 4 }} />}
        {isLoading && <p style={vuoto}>Caricamento…</p>}
        {!isLoading && visibili.length === 0 && <p style={vuoto}>Nessun evento svolto nel periodo.</p>}
        {visibili.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={tuttiSelezionati} style={{ accentColor: 'var(--prox-accent)', width: 17, height: 17 }}
              onChange={e => setScelti(s => e.target.checked ? [...new Set([...s, ...visibili.map(x => x.id)])] : s.filter(id => !visibili.some(x => x.id === id)))} />
            Seleziona tutti ({visibili.length})
          </label>
        )}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {visibili.map(e => (
            <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--prox-line2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={scelti.includes(e.id)} style={{ accentColor: 'var(--prox-accent)', width: 17, height: 17, flexShrink: 0 }}
                onChange={ev => setScelti(s => ev.target.checked ? [...s, e.id] : s.filter(x => x !== e.id))} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label(e.tipo)} <span style={{ fontWeight: 400, color: 'var(--prox-ink3)' }}>· {new Date(e.data.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-CH', { weekday: 'short', day: 'numeric', month: 'short' })}{e.ora_inizio ? ` ${e.ora_inizio.slice(0, 5)}` : ''}</span></div>
                <div style={{ fontSize: 12, color: 'var(--prox-ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[e.luogo?.nome, e.persone?.length ? `${e.persone.length} persone` : null].filter(Boolean).join(' · ')}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <OpzioniReport valore={opz} onChange={setOpz} />
      <AzioniDocumento doc={idsScelti.length ? doc : undefined} onPdf={pdf} onInvia={() => setModal(true)} occupato={false} />
      {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}
      {idsScelti.length === 0 && <div style={etichetta}>Per i partner esterni il predefinito è: nomi ridotti alle iniziali e senza il racconto.</div>}
      {idsScelti.length > 0 && doc && <ReportView doc={doc} />}

      <InviaReportModal aperto={modal} onChiudi={() => setModal(false)} titolo={doc?.titolo ?? 'Estratto di eventi'} opz={opz}
        invia={p => invia.mutateAsync(p)} inviando={invia.isPending} />
    </>
  )
}

// ─── Invio automatico ─────────────────────────────────────────────────────

const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']

export function PannelloAutomatici() {
  const { data, isLoading } = useAutomatico()
  const g = useGestioneAutomatico()
  const ruolo = useRuolo()
  const [bozza, setBozza] = useState<{ attivo: boolean; giorno: number; ora: number; destinatari: string[]; nomi: Opz['nomi']; racconto: boolean; oggetto: string; messaggio: string } | null>(null)
  const [errore, setErrore] = useState('')
  const [copiato, setCopiato] = useState(false)

  useEffect(() => {
    if (data && !bozza) setBozza({ attivo: data.attivo, giorno: data.giorno, ora: data.ora, destinatari: data.destinatari, nomi: data.nomi, racconto: data.racconto, oggetto: data.oggetto ?? '', messaggio: data.messaggio ?? '' })
  }, [data])

  if (isLoading || !data || !bozza) return <Card padding="14px 16px"><p style={vuoto}>Caricamento…</p></Card>
  const b = bozza
  const set = (p: Partial<typeof b>) => setBozza({ ...b, ...p })
  const modificato = JSON.stringify({ ...b, oggetto: b.oggetto || null, messaggio: b.messaggio || null }) !== JSON.stringify({ attivo: data.attivo, giorno: data.giorno, ora: data.ora, destinatari: data.destinatari, nomi: data.nomi, racconto: data.racconto, oggetto: data.oggetto, messaggio: data.messaggio })

  function salva() {
    setErrore('')
    g.salva.mutate({ ...b, oggetto: b.oggetto.trim() || null, messaggio: b.messaggio.trim() || null }, { onError: e => setErrore((e as Error).message) })
  }

  return (
    <>
      <Card padding="14px 16px">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={b.attivo} onChange={e => set({ attivo: e.target.checked })} style={{ accentColor: 'var(--prox-accent)', width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Invia ogni settimana il resoconto della settimana appena finita</div>
            <div style={etichetta}>{data.ultima_settimana ? `Ultimo invio: settimana ${data.ultima_settimana.replace('-W', ' · ')}` : 'Non è ancora stato inviato nulla.'}</div>
          </div>
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
          <span style={etichetta}>Ogni</span>
          <select value={b.giorno} onChange={e => set({ giorno: Number(e.target.value) })} style={{ ...campo, width: 'auto', appearance: 'auto', padding: '8px 10px' }}>
            {GIORNI.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
          </select>
          <span style={etichetta}>alle</span>
          <select value={b.ora} onChange={e => set({ ora: Number(e.target.value) })} style={{ ...campo, width: 'auto', appearance: 'auto', padding: '8px 10px' }}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="prox-label" style={{ marginBottom: 6 }}>Destinatari</div>
          <ChipsInput values={b.destinatari} onChange={d => set({ destinatari: d })} placeholder="nome@partner.ch" />
        </div>

        <div style={{ marginTop: 14 }}><OpzioniReport valore={{ nomi: b.nomi, racconto: b.racconto }} onChange={o => set(o)} /></div>

        <div style={{ marginTop: 14 }}>
          <div className="prox-label" style={{ marginBottom: 6 }}>Oggetto (facoltativo)</div>
          <input value={b.oggetto} onChange={e => set({ oggetto: e.target.value })} style={campo} placeholder="Resoconto settimanale … – nome dell'ente" maxLength={200} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="prox-label" style={{ marginBottom: 6 }}>Messaggio (facoltativo)</div>
          <textarea value={b.messaggio} onChange={e => set({ messaggio: e.target.value })} rows={3} style={{ ...campo, resize: 'vertical' }} maxLength={3000} />
        </div>
      </Card>

      {modificato && <BarraSalva errore={errore} caricamento={g.salva.isPending} onSalva={salva} onAnnulla={() => { setBozza(null); setErrore('') }} />}
      {!modificato && errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}

      <Card padding="14px 16px">
        <Titolo titolo="Attività pianificata sul server" />
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--prox-ink2)', lineHeight: 1.55 }}>
          L'invio parte quando il server chiama l'indirizzo qui sotto. In Plesk: <strong>Attività pianificate → Aggiungi attività → tipo «Recupera URL»</strong>, ripetuta <strong>ogni ora</strong>. Il resoconto parte una sola volta per settimana, al primo passaggio dopo l'orario scelto.
        </p>
        {data.url_attivita ? (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input readOnly value={data.url_attivita} style={{ ...campo, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }} onFocus={e => e.target.select()} />
              <button onClick={() => { navigator.clipboard?.writeText(data.url_attivita!); setCopiato(true); setTimeout(() => setCopiato(false), 2000) }} style={{ ...btn, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {copiato ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <div style={{ ...etichetta, marginTop: 8 }}>L'indirizzo contiene una chiave segreta: non condividerlo. Se serve, <button onClick={() => g.nuovaChiave.mutate()} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--prox-accent)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>generane una nuova</button> (e aggiorna l'attività).</div>
          </>
        ) : eAdmin(ruolo) ? (
          <button onClick={() => g.nuovaChiave.mutate()} disabled={g.nuovaChiave.isPending} style={btn}>{g.nuovaChiave.isPending ? 'Genero…' : 'Genera l\'indirizzo dell\'attività'}</button>
        ) : (
          <p style={vuoto}>{data.chiave_presente ? 'L\'indirizzo è visibile solo a un admin.' : 'Un admin deve generare l\'indirizzo dell\'attività.'}</p>
        )}
      </Card>
    </>
  )
}

// ─── Registro ─────────────────────────────────────────────────────────────

export function PannelloInvii() {
  const { data = [], isLoading } = useInvii()
  if (isLoading) return <Card padding="14px 16px"><p style={vuoto}>Caricamento…</p></Card>
  if (data.length === 0) return <Card padding="14px 16px"><p style={vuoto}>Nessun invio ancora.</p></Card>
  const colore = { ok: 'var(--prox-ok)', errore: 'var(--prox-danger)', saltato: 'var(--prox-ink3)' } as const
  const etichettaEsito = { ok: 'Inviato', errore: 'Non riuscito', saltato: 'Saltato' } as const
  return (
    <Card padding="4px 14px">
      {data.map((i, k) => (
        <div key={i.id} style={{ padding: '10px 0', borderTop: k ? '1px solid var(--prox-line2)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{i.tipo === 'settimana' ? 'Resoconto' : i.tipo === 'estratto' ? 'Estratto' : 'Automatico'} · {i.riferimento}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: colore[i.esito] }}>{etichettaEsito[i.esito]}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 2 }}>
            {new Date(i.created_at).toLocaleString('it-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {i.user?.name ?? 'attività pianificata'} · a {i.destinatari.join(', ')}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)' }}>nomi: {i.nomi}{i.racconto ? ' · con racconto' : ' · senza racconto'}{i.con_pdf ? '' : ' · senza PDF'}</div>
          {i.dettaglio && <div style={{ fontSize: 12, color: i.esito === 'errore' ? 'var(--prox-danger)' : 'var(--prox-ink3)', marginTop: 2 }}>{i.dettaglio}</div>}
        </div>
      ))}
    </Card>
  )
}
