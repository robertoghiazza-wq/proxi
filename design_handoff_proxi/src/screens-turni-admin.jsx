// ===== screens-turni-admin.jsx =====

// ---------- DATI: équipe & turni ----------
const EQUIPE_PROMETHEUS = [
  { id:'eq1', nome:'Lugano centro',     citta:'Lugano',     coordinatore:'p6', membri:['p6','p7','p9','p10'],           regione:'Sottoceneri', attivaDal:'2018-03', utenti: 87, eventiSett: 142, oreSett: 186, status:'attiva' },
  { id:'eq2', nome:'Lugano Vedeggio',   citta:'Agno',       coordinatore:'p11', membri:['p11','p12','p13'],              regione:'Sottoceneri', attivaDal:'2021-09', utenti: 42, eventiSett: 78,  oreSett: 114, status:'attiva' },
  { id:'eq3', nome:'Mendrisiotto',      citta:'Chiasso',    coordinatore:'p14', membri:['p14','p15','p16','p17'],        regione:'Sottoceneri', attivaDal:'2019-06', utenti: 64, eventiSett: 96,  oreSett: 152, status:'attiva' },
  { id:'eq4', nome:'Bellinzonese',      citta:'Bellinzona', coordinatore:'p18', membri:['p18','p19','p20'],              regione:'Sopraceneri', attivaDal:'2020-01', utenti: 38, eventiSett: 64,  oreSett: 114, status:'attiva' },
  { id:'eq5', nome:'Locarnese',         citta:'Locarno',    coordinatore:'p21', membri:['p21','p22','p23','p24','p25'],  regione:'Sopraceneri', attivaDal:'2017-11', utenti: 71, eventiSett: 118, oreSett: 190, status:'attiva' },
  { id:'eq6', nome:'Tre Valli',         citta:'Biasca',     coordinatore:'p26', membri:['p26','p27'],                    regione:'Sopraceneri', attivaDal:'2023-04', utenti: 19, eventiSett: 32,  oreSett: 76,  status:'pilota' },
];

// Estensione PERSONE: aggiungo i coordinatori e gli educatori delle altre équipe (in modo che personaById funzioni)
const PERSONE_EXTRA = [
  // Lugano Vedeggio
  { id:'p11', ruolo:'dipendente', nome:'Lara Conti',        soprannome:null, eta:42, sesso:'F', lingue:['IT','DE'],          tag:['coordinatrice'],    bisogni:[], note:'Coord. Vedeggio dal 2021', anonimo:false },
  { id:'p12', ruolo:'dipendente', nome:'Davide Berti',      soprannome:null, eta:31, sesso:'M', lingue:['IT'],               tag:['educatore'],       bisogni:[], note:'', anonimo:false },
  { id:'p13', ruolo:'dipendente', nome:'Sara Pellegrini',   soprannome:null, eta:28, sesso:'F', lingue:['IT','EN'],          tag:['educatrice'],      bisogni:[], note:'', anonimo:false },
  // Mendrisiotto
  { id:'p14', ruolo:'dipendente', nome:'Roberto Galli',     soprannome:null, eta:48, sesso:'M', lingue:['IT'],               tag:['coordinatore'],    bisogni:[], note:'Coord. Mendrisiotto', anonimo:false },
  { id:'p15', ruolo:'dipendente', nome:'Elena Marzano',     soprannome:null, eta:35, sesso:'F', lingue:['IT','PT'],          tag:['educatrice'],      bisogni:[], note:'', anonimo:false },
  { id:'p16', ruolo:'dipendente', nome:'Matteo Foletti',    soprannome:null, eta:29, sesso:'M', lingue:['IT'],               tag:['educatore'],       bisogni:[], note:'', anonimo:false },
  { id:'p17', ruolo:'dipendente', nome:'Yasmin Khalif',     soprannome:null, eta:26, sesso:'F', lingue:['IT','AR','FR'],     tag:['educatrice'],      bisogni:[], note:'', anonimo:false },
  // Bellinzonese
  { id:'p18', ruolo:'dipendente', nome:'Stefania Crivelli', soprannome:null, eta:45, sesso:'F', lingue:['IT','DE'],          tag:['coordinatrice'],   bisogni:[], note:'', anonimo:false },
  { id:'p19', ruolo:'dipendente', nome:'Luca Pedrazzi',     soprannome:null, eta:33, sesso:'M', lingue:['IT'],               tag:['educatore'],       bisogni:[], note:'', anonimo:false },
  { id:'p20', ruolo:'dipendente', nome:'Camilla Rossi',     soprannome:null, eta:27, sesso:'F', lingue:['IT','EN'],          tag:['educatrice'],      bisogni:[], note:'', anonimo:false },
  // Locarnese
  { id:'p21', ruolo:'dipendente', nome:'Andrea Bianchi',    soprannome:null, eta:52, sesso:'M', lingue:['IT','DE'],          tag:['coordinatore'],    bisogni:[], note:'', anonimo:false },
  { id:'p22', ruolo:'dipendente', nome:'Giada Tognola',     soprannome:null, eta:36, sesso:'F', lingue:['IT'],               tag:['educatrice'],      bisogni:[], note:'', anonimo:false },
  { id:'p23', ruolo:'dipendente', nome:'Nicolas Demir',     soprannome:null, eta:30, sesso:'M', lingue:['IT','TR','DE'],     tag:['educatore'],       bisogni:[], note:'', anonimo:false },
  { id:'p24', ruolo:'dipendente', nome:'Sofia Maggi',       soprannome:null, eta:25, sesso:'F', lingue:['IT'],               tag:['stagista'],        bisogni:[], note:'Tirocinio SUPSI', anonimo:false },
  { id:'p25', ruolo:'dipendente', nome:'Tommaso Vinci',     soprannome:null, eta:38, sesso:'M', lingue:['IT','EN'],          tag:['educatore'],       bisogni:[], note:'', anonimo:false },
  // Tre Valli
  { id:'p26', ruolo:'dipendente', nome:'Paola Ferrari',     soprannome:null, eta:41, sesso:'F', lingue:['IT'],               tag:['coordinatrice'],   bisogni:[], note:'Pilota Tre Valli', anonimo:false },
  { id:'p27', ruolo:'dipendente', nome:'Jonas Müller',      soprannome:null, eta:32, sesso:'M', lingue:['IT','DE'],          tag:['educatore'],       bisogni:[], note:'', anonimo:false },
];
// Append-merge into global PERSONE (the existing array)
if (typeof PERSONE !== 'undefined' && Array.isArray(PERSONE)) {
  PERSONE_EXTRA.forEach(p => { if (!PERSONE.find(x => x.id === p.id)) PERSONE.push(p); });
}

// Tipi turno
const TIPI_TURNO = {
  mattino:    { label:'Mattino',    range:'06:00–12:00', hue: 50,  icon:'☼' },
  pomeriggio: { label:'Pomeriggio', range:'12:00–18:00', hue: 30,  icon:'◐' },
  sera:       { label:'Sera',       range:'18:00–23:00', hue: 280, icon:'☾' },
  notte:      { label:'Notte',      range:'23:00–06:00', hue: 240, icon:'★' },
  reperib:    { label:'Reperibile', range:'on-call',     hue: 0,   icon:'☎' },
  libero:     { label:'Libero',     range:'',            hue: 160, icon:'·' },
  ferie:      { label:'Ferie',      range:'',            hue: 155, icon:'◇' },
  formazione: { label:'Formazione', range:'',            hue: 200, icon:'✎' },
};

// Settimana corrente (sett 19 · 11–17 maggio 2026)
const SETTIMANA_TURNI = ['2026-05-11','2026-05-12','2026-05-13','2026-05-14','2026-05-15','2026-05-16','2026-05-17'];

// Turni per équipe Lugano centro
// Persone: p6 (Giulia, coord), p7 (Marco), p9 (Sofia), p10 (Alex)
// Codifica: [persona][giorno] = tipo
const TURNI_LUGANO = {
  p6:  ['mattino','mattino','pomeriggio','pomeriggio','mattino','libero','libero'],
  p7:  ['pomeriggio','pomeriggio','mattino','sera','sera','mattino','libero'],
  p9:  ['sera','sera','sera','libero','libero','pomeriggio','pomeriggio'],
  p10: ['ferie','ferie','ferie','ferie','ferie','libero','libero'],
};
// Reperibilità per ogni giorno (lista persone)
const REPERIBILITA = {
  '2026-05-11': ['p6'],
  '2026-05-12': ['p7'],
  '2026-05-13': ['p6'],
  '2026-05-14': ['p9'],
  '2026-05-15': ['p7'],
  '2026-05-16': ['p9'],
  '2026-05-17': ['p6'],
};

// Richieste / scambi pendenti
const RICHIESTE_TURNO = [
  { id:'r1', tipo:'cambio',  da:'p7', a:'p9', giorno:'2026-05-14', turno:'sera',       motivo:'Visita medica figlio', stato:'in_attesa', data_richiesta:'2026-05-08' },
  { id:'r2', tipo:'ferie',   da:'p9', giorno_inizio:'2026-05-25', giorno_fine:'2026-05-29',                            motivo:'Vacanza prenotata',     stato:'in_attesa', data_richiesta:'2026-05-09' },
  { id:'r3', tipo:'cambio',  da:'p10', a:'p6', giorno:'2026-05-18', turno:'mattino',   motivo:'Conferenza Berna',     stato:'approvata',  data_richiesta:'2026-05-05' },
];

Object.assign(window, { EQUIPE_PROMETHEUS, TIPI_TURNO, SETTIMANA_TURNI, TURNI_LUGANO, REPERIBILITA, RICHIESTE_TURNO });

// ---------- DESKTOP: Gestione turni coordinatore ----------
function DesktopTurni() {
  const [vista, setVista] = React.useState('settimana');
  const [selectedCell, setSelectedCell] = React.useState(null); // {personaId, giornoIdx}
  const membri = ['p6','p7','p9','p10'];
  const giorni = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  const dateMM = SETTIMANA_TURNI.map(d => new Date(d+'T00:00:00').getDate());

  // Coverage per ogni giorno e fascia
  const coverage = (giornoIdx) => {
    const m = {mattino:0, pomeriggio:0, sera:0, notte:0};
    membri.forEach(p => { const t = TURNI_LUGANO[p][giornoIdx]; if (m[t] !== undefined) m[t]++; });
    return m;
  };

  return (
    <div className="prox" style={{ background: proxColors.bg, minHeight: '100%', color: proxColors.ink, fontFamily: 'Inter' }}>
      {/* Topbar */}
      <div style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${proxColors.line}`, background: proxColors.surface }}>
        <ProxiLogo size={26} color={proxColors.ink}/>
        <div style={{ width: 1, height: 22, background: proxColors.line }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrgLogo org="prometheus" size={22}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>Prometheus · Lugano centro</div>
            <div style={{ fontSize: 10, color: proxColors.ink3 }}>4 educatori · coord. G. Mazza</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Oggi','Persone','Luoghi','Eventi','Rendiconto','Spese','Veicoli','Obiettivi','Turni','Équipe'].map((t,i) => (
            <button key={t} style={{
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
              background: i===8 ? proxColors.accentSoft : 'transparent',
              color: i===8 ? proxColors.accentInk : proxColors.ink2,
              fontSize: 13, fontWeight: i===8 ? 600 : 500,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Avatar nome="Giulia Mazza" ruolo="dipendente" size={32}/>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: proxColors.ink3, fontWeight: 500, marginBottom: 4 }}>Pianificazione turni · équipe Lugano centro</div>
            <div className="prox-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>Settimana 20 · 11–17 maggio</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: proxColors.surface, border: `1px solid ${proxColors.line}`, borderRadius: 10, padding: 2 }}>
              {['settimana','mese','liste'].map(v => (
                <button key={v} onClick={()=>setVista(v)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                  background: vista===v ? proxColors.ink : 'transparent',
                  color: vista===v ? proxColors.bg : proxColors.ink2,
                  fontSize: 12.5, fontWeight: vista===v ? 600 : 500,
                }}>{v[0].toUpperCase()+v.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${proxColors.line}`, background:proxColors.surface, cursor:'pointer' }}>←</button>
              <button style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${proxColors.line}`, background:proxColors.surface, cursor:'pointer', fontSize:12.5 }}>Oggi</button>
              <button style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${proxColors.line}`, background:proxColors.surface, cursor:'pointer' }}>→</button>
            </div>
            <Button tone="ghost" size="md" icon="export">Esporta</Button>
            <Button tone="primary" size="md" icon="plus">Pubblica piano</Button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
          <MiniKPI label="Ore totali pianificate" value="186h" sub="su 4 educatori"/>
          <MiniKPI label="Copertura strada" value="94%" sub="6 turni scoperti" tone="warn"/>
          <MiniKPI label="Richieste pendenti" value={RICHIESTE_TURNO.filter(r=>r.stato==='in_attesa').length} sub="da gestire" tone="accent"/>
          <MiniKPI label="In ferie" value="1" sub="A. Demir, lun–ven"/>
          <MiniKPI label="Sbilanciamento" value="±3h" sub="distribuzione equa"/>
        </div>

        {/* Grid turni */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(7, 1fr) 100px', borderBottom: `1px solid ${proxColors.line}` }}>
            <div style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, background: proxColors.surface2 }}>Educatore</div>
            {giorni.map((g, i) => {
              const isToday = i === 0; // Lun = oggi nel mock
              return (
                <div key={g} style={{ padding: '12px 8px', textAlign: 'center', background: proxColors.surface2, borderLeft: `1px solid ${proxColors.line2}` }}>
                  <div style={{ fontSize: 11, color: proxColors.ink3, fontWeight: 500 }}>{g}</div>
                  <div className="prox-display" style={{ fontSize: 17, fontWeight: 600, color: isToday ? proxColors.accent : proxColors.ink, marginTop: 2 }}>{dateMM[i]}</div>
                </div>
              );
            })}
            <div style={{ padding: '12px 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, background: proxColors.surface2, borderLeft: `1px solid ${proxColors.line2}`, textAlign: 'center' }}>Ore</div>
          </div>

          {/* Righe educatori */}
          {membri.map(pid => {
            const p = personaById(pid);
            const turni = TURNI_LUGANO[pid];
            const ore = turni.reduce((s, t) => s + (t === 'mattino' || t === 'pomeriggio' ? 6 : t === 'sera' ? 5 : t === 'notte' ? 7 : 0), 0);
            return (
              <div key={pid} style={{ display: 'grid', gridTemplateColumns: '220px repeat(7, 1fr) 100px', borderBottom: `1px solid ${proxColors.line2}`, minHeight: 64 }}>
                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, background: proxColors.surface }}>
                  <Avatar nome={p.nome} ruolo="dipendente" size={34}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nome}</div>
                    <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>{(p.tag||[])[0] || 'educatore'}</div>
                  </div>
                </div>
                {turni.map((t, i) => {
                  const cfg = TIPI_TURNO[t];
                  const sel = selectedCell?.personaId === pid && selectedCell?.giornoIdx === i;
                  const empty = t === 'libero';
                  const ferie = t === 'ferie';
                  return (
                    <div key={i} onClick={()=>setSelectedCell({personaId:pid, giornoIdx:i})} style={{
                      borderLeft: `1px solid ${proxColors.line2}`, padding: 8, cursor: 'pointer',
                      background: sel ? proxColors.accentSoft : (empty ? proxColors.surface2 : proxColors.surface),
                      display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center',
                      transition: 'background 80ms',
                    }}>
                      {empty ? (
                        <div style={{ fontSize: 11, color: proxColors.ink3, textAlign: 'center', fontStyle: 'italic' }}>libero</div>
                      ) : ferie ? (
                        <div style={{ background: `oklch(0.94 0.04 155)`, border: `1px dashed oklch(0.6 0.1 155)`, borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: `oklch(0.4 0.12 155)`, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Ferie</div>
                        </div>
                      ) : (
                        <div style={{ background: `oklch(0.95 0.05 ${cfg.hue})`, borderLeft: `3px solid oklch(0.55 0.14 ${cfg.hue})`, borderRadius: 4, padding: '6px 8px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: `oklch(0.3 0.12 ${cfg.hue})`, marginBottom: 1 }}>{cfg.label}</div>
                          <div className="prox-mono" style={{ fontSize: 10, color: `oklch(0.45 0.1 ${cfg.hue})`, fontVariantNumeric: 'tabular-nums' }}>{cfg.range}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ padding: 12, borderLeft: `1px solid ${proxColors.line2}`, background: proxColors.surface2, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="prox-mono" style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{ore}h</div>
                  <div style={{ fontSize: 10, color: proxColors.ink3 }}>su 38h</div>
                </div>
              </div>
            );
          })}

          {/* Row reperibilità */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(7, 1fr) 100px', borderTop: `1px solid ${proxColors.line}`, minHeight: 48, background: 'rgba(20,23,28,0.02)' }}>
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>☎</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: proxColors.ink2 }}>Reperibilità notturna</span>
            </div>
            {SETTIMANA_TURNI.map((d, i) => {
              const rep = REPERIBILITA[d] || [];
              return (
                <div key={d} style={{ padding: 8, borderLeft: `1px solid ${proxColors.line2}`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {rep.map(pid => {
                    const p = personaById(pid);
                    return <Avatar key={pid} nome={p.nome} ruolo="dipendente" size={22}/>;
                  })}
                </div>
              );
            })}
            <div style={{ borderLeft: `1px solid ${proxColors.line2}` }}/>
          </div>

          {/* Row copertura totale */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(7, 1fr) 100px', borderTop: `1px solid ${proxColors.line}`, minHeight: 64, background: 'rgba(20,23,28,0.02)' }}>
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: proxColors.ink2 }}>Copertura</span>
            </div>
            {SETTIMANA_TURNI.map((d, i) => {
              const c = coverage(i);
              const totale = c.mattino + c.pomeriggio + c.sera + c.notte;
              const ideale = 4;
              const ok = totale >= 3;
              return (
                <div key={d} style={{ padding: 8, borderLeft: `1px solid ${proxColors.line2}`, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: 2, height: 18 }}>
                    {Object.entries(c).map(([k, n]) => {
                      const cfg = TIPI_TURNO[k];
                      return n > 0 ? (
                        <div key={k} style={{ flex: n, background: `oklch(0.6 0.13 ${cfg.hue})`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{n}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: ok ? proxColors.ok : proxColors.danger, fontWeight: 600, textAlign: 'center' }}>
                    {totale}/{ideale} {!ok && '⚠'}
                  </div>
                </div>
              );
            })}
            <div style={{ borderLeft: `1px solid ${proxColors.line2}` }}/>
          </div>
        </Card>

        {/* Bottom: legenda + richieste */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Legenda turni</div>
            <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 14 }}>Click su una cella per modificare</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(TIPI_TURNO).map(([k, cfg]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: `oklch(0.6 0.13 ${cfg.hue})` }}/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{cfg.label}</div>
                    {cfg.range && <div className="prox-mono" style={{ fontSize: 10.5, color: proxColors.ink3 }}>{cfg.range}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${proxColors.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="prox-display" style={{ fontSize: 15, fontWeight: 600 }}>Richieste & scambi</div>
                <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2 }}>{RICHIESTE_TURNO.filter(r=>r.stato==='in_attesa').length} da gestire · {RICHIESTE_TURNO.filter(r=>r.stato==='approvata').length} approvate</div>
              </div>
              <Button tone="ghost" size="sm" icon="plus">Nuova richiesta</Button>
            </div>
            <div>
              {RICHIESTE_TURNO.map(r => {
                const da = personaById(r.da);
                const a = r.a ? personaById(r.a) : null;
                const isFerie = r.tipo === 'ferie';
                return (
                  <div key={r.id} style={{ padding: '12px 18px', borderTop: `1px solid ${proxColors.line2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar nome={da.nome} ruolo="dipendente" size={32}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {da.nome.split(' ')[0]}
                        {isFerie
                          ? <span style={{ color: proxColors.ink2, fontWeight: 400 }}> · richiede ferie </span>
                          : <span style={{ color: proxColors.ink2, fontWeight: 400 }}> → cambio con {a?.nome.split(' ')[0]}</span>
                        }
                      </div>
                      <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2 }}>
                        {isFerie
                          ? <>{new Date(r.giorno_inizio).toLocaleDateString('it-CH')} → {new Date(r.giorno_fine).toLocaleDateString('it-CH')} · </>
                          : <>{new Date(r.giorno).toLocaleDateString('it-CH')} · {TIPI_TURNO[r.turno]?.label} · </>
                        }
                        <span style={{ fontStyle: 'italic' }}>«{r.motivo}»</span>
                      </div>
                    </div>
                    {r.stato === 'in_attesa' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button tone="ghost" size="sm">Rifiuta</Button>
                        <Button tone="primary" size="sm">Approva</Button>
                      </div>
                    ) : (
                      <Tag tone="ok" size="sm">✓ approvata</Tag>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, sub, tone }) {
  const color = tone === 'accent' ? proxColors.accent : tone === 'warn' ? proxColors.warn : tone === 'danger' ? proxColors.danger : proxColors.ink;
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, color: proxColors.ink3, marginBottom: 8 }}>{label}</div>
      <div className="prox-display" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: proxColors.ink3, marginTop: 4 }}>{sub}</div>
    </Card>
  );
}

// ---------- DESKTOP: Pannello amministrativo · équipe della stessa istituzione ----------
function DesktopAdminEquipe() {
  const [vista, setVista] = React.useState('cards');
  const totUtenti = EQUIPE_PROMETHEUS.reduce((s,e)=>s+e.utenti,0);
  const totEventi = EQUIPE_PROMETHEUS.reduce((s,e)=>s+e.eventiSett,0);
  const totMembri = EQUIPE_PROMETHEUS.reduce((s,e)=>s+e.membri.length,0);
  const totOre = EQUIPE_PROMETHEUS.reduce((s,e)=>s+e.oreSett,0);

  return (
    <div className="prox" style={{ background: proxColors.bg, minHeight: '100%', color: proxColors.ink, fontFamily: 'Inter' }}>
      {/* Topbar amministrativo */}
      <div style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${proxColors.line}`, background: proxColors.surface }}>
        <ProxiLogo size={26} color={proxColors.ink}/>
        <div style={{ width: 1, height: 22, background: proxColors.line }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrgLogo org="prometheus" size={22}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>Prometheus · Direzione</div>
            <div style={{ fontSize: 10, color: proxColors.ink3 }}>Vista amministrativa · 6 équipe · Ticino</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Dashboard','Équipe','Persone','Reportistica','Fatturazione','Impostazioni'].map((t,i) => (
            <button key={t} style={{
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
              background: i===1 ? proxColors.accentSoft : 'transparent',
              color: i===1 ? proxColors.accentInk : proxColors.ink2,
              fontSize: 13, fontWeight: i===1 ? 600 : 500,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Tag tone="accent" size="sm">Admin</Tag>
        <Avatar nome="Direzione" ruolo="dipendente" size={32}/>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: proxColors.ink3, fontWeight: 500, marginBottom: 4 }}>Panoramica équipe · Prometheus</div>
            <div className="prox-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>6 équipe in Ticino</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: proxColors.surface, border: `1px solid ${proxColors.line}`, borderRadius: 10, padding: 2 }}>
              {[{k:'cards',l:'Cards'},{k:'mappa',l:'Mappa TI'},{k:'tabella',l:'Tabella'}].map(v => (
                <button key={v.k} onClick={()=>setVista(v.k)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                  background: vista===v.k ? proxColors.ink : 'transparent',
                  color: vista===v.k ? proxColors.bg : proxColors.ink2,
                  fontSize: 12.5, fontWeight: vista===v.k ? 600 : 500,
                }}>{v.l}</button>
              ))}
            </div>
            <Button tone="ghost" size="md" icon="export">Report</Button>
            <Button tone="primary" size="md" icon="plus">Nuova équipe</Button>
          </div>
        </div>

        {/* Top KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
          <MiniKPI label="Équipe attive" value={EQUIPE_PROMETHEUS.filter(e=>e.status==='attiva').length} sub={`+${EQUIPE_PROMETHEUS.filter(e=>e.status==='pilota').length} pilota`}/>
          <MiniKPI label="Educatori totali" value={totMembri} sub="su 6 équipe"/>
          <MiniKPI label="Utenti in carico" value={totUtenti} sub="ultimo mese" tone="accent"/>
          <MiniKPI label="Eventi/settimana" value={totEventi} sub={`media ${Math.round(totEventi/EQUIPE_PROMETHEUS.length)}/équipe`}/>
          <MiniKPI label="Ore presidio" value={`${totOre}h`} sub="settimana corrente"/>
        </div>

        {vista === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {EQUIPE_PROMETHEUS.map(eq => <EquipeCard key={eq.id} eq={eq}/>)}
          </div>
        )}

        {vista === 'mappa' && <MappaTicino/>}

        {vista === 'tabella' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
              <thead>
                <tr style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.6, color: proxColors.ink3, textAlign: 'left', fontWeight: 600, background: proxColors.surface2 }}>
                  <th style={{ padding: '12px 18px' }}>Équipe</th>
                  <th style={{ padding: '12px 8px' }}>Regione</th>
                  <th style={{ padding: '12px 8px' }}>Coordinatore</th>
                  <th style={{ padding: '12px 8px', textAlign:'center' }}>Membri</th>
                  <th style={{ padding: '12px 8px', textAlign:'right' }}>Utenti</th>
                  <th style={{ padding: '12px 8px', textAlign:'right' }}>Eventi/sett</th>
                  <th style={{ padding: '12px 8px', textAlign:'right' }}>Ore/sett</th>
                  <th style={{ padding: '12px 8px' }}>Attiva dal</th>
                  <th style={{ padding: '12px 18px', textAlign:'center' }}>Stato</th>
                </tr>
              </thead>
              <tbody>
                {EQUIPE_PROMETHEUS.map(eq => {
                  const coord = personaById(eq.coordinatore);
                  return (
                    <tr key={eq.id} style={{ fontSize: 13, borderTop: `1px solid ${proxColors.line2}` }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{eq.nome}</div>
                        <div style={{ fontSize: 11, color: proxColors.ink3 }}>{eq.citta}</div>
                      </td>
                      <td style={{ padding: '12px 8px', color: proxColors.ink2 }}>{eq.regione}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar nome={coord?.nome} ruolo="dipendente" size={22}/>
                          <span style={{ fontSize: 12 }}>{coord?.nome}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontFamily: 'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', fontWeight: 600 }}>{eq.membri.length}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontVariantNumeric:'tabular-nums' }}>{eq.utenti}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontVariantNumeric:'tabular-nums' }}>{eq.eventiSett}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontVariantNumeric:'tabular-nums', fontWeight: 600 }}>{eq.oreSett}</td>
                      <td style={{ padding: '12px 8px', color: proxColors.ink3, fontSize: 12 }}>{new Date(eq.attivaDal+'-01').toLocaleDateString('it-CH', { month:'short', year:'numeric' })}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        {eq.status === 'attiva' ? <Tag tone="ok" size="sm">attiva</Tag> : <Tag tone="warn" size="sm">pilota</Tag>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {/* Confronto barre · sempre presente */}
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Utenti per équipe</div>
            <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 16 }}>Persone in carico · ultimo mese</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...EQUIPE_PROMETHEUS].sort((a,b)=>b.utenti-a.utenti).map(eq => {
                const max = Math.max(...EQUIPE_PROMETHEUS.map(e=>e.utenti));
                const pct = (eq.utenti/max)*100;
                return (
                  <div key={eq.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{eq.nome}</span>
                      <span className="prox-mono" style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eq.utenti}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: proxColors.line2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: proxColors.accent, borderRadius: 3 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Ore presidio · équipe</div>
            <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 16 }}>Settimana corrente vs target</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EQUIPE_PROMETHEUS.map(eq => {
                const target = eq.membri.length * 38; // 38h/persona target
                const pct = Math.min(100, (eq.oreSett/target)*100);
                const isUnder = eq.oreSett < target*0.8;
                return (
                  <div key={eq.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{eq.nome}</span>
                      <span className="prox-mono" style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: isUnder ? proxColors.warn : proxColors.ink2 }}>
                        {eq.oreSett}h / {target}h
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: proxColors.line2, position: 'relative' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isUnder ? proxColors.warn : proxColors.ok, borderRadius: 3 }}/>
                      <div style={{ position: 'absolute', top: -2, bottom: -2, left: '100%', width: 1, background: proxColors.ink3 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EquipeCard({ eq }) {
  const coord = personaById(eq.coordinatore);
  const altriMembri = eq.membri.filter(m => m !== eq.coordinatore).map(personaById).filter(Boolean);
  const target = eq.membri.length * 38;
  const pct = Math.min(100, (eq.oreSett/target)*100);
  const isUnder = eq.oreSett < target*0.8;

  return (
    <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div className="prox-display" style={{ fontSize: 17, fontWeight: 600 }}>{eq.nome}</div>
            {eq.status === 'pilota' && <Tag tone="warn" size="sm">pilota</Tag>}
          </div>
          <div style={{ fontSize: 12, color: proxColors.ink3 }}>{eq.citta} · {eq.regione}</div>
        </div>
        <button style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: proxColors.ink3 }}>⋯</button>
      </div>

      {/* coordinatore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: proxColors.surface2, borderRadius: 10 }}>
        <Avatar nome={coord?.nome} ruolo="dipendente" size={36}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, color: proxColors.ink3 }}>Coordinatore</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{coord?.nome}</div>
        </div>
      </div>

      {/* membri stack */}
      <div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, color: proxColors.ink3, marginBottom: 8 }}>Équipe ({eq.membri.length})</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {altriMembri.slice(0,5).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, border: `2px solid ${proxColors.surface}`, borderRadius: 999 }}>
              <Avatar nome={m.nome} ruolo="dipendente" size={30}/>
            </div>
          ))}
          {altriMembri.length > 5 && (
            <div style={{ marginLeft: -8, width: 30, height: 30, borderRadius: 999, background: proxColors.line, color: proxColors.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, border: `2px solid ${proxColors.surface}` }}>
              +{altriMembri.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* mini KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, paddingTop: 10, borderTop: `1px solid ${proxColors.line2}` }}>
        <div>
          <div className="prox-display" style={{ fontSize: 19, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eq.utenti}</div>
          <div style={{ fontSize: 10, color: proxColors.ink3 }}>utenti</div>
        </div>
        <div>
          <div className="prox-display" style={{ fontSize: 19, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eq.eventiSett}</div>
          <div style={{ fontSize: 10, color: proxColors.ink3 }}>eventi/sett</div>
        </div>
        <div>
          <div className="prox-display" style={{ fontSize: 19, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isUnder ? proxColors.warn : proxColors.ink }}>{eq.oreSett}h</div>
          <div style={{ fontSize: 10, color: proxColors.ink3 }}>ore/sett</div>
        </div>
      </div>

      {/* progress copertura */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 4 }}>
          <span style={{ color: proxColors.ink3, fontWeight: 500 }}>Copertura target</span>
          <span className="prox-mono" style={{ fontWeight: 600, color: isUnder ? proxColors.warn : proxColors.ok }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: proxColors.line2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: isUnder ? proxColors.warn : proxColors.ok, borderRadius: 2 }}/>
        </div>
      </div>
    </Card>
  );
}

// Mappa Ticino stilizzata con sedi équipe
function MappaTicino() {
  // Coordinate stilizzate (non geografiche) per il layout della "mappa"
  const positions = {
    eq1: { x: 50, y: 75, label: 'Lugano centro' },
    eq2: { x: 38, y: 72, label: 'Vedeggio' },
    eq3: { x: 55, y: 92, label: 'Mendrisiotto' },
    eq4: { x: 60, y: 50, label: 'Bellinzonese' },
    eq5: { x: 38, y: 40, label: 'Locarnese' },
    eq6: { x: 55, y: 22, label: 'Tre Valli' },
  };
  return (
    <Card style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.5fr 1fr' }}>
      {/* mappa */}
      <div style={{ position: 'relative', background: 'linear-gradient(165deg, #e8efe6 0%, #d4dfd1 100%)', minHeight: 540, overflow: 'hidden' }}>
        {/* Confini Ticino stilizzati */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M 30 5 L 60 8 L 70 18 L 65 30 L 70 45 L 65 55 L 70 65 L 60 75 L 65 88 L 55 96 L 45 96 L 35 88 L 30 78 L 35 70 L 28 60 L 30 48 L 25 38 L 28 25 L 25 15 Z"
            fill="rgba(255,255,255,0.4)" stroke="rgba(60,80,60,0.4)" strokeWidth="0.5"/>
          {/* Laghi */}
          <ellipse cx="40" cy="40" rx="8" ry="3" fill="rgba(140,170,200,0.55)"/>
          <ellipse cx="48" cy="78" rx="6" ry="9" fill="rgba(140,170,200,0.55)" transform="rotate(-20 48 78)"/>
        </svg>
        {/* etichette geo */}
        <div style={{ position:'absolute', top: '36%', left: '32%', fontSize: 9, color: 'rgba(60,80,100,0.6)', fontStyle: 'italic' }}>Lago Maggiore</div>
        <div style={{ position:'absolute', top: '72%', left: '52%', fontSize: 9, color: 'rgba(60,80,100,0.6)', fontStyle: 'italic' }}>Lago di Lugano</div>

        {/* Pin équipe */}
        {EQUIPE_PROMETHEUS.map(eq => {
          const pos = positions[eq.id];
          if (!pos) return null;
          const size = Math.max(28, Math.min(56, 22 + eq.membri.length * 6));
          return (
            <div key={eq.id} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -100%)' }}>
              <div style={{
                background: '#fff', border: `2px solid ${proxColors.accent}`, borderRadius: '999px 999px 999px 4px',
                padding: 6, boxShadow: '0 4px 14px rgba(0,0,0,0.18)', transform: 'rotate(-45deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ transform: 'rotate(45deg)', width: size, height: size, borderRadius: '50%', background: proxColors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter Tight', fontWeight: 700, fontSize: size*0.45 }}>
                  {eq.membri.length}
                </div>
              </div>
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: -8,
                background: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap',
                border: `1px solid ${proxColors.line}`, boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              }}>{pos.label}</div>
            </div>
          );
        })}
      </div>

      {/* legenda lato dx */}
      <div style={{ padding: 18, borderLeft: `1px solid ${proxColors.line}` }}>
        <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Distribuzione territoriale</div>
        <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 16 }}>Dimensione pin = numero educatori</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {EQUIPE_PROMETHEUS.map(eq => (
            <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: proxColors.surface2 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: proxColors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{eq.membri.length}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{eq.nome}</div>
                <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>{eq.utenti} utenti · {eq.eventiSett} ev/sett</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { DesktopTurni, DesktopAdminEquipe });
