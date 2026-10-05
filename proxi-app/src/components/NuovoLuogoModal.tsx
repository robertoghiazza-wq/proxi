// Creazione rapida di un luogo da dentro un altro flusso (evento)

import { Modal } from './Modal'
import { LuogoForm } from '../screens/NuovoLuogoScreen'
import type { Luogo } from '../types'

export function NuovoLuogoModal({ onClose, onCreated, initial }: {
  onClose: () => void
  onCreated: (luogo: Luogo) => void
  initial?: Partial<Luogo>
}) {
  return (
    <Modal open onClose={onClose}>
      <LuogoForm onClose={onClose} onSaved={onCreated} initial={initial} />
    </Modal>
  )
}
