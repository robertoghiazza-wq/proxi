// Tasto Esc: agisce solo l'ultimo elemento aperto (conferma, finestra, drawer, campo di ricerca con testo), poi il precedente.

import { useEffect, useRef } from 'react'

const pila: Array<() => void> = []

function suTasto(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return
  const ultimo = pila[pila.length - 1]
  if (!ultimo) return
  e.preventDefault()
  ultimo()
}

export function useEsc(attivo: boolean, azione?: () => void) {
  const rif = useRef(azione)
  rif.current = azione
  useEffect(() => {
    if (!attivo) return
    const voce = () => rif.current?.()
    pila.push(voce)
    if (pila.length === 1) window.addEventListener('keydown', suTasto)
    return () => {
      const i = pila.indexOf(voce)
      if (i >= 0) pila.splice(i, 1)
      if (pila.length === 0) window.removeEventListener('keydown', suTasto)
    }
  }, [attivo])
}
