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

export function linkWhatsApp(numero?: string | null): string | null {
  const n = numeroInternazionale(numero)
  return n ? `https://wa.me/${n}` : null
}

export const linkEmail = (email?: string | null) => email && /^\S+@\S+\.\S+$/.test(email.trim()) ? `mailto:${email.trim()}` : null
