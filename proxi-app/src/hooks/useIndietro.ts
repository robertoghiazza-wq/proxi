import { useNavigate } from 'react-router-dom'
import { percorsoPrecedente } from '../lib/percorsi'

// «Indietro» prevedibile: se si arriva da un'altra schermata dell'app (la lista o un'altra scheda) si torna lì,
// altrimenti (link diretto, ricarica) si va alla lista, mai fuori dall'app. `chiudi` porta sempre alla lista.
// `daAltraScheda`: si arriva da una scheda diversa dalla lista (es. persona -> evento), quindi «indietro» ≠ «chiudi».
export function useIndietro(lista: string) {
  const navigate = useNavigate()
  const precedente = percorsoPrecedente()
  return {
    daAltraScheda: precedente !== undefined && precedente !== lista,
    indietro: () => (precedente !== undefined ? navigate(-1) : navigate(lista)),
    chiudi: () => navigate(lista),
  }
}
