// Memoria dei percorsi visitati, per posizione nella cronologia del browser: serve a sapere da dove si arriva
// (la lista o un'altra scheda) per far funzionare «indietro» in modo prevedibile.

import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pila: string[] = []
const posizione = (): number => (window.history.state as { idx?: number } | null)?.idx ?? 0

export function TracciaPercorsi() {
  const { pathname } = useLocation()
  useLayoutEffect(() => { pila[posizione()] = pathname }, [pathname])
  return null
}

// Percorso della schermata precedente nella cronologia (undefined se si è aperto un link diretto)
export const percorsoPrecedente = (): string | undefined => (posizione() > 0 ? pila[posizione() - 1] : undefined)
