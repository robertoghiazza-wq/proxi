// Chi gestisce l'équipe (contratti, ore, account, elenchi). Il superadmin ha almeno i permessi dell'admin.
export const eGestore = (ruolo: string | null | undefined) => ['coordinatore', 'admin', 'superadmin'].includes(ruolo ?? '')
export const eAdmin = (ruolo: string | null | undefined) => ['admin', 'superadmin'].includes(ruolo ?? '')
