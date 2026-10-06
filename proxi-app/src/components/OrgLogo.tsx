// Logo dell'ente: quello vero se lo abbiamo (per ora Prometheus), altrimenti il monogramma sul colore del brand

import prometheus from '../assets/org/prometheus.svg'

export function OrgLogo({ nome, size = 22 }: { nome?: string | null; size?: number }) {
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
