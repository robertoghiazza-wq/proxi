// Tipi condivisi — specchio dei modelli Laravel

export type Role = 'educatore' | 'coordinatore' | 'admin' | 'superadmin'

export interface Institution {
  id: number
  name: string
  slug: string
  accent_color: string
  logo_path?: string | null
  ha_logo?: boolean
  updated_at?: string
  active?: boolean
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
  institution_id: number | null
  institution?: Institution
  lingue: string[] | null
}

export type RuoloPersona = 'utente' | 'dipendente' | 'rete'

export interface Ruolo {
  id: number
  nome_m: string
  nome_f: string | null
  nome_misto: string | null
  ordine: number
}

export interface Telefono {
  etichetta: string | null
  numero: string
}

export interface Persona {
  id: number
  institution_id: number
  ruolo: RuoloPersona
  ruolo_id?: number | null
  nome: string | null
  cognome?: string | null
  soprannome: string | null
  anonimo: boolean
  data_nascita?: string | null
  eta: number | null
  sesso: 'M' | 'F' | 'altro' | null
  lingue: string[] | null
  tag: string[] | null
  bisogni: string[] | null
  note: string | null
  telefono: string | null
  telefoni?: Telefono[]
  email: string | null
  indirizzo?: string | null
  npa?: string | null
  localita?: string | null
  comune_politico?: string | null
  bfs?: string | null
  cantone?: string | null
  paese?: string | null
  note_contatti?: string | null
  ha_foto?: boolean
  updated_at?: string
  // calcolato/caricato dal backend
  eventi_count?: number
  eventi?: Evento[]
  servizi?: Pick<Servizio, 'id' | 'nome' | 'localita'>[]
}

export type TipoLuogo = string

export interface Luogo {
  id: number
  institution_id: number
  nome: string
  tipo: TipoLuogo
  indirizzo: string | null
  orari: string | null
  note: string | null
  lat: number | null
  lng: number | null
  attivo: boolean
  visibilita?: 'pubblico' | 'riservato'
  punto_esatto?: string | null
  servizio_id?: number | null
  servizio?: { id: number; nome: string } | null
  npa?: string | null
  localita?: string | null
  comune_politico?: string | null
  bfs?: string | null
  cantone?: string | null
  // calcolati
  persone_count?: number
  eventi_settimana?: number
  eventi_totali?: number
}

export interface Servizio {
  id: number
  institution_id: number
  nome: string
  indirizzo: string | null
  cap: string | null
  localita: string | null
  paese: string | null
  telefono: string | null
  email: string | null
  sito: string | null
  note: string | null
  lat: number | null
  lng: number | null
  attivo: boolean
  comune_politico?: string | null
  bfs?: string | null
  cantone?: string | null
  persone_count?: number
  persone?: (Pick<Persona, 'id' | 'nome' | 'cognome' | 'soprannome' | 'anonimo' | 'ruolo' | 'telefono' | 'email'> & {
    pivot: { ruolo: string | null; principale: boolean }
  })[]
}

export interface Vocabolo {
  id: number
  categoria: string
  valore: string
  ordine: number
}

export interface Sostanza {
  sostanza: string | null
  con_chi: string | null
  frequenza: string | null
  abuso: string | null
  note: string | null
}

export interface ProfiloUtente {
  situazione_familiare: string | null
  fratelli: string | null
  modalita_educativa: string | null
  liberta_uscita: string | null
  origine: string | null
  madrelingua: string | null
  formazione_madre: string | null
  formazione_padre: string | null
  patente: string | null
  occupazione: string | null
  sport_hobby: string | null
  storia_familiare: string | null
  storia_scolastica: string | null
  storia_medica: string | null
  progetti_interventi: string | null
}

export interface VoceDiario {
  id: number
  data: string
  nota: string
  autore_id: number | null
  autore?: { id: number; name: string } | null
}

export interface SchedaUtente {
  profilo: ProfiloUtente
  sostanze: Sostanza[]
  diario: VoceDiario[]
}

export interface Contratto {
  id: number
  stipendio_annuo: string | null
  grado: string | null
  ore_settimanali: string | null
  data_inizio: string
  data_fine: string | null
  iban: string | null
  cassa_malati: string | null
  avs: string | null
  note: string | null
}

export interface AccountPersona {
  id: number
  email: string
  role: Role
  attivo: boolean
  ultimo_accesso_il: string | null
  invito_in_corso: boolean
  invito_scaduto: boolean
  invito_scade_il: string | null
}

export type StatoEvento = 'pianificato' | 'in_corso' | 'completato'

export interface Evento {
  id: number
  institution_id: number
  educatore_id: number
  luogo_id: number | null
  tipo: string
  data: string       // YYYY-MM-DD
  ora_inizio: string | null  // HH:MM
  durata_min: number
  stato: StatoEvento
  note: string | null
  completo?: boolean
  mancanti?: string[]
  persone?: Persona[]
  luogo?: Luogo
  educatore?: User
}

export type CategoriaSpesa = 'pasti' | 'trasporto' | 'materiale' | 'farmacia' | 'altro'
export type MetodoPagamento = 'contanti' | 'carta' | 'twint'

export interface Spesa {
  id: number
  institution_id: number
  educatore_id: number
  persona_id: number | null
  categoria: CategoriaSpesa
  importo: number
  metodo_pagamento: MetodoPagamento
  descrizione: string | null
  scontrino_path: string | null
  rimborsato: boolean
  data: string
  persona?: Persona
}

export interface Veicolo {
  id: number
  institution_id: number
  modello: string
  targa: string
  anno: number | null
  km_attuali: number
  prossima_manutenzione: string | null
  stato: 'disponibile' | 'in_uso' | 'manutenzione'
  attivo: boolean
}

export interface Viaggio {
  id: number
  veicolo_id: number
  conducente_id: number
  data: string
  km_partenza: number
  km_arrivo: number
  motivo: string | null
  veicolo?: Veicolo
  conducente?: User
}

export interface Obiettivo {
  id: number
  institution_id: number
  responsabile_id: number | null
  titolo: string
  descrizione: string | null
  valore_target: number
  valore_attuale: number
  unita: string | null
  scadenza: string | null
  stato: 'in_corso' | 'raggiunto' | 'a_rischio'
  periodo: string | null
  responsabile?: User
}

export interface DocumentoPersona {
  id: number
  persona_id: number
  tipo: string | null
  titolo: string
  note: string | null
  nome_originale: string
  mime: string
  dimensione: number
  caricato_da: number | null
  autore?: { id: number; name: string } | null
  created_at: string
}
