// Anteprima di un resoconto: stessa impaginazione del PDF (giorno, ore, tipo, luoghi, presenze, racconto)

import type { DocumentoReport } from '../hooks/useReport'

export function ReportView({ doc }: { doc: DocumentoReport }) {
  const note: string[] = []
  if (doc.privacy.nomi === 'iniziali') note.push('con i nomi ridotti alle iniziali')
  if (doc.privacy.nomi === 'nessuno') note.push('senza i nomi delle persone')
  if (!doc.privacy.racconto) note.push('senza il racconto degli eventi')

  return (
    <div style={{
      background: '#fff', color: '#1b1e23', borderRadius: 14, border: '1px solid var(--prox-line)', padding: '22px clamp(16px, 4vw, 34px) 26px',
      fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 2px rgba(20,15,10,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div>
          {doc.ente.logo
            ? <img src={doc.ente.logo} alt={doc.ente.nome} style={{ height: 44, display: 'block' }} />
            : <div className="prox-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--prox-accent)' }}>{doc.ente.nome}</div>}
          {doc.ente.motto && <div style={{ fontSize: 11, fontStyle: 'italic', color: '#7a808a', marginTop: 2 }}>{doc.ente.motto}</div>}
        </div>
        {doc.ente.sito && <div style={{ fontSize: 11, fontStyle: 'italic', color: '#7a808a', textAlign: 'right' }}>{doc.ente.sito}</div>}
      </div>

      <h2 className="prox-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{doc.titolo}</h2>
      {doc.sottotitolo && <div style={{ fontSize: 12, color: '#6a707a', marginTop: 2 }}>{doc.sottotitolo}</div>}

      {doc.giorni.length === 0 && <p style={{ color: '#6a707a', marginTop: 18 }}>Nessun evento svolto nel periodo.</p>}

      {doc.giorni.map(g => (
        <div key={g.data}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '22px 0 10px', paddingBottom: 4, borderBottom: '1px solid #1b1e23' }}>{g.etichetta}</h3>
          {g.eventi.map(e => (
            <div key={e.id} style={{ marginBottom: 16 }}>
              <div><strong>{e.testo.quando}</strong> - {e.testo.resto}</div>
              {e.testo.luoghi && <div style={{ fontStyle: 'italic' }}>{e.testo.luoghi}</div>}
              <div><strong>{e.testo.presenti}</strong> {e.testo.presenti_dettaglio}</div>
              {e.racconto && <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{e.racconto}</p>}
            </div>
          ))}
        </div>
      ))}

      {note.length > 0 && <div style={{ marginTop: 22, paddingTop: 6, borderTop: '1px solid #dcdfe3', fontSize: 10.5, color: '#8a909a' }}>Documento {note.join(' e ')}.</div>}
    </div>
  )
}
