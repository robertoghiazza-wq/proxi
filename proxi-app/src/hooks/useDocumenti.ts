import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, scaricaBlob } from '../lib/api-client'
import type { DocumentoPersona, Persona } from '../types'

interface RispostaDocumenti { tipi: string[]; documenti: DocumentoPersona[] }

export function useDocumenti(personaId: number) {
  return useQuery<RispostaDocumenti>({
    queryKey: ['documenti', personaId],
    queryFn: () => api.get(`/persone/${personaId}/documenti`),
  })
}

export function useCaricaDocumento(personaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => api.upload<DocumentoPersona>(`/persone/${personaId}/documenti`, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documenti', personaId] }),
  })
}

export function useAggiornaDocumento(personaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...d }: { id: number; tipo: string | null; titolo: string; note: string | null }) =>
      api.patch<DocumentoPersona>(`/documenti/${id}`, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documenti', personaId] }),
  })
}

export function useEliminaDocumento(personaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/documenti/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documenti', personaId] }),
  })
}

export const scaricaDocumento = (id: number) => scaricaBlob(`/documenti/${id}/file`)

// Foto della persona: il file è protetto, quindi lo si scarica col token e si mostra da un URL locale.
// `versione` (updated_at) cambia quando la foto cambia e invalida la cache.
export function useFotoPersona(personaId: number, abilitata: boolean, versione?: string) {
  return useQuery<string>({
    queryKey: ['foto', personaId, versione],
    queryFn: async () => URL.createObjectURL(await scaricaBlob(`/persone/${personaId}/foto`)),
    enabled: abilitata,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    retry: false,
  })
}

export function useGestioneFoto(personaId: number) {
  const qc = useQueryClient()
  const aggiorna = (p: Persona) => {
    qc.setQueryData<Persona>(['persone', personaId], old => (old ? { ...old, ha_foto: p.ha_foto, updated_at: p.updated_at } : old))
    qc.invalidateQueries({ queryKey: ['persone'] })
  }
  return {
    carica: useMutation({
      mutationFn: (blob: Blob) => {
        const f = new FormData()
        f.append('foto', blob, 'foto.jpg')
        return api.upload<Persona>(`/persone/${personaId}/foto`, f)
      },
      onSuccess: aggiorna,
    }),
    rimuovi: useMutation({
      mutationFn: () => api.delete<Persona>(`/persone/${personaId}/foto`),
      onSuccess: aggiorna,
    }),
  }
}
