// Tipi condivisi — specchio dei modelli Laravel

export type Role = 'educatore' | 'coordinatore' | 'admin' | 'superadmin'

export interface Institution {
  id: number
  name: string
  slug: string
  accent_color: string
  logo_path: string | null
  active: boolean
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

export interface Persona {
  id: number
  institution_id: number
  ruolo: RuoloPersona
  nome: string | null
  soprannome: string | null
  anonimo: boolean
  eta: number | null
  sesso: 'M' | 'F' | 'altro' | null
  lingue: string[] | null
  tag: string[] | null
  bisogni: string[] | null
  note: string | null
  telefono: string | null
  email: string | null
  // calcolato/caricato dal backend
  eventi_count?: number
  eventi?: Evento[]
}

export type TipoLuogo = 'strada' | 'informale' | 'diurno' | 'sanitario' | 'ufficio'

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
  // calcolati
  persone_count?: number
  eventi_settimana?: number
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
