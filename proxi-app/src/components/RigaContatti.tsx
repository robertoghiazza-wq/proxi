// Chiama · WhatsApp · Email: compaiono solo se il dato c'è (e il numero è valido). Il messaggio normale sta accanto a ogni numero.

import type { ReactNode } from 'react'
import { Phone, Mail, MessageSquare } from 'lucide-react'
import { apriWhatsApp, linkEmail, linkSms, linkTel, linkWhatsApp } from '../lib/contatti'

export function IconaWhatsApp({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24m-3.2 3.7c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.17.25-.64.8-.78.96-.14.17-.29.19-.53.07-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.7-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42z" />
    </svg>
  )
}

// Accanto a un numero: cornetta, messaggio normale e WhatsApp (solo se il numero è valido)
export function AzioniNumero({ numero }: { numero?: string | null }) {
  const stile: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, color: 'var(--prox-ink2)', textDecoration: 'none' }
  const tel = linkTel(numero), sms = linkSms(numero), wa = linkWhatsApp(numero)
  if (!tel) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <a href={tel} aria-label={`Chiama ${numero}`} title="Chiama" style={stile}><Phone size={17} strokeWidth={1.75} /></a>
      {sms && <a href={sms} aria-label={`Messaggio a ${numero}`} title="Messaggio" style={stile}><MessageSquare size={17} strokeWidth={1.75} /></a>}
      {wa && <a href={wa} onClick={e => apriWhatsApp(e, numero)} aria-label={`WhatsApp a ${numero}`} title="WhatsApp" style={{ ...stile, color: '#1f9d55' }}><IconaWhatsApp size={18} /></a>}
    </span>
  )
}

interface Voce { chiave: string; etichetta: string; href: string | null; icona: ReactNode }

export function RigaContatti({ telefono, email, style }: { telefono?: string | null; email?: string | null; style?: React.CSSProperties }) {
  const voci: Voce[] = [
    { chiave: 'chiama', etichetta: 'Chiama', href: linkTel(telefono), icona: <Phone size={18} strokeWidth={1.8} /> },
    { chiave: 'whatsapp', etichetta: 'WhatsApp', href: linkWhatsApp(telefono), icona: <IconaWhatsApp /> },
    { chiave: 'email', etichetta: 'Email', href: linkEmail(email), icona: <Mail size={18} strokeWidth={1.8} /> },
  ].filter(v => v.href) as Voce[]
  if (voci.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', ...style }}>
      {voci.map(v => (
        <a key={v.chiave} href={v.href!} onClick={v.chiave === 'whatsapp' ? e => apriWhatsApp(e, telefono) : undefined} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none', minWidth: 64,
          color: v.chiave === 'whatsapp' ? '#1f9d55' : 'var(--prox-ink2)', fontSize: 11.5, fontWeight: 600,
        }}>
          <span style={{
            width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--prox-surface)', border: '1px solid var(--prox-line)',
          }}>{v.icona}</span>
          {v.etichetta}
        </a>
      ))}
    </div>
  )
}
