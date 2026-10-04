import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { Persona } from '../types'

export function usePersone(q?: string) {
  return useQuery<Persona[]>({
    queryKey: ['persone', q],
    queryFn: () => api.get(`/persone${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  })
}

export function usePersona(id: number) {
  return useQuery<Persona>({
    queryKey: ['persone', id],
    queryFn: () => api.get(`/persone/${id}`),
  })
}

export function useCreatePersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Persona>) => api.post<Persona>('/persone', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persone'] }),
  })
}

export function useUpdatePersona(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Persona>) => api.patch<Persona>(`/persone/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persone'] }),
  })
}
