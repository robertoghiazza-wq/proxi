// Servizio — dettaglio con mappa, contatti collegati e dettagli

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Building2, Phone, Edit, Plus, Star, Trash2, Mail, Globe, MapPin } from 'lucide-react'
import { Card } from '../components/Card'
import { Avatar } from '../components/Avatar'
import { LuogoMap } from '../components/LuogoMap'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NuovoLuogoModal } from '../components/NuovoLuogoModal'
import { ContattoServizioModal } from '../components/ContattoServizioModal'
import { useServizio, useDeleteServizio, useSyncContatti } from '../hooks/useServizi'
import type { Servizio } from '../types'

type Contatto = NonNullable<Servizio['persone']>[number]

const TINTA = 'oklch(0.58 0.12 245)'

function nomePersona(p: Contatto) {
  if (p.anonimo && p.soprannome) return `"${p.soprannome}"`
  return p.nome ?? (p.soprannome ? `"${p.soprannome}"` : '—')
}

export function ServizioDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: servizio, isLoading } = useServizio(Number(id))
  const sync = useSyncContatti(Number(id))
  const elimina = useDeleteServizio()

  const [collega, setCollega] = useState(false)
  const [modifica, setModifica] = useState<Contatto | null>(null)
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [creaLuogo, setCreaLuogo] = useState(false)
  const [luogoCreatoId, setLuogoCreatoId] = useState<number | null>(null)

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>Caricamento…</div>
  if (!servizio) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--prox-ink3)' }}>
        Servizio non trovato
        <br />
        <button onClick={() => navigate('/servizi')} style={{ marginTop: 12, cursor: 'pointer' }}>← Torna alla lista</button>
      </div>
    )
  }

  const contatti = servizio.persone ?? []
  const comune = [servizio.cap, servizio.localita].filter(Boolean).join(' ')
  const indirizzoCompleto = [servizio.indirizzo, comune].filter(Boolean).join(', ')

  function togglePrincipale(c: Contatto) {
    sync.mutate(contatti.map(x => ({
      persona_id: x.id,
      ruolo: x.pivot.ruolo,
      principale: x.id === c.id ? !c.pivot.principale : false,
    })))
  }

  return (
    <div style={{ background: 'var(--prox-bg)', minHeight: '100svh' }}>
      <div style={{ position: 'relative' }}>
        {servizio.lat != null && servizio.lng != null
          ? <LuogoMap lat={servizio.lat} lng={servizio.lng} />
          : (
            <div style={{
              height: 120, background: 'var(--prox-surface2)', color: 'var(--prox-ink3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, paddingTop: 36,
            }}>Posizione non impostata</div>
          )}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 12, left: 12, zIndex: 600,
          display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.9)', border: 'none',
          borderRadius: 999, padding: '6px 12px 6px 8px', cursor: 'pointer', color: 'var(--prox-ink2)',
          fontSize: 13, fontWeight: 500, backdropFilter: 'blur(8px)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        }}>
          <ChevronLeft size={18} strokeWidth={1.75} />
          Servizi
        </button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: TINTA + '22', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} color={TINTA} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="prox-display" style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.3, margin: 0, color: 'var(--prox-ink)' }}>
              {servizio.nome}
            </h1>
            {indirizzoCompleto && (
              <div style={{ fontSize: 13, color: 'var(--prox-ink3)', marginTop: 3 }}>{indirizzoCompleto}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {servizio.telefono ? (
            <a href={`tel:${servizio.telefono.replace(/\s+/g, '')}`} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'var(--prox-accent)', color: '#fff', borderRadius: 999, padding: '11px 0',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              <Phone size={16} strokeWidth={2} /> {servizio.telefono}
            </a>
          ) : <div style={{ flex: 1 }} />}
          <button onClick={() => navigate(`/servizi/${servizio.id}/modifica`)} style={iconBtn} aria-label="Modifica servizio">
            <Edit size={18} strokeWidth={1.75} color="var(--prox-ink2)" />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card padding="14px 16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="prox-label">Contatti</span>
            <button onClick={() => setCollega(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none',
              color: 'var(--prox-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={15} strokeWidth={2.4} /> Collega persona
            </button>
          </div>

          {contatti.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--prox-ink3)', margin: 0 }}>Nessuna persona collegata</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {contatti.map((c, i) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    borderTop: i ? '1px solid var(--prox-line2)' : 'none',
                  }}>
                    <div onClick={() => navigate(`/persone/${c.id}`)} style={{ cursor: 'pointer', display: 'flex' }}>
                      <Avatar nome={c.anonimo ? c.soprannome : c.nome} anonimo={c.anonimo} size={36} />
                    </div>
                    <div onClick={() => setModifica(c)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{nomePersona(c)}</div>
                      <div style={{ fontSize: 12, color: 'var(--prox-ink3)', marginTop: 1 }}>
                        {c.pivot.ruolo ?? 'Nessun ruolo'}
                      </div>
                    </div>
                    <button
                      onClick={() => togglePrincipale(c)}
                      aria-label={c.pivot.principale ? 'Contatto principale' : 'Imposta come principale'}
                      aria-pressed={c.pivot.principale}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}
                    >
                      <Star size={20} strokeWidth={1.75}
                        color={c.pivot.principale ? 'oklch(0.78 0.16 85)' : 'var(--prox-ink3)'}
                        fill={c.pivot.principale ? 'oklch(0.82 0.16 85)' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <Card padding="14px 16px">
          <div className="prox-label" style={{ marginBottom: 10 }}>Dettagli</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            {indirizzoCompleto && <Dato icon={<MapPin size={15} strokeWidth={1.75} />}>{indirizzoCompleto}{servizio.paese ? `, ${servizio.paese}` : ''}</Dato>}
            {servizio.telefono && <Dato icon={<Phone size={15} strokeWidth={1.75} />}>{servizio.telefono}</Dato>}
            {servizio.email && <Dato icon={<Mail size={15} strokeWidth={1.75} />}><a href={`mailto:${servizio.email}`} style={link}>{servizio.email}</a></Dato>}
            {servizio.sito && (
              <Dato icon={<Globe size={15} strokeWidth={1.75} />}>
                <a href={/^https?:\/\//.test(servizio.sito) ? servizio.sito : `https://${servizio.sito}`} target="_blank" rel="noreferrer" style={link}>{servizio.sito}</a>
              </Dato>
            )}
            {servizio.note && <p style={{ margin: 0, color: 'var(--prox-ink2)', lineHeight: 1.6 }}>{servizio.note}</p>}
            {!indirizzoCompleto && !servizio.telefono && !servizio.email && !servizio.sito && !servizio.note && (
              <span style={{ color: 'var(--prox-ink3)', fontSize: 13 }}>Nessun dettaglio inserito</span>
            )}
          </div>
        </Card>

        {luogoCreatoId !== null ? (
          <button onClick={() => navigate(`/luoghi/${luogoCreatoId}`)} style={{ ...azione, color: 'var(--prox-ok)' }}>
            Luogo creato — aprilo
          </button>
        ) : (
          <button onClick={() => setCreaLuogo(true)} style={azione}>
            <MapPin size={16} strokeWidth={1.75} /> Crea un luogo da questo servizio
          </button>
        )}

        <button onClick={() => setConfermaElimina(true)} style={{ ...azione, color: 'var(--prox-danger)' }}>
          <Trash2 size={16} strokeWidth={1.75} /> Elimina servizio
        </button>
      </div>

      {collega && <ContattoServizioModal servizio={servizio} onClose={() => setCollega(false)} />}
      {modifica && <ContattoServizioModal servizio={servizio} modifica={modifica} onClose={() => setModifica(null)} />}

      {creaLuogo && (
        <NuovoLuogoModal
          initial={{
            nome: servizio.nome,
            tipo: 'ufficio',
            indirizzo: indirizzoCompleto || null,
            lat: servizio.lat,
            lng: servizio.lng,
          }}
          onClose={() => setCreaLuogo(false)}
          onCreated={l => { setCreaLuogo(false); setLuogoCreatoId(l.id) }}
        />
      )}

      <ConfirmDialog
        open={confermaElimina}
        danger
        title="Eliminare il servizio?"
        message="I collegamenti con le persone vengono rimossi, le persone restano. L'operazione resta nel log."
        confirmLabel="Elimina"
        loading={elimina.isPending}
        error={elimina.isError ? (elimina.error as Error).message : null}
        onCancel={() => { setConfermaElimina(false); elimina.reset() }}
        onConfirm={() => elimina.mutate(servizio.id, { onSuccess: () => navigate('/servizi') })}
      />
    </div>
  )
}

function Dato({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--prox-ink2)' }}>
      <span style={{ marginTop: 3, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</span>
    </div>
  )
}

const link: React.CSSProperties = { color: 'var(--prox-accent)', textDecoration: 'none' }

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 999, background: 'var(--prox-surface)',
  border: '1px solid var(--prox-line)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}

const azione: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  border: '1.5px solid var(--prox-line)', borderRadius: 999, background: 'transparent',
  color: 'var(--prox-ink2)', padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%',
}
