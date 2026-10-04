// Client HTTP base — tutte le chiamate API passano da qui

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

function getToken(): string | null {
  return localStorage.getItem('proxi_token')
}

export function setToken(token: string) {
  localStorage.setItem('proxi_token', token)
}

export function clearToken() {
  localStorage.removeItem('proxi_token')
  localStorage.removeItem('proxi_user')
}

export function setCurrentUser(user: { id: number; name: string; role: string }) {
  localStorage.setItem('proxi_user', JSON.stringify(user))
}

export function getCurrentUser(): { id: number; name: string; role: string } | null {
  try {
    const raw = localStorage.getItem('proxi_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Sessione scaduta')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Errore ${res.status}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)   => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
}
