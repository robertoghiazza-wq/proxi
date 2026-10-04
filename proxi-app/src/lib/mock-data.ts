// Dati mock — port da design_handoff/src/data.jsx
// Usati solo in sviluppo; in produzione arrivano dall'API

import type { Persona, Luogo, Evento, Institution } from '../types'

export const MOCK_INSTITUTION: Institution = {
  id: 1,
  name: 'Prometheus',
  slug: 'prometheus',
  accent_color: '#dc1d27',
  logo_path: null,
  active: true,
}

// ─── Tipi evento a due livelli ────────────────────────────────────────────

export const MACRO_CATEGORIE = [
  { id: 'territorio', label: 'Sul territorio',  hue: 40  },
  { id: 'riunioni',   label: 'Riunioni',        hue: 200 },
  { id: 'interno',    label: 'Lavoro interno',  hue: 160 },
  { id: 'sviluppo',   label: 'Sviluppo prof.',  hue: 280 },
  { id: 'assenze',    label: 'Assenze',         hue: 80  },
] as const

export type MacroId = typeof MACRO_CATEGORIE[number]['id']

export const TIPI_EVENTO: Record<string, { label: string; macro: MacroId }> = {
  // Sul territorio
  uscita:               { label: 'Uscita sul territorio',       macro: 'territorio' },
  mappatura:            { label: 'Mappatura',                   macro: 'territorio' },
  contatti:             { label: 'Contatti',                    macro: 'territorio' },
  incontro_individuale: { label: 'Incontro individuale',        macro: 'territorio' },
  accompagnamento:      { label: 'Accompagnamento individuale', macro: 'territorio' },
  // Riunioni
  riunione_rete:        { label: 'Riunione di rete',            macro: 'riunioni'   },
  riunione_equipe:      { label: 'Riunione équipe',             macro: 'riunioni'   },
  riunione_ist:         { label: 'Riunione istituzionale',      macro: 'riunioni'   },
  incontro_esterno:     { label: 'Incontro esterno',            macro: 'riunioni'   },
  presentazione:        { label: 'Presentazione progetto',      macro: 'riunioni'   },
  // Lavoro interno
  coordinamento:        { label: 'Coordinamento',               macro: 'interno'    },
  progettazione:        { label: 'Progettazione',               macro: 'interno'    },
  ricerca:              { label: 'Attività di ricerca',         macro: 'interno'    },
  manutenzione:         { label: 'Manutenzione veicolo',        macro: 'interno'    },
  acquisti:             { label: 'Acquisti',                    macro: 'interno'    },
  lavoro_generico:      { label: 'Lavoro generico',             macro: 'interno'    },
  inserimento_dati:     { label: 'Inserimento dati',            macro: 'interno'    },
  // Sviluppo professionale
  lavoro_individuale:   { label: 'Lavoro individuale',          macro: 'sviluppo'   },
  formazione:           { label: 'Formazione',                  macro: 'sviluppo'   },
  supervisione:         { label: 'Supervisione',                macro: 'sviluppo'   },
  // Assenze
  recupero_ore:         { label: 'Recupero ore',                macro: 'assenze'    },
  vacanze:              { label: 'Vacanze',                     macro: 'assenze'    },
}

// Helper — accesso alle proprietà dei tipi
export function tipoLabel(id: string): string {
  return TIPI_EVENTO[id]?.label ?? id
}

export function macroForTipo(id: string) {
  const macroId = TIPI_EVENTO[id]?.macro
  return MACRO_CATEGORIE.find(m => m.id === macroId)
}

export function hueForTipo(id: string): number {
  return macroForTipo(id)?.hue ?? 200
}

export function hueToColor(hue: number): string {
  return `oklch(0.62 0.14 ${hue})`
}

export function colorForTipo(id: string): string {
  return hueToColor(hueForTipo(id))
}

// ─── Persone, luoghi, eventi mock ────────────────────────────────────────

export const MOCK_PERSONE: Persona[] = [
  { id: 1, institution_id: 1, ruolo: 'utente',     nome: 'Marco R.',      soprannome: 'Sciacallo',  anonimo: true,  eta: 47, sesso: 'M', lingue: ['IT'],      tag: ['senza fissa dimora','dipendenza'], bisogni: ['alloggio notturno','assistenza sanitaria'], note: 'Zona stazione dal 2022. Preferisce il contatto al mattino presto.', telefono: null, email: null, eventi_count: 32 },
  { id: 2, institution_id: 1, ruolo: 'utente',     nome: 'Aïcha B.',      soprannome: null,         anonimo: false, eta: 28, sesso: 'F', lingue: ['FR','AR'], tag: ['migrante','madre'],               bisogni: ['documenti','pediatra figlia'],             note: 'Incinta al 7° mese. Figlia 4 anni. Collabora con Caritas.',   telefono: null, email: null, eventi_count: 11 },
  { id: 3, institution_id: 1, ruolo: 'utente',     nome: 'Luca P.',       soprannome: null,         anonimo: false, eta: 17, sesso: 'M', lingue: ['IT'],      tag: ['minore','scolastico'],            bisogni: ['supporto scolastico','educativa'],          note: 'Segnalato da scuola Don Milani.',                             telefono: null, email: null, eventi_count: 7  },
  { id: 4, institution_id: 1, ruolo: 'utente',     nome: null,            soprannome: 'Il Polacco', anonimo: true,  eta: 52, sesso: 'M', lingue: ['PL','IT'], tag: ['senza fissa dimora','anziano'],   bisogni: ['pasti caldi','vestiti invernali'],          note: 'Poco disposto al dialogo. Accetta generi alimentari.',        telefono: null, email: null, eventi_count: 18 },
  { id: 5, institution_id: 1, ruolo: 'utente',     nome: 'Nadia E.',      soprannome: null,         anonimo: false, eta: 34, sesso: 'F', lingue: ['IT','EN'], tag: ['prostituzione','salute'],         bisogni: ['screening','contraccezione'],               note: 'Contatto via collega Samira. Orario serale.',                 telefono: null, email: null, eventi_count: 14 },
  { id: 6, institution_id: 1, ruolo: 'dipendente', nome: 'Giulia Mazza',  soprannome: null,         anonimo: false, eta: 31, sesso: 'F', lingue: ['IT','EN'], tag: ['educatrice','équipe A'],          bisogni: [],                                           note: 'Coordinatrice turno mattina.',                                telefono: null, email: null, eventi_count: 142},
  { id: 7, institution_id: 1, ruolo: 'dipendente', nome: 'Davide Conti',  soprannome: null,         anonimo: false, eta: 28, sesso: 'M', lingue: ['IT'],      tag: ['educatore','équipe B'],           bisogni: [],                                           note: 'Specializzato in minori e famiglie.',                          telefono: null, email: null, eventi_count: 98  },
  { id: 8, institution_id: 1, ruolo: 'rete',       nome: 'Dott. Ferrari', soprannome: null,         anonimo: false, eta: 54, sesso: 'M', lingue: ['IT'],      tag: ['medico','ASL'],                   bisogni: [],                                           note: 'Medico di base. Disponibile mar/gio.',                         telefono: null, email: null, eventi_count: 6   },
  { id: 9, institution_id: 1, ruolo: 'rete',       nome: 'Suor Elena',    soprannome: null,         anonimo: false, eta: 62, sesso: 'F', lingue: ['IT','ES'], tag: ['volontaria','Caritas'],           bisogni: [],                                           note: 'Mensa Caritas, aperta 11:30-14:00.',                           telefono: null, email: null, eventi_count: 23  },
]

export const MOCK_LUOGHI: Luogo[] = [
  { id: 1, institution_id: 1, nome: 'Piazza Stazione',        tipo: 'strada',    indirizzo: 'P.zza della Stazione',       orari: '24h',              note: 'Area critica notturna. 3 panchine, pensilina.', lat: 46.0037, lng: 8.9511, attivo: true, persone_count: 12, eventi_settimana: 18 },
  { id: 2, institution_id: 1, nome: 'Giardini via Vitruvio',  tipo: 'strada',    indirizzo: 'Via Vitruvio 15',            orari: '06–22',            note: 'Punto giovani, serale.',                        lat: 46.0051, lng: 8.9489, attivo: true, persone_count: 4,  eventi_settimana: 6  },
  { id: 3, institution_id: 1, nome: 'Sottopasso Ferrovia',    tipo: 'informale', indirizzo: 'Via Tonale ang. Sammartini', orari: '24h',              note: 'Accampamento stabile 4–6 persone.',             lat: 46.0041, lng: 8.9498, attivo: true, persone_count: 7,  eventi_settimana: 9  },
  { id: 4, institution_id: 1, nome: 'Mensa Caritas',          tipo: 'diurno',    indirizzo: 'Via San Bernardino 4',       orari: 'Lun–Sab 11:30–14', note: 'Collaborazione consolidata. Ref. Suor Elena.',  lat: 46.0028, lng: 8.9477, attivo: true, persone_count: 60, eventi_settimana: 12 },
  { id: 5, institution_id: 1, nome: 'Consultorio ASL 3',      tipo: 'sanitario', indirizzo: 'Via Padova 118',             orari: 'Lun–Ven 9–17',    note: 'Ginecologia e pediatria. Ref. Dott. Ferrari.',  lat: null,    lng: null,   attivo: true, persone_count: 0,  eventi_settimana: 4  },
  { id: 6, institution_id: 1, nome: 'Centro Diurno Crocetta', tipo: 'diurno',    indirizzo: 'Via Crocetta 22',            orari: 'Lun–Ven 14–19',   note: 'Spazio per minori e famiglie.',                 lat: 46.0019, lng: 8.9502, attivo: true, persone_count: 25, eventi_settimana: 8  },
  { id: 7, institution_id: 1, nome: 'Sede Prometheus',        tipo: 'ufficio',   indirizzo: 'Via Settala 8',              orari: 'Lun–Ven 9–18',    note: 'Sede operativa équipe.',                        lat: null,    lng: null,   attivo: true, persone_count: 0,  eventi_settimana: 5  },
]

export const TIPO_LUOGO_LABEL: Record<string, string> = {
  strada:    'Strada / piazza',
  informale: "Punto d'incontro",
  diurno:    'Centro diurno',
  sanitario: 'Servizio sanitario',
  ufficio:   'Ufficio / sede',
}

// Mock eventi aggiornati con i nuovi ID tipo
export const MOCK_EVENTI: Evento[] = [
  { id: 1,  institution_id: 1, educatore_id: 6, luogo_id: 1,    tipo: 'incontro_individuale', data: '2026-05-31', ora_inizio: '09:00', durata_min: 45,  stato: 'completato',  note: 'Colazione, check vestiti. Discussione ricovero.',    persone: [MOCK_PERSONE[0]] },
  { id: 2,  institution_id: 1, educatore_id: 6, luogo_id: null, tipo: 'uscita',               data: '2026-05-31', ora_inizio: '09:50', durata_min: 20,  stato: 'completato',  note: 'Spostamento verso sottopasso.',                       persone: [] },
  { id: 3,  institution_id: 1, educatore_id: 6, luogo_id: 3,    tipo: 'contatti',             data: '2026-05-31', ora_inizio: '10:15', durata_min: 60,  stato: 'completato',  note: 'Distribuzione tè, prima mappatura.',                  persone: [MOCK_PERSONE[3], MOCK_PERSONE[0]] },
  { id: 4,  institution_id: 1, educatore_id: 6, luogo_id: 5,    tipo: 'accompagnamento',      data: '2026-05-31', ora_inizio: '11:30', durata_min: 30,  stato: 'in_corso',    note: 'Accompagnamento visita gineco.',                      persone: [MOCK_PERSONE[1]] },
  { id: 5,  institution_id: 1, educatore_id: 6, luogo_id: 7,    tipo: 'riunione_equipe',      data: '2026-05-31', ora_inizio: '14:00', durata_min: 90,  stato: 'pianificato', note: 'Riunione settimanale équipe A+B.',                    persone: [MOCK_PERSONE[5], MOCK_PERSONE[6]] },
  { id: 6,  institution_id: 1, educatore_id: 7, luogo_id: 6,    tipo: 'incontro_individuale', data: '2026-05-31', ora_inizio: '16:30', durata_min: 45,  stato: 'pianificato', note: 'Follow-up scolastico, madre presente.',               persone: [MOCK_PERSONE[2]] },
  { id: 7,  institution_id: 1, educatore_id: 6, luogo_id: 2,    tipo: 'contatti',             data: '2026-05-30', ora_inizio: '19:00', durata_min: 75,  stato: 'completato',  note: 'Turno serale, consegna materiale informativo.',       persone: [MOCK_PERSONE[4]] },
  { id: 8,  institution_id: 1, educatore_id: 6, luogo_id: 7,    tipo: 'formazione',           data: '2026-05-30', ora_inizio: '10:00', durata_min: 120, stato: 'completato',  note: 'Aggiornamento protocollo minori.',                    persone: [MOCK_PERSONE[5], MOCK_PERSONE[6]] },
  { id: 9,  institution_id: 1, educatore_id: 6, luogo_id: 1,    tipo: 'incontro_individuale', data: '2026-05-29', ora_inizio: '08:30', durata_min: 30,  stato: 'completato',  note: 'Intervento per malessere. Chiamato 118.',             persone: [MOCK_PERSONE[3]] },
  { id: 10, institution_id: 1, educatore_id: 7, luogo_id: 5,    tipo: 'accompagnamento',      data: '2026-05-29', ora_inizio: '14:00', durata_min: 90,  stato: 'completato',  note: 'Pratiche documenti minore.',                          persone: [MOCK_PERSONE[1]] },
]

// ─── Helper ───────────────────────────────────────────────────────────────

export function personaById(id: number) { return MOCK_PERSONE.find(p => p.id === id) }
export function luogoById(id: number)   { return MOCK_LUOGHI.find(l => l.id === id) }

export function eventiDelGiorno(data: string) {
  return MOCK_EVENTI
    .filter(e => e.data === data)
    .sort((a, b) => (a.ora_inizio ?? '').localeCompare(b.ora_inizio ?? ''))
}

export function minutiLavoratiOggi(data: string, educatoreId = 6) {
  return MOCK_EVENTI
    .filter(e => e.data === data && e.educatore_id === educatoreId &&
      (e.stato === 'completato' || e.stato === 'in_corso'))
    .reduce((s, e) => s + e.durata_min, 0)
}

export function scorePersonaPerLuogo(personaId: number, luogoId: number): number {
  return MOCK_EVENTI.filter(
    e => e.luogo_id === luogoId && e.persone?.some(p => p.id === personaId)
  ).length
}
