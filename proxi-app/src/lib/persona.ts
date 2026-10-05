// Nome di una persona: anonimi = solo soprannome tra virgolette; altrimenti nome e cognome

import type { Persona, Ruolo } from '../types'

interface ConNome {
  nome?: string | null
  cognome?: string | null
  soprannome?: string | null
  anonimo?: boolean
}

export function nomePersona(p: ConNome): string {
  if (p.anonimo && p.soprannome) return `"${p.soprannome}"`
  const intero = [p.nome, p.cognome].filter(Boolean).join(' ')
  if (intero) return intero
  return p.soprannome ? `"${p.soprannome}"` : '—'
}

// Testo da cui l'avatar ricava le iniziali
export function nomeAvatar(p: ConNome): string | null {
  if (p.anonimo) return p.soprannome ?? null
  return [p.nome, p.cognome].filter(Boolean).join(' ') || p.soprannome || null
}

export function etichettaTipo(r: Persona['ruolo'], plurale = false): string {
  const m = { utente: ['Utente', 'Utenti'], dipendente: ['Dipendente', 'Dipendenti'], rete: ['Contatto', 'Contatti'] }[r]
  return m[plurale ? 1 : 0]
}

// Ruolo al maschile/femminile secondo il sesso; con sesso non noto la forma mista (es. "Educatore/trice").
export function etichettaRuolo(r: Ruolo | undefined | null, sesso: Persona['sesso'] | undefined): string {
  if (!r) return ''
  if (!r.nome_f) return r.nome_m
  if (sesso === 'M') return r.nome_m
  if (sesso === 'F') return r.nome_f
  return r.nome_misto ?? `${r.nome_m} / ${r.nome_f}`
}
