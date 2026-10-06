// Logo dell'ente: quello caricato dall'admin, altrimenti (per ora) quello di Prometheus, altrimenti il monogramma sul colore del brand

import prometheus from '../assets/org/prometheus.svg'
import { useLogoEnte } from '../hooks/useEnte'

export function OrgLogo({ nome, size = 22, haLogo, versione }: { nome?: string | null; size?: number; haLogo?: boolean; versione?: string }) {
  const { data: logo } = useLogoEnte(!!haLogo, versione)

  if (logo) {
    return <img src={logo} alt={nome ?? ''} style={{ display: 'block', flexShrink: 0, height: size, width: 'auto', maxWidth: size * 3, objectFit: 'contain' }} />
  }
  if (nome && /prometheus/i.test(nome)) {
    return <img src={prometheus} alt={nome} width={size} height={size} style={{ display: 'block', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, background: 'var(--prox-accent)', color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, fontWeight: 700,
    }}>
      {(nome ?? '?').trim()[0]?.toUpperCase()}
    </div>
  )
}
