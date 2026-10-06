// Schede Contratto e Account (accesso) di un dipendente — visibili solo a coordinatori e admin

import { useState } from 'react'
import { Edit, Plus, Copy, Check, Link2 } from 'lucide-react'
import { Card } from '../components/Card'
import { DateField } from '../components/DateFields'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Tag } from '../components/Tag'
import { Titolo, Voce, BarraSalva, etichetta, vuoto, testoStile, campo, btn, azione } from '../components/SchedaUi'
import { useContratti, useSalvaContratto, useEliminaContratto, useAccount, useGestioneAccount, type DatiContratto } from '../hooks/useDipendente'
import { useRuolo } from '../hooks/useAuth'
import { eAdmin } from '../lib/ruoli'
import type { Contratto, Persona, Role } from '../types'

const chf = (v: string | null) => (v === null ? '—' : `CHF ${new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))}`)
const num = (v: string | null, u: string) => (v === null ? '—' : `${Number(v).toLocaleString('it-CH', { maximumFractionDigits: 2 })} ${u}`)
const iban = (v: string | null) => (v ? v.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim() : '—')
const data = (d: string | null) => (d ? new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')
const oggi = () => new Date().toISOString().slice(0, 10)

// ─── CONTRATTO ────────────────────────────────────────────────────────────

const VUOTO: DatiContratto = {
  data_inizio: '', data_fine: null, stipendio_annuo: null, grado: null, ore_settimanali: null,
  iban: null, cassa_malati: null, avs: null, note: null,
}

export function ContrattoPanel({ persona }: { persona: Persona }) {
  const { data: contratti, isLoading, error } = useContratti(persona.id)
  const salva = useSalvaContratto(persona.id)
  const elimina = useEliminaContratto(persona.id)
  const [editing, setEditing] = useState<{ id?: number; d: DatiContratto } | null>(null)
  const [errore, setErrore] = useState('')
  const [daEliminare, setDaEliminare] = useState<Contratto | null>(null)

  if (!contratti) {
    return <Card padding="14px 16px"><p style={vuoto}>{isLoading ? 'Caricamento…' : (error as Error)?.message}</p></Card>
  }

  const attuale = contratti.find(c => c.data_inizio.slice(0, 10) <= oggi() && (!c.data_fine || c.data_fine.slice(0, 10) >= oggi())) ?? contratti[0]
  const storico = contratti.filter(c => c.id !== attuale?.id)

  const modifica = (c: Contratto) => {
    setErrore('')
    setEditing({
      id: c.id,
      d: {
        data_inizio: c.data_inizio.slice(0, 10), data_fine: c.data_fine?.slice(0, 10) ?? null, stipendio_annuo: c.stipendio_annuo,
        grado: c.grado, ore_settimanali: c.ore_settimanali, iban: c.iban, cassa_malati: c.cassa_malati, avs: c.avs, note: c.note,
      },
    })
  }

  async function conferma() {
    if (!editing) return
    if (!editing.d.data_inizio) { setErrore('La data di inizio è obbligatoria'); return }
    setErrore('')
    try {
      await salva.mutateAsync({ id: editing.id, ...editing.d })
      setEditing(null)
    } catch (e) {
      setErrore((e as Error).message || 'Errore nel salvataggio')
    }
  }

  if (editing) {
    const d = editing.d
    const imposta = (k: keyof DatiContratto, v: string | null) => setEditing(e => e && { ...e, d: { ...e.d, [k]: v } })
    const testo = (k: keyof DatiContratto, label: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
      <label style={{ display: 'block' }}>
        <div style={etichetta}>{label}</div>
        <input value={d[k] ?? ''} onChange={e => imposta(k, e.target.value || null)} style={campo} {...extra} />
      </label>
    )
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo={editing.id ? 'Modifica contratto' : 'Nuovo contratto'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div><div style={etichetta}>Data di inizio *</div><DateField value={d.data_inizio} onChange={e => imposta('data_inizio', e.target.value)} style={campo} title="Data di inizio" /></div>
              <div><div style={etichetta}>Data di fine</div><DateField value={d.data_fine ?? ''} onChange={e => imposta('data_fine', e.target.value || null)} style={campo} title="Data di fine" /></div>
            </div>
            {testo('stipendio_annuo', 'Stipendio annuo (CHF)', { inputMode: 'decimal', placeholder: '45000.00' })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {testo('grado', 'Grado (%)', { inputMode: 'decimal', placeholder: '60' })}
              {testo('ore_settimanali', 'Ore settimanali', { inputMode: 'decimal', placeholder: '24' })}
            </div>
            {testo('iban', 'IBAN', { placeholder: 'CH55 0023 4234 1370 1540 B', autoCapitalize: 'characters' })}
            {testo('cassa_malati', 'Cassa malati')}
            {testo('avs', 'Numero AVS', { inputMode: 'numeric', placeholder: '756.0000.0000.00' })}
            <label style={{ display: 'block' }}>
              <div style={etichetta}>Note</div>
              <textarea value={d.note ?? ''} onChange={e => imposta('note', e.target.value || null)} rows={3} style={{ ...campo, resize: 'vertical' }} />
            </label>
            {editing.id && (
              <button onClick={() => setDaEliminare(contratti.find(c => c.id === editing.id) ?? null)} style={{ ...btn, color: 'var(--prox-danger)', alignSelf: 'flex-start' }}>
                Elimina contratto
              </button>
            )}
          </div>
        </Card>
        <BarraSalva errore={errore} caricamento={salva.isPending} onSalva={conferma} onAnnulla={() => setEditing(null)} />
        <ConfermaElimina contratto={daEliminare} elimina={elimina} onChiudi={() => setDaEliminare(null)} onFatto={() => { setDaEliminare(null); setEditing(null) }} />
      </>
    )
  }

  return (
    <>
      <Card padding="14px 16px">
        <Titolo
          titolo={attuale ? 'Contratto' : 'Contratto'}
          azione={
            <div style={{ display: 'flex', gap: 12 }}>
              {attuale && <button onClick={() => modifica(attuale)} style={azione}><Edit size={14} strokeWidth={2} /> Modifica</button>}
              <button onClick={() => { setErrore(''); setEditing({ d: { ...VUOTO, data_inizio: oggi() } }) }} style={azione}><Plus size={14} strokeWidth={2.4} /> Nuovo</button>
            </div>
          }
        />
        {!attuale ? <p style={vuoto}>Nessun contratto registrato.</p> : (
          <>
            <div style={{ marginBottom: 12 }}>
              {!attuale.data_fine || attuale.data_fine.slice(0, 10) >= oggi()
                ? <Tag label="In corso" soft /> : <Tag label="Terminato" />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 16px' }}>
              <Voce l="Stipendio annuo" v={chf(attuale.stipendio_annuo)} />
              <Voce l="Grado" v={num(attuale.grado, '%')} />
              <Voce l="Ore settimanali" v={num(attuale.ore_settimanali, 'h')} />
              <Voce l="Inizio" v={data(attuale.data_inizio)} />
              <Voce l="Fine" v={data(attuale.data_fine)} />
              <Voce l="Cassa malati" v={attuale.cassa_malati ?? '—'} />
              <Voce l="IBAN" v={iban(attuale.iban)} mono />
              <Voce l="Numero AVS" v={attuale.avs ?? '—'} mono />
            </div>
            {attuale.note && <p style={{ ...testoStile, marginTop: 12 }}>{attuale.note}</p>}
          </>
        )}
      </Card>

      {storico.length > 0 && (
        <Card padding="14px 16px">
          <Titolo titolo="Storico contratti" conto={storico.length} />
          {storico.map((c, i) => (
            <button key={c.id} onClick={() => modifica(c)} style={{
              display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: 'none', border: 'none',
              borderTop: i ? '1px solid var(--prox-line2)' : 'none', padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 14 }}>{data(c.data_inizio)} → {data(c.data_fine)}</span>
              <span style={{ fontSize: 13, color: 'var(--prox-ink3)' }}>{num(c.grado, '%')} · {chf(c.stipendio_annuo)}</span>
            </button>
          ))}
        </Card>
      )}
      <ConfermaElimina contratto={daEliminare} elimina={elimina} onChiudi={() => setDaEliminare(null)} onFatto={() => setDaEliminare(null)} />
    </>
  )
}

function ConfermaElimina({ contratto, elimina, onChiudi, onFatto }: {
  contratto: Contratto | null
  elimina: ReturnType<typeof useEliminaContratto>
  onChiudi: () => void
  onFatto: () => void
}) {
  return (
    <ConfirmDialog
      open={contratto !== null}
      danger
      title="Eliminare il contratto?"
      message="Sparisce dalla scheda, ma l'operazione resta nel log."
      confirmLabel="Elimina"
      loading={elimina.isPending}
      error={elimina.isError ? (elimina.error as Error).message : null}
      onCancel={() => { onChiudi(); elimina.reset() }}
      onConfirm={() => contratto && elimina.mutate(contratto.id, { onSuccess: onFatto })}
    />
  )
}

// ─── ACCOUNT ──────────────────────────────────────────────────────────────

const RUOLI_ACCOUNT: { key: Role; label: string }[] = [
  { key: 'educatore', label: 'Educatore/trice' },
  { key: 'coordinatore', label: 'Coordinatore/trice' },
  { key: 'admin', label: 'Admin' },
]

export function AccountPanel({ persona }: { persona: Persona }) {
  const { data, isLoading, error } = useAccount(persona.id)
  const g = useGestioneAccount(persona.id)
  const sonoAdmin = eAdmin(useRuolo())
  const ruoliPossibili = RUOLI_ACCOUNT.filter(r => sonoAdmin || r.key === 'educatore')

  const [email, setEmail] = useState(persona.email ?? '')
  const [ruolo, setRuolo] = useState<Role>('educatore')
  const [link, setLink] = useState<string | null>(null)
  const [copiato, setCopiato] = useState(false)
  const [errore, setErrore] = useState('')
  const [conferma, setConferma] = useState<'reset' | 'disattiva' | null>(null)

  async function esegui(f: () => Promise<{ link_invito?: string }>) {
    setErrore('')
    try {
      const r = await f()
      if (r.link_invito) { setLink(r.link_invito); setCopiato(false) }
    } catch (e) {
      setErrore((e as Error).message || 'Errore')
    }
  }

  async function copia() {
    if (!link) return
    try { await navigator.clipboard.writeText(link); setCopiato(true) } catch { setCopiato(false) }
  }

  if (!data) return <Card padding="14px 16px"><p style={vuoto}>{isLoading ? 'Caricamento…' : (error as Error)?.message}</p></Card>
  const a = data.account

  const boxLink = link && (
    <Card padding="14px 16px">
      <Titolo titolo="Link di accesso" />
      <p style={{ ...testoStile, marginBottom: 10 }}>
        Invia questo link alla persona: serve per scegliere la password. Vale 7 giorni, si usa una sola volta e <strong>non verrà più mostrato</strong>.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input readOnly value={link} onFocus={e => e.target.select()} style={{ ...campo, fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
        <button onClick={copia} style={{ ...btn, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {copiato ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={1.75} />} {copiato ? 'Copiato' : 'Copia'}
        </button>
      </div>
    </Card>
  )

  if (!a) {
    return (
      <>
        <Card padding="14px 16px">
          <Titolo titolo="Account di accesso" />
          <p style={{ ...testoStile, marginBottom: 14 }}>
            Questa persona non ha ancora un account. Creandolo, ricevi un link per farle scegliere la password: nessuna password viene mai assegnata o mostrata.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label><div style={etichetta}>Email di accesso</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@associazioneprometheus.ch" style={campo} /></label>
            <label><div style={etichetta}>Ruolo nell’app</div>
              <select value={ruolo} onChange={e => setRuolo(e.target.value as Role)} style={{ ...campo, appearance: 'auto' }}>
                {ruoliPossibili.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select></label>
            {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}
            <button onClick={() => esegui(() => g.crea.mutateAsync({ email: email.trim(), role: ruolo }))} disabled={!email.trim() || g.crea.isPending} style={{
              alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: email.trim() ? 1 : 0.5,
            }}>
              {g.crea.isPending ? 'Creo…' : 'Crea account'}
            </button>
          </div>
        </Card>
        {boxLink}
      </>
    )
  }

  const stato = !a.attivo ? <Tag label="Disattivato" warn /> : a.invito_scaduto ? <Tag label="Invito scaduto" warn /> : a.invito_in_corso ? <Tag label="In attesa del primo accesso" soft /> : <Tag label="Attivo" soft />

  return (
    <>
      <Card padding="14px 16px">
        <Titolo titolo="Account di accesso" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{stato}</div>
          <Voce l="Email" v={a.email} />
          <Voce l="Ultimo accesso" v={a.ultimo_accesso_il ? new Date(a.ultimo_accesso_il).toLocaleString('it-CH', { dateStyle: 'medium', timeStyle: 'short' }) : 'Mai'} />
          <label>
            <div style={etichetta}>Ruolo nell’app</div>
            <select
              value={a.role}
              disabled={g.aggiorna.isPending || (!sonoAdmin && a.role !== 'educatore')}
              onChange={e => esegui(() => g.aggiorna.mutateAsync({ role: e.target.value as Role }))}
              style={{ ...campo, appearance: 'auto', maxWidth: 260 }}
            >
              {RUOLI_ACCOUNT.filter(r => sonoAdmin || r.key === a.role || r.key === 'educatore').map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </label>
          {errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setConferma('reset')} style={{ ...btn, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link2 size={15} strokeWidth={1.75} /> Nuovo link di accesso
            </button>
            {a.attivo
              ? <button onClick={() => setConferma('disattiva')} style={{ ...btn, color: 'var(--prox-danger)' }}>Disattiva account</button>
              : <button onClick={() => esegui(() => g.aggiorna.mutateAsync({ attivo: true }))} style={btn}>Riattiva account</button>}
          </div>
        </div>
      </Card>
      {boxLink}

      <ConfirmDialog
        open={conferma !== null}
        danger={conferma === 'disattiva'}
        title={conferma === 'reset' ? 'Generare un nuovo link?' : 'Disattivare l’account?'}
        message={conferma === 'reset'
          ? 'La password attuale smette di valere e i dispositivi collegati vengono scollegati, finché la persona non sceglie una nuova password dal link.'
          : 'La persona non potrà più accedere e verrà scollegata dai dispositivi. Potrai riattivarla quando vuoi.'}
        confirmLabel={conferma === 'reset' ? 'Genera link' : 'Disattiva'}
        loading={g.reset.isPending || g.aggiorna.isPending}
        onCancel={() => setConferma(null)}
        onConfirm={async () => {
          const c = conferma
          setConferma(null)
          if (c === 'reset') await esegui(() => g.reset.mutateAsync())
          else await esegui(() => g.aggiorna.mutateAsync({ attivo: false }))
        }}
      />
    </>
  )
}
