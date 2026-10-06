import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { AccountPersona, Contratto, Role } from '../types'

export type DatiContratto = {
  data_inizio: string
  data_fine: string | null
  stipendio_annuo: string | null
  grado: string | null
  ore_settimanali: string | null
  iban: string | null
  cassa_malati: string | null
  avs: string | null
  note: string | null
}

export function useContratti(personaId: number, abilitata = true) {
  return useQuery<Contratto[]>({
    queryKey: ['contratti', personaId],
    queryFn: () => api.get(`/persone/${personaId}/contratti`),
    enabled: abilitata,
  })
}

export function useSalvaContratto(personaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...d }: { id?: number } & DatiContratto) =>
      id ? api.patch<Contratto>(`/contratti/${id}`, d) : api.post<Contratto>(`/persone/${personaId}/contratti`, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratti', personaId] }),
  })
}

export function useEliminaContratto(personaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/contratti/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratti', personaId] }),
  })
}

interface RispostaAccount { account: AccountPersona | null; link_invito?: string }

export function useAccount(personaId: number, abilitata = true) {
  return useQuery<RispostaAccount>({
    queryKey: ['account', personaId],
    queryFn: () => api.get(`/persone/${personaId}/account`),
    enabled: abilitata,
  })
}

export function useGestioneAccount(personaId: number) {
  const qc = useQueryClient()
  const salva = (r: RispostaAccount) => qc.setQueryData(['account', personaId], { account: r.account })
  return {
    crea: useMutation({
      mutationFn: (d: { email: string; role: Role }) => api.post<RispostaAccount>(`/persone/${personaId}/account`, d),
      onSuccess: salva,
    }),
    aggiorna: useMutation({
      mutationFn: (d: { role?: Role; attivo?: boolean }) => api.patch<RispostaAccount>(`/persone/${personaId}/account`, d),
      onSuccess: salva,
    }),
    reset: useMutation({
      mutationFn: () => api.post<RispostaAccount>(`/persone/${personaId}/account/reset`, {}),
      onSuccess: salva,
    }),
  }
}
