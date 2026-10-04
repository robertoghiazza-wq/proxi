// Design tokens da Proxi design handoff
// Applicati come CSS custom properties su :root via applyTenantTheme()

export const proxColors = {
  bg:        '#f1f2f4',
  surface:   '#ffffff',
  surface2:  '#f7f8fa',
  ink:       '#14171c',
  ink2:      '#444a55',
  ink3:      '#858c97',
  line:      'rgba(20,23,28,0.08)',
  line2:     'rgba(20,23,28,0.04)',
} as const

// Preset accent per ogni ente — in produzione arriva dall'API
export const TENANT_ACCENTS: Record<string, string> = {
  prometheus:          '#dc1d27',
  ingrado:             '#0a7d6f',
  'antenna-icaro':     '#1a4ea8',
  'cura-domino':       '#7b4dbb',
  'strada-aperta':     '#c45a18',
  'centro-giovani-lo': '#0e8a4a',
}

// Mescola hex verso bianco (per accent-soft) o nero (per accent-ink)
function mixHex(hex: string, target: '#ffffff' | '#000000', amount: number): string {
  const r1 = parseInt(hex.slice(1, 3), 16)
  const g1 = parseInt(hex.slice(3, 5), 16)
  const b1 = parseInt(hex.slice(5, 7), 16)
  const [r2, g2, b2] = target === '#ffffff' ? [255, 255, 255] : [0, 0, 0]
  const r = Math.round(r1 + (r2 - r1) * amount)
  const g = Math.round(g1 + (g2 - g1) * amount)
  const b = Math.round(b1 + (b2 - b1) * amount)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

export function softOf(hex: string)  { return mixHex(hex, '#ffffff', 0.88) }
export function inkOf(hex: string)   { return mixHex(hex, '#000000', 0.40) }

// Scrive le CSS var su :root — chiamato al login quando arriva institution.accent_color
export function applyTenantTheme(accentHex: string) {
  const root = document.documentElement
  root.style.setProperty('--prox-accent',      accentHex)
  root.style.setProperty('--prox-accent-soft', softOf(accentHex))
  root.style.setProperty('--prox-accent-ink',  inkOf(accentHex))
}
