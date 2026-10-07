import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { Luogo } from '../types'

export function useLuoghi(q?: string) {
  return useQuery<Luogo[]>({
    queryKey: ['luoghi', q],
    queryFn: () => api.get(`/luoghi${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  })
}

export function useLuogo(id: number) {
  return useQuery<Luogo>({
    queryKey: ['luoghi', id],
    queryFn: () => api.get(`/luoghi/${id}`),
  })
}

export function useCreateLuogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Luogo>) => api.post<Luogo>('/luoghi', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['luoghi'] }),
  })
}

export function useDeleteLuogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/luoghi/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['luoghi'] })
      qc.invalidateQueries({ queryKey: ['eventi'] })
    },
  })
}

export function useUpdateLuogo(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Luogo>) => api.patch<Luogo>(`/luoghi/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['luoghi'] }),
  })
}
