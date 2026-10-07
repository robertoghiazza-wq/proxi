// Report: resoconto settimanale, estratti di eventi da inviare ai partner, invio automatico

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, FileText } from 'lucide-react'
import { MobileLayout } from '../components/MobileLayout'
import { BarraTab } from '../components/SchedaUi'
import { PannelloSettimanale, PannelloEstratti, PannelloAutomatici, PannelloInvii } from '../components/ReportPannelli'
import { useGestore, useMe } from '../hooks/useAuth'

type Tab = 'settimanale' | 'estratti' | 'automatici' | 'invii'

export function ReportScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { isLoading } = useMe()
  const gestore = useGestore()
  const evento = Number(params.get('evento')) || undefined
  const [tab, setTab] = useState<Tab>(params.get('scheda') === 'estratti' || evento ? 'estratti' : 'settimanale')

  return (
    <MobileLayout>
      <div style={{
        padding: '16px 16px 12px', background: 'var(--prox-surface2)', borderBottom: '1px solid var(--prox-line)',
        boxShadow: '0 4px 10px rgba(20,23,28,0.05)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate('/profilo')} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--prox-ink2)', fontSize: 13.5, fontWeight: 500, padding: 0, marginBottom: 6,
        }}><ChevronLeft size={18} strokeWidth={1.75} /> Profilo</button>
        <div className="prox-display" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}>
          <FileText size={18} strokeWidth={1.75} /> Report
        </div>
      </div>

      {!gestore && !isLoading
        ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--prox-ink3)', fontSize: 14 }}>I report sono riservati a coordinatori e admin.</div>
        : (
          <>
            <BarraTab
              tabs={[{ key: 'settimanale', label: 'Settimanale' }, { key: 'estratti', label: 'Estratti' }, { key: 'automatici', label: 'Automatici' }, { key: 'invii', label: 'Invii' }]}
              attiva={tab} onScegli={setTab}
            />
            <div style={{ padding: '14px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820 }}>
              {tab === 'settimanale' && <PannelloSettimanale />}
              {tab === 'estratti' && <PannelloEstratti eventoIniziale={evento} />}
              {tab === 'automatici' && <PannelloAutomatici />}
              {tab === 'invii' && <PannelloInvii />}
            </div>
          </>
        )}
    </MobileLayout>
  )
}
