// Filtri a «pill» suggeriti mentre si scrive (tipo di persona, ruolo, tipo di evento, categoria di luogo…)

export interface FiltroCat { id: string; gruppo: string; label: string }

const MIN_LETTERE = 4

export const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// L'ultima parola scritta (quella che si sta digitando) e il testo che la precede
export function ultimaParola(testo: string): { prima: string; parola: string } {
  const m = testo.match(/^(.*?)(\S+)$/s)
  return m ? { prima: m[1], parola: m[2] } : { prima: testo, parola: '' }
}

// Categorie che iniziano (o contengono) con quello che si sta scrivendo, dopo almeno 4 lettere; quelle già attive non si ripropongono
export function suggerisci(testo: string, candidati: FiltroCat[], attivi: FiltroCat[]): FiltroCat[] {
  const { parola } = ultimaParola(testo)
  const n = norm(parola)
  if (n.length < MIN_LETTERE) return []
  const usati = new Set(attivi.map(f => `${f.gruppo}:${f.id}`))
  const visti = new Set<string>()
  return candidati.filter(f => {
    if (usati.has(`${f.gruppo}:${f.id}`)) return false
    if (!norm(f.label).split(/[\s/·,-]+/).some(w => w.startsWith(n))) return false     // «educ» -> «Educatore», «Educatrice»
    const k = `${f.gruppo}:${norm(f.label)}`
    if (visti.has(k)) return false
    visti.add(k)
    return true
  }).slice(0, 5)
}

// Stesso gruppo = «uno qualsiasi»; gruppi diversi = «tutti»
export function passaFiltri<T>(item: T, attivi: FiltroCat[], test: (item: T, f: FiltroCat) => boolean): boolean {
  const gruppi = new Map<string, FiltroCat[]>()
  attivi.forEach(f => gruppi.set(f.gruppo, [...(gruppi.get(f.gruppo) ?? []), f]))
  return [...gruppi.values()].every(fs => fs.some(f => test(item, f)))
}
