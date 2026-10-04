import { useMutation } from '@tanstack/react-query'
import { api, setToken, clearToken, setCurrentUser } from '../lib/api-client'

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

export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/auth/logout', {}),
    onSuccess: () => {
      clearToken()
      window.location.href = '/login'
    },
  })
}
