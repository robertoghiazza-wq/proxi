// Numeri di telefono -> link per chiamare, scrivere e aprire WhatsApp (solo se il numero c'è e sembra valido)

// Cifre in formato internazionale senza «+» (es. 41791234567); i numeri senza prefisso si considerano svizzeri
export function numeroInternazionale(numero?: string | null): string | null {
  if (!numero) return null
  const t = numero.trim()
  let c = t.replace(/[^\d]/g, '')
  if (t.startsWith('+')) { /* già internazionale */ }
  else if (c.startsWith('00')) c = c.slice(2)
  else if (c.startsWith('0')) c = '41' + c.slice(1)
  else if (c.length === 9) c = '41' + c
  return c.length >= 9 && c.length <= 15 ? c : null
}

export const haNumero = (numero?: string | null) => numeroInternazionale(numero) !== null

export function linkTel(numero?: string | null): string | null {
  const n = numeroInternazionale(numero)
  return n ? `tel:+${n}` : null
}

export function linkSms(numero?: string | null): string | null {
  const n = numeroInternazionale(numero)
  return n ? `sms:+${n}` : null
}

// Protocollo dell'app (apre direttamente WhatsApp, su telefono e sul Mac); wa.me passerebbe da una pagina web intermedia
export function linkWhatsApp(numero?: string | null): string | null {
  const n = numeroInternazionale(numero)
  return n ? `whatsapp://send?phone=${n}` : null
}

export const linkEmail = (email?: string | null) => email && /^\S+@\S+\.\S+$/.test(email.trim()) ? `mailto:${email.trim()}` : null

// Pagina web di scorta: serve solo se l'app non risponde
export function linkWhatsAppWeb(numero?: string | null): string | null {
  const n = numeroInternazionale(numero)
  return n ? `https://wa.me/${n}` : null
}

// Click su «WhatsApp»: prova ad aprire l'app; se entro 2 secondi la pagina non ha perso il focus (l'app non è partita) apre la pagina web di scorta.
export function apriWhatsApp(e: { preventDefault(): void }, numero?: string | null) {
  const app = linkWhatsApp(numero), web = linkWhatsAppWeb(numero)
  if (!app || !web) return
  e.preventDefault()

  let partita = false
  const segna = () => { partita = true }
  window.addEventListener('blur', segna)
  document.addEventListener('visibilitychange', segna)
  window.addEventListener('pagehide', segna)

  if (window.matchMedia('(pointer: coarse)').matches) {
    window.location.href = app
  } else {
    // sul computer, in un iframe nascosto: se non c'è l'app il browser non mostra errori
    const f = document.createElement('iframe')
    f.style.display = 'none'
    f.src = app
    document.body.appendChild(f)
    setTimeout(() => f.remove(), 3000)
  }

  setTimeout(() => {
    window.removeEventListener('blur', segna)
    document.removeEventListener('visibilitychange', segna)
    window.removeEventListener('pagehide', segna)
    if (partita) return
    if (!window.open(web, '_blank', 'noopener')) window.location.assign(web)   // popup bloccato: si apre qui
  }, 2000)
}
