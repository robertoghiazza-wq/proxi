import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, scaricaBlob } from '../lib/api-client'
import type { Me } from './useAuth'

type Ente = NonNullable<Me['institution']>

// Logo dell'ente: file protetto, scaricato col token e mostrato da un URL locale (`versione` = updated_at, cambia con il logo)
export function useLogoEnte(abilitato: boolean, versione?: string) {
  return useQuery<string>({
    queryKey: ['logo-ente', versione],
    queryFn: async () => URL.createObjectURL(await scaricaBlob('/ente/logo')),
    enabled: abilitato,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    retry: false,
  })
}

export function useGestioneEnte() {
  const qc = useQueryClient()
  const aggiorna = () => qc.invalidateQueries({ queryKey: ['me'] })
  return {
    salva: useMutation({ mutationFn: (d: { name?: string; accent_color?: string; motto?: string | null; sito?: string | null; email_mittente?: string | null }) => api.put<Ente>('/ente', d), onSuccess: aggiorna }),
    caricaLogo: useMutation({
      mutationFn: (file: Blob | File) => {
        const f = new FormData()
        f.append('logo', file, (file as File).name || 'logo.png')
        return api.upload<Ente>('/ente/logo', f)
      },
      onSuccess: aggiorna,
    }),
    rimuoviLogo: useMutation({ mutationFn: () => api.delete<Ente>('/ente/logo'), onSuccess: aggiorna }),
  }
}
