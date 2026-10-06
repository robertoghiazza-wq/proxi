import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { ProfiloUtente, SchedaUtente, Sostanza, Vocabolo } from '../types'

export function useVocaboli() {
  return useQuery<{ categorie: Record<string, string>; voci: Vocabolo[] }>({
    queryKey: ['vocaboli'],
    queryFn: () => api.get('/vocaboli'),
    staleTime: 1000 * 60 * 30,
  })
}

export function useSalvaVocabolo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...d }: { id?: number; categoria?: string; valore: string }) =>
      id ? api.patch<Vocabolo>(`/vocaboli/${id}`, d) : api.post<Vocabolo>('/vocaboli', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocaboli'] }),
  })
}

export function useEliminaVocabolo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/vocaboli/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocaboli'] }),
  })
}

export function useScheda(personaId: number, abilitata = true) {
  return useQuery<SchedaUtente>({
    queryKey: ['scheda', personaId],
    queryFn: () => api.get(`/persone/${personaId}/profilo`),
    enabled: abilitata,
  })
}

export function useSalvaScheda(personaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: Partial<ProfiloUtente> & { sostanze?: Sostanza[] }) => api.put<SchedaUtente>(`/persone/${personaId}/profilo`, d),
    onSuccess: r => qc.setQueryData(['scheda', personaId], r),
  })
}

export function useDiario(personaId: number) {
  const qc = useQueryClient()
  const aggiorna = () => qc.invalidateQueries({ queryKey: ['scheda', personaId] })
  return {
    aggiungi: useMutation({
      mutationFn: (d: { data: string; nota: string }) => api.post(`/persone/${personaId}/diario`, d),
      onSuccess: aggiorna,
    }),
    modifica: useMutation({
      mutationFn: ({ id, ...d }: { id: number; data?: string; nota?: string }) => api.patch(`/diario/${id}`, d),
      onSuccess: aggiorna,
    }),
    elimina: useMutation({
      mutationFn: (id: number) => api.delete<void>(`/diario/${id}`),
      onSuccess: aggiorna,
    }),
  }
}
