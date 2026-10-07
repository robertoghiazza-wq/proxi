// Settimane ISO (lunedì–domenica), come nei resoconti dell'équipe

export function settimanaIso(d: Date): { anno: number; settimana: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const giorno = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - giorno)                 // il giovedì della settimana decide l'anno
  const inizioAnno = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return { anno: t.getUTCFullYear(), settimana: Math.ceil(((t.getTime() - inizioAnno.getTime()) / 86400000 + 1) / 7) }
}

export function lunediDi(anno: number, settimana: number): Date {
  const quattroGen = new Date(Date.UTC(anno, 0, 4))
  const giorno = quattroGen.getUTCDay() || 7
  const lunedi = new Date(quattroGen)
  lunedi.setUTCDate(quattroGen.getUTCDate() - (giorno - 1) + (settimana - 1) * 7)
  return new Date(lunedi.getUTCFullYear(), lunedi.getUTCMonth(), lunedi.getUTCDate())
}

export function spostaSettimana(anno: number, settimana: number, delta: number): { anno: number; settimana: number } {
  const l = lunediDi(anno, settimana)
  l.setDate(l.getDate() + delta * 7)
  return settimanaIso(l)
}

export function etichettaSettimana(anno: number, settimana: number): string {
  const l = lunediDi(anno, settimana)
  const d = new Date(l); d.setDate(d.getDate() + 6)
  const g = (x: Date, m: boolean) => x.toLocaleDateString('it-CH', m ? { day: 'numeric', month: 'long' } : { day: 'numeric' })
  return l.getMonth() === d.getMonth()
    ? `${g(l, false)}–${g(d, true)} ${d.getFullYear()}`
    : `${g(l, true)} – ${g(d, true)} ${d.getFullYear()}`
}
