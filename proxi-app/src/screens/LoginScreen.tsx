import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api-client'

export function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.post<{ token: string }>('/auth/login', { email, password })
      setToken(res.token)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message ?? 'Errore di accesso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--prox-bg)', padding: '24px 20px',
    }}>
      {/* Logo / nome */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--prox-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 16px rgba(220,29,39,0.3)',
        }}>
          <span style={{ fontSize: 28, color: '#fff', fontWeight: 700, letterSpacing: -1 }}>P</span>
        </div>
        <div className="prox-display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
          Proxi
        </div>
        <div style={{ fontSize: 13, color: 'var(--prox-ink3)', marginTop: 4 }}>
          Associazione Prometheus
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: 360,
        background: 'var(--prox-surface)',
        borderRadius: 20, padding: 24,
        boxShadow: '0 2px 16px rgba(20,23,28,0.06)',
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="nome@associazioneprometheus.ch"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: 'var(--prox-accent-soft)',
            borderRadius: 10, fontSize: 13,
            color: 'var(--prox-accent-ink)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px 0',
            background: loading ? 'var(--prox-ink3)' : 'var(--prox-accent)',
            color: '#fff', border: 'none', borderRadius: 999,
            fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--prox-ink2)', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: 0.5,
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', borderRadius: 12,
  border: '1px solid var(--prox-line)',
  background: 'var(--prox-surface2)',
  fontSize: 15, color: 'var(--prox-ink)',
  outline: 'none',
}
