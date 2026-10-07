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
  const isForm = body instanceof FormData
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      // con FormData il browser imposta da solo il Content-Type (con il boundary)
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Sessione scaduta')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // per i 422 il messaggio utile sta nel primo errore di campo
    const primo = err.errors ? (Object.values(err.errors)[0] as string[] | undefined)?.[0] : undefined
    throw new Error(primo ?? err.message ?? (res.status === 413 ? 'File troppo grande' : `Errore ${res.status}`))
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// File protetti (documenti, foto): servono il token, quindi non si possono mettere in un <img src>
export async function scaricaBlob(path: string, corpo?: unknown): Promise<Blob> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(corpo === undefined ? {} : { 'Content-Type': 'application/json', Accept: 'application/json' }) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
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
  return res.blob()
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)   => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData)  => request<T>('POST',   path, form),
}
