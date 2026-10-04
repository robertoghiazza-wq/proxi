// Avatar — cerchio con iniziali o glifo anonimo
// Il colore di sfondo è deterministico sul nome (stesso del design handoff)

interface AvatarProps {
  nome?: string | null
  anonimo?: boolean
  size?: number
}

function hashColor(str: string): string {
  const palette = [
    '#e8d5f5','#d5e8f5','#d5f5e3','#f5e8d5',
    '#f5d5d5','#d5f5f5','#f5f5d5','#e0d5f5',
  ]
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ nome, anonimo, size = 36 }: AvatarProps) {
  const bg = nome ? hashColor(nome) : '#e8e9ec'
  const fs = size * 0.38

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontSize: fs, fontWeight: 600, color: '#444a55',
      fontFamily: "'Inter', sans-serif",
    }}>
      {anonimo || !nome
        ? <AnonymousGlyph size={size * 0.52} />
        : initials(nome)
      }
    </div>
  )
}

function AnonymousGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="#858c97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}
