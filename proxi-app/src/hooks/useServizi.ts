import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { Servizio } from '../types'

export interface ContattoServizio {
  persona_id: number
  ruolo: string | null
  principale: boolean
}

export function useServizi(q?: string) {
  return useQuery<Servizio[]>({
    queryKey: ['servizi', q],
    queryFn: () => api.get(`/servizi${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  })
}

export function useServizio(id: number) {
  return useQuery<Servizio>({
    queryKey: ['servizi', id],
    queryFn: () => api.get(`/servizi/${id}`),
  })
}

export function useCreateServizio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Servizio>) => api.post<Servizio>('/servizi', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servizi'] }),
  })
}

export function useUpdateServizio(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Servizio>) => api.patch<Servizio>(`/servizi/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servizi'] }),
  })
}

export function useDeleteServizio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/servizi/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servizi'] })
      qc.invalidateQueries({ queryKey: ['persone'] })
    },
  })
}

export function useSyncContatti(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (persone: ContattoServizio[]) => api.put<Servizio>(`/servizi/${id}/persone`, { persone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servizi'] })
      qc.invalidateQueries({ queryKey: ['persone'] })
    },
  })
}
