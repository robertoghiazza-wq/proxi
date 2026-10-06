// Pagina pubblica: si arriva dal link ricevuto da un coordinatore per scegliere la propria password

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { api } from '../lib/api-client'

export function ImpostaPasswordScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [ripeti, setRipeti] = useState('')
  const [mostra, setMostra] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [invio, setInvio] = useState(false)
  const [fatto, setFatto] = useState(false)

  const regole = [
    { ok: password.length >= 10, testo: 'Almeno 10 caratteri' },
    { ok: /[A-Za-z]/.test(password) && /\d/.test(password), testo: 'Lettere e numeri' },
    { ok: password !== '' && password === ripeti, testo: 'Le due password coincidono' },
  ]
  const valida = regole.every(r => r.ok) && !!email && !!token

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    if (!valida) return
    setErrore(null)
    setInvio(true)
    try {
      await api.post('/auth/imposta-password', { email, token, password, password_confirmation: ripeti })
      setFatto(true)
    } catch (err) {
      setErrore((err as Error).message || 'Non sono riuscito a impostare la password')
    } finally {
      setInvio(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--prox-bg)', padding: '24px 20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'var(--prox-accent)', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(220,29,39,0.3)',
        }}>
          <span style={{ fontSize: 28, color: '#fff', fontWeight: 700 }}>P</span>
        </div>
        <div className="prox-display" style={{ fontSize: 24, fontWeight: 700 }}>Proxi</div>
      </div>

      <div style={{ width: '100%', maxWidth: 380, background: 'var(--prox-surface)', borderRadius: 20, padding: 24, boxShadow: '0 2px 16px rgba(20,23,28,0.06)' }}>
        {fatto ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'oklch(0.96 0.05 155)', color: 'var(--prox-ok)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
            }}><Check size={26} strokeWidth={2.4} /></div>
            <div className="prox-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Password impostata</div>
            <p style={{ fontSize: 14, color: 'var(--prox-ink2)', margin: '0 0 18px' }}>Ora puoi accedere con la tua email e la nuova password.</p>
            <button onClick={() => navigate('/login', { replace: true })} style={bottone}>Vai all’accesso</button>
          </div>
        ) : (
          <form onSubmit={invia}>
            <div className="prox-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Scegli la tua password</div>
            <p style={{ fontSize: 13.5, color: 'var(--prox-ink3)', margin: '0 0 18px' }}>{email || 'Link non valido'}</p>

            <label style={etichetta}>Nuova password</label>
            <input type={mostra ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" style={campo} />
            <label style={etichetta}>Ripeti la password</label>
            <input type={mostra ? 'text' : 'password'} value={ripeti} onChange={e => setRipeti(e.target.value)} autoComplete="new-password" style={campo} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--prox-ink2)', margin: '2px 0 12px' }}>
              <input type="checkbox" checked={mostra} onChange={e => setMostra(e.target.checked)} style={{ accentColor: 'var(--prox-accent)' }} /> Mostra le password
            </label>

            <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {regole.map(r => (
                <li key={r.testo} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: r.ok ? 'var(--prox-ok)' : 'var(--prox-ink3)' }}>
                  <Check size={14} strokeWidth={2.4} style={{ opacity: r.ok ? 1 : 0.35 }} /> {r.testo}
                </li>
              ))}
            </ul>

            {errore && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--prox-accent-soft)', borderRadius: 10, fontSize: 13, color: 'var(--prox-accent-ink)' }}>{errore}</div>
            )}
            <button type="submit" disabled={!valida || invio} style={{ ...bottone, opacity: valida && !invio ? 1 : 0.5, cursor: valida ? 'pointer' : 'default' }}>
              {invio ? 'Salvo…' : 'Imposta password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const etichetta: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--prox-ink2)', marginBottom: 6 }
const campo: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, marginBottom: 14,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface2)', fontSize: 15, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}
const bottone: React.CSSProperties = {
  width: '100%', padding: '13px 0', background: 'var(--prox-accent)', color: '#fff', border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 600,
}
