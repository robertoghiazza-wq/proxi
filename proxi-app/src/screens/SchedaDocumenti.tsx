// Tab Documenti di una persona: allegati (PDF, foto, Word...) con tipo, titolo e note

import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon, Plus, Edit, Trash2, X, Paperclip } from 'lucide-react'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Tag } from '../components/Tag'
import { Titolo, BarraSalva, vuoto, campo, etichetta, azione, btn, ghost } from '../components/SchedaUi'
import {
  useDocumenti, useCaricaDocumento, useAggiornaDocumento, useEliminaDocumento, scaricaDocumento,
} from '../hooks/useDocumenti'
import { eImmagine, ridimensiona } from '../lib/immagine'
import type { DocumentoPersona, Persona } from '../types'

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
const data = (d: string) => new Date(d).toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

function icona(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon
  if (mime === 'application/pdf' || mime.startsWith('text/') || mime.includes('word')) return FileText
  if (mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet
  return FileIcon
}

// Foto grandi (anche 5-8 MB dall'iPhone) si riducono prima dell'invio
async function preparaFile(file: File): Promise<File> {
  if (!eImmagine(file)) return file
  try {
    const blob = await ridimensiona(file, 2400, 0.85)
    if (blob.size >= file.size && file.type === 'image/jpeg') return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export function DocumentiPanel({ persona }: { persona: Persona }) {
  const { data: risposta, isLoading, error } = useDocumenti(persona.id)
  const elimina = useEliminaDocumento(persona.id)
  const [nuovo, setNuovo] = useState(false)
  const [modificando, setModificando] = useState<number | null>(null)
  const [daEliminare, setDaEliminare] = useState<DocumentoPersona | null>(null)
  const [immagine, setImmagine] = useState<{ url: string; titolo: string } | null>(null)
  const [errore, setErrore] = useState('')

  if (!risposta) {
    return <Card padding="14px 16px"><p style={vuoto}>{isLoading ? 'Caricamento…' : (error as Error)?.message}</p></Card>
  }
  const { documenti, tipi } = risposta

  async function apri(d: DocumentoPersona) {
    setErrore('')
    // la finestra va aperta subito (prima dell'attesa) o iOS blocca il popup
    const finestra = d.mime === 'application/pdf' ? window.open('', '_blank') : null
    try {
      const blob = await scaricaDocumento(d.id)
      const url = URL.createObjectURL(blob)
      if (d.mime.startsWith('image/')) {
        setImmagine({ url, titolo: d.titolo })
      } else if (finestra) {
        finestra.location.href = url
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = d.nome_originale
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (e) {
      finestra?.close()
      setErrore((e as Error).message)
    }
  }

  return (
    <>
      <Titolo
        titolo="Documenti" conto={documenti.length}
        azione={<button onClick={() => setNuovo(true)} style={azione}><Plus size={14} strokeWidth={2.5} /> Aggiungi</button>}
      />
      {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}
      {documenti.length === 0 && (
        <Card padding="14px 16px"><p style={vuoto}>Nessun documento. Puoi allegare PDF, foto o altri file (max 15 MB).</p></Card>
      )}

      {documenti.map(d => modificando === d.id
        ? <ModificaDocumento key={d.id} doc={d} tipi={tipi} personaId={persona.id} onChiudi={() => setModificando(null)} />
        : (
          <Card key={d.id} padding="12px 14px">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <button onClick={() => apri(d)} style={{ ...ghost, flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: 12, textAlign: 'left', padding: 0, alignItems: 'flex-start' }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 10, background: 'var(--prox-surface2)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--prox-ink2)',
                }}>
                  {(() => { const I = icona(d.mime); return <I size={20} strokeWidth={1.75} /> })()}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--prox-ink)', wordBreak: 'break-word' }}>{d.titolo}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--prox-ink3)', marginTop: 2 }}>
                    {[data(d.created_at), kb(d.dimensione), d.autore?.name].filter(Boolean).join(' · ')}
                  </span>
                  {d.tipo && <span style={{ display: 'inline-block', marginTop: 6 }}><Tag label={d.tipo} soft /></span>}
                  {d.note && <span style={{ display: 'block', fontSize: 13, color: 'var(--prox-ink2)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{d.note}</span>}
                </span>
              </button>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <button onClick={() => setModificando(d.id)} style={ghost} aria-label="Modifica"><Edit size={16} strokeWidth={1.75} /></button>
                <button onClick={() => setDaEliminare(d)} style={{ ...ghost, color: 'var(--prox-danger)' }} aria-label="Elimina"><Trash2 size={16} strokeWidth={1.75} /></button>
              </div>
            </div>
          </Card>
        ))}

      <Modal open={nuovo} onClose={() => setNuovo(false)}>
        <NuovoDocumento persona={persona} tipi={tipi} onChiudi={() => setNuovo(false)} />
      </Modal>

      <ConfirmDialog
        open={!!daEliminare} danger title="Eliminare il documento?"
        message={daEliminare ? `«${daEliminare.titolo}» sparisce dall'elenco; l'eliminazione resta nel log.` : undefined}
        confirmLabel="Elimina" loading={elimina.isPending}
        error={elimina.isError ? (elimina.error as Error).message : null}
        onCancel={() => { setDaEliminare(null); elimina.reset() }}
        onConfirm={() => daEliminare && elimina.mutate(daEliminare.id, { onSuccess: () => setDaEliminare(null) })}
      />

      {immagine && (
        <div onClick={() => { URL.revokeObjectURL(immagine.url); setImmagine(null) }} style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.88)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box',
        }}>
          <button aria-label="Chiudi" style={{ ...ghost, position: 'absolute', top: 'calc(12px + var(--sat))', right: 12, color: '#fff' }}>
            <X size={26} />
          </button>
          <img src={immagine.url} alt={immagine.titolo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
        </div>
      )}
    </>
  )
}

function ModificaDocumento({ doc, tipi, personaId, onChiudi }: { doc: DocumentoPersona; tipi: string[]; personaId: number; onChiudi: () => void }) {
  const aggiorna = useAggiornaDocumento(personaId)
  const [titolo, setTitolo] = useState(doc.titolo)
  const [tipo, setTipo] = useState(doc.tipo ?? '')
  const [note, setNote] = useState(doc.note ?? '')
  const [errore, setErrore] = useState('')

  function salva() {
    if (!titolo.trim()) { setErrore('Il titolo è obbligatorio'); return }
    aggiorna.mutate(
      { id: doc.id, titolo: titolo.trim(), tipo: tipo || null, note: note.trim() || null },
      { onSuccess: onChiudi, onError: e => setErrore((e as Error).message) },
    )
  }

  return (
    <Card padding="14px 16px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CampiDocumento titolo={titolo} setTitolo={setTitolo} tipo={tipo} setTipo={setTipo} note={note} setNote={setNote} tipi={tipi} />
        <BarraSalva errore={errore} caricamento={aggiorna.isPending} onSalva={salva} onAnnulla={onChiudi} />
      </div>
    </Card>
  )
}

function NuovoDocumento({ persona, tipi, onChiudi }: { persona: Persona; tipi: string[]; onChiudi: () => void }) {
  const carica = useCaricaDocumento(persona.id)
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [titolo, setTitolo] = useState('')
  const [tipo, setTipo] = useState('')
  const [note, setNote] = useState('')
  const [errore, setErrore] = useState('')
  const [preparo, setPreparo] = useState(false)

  async function scelto(f: File | undefined) {
    if (!f) return
    setErrore('')
    setPreparo(true)
    const pronto = await preparaFile(f)
    setPreparo(false)
    setFile(pronto)
  }

  async function salva() {
    if (!file) { setErrore('Scegli un file da allegare'); return }
    const form = new FormData()
    form.append('file', file)
    if (tipo) form.append('tipo', tipo)
    if (titolo.trim()) form.append('titolo', titolo.trim())
    if (note.trim()) form.append('note', note.trim())
    carica.mutate(form, { onSuccess: onChiudi, onError: e => setErrore((e as Error).message) })
  }

  return (
    <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
      <div style={{ background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onChiudi} style={{ ...ghost, width: 36, height: 36 }} aria-label="Chiudi"><X size={20} strokeWidth={1.75} /></button>
        <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Nuovo documento</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="prox-label" style={{ marginBottom: 6 }}>File *</div>
          <button onClick={() => input.current?.click()} style={{
            ...btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 12px',
            borderStyle: 'dashed', color: file ? 'var(--prox-ink)' : 'var(--prox-ink2)',
          }}>
            <Paperclip size={16} />
            {preparo ? 'Preparo il file…' : file ? `${file.name} · ${kb(file.size)}` : 'Scegli un file o scatta una foto'}
          </button>
          <input ref={input} type="file" hidden onChange={e => { scelto(e.target.files?.[0]); e.target.value = '' }}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt,image/*" />
          <div style={{ ...etichetta, marginTop: 6 }}>PDF, immagini, Word, Excel o testo · max 15 MB</div>
        </div>

        <CampiDocumento titolo={titolo} setTitolo={setTitolo} tipo={tipo} setTipo={setTipo} note={note} setNote={setNote} tipi={tipi}
          segnaposto={file ? file.name.replace(/\.[^.]+$/, '') : undefined} />
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
        {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)', marginBottom: 8 }}>{errore}</div>}
        <button onClick={salva} disabled={carica.isPending || preparo} style={{
          width: '100%', padding: '13px 0', borderRadius: 999, border: 'none', background: 'var(--prox-accent)', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: carica.isPending || preparo ? 0.6 : 1,
        }}>
          {carica.isPending ? 'Carico…' : 'Allega'}
        </button>
      </div>
    </div>
  )
}

function CampiDocumento({ titolo, setTitolo, tipo, setTipo, note, setNote, tipi, segnaposto }: {
  titolo: string; setTitolo: (v: string) => void; tipo: string; setTipo: (v: string) => void
  note: string; setNote: (v: string) => void; tipi: string[]; segnaposto?: string
}) {
  return (
    <>
      <div>
        <div className="prox-label" style={{ marginBottom: 6 }}>Tipo</div>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...campo, appearance: 'auto' }}>
          <option value="">—</option>
          {tipo && !tipi.includes(tipo) && <option value={tipo}>{tipo}</option>}
          {tipi.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <div className="prox-label" style={{ marginBottom: 6 }}>Titolo</div>
        <input value={titolo} onChange={e => setTitolo(e.target.value)} placeholder={segnaposto ?? 'Es. Certificato medico 2026'} style={campo} />
      </div>
      <div>
        <div className="prox-label" style={{ marginBottom: 6 }}>Note</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...campo, resize: 'vertical' }} />
      </div>
    </>
  )
}
