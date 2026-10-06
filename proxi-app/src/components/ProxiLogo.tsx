// Logo Proxi (wordmark con la «i» seduta, oppure solo il simbolo). Distanza minima: il diametro della testa rossa.

import wordmark from '../assets/logo/proxi-wordmark.svg'
import wordmarkWhite from '../assets/logo/proxi-wordmark-white.svg'
import symbol from '../assets/logo/proxi-symbol.svg'
import symbolWhite from '../assets/logo/proxi-symbol-white.svg'

export function ProxiLogo({ height = 26, variant = 'ink', solo = 'parola', style }: {
  height?: number
  variant?: 'ink' | 'white'
  solo?: 'parola' | 'simbolo'
  style?: React.CSSProperties
}) {
  const src = solo === 'simbolo' ? (variant === 'white' ? symbolWhite : symbol) : variant === 'white' ? wordmarkWhite : wordmark
  return <img src={src} alt="Proxi" height={height} style={{ display: 'block', height, width: 'auto', ...style }} />
}
