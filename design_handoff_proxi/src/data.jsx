// data.jsx — Seed data realistico per Proximity

const PERSONE = [
  { id: 'p1', ruolo: 'utente',     nome: 'Marco R.',   soprannome: 'Sciacallo',  eta: 47, sesso: 'M', lingue: ['IT'],        tag: ['senza fissa dimora','dipendenza'], bisogni: ['alloggio notturno','assistenza sanitaria'], note: 'Zona stazione dal 2022. Preferisce il contatto al mattino presto.', anonimo: true,  eventi: 32 },
  { id: 'p2', ruolo: 'utente',     nome: 'Aïcha B.',    soprannome: null,          eta: 28, sesso: 'F', lingue: ['FR','AR'],   tag: ['migrante','madre'],             bisogni: ['documenti','pediatra figlia'],                note: 'Incinta al 7° mese. Figlia 4 anni. Collabora con Caritas.',   anonimo: false, eventi: 11 },
  { id: 'p3', ruolo: 'utente',     nome: 'Luca P.',     soprannome: null,          eta: 17, sesso: 'M', lingue: ['IT'],        tag: ['minore','scolastico'],          bisogni: ['supporto scolastico','educativa'],            note: 'Segnalato da scuola Don Milani. Famiglia in carico ai servizi.', anonimo: false, eventi: 7 },
  { id: 'p4', ruolo: 'utente',     nome: '—',           soprannome: 'Il Polacco',  eta: 52, sesso: 'M', lingue: ['PL','IT'],   tag: ['senza fissa dimora','anziano'], bisogni: ['pasti caldi','vestiti invernali'],            note: 'Poco disposto al dialogo. Accetta generi alimentari.',        anonimo: true,  eventi: 18 },
  { id: 'p5', ruolo: 'utente',     nome: 'Nadia E.',    soprannome: null,          eta: 34, sesso: 'F', lingue: ['IT','EN'],   tag: ['prostituzione','salute'],        bisogni: ['screening','contraccezione'],                 note: 'Contatto via collega Samira. Orario serale.',                 anonimo: false, eventi: 14 },
  { id: 'p6', ruolo: 'dipendente', nome: 'Giulia Mazza',soprannome: null,          eta: 31, sesso: 'F', lingue: ['IT','EN'],   tag: ['educatrice','équipe A'],         bisogni: [],                                              note: 'Coordinatrice turno mattina. Contatto rete sanità.',          anonimo: false, eventi: 142 },
  { id: 'p7', ruolo: 'dipendente', nome: 'Davide Conti',soprannome: null,          eta: 28, sesso: 'M', lingue: ['IT'],        tag: ['educatore','équipe B'],          bisogni: [],                                              note: 'Specializzato in minori e famiglie.',                           anonimo: false, eventi: 98  },
  { id: 'p8', ruolo: 'rete',       nome: 'Dott. Ferrari',soprannome: null,         eta: 54, sesso: 'M', lingue: ['IT'],        tag: ['medico','ASL'],                   bisogni: [],                                              note: 'Medico di base, consultorio via Roma. Disponibile mar/gio.',   anonimo: false, eventi: 6   },
  { id: 'p9', ruolo: 'rete',       nome: 'Suor Elena',  soprannome: null,          eta: 62, sesso: 'F', lingue: ['IT','ES'],   tag: ['volontaria','Caritas'],           bisogni: [],                                              note: 'Mensa Caritas, aperta 11:30-14:00. Contatto diretto.',         anonimo: false, eventi: 23  },
];

const LUOGHI = [
  { id: 'l1', nome: 'Piazza Stazione',         tipo: 'strada',    indirizzo: 'P.zza della Stazione',       orari: '24h',             persone: 12, eventiSett: 18, note: 'Area critica notturna. 3 panchine, pensilina.' },
  { id: 'l2', nome: 'Giardini via Vitruvio',   tipo: 'strada',    indirizzo: 'Via Vitruvio 15',            orari: '06-22',           persone: 4,  eventiSett: 6,  note: 'Punto giovani, serale.' },
  { id: 'l3', nome: 'Sottopasso Ferrovia',     tipo: 'informale', indirizzo: 'Via Tonale ang. Sammartini', orari: '24h',             persone: 7,  eventiSett: 9,  note: 'Accampamento stabile 4-6 persone.' },
  { id: 'l4', nome: 'Mensa Caritas',           tipo: 'diurno',    indirizzo: 'Via San Bernardino 4',       orari: 'Lun-Sab 11:30-14', persone: 60, eventiSett: 12, note: 'Collaborazione consolidata. Ref. Suor Elena.' },
  { id: 'l5', nome: 'Consultorio ASL 3',       tipo: 'sanitario', indirizzo: 'Via Padova 118',             orari: 'Lun-Ven 9-17',    persone: 0,  eventiSett: 4,  note: 'Ginecologia e pediatria. Ref. Dott. Ferrari.' },
  { id: 'l6', nome: 'Centro Diurno Crocetta',  tipo: 'diurno',    indirizzo: 'Via Crocetta 22',            orari: 'Lun-Ven 14-19',   persone: 25, eventiSett: 8,  note: 'Spazio per minori e famiglie.' },
  { id: 'l7', nome: 'Sede Prometheus',         tipo: 'ufficio',   indirizzo: 'Via Settala 8',              orari: 'Lun-Ven 9-18',    persone: 0,  eventiSett: 5,  note: 'Sede operativa équipe.' },
  { id: 'l8', nome: 'Parco Trotter',           tipo: 'strada',    indirizzo: 'Via Giacosa',                orari: '06-21',           persone: 8,  eventiSett: 11, note: 'Zona famiglie + giovani, pomeriggio.' },
];

// Today = 24 Apr 2026 (venerdì). Settimana corrente: lun 20 → dom 26.
const EVENTI = [
  { id: 'e1',  data: '2026-04-24', oraInizio: '09:00', durataMin: 45, tipo: 'incontro',     luogo: 'l1', personeIds: ['p1'],        educatore: 'p6', note: 'Colazione, check vestiti. Discussione ricovero.', stato: 'completato' },
  { id: 'e2',  data: '2026-04-24', oraInizio: '09:50', durataMin: 20, tipo: 'spostamento',  luogo: null, personeIds: [],             educatore: 'p6', note: 'Spostamento verso sottopasso.', stato: 'completato' },
  { id: 'e3',  data: '2026-04-24', oraInizio: '10:15', durataMin: 60, tipo: 'gruppo',        luogo: 'l3', personeIds: ['p4','p1'],   educatore: 'p6', note: 'Distribuzione tè, prima mappatura.', stato: 'completato' },
  { id: 'e4',  data: '2026-04-24', oraInizio: '11:30', durataMin: 30, tipo: 'accompagnamento',luogo: 'l5',personeIds: ['p2'],        educatore: 'p6', note: 'Accompagnamento visita gineco.', stato: 'in_corso' },
  { id: 'e5',  data: '2026-04-24', oraInizio: '14:00', durataMin: 90, tipo: 'equipe',        luogo: 'l7', personeIds: ['p6','p7'],  educatore: 'p6', note: 'Riunione settimanale équipe A+B.', stato: 'pianificato' },
  { id: 'e6',  data: '2026-04-24', oraInizio: '16:30', durataMin: 45, tipo: 'colloquio',     luogo: 'l6', personeIds: ['p3'],        educatore: 'p7', note: 'Follow-up scolastico, madre presente.', stato: 'pianificato' },
  { id: 'e7',  data: '2026-04-23', oraInizio: '19:00', durataMin: 75, tipo: 'incontro',     luogo: 'l2', personeIds: ['p5'],        educatore: 'p6', note: 'Turno serale, consegna materiale informativo.', stato: 'completato' },
  { id: 'e8',  data: '2026-04-23', oraInizio: '10:00', durataMin: 120,tipo: 'formazione',    luogo: 'l7', personeIds: ['p6','p7'],  educatore: 'p6', note: 'Aggiornamento protocollo minori.', stato: 'completato' },
  { id: 'e9',  data: '2026-04-22', oraInizio: '08:30', durataMin: 30, tipo: 'emergenza',     luogo: 'l1', personeIds: ['p4'],        educatore: 'p6', note: 'Intervento per malessere. Chiamato 118.', stato: 'completato' },
  { id: 'e10', data: '2026-04-22', oraInizio: '14:00', durataMin: 90, tipo: 'accompagnamento',luogo: 'l5',personeIds: ['p2'],        educatore: 'p7', note: 'Pratiche documenti minore.', stato: 'completato' },
  { id: 'e11', data: '2026-04-21', oraInizio: '10:00', durataMin: 60, tipo: 'incontro',     luogo: 'l4', personeIds: ['p1','p4'],  educatore: 'p6', note: 'Pranzo alla mensa, aggiornamento situazione.', stato: 'completato' },
  { id: 'e12', data: '2026-04-20', oraInizio: '09:00', durataMin: 45, tipo: 'colloquio',     luogo: 'l7', personeIds: ['p5'],        educatore: 'p6', note: 'Primo colloquio individuale.', stato: 'completato' },
];

// Tipologie evento con colore e label brevi
const TIPO_EVENTO = {
  incontro:        { label: 'Incontro',        hue: 40,  icon: '👥' },
  accompagnamento: { label: 'Accompagnamento', hue: 200, icon: '🚶' },
  colloquio:       { label: 'Colloquio',       hue: 280, icon: '💬' },
  emergenza:       { label: 'Emergenza',       hue: 15,  icon: '⚡' },
  equipe:          { label: "Riun. équipe",    hue: 160, icon: '🧩' },
  formazione:      { label: 'Formazione',      hue: 240, icon: '📚' },
  spostamento:     { label: 'Spostamento',     hue: 80,  icon: '🔄' },
  gruppo:          { label: 'Gruppo',          hue: 320, icon: '👥' },
};

const TIPO_LUOGO = {
  strada:    { label: 'Strada / piazza' },
  informale: { label: "Punto d'incontro" },
  diurno:    { label: 'Centro diurno' },
  sanitario: { label: 'Servizio sanitario' },
  ufficio:   { label: 'Ufficio / sede' },
};

// Helpers
const personaById = (id) => PERSONE.find((p) => p.id === id);
const luogoById   = (id) => LUOGHI.find((l) => l.id === id);
const eventiDelGiorno = (d) => EVENTI.filter((e) => e.data === d).sort((a,b) => a.oraInizio.localeCompare(b.oraInizio));
const minutiLavoratiOggi = (d, eduId = 'p6') =>
  EVENTI.filter((e) => e.data === d && e.educatore === eduId && (e.stato === 'completato' || e.stato === 'in_corso'))
        .reduce((s,e) => s + e.durataMin, 0);

Object.assign(window, {
  PERSONE, LUOGHI, EVENTI, TIPO_EVENTO, TIPO_LUOGO,
  personaById, luogoById, eventiDelGiorno, minutiLavoratiOggi,
});
