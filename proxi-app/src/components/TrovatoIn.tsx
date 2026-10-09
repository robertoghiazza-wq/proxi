// Sotto un risultato di ricerca: dove è stata trovata la parola (es. «Trovato in: Diario · Indirizzo “Via Nassa 5”»)

import type { Trovato } from '../hooks/useRicerca'

export function TrovatoIn({ trovato, nascondi = ['Nome'] }: { trovato?: Trovato[]; nascondi?: string[] }) {
  const voci = (trovato ?? []).filter(t => !nascondi.includes(t.campo))
  if (voci.length === 0) return null
  return (
    <div style={{
      fontSize: 11, color: 'var(--prox-accent)', marginTop: 3, fontWeight: 500,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      Trovato in: {voci.map(t => t.estratto ? `${t.campo} “${t.estratto}”` : t.campo).join(' · ')}
    </div>
  )
}
