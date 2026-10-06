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

// Chiave colore -> colore CSS
export function coloreDa(chiave: string | null | undefined): string {
  const p = PALETTE.find(x => x.key === chiave) ?? PALETTE[PALETTE.length - 1]
  return `oklch(${p.l} ${p.c} ${p.h})`
}

// Sfondo tenue dello stesso colore (per chip e riquadri)
export const tenue = (colore: string, percento = 14) => `color-mix(in oklab, ${colore} ${percento}%, transparent)`

// Variante più scura, per testi sullo stesso colore (il giallo su bianco non si legge)
export const scuro = (colore: string) => `color-mix(in oklab, ${colore} 60%, black)`
