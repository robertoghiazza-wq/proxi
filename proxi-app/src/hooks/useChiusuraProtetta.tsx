// Chiusura di drawer e finestre con avviso se nei campi c'è qualcosa scritto e non salvato.
// Funziona sui campi (input, textarea, select) dentro il contenitore: ricorda il valore che avevano quando ci si è entrati
// e, a chiusura richiesta (Esc o clic fuori), confronta. Dopo un salvataggio andato a buon fine (qualsiasi mutation) il confronto riparte da zero.
// I campi di ricerca (data-senza-avviso) non contano.

import { useEffect, useState, type RefObject } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '../components/ConfirmDialog'

type Campo = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
const SELETTORE = 'input:not([type=file]):not([type=button]):not([type=submit]), textarea, select'

const valore = (el: Campo) => (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) ? String(el.checked) : el.value
const conta = (el: Element): el is Campo => el.matches(SELETTORE) && !el.closest('[data-senza-avviso]') && !el.hasAttribute('data-senza-avviso')

export function useChiusuraProtetta(rif: RefObject<HTMLElement | null>, attivo: boolean, chiudi?: () => void) {
  const qc = useQueryClient()
  const [chiede, setChiede] = useState(false)

  useEffect(() => {
    const radice = rif.current
    if (!attivo || !radice) return
    const base = new WeakMap<Element, string>()
    const toccati = new WeakSet<Element>()
    ;(radice as HTMLElement & { __modificato?: () => boolean }).__modificato = () =>
      [...radice.querySelectorAll(SELETTORE)].some(el => conta(el) && toccati.has(el) && base.has(el) && base.get(el) !== valore(el as Campo))

    const dentro = (e: Event) => { const el = e.target as Element | null; return el && conta(el) ? el : null }
    const suFocus = (e: Event) => { const el = dentro(e); if (el && !base.has(el)) base.set(el, valore(el as Campo)) }
    const suModifica = (e: Event) => {
      const el = dentro(e)
      if (!el || !e.isTrusted) return
      if (!base.has(el)) base.set(el, (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) ? String(!(el as HTMLInputElement).checked) : '')
      toccati.add(el)
    }
    radice.addEventListener('focusin', suFocus, true)
    radice.addEventListener('input', suModifica, true)
    radice.addEventListener('change', suModifica, true)

    // salvataggio riuscito: i valori attuali diventano il nuovo punto di partenza
    const annulla = qc.getMutationCache().subscribe(ev => {
      if (ev.type !== 'updated' || ev.action.type !== 'success') return
      radice.querySelectorAll(SELETTORE).forEach(el => { if (conta(el)) { base.set(el, valore(el as Campo)); toccati.delete(el) } })
    })

    return () => {
      radice.removeEventListener('focusin', suFocus, true)
      radice.removeEventListener('input', suModifica, true)
      radice.removeEventListener('change', suModifica, true)
      annulla()
    }
  }, [attivo, rif, qc])

  const tenta = () => {
    const modificato = (rif.current as (HTMLElement & { __modificato?: () => boolean }) | null)?.__modificato?.()
    if (modificato) setChiede(true)
    else chiudi?.()
  }

  const dialogo = (
    <ConfirmDialog
      open={chiede}
      danger
      title="Modifiche non salvate"
      message="Se chiudi adesso quello che hai scritto andrà perso."
      confirmLabel="Chiudi senza salvare"
      cancelLabel="Continua a modificare"
      onConfirm={() => { setChiede(false); chiudi?.() }}
      onCancel={() => setChiede(false)}
    />
  )

  return { tenta, dialogo }
}
