import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { Evento } from '../types'

interface EventiFilters {
  data?: string
  stato?: string
  persona_id?: number
  luogo_id?: number
}

export function useEventi(filters: EventiFilters = {}) {
  const params = new URLSearchParams()
  if (filters.data)       params.set('data',       filters.data)
  if (filters.stato)      params.set('stato',      filters.stato)
  if (filters.persona_id) params.set('persona_id', String(filters.persona_id))
  if (filters.luogo_id)   params.set('luogo_id',   String(filters.luogo_id))
  const qs = params.toString()

  return useQuery<Evento[]>({
    queryKey: ['eventi', filters],
    queryFn: () => api.get(`/eventi${qs ? `?${qs}` : ''}`),
  })
}

export function useEvento(id: number) {
  return useQuery<Evento>({
    queryKey: ['eventi', id],
    queryFn: () => api.get(`/eventi/${id}`),
  })
}

export function useCreateEvento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Evento>) => api.post<Evento>('/eventi', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventi'] }),
  })
}

export function useUpdateEvento(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Evento>) => api.patch<Evento>(`/eventi/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventi'] }),
  })
}

export function useSyncPersone(eventoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (personeIds: number[]) =>
      api.post<Evento>(`/eventi/${eventoId}/persone`, { persone_ids: personeIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventi', eventoId] }),
  })
}
