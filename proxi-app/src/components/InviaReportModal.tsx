// Invio di un report per e-mail ai partner (nuova azione = modal)

import { useMemo, useState } from 'react'
import { X, Send, CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal'
import { ChipsInput } from './ChipsInput'
import { campo, btn, etichetta } from './SchedaUi'
import { useInvii, type Invio, type InvioPayload, type OpzioniReport } from '../hooks/useReport'

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function InviaReportModal({ aperto, onChiudi, titolo, opz, invia, inviando }: {
  aperto: boolean
  onChiudi: () => void
  titolo: string
  opz: OpzioniReport
  invia: (p: InvioPayload) => Promise<Invio>
  inviando: boolean
}) {
  const { data: precedenti = [] } = useInvii()
  const suggerimenti = useMemo(() => [...new Set(precedenti.flatMap(i => i.destinatari))].slice(0, 12), [precedenti])
  const [destinatari, setDestinatari] = useState<string[]>([])
  const [oggetto, setOggetto] = useState('')
  const [messaggio, setMessaggio] = useState('')
  const [errore, setErrore] = useState('')
  const [fatto, setFatto] = useState<Invio | null>(null)

  const chiudi = () => { setFatto(null); setErrore(''); onChiudi() }

  async function manda() {
    const sbagliati = destinatari.filter(d => !MAIL.test(d))
    if (destinatari.length === 0) { setErrore('Aggiungi almeno un destinatario (scrivi l\'indirizzo e premi Invio).'); return }
    if (sbagliati.length) { setErrore(`Indirizzo non valido: ${sbagliati.join(', ')}`); return }
    setErrore('')
    try {
      setFatto(await invia({ destinatari, oggetto: oggetto.trim() || undefined, messaggio: messaggio.trim() || undefined }))
    } catch (e) {
      setErrore((e as Error).message || 'Invio non riuscito')
    }
  }

  const riservatezza = [
    opz.nomi === 'completi' ? 'nomi completi' : opz.nomi === 'iniziali' ? 'nomi ridotti alle iniziali' : 'senza nomi',
    opz.racconto ? 'con il racconto' : 'senza il racconto',
  ].join(' · ')

  return (
    <Modal open={aperto} onClose={chiudi}>
      <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
        <div style={{ background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={chiudi} aria-label="Chiudi" style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} strokeWidth={1.75} />
          </button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Invia per e-mail</div>
          <div style={{ width: 36 }} />
        </div>

        {fatto ? (
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
            <CheckCircle2 size={44} color="var(--prox-ok)" strokeWidth={1.5} />
            <div className="prox-display" style={{ fontSize: 18, fontWeight: 700 }}>Inviato a {fatto.destinatari.length} {fatto.destinatari.length === 1 ? 'destinatario' : 'destinatari'}</div>
            {fatto.dettaglio && <div style={{ fontSize: 13, color: 'var(--prox-ink3)', maxWidth: 360 }}>{fatto.dettaglio}</div>}
            <button onClick={chiudi} style={{ ...btn, marginTop: 8 }}>Chiudi</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13.5, color: 'var(--prox-ink2)' }}><strong>{titolo}</strong><div style={etichetta}>Si invia come PDF allegato — {riservatezza}</div></div>
              <div>
                <div className="prox-label" style={{ marginBottom: 6 }}>Destinatari *</div>
                <ChipsInput values={destinatari} onChange={setDestinatari} placeholder="nome@partner.ch" suggestions={suggerimenti} />
                <div style={{ ...etichetta, marginTop: 6 }}>Ognuno riceve un messaggio separato: non vede gli altri indirizzi.</div>
              </div>
              <div>
                <div className="prox-label" style={{ marginBottom: 6 }}>Oggetto</div>
                <input value={oggetto} onChange={e => setOggetto(e.target.value)} placeholder={titolo} style={campo} maxLength={200} />
              </div>
              <div>
                <div className="prox-label" style={{ marginBottom: 6 }}>Messaggio</div>
                <textarea value={messaggio} onChange={e => setMessaggio(e.target.value)} rows={5} style={{ ...campo, resize: 'vertical' }} placeholder={'Buongiorno,\n\nin allegato il resoconto…'} maxLength={3000} />
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
              {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)', marginBottom: 8 }}>{errore}</div>}
              <button onClick={manda} disabled={inviando} style={{
                width: '100%', padding: '13px 0', borderRadius: 999, border: 'none', background: 'var(--prox-accent)', color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', opacity: inviando ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit',
              }}><Send size={16} /> {inviando ? 'Invio…' : 'Invia'}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
