// Card base — superficie bianca con ombra e bordo hairline

interface CardProps {
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  padding?: number | string
}

export function Card({ children, onClick, style, padding = 14 }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--prox-surface)',
        borderRadius: 14,
        border: '1px solid var(--prox-line2)',
        boxShadow: '0 1px 2px rgba(20,15,10,0.04), 0 1px 0 rgba(20,15,10,0.02)',
        padding,
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'background 0.1s' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
