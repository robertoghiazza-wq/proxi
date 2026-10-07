// Impostazioni · Importazioni (solo admin): luoghi da un CSV pulito. Prima si controlla, poi si conferma.

import { useRef, useState } from 'react'
import { Upload, Download, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from './Card'
import { Titolo, btn, etichetta, vuoto } from './SchedaUi'
import { api } from '../lib/api-client'
import { useRuolo } from '../hooks/useAuth'
import { eAdmin } from '../lib/ruoli'

interface Esito {
  applicato: boolean
  righe: number
  nuovi: number
  aggiornati: number
  servizi_nuovi: string[]
  da_archiviare: { id: number; nome: string; eventi: number }[]
  da_controllare: number
  errori: string[]
  mappa?: { id_origine: string; id_proxi: number; nome: string }[]
}

function scaricaMappa(mappa: NonNullable<Esito['mappa']>) {
  const csv = '﻿id_filemaker,id_proxi,nome\n' + mappa.map(m => `${m.id_origine},${m.id_proxi},"${m.nome.replace(/"/g, '""')}"`).join('\n') + '\n'
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'mappa_id_proxi.csv'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function ImportazioniPanel() {
  const ruolo = useRuolo()
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sostituisci, setSostituisci] = useState(true)
  const [esito, setEsito] = useState<Esito | null>(null)
  const [errore, setErrore] = useState('')

  const invia = useMutation({
    mutationFn: ({ conferma }: { conferma: boolean }) => {
      const f = new FormData()
      f.append('file', file!)
      f.append('conferma', conferma ? '1' : '0')
      f.append('sostituisci', sostituisci ? '1' : '0')
      return api.upload<Esito>('/importazioni/luoghi', f)
    },
    onSuccess: e => {
      setEsito(e)
      if (e.applicato) ['luoghi', 'servizi', 'eventi'].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
    },
    onError: e => setErrore((e as Error).message),
  })

  if (!eAdmin(ruolo)) return <Card padding="12px 16px"><p style={vuoto}>Le importazioni le può fare solo un admin.</p></Card>

  const scegli = (f?: File) => { setFile(f ?? null); setEsito(null); setErrore('') }

  return (
    <>
      <Card padding="14px 16px">
        <Titolo titolo="Luoghi da CSV" />
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--prox-ink2)', lineHeight: 1.55 }}>
          Carica il file <strong>luoghi_puliti.csv</strong>. Prima vedi cosa succederebbe, poi confermi. Si può ripetere: i luoghi già importati si aggiornano e non si duplicano.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => input.current?.click()} style={{ ...btn, display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={15} /> {file ? 'Cambia file' : 'Scegli il file'}</button>
          {file && <span style={{ fontSize: 13, color: 'var(--prox-ink2)' }}>{file.name}</span>}
          <input ref={input} type="file" hidden accept=".csv,text/csv" onChange={e => { scegli(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, fontSize: 13.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={sostituisci} onChange={e => { setSostituisci(e.target.checked); setEsito(null) }} style={{ accentColor: 'var(--prox-accent)', width: 17, height: 17, marginTop: 2 }} />
          <span>Archivia i luoghi già presenti che non vengono dal file (per esempio quelli di prova)<div style={etichetta}>Non si cancellano: restano nel log.</div></span>
        </label>
        <button onClick={() => { setErrore(''); invia.mutate({ conferma: false }) }} disabled={!file || invia.isPending} style={{
          marginTop: 14, padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', opacity: !file || invia.isPending ? 0.5 : 1,
        }}>{invia.isPending && !esito ? 'Controllo…' : 'Controlla il file'}</button>
        {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)', marginTop: 10 }}>{errore}</div>}
      </Card>

      {esito && (
        <Card padding="14px 16px">
          <Titolo titolo={esito.applicato ? 'Importazione completata' : 'Cosa succederebbe'} />
          {esito.applicato && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--prox-ok)', fontWeight: 600, marginBottom: 10 }}><CheckCircle2 size={18} /> Fatto</div>}
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
            <li><strong>{esito.nuovi}</strong> luoghi {esito.applicato ? 'creati' : 'nuovi'}, <strong>{esito.aggiornati}</strong> {esito.applicato ? 'aggiornati' : 'da aggiornare'} (su {esito.righe} righe)</li>
            {esito.servizi_nuovi.length > 0 && <li>{esito.applicato ? 'Servizi creati' : 'Servizi che verranno creati'} come ente di riferimento: {esito.servizi_nuovi.join(', ')}</li>}
            {esito.da_archiviare.length > 0 && <li>{esito.applicato ? 'Archiviati' : 'Verranno archiviati'}: {esito.da_archiviare.map(a => `${a.nome}${a.eventi ? ` (${a.eventi} ${a.eventi === 1 ? 'evento' : 'eventi'})` : ''}`).join(', ')}</li>}
            <li>{esito.da_controllare} luoghi hanno la posizione da controllare (segnati nella scheda del luogo)</li>
          </ul>
          {esito.errori.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}><AlertTriangle size={15} /> Da correggere nel file</div>
              {esito.errori.slice(0, 12).map((e, i) => <div key={i}>{e}</div>)}
              {esito.errori.length > 12 && <div>… e altri {esito.errori.length - 12}</div>}
            </div>
          )}
          {!esito.applicato && esito.errori.length === 0 && (
            <button onClick={() => invia.mutate({ conferma: true })} disabled={invia.isPending} style={{
              marginTop: 14, padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', opacity: invia.isPending ? 0.6 : 1,
            }}>{invia.isPending ? 'Importo…' : `Importa ${esito.righe} luoghi`}</button>
          )}
          {esito.applicato && esito.mappa && (
            <>
              <button onClick={() => scaricaMappa(esito.mappa!)} style={{ ...btn, marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={15} /> Scarica la mappa degli id (CSV)</button>
              <div style={{ ...etichetta, marginTop: 8 }}>Collega ogni id di FileMaker al luogo di Proxi. Gli id restano anche nel database: serviranno per ricollegare eventi e relazioni.</div>
            </>
          )}
        </Card>
      )}
    </>
  )
}
