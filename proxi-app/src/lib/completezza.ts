// Completezza di un evento: calcolata dal server (campi mancanti), qui solo le etichette

const CAMPO: Record<string, string> = {
  tipo: 'tipo',
  data: 'data',
  ora: 'ora di inizio',
  durata: 'durata',
  luogo: 'luogo',
  persone: 'persone',
  note: 'note',
}

export function mancantiTesto(mancanti?: string[]): string {
  return (mancanti ?? []).map(m => CAMPO[m] ?? m).join(', ')
}

// L'evento è "da completare" solo se è già stato svolto: pianificati e in corso non lo sono ancora.
export function daCompletare(e: { stato: string; completo?: boolean }): boolean {
  return e.stato === 'completato' && e.completo === false
}
