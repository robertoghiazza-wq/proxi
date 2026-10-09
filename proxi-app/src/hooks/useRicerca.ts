import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'

export type Ambito = 'persone' | 'luoghi' | 'eventi' | 'servizi'
export interface Trovato { campo: string; estratto: string | null }

// Ricerca estesa lato server: in quali campi (diario, note, indirizzo…) compare ciò che si è scritto.
// Restituisce null finché non c'è nulla da cercare o non è arrivata la prima risposta: in quel caso le liste filtrano da sole sui campi che hanno già.
export function useRicercaEstesa(ambito: Ambito, testo: string): Map<number, Trovato[]> | null {
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQ(testo.trim()), 250)
    return () => clearTimeout(t)
  }, [testo])

  const attiva = testo.trim().length >= 2 && q.length >= 2
  const { data } = useQuery<{ id: number; trovato: Trovato[] }[]>({
    queryKey: ['ricerca', ambito, q],
    queryFn: () => api.get(`/ricerca?ambito=${ambito}&q=${encodeURIComponent(q)}`),
    enabled: attiva,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })

  const mappa = useMemo(() => data ? new Map(data.map(r => [r.id, r.trovato])) : null, [data])
  return testo.trim().length < 2 ? null : mappa
}
