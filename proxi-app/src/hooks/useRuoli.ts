import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { Ruolo } from '../types'

export function useRuoli() {
  return useQuery<Ruolo[]>({
    queryKey: ['ruoli'],
    queryFn: () => api.get('/ruoli'),
    staleTime: 1000 * 60 * 30,
  })
}

type DatiRuolo = Pick<Ruolo, 'nome_m'> & Partial<Pick<Ruolo, 'nome_f' | 'nome_misto'>>

export function useCreateRuolo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: DatiRuolo) => api.post<Ruolo>('/ruoli', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ruoli'] }),
  })
}

export function useUpdateRuolo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...d }: { id: number } & Partial<DatiRuolo>) => api.patch<Ruolo>(`/ruoli/${id}`, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ruoli'] }),
  })
}

export function useDeleteRuolo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/ruoli/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ruoli'] }),
  })
}
