// ===== screens-superadmin.jsx =====

// ---------- DATI: istituzioni sulla piattaforma Proxi ----------
const ISTITUZIONI = [
  { id:'ist1', nome:'Prometheus',         tagline:'Servizio di prossimità', regione:'Ticino · Sottoceneri+Sopraceneri', sede:'Lugano',
    coloreBrand:'#dc1d27', logoKind:'prometheus',
    piano:'enterprise', status:'attiva', attivaDal:'2024-01-15', rinnovo:'2027-01-15',
    equipe:6, membri:24, utenti:321, eventiMese:2680, oreMese:1240, ultimaAttivita:'oggi · 12 min fa',
    adminPrincipale:'Direzione Prometheus', tipoEnte:'Fondazione' },
  { id:'ist2', nome:'Ingrado',             tagline:'Dipendenze e salute mentale', regione:'Ticino · tutto il cantone', sede:'Lugano',
    coloreBrand:'#0a7d6f', logoKind:'mark',
    piano:'enterprise', status:'attiva', attivaDal:'2024-06-02', rinnovo:'2027-06-02',
    equipe:4, membri:18, utenti:212, eventiMese:1880, oreMese:920, ultimaAttivita:'oggi · 8 min fa',
    adminPrincipale:'M. Verdi', tipoEnte:'Fondazione' },
  { id:'ist3', nome:'Antenna Icaro',       tagline:'Giovani in difficoltà',         regione:'Ticino · Mendrisiotto',          sede:'Mendrisio',
    coloreBrand:'#1a4ea8', logoKind:'mark',
    piano:'pro',        status:'attiva', attivaDal:'2025-03-01', rinnovo:'2026-03-01',
    equipe:2, membri:8, utenti:74, eventiMese:520, oreMese:380, ultimaAttivita:'oggi · 1 ora fa',
    adminPrincipale:'L. Crivelli', tipoEnte:'Associazione' },
  { id:'ist4', nome:'Cura Domino',         tagline:'Cure palliative domiciliari',   regione:'Ticino · Bellinzonese',          sede:'Bellinzona',
    coloreBrand:'#7b4dbb', logoKind:'mark',
    piano:'pro',        status:'attiva', attivaDal:'2025-09-12', rinnovo:'2026-09-12',
    equipe:1, membri:5, utenti:42, eventiMese:310, oreMese:240, ultimaAttivita:'ieri · 16:22',
    adminPrincipale:'A. Bernasconi', tipoEnte:'Cooperativa' },
  { id:'ist5', nome:'Strada Aperta',       tagline:'Educativa di strada · pilot',   regione:'Grigioni · Mesolcina',           sede:'Roveredo',
    coloreBrand:'#c45a18', logoKind:'mark',
    piano:'trial',      status:'trial', attivaDal:'2026-04-20', rinnovo:'2026-05-20',
    equipe:1, membri:3, utenti:12, eventiMese:88, oreMese:62, ultimaAttivita:'oggi · 3 ore fa',
    adminPrincipale:'F. Pini', tipoEnte:'Associazione' },
  { id:'ist6', nome:'Centro Giovani Locarno', tagline:'Animazione di prossimità',   regione:'Ticino · Locarnese',             sede:'Locarno',
    coloreBrand:'#0e8a4a', logoKind:'mark',
    piano:'pro',        status:'sospesa', attivaDal:'2024-09-01', rinnovo:'—',
    equipe:2, membri:6, utenti:58, eventiMese:0, oreMese:0, ultimaAttivita:'sospesa il 02.05.2026',
    adminPrincipale:'P. Ferrari', tipoEnte:'Associazione', noteSosp:'Pagamento in attesa' },
];

const PIANI = {
  trial:      { label:'Trial 30gg', tone:'warn',   prezzo:0    },
  pro:        { label:'Pro',        tone:'neutral', prezzo:120 },
  enterprise: { label:'Enterprise', tone:'accent',  prezzo:380 },
};

const RUOLI = [
  { id:'admin_proxi',   label:'Super-admin Proxi',  descrizione:'Team interno Proxi · accesso piattaforma',
    perm:{istituzioni:'rw', dati_istituzioni:'no', billing:'rw', supporto:'rw'} },
  { id:'admin_istituz', label:'Admin istituzione',  descrizione:'Direzione · gestisce équipe, membri, fatturazione',
    perm:{equipe:'rw', membri:'rw', dati_op:'r', branding:'rw', billing:'rw'} },
  { id:'coordinatore',  label:'Coordinatore équipe', descrizione:'Gestisce turni, obiettivi, rendicontazione équipe',
    perm:{turni:'rw', obiettivi:'rw', rendiconto:'rw', utenti:'rw', membri_equipe:'r'} },
  { id:'educatore',     label:'Educatore',          descrizione:'Operatore di prossimità sul campo',
    perm:{eventi:'rw', persone:'rw', luoghi:'rw', spese:'rw', timesheet_proprio:'rw'} },
  { id:'stagista',      label:'Stagista / volontario', descrizione:'Accesso limitato, in supervisione',
    perm:{eventi:'r', persone:'r', luoghi:'r', spese_proprie:'rw'} },
];

// ---------- DATI: équipe per Prometheus (riuso EQUIPE_PROMETHEUS già definito + aggiunte invitati pendenti) ----------
const INVITI_PENDING = [
  { email:'g.rossi@prometheus.ch',     ruolo:'educatore',   equipe:'eq2', invitoIl:'2026-05-14', stato:'in_attesa' },
  { email:'m.bianchi@prometheus.ch',   ruolo:'coordinatore', equipe:'eq6', invitoIl:'2026-05-12', stato:'in_attesa' },
  { email:'tirocinio@supsi.ch',         ruolo:'stagista',     equipe:'eq5', invitoIl:'2026-05-10', stato:'scaduto'    },
];

// Audit log esempio
const AUDIT_LOG = [
  { ts:'2026-05-17 09:42', attore:'L. Conti', azione:'creato evento', target:'Aïcha B. · accompagnamento', tipo:'event' },
  { ts:'2026-05-17 09:15', attore:'Sistema',  azione:'pagamento ricevuto', target:'CHF 380 · Enterprise', tipo:'billing' },
  { ts:'2026-05-16 18:02', attore:'G. Mazza', azione:'pubblicato piano turni', target:'Settimana 21', tipo:'shift' },
  { ts:'2026-05-16 14:30', attore:'R. Galli', azione:'aggiunto membro', target:'Y. Khalif → eq3', tipo:'member' },
  { ts:'2026-05-15 11:08', attore:'Sistema',  azione:'invito spedito', target:'tirocinio@supsi.ch', tipo:'invite' },
];

Object.assign(window, { ISTITUZIONI, PIANI, RUOLI, INVITI_PENDING, AUDIT_LOG });

// ─────────────────────────────────────────────────────────────
//  SUPER-ADMIN PROXI · vista piattaforma (operatori Proxi interni)
// ─────────────────────────────────────────────────────────────
function SuperAdminPiattaforma() {
  const totIst = ISTITUZIONI.length;
  const totAttive = ISTITUZIONI.filter(i=>i.status==='attiva').length;
  const totMembri = ISTITUZIONI.reduce((s,i)=>s+i.membri,0);
  const totUtenti = ISTITUZIONI.reduce((s,i)=>s+i.utenti,0);
  const totMRR = ISTITUZIONI.filter(i=>i.status==='attiva').reduce((s,i)=>s+PIANI[i.piano].prezzo,0);

  const [vista, setVista] = React.useState('lista');
  const [filtroStatus, setFiltroStatus] = React.useState('tutte');
  const filtered = ISTITUZIONI.filter(i => filtroStatus==='tutte' || i.status===filtroStatus);

  return (
    <div className="prox" style={{ background:'#0e1015', minHeight:'100%', color:'#e6e8eb', fontFamily:'Inter' }}>
      {/* Topbar scura · per distinguere Proxi-interno */}
      <div style={{ padding:'12px 28px', display:'flex', alignItems:'center', gap:16, borderBottom:'1px solid rgba(255,255,255,0.08)', background:'#181b22' }}>
        <ProxiLogo size={26} color="#fff"/>
        <div style={{ width:1, height:22, background:'rgba(255,255,255,0.12)' }}/>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'#fff', lineHeight:1.1 }}>Console Proxi · Super-admin</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Team interno Proxi · gestione piattaforma</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', gap:4 }}>
          {['Istituzioni','Fatturazione','Supporto','Salute servizi','Audit log','Impostazioni'].map((t,i) => (
            <button key={t} style={{
              padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Inter',
              background: i===0 ? 'rgba(220,29,39,0.18)' : 'transparent',
              color: i===0 ? '#ff6f76' : 'rgba(255,255,255,0.7)',
              fontSize:13, fontWeight: i===0 ? 600 : 500,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px 4px 4px', borderRadius:999, background:'rgba(255,255,255,0.06)' }}>
          <div style={{ width:24, height:24, borderRadius:12, background:'#dc1d27', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter Tight', fontWeight:700, fontSize:11 }}>AC</div>
          <span style={{ fontSize:12, color:'#fff' }}>Alessandro · Proxi</span>
        </div>
      </div>

      <div style={{ padding:'24px 28px', maxWidth:1400, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, marginBottom:4 }}>Console di piattaforma</div>
            <div className="prox-display" style={{ fontSize:32, fontWeight:600, letterSpacing:-0.6, color:'#fff' }}>Istituzioni · Proxi Ticino</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'#fff', fontFamily:'Inter', fontSize:13, fontWeight:500, cursor:'pointer' }}>Esporta CSV</button>
            <button style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#dc1d27', color:'#fff', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              <Icon name="plus" size={14} color="#fff" strokeWidth={2.5}/>
              Nuova istituzione
            </button>
          </div>
        </div>

        {/* KPI row · scuro */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:18 }}>
          <DarkKPI label="Istituzioni attive" value={totAttive} sub={`${totIst - totAttive} sospese/trial`} accent="#fff"/>
          <DarkKPI label="MRR" value={`CHF ${totMRR.toLocaleString('de-CH')}`} sub="ricorrente mensile" accent="#5dd39e"/>
          <DarkKPI label="Operatori sul campo" value={totMembri} sub="su tutte le istituzioni"/>
          <DarkKPI label="Utenti tracciati" value={totUtenti.toLocaleString('de-CH')} sub="dati separati per tenant"/>
          <DarkKPI label="Uptime 30gg" value="99.94%" sub="3 incidenti minori" accent="#5dd39e"/>
        </div>

        {/* Toolbar filtri */}
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
          <div style={{ display:'flex', gap:6 }}>
            {['tutte','attiva','trial','sospesa'].map(f => (
              <button key={f} onClick={()=>setFiltroStatus(f)} style={{
                padding:'6px 14px', borderRadius:999, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'Inter',
                background: filtroStatus===f ? '#fff' : 'transparent',
                color: filtroStatus===f ? '#0e1015' : 'rgba(255,255,255,0.7)',
                fontSize:12.5, fontWeight: filtroStatus===f ? 600 : 500,
              }}>{f==='tutte' ? 'Tutte' : f.charAt(0).toUpperCase()+f.slice(1)} · {f==='tutte' ? totIst : ISTITUZIONI.filter(i=>i.status===f).length}</button>
            ))}
          </div>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', background:'rgba(255,255,255,0.06)', borderRadius:8, padding:2 }}>
            {['lista','griglia'].map(v => (
              <button key={v} onClick={()=>setVista(v)} style={{
                padding:'6px 12px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:'Inter',
                background: vista===v ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: vista===v ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize:12, fontWeight:500,
              }}>{v[0].toUpperCase()+v.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Tabella istituzioni */}
        {vista === 'lista' && (
          <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'#181b22' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter' }}>
              <thead>
                <tr style={{ fontSize:10.5, textTransform:'uppercase', letterSpacing:0.6, color:'rgba(255,255,255,0.4)', textAlign:'left', fontWeight:600, background:'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding:'12px 18px' }}>Istituzione</th>
                  <th style={{ padding:'12px 8px' }}>Regione</th>
                  <th style={{ padding:'12px 8px' }}>Piano</th>
                  <th style={{ padding:'12px 8px', textAlign:'center' }}>Équipe</th>
                  <th style={{ padding:'12px 8px', textAlign:'right' }}>Membri</th>
                  <th style={{ padding:'12px 8px', textAlign:'right' }}>Utenti</th>
                  <th style={{ padding:'12px 8px', textAlign:'right' }}>Eventi/mese</th>
                  <th style={{ padding:'12px 8px' }}>Ultima attività</th>
                  <th style={{ padding:'12px 18px', textAlign:'center' }}>Stato</th>
                  <th style={{ padding:'12px 14px' }}/>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ist => (
                  <tr key={ist.id} style={{ fontSize:13, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding:'14px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:ist.coloreBrand+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <OrgLogo org={ist.logoKind==='prometheus' ? 'prometheus' : 'mark'} size={22} color={ist.coloreBrand}/>
                          {ist.logoKind !== 'prometheus' && (
                            <div style={{ position:'absolute', width:22, height:22, borderRadius:5, background:ist.coloreBrand, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, fontFamily:'Inter Tight' }}>{ist.nome[0]}</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{ist.nome}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{ist.tagline} · {ist.tipoEnte}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'14px 8px', color:'rgba(255,255,255,0.65)' }}>
                      <div>{ist.sede}</div>
                      <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)' }}>{ist.regione.replace(/^Ticino · /, '')}</div>
                    </td>
                    <td style={{ padding:'14px 8px' }}>
                      <PianoBadge piano={ist.piano}/>
                    </td>
                    <td style={{ padding:'14px 8px', textAlign:'center', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', color:'#fff', fontWeight:600 }}>{ist.equipe}</td>
                    <td style={{ padding:'14px 8px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', color:'rgba(255,255,255,0.85)' }}>{ist.membri}</td>
                    <td style={{ padding:'14px 8px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', color:'rgba(255,255,255,0.85)' }}>{ist.utenti}</td>
                    <td style={{ padding:'14px 8px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', color:'rgba(255,255,255,0.85)' }}>{ist.eventiMese.toLocaleString('de-CH')}</td>
                    <td style={{ padding:'14px 8px', color:'rgba(255,255,255,0.55)', fontSize:12 }}>{ist.ultimaAttivita}</td>
                    <td style={{ padding:'14px 18px', textAlign:'center' }}>
                      <StatusDot status={ist.status}/>
                    </td>
                    <td style={{ padding:'14px 14px' }}>
                      <button style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:18 }}>⋯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vista === 'griglia' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {filtered.map(ist => <IstituzioneCard key={ist.id} ist={ist}/>)}
          </div>
        )}

        {/* Sezione: stato salute + audit recente */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:14, marginTop:18 }}>
          {/* salute servizi */}
          <div style={{ borderRadius:14, padding:18, background:'#181b22', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:4, color:'#fff' }}>Salute servizi · 30gg</div>
            <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.5)', marginBottom:14 }}>Tutti i sottosistemi operativi</div>
            {[
              { label:'API & backend',    uptime:99.98, color:'#5dd39e' },
              { label:'Storage allegati', uptime:99.94, color:'#5dd39e' },
              { label:'Mappe (provider esterno)', uptime:99.71, color:'#ffb454' },
              { label:'Email transazionali', uptime:99.99, color:'#5dd39e' },
              { label:'Backup notturni',  uptime:100.00, color:'#5dd39e' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width:8, height:8, borderRadius:4, background:r.color }}/>
                <div style={{ flex:1, fontSize:13, color:'rgba(255,255,255,0.85)' }}>{r.label}</div>
                <div className="prox-mono" style={{ fontSize:13, color:'#fff', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{r.uptime.toFixed(2)}%</div>
              </div>
            ))}
          </div>

          {/* Audit log piattaforma */}
          <div style={{ borderRadius:14, padding:0, background:'#181b22', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:'#fff' }}>Audit log piattaforma</div>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.5)', marginTop:2 }}>Eventi recenti su tutte le istituzioni · anonimizzati</div>
              </div>
              <button style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:'6px 12px', borderRadius:6, fontSize:12, fontFamily:'Inter' }}>Vai al log completo →</button>
            </div>
            {AUDIT_LOG.map((row,i) => {
              const dotColor = row.tipo === 'billing' ? '#5dd39e' : row.tipo === 'shift' ? '#7aa3ff' : row.tipo === 'member' ? '#c594ff' : row.tipo === 'invite' ? '#ffb454' : 'rgba(255,255,255,0.4)';
              return (
                <div key={i} style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:12, borderTop: i>0 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize:12.5 }}>
                  <div className="prox-mono" style={{ color:'rgba(255,255,255,0.45)', fontVariantNumeric:'tabular-nums', width:120, flexShrink:0 }}>{row.ts}</div>
                  <div style={{ width:6, height:6, borderRadius:3, background:dotColor, flexShrink:0 }}/>
                  <div style={{ color:'rgba(255,255,255,0.85)', fontWeight:500, width:140, flexShrink:0 }}>{row.attore}</div>
                  <div style={{ color:'rgba(255,255,255,0.6)', flex:1 }}>
                    {row.azione} · <span style={{ color:'rgba(255,255,255,0.85)' }}>{row.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkKPI({ label, value, sub, accent }) {
  return (
    <div style={{ padding:14, borderRadius:14, background:'#181b22', border:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize:10.5, textTransform:'uppercase', letterSpacing:0.5, fontWeight:600, color:'rgba(255,255,255,0.45)', marginBottom:8 }}>{label}</div>
      <div className="prox-display" style={{ fontSize:24, fontWeight:600, letterSpacing:-0.5, color: accent || '#fff', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4 }}>{sub}</div>
    </div>
  );
}

function PianoBadge({ piano }) {
  const cfg = PIANI[piano];
  const styles = {
    enterprise: { bg:'rgba(220,29,39,0.18)', fg:'#ff6f76' },
    pro:        { bg:'rgba(255,255,255,0.08)', fg:'rgba(255,255,255,0.85)' },
    trial:      { bg:'rgba(255,180,84,0.16)', fg:'#ffb454' },
  };
  const s = styles[piano];
  return (
    <span style={{ padding:'3px 8px', borderRadius:6, background:s.bg, color:s.fg, fontSize:11, fontWeight:600, letterSpacing:-0.1 }}>{cfg.label}</span>
  );
}

function StatusDot({ status }) {
  const cfg = {
    attiva:  { color:'#5dd39e', label:'attiva'  },
    trial:   { color:'#ffb454', label:'trial'   },
    sospesa: { color:'#ff6f76', label:'sospesa' },
  }[status];
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
      <div style={{ width:8, height:8, borderRadius:4, background:cfg.color, boxShadow:`0 0 8px ${cfg.color}66` }}/>
      <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>{cfg.label}</span>
    </div>
  );
}

function IstituzioneCard({ ist }) {
  return (
    <div style={{ padding:18, borderRadius:14, background:'#181b22', border:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:ist.coloreBrand+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {ist.logoKind==='prometheus'
            ? <OrgLogo org="prometheus" size={26} color={ist.coloreBrand}/>
            : <div style={{ width:26, height:26, borderRadius:6, background:ist.coloreBrand, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter Tight', fontWeight:700, fontSize:14 }}>{ist.nome[0]}</div>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:'#fff' }}>{ist.nome}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{ist.tagline}</div>
        </div>
        <StatusDot status={ist.status}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <div style={{ fontSize:18, fontWeight:600, color:'#fff', fontFamily:'Inter Tight' }}>{ist.equipe}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>équipe</div>
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:600, color:'#fff', fontFamily:'Inter Tight' }}>{ist.membri}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>operatori</div>
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:600, color:'#fff', fontFamily:'Inter Tight' }}>{ist.utenti}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>utenti</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <PianoBadge piano={ist.piano}/>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{ist.ultimaAttivita}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ADMIN ISTITUZIONE · Dashboard direzione (per singola istituzione, es. Prometheus)
// ─────────────────────────────────────────────────────────────
function AdminIstituzione() {
  const [tab, setTab] = React.useState('equipe');
  const ist = ISTITUZIONI[0]; // Prometheus

  return (
    <div className="prox" style={{ background: proxColors.bg, minHeight:'100%', color: proxColors.ink, fontFamily:'Inter' }}>
      {/* Topbar */}
      <div style={{ padding:'12px 28px', display:'flex', alignItems:'center', gap:16, borderBottom:`1px solid ${proxColors.line}`, background: proxColors.surface }}>
        <ProxiLogo size={26} color={proxColors.ink}/>
        <div style={{ width:1, height:22, background: proxColors.line }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <OrgLogo org="prometheus" size={22}/>
          <div>
            <div style={{ fontSize:12, fontWeight:600, lineHeight:1.1 }}>{ist.nome} · Amministrazione</div>
            <div style={{ fontSize:10, color: proxColors.ink3 }}>{ist.tagline}</div>
          </div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', gap:4 }}>
          {[
            {k:'overview',     l:'Panoramica'},
            {k:'equipe',       l:'Équipe'},
            {k:'membri',       l:'Membri'},
            {k:'ruoli',        l:'Ruoli & permessi'},
            {k:'brand',        l:'Brand'},
            {k:'sicurezza',    l:'Sicurezza & dati'},
            {k:'fatturazione', l:'Fatturazione'},
          ].map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)} style={{
              padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Inter',
              background: tab===t.k ? proxColors.accentSoft : 'transparent',
              color: tab===t.k ? proxColors.accentInk : proxColors.ink2,
              fontSize:13, fontWeight: tab===t.k ? 600 : 500,
            }}>{t.l}</button>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <Tag tone="accent" size="sm">Admin istituzione</Tag>
        <Avatar nome="Direzione" ruolo="dipendente" size={32}/>
      </div>

      <div style={{ padding:'24px 28px', maxWidth:1400, margin:'0 auto' }}>
        {/* Header dinamico per tab */}
        {tab === 'equipe' && <TabEquipe ist={ist}/>}
        {tab === 'membri' && <TabMembri ist={ist}/>}
        {tab === 'ruoli' && <TabRuoli/>}
        {tab === 'overview' && <TabOverview ist={ist}/>}
        {tab === 'brand' && <TabBrand ist={ist}/>}
        {tab === 'sicurezza' && <TabSicurezza ist={ist}/>}
        {tab === 'fatturazione' && <TabFatturazione ist={ist}/>}
      </div>
    </div>
  );
}

// ---------- TAB Équipe (CRUD équipe della stessa istituzione) ----------
function TabEquipe({ ist }) {
  return (
    <>
      <SectionHeader
        sup="Gestione équipe"
        title="6 équipe attive in 2 regioni"
        actions={
          <>
            <Button tone="ghost" size="md" icon="export">Esporta lista</Button>
            <Button tone="primary" size="md" icon="plus">Nuova équipe</Button>
          </>
        }
      />

      <Card style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter' }}>
          <thead>
            <tr style={{ fontSize:10.5, textTransform:'uppercase', letterSpacing:0.6, color: proxColors.ink3, textAlign:'left', fontWeight:600, background: proxColors.surface2 }}>
              <th style={{ padding:'12px 18px' }}>Équipe</th>
              <th style={{ padding:'12px 8px' }}>Coordinatore</th>
              <th style={{ padding:'12px 8px', textAlign:'center' }}>Operatori</th>
              <th style={{ padding:'12px 8px', textAlign:'right' }}>Utenti</th>
              <th style={{ padding:'12px 8px', textAlign:'right' }}>Eventi/sett</th>
              <th style={{ padding:'12px 8px' }}>Attiva dal</th>
              <th style={{ padding:'12px 8px', textAlign:'center' }}>Stato</th>
              <th style={{ padding:'12px 18px', textAlign:'right' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {EQUIPE_PROMETHEUS.map(eq => {
              const coord = personaById(eq.coordinatore);
              return (
                <tr key={eq.id} style={{ fontSize:13, borderTop:`1px solid ${proxColors.line2}` }}>
                  <td style={{ padding:'12px 18px' }}>
                    <div style={{ fontSize:13.5, fontWeight:600 }}>{eq.nome}</div>
                    <div style={{ fontSize:11, color: proxColors.ink3 }}>{eq.citta} · {eq.regione}</div>
                  </td>
                  <td style={{ padding:'12px 8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Avatar nome={coord?.nome} ruolo="dipendente" size={22}/>
                      <span style={{ fontSize:12.5 }}>{coord?.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 8px', textAlign:'center', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', fontWeight:600 }}>{eq.membri.length}</td>
                  <td style={{ padding:'12px 8px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums' }}>{eq.utenti}</td>
                  <td style={{ padding:'12px 8px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontVariantNumeric:'tabular-nums' }}>{eq.eventiSett}</td>
                  <td style={{ padding:'12px 8px', color: proxColors.ink3, fontSize:12 }}>{new Date(eq.attivaDal+'-01').toLocaleDateString('it-CH', { month:'short', year:'numeric' })}</td>
                  <td style={{ padding:'12px 8px', textAlign:'center' }}>
                    {eq.status === 'attiva' ? <Tag tone="ok" size="sm">attiva</Tag> : <Tag tone="warn" size="sm">pilota</Tag>}
                  </td>
                  <td style={{ padding:'12px 18px', textAlign:'right' }}>
                    <div style={{ display:'inline-flex', gap:4 }}>
                      <button style={miniBtn}>Modifica</button>
                      <button style={{ ...miniBtn, color: proxColors.danger }}>⋯</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

const miniBtn = {
  padding:'5px 10px', borderRadius:6, border:'1px solid rgba(20,23,28,0.1)', background:'#fff',
  fontSize:11.5, fontFamily:'Inter', cursor:'pointer', color:'#444a55', fontWeight:500,
};

// ---------- TAB Membri ----------
function TabMembri({ ist }) {
  const [q, setQ] = React.useState('');
  const [ruolo, setRuolo] = React.useState('tutti');
  const tuttiMembri = PERSONE.filter(p => p.ruolo === 'dipendente');
  const equipeDi = (pid) => EQUIPE_PROMETHEUS.find(e => e.membri.includes(pid));
  const ruoloDi = (p) => p.tag?.includes('coordinatrice') || p.tag?.includes('coordinatore') ? 'coordinatore' : p.tag?.includes('stagista') ? 'stagista' : 'educatore';
  const filtered = tuttiMembri.filter(p => {
    if (ruolo !== 'tutti' && ruoloDi(p) !== ruolo) return false;
    if (!q) return true;
    return p.nome.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <>
      <SectionHeader
        sup="Gestione membri"
        title={`${tuttiMembri.length} operatori · ${INVITI_PENDING.filter(i=>i.stato==='in_attesa').length} inviti pendenti`}
        actions={
          <>
            <Button tone="ghost" size="md" icon="export">Esporta CSV</Button>
            <Button tone="primary" size="md" icon="plus">Invita membro</Button>
          </>
        }
      />

      {/* Filtri */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background: proxColors.surface, border:`1px solid ${proxColors.line}`, flex:1, maxWidth:320 }}>
          <Icon name="search" size={16} color={proxColors.ink3}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca nome o email…" style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:14, fontFamily:'Inter' }}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['tutti','coordinatore','educatore','stagista'].map(r => (
            <button key={r} onClick={()=>setRuolo(r)} style={{
              padding:'8px 14px', borderRadius:999, border:'none', cursor:'pointer', fontFamily:'Inter',
              background: ruolo===r ? proxColors.ink : 'rgba(20,23,28,0.05)',
              color: ruolo===r ? proxColors.bg : proxColors.ink2,
              fontSize:12.5, fontWeight: ruolo===r ? 600 : 500,
            }}>{r==='tutti' ? 'Tutti' : r.charAt(0).toUpperCase()+r.slice(1)+'i'}</button>
          ))}
        </div>
      </div>

      {/* Inviti pendenti */}
      {INVITI_PENDING.length > 0 && (
        <Card style={{ padding:0, overflow:'hidden', marginBottom:14, background:`linear-gradient(180deg, ${proxColors.accentSoft} 0%, ${proxColors.surface} 100%)` }}>
          <div style={{ padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${proxColors.line2}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>Inviti pendenti · {INVITI_PENDING.length}</div>
              <div style={{ fontSize:11.5, color: proxColors.ink3, marginTop:2 }}>Non hanno ancora completato la registrazione</div>
            </div>
          </div>
          {INVITI_PENDING.map((inv,i) => {
            const eq = EQUIPE_PROMETHEUS.find(e => e.id === inv.equipe);
            return (
              <div key={inv.email} style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:12, borderTop: i>0 ? `1px solid ${proxColors.line2}` : 'none', fontSize:13 }}>
                <Icon name="bell" size={16} color={proxColors.ink3}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500 }}>{inv.email}</div>
                  <div style={{ fontSize:11.5, color: proxColors.ink3 }}>{RUOLI.find(r=>r.id.includes(inv.ruolo))?.label || inv.ruolo} · {eq?.nome} · invitato il {new Date(inv.invitoIl).toLocaleDateString('it-CH')}</div>
                </div>
                {inv.stato === 'in_attesa'
                  ? <Tag tone="warn" size="sm">in attesa</Tag>
                  : <Tag tone="danger" size="sm">scaduto</Tag>}
                <button style={miniBtn}>Re-invia</button>
                <button style={{ ...miniBtn, color: proxColors.danger }}>Revoca</button>
              </div>
            );
          })}
        </Card>
      )}

      {/* Tabella membri */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter' }}>
          <thead>
            <tr style={{ fontSize:10.5, textTransform:'uppercase', letterSpacing:0.6, color: proxColors.ink3, textAlign:'left', fontWeight:600, background: proxColors.surface2 }}>
              <th style={{ padding:'12px 18px' }}>Operatore</th>
              <th style={{ padding:'12px 8px' }}>Email</th>
              <th style={{ padding:'12px 8px' }}>Ruolo</th>
              <th style={{ padding:'12px 8px' }}>Équipe</th>
              <th style={{ padding:'12px 8px' }}>Lingue</th>
              <th style={{ padding:'12px 8px', textAlign:'center' }}>Stato</th>
              <th style={{ padding:'12px 18px', textAlign:'right' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0,12).map(p => {
              const eq = equipeDi(p.id);
              const r = ruoloDi(p);
              return (
                <tr key={p.id} style={{ fontSize:13, borderTop:`1px solid ${proxColors.line2}` }}>
                  <td style={{ padding:'12px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar nome={p.nome} ruolo="dipendente" size={32}/>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:600 }}>{p.nome}</div>
                        <div style={{ fontSize:11, color: proxColors.ink3 }}>{p.eta} anni</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 8px', color: proxColors.ink3, fontSize:12 }}>
                    {p.nome.toLowerCase().replace(/\s/g,'.').replace(/[^a-z.]/g,'')}@prometheus.ch
                  </td>
                  <td style={{ padding:'12px 8px' }}>
                    <Tag tone={r==='coordinatore' ? 'accent' : r==='stagista' ? 'warn' : 'neutral'} size="sm">{r}</Tag>
                  </td>
                  <td style={{ padding:'12px 8px' }}>{eq?.nome || <span style={{ color: proxColors.ink3 }}>—</span>}</td>
                  <td style={{ padding:'12px 8px' }}>
                    <div style={{ display:'inline-flex', gap:3 }}>
                      {p.lingue.map(l => (
                        <span key={l} style={{ padding:'2px 5px', borderRadius:3, background:'rgba(20,23,28,0.06)', fontSize:10, fontWeight:600, fontFamily:'ui-monospace,monospace' }}>{l}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:'12px 8px', textAlign:'center' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:7, height:7, borderRadius:4, background: proxColors.ok }}/>
                      <span style={{ fontSize:11.5 }}>attivo</span>
                    </span>
                  </td>
                  <td style={{ padding:'12px 18px', textAlign:'right' }}>
                    <button style={miniBtn}>Gestisci</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ---------- TAB Ruoli & permessi ----------
function TabRuoli() {
  const perm_keys = ['Istituzioni','Équipe','Membri','Persone (utenti)','Eventi','Spese','Turni','Obiettivi','Branding','Fatturazione'];
  // Matrice (statica, per visualizzazione)
  const M = {
    admin_proxi:    ['rw',  '-',  '-',  '-',  '-',  '-',  '-',  '-',  '-',  'rw'],
    admin_istituz:  ['-',   'rw', 'rw', 'r',  'r',  'rw', 'r',  'rw', 'rw', 'rw'],
    coordinatore:   ['-',   'r',  'r',  'rw', 'rw', 'rw', 'rw', 'rw', '-',  '-'],
    educatore:      ['-',   '-',  'r',  'rw', 'rw', 'rw', 'r',  'r',  '-',  '-'],
    stagista:       ['-',   '-',  '-',  'r',  'r',  'rw*','r',  'r',  '-',  '-'],
  };
  const cellStyle = (v) => {
    if (v==='rw') return { bg:'oklch(0.94 0.05 155)', fg:'oklch(0.35 0.12 155)', label:'RW' };
    if (v==='r')  return { bg:'oklch(0.94 0.04 240)', fg:'oklch(0.4 0.10 240)',  label:'R'  };
    if (v==='rw*')return { bg:'oklch(0.94 0.05 70)',  fg:'oklch(0.35 0.12 70)',   label:'RW*'};
    return                 { bg:'rgba(20,23,28,0.03)', fg:'rgba(20,23,28,0.3)',   label:'—'  };
  };

  return (
    <>
      <SectionHeader
        sup="Ruoli & permessi"
        title="5 ruoli predefiniti"
        actions={<Button tone="ghost" size="md" icon="plus">Ruolo custom</Button>}
      />

      {/* Lista ruoli con descrizioni */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:18 }}>
        {RUOLI.map((r,i) => {
          const colore = i===0 ? '#dc1d27' : i===1 ? '#1a4ea8' : i===2 ? '#7b4dbb' : i===3 ? '#0a7d6f' : '#c45a18';
          return (
            <Card key={r.id} style={{ padding:16 }}>
              <div style={{ width:6, height:6, borderRadius:3, background:colore, marginBottom:8 }}/>
              <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:11.5, color: proxColors.ink3, lineHeight:1.4 }}>{r.descrizione}</div>
            </Card>
          );
        })}
      </div>

      {/* Matrice permessi */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${proxColors.line2}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:600 }}>Matrice dei permessi</div>
            <div style={{ fontSize:11.5, color: proxColors.ink3, marginTop:2 }}>Cosa ciascun ruolo può fare nella piattaforma · RW = read/write, R = sola lettura, RW* = sui propri dati</div>
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter' }}>
          <thead>
            <tr style={{ background: proxColors.surface2 }}>
              <th style={{ padding:'12px 18px', textAlign:'left', fontSize:11, textTransform:'uppercase', letterSpacing:0.6, color: proxColors.ink3, fontWeight:600 }}>Area</th>
              {RUOLI.map(r => (
                <th key={r.id} style={{ padding:'12px 6px', textAlign:'center', fontSize:11, fontWeight:600, color: proxColors.ink2 }}>{r.label.replace(' istituzione','').replace('Super-admin Proxi','Proxi').replace(' équipe','')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perm_keys.map((k, i) => (
              <tr key={k} style={{ borderTop:`1px solid ${proxColors.line2}` }}>
                <td style={{ padding:'10px 18px', fontSize:13, fontWeight:500 }}>{k}</td>
                {RUOLI.map(r => {
                  const v = M[r.id][i];
                  const s = cellStyle(v);
                  return (
                    <td key={r.id} style={{ padding:'8px', textAlign:'center' }}>
                      <span style={{ display:'inline-block', minWidth:38, padding:'3px 8px', borderRadius:5, background:s.bg, color:s.fg, fontSize:10.5, fontWeight:700, fontFamily:'ui-monospace,monospace' }}>{s.label}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ---------- TAB Overview ----------
function TabOverview({ ist }) {
  return (
    <>
      <SectionHeader sup="Panoramica istituzione" title={ist.nome}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        <MiniKPI label="Équipe attive" value={ist.equipe} sub="2 regioni · TI"/>
        <MiniKPI label="Operatori" value={ist.membri} sub="su 6 équipe"/>
        <MiniKPI label="Utenti in carico" value={ist.utenti} sub="ultimo mese" tone="accent"/>
        <MiniKPI label="Eventi/mese" value={ist.eventiMese.toLocaleString('de-CH')} sub={`${ist.oreMese}h presidio`}/>
      </div>
      <Card style={{ padding:24 }}>
        <div style={{ fontSize:13, color: proxColors.ink3 }}>Apri «Équipe» o «Membri» per la gestione di dettaglio.</div>
      </Card>
    </>
  );
}

// ---------- TAB Brand ----------
function TabBrand({ ist }) {
  return (
    <>
      <SectionHeader sup="Identità visiva" title="Brand dell'istituzione"/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600, color: proxColors.ink3, marginBottom:14 }}>Logo</div>
          <div style={{ display:'flex', alignItems:'center', gap:18, padding:18, borderRadius:10, background: proxColors.surface2, border:`1px dashed ${proxColors.line}` }}>
            <OrgLogo org="prometheus" size={72}/>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>prometheus.svg</div>
              <div style={{ fontSize:11.5, color: proxColors.ink3, marginTop:2 }}>Caricato il 15.01.2024 · vector</div>
            </div>
            <div style={{ flex:1 }}/>
            <Button tone="ghost" size="sm">Sostituisci</Button>
          </div>
        </Card>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600, color: proxColors.ink3, marginBottom:14 }}>Colore di accento</div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={{ width:60, height:60, borderRadius:12, background: ist.coloreBrand, boxShadow:'0 4px 14px rgba(0,0,0,0.1)' }}/>
            <div>
              <div className="prox-mono" style={{ fontSize:15, fontWeight:600 }}>{ist.coloreBrand.toUpperCase()}</div>
              <div style={{ fontSize:11.5, color: proxColors.ink3, marginTop:2 }}>Usato in tutta l'interfaccia di Prometheus</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {['#dc1d27','#0a7d6f','#1a4ea8','#7b4dbb','#c45a18','#0e8a4a'].map(c => (
              <button key={c} style={{ width:30, height:30, borderRadius:8, border: c===ist.coloreBrand ? '2px solid #000' : '1px solid rgba(0,0,0,0.08)', background:c, cursor:'pointer' }}/>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------- TAB Sicurezza & dati ----------
function TabSicurezza({ ist }) {
  return (
    <>
      <SectionHeader sup="Sicurezza & separazione dati" title="Tenant isolato · privacy by design"/>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14, marginBottom:14 }}>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600, color: proxColors.ink3, marginBottom:14 }}>Separazione tenant</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'30px 20px', borderRadius:10, background: proxColors.surface2 }}>
            <TenantDiagram/>
          </div>
          <div style={{ fontSize:12.5, color: proxColors.ink2, marginTop:14, lineHeight:1.5 }}>
            Ogni istituzione ha un proprio <strong>schema database isolato</strong>. Persone, eventi, spese, turni di Prometheus non sono accessibili a Ingrado, Antenna Icaro o altre istituzioni — nemmeno al team Proxi senza richiesta esplicita.
          </div>
        </Card>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600, color: proxColors.ink3, marginBottom:14 }}>Conformità</div>
          {[
            { label:'LPD (nLPD CH 2023)',        status:'ok',   note:'Registro consensi attivo' },
            { label:'GDPR (UE)',                  status:'ok',   note:'Diritto cancellazione & export' },
            { label:'Cifratura at-rest',          status:'ok',   note:'AES-256 · chiavi per tenant' },
            { label:'Cifratura in-transit',       status:'ok',   note:'TLS 1.3' },
            { label:'Backup quotidiano',          status:'ok',   note:'Retention 30gg · region CH' },
            { label:'Audit log per tenant',       status:'ok',   note:'Tutti gli accessi registrati' },
            { label:'2FA per admin',              status:'warn', note:'Opzionale — consigliato' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop: r.label !== 'LPD (nLPD CH 2023)' ? `1px solid ${proxColors.line2}` : 'none' }}>
              <div style={{ width:18, height:18, borderRadius:9, background: r.status==='ok' ? proxColors.ok : proxColors.warn, color:'#fff', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {r.status==='ok' ? '✓' : '!'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:500 }}>{r.label}</div>
                <div style={{ fontSize:11, color: proxColors.ink3 }}>{r.note}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ padding:24 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Strumenti privacy</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { icon:'doc',    title:'Export dati istituzione',   sub:'Tutto in JSON + CSV' },
            { icon:'logout', title:'Cancellazione utente',       sub:'Anonimizza tutto lo storico' },
            { icon:'doc',    title:'Registro consensi',         sub:'Chi ha firmato cosa' },
          ].map(t => (
            <button key={t.title} style={{ padding:14, borderRadius:10, border:`1px solid ${proxColors.line}`, background:'transparent', cursor:'pointer', textAlign:'left', fontFamily:'Inter' }}>
              <Icon name={t.icon} size={18} color={proxColors.ink3}/>
              <div style={{ fontSize:13, fontWeight:600, marginTop:8 }}>{t.title}</div>
              <div style={{ fontSize:11.5, color: proxColors.ink3, marginTop:2 }}>{t.sub}</div>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}

function TenantDiagram() {
  return (
    <svg viewBox="0 0 520 200" width="100%" style={{ maxWidth:480 }}>
      {/* Proxi platform layer */}
      <rect x="10" y="10" width="500" height="40" rx="8" fill="rgba(20,23,28,0.04)" stroke="rgba(20,23,28,0.1)"/>
      <text x="260" y="35" textAnchor="middle" fontSize="13" fontWeight="600" fill="#444a55" fontFamily="Inter">Proxi · Piattaforma condivisa (codice, infra)</text>

      {/* Tenants */}
      {[
        { x: 20,  c: '#dc1d27', label:'Prometheus',     hl: true  },
        { x: 145, c: '#0a7d6f', label:'Ingrado',         hl: false },
        { x: 270, c: '#1a4ea8', label:'Antenna Icaro',   hl: false },
        { x: 395, c: '#c45a18', label:'Strada Aperta',   hl: false },
      ].map((t,i) => (
        <g key={i}>
          <rect x={t.x} y={80} width="105" height="110" rx="8"
            fill={t.hl ? t.c+'18' : 'rgba(20,23,28,0.03)'}
            stroke={t.hl ? t.c : 'rgba(20,23,28,0.1)'}
            strokeWidth={t.hl ? 2 : 1}/>
          <text x={t.x+52.5} y={102} textAnchor="middle" fontSize="12" fontWeight="700" fill={t.hl ? t.c : '#444a55'} fontFamily="Inter">{t.label}</text>
          {/* faux data lines */}
          {[120, 135, 150, 165, 180].map((y,k) => (
            <line key={k} x1={t.x+12} y1={y} x2={t.x+93} y2={y} stroke={t.hl ? t.c : 'rgba(20,23,28,0.15)'} strokeWidth="2" opacity={t.hl ? 0.4 : 0.25}/>
          ))}
          <text x={t.x+52.5} y={175} textAnchor="middle" fontSize="9" fill={t.hl ? t.c : 'rgba(20,23,28,0.4)'} fontFamily="ui-monospace, monospace">db_{t.label.toLowerCase().split(' ')[0]}</text>
          {/* Lock icon */}
          <g transform={`translate(${t.x+90}, 86)`}>
            <rect x="0" y="2" width="9" height="7" rx="1" fill={t.hl ? t.c : 'rgba(20,23,28,0.3)'}/>
            <path d={`M2 2v-1a2.5 2.5 0 015 0v1`} stroke={t.hl ? t.c : 'rgba(20,23,28,0.3)'} strokeWidth="1" fill="none"/>
          </g>
        </g>
      ))}

      {/* Connector */}
      <line x1="260" y1="50" x2="260" y2="80" stroke="rgba(20,23,28,0.2)" strokeDasharray="2 3"/>
    </svg>
  );
}

// ---------- TAB Fatturazione ----------
function TabFatturazione({ ist }) {
  return (
    <>
      <SectionHeader sup="Fatturazione" title="Piano Enterprise · CHF 380/mese"
        actions={<Button tone="ghost" size="md" icon="export">Scarica fatture</Button>}/>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 }}>
        <Card style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:18 }}>
            <div>
              <div className="prox-display" style={{ fontSize:30, fontWeight:600, letterSpacing:-0.6 }}>CHF 380.–</div>
              <div style={{ fontSize:12, color: proxColors.ink3, marginTop:4 }}>al mese · rinnovo automatico il 15.01.2027</div>
            </div>
            <Tag tone="accent" size="md">Enterprise</Tag>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              'Équipe illimitate',
              'Operatori illimitati',
              'Storage allegati 500GB',
              'Backup quotidiano · retention 30gg',
              '2FA per admin (opt-in)',
              'Supporto prioritario · SLA 4h',
              'Audit log esportabile',
            ].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                <Icon name="check" size={14} color={proxColors.ok}/>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${proxColors.line2}`, fontSize:13, fontWeight:600 }}>Ultime fatture</div>
          {[
            { d:'01.05.2026', n:'2026-05', tot:'CHF 380.00', s:'paid' },
            { d:'01.04.2026', n:'2026-04', tot:'CHF 380.00', s:'paid' },
            { d:'01.03.2026', n:'2026-03', tot:'CHF 380.00', s:'paid' },
            { d:'01.02.2026', n:'2026-02', tot:'CHF 380.00', s:'paid' },
            { d:'01.01.2026', n:'2026-01', tot:'CHF 380.00', s:'paid' },
          ].map((f,i) => (
            <div key={f.n} style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:10, borderTop: i>0 ? `1px solid ${proxColors.line2}` : 'none', fontSize:12.5 }}>
              <Icon name="doc" size={16} color={proxColors.ink3}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500 }}>Fattura {f.n}</div>
                <div style={{ fontSize:11, color: proxColors.ink3 }}>{f.d}</div>
              </div>
              <div className="prox-mono" style={{ fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{f.tot}</div>
              <Tag tone="ok" size="sm">pagata</Tag>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function SectionHeader({ sup, title, actions }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22 }}>
      <div>
        <div style={{ fontSize:12, color: proxColors.ink3, fontWeight:500, marginBottom:4 }}>{sup}</div>
        <div className="prox-display" style={{ fontSize:32, fontWeight:600, letterSpacing:-0.6 }}>{title}</div>
      </div>
      {actions && <div style={{ display:'flex', gap:8 }}>{actions}</div>}
    </div>
  );
}

Object.assign(window, { SuperAdminPiattaforma, AdminIstituzione });
