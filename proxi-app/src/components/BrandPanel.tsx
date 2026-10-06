// Impostazioni · Brand: nome, colore di accento e logo dell'ente

import { useRef, useState } from 'react'
import { Upload, Trash2, RotateCcw } from 'lucide-react'
import { Card } from './Card'
import { OrgLogo } from './OrgLogo'
import { Titolo, BarraSalva, campo, vuoto, btn, etichetta } from './SchedaUi'
import { useMe } from '../hooks/useAuth'
import { useGestioneEnte } from '../hooks/useEnte'
import { TENANT_ACCENTS, applyTenantTheme } from '../lib/theme'
import { ridimensionaPng } from '../lib/immagine'
import { eAdmin } from '../lib/ruoli'

const NOMI_PRESET: Record<string, string> = {
  prometheus: 'Prometheus', ingrado: 'Ingrado', 'antenna-icaro': 'Antenna Icaro', 'cura-domino': 'Cura Domino',
  'strada-aperta': 'Strada Aperta', 'centro-giovani-lo': 'Centro Giovani',
}

export function BrandPanel() {
  const { data: me } = useMe()
  const ente = me?.institution
  const g = useGestioneEnte()
  const puoModificare = eAdmin(me?.role)

  const colorePartenza = ente?.accent_color ?? '#dc1d27'
  const [nome, setNome] = useState<string | null>(null)
  const [colore, setColore] = useState<string | null>(null)
  const [errore, setErrore] = useState('')
  const [errLogo, setErrLogo] = useState('')
  const file = useRef<HTMLInputElement>(null)

  if (!ente) return <Card padding="14px 16px"><p style={vuoto}>Caricamento…</p></Card>

  const nomeAttuale = nome ?? ente.name
  const coloreAttuale = colore ?? colorePartenza
  const modificato = (nome !== null && nome.trim() !== ente.name) || (colore !== null && colore.toLowerCase() !== colorePartenza.toLowerCase())

  const scegliColore = (hex: string) => {
    setColore(hex)
    if (/^#[0-9a-f]{6}$/i.test(hex)) applyTenantTheme(hex) // anteprima dal vivo
  }
  const annulla = () => { setNome(null); setColore(null); setErrore(''); applyTenantTheme(colorePartenza) }

  function salva() {
    if (!nomeAttuale.trim()) { setErrore('Il nome è obbligatorio'); return }
    if (!/^#[0-9a-f]{6}$/i.test(coloreAttuale)) { setErrore('Il colore deve essere nel formato #rrggbb'); return }
    setErrore('')
    g.salva.mutate(
      { name: nomeAttuale.trim(), accent_color: coloreAttuale.toLowerCase() },
      { onSuccess: () => { setNome(null); setColore(null) }, onError: e => setErrore((e as Error).message) },
    )
  }

  async function sceltoLogo(f: File | undefined) {
    if (!f) return
    setErrLogo('')
    try {
      const svg = f.type === 'image/svg+xml' || /\.svg$/i.test(f.name)
      const pronto = svg ? f : await ridimensionaPng(f, 512)
      g.caricaLogo.mutate(svg ? f : new File([pronto], 'logo.png', { type: 'image/png' }), { onError: e => setErrLogo((e as Error).message) })
    } catch (e) {
      setErrLogo((e as Error).message || 'Immagine non leggibile')
    }
  }

  return (
    <>
      {!puoModificare && <Card padding="12px 16px"><p style={vuoto}>Il brand lo modifica solo un admin. Qui vedi come è impostato.</p></Card>}

      <Card padding="14px 16px">
        <Titolo titolo="Nome dell'ente" />
        <input value={nomeAttuale} onChange={e => setNome(e.target.value)} disabled={!puoModificare} style={campo} placeholder="Es. Associazione Prometheus" />
      </Card>

      <Card padding="14px 16px">
        <Titolo titolo="Colore" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {Object.entries(TENANT_ACCENTS).map(([k, hex]) => {
            const attivo = hex.toLowerCase() === coloreAttuale.toLowerCase()
            return (
              <button
                key={k} disabled={!puoModificare} onClick={() => scegliColore(hex)} title={NOMI_PRESET[k] ?? k} aria-label={NOMI_PRESET[k] ?? k}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: hex, cursor: puoModificare ? 'pointer' : 'default', padding: 0,
                  border: attivo ? '3px solid var(--prox-surface)' : '3px solid transparent', outline: attivo ? `2px solid ${hex}` : 'none',
                }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color" value={/^#[0-9a-f]{6}$/i.test(coloreAttuale) ? coloreAttuale : '#dc1d27'} disabled={!puoModificare}
            onChange={e => scegliColore(e.target.value)} aria-label="Scegli un colore"
            style={{ width: 44, height: 38, padding: 2, borderRadius: 10, border: '1px solid var(--prox-line)', background: 'var(--prox-surface)', cursor: puoModificare ? 'pointer' : 'default' }}
          />
          <input
            value={coloreAttuale} onChange={e => scegliColore(e.target.value.trim())} disabled={!puoModificare} spellCheck={false}
            style={{ ...campo, width: 120, fontFamily: 'ui-monospace, Menlo, monospace' }} maxLength={7}
          />
          <button
            onClick={() => scegliColore('#dc1d27')} disabled={!puoModificare} title="Ripristina il rosso Prometheus" aria-label="Ripristina il colore di partenza"
            style={{ ...btn, padding: '8px 10px', display: 'flex', alignItems: 'center' }}
          ><RotateCcw size={15} /></button>
        </div>
        <div style={{ ...etichetta, marginTop: 10 }}>Si applica a pulsanti, tab, filtri e alle fasce in alto.</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <span style={{ padding: '8px 16px', borderRadius: 999, background: 'var(--prox-accent)', color: '#fff', fontSize: 14, fontWeight: 700 }}>Pulsante</span>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--prox-accent-soft)', color: 'var(--prox-accent-ink)', fontSize: 12.5, fontWeight: 600 }}>Evidenziato</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--prox-accent)' }}>Tab attiva</span>
        </div>
      </Card>

      {puoModificare && modificato && (
        <BarraSalva errore={errore} caricamento={g.salva.isPending} onSalva={salva} onAnnulla={annulla} />
      )}
      {!modificato && errore && <div style={{ fontSize: 13, color: 'var(--prox-danger)' }}>{errore}</div>}

      <Card padding="14px 16px">
        <Titolo titolo="Logo" />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90, borderRadius: 12, marginBottom: 12,
          background: 'var(--prox-surface2)', border: '1px solid var(--prox-line)',
        }}>
          <OrgLogo nome={ente.name} size={56} haLogo={ente.ha_logo} versione={ente.updated_at} />
        </div>
        {puoModificare && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => file.current?.click()} disabled={g.caricaLogo.isPending} style={{ ...btn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Upload size={15} /> {g.caricaLogo.isPending ? 'Carico…' : ente.ha_logo ? 'Cambia logo' : 'Carica logo'}
            </button>
            {ente.ha_logo && (
              <button onClick={() => g.rimuoviLogo.mutate()} disabled={g.rimuoviLogo.isPending} style={{ ...btn, color: 'var(--prox-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={15} /> Rimuovi
              </button>
            )}
          </div>
        )}
        <input ref={file} type="file" hidden accept=".png,.jpg,.jpeg,.webp,.svg,image/*" onChange={e => { sceltoLogo(e.target.files?.[0]); e.target.value = '' }} />
        {errLogo && <div style={{ fontSize: 13, color: 'var(--prox-danger)', marginTop: 8 }}>{errLogo}</div>}
        <div style={{ ...etichetta, marginTop: 10 }}>PNG, JPG, WebP o SVG, fino a 2 MB. Meglio con sfondo trasparente. Compare nella barra in alto.</div>
      </Card>
    </>
  )
}
