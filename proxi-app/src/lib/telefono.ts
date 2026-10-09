// Numeri di telefono con prefisso internazionale obbligatorio: paesi (vicini per primi), formato «come si scrive» e valore salvato (+41 79 123 45 67)

import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'
import esempi from 'libphonenumber-js/examples.mobile.json'

export type Paese = CountryCode
export const PAESE_PREDEFINITO: Paese = 'CH'
// prima la Svizzera e gli stati confinanti, poi gli altri in ordine alfabetico
export const PAESI_VICINI: Paese[] = ['CH', 'IT', 'DE', 'FR', 'AT', 'LI']

export interface VocePaese { codice: Paese; nome: string; prefisso: string }

export const bandiera = (codice: Paese) => String.fromCodePoint(...[...codice].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))

let nomi: Intl.DisplayNames | null = null
export function nomePaese(codice: Paese): string {
  try { nomi ??= new Intl.DisplayNames(['it'], { type: 'region' }) } catch { return codice }
  return nomi.of(codice) ?? codice
}

let elenco: VocePaese[] | null = null
export function elencoPaesi(): VocePaese[] {
  if (elenco) return elenco
  const tutti = getCountries().map(codice => ({ codice, nome: nomePaese(codice), prefisso: '+' + getCountryCallingCode(codice) }))
  const vicini = PAESI_VICINI.map(c => tutti.find(p => p.codice === c)!).filter(Boolean)
  const altri = tutti.filter(p => !PAESI_VICINI.includes(p.codice)).sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
  return (elenco = [...vicini, ...altri])
}

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
export function cercaPaesi(testo: string): VocePaese[] {
  const q = norm(testo.trim().replace(/^\+|^00/, ''))
  if (!q) return elencoPaesi()
  return elencoPaesi().filter(p => norm(p.nome).includes(q) || p.codice.toLowerCase() === q || p.prefisso.slice(1).startsWith(q))
}

// «+41…» scritto a mano -> paese (per i prefissi condivisi si preferisce il più vicino)
export function paeseDaPrefisso(cifre: string): { paese: Paese; resto: string } | null {
  for (const lung of [3, 2, 1]) {
    const codice = cifre.slice(0, lung)
    const candidati = elencoPaesi().filter(p => p.prefisso === '+' + codice)
    if (candidati.length) return { paese: candidati[0].codice, resto: cifre.slice(lung) }
  }
  return null
}

export const soloCifre = (t: string) => t.replace(/\D/g, '')
export const formattaNazionale = (paese: Paese, cifre: string) => new AsYouType(paese).input(cifre)
export const prefissoDi = (paese: Paese) => '+' + getCountryCallingCode(paese)

export function esempioNazionale(paese: Paese): string {
  try { return getExampleNumber(paese, esempi)?.formatNational() ?? '' } catch { return '' }
}

// Valore salvato: «+41 79 123 45 67»; vuoto se non c'è il numero
export function componi(paese: Paese, nazionale: string): string {
  const cifre = soloCifre(nazionale)
  if (!cifre) return ''
  const n = parsePhoneNumberFromString(cifre, paese)
  return n ? n.formatInternational() : `${prefissoDi(paese)} ${formattaNazionale(paese, cifre)}`
}

// Valore salvato (o numero scritto in un altro formato, es. «079 123 45 67») -> paese e parte nazionale per il campo
export function scomponi(valore: string | null | undefined, predefinito: Paese = PAESE_PREDEFINITO): { paese: Paese; nazionale: string } {
  const v = (valore ?? '').trim()
  if (!v) return { paese: predefinito, nazionale: '' }
  const n = parsePhoneNumberFromString(v.startsWith('00') ? '+' + v.slice(2) : v, predefinito)
  if (n?.country) return { paese: n.country, nazionale: n.formatNational() }
  const m = v.startsWith('+') ? paeseDaPrefisso(soloCifre(v)) : null
  if (m) return { paese: m.paese, nazionale: formattaNazionale(m.paese, m.resto) }
  return { paese: predefinito, nazionale: formattaNazionale(predefinito, soloCifre(v)) }
}

// Qualsiasi numero (anche scritto «079 123 45 67») -> «+41 79 123 45 67»
export function normalizza(valore: string | null | undefined): string {
  const s = scomponi(valore)
  return componi(s.paese, s.nazionale)
}

export function numeroPlausibile(valore: string | null | undefined): boolean {
  if (!valore) return true
  return !!parsePhoneNumberFromString(valore)?.isPossible()
}
