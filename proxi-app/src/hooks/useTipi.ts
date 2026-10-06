import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { coloreDa } from '../lib/colori'
import { TIPI_EVENTO as TIPI_EVENTO_BASE, TIPO_LUOGO_LABEL as LUOGO_BASE } from '../lib/mock-data'

export interface CategoriaEvento { id: number; nome: string; colore: string; ordine: number }
export interface TipoEvento { id: number; categoria_id: number; chiave: string; nome: string; colore: string | null; ordine: number; attivo: boolean; usi: number }
export interface TipoLuogo { id: number; chiave: string; nome: string; colore: string; ordine: number; attivo: boolean; usi: number }
interface Tipi { colori: string[]; categorie: CategoriaEvento[]; tipi_evento: TipoEvento[]; tipi_luogo: TipoLuogo[] }

export function useTipi() {
  return useQuery<Tipi>({ queryKey: ['tipi'], queryFn: () => api.get('/tipi'), staleTime: 1000 * 60 * 10 })
}

const parole = (k: string) => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())

// Tipi di evento dell'ente: nome e colore per chiave (con ripiego sui valori di partenza finché non arrivano dal server)
export function useTipiEvento() {
  const { data } = useTipi()
  const categorie = data?.categorie ?? []
  const tipi = data?.tipi_evento ?? []
  const perChiave = new Map(tipi.map(t => [t.chiave, t]))
  const catPerId = new Map(categorie.map(c => [c.id, c]))

  return {
    caricato: !!data,
    categorie,
    tipi,
    label: (chiave: string) => perChiave.get(chiave)?.nome ?? TIPI_EVENTO_BASE[chiave]?.label ?? parole(chiave),
    colore: (chiave: string) => {
      const t = perChiave.get(chiave)
      if (!t) return coloreDa(null)
      return coloreDa(t.colore ?? catPerId.get(t.categoria_id)?.colore)
    },
    categoriaDi: (chiave: string) => catPerId.get(perChiave.get(chiave)?.categoria_id ?? -1),
    coloreCategoria: (c: CategoriaEvento) => coloreDa(c.colore),
  }
}

export function useTipiLuogo() {
  const { data } = useTipi()
  const tipi = data?.tipi_luogo ?? []
  const perChiave = new Map(tipi.map(t => [t.chiave, t]))
  return {
    tipi,
    attivi: tipi.filter(t => t.attivo),
    label: (chiave: string) => perChiave.get(chiave)?.nome ?? LUOGO_BASE[chiave] ?? parole(chiave),
    colore: (chiave: string) => coloreDa(perChiave.get(chiave)?.colore),
  }
}

type Risorsa = 'categorie-evento' | 'tipi-evento' | 'tipi-luogo'

export function useGestioneTipi() {
  const qc = useQueryClient()
  const ok = () => qc.invalidateQueries({ queryKey: ['tipi'] })
  return {
    crea: useMutation({ mutationFn: ({ risorsa, ...d }: { risorsa: Risorsa } & Record<string, unknown>) => api.post(`/${risorsa}`, d), onSuccess: ok }),
    aggiorna: useMutation({ mutationFn: ({ risorsa, id, ...d }: { risorsa: Risorsa; id: number } & Record<string, unknown>) => api.patch(`/${risorsa}/${id}`, d), onSuccess: ok }),
    elimina: useMutation({ mutationFn: ({ risorsa, id }: { risorsa: Risorsa; id: number }) => api.delete<void>(`/${risorsa}/${id}`), onSuccess: ok }),
  }
}
