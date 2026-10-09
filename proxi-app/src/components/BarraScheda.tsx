// Barra fissa in cima a ogni scheda (drawer): indietro/chiudi, titolo (compare quando quello grande esce dalla vista), azioni, menu «⋯».
// Sta sopra la mappa e il contenuto (mai sovrapposta), e su mobile occupa anche la zona della notch.

import type { ReactNode } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useIndietro } from '../hooks/useIndietro'
import { MenuAzioni, type VoceMenu } from './MenuAzioni'

export interface AzioneBarra {
  etichetta: string
  icona: ReactNode
  onClick: () => void
  primaria?: boolean
  nascosta?: boolean
}

export function BarraScheda({ lista, etichettaLista, titolo, sottotitolo, icona, titoloVisibile = true, azioni = [], menu = [] }: {
  lista: string                 // dove si torna se non c'è una schermata precedente
  etichettaLista: string        // «Luoghi»
  titolo?: string
  sottotitolo?: string
  icona?: ReactNode
  titoloVisibile?: boolean
  azioni?: AzioneBarra[]
  menu?: VoceMenu[]
}) {
  const isDesktop = useIsDesktop()
  const { daAltraScheda: haStoria, indietro, chiudi } = useIndietro(lista)
  const mostraIndietro = !isDesktop || haStoria

  return (
    <div style={{
      position: 'sticky', top: 'calc(-1 * var(--sat))', zIndex: 30, flexShrink: 0,
      // su mobile il drawer ha già il padding della zona notch: la barra lo ricopre con il proprio sfondo
      // (lo sticky si misura dal contenuto del drawer, cioè sotto quel padding: da qui il top negativo)
      marginTop: 'calc(-1 * var(--sat))', paddingTop: 'var(--sat)',
      background: 'var(--prox-surface)', borderBottom: '1px solid var(--prox-line)',
    }}>
      <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
        {mostraIndietro && (
          <button onClick={indietro} aria-label={haStoria ? 'Indietro' : `Torna a ${etichettaLista}`} style={{
            display: 'flex', alignItems: 'center', height: 36, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
            color: 'var(--prox-accent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, padding: isDesktop ? '0 6px' : '0 6px 0 2px',
          }}>
            <ChevronLeft size={24} strokeWidth={1.9} />
            {!isDesktop && <span>{haStoria ? 'Indietro' : etichettaLista}</span>}
          </button>
        )}

        <div style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px',
          opacity: titoloVisibile ? 1 : 0, transition: 'opacity 0.15s ease', pointerEvents: 'none',
        }}>
          {isDesktop || !mostraIndietro ? icona : null}
          {titolo && (
            <div style={{ minWidth: 0 }}>
              <div className="prox-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--prox-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titolo}</div>
              {sottotitolo && isDesktop && <div style={{ fontSize: 11.5, color: 'var(--prox-ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sottotitolo}</div>}
            </div>
          )}
        </div>

        {azioni.filter(a => !a.nascosta).map((a, i) => a.primaria ? (
          <button key={i} onClick={a.onClick} aria-label={a.etichetta} title={a.etichetta} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 34, flexShrink: 0, border: 'none', cursor: 'pointer', borderRadius: 999,
            background: 'var(--prox-accent)', color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, padding: isDesktop ? '0 14px 0 10px' : '0 11px',
          }}>{a.icona}{isDesktop && a.etichetta}</button>
        ) : (
          <button key={i} onClick={a.onClick} aria-label={a.etichetta} title={a.etichetta} style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--prox-ink2)',
          }}>{a.icona}</button>
        ))}

        <MenuAzioni voci={menu} />

        {isDesktop && (
          <button onClick={chiudi} aria-label="Chiudi" title="Chiudi (Esc)" style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--prox-ink2)', marginLeft: 2,
          }}><X size={20} strokeWidth={1.9} /></button>
        )}
      </div>
    </div>
  )
}
