// Profilo educatore — ore lavorate + impostazioni

import { useState } from 'react'
import {
  Download, Bell, Shield, Tag, FileText, LogOut, ChevronRight, BadgeCheck, KeyRound,
} from 'lucide-react'
import { RuoliManager } from '../components/RuoliManager'
import { CambiaPasswordModal } from '../components/CambiaPasswordModal'
import { MobileLayout } from '../components/MobileLayout'
import { Avatar } from '../components/Avatar'
import { Card } from '../components/Card'
import { getCurrentUser } from '../lib/api-client'
import { useEventi } from '../hooks/useEventi'
import { useLogout } from '../hooks/useAuth'

const TODAY = new Date().toISOString().slice(0, 10)

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return { h, m: r }
}

interface OreBoxProps { label: string; minuti: number; accent?: boolean }

function OreBox({ label, minuti, accent }: OreBoxProps) {
  const { h, m } = minToHM(minuti)
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 2, padding: '14px 0',
    }}>
      <div className="prox-display" style={{
        fontSize: 26, fontWeight: 700, letterSpacing: -0.5,
        color: accent ? 'var(--prox-accent)' : 'var(--prox-ink)',
      }}>
        {h}<span style={{ fontSize: 16, fontWeight: 600 }}>h</span>
        {m > 0 && <>{m}<span style={{ fontSize: 16, fontWeight: 600 }}>m</span></>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--prox-ink3)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

interface VoceProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  danger?: boolean
  onClick?: () => void
}

function Voce({ icon, label, sublabel, danger, onClick }: VoceProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', width: '100%',
        background: 'none', border: 'none',
        borderBottom: '1px solid var(--prox-line2)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: danger ? 'oklch(0.96 0.04 25)' : 'var(--prox-surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: danger ? 'var(--prox-danger)' : 'var(--prox-ink2)',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: danger ? 'var(--prox-danger)' : 'var(--prox-ink)',
        }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', marginTop: 1 }}>{sublabel}</div>
        )}
      </div>
      <ChevronRight size={16} strokeWidth={1.75} color="var(--prox-ink3)" />
    </button>
  )
}

export function ProfiloScreen() {
  const user      = getCurrentUser()
  const [ruoliAperti, setRuoliAperti] = useState(false)
  const [passwordAperta, setPasswordAperta] = useState(false)
  const logout    = useLogout()
  const { data: eventiOggi = [] } = useEventi({ data: TODAY })

  const minOggi = eventiOggi.reduce((s, e) => s + e.durata_min, 0)

  return (
    <MobileLayout>
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* HERO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar nome={user?.name} size={56} />
          <div>
            <div className="prox-display" style={{ fontSize: 20, fontWeight: 700 }}>
              {user?.name ?? '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--prox-ink3)', marginTop: 2 }}>
              {user?.role ?? ''} · Prometheus
            </div>
          </div>
        </div>

        {/* ORE LAVORATE */}
        <Card padding={0}>
          <div style={{
            padding: '12px 16px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="prox-label">Ore lavorate</span>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: '1.5px solid var(--prox-line)',
              borderRadius: 999, padding: '4px 10px',
              fontSize: 12, fontWeight: 600, color: 'var(--prox-ink2)', cursor: 'pointer',
            }}>
              <Download size={13} strokeWidth={2} />
              Esporta
            </button>
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--prox-line2)' }}>
            <OreBox label="Oggi" minuti={minOggi} accent />
          </div>
        </Card>

        {/* IMPOSTAZIONI */}
        <Card padding={0}>
          <Voce
            icon={<KeyRound size={18} strokeWidth={1.75} />}
            label="Cambia password"
            sublabel="Scollega gli altri dispositivi"
            onClick={() => setPasswordAperta(true)}
          />
          <Voce
            icon={<Bell size={18} strokeWidth={1.75} />}
            label="Notifiche"
            sublabel="Turni, promemoria eventi"
          />
          <Voce
            icon={<Shield size={18} strokeWidth={1.75} />}
            label="Privacy & consensi"
            sublabel="Gestione dati persone"
          />
          <Voce
            icon={<BadgeCheck size={18} strokeWidth={1.75} />}
            label="Ruoli"
            sublabel="Educatore/trice, Psicologo/a… (maschile e femminile)"
            onClick={() => setRuoliAperti(true)}
          />
          <Voce
            icon={<Tag size={18} strokeWidth={1.75} />}
            label="Categorie & tag"
            sublabel="Personalizza tag e bisogni"
          />
          <Voce
            icon={<FileText size={18} strokeWidth={1.75} />}
            label="Modelli di rapporto"
            sublabel="Template per le note"
          />
        </Card>

        {/* ISTITUZIONE */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'var(--prox-accent-soft)',
          borderRadius: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--prox-accent)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--prox-accent-ink)' }}>
              Prometheus
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--prox-accent-ink)', opacity: 0.7 }}>
              Lugano centro · Équipe A
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <Card padding={0} style={{ marginBottom: 8 }}>
          <Voce
            icon={<LogOut size={18} strokeWidth={1.75} />}
            label="Esci"
            danger
            onClick={() => logout.mutate()}
          />
        </Card>

        {/* Version */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--prox-ink3)', paddingBottom: 8 }}>
          Proxi v0.1.0-dev · Prometheus
        </div>

      </div>
      {ruoliAperti && <RuoliManager onClose={() => setRuoliAperti(false)} />}
      {passwordAperta && <CambiaPasswordModal onClose={() => setPasswordAperta(false)} />}
    </MobileLayout>
  )
}
