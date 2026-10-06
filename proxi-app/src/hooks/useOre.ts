import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'

export interface EventoOre {
  id: number
  data: string
  ora_inizio: string | null
  tipo: string
  durata_min: number
  luogo: string | null
}

export interface SettimanaOre {
  iso: number
  dal: string
  al: string
  ore_dovute: number
  ore_lavorate: number
  eventi: EventoOre[]
}

export interface TotaliOre {
  dovute: number
  lavorate: number
  vacanze_ore: number
  festivi_ore: number
  correzione: number
  saldo: number
}

export interface VoceMese {
  vacanze_giorni: number
  festivi_giorni: number
  correzione_ore: number
  nota: string | null
}

export interface OreMese {
  persona: { id: number; nome: string }
  anno: number
  mese: number
  contratto_mancante: boolean
  ore_giornaliere: number
  settimane: SettimanaOre[]
  voce: VoceMese
  totali: TotaliOre
}

export interface OreAnno {
  persona: { id: number; nome: string }
  anno: number
  saldo_annuo: number
  mesi: { mese: number; contratto_mancante: boolean; voce: VoceMese; totali: TotaliOre }[]
}

export type PersonaOre = number | 'me'

export function useOreMese(persona: PersonaOre | null, anno: number, mese: number) {
  return useQuery<OreMese>({
    queryKey: ['ore', persona, anno, mese],
    queryFn: () => api.get(`/ore/${persona}?anno=${anno}&mese=${mese}`),
    enabled: persona !== null,
  })
}

export function useOreAnno(persona: PersonaOre | null, anno: number, abilitata: boolean) {
  return useQuery<OreAnno>({
    queryKey: ['ore-anno', persona, anno],
    queryFn: () => api.get(`/ore/${persona}/anno?anno=${anno}`),
    enabled: persona !== null && abilitata,
  })
}

export function useSalvaVoceMese(persona: PersonaOre | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { anno: number; mese: number } & Partial<VoceMese>) => api.put<OreMese>(`/ore/${persona}/mese`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ore', persona] })
      qc.invalidateQueries({ queryKey: ['ore-anno', persona] })
    },
  })
}
