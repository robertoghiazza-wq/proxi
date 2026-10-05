// Lettura di date e orari incollati o scritti a mano. Funzioni pure.
// Formati accettati: 15.03.2026 · 15/03/2026 · 15-03-2026 · 15 3 2026 · 15.03.26 · 2026-03-15 · 20260315 ·
// 15032026 · «15 marzo 2026» · con l'ora facoltativa («15.03.2026 20:30», «2026-03-15T20:30», «ore 20.30»).

const MESI: Record<string, number> = {
  gennaio: 1, gen: 1, febbraio: 2, feb: 2, marzo: 3, mar: 3, aprile: 4, apr: 4, maggio: 5, mag: 5, giugno: 6, giu: 6,
  luglio: 7, lug: 7, agosto: 8, ago: 8, settembre: 9, set: 9, sett: 9, ottobre: 10, ott: 10, novembre: 11, nov: 11, dicembre: 12, dic: 12,
}

const pad = (n: number | string, l = 2) => String(n).padStart(l, '0')

// anno a due cifre: fino a 49 è 20xx, oltre 19xx (una data di nascita «65» è 1965)
const anno = (y: string | number) => (String(y).length <= 2 ? (Number(y) <= 49 ? 2000 : 1900) + Number(y) : Number(y))

export function validDate(y: string | number, m: string | number, d: string | number): boolean {
  const yy = Number(y), mm = Number(m), dd = Number(d)
  if (!(yy >= 1000 && yy <= 9999 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31)) return false
  const t = new Date(Date.UTC(yy, mm - 1, dd))
  return t.getUTCFullYear() === yy && t.getUTCMonth() === mm - 1 && t.getUTCDate() === dd
}

export function validTime(h: string | number, mi: string | number): boolean {
  const hh = Number(h), mm = Number(mi)
  return Number.isInteger(hh) && Number.isInteger(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59
}

export function parseTime(text: string): string | null {
  const s = String(text || '').trim().replace(/^ore\s*/i, '')
  const m = s.match(/^(\d{1,2})\s*[:.hH]\s*(\d{2})(?:\s*[:.]\s*\d{2})?$/) || s.match(/^(\d{2})(\d{2})$/)
  return m && validTime(m[1], m[2]) ? `${pad(m[1])}:${pad(m[2])}` : null
}

// → { date: 'YYYY-MM-DD', time: 'HH:mm' | null } oppure null se non è una data riconoscibile
export function parseDateTime(text: string): { date: string; time: string | null } | null {
  const s = String(text || '').trim().replace(/\s+/g, ' ')
  if (!s) return null
  let y: string | number = '', m: string | number = '', d: string | number = ''
  let rest: string | undefined = ''
  let r: RegExpMatchArray | null

  if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ,]+(.*))?$/))) {
    [, y, m, d, rest] = r
  } else if ((r = s.match(/^(\d{1,2})\s*[./\-\s]\s*(\d{1,2})\s*[./\-\s]\s*(\d{4}|\d{2})(?!\d)(?:[T ,]+(.*))?$/))) {
    [, d, m, y, rest] = r
    y = anno(y)
  } else if ((r = s.match(/^(\d{1,2})\s+([a-zà-ú]+)\.?\s+(\d{4}|\d{2})(?!\d)(?:[T ,]+(.*))?$/i)) && MESI[r[2].toLowerCase()]) {
    d = r[1]; m = MESI[r[2].toLowerCase()]; y = anno(r[3]); rest = r[4]
  } else if ((r = s.match(/^(\d{8})(?:[T ,]+(.*))?$/))) {
    const c = r[1]
    rest = r[2]
    if (validDate(c.slice(4), c.slice(2, 4), c.slice(0, 2))) { d = c.slice(0, 2); m = c.slice(2, 4); y = c.slice(4) } // ggmmaaaa
    else { y = c.slice(0, 4); m = c.slice(4, 6); d = c.slice(6) }                                                     // aaaammgg
  } else {
    return null
  }

  if (!validDate(y, m, d)) return null
  const time = rest ? parseTime(rest) : null
  if (rest && !time) return null
  return { date: `${pad(y, 4)}-${pad(m)}-${pad(d)}`, time }
}
