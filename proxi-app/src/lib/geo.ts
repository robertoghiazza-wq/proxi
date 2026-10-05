// Indirizzi svizzeri: via (geo.admin), NPA/località/comune politico (OpenPLZ), comune da coordinate (confini swisstopo).
// Ogni indirizzo svizzero salva sempre Comune politico, n. BFS e Cantone.

const GEO = 'https://api3.geo.admin.ch/rest/services/api'
const PLZ = 'https://openplzapi.org/ch'

export interface Indirizzo {
  indirizzo: string
  npa: string
  localita: string
  comune_politico: string
  bfs: string
  cantone: string
  paese: string
}

export const INDIRIZZO_VUOTO: Indirizzo = {
  indirizzo: '', npa: '', localita: '', comune_politico: '', bfs: '', cantone: '', paese: 'Svizzera',
}

export interface Localita { npa: string; localita: string; comune: string; bfs: string; cantone: string }
export interface Comune { nome: string; bfs: string; cantone: string }
export interface RisultatoVia extends Localita { label: string; via: string; lat: number; lng: number }

export const CANTONI = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH']

export function eSvizzera(paese: string): boolean {
  return /^(|svizzera|ch|switzerland|schweiz|suisse|svizra)$/i.test(paese.trim())
}

const maiuscole = (s: string) => s.replace(/(^|[\s'’-])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase())

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

interface PlzLocalita {
  postalCode: string
  name: string
  commune: { key: string; name: string }
  canton: { shortName: string }
}

const daPlz = (l: PlzLocalita): Localita => ({
  npa: l.postalCode, localita: l.name, comune: l.commune.name, bfs: l.commune.key, cantone: l.canton.shortName,
})

export async function cercaNpa(npa: string, signal?: AbortSignal): Promise<Localita[]> {
  if (npa.length < 2) return []
  const r = await getJson<PlzLocalita[]>(`${PLZ}/Localities?postalCode=${encodeURIComponent(npa)}&page=1&pageSize=15`, signal)
  return (r ?? []).map(daPlz)
}

export async function cercaLocalita(nome: string, signal?: AbortSignal): Promise<Localita[]> {
  if (nome.trim().length < 2) return []
  const r = await getJson<PlzLocalita[]>(`${PLZ}/Localities?name=${encodeURIComponent(nome.trim())}&page=1&pageSize=20`, signal)
  return (r ?? []).map(daPlz)
}

// Anche una frazione porta al suo comune politico (Monteggio → Tresa).
export async function cercaComune(nome: string, signal?: AbortSignal): Promise<Comune[]> {
  const loc = await cercaLocalita(nome, signal)
  const visti = new Set<string>()
  const q = nome.trim().toLowerCase()
  return loc
    .filter(l => !visti.has(l.bfs) && visti.add(l.bfs))
    .map(l => ({ nome: l.comune, bfs: l.bfs, cantone: l.cantone }))
    .sort((a, b) => Number(!a.nome.toLowerCase().startsWith(q)) - Number(!b.nome.toLowerCase().startsWith(q)) || a.nome.localeCompare(b.nome))
    .slice(0, 12)
}

// Via e numero → indirizzi con coordinate; il comune politico arriva dal campo "detail" ("… 6900 lugano 5192 lugano ch ti").
export async function cercaVia(testo: string, signal?: AbortSignal): Promise<RisultatoVia[]> {
  if (testo.trim().length < 4) return []
  const url = `${GEO}/SearchServer?searchText=${encodeURIComponent(testo.trim())}&type=locations&origins=address&limit=8&lang=it&sr=4326`
  const r = await getJson<{ results?: { attrs: { label: string; detail: string; lat: number; lon: number } }[] }>(url, signal)

  const out: RisultatoVia[] = []
  for (const { attrs } of r?.results ?? []) {
    const l = attrs.label.match(/^(.*?)\s*<b>(\d{4})\s+(.+?)<\/b>/)
    const d = attrs.detail.match(/\b(\d{4})\s+(.+?)\s+(\d{4,5})\s+(.+?)\s+ch\s+([a-z]{2})\b/i)
    if (!l) continue
    out.push({
      label: attrs.label.replace(/<[^>]*>/g, ''),
      via: l[1].trim(),
      npa: l[2],
      localita: l[3].trim(),
      comune: d ? maiuscole(d[4].trim()) : '',
      bfs: d?.[3] ?? '',
      cantone: d ? d[5].toUpperCase() : '',
      lat: attrs.lat,
      lng: attrs.lon,
    })
  }
  return out
}

// Correggi maiuscole e cantone del comune usando l'elenco ufficiale delle località dell'NPA.
export async function rifinisciComune(r: Pick<Localita, 'npa' | 'localita' | 'bfs'>): Promise<Comune | null> {
  const loc = await cercaNpa(r.npa)
  const l = loc.find(x => x.bfs === r.bfs && x.localita.toLowerCase() === r.localita.toLowerCase())
    ?? loc.find(x => x.bfs === r.bfs)
  return l ? { nome: l.comune, bfs: l.bfs, cantone: l.cantone } : null
}

// Con NPA e località scritti a mano: se il comune è univoco lo restituisce.
export async function comuneDaNpaLocalita(npa: string, localita: string): Promise<Comune | null> {
  if (npa.length !== 4 || !localita.trim()) return null
  const loc = (await cercaNpa(npa)).filter(x => x.localita.toLowerCase() === localita.trim().toLowerCase())
  const comuni = new Map(loc.map(x => [x.bfs, x]))
  if (comuni.size !== 1) return null
  const l = [...comuni.values()][0]
  return { nome: l.comune, bfs: l.bfs, cantone: l.cantone }
}

// Coordinate → comune politico in vigore (confini ufficiali swisstopo, anno corrente).
export async function comuneDaCoordinate(lat: number, lng: number, signal?: AbortSignal): Promise<Comune | null> {
  if (lng < 5.9 || lng > 10.6 || lat < 45.8 || lat > 47.9) return null
  const d = 0.0005
  const p = new URLSearchParams({
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', imageDisplay: '100,100,96',
    mapExtent: `${lng - d},${lat - d},${lng + d},${lat + d}`, tolerance: '0', sr: '4326', lang: 'it',
    layers: 'all:ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill', returnGeometry: 'false',
    timeInstant: String(new Date().getFullYear()),
  })
  const r = await getJson<{ results?: { attributes: { gemname: string; gde_nr: number; kanton: string; objektart_lookup?: string } }[] }>(
    `${GEO}/MapServer/identify?${p}`, signal)
  const a = r?.results?.find(x => x.attributes.objektart_lookup === 'gemeindegebiet')?.attributes
  return a ? { nome: a.gemname, bfs: String(a.gde_nr), cantone: a.kanton } : null
}

// Prima di salvare: un indirizzo svizzero deve avere un Comune politico reale e il Cantone.
// Se manca prova a ricavarli (NPA + località, oppure il nome del comune scritto a mano); altrimenti segnala l'errore.
export async function validaIndirizzo(a: Indirizzo): Promise<{ ok: true; patch?: Partial<Indirizzo> } | { ok: false; errore: string }> {
  if (!eSvizzera(a.paese)) return { ok: true }
  if (!(a.indirizzo.trim() || a.npa.trim() || a.localita.trim() || a.comune_politico.trim())) return { ok: true }
  if (a.bfs && a.comune_politico && a.cantone) return { ok: true }

  let c = await comuneDaNpaLocalita(a.npa, a.localita)
  if (!c && a.comune_politico.trim()) {
    const trovati = await cercaComune(a.comune_politico)
    c = trovati.find(x => x.nome.toLowerCase() === a.comune_politico.trim().toLowerCase()) ?? null
  }
  if (c) return { ok: true, patch: { comune_politico: c.nome, bfs: c.bfs, cantone: c.cantone } }

  return { ok: false, errore: 'Scegli il Comune politico dall’elenco: è obbligatorio per gli indirizzi svizzeri (il Cantone si compila da solo).' }
}
