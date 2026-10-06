// Avatar di una persona: la foto se c'è (scaricata col token), altrimenti iniziali

import { Avatar } from './Avatar'
import { useFotoPersona } from '../hooks/useDocumenti'
import { nomeAvatar } from '../lib/persona'
import type { Persona } from '../types'

export function AvatarPersona({ persona, size }: {
  persona: Pick<Persona, 'id' | 'nome' | 'cognome' | 'soprannome' | 'anonimo' | 'ha_foto' | 'updated_at'>
  size?: number
}) {
  const { data: foto } = useFotoPersona(persona.id, !!persona.ha_foto && !persona.anonimo, persona.updated_at)
  return <Avatar nome={nomeAvatar(persona)} anonimo={persona.anonimo} size={size} foto={foto} />
}
