import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, scaricaBlob } from '../lib/api-client'

export type ModoNomi = 'completi' | 'iniziali' | 'nessuno'
export interface OpzioniReport { nomi: ModoNomi; racconto: boolean }

export interface RigaReport {
  id: number
  testo: { quando: string; resto: string; luoghi: string; presenti: string; presenti_dettaglio: string }
  racconto: string | null
}
export interface DocumentoReport {
  titolo: string
  sottotitolo: string | null
  ente: { nome: string; motto: string | null; sito: string | null; logo: string | null }
  privacy: OpzioniReport
  giorni: { data: string; etichetta: string; eventi: RigaReport[] }[]
  totali: { eventi: number; ore: string }
  pdf_disponibile: boolean
}

const qsOpz = (o: OpzioniReport) => `nomi=${o.nomi}&racconto=${o.racconto ? 1 : 0}`

export function useReportSettimana(anno: number, settimana: number, opz: OpzioniReport) {
  return useQuery<DocumentoReport>({
    queryKey: ['report', 'settimana', anno, settimana, opz],
    queryFn: () => api.get(`/report/settimana?anno=${anno}&settimana=${settimana}&${qsOpz(opz)}`),
  })
}

export function useReportEstratto(ids: number[], opz: OpzioniReport) {
  return useQuery<DocumentoReport>({
    queryKey: ['report', 'estratto', [...ids].sort(), opz],
    queryFn: () => api.post('/report/estratto', { ids, ...opz }),
    enabled: ids.length > 0,
  })
}

// Scarica il PDF (richiede il token, quindi si passa da qui e non da un semplice link)
export async function scaricaPdfReport(path: string, nomeFile: string, corpo?: unknown) {
  const blob = await scaricaBlob(path, corpo)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export interface InvioPayload { destinatari: string[]; oggetto?: string; messaggio?: string }
export interface Invio {
  id: number; tipo: string; riferimento: string; destinatari: string[]; nomi: string; racconto: boolean; con_pdf: boolean
  esito: 'ok' | 'errore' | 'saltato'; dettaglio: string | null; created_at: string; user?: { id: number; name: string } | null
}

export function useInviaSettimana(anno: number, settimana: number, opz: OpzioniReport) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: InvioPayload) => api.post<Invio>('/report/settimana/invia', { anno, settimana, ...opz, ...p }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['report-invii'] }),
  })
}

export function useInviaEstratto(ids: number[], opz: OpzioniReport) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: InvioPayload) => api.post<Invio>('/report/estratto/invia', { ids, ...opz, ...p }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['report-invii'] }),
  })
}

export function useInvii() {
  return useQuery<Invio[]>({ queryKey: ['report-invii'], queryFn: () => api.get('/report/invii') })
}

export interface Automatico {
  attivo: boolean; giorno: number; ora: number; destinatari: string[]; nomi: ModoNomi; racconto: boolean
  oggetto: string | null; messaggio: string | null; ultima_settimana: string | null; ultimo_invio_il: string | null
  url_attivita: string | null; chiave_presente: boolean
}

export function useAutomatico() {
  return useQuery<Automatico>({ queryKey: ['report-automatico'], queryFn: () => api.get('/report/automatico') })
}

export function useGestioneAutomatico() {
  const qc = useQueryClient()
  const aggiorna = (a: Automatico) => qc.setQueryData(['report-automatico'], a)
  return {
    salva: useMutation({ mutationFn: (d: Omit<Automatico, 'ultima_settimana' | 'ultimo_invio_il' | 'url_attivita' | 'chiave_presente'>) => api.put<Automatico>('/report/automatico', d), onSuccess: aggiorna }),
    nuovaChiave: useMutation({ mutationFn: () => api.post<Automatico>('/report/automatico/chiave', {}), onSuccess: aggiorna }),
  }
}
