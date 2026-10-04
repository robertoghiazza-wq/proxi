// ===== screens-rendicontazione.jsx =====

// ---------- DATI: spese, veicoli, obiettivi ----------
const SPESE = [
  { id:'s1', data:'2026-04-24', categoria:'pasti',     importo: 18.50, valuta:'CHF', persone:['p2'],       descrizione:'Pranzo con A. dopo accompagnamento gineco', metodo:'contanti', scontrino:true,  rimborsata:false, educatore:'p6' },
  { id:'s2', data:'2026-04-24', categoria:'materiale', importo:  7.20, valuta:'CHF', persone:['p1','p4'],  descrizione:'Tè caldi e biscotti distribuzione',          metodo:'contanti', scontrino:true,  rimborsata:false, educatore:'p6' },
  { id:'s3', data:'2026-04-23', categoria:'trasporto', importo: 12.00, valuta:'CHF', persone:['p2'],       descrizione:'Biglietti FFS Lugano-Bellinzona x2',         metodo:'twint',     scontrino:true,  rimborsata:false, educatore:'p6' },
  { id:'s4', data:'2026-04-22', categoria:'farmacia',  importo: 24.80, valuta:'CHF', persone:['p4'],       descrizione:'Cerotti, disinfettante, ibuprofene',         metodo:'carta',     scontrino:true,  rimborsata:true,  educatore:'p6' },
  { id:'s5', data:'2026-04-21', categoria:'pasti',     importo: 32.00, valuta:'CHF', persone:['p3'],       descrizione:'Cena équipe + minore in carico',             metodo:'carta',     scontrino:true,  rimborsata:true,  educatore:'p7' },
  { id:'s6', data:'2026-04-20', categoria:'altro',     importo: 15.00, valuta:'CHF', persone:[],            descrizione:'Parcheggio centro Lugano',                   metodo:'contanti', scontrino:false, rimborsata:false, educatore:'p6' },
  { id:'s7', data:'2026-04-20', categoria:'materiale', importo: 48.90, valuta:'CHF', persone:[],            descrizione:'Coperte termiche x10',                       metodo:'carta',     scontrino:true,  rimborsata:true,  educatore:'p6' },
];
const CATEGORIE_SPESA = {
  pasti:     { label:'Pasti',     icon:'☕', hue: 30  },
  trasporto: { label:'Trasporto', icon:'🚆', hue: 200 },
  materiale: { label:'Materiale', icon:'📦', hue: 280 },
  farmacia:  { label:'Farmacia',  icon:'⚕',  hue: 155 },
  altro:     { label:'Altro',     icon:'·',  hue: 60  },
};

const VEICOLI = [
  { id:'v1', targa:'TI 312 489', modello:'Dacia Duster',    annoImm:2022, kmAttuali: 48720, kmIniziali: 12000, manutenzione: '2026-06-15', stato:'ok' },
  { id:'v2', targa:'TI 985 211', modello:'VW Caddy furgone', annoImm:2019, kmAttuali: 91450, kmIniziali: 0,     manutenzione: '2026-05-02', stato:'tagliando' },
];
const VIAGGI = [
  { id:'t1', data:'2026-04-24', veicolo:'v1', educatore:'p6', kmInizio: 48650, kmFine: 48720, motivo: 'Giro mattina · stazione + sottopasso',     scopo: 'lavoro' },
  { id:'t2', data:'2026-04-23', veicolo:'v1', educatore:'p6', kmInizio: 48590, kmFine: 48650, motivo: 'Accompagnamento ASL 3',                    scopo: 'lavoro' },
  { id:'t3', data:'2026-04-22', veicolo:'v2', educatore:'p7', kmInizio: 91320, kmFine: 91450, motivo: 'Giornata Bellinzona + ritorno',           scopo: 'lavoro' },
  { id:'t4', data:'2026-04-21', veicolo:'v1', educatore:'p6', kmInizio: 48555, kmFine: 48590, motivo: 'Centro diurno + Caritas',                  scopo: 'lavoro' },
  { id:'t5', data:'2026-04-20', veicolo:'v1', educatore:'p6', kmInizio: 48490, kmFine: 48555, motivo: 'Sopralluogo nuovi punti d\'incontro',      scopo: 'lavoro' },
];

const OBIETTIVI = [
  { id:'o1', titolo: 'Persone in carico contattate', descrizione: 'Almeno 1 contatto attivo nel mese per ogni persona seguita', tipo: 'persone', target: 30, attuale: 24, periodo: 'mese', scadenza: '2026-04-30', stato: 'in_corso', responsabile: 'p6' },
  { id:'o2', titolo: 'Ore presidio strada · Q2', descrizione: 'Ore di presenza sul territorio nelle aree critiche identificate', tipo: 'ore', target: 240, attuale: 158, periodo: 'trimestre', scadenza: '2026-06-30', stato: 'in_corso', responsabile: 'p6' },
  { id:'o3', titolo: 'Mappatura nuovi punti di aggregazione', descrizione: 'Identificare e schedare 5 nuove zone di intervento', tipo: 'luoghi', target: 5, attuale: 3, periodo: 'semestre', scadenza: '2026-09-30', stato: 'in_corso', responsabile: 'p7' },
  { id:'o4', titolo: 'Accompagnamenti sanitari minori', descrizione: 'Eventi di tipo accompagnamento per minori in carico', tipo: 'eventi', target: 12, attuale: 12, periodo: 'mese', scadenza: '2026-04-30', stato: 'raggiunto', responsabile: 'p7' },
  { id:'o5', titolo: 'Riduzione interventi emergenza notturni', descrizione: 'Massimo 4 emergenze notturne (vs 7 mese scorso)', tipo: 'eventi', target: 4, attuale: 6, periodo: 'mese', scadenza: '2026-04-30', stato: 'a_rischio', responsabile: 'p6' },
  { id:'o6', titolo: 'Formazione équipe protocollo migranti', descrizione: 'Tutta l\'équipe completa il modulo formativo', tipo: 'altro', target: 6, attuale: 4, periodo: 'mese', scadenza: '2026-05-15', stato: 'in_corso', responsabile: 'p6' },
];

Object.assign(window, { SPESE, CATEGORIE_SPESA, VEICOLI, VIAGGI, OBIETTIVI });

// ---------- MOBILE: Spese list ----------
function SpeseList({ onNuovaSpesa, onApriSpesa }) {
  const [periodo, setPeriodo] = React.useState('settimana');
  const tot = SPESE.reduce((s,x) => s + x.importo, 0);
  const totDaRimb = SPESE.filter(x=>!x.rimborsata).reduce((s,x)=>s+x.importo,0);
  const giorni = {};
  SPESE.sort((a,b)=>b.data.localeCompare(a.data)).forEach(s => { (giorni[s.data]=giorni[s.data]||[]).push(s); });
  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* hero stat */}
      <div style={{ padding: '4px 16px 14px' }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: proxColors.ink3, fontWeight: 600 }}>Spese settimana</div>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(20,23,28,0.05)', borderRadius: 8, padding: 2 }}>
              {['settimana','mese'].map(p => (
                <button key={p} onClick={()=>setPeriodo(p)} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 11,
                  background: periodo===p ? proxColors.surface : 'transparent', fontWeight: 500,
                  color: periodo===p ? proxColors.ink : proxColors.ink3,
                  boxShadow: periodo===p ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}>{p[0].toUpperCase()+p.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="prox-display" style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6 }}>CHF {tot.toFixed(2)}</div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${proxColors.line2}`, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: proxColors.ink3 }}>Da rimborsare</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: proxColors.accent, marginTop: 2 }}>CHF {totDaRimb.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: proxColors.ink3 }}>Voci</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{SPESE.length}</div>
            </div>
            <Button size="sm" tone="primary" icon="plus" onClick={onNuovaSpesa}>Aggiungi</Button>
          </div>
        </Card>
      </div>

      {/* breakdown chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
        {Object.entries(CATEGORIE_SPESA).map(([k, c]) => {
          const t = SPESE.filter(x=>x.categoria===k).reduce((s,x)=>s+x.importo,0);
          return (
            <div key={k} style={{
              padding: '6px 10px', borderRadius: 999, background: 'rgba(20,23,28,0.05)',
              fontSize: 11.5, fontFamily: 'Inter', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: `oklch(0.62 0.12 ${c.hue})` }}/>
              <span style={{ fontWeight: 500 }}>{c.label}</span>
              <span style={{ color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{t.toFixed(0)}.–</span>
            </div>
          );
        })}
      </div>

      {Object.entries(giorni).map(([d, items]) => {
        const dt = new Date(d+'T00:00:00');
        const giorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
        const dlabel = d === '2026-04-24' ? 'Oggi · Ven 24 apr' : d === '2026-04-23' ? 'Ieri · Gio 23 apr' : `${giorni[dt.getDay()]} ${dt.getDate()} apr`;
        const totGiorno = items.reduce((s,x)=>s+x.importo,0);
        return (
          <div key={d} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '4px 20px 8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{dlabel}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>CHF {totGiorno.toFixed(2)}</span>
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(s => <SpesaRow key={s.id} s={s} onClick={()=>onApriSpesa && onApriSpesa(s.id)}/>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpesaRow({ s, onClick }) {
  const cat = CATEGORIE_SPESA[s.categoria];
  const personeNomi = s.persone.map(personaById).filter(Boolean).map(p => p.soprannome || p.nome).join(', ');
  return (
    <Card onClick={onClick} style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `oklch(0.95 0.04 ${cat.hue})`, color: `oklch(0.4 0.12 ${cat.hue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.descrizione}</div>
        <div style={{ fontSize: 11, color: proxColors.ink3, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>{cat.label}</span>
          {personeNomi && <><span>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{personeNomi}</span></>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="prox-mono" style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s.importo.toFixed(2)}</div>
        <div style={{ fontSize: 10, color: s.rimborsata ? proxColors.ok : proxColors.ink3, marginTop: 2 }}>
          {s.rimborsata ? '✓ rimborsata' : 'da rimb.'}
        </div>
      </div>
    </Card>
  );
}

// ---------- MOBILE: Form nuova spesa con scontrino ----------
function NuovaSpesa({ onClose, onSave }) {
  const [importo, setImporto] = React.useState('18.50');
  const [categoria, setCategoria] = React.useState('pasti');
  const [metodo, setMetodo] = React.useState('contanti');
  const [hasScontrino, setHasScontrino] = React.useState(true);
  return (
    <div style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 14, color: proxColors.ink2, cursor: 'pointer', fontFamily: 'Inter' }}>Annulla</button>
        <div className="prox-display" style={{ fontSize: 16, fontWeight: 600 }}>Nuova spesa</div>
        <button onClick={onSave} style={{ background: 'transparent', border: 'none', fontSize: 14, color: proxColors.accent, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>Salva</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {/* Importo display */}
        <div style={{ textAlign: 'center', padding: '20px 0 14px' }}>
          <div style={{ fontSize: 11, color: proxColors.ink3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>CHF</div>
          <div className="prox-display" style={{ fontSize: 56, fontWeight: 600, letterSpacing: -1.5, color: proxColors.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{importo}</div>
        </div>

        {/* Categorie grid */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Categoria</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 16 }}>
          {Object.entries(CATEGORIE_SPESA).map(([k,c]) => {
            const sel = categoria === k;
            return (
              <button key={k} onClick={()=>setCategoria(k)} style={{
                padding: '12px 4px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Inter',
                border: `1.5px solid ${sel ? `oklch(0.62 0.12 ${c.hue})` : proxColors.line2}`,
                background: sel ? `oklch(0.96 0.04 ${c.hue})` : proxColors.surface,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <span style={{ fontSize: 10.5, fontWeight: sel ? 600 : 500, color: sel ? `oklch(0.35 0.12 ${c.hue})` : proxColors.ink2 }}>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scontrino capture */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Scontrino</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={()=>setHasScontrino(true)} style={{
            flex: 1, padding: '14px', borderRadius: 12,
            border: `1.5px solid ${hasScontrino ? proxColors.accent : proxColors.line}`,
            background: hasScontrino ? proxColors.accentSoft : proxColors.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Inter',
          }}>
            <Icon name="grid" size={20} color={hasScontrino ? proxColors.accent : proxColors.ink2}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: hasScontrino ? proxColors.accentInk : proxColors.ink2 }}>Foto scontrino</span>
            {hasScontrino && <span style={{ fontSize: 10, color: proxColors.accentInk }}>✓ acquisita</span>}
          </button>
          <button onClick={()=>setHasScontrino(false)} style={{
            flex: 1, padding: '14px', borderRadius: 12,
            border: `1.5px solid ${!hasScontrino ? proxColors.accent : proxColors.line}`,
            background: !hasScontrino ? proxColors.accentSoft : proxColors.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Inter',
          }}>
            <Icon name="doc" size={20} color={!hasScontrino ? proxColors.accent : proxColors.ink2}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: !hasScontrino ? proxColors.accentInk : proxColors.ink2 }}>Senza scontrino</span>
          </button>
        </div>

        {hasScontrino && (
          <div style={{
            marginBottom: 14, borderRadius: 12, overflow: 'hidden', border: `1px solid ${proxColors.line}`,
            background: '#faf8f3', position: 'relative', height: 160,
          }}>
            <ScontrinoMockup/>
            <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
              <Tag tone="ok" size="sm">✓ Riconosciuto · CHF 18.50</Tag>
            </div>
          </div>
        )}

        {/* Metodo */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Metodo di pagamento</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['contanti','carta','twint'].map(m => (
            <button key={m} onClick={()=>setMetodo(m)} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              border: `1px solid ${metodo===m ? proxColors.accent : proxColors.line}`,
              background: metodo===m ? proxColors.accentSoft : proxColors.surface,
              color: metodo===m ? proxColors.accentInk : proxColors.ink2,
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
            }}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
          ))}
        </div>

        {/* Collega persona */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Persona collegata <span style={{ fontWeight: 400 }}>(opz.)</span></div>
        <Card style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Avatar nome="Aïcha B." ruolo="utente" size={32}/>
          <div style={{ flex: 1, fontSize: 13 }}>Aïcha B.</div>
          <Icon name="close" size={14} color={proxColors.ink3}/>
        </Card>

        {/* Descrizione */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Descrizione</div>
        <textarea defaultValue="Pranzo con A. dopo accompagnamento gineco" style={{
          width: '100%', minHeight: 60, padding: 12, borderRadius: 10, border: `1px solid ${proxColors.line}`,
          background: proxColors.surface, fontSize: 13.5, fontFamily: 'Inter', resize: 'none', outline: 'none', boxSizing: 'border-box',
        }}/>
      </div>
    </div>
  );
}

function ScontrinoMockup() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
      <div style={{
        width: 200, background: '#fff', padding: '14px 16px', fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 9.5, color: '#333', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', transform: 'rotate(-3deg)',
        clipPath: 'polygon(0 0, 100% 0, 100% 96%, 95% 100%, 90% 96%, 85% 100%, 80% 96%, 75% 100%, 70% 96%, 65% 100%, 60% 96%, 55% 100%, 50% 96%, 45% 100%, 40% 96%, 35% 100%, 30% 96%, 25% 100%, 20% 96%, 15% 100%, 10% 96%, 5% 100%, 0 96%)',
      }}>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 11, marginBottom: 8 }}>CAFFÈ AL PORTO</div>
        <div style={{ textAlign: 'center', fontSize: 8, color: '#666', marginBottom: 10 }}>Lugano · 24.04.2026 · 12:34</div>
        <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>2x Panino</span><span>14.00</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>2x Acqua</span><span> 4.50</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6 }}><span>TOTALE</span><span>18.50</span></div>
      </div>
    </div>
  );
}

// ---------- MOBILE: Veicoli & km ----------
function VeicoliList({ onApriVeicolo, onLogViaggio }) {
  return (
    <div style={{ padding: '0 16px 120px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {VEICOLI.map(v => <VeicoloCard key={v.id} v={v} onClick={()=>onApriVeicolo && onApriVeicolo(v.id)}/>)}
      </div>

      <Button tone="primary" size="md" icon="plus" full onClick={onLogViaggio} style={{ marginBottom: 18 }}>Registra viaggio</Button>

      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '4px 4px 8px' }}>Ultimi viaggi</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {VIAGGI.slice(0,5).map(t => <ViaggioRow key={t.id} t={t}/>)}
      </div>
    </div>
  );
}

function VeicoloCard({ v, onClick }) {
  const tot = v.kmAttuali - v.kmIniziali;
  const stati = {
    ok:           { label: 'OK', tone: 'ok' },
    tagliando:    { label: 'Tagliando in scadenza', tone: 'warn' },
    revisione:    { label: 'Revisione richiesta', tone: 'danger' },
  };
  return (
    <Card onClick={onClick} style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(20,23,28,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={proxColors.ink2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 16h14v-4l-2-5H7l-2 5v4z"/>
            <circle cx="8" cy="16" r="1.5"/>
            <circle cx="16" cy="16" r="1.5"/>
            <path d="M3 16h2M19 16h2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{v.modello}</div>
          <div className="prox-mono" style={{ fontSize: 11, color: proxColors.ink3 }}>{v.targa} · {v.annoImm}</div>
        </div>
        <Tag tone={stati[v.stato].tone} size="sm">{stati[v.stato].label}</Tag>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${proxColors.line2}`, paddingTop: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: proxColors.ink3 }}>Km attuali</div>
          <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v.kmAttuali.toLocaleString('de-CH')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: proxColors.ink3 }}>Prossima manutenzione</div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{new Date(v.manutenzione).toLocaleDateString('it-CH')}</div>
        </div>
      </div>
    </Card>
  );
}

function ViaggioRow({ t }) {
  const v = VEICOLI.find(x=>x.id===t.veicolo);
  const km = t.kmFine - t.kmInizio;
  const dt = new Date(t.data+'T00:00:00');
  const giorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  return (
    <Card style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 4, height: 36, borderRadius: 2, background: proxColors.accent }}/>
      <div className="prox-mono" style={{ width: 40, fontSize: 11, color: proxColors.ink3 }}>{giorni[dt.getDay()]} {dt.getDate()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.motivo}</div>
        <div style={{ fontSize: 11, color: proxColors.ink3 }}>{v?.targa} · {personaById(t.educatore)?.nome}</div>
      </div>
      <div className="prox-mono" style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+{km}</div>
        <div style={{ fontSize: 10, color: proxColors.ink3 }}>km</div>
      </div>
    </Card>
  );
}

// ---------- MOBILE: Log viaggio (semplice) ----------
function LogViaggio({ onClose, onSave }) {
  const [veicolo, setVeicolo] = React.useState('v1');
  const v = VEICOLI.find(x=>x.id===veicolo);
  const [kmInizio, setKmInizio] = React.useState(v.kmAttuali);
  const [kmFine, setKmFine] = React.useState(v.kmAttuali + 32);
  const km = kmFine - kmInizio;
  return (
    <div style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 14, color: proxColors.ink2, cursor: 'pointer', fontFamily: 'Inter' }}>Annulla</button>
        <div className="prox-display" style={{ fontSize: 16, fontWeight: 600 }}>Registra viaggio</div>
        <button onClick={onSave} style={{ background: 'transparent', border: 'none', fontSize: 14, color: proxColors.accent, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>Salva</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {/* km display */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div className="prox-display" style={{ fontSize: 64, fontWeight: 600, letterSpacing: -2, lineHeight: 1, color: proxColors.accent, fontVariantNumeric: 'tabular-nums' }}>{km}</div>
          <div style={{ fontSize: 12, color: proxColors.ink3, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>km percorsi</div>
        </div>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Veicolo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {VEICOLI.map(vh => {
            const sel = veicolo === vh.id;
            return (
              <button key={vh.id} onClick={()=>{ setVeicolo(vh.id); setKmInizio(vh.kmAttuali); setKmFine(vh.kmAttuali+32); }} style={{
                padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Inter',
                border: `1.5px solid ${sel ? proxColors.accent : proxColors.line2}`,
                background: sel ? proxColors.accentSoft : proxColors.surface,
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, border: `1.5px solid ${sel ? proxColors.accent : proxColors.line}`, background: sel ? proxColors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <div style={{ width: 5, height: 5, borderRadius: 3, background: '#fff' }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{vh.modello}</div>
                  <div className="prox-mono" style={{ fontSize: 11, color: proxColors.ink3 }}>{vh.targa} · {vh.kmAttuali.toLocaleString('de-CH')} km</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 6px' }}>Km inizio</div>
            <input type="number" value={kmInizio} onChange={e=>setKmInizio(parseInt(e.target.value||0))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${proxColors.line}`, fontFamily: 'ui-monospace,monospace', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}/>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 6px' }}>Km fine</div>
            <input type="number" value={kmFine} onChange={e=>setKmFine(parseInt(e.target.value||0))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${proxColors.line}`, fontFamily: 'ui-monospace,monospace', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}/>
          </div>
        </div>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>Motivo / scopo</div>
        <textarea defaultValue="Giro mattina · stazione + sottopasso" style={{ width: '100%', minHeight: 60, padding: 12, borderRadius: 10, border: `1px solid ${proxColors.line}`, background: proxColors.surface, fontSize: 13.5, fontFamily: 'Inter', resize: 'none', outline: 'none', boxSizing: 'border-box' }}/>
      </div>
    </div>
  );
}

// ---------- MOBILE: Obiettivi ----------
function ObiettiviList() {
  const stati = { in_corso: { label: 'in corso', color: proxColors.ink3 }, raggiunto: { label: 'raggiunto', color: proxColors.ok }, a_rischio: { label: 'a rischio', color: proxColors.danger } };
  const grouped = {
    a_rischio: OBIETTIVI.filter(o=>o.stato==='a_rischio'),
    in_corso:  OBIETTIVI.filter(o=>o.stato==='in_corso'),
    raggiunto: OBIETTIVI.filter(o=>o.stato==='raggiunto'),
  };
  return (
    <div style={{ padding: '0 16px 120px' }}>
      {/* riepilogo */}
      <Card style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, color: proxColors.ok }}>{grouped.raggiunto.length}</div>
            <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>raggiunti</div>
          </div>
          <div style={{ width: 1, background: proxColors.line, margin: '0 8px' }}/>
          <div>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>{grouped.in_corso.length}</div>
            <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>in corso</div>
          </div>
          <div style={{ width: 1, background: proxColors.line, margin: '0 8px' }}/>
          <div>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, color: proxColors.danger }}>{grouped.a_rischio.length}</div>
            <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>a rischio</div>
          </div>
        </div>
      </Card>

      {Object.entries(grouped).map(([k, items]) => items.length ? (
        <div key={k} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: stati[k].color, padding: '4px 4px 8px' }}>{stati[k].label} · {items.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(o => <ObiettivoCard key={o.id} o={o}/>)}
          </div>
        </div>
      ) : null)}
    </div>
  );
}

function ObiettivoCard({ o }) {
  const pct = Math.min(100, Math.round((o.attuale/o.target)*100));
  const colore = o.stato === 'raggiunto' ? proxColors.ok : o.stato === 'a_rischio' ? proxColors.danger : proxColors.accent;
  const dt = new Date(o.scadenza+'T00:00:00');
  const oggi = new Date('2026-04-28');
  const giorniRest = Math.ceil((dt - oggi)/(86400000));
  const responsabile = personaById(o.responsabile);
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>{o.titolo}</div>
          <div style={{ fontSize: 11.5, color: proxColors.ink3, lineHeight: 1.4 }}>{o.descrizione}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: colore, lineHeight: 1 }}>{pct}%</div>
        </div>
      </div>
      {/* progress bar */}
      <div style={{ height: 6, borderRadius: 3, background: proxColors.line2, overflow: 'hidden', marginTop: 10, marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: colore, borderRadius: 3 }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
        <span style={{ color: proxColors.ink2, fontWeight: 500 }}>
          <span className="prox-mono" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{o.attuale}</span>
          <span style={{ color: proxColors.ink3 }}>/{o.target}</span>
        </span>
        <span style={{ color: proxColors.ink3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Avatar nome={responsabile?.nome} size={16} ruolo="dipendente"/>
          {giorniRest > 0 ? `${giorniRest}gg` : 'oggi'}
        </span>
      </div>
    </Card>
  );
}

Object.assign(window, { SpeseList, NuovaSpesa, VeicoliList, LogViaggio, ObiettiviList });

// ---------- DESKTOP: Cruscotto rendicontazione completo ----------
function DesktopCruscotto() {
  const settimana = ['2026-04-20','2026-04-21','2026-04-22','2026-04-23','2026-04-24'];
  const settEventi = EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6');
  const totMin = settEventi.reduce((s,e)=>s+e.durataMin,0);
  const settSpese = SPESE.filter(s => settimana.includes(s.data));
  const totSpese = settSpese.reduce((s,x)=>s+x.importo,0);
  const settViaggi = VIAGGI.filter(t => settimana.includes(t.data));
  const totKm = settViaggi.reduce((s,t)=>s+(t.kmFine-t.kmInizio),0);

  return (
    <div className="prox" style={{ background: proxColors.bg, minHeight: '100%', color: proxColors.ink }}>
      {/* Topbar */}
      <div style={{
        padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: `1px solid ${proxColors.line}`, background: proxColors.surface,
      }}>
        <ProxiLogo size={26} color={proxColors.ink}/>
        <div style={{ width: 1, height: 22, background: proxColors.line }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrgLogo org="prometheus" size={22}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>Prometheus</div>
            <div style={{ fontSize: 10, color: proxColors.ink3 }}>Servizio di prossimità · Lugano</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Oggi','Persone','Luoghi','Eventi','Rendiconto','Spese','Veicoli','Obiettivi'].map((t,i) => (
            <button key={t} style={{
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
              background: i===4 ? proxColors.accentSoft : 'transparent',
              color: i===4 ? proxColors.accentInk : proxColors.ink2,
              fontSize: 13, fontWeight: i===4 ? 600 : 500,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Avatar nome="Giulia Mazza" ruolo="dipendente" size={32}/>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: proxColors.ink3, fontWeight: 500, marginBottom: 4 }}>Cruscotto rendicontazione</div>
            <div className="prox-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>Settimana 17 · 20–26 aprile</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button tone="ghost" size="md" icon="export">Esporta PDF</Button>
            <Button tone="primary" size="md" icon="check">Invia rapporto</Button>
          </div>
        </div>

        {/* 4 KPI affiancati */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
          <KPI label="Ore lavorate" value={`${Math.floor(totMin/60)}h ${String(totMin%60).padStart(2,'0')}'`} sub="su 38h contratto" accent="accent"/>
          <KPI label="Spese sostenute" value={`CHF ${totSpese.toFixed(2)}`} sub={`${settSpese.filter(s=>!s.rimborsata).length} da rimborsare`}/>
          <KPI label="Km veicoli" value={totKm} sub={`${settViaggi.length} viaggi · 2 mezzi`}/>
          <KPI label="Obiettivi" value={`${OBIETTIVI.filter(o=>o.stato==='raggiunto').length}/${OBIETTIVI.length}`} sub={`${OBIETTIVI.filter(o=>o.stato==='a_rischio').length} a rischio`}/>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
          {/* Spese per categoria */}
          <Card style={{ padding: 18 }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Spese · per categoria</div>
            <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 14 }}>Settimana corrente</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.entries(CATEGORIE_SPESA).map(([k,c]) => {
                const t = settSpese.filter(s=>s.categoria===k).reduce((s,x)=>s+x.importo,0);
                if (!t) return null;
                const pct = Math.round((t/totSpese)*100);
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: `oklch(0.62 0.12 ${c.hue})` }}/>
                      <span style={{ fontSize: 12, flex: 1 }}>{c.label}</span>
                      <span className="prox-mono" style={{ fontSize: 11.5, color: proxColors.ink2, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{t.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: proxColors.line2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `oklch(0.62 0.12 ${c.hue})`, borderRadius: 2 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Km per giorno */}
          <Card style={{ padding: 18 }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Km veicoli · per giorno</div>
            <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 14 }}>Lun → Ven</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 130, gap: 10, paddingBottom: 16, borderBottom: `1px solid ${proxColors.line2}` }}>
              {settimana.map(d => {
                const km = VIAGGI.filter(t=>t.data===d).reduce((s,t)=>s+(t.kmFine-t.kmInizio),0);
                const max = Math.max(...settimana.map(d=>VIAGGI.filter(t=>t.data===d).reduce((s,t)=>s+(t.kmFine-t.kmInizio),0)), 1);
                const h = Math.max(2, (km/max)*110);
                const dt = new Date(d+'T00:00:00'); const giorni = ['D','L','M','M','G','V','S'];
                return (
                  <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="prox-mono" style={{ fontSize: 10.5, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{km}</div>
                    <div style={{ width: '100%', height: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ width: '60%', height: h, background: proxColors.accent, borderRadius: 4 }}/>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{giorni[dt.getDay()]}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Obiettivi avanzamento */}
          <Card style={{ padding: 18 }}>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Obiettivi · avanzamento</div>
            <div style={{ fontSize: 11.5, color: proxColors.ink3, marginBottom: 14 }}>Mese in corso</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {OBIETTIVI.slice(0,4).map(o => {
                const pct = Math.min(100, Math.round((o.attuale/o.target)*100));
                const colore = o.stato === 'raggiunto' ? proxColors.ok : o.stato === 'a_rischio' ? proxColors.danger : proxColors.accent;
                return (
                  <div key={o.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, color: proxColors.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{o.titolo}</span>
                      <span className="prox-mono" style={{ fontSize: 11, fontWeight: 700, color: colore, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: proxColors.line2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colore, borderRadius: 2 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Tabella spese */}
        <Card style={{ padding: 0, marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${proxColors.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="prox-display" style={{ fontSize: 15, fontWeight: 600 }}>Spese · dettaglio</div>
              <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2 }}>{settSpese.length} voci · CHF {totSpese.toFixed(2)} totale</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button tone="ghost" size="sm" icon="filter">Filtra</Button>
              <Button tone="ghost" size="sm" icon="export">CSV</Button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
            <thead>
              <tr style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.6, color: proxColors.ink3, textAlign: 'left', fontWeight: 600 }}>
                <th style={{ padding: '10px 18px' }}>Data</th>
                <th style={{ padding: '10px 0' }}>Categoria</th>
                <th style={{ padding: '10px 0' }}>Descrizione</th>
                <th style={{ padding: '10px 0' }}>Persona</th>
                <th style={{ padding: '10px 0' }}>Metodo</th>
                <th style={{ padding: '10px 0' }}>Scontrino</th>
                <th style={{ padding: '10px 18px', textAlign: 'right' }}>Importo</th>
                <th style={{ padding: '10px 18px', textAlign: 'center' }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {settSpese.map(s => {
                const cat = CATEGORIE_SPESA[s.categoria];
                const dt = new Date(s.data+'T00:00:00');
                const persona = s.persone[0] ? personaById(s.persone[0]) : null;
                return (
                  <tr key={s.id} style={{ fontSize: 12.5, borderTop: `1px solid ${proxColors.line2}` }}>
                    <td style={{ padding: '10px 18px', color: proxColors.ink2 }}>{['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][dt.getDay()]} {dt.getDate()}/04</td>
                    <td style={{ padding: '10px 0' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: `oklch(0.62 0.12 ${cat.hue})` }}/>
                        {cat.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 0', color: proxColors.ink2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.descrizione}</td>
                    <td style={{ padding: '10px 0', color: proxColors.ink3, fontSize: 12 }}>{persona?.soprannome || persona?.nome || '—'}</td>
                    <td style={{ padding: '10px 0', color: proxColors.ink3, fontSize: 12 }}>{s.metodo}</td>
                    <td style={{ padding: '10px 0' }}>{s.scontrino ? <Tag tone="ok" size="sm">✓ foto</Tag> : <span style={{ color: proxColors.ink3, fontSize: 11 }}>—</span>}</td>
                    <td style={{ padding: '10px 18px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{s.importo.toFixed(2)}</td>
                    <td style={{ padding: '10px 18px', textAlign: 'center' }}>
                      {s.rimborsata ? <Tag tone="ok" size="sm">rimborsata</Tag> : <Tag tone="warn" size="sm">in attesa</Tag>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Veicoli + Obiettivi side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${proxColors.line2}` }}>
              <div className="prox-display" style={{ fontSize: 15, fontWeight: 600 }}>Veicoli · stato</div>
              <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2 }}>2 veicoli in dotazione</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VEICOLI.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: VEICOLI[0]===v ? 'none' : `1px solid ${proxColors.line2}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.modello}</div>
                    <div className="prox-mono" style={{ fontSize: 11, color: proxColors.ink3 }}>{v.targa}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="prox-mono" style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v.kmAttuali.toLocaleString('de-CH')}</div>
                    <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>km totali</div>
                  </div>
                  {v.stato === 'tagliando' && <Tag tone="warn" size="sm">tagliando</Tag>}
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${proxColors.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="prox-display" style={{ fontSize: 15, fontWeight: 600 }}>Obiettivi operativi</div>
                <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2 }}>{OBIETTIVI.length} obiettivi attivi</div>
              </div>
              <Button tone="ghost" size="sm" icon="plus">Nuovo</Button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {OBIETTIVI.map(o => {
                  const pct = Math.min(100, Math.round((o.attuale/o.target)*100));
                  const colore = o.stato === 'raggiunto' ? proxColors.ok : o.stato === 'a_rischio' ? proxColors.danger : proxColors.accent;
                  return (
                    <tr key={o.id} style={{ fontSize: 12.5, borderTop: `1px solid ${proxColors.line2}` }}>
                      <td style={{ padding: '10px 18px', maxWidth: 280 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titolo}</div>
                        <div style={{ fontSize: 10.5, color: proxColors.ink3, marginTop: 1 }}>scad. {new Date(o.scadenza).toLocaleDateString('it-CH')}</div>
                      </td>
                      <td style={{ padding: '10px 8px', width: 200 }}>
                        <div style={{ height: 4, borderRadius: 2, background: proxColors.line2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colore, borderRadius: 2 }}/>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontSize: 11.5, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>
                        {o.attuale}/{o.target}
                      </td>
                      <td style={{ padding: '10px 18px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: colore, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DesktopCruscotto });
