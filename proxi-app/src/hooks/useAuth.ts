import { useMutation, useQuery } from '@tanstack/react-query'
import { api, setToken, clearToken, setCurrentUser, getCurrentUser } from '../lib/api-client'

interface LoginPayload { email: string; password: string }
interface LoginResponse { token: string; user: { id: number; name: string; role: string } }

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginPayload) => api.post<LoginResponse>('/auth/login', data),
    onSuccess: ({ token, user }) => {
      setToken(token)
      setCurrentUser(user)
    },
  })
}

export interface Me {
  id: number
  name: string
  email: string
  role: string
  institution?: { id: number; name: string } | null
}

// Utente collegato e suo ente; tiene allineata la copia locale (ruolo) usata per mostrare o nascondere le sezioni
export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await api.get<Me>('/me')
      setCurrentUser({ id: me.id, name: me.name, role: me.role })
      return me
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!localStorage.getItem('proxi_token'),
  })
}

// Ruolo dell'utente collegato, riletto dal server (non solo dalla copia locale): coordinatori e admin gestiscono contratti, ore, elenchi
export function useRuolo(): string {
  const { data: me } = useMe()
  return me?.role ?? getCurrentUser()?.role ?? ''
}

export function useGestore(): boolean {
  return ['coordinatore', 'admin'].includes(useRuolo())
}

export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/auth/logout', {}),
    onSuccess: () => {
      clearToken()
      window.location.href = '/login'
    },
  })
}
