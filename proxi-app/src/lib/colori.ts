// Colori selezionabili per categorie e tipi (stesse chiavi del backend, App\Support\TipiDefault::PALETTE).
// Ogni colore ha la sua luminosità e saturazione: con valori uguali per tutti, giallo e arancio risultavano spenti (senape).

export const PALETTE: { key: string; label: string; l: number; c: number; h: number }[] = [
  { key: 'rosso',   label: 'Rosso',   l: 0.60, c: 0.21, h: 27 },
  { key: 'arancio', label: 'Arancio', l: 0.74, c: 0.18, h: 52 },
  { key: 'giallo',  label: 'Giallo',  l: 0.87, c: 0.18, h: 95 },
  { key: 'lime',    label: 'Lime',    l: 0.78, c: 0.20, h: 128 },
  { key: 'verde',   label: 'Verde',   l: 0.67, c: 0.18, h: 150 },
  { key: 'azzurro', label: 'Azzurro', l: 0.74, c: 0.12, h: 230 },
  { key: 'blu',     label: 'Blu',     l: 0.56, c: 0.20, h: 262 },
  { key: 'viola',   label: 'Viola',   l: 0.57, c: 0.20, h: 300 },
  { key: 'rosa',    label: 'Rosa',    l: 0.72, c: 0.19, h: 355 },
  { key: 'grigio',  label: 'Grigio',  l: 0.64, c: 0.02, h: 250 },
]

const eHex = (v: string | null | undefined): boolean => !!v && /^#[0-9a-f]{6}$/i.test(v)

// Colore salvato -> colore CSS. Può essere un esadecimale libero (#rrggbb) oppure la chiave di un colore della palette (valori di partenza)
export function coloreDa(valore: string | null | undefined): string {
  if (eHex(valore)) return valore as string
  const p = PALETTE.find(x => x.key === valore) ?? PALETTE[PALETTE.length - 1]
  return `oklch(${p.l} ${p.c} ${p.h})`
}

// oklch -> #rrggbb (per le scorciatoie della palette e per il selettore di colore)
export function oklchToHex(l: number, c: number, h: number): string {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
  ]
  return '#' + lin.map(v => {
    const x = Math.min(1, Math.max(0, v))
    const g = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
    return Math.round(g * 255).toString(16).padStart(2, '0')
  }).join('')
}

// Qualunque colore salvato -> #rrggbb
export function coloreHex(valore: string | null | undefined): string {
  if (eHex(valore)) return (valore as string).toLowerCase()
  const p = PALETTE.find(x => x.key === valore) ?? PALETTE[PALETTE.length - 1]
  return oklchToHex(p.l, p.c, p.h)
}

export const eColoreHex = eHex

// Sfondo tenue dello stesso colore (per chip e riquadri)
export const tenue = (colore: string, percento = 14) => `color-mix(in oklab, ${colore} ${percento}%, transparent)`

// Variante più scura, per testi sullo stesso colore (il giallo su bianco non si legge)
export const scuro = (colore: string) => `color-mix(in oklab, ${colore} 60%, black)`
