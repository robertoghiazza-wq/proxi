// Eventi — lista raggruppata per giorno con filtri stato

import { useTipiEvento } from '../hooks/useTipi'
import { nomeAvatar } from '../lib/persona'
import { useState } from 'react'
import { useNavigate, useMatch, Outlet } from 'react-router-dom'
import { MobileLayout } from '../components/MobileLayout'
import { Drawer } from '../components/Drawer'
import { Modal } from '../components/Modal'
import { Card } from '../components/Card'
import { SwipeRow } from '../components/SwipeRow'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { daCompletare, mancantiTesto } from '../lib/completezza'
import { useEventi, useDeleteEvento } from '../hooks/useEventi'
import type { Evento, StatoEvento } from '../types'
import { Plus, Check, CircleDashed, Calendar } from 'lucide-react'
import { CampoRicerca, ConteggioRisultati } from '../components/CampoRicerca'
import { useRicercaEstesa } from '../hooks/useRicerca'
import { TrovatoIn } from '../components/TrovatoIn'
import { passaFiltri, type FiltroCat } from '../lib/filtriCategoria'

type Filtro = 'tutti' | StatoEvento | 'incompleti'

const FILTRI: { key: Filtro; label: string }[] = [
  { key: 'tutti',       label: 'Tutti'    },
  { key: 'completato',  label: 'Svolti'   },
  { key: 'pianificato', label: 'Pianif.'  },
  { key: 'in_corso',    label: 'In corso' },
  { key: 'incompleti',  label: 'Da completare' },
]

function minToHM(m: number) {
  const h = Math.floor(m / 60)
  const r = m % 60
  return h > 0 ? `${h}h ${r > 0 ? r + 'm' : ''}` : `${r}m`
}

function fmtData(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('it-CH', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function EventiScreen() {
  const { label: tipoLabel, colore: colorForTipo, tipi: tipiEvento, categorie: categorieEvento, categoriaDi } = useTipiEvento()
  const navigate = useNavigate()
  const isNuovoOpen  = !!useMatch('/eventi/nuovo')
  const isDetailOpen = !!useMatch('/eventi/:id/*') && !isNuovoOpen
  const [filtro, setFiltro] = useState<Filtro>('tutti')
  const [query, setQuery] = useState('')
  const [filtriCat, setFiltriCat] = useState<FiltroCat[]>([])
  const candidati: FiltroCat[] = [
    ...tipiEvento.filter(t => t.attivo).map(t => ({ gruppo: 'Tipo', id: t.chiave, label: t.nome })),
    ...categorieEvento.map(c => ({ gruppo: 'Categoria', id: String(c.id), label: c.nome })),
  ]
  const [daEliminare, setDaEliminare] = useState<Evento | null>(null)
  const eliminaEvento = useDeleteEvento()

  const { data: tuttiEventi = [], isLoading } = useEventi({})

  // Ricerca su tipo, luogo, persone, note e data (senza distinguere maiuscole e accenti)
  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const q = norm(query.trim())
  // ricerca estesa (note, tappe, luoghi, persone, educatore, date…): finché non risponde il server si filtra sui campi dell'elenco
  const trovati = useRicercaEstesa('eventi', query)
  const corrisponde = (e: Evento) => !q || (trovati ? trovati.has(e.id) : norm([
    tipoLabel(e.tipo), e.luogo?.nome, e.note, fmtData(e.data), e.data,
    ...(e.persone ?? []).flatMap(p => [p.nome, p.cognome, p.soprannome]),
  ].filter(Boolean).join(' ')).includes(q))

  const filtrati = tuttiEventi
    .filter(e => filtro === 'tutti'
      || (filtro === 'incompleti' ? daCompletare(e) : e.stato === filtro))
    .filter(e => passaFiltri(e, filtriCat, (x, f) => f.gruppo === 'Tipo' ? x.tipo === f.id : String(categoriaDi(x.tipo)?.id) === f.id))
    .filter(corrisponde)
  const nIncompleti = tuttiEventi.filter(daCompletare).length

  // Raggruppa per giorno
  const giorni = [...new Set(filtrati.map(e => e.data))]

  return (
    <MobileLayout>
      {/* Header sticky */}
      <div style={{
        padding: '20px 16px 12px',
        background: 'var(--prox-surface2)', boxShadow: '0 4px 10px rgba(20,23,28,0.05)',
        borderBottom: '1px solid var(--prox-line)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="prox-display" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}>
            <Calendar size={18} strokeWidth={1.75} />
            Eventi
          </div>
          <button onClick={() => navigate('/eventi/nuovo')} style={newBtn} aria-label="Nuovo evento">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <CampoRicerca value={query} onChange={setQuery} placeholder="Cerca persona, luogo, tipo, note, data…" candidati={candidati} filtri={filtriCat} onFiltri={setFiltriCat} />
        <ConteggioRisultati mostrati={filtrati.length} totali={tuttiEventi.length} singolare="evento" plurale="eventi" style={{ marginBottom: 10 }} filtri={filtriCat} onFiltri={setFiltriCat} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -16px', padding: '0 16px', scrollbarWidth: 'none' }}>
          {FILTRI.map(({ key, label }) => {
            const active = filtro === key
            return (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                style={{
                  padding: '4px 10px', borderRadius: 999, border: `1px solid ${active ? 'transparent' : 'var(--prox-line)'}`,
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  background: active ? 'var(--prox-accent)' : 'var(--prox-surface)',
                  color: active ? '#fff' : 'var(--prox-ink2)',
                }}
              >
                {label}
                {key === 'incompleti' && nIncompleti > 0 && (
                  <span style={{ marginLeft: 5, opacity: active ? 0.85 : 1, color: active ? '#fff' : 'var(--prox-warn)' }}>{nIncompleti}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista per giorno */}
      <div style={{ padding: '8px 16px' }}>
        {isLoading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Caricamento…</div>
        )}
        {!isLoading && filtrati.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>{q ? 'Nessun risultato' : 'Nessun evento'}</div>
        )}
        {giorni.map(data => {
          const eventiGiorno = filtrati.filter(e => e.data === data)
          const totMin = eventiGiorno.reduce((s, e) => s + e.durata_min, 0)

          return (
            <div key={data} style={{ marginBottom: 20 }}>
              {/* Intestazione giorno */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--prox-ink2)',
                  textTransform: 'capitalize',
                }}>
                  {fmtData(data)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--prox-ink3)', fontFamily: 'ui-monospace, monospace' }}>
                  {minToHM(totMin)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {eventiGiorno.map(e => {
                  const color = colorForTipo(e.tipo)
                  const luogo = e.luogo ?? null
                  const nomi = (e.persone ?? [])
                    .map(p => (nomeAvatar(p) ?? p.soprannome))
                    .filter(Boolean)

                  return (
                    <SwipeRow key={e.id} onDelete={() => setDaEliminare(e)}>
                    <Card
                      onClick={() => navigate(`/eventi/${e.id}`)}
                      padding={10}
                      style={{ display: 'flex', gap: 10, alignItems: 'center' }}
                    >
                      <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />

                      <div className="prox-mono" style={{ width: 42, fontSize: 11.5, color: 'var(--prox-ink3)', flexShrink: 0 }}>
                        <div>{e.ora_inizio ? e.ora_inizio.slice(0, 5) : '—'}</div>
                        <div style={{ fontSize: 10 }}>{e.durata_min}m</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 600, marginBottom: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {nomi.length ? nomi.join(', ') : tipoLabel(e.tipo)}
                        </div>
                        <div style={{
                          fontSize: 11, color: 'var(--prox-ink3)', display: 'flex', gap: 5,
                          alignItems: 'center', minWidth: 0,
                        }}>
                          <span style={{ flexShrink: 0 }}>{tipoLabel(e.tipo)}</span>
                          {luogo && <><span>·</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{luogo.nome}</span></>}
                        </div>
                        <TrovatoIn trovato={q ? trovati?.get(e.id) : undefined} nascondi={['Tipo', 'Luogo', 'Persone', 'Data']} />
                      </div>

                      {e.stato === 'in_corso' && (
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, color: 'var(--prox-accent)',
                          background: 'var(--prox-accent-soft)', borderRadius: 999,
                          padding: '1px 6px', textTransform: 'uppercase', flexShrink: 0,
                        }}>Live</span>
                      )}
                      {e.stato === 'completato' && e.completo && (
                        <Check size={14} color="var(--prox-ok)" strokeWidth={2.2} style={{ flexShrink: 0 }} aria-label="Completo" />
                      )}
                      {daCompletare(e) && (
                        <span
                          title={`Mancano: ${mancantiTesto(e.mancanti)}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                            fontSize: 10.5, fontWeight: 700, color: 'oklch(0.50 0.13 70)',
                            background: 'oklch(0.95 0.06 85)', borderRadius: 999, padding: '2px 7px',
                          }}
                        >
                          <CircleDashed size={11} strokeWidth={2.4} />
                          Da completare
                        </span>
                      )}
                    </Card>
                    </SwipeRow>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <ConfirmDialog
        open={daEliminare !== null}
        danger
        title="Eliminare l'evento?"
        message={daEliminare
          ? `${tipoLabel(daEliminare.tipo)} del ${fmtData(daEliminare.data)}. L'operazione resta registrata nel log.`
          : undefined}
        confirmLabel="Elimina"
        loading={eliminaEvento.isPending}
        error={eliminaEvento.isError ? (eliminaEvento.error as Error).message : null}
        onCancel={() => { setDaEliminare(null); eliminaEvento.reset() }}
        onConfirm={() => daEliminare && eliminaEvento.mutate(daEliminare.id, {
          onSuccess: () => setDaEliminare(null),
        })}
      />
      {isNuovoOpen ? (
        <Modal open onClose={() => navigate('/eventi')}>
          <Outlet />
        </Modal>
      ) : (
        <Drawer open={isDetailOpen} onClose={() => navigate('/eventi')}>
          <Outlet />
        </Drawer>
      )}
    </MobileLayout>
  )
}

const newBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--prox-accent)', color: '#fff',
  border: 'none', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(220,29,39,0.3)',
}
