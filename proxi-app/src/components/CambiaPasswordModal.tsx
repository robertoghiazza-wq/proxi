// Cambio della propria password (dal Profilo)

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, X, Check } from 'lucide-react'
import { Modal } from './Modal'
import { api } from '../lib/api-client'

interface Dati {
  current_password: string
  password: string
  password_confirmation: string
}

export function CambiaPasswordModal({ onClose }: { onClose: () => void }) {
  const cambia = useMutation({ mutationFn: (d: Dati) => api.post<{ ok: boolean }>('/auth/password', d) })
  const [attuale, setAttuale] = useState('')
  const [nuova, setNuova] = useState('')
  const [ripeti, setRipeti] = useState('')
  const [mostra, setMostra] = useState(false)
  const [errore, setErrore] = useState('')

  const regole = [
    { ok: nuova.length >= 10, testo: 'Almeno 10 caratteri' },
    { ok: /[A-Za-z]/.test(nuova) && /\d/.test(nuova), testo: 'Lettere e numeri' },
    { ok: nuova !== '' && nuova === ripeti, testo: 'Le due password coincidono' },
  ]
  const valida = attuale !== '' && regole.every(r => r.ok)

  async function salva() {
    if (!valida) return
    setErrore('')
    try {
      await cambia.mutateAsync({ current_password: attuale, password: nuova, password_confirmation: ripeti })
    } catch (e) {
      setErrore((e as Error).message || 'Non sono riuscito a cambiare la password')
    }
  }

  const tipo = mostra ? 'text' : 'password'

  return (
    <Modal open onClose={onClose} width={440}>
      <div style={{ background: 'var(--prox-bg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={onClose} aria-label="Chiudi" style={ghost}><X size={20} strokeWidth={1.75} /></button>
          <div className="prox-display" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>Cambia password</div>
          <button onClick={() => setMostra(m => !m)} aria-label={mostra ? 'Nascondi password' : 'Mostra password'} style={ghost}>
            {mostra ? <EyeOff size={19} strokeWidth={1.75} /> : <Eye size={19} strokeWidth={1.75} />}
          </button>
        </div>

        {cambia.isSuccess ? (
          <div style={{ flex: 1, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'oklch(0.96 0.05 155)', color: 'var(--prox-ok)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <Check size={28} strokeWidth={2.4} />
            </div>
            <div className="prox-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Password aggiornata</div>
            <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Gli altri dispositivi dove eri collegato sono stati scollegati: dovranno rifare l’accesso con la nuova password.
            </p>
            <button onClick={onClose} style={{
              padding: '12px 28px', borderRadius: 999, border: 'none', background: 'var(--prox-accent)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Chiudi</button>
          </div>
        ) : (
          <>
            {errore && (
              <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, background: 'oklch(0.96 0.04 25)', color: 'var(--prox-danger)' }}>
                {errore}
              </div>
            )}

            <form
              onSubmit={e => { e.preventDefault(); salva() }}
              style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Campo label="Password attuale">
                <input type={tipo} value={attuale} onChange={e => setAttuale(e.target.value)} autoComplete="current-password" style={input} autoFocus />
              </Campo>
              <Campo label="Nuova password">
                <input type={tipo} value={nuova} onChange={e => setNuova(e.target.value)} autoComplete="new-password" style={input} />
              </Campo>
              <Campo label="Ripeti la nuova password">
                <input type={tipo} value={ripeti} onChange={e => setRipeti(e.target.value)} autoComplete="new-password" style={input} />
              </Campo>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {regole.map(r => (
                  <li key={r.testo} style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                    color: r.ok ? 'var(--prox-ok)' : 'var(--prox-ink3)',
                  }}>
                    <Check size={14} strokeWidth={2.4} style={{ opacity: r.ok ? 1 : 0.35 }} /> {r.testo}
                  </li>
                ))}
              </ul>
              <button type="submit" hidden />
            </form>

            <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, var(--sab))', background: 'var(--prox-surface)', borderTop: '1px solid var(--prox-line)' }}>
              <button onClick={salva} disabled={!valida || cambia.isPending} style={{
                width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
                background: valida ? 'var(--prox-accent)' : 'var(--prox-line)', color: valida ? '#fff' : 'var(--prox-ink3)',
                fontSize: 15, fontWeight: 700, cursor: valida ? 'pointer' : 'default', opacity: cambia.isPending ? 0.6 : 1,
              }}>
                {cambia.isPending ? 'Salvo…' : 'Cambia password'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block' }}><div className="prox-label" style={{ marginBottom: 6 }}>{label}</div>{children}</label>
}

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--prox-line)', background: 'var(--prox-surface)',
  fontSize: 14, color: 'var(--prox-ink)', outline: 'none', fontFamily: 'inherit',
}

const ghost: React.CSSProperties = {
  width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer',
  color: 'var(--prox-ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
