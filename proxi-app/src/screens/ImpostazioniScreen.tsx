// Impostazioni dell'ente: brand (colore e logo), tipi di evento per categoria, tipi di luogo

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Settings } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { BarraTab } from '../components/SchedaUi'
import { BrandPanel } from '../components/BrandPanel'
import { TipiEventoPanel, TipiLuogoPanel } from '../components/TipiPanels'
import { ImportazioniPanel } from '../components/ImportazioniPanel'
import { useGestore, useMe, useRuolo } from '../hooks/useAuth'
import { eAdmin } from '../lib/ruoli'

type Tab = 'brand' | 'eventi' | 'luoghi' | 'importazioni'

export function ImpostazioniScreen() {
  const navigate = useNavigate()
  const { isLoading } = useMe()
  const gestore = useGestore()
  const admin = eAdmin(useRuolo())
  const [tab, setTab] = useState<Tab>('brand')

  return (
    <MobileLayout>
      <div style={{
        padding: '16px 16px 12px', background: 'var(--prox-surface2)', borderBottom: '1px solid var(--prox-line)',
        boxShadow: '0 4px 10px rgba(20,23,28,0.05)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate('/profilo')} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--prox-ink2)', fontSize: 13.5, fontWeight: 500, padding: 0, marginBottom: 6,
        }}>
          <ChevronLeft size={18} strokeWidth={1.75} /> Profilo
        </button>
        <div className="prox-display" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}>
          <Settings size={18} strokeWidth={1.75} /> Impostazioni
        </div>
      </div>

      {!gestore && !isLoading
        ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>Le impostazioni sono riservate a coordinatori e admin.</div>
        : (
          <>
            <BarraTab
              tabs={[{ key: 'brand', label: 'Brand' }, { key: 'eventi', label: 'Tipi di evento' }, { key: 'luoghi', label: 'Tipi di luogo' }, ...(admin ? [{ key: 'importazioni' as const, label: 'Importazioni' }] : [])]}
              attiva={tab} onScegli={setTab}
            />
            <div style={{ padding: '14px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
              {tab === 'brand' && <BrandPanel />}
              {tab === 'eventi' && <TipiEventoPanel />}
              {tab === 'luoghi' && <TipiLuogoPanel />}
              {tab === 'importazioni' && <ImportazioniPanel />}
            </div>
          </>
        )}
    </MobileLayout>
  )
}
