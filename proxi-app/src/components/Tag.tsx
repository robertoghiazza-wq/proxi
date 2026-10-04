// Tag / chip colorato

interface TagProps {
  label: string
  color?: string        // CSS color string
  soft?: boolean        // sfondo soft, testo ink
  warn?: boolean
  style?: React.CSSProperties
}

export function Tag({ label, color, soft, warn, style }: TagProps) {
  let bg = color ?? 'var(--prox-accent-soft)'
  let fg = color ? '#fff' : 'var(--prox-accent-ink)'

  if (soft) { bg = 'var(--prox-surface2)'; fg = 'var(--prox-ink2)' }
  if (warn)  { bg = 'oklch(0.96 0.05 70)'; fg = 'oklch(0.50 0.14 70)' }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: bg, color: fg,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {label}
    </span>
  )
}
