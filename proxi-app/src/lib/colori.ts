// Colori selezionabili per categorie e tipi (stesse chiavi e tonalità del backend, App\Support\TipiDefault::PALETTE)

export const PALETTE: { key: string; label: string; hue: number | null }[] = [
  { key: 'rosso',   label: 'Rosso',   hue: 25 },
  { key: 'arancio', label: 'Arancio', hue: 40 },
  { key: 'giallo',  label: 'Giallo',  hue: 80 },
  { key: 'lime',    label: 'Lime',    hue: 125 },
  { key: 'verde',   label: 'Verde',   hue: 160 },
  { key: 'azzurro', label: 'Azzurro', hue: 200 },
  { key: 'blu',     label: 'Blu',     hue: 250 },
  { key: 'viola',   label: 'Viola',   hue: 280 },
  { key: 'rosa',    label: 'Rosa',    hue: 340 },
  { key: 'grigio',  label: 'Grigio',  hue: null },
]

// Chiave colore -> colore CSS (stessa luminosità e saturazione usate finora per tipi e luoghi)
export function coloreDa(chiave: string | null | undefined): string {
  const c = PALETTE.find(p => p.key === chiave)
  if (!c) return 'oklch(0.62 0.02 250)'
  return c.hue === null ? 'oklch(0.62 0.02 250)' : `oklch(0.62 0.14 ${c.hue})`
}
