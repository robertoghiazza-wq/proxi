// screens-eventi.jsx — Lista eventi + form nuovo evento (rapido/dettagliato)

function EventiList({ onApriEvento, onNuovoEvento }) {
  const [filtro, setFiltro] = React.useState('tutti');
  const filtri = [
    { id: 'tutti', label: 'Tutti' },
    { id: 'completato', label: 'Chiusi' },
    { id: 'pianificato', label: 'Pianif.' },
    { id: 'in_corso', label: 'In corso' },
  ];
  const giorni = {};
  EVENTI.filter(e => filtro === 'tutti' || e.stato === filtro)
    .sort((a,b) => b.data.localeCompare(a.data) || b.oraInizio.localeCompare(a.oraInizio))
    .forEach(e => { (giorni[e.data] = giorni[e.data] || []).push(e); });

  const dateLabel = (d) => {
    const giorni = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    const mesi = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    const dt = new Date(d+'T00:00:00');
    if (d === '2026-04-24') return 'Oggi · Ven 24 apr';
    if (d === '2026-04-23') return 'Ieri · Gio 23 apr';
    return `${giorni[dt.getDay()]} ${dt.getDate()} ${mesi[dt.getMonth()]}`;
  };

  return (
    <div style={{ padding: '0 0 120px' }}>
      <div style={{ display: 'flex', gap: 6, padding: '4px 16px 12px', overflowX: 'auto' }}>
        {filtri.map(f => (
          <button key={f.id} onClick={()=>setFiltro(f.id)} style={{
            padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: filtro===f.id ? proxColors.ink : 'rgba(26,22,19,0.05)',
            color: filtro===f.id ? proxColors.bg : proxColors.ink2,
            fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'Inter',
          }}>{f.label}</button>
        ))}
      </div>
      {Object.entries(giorni).map(([d, items]) => (
        <div key={d} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '4px 20px 8px' }}>
            {dateLabel(d)} · {items.reduce((s,e)=>s+e.durataMin,0)} min
          </div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(e => <EventoRow key={e.id} e={e} onClick={()=>onApriEvento && onApriEvento(e.id)}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventoRow({ e, onClick }) {
  const luogo = luogoById(e.luogo);
  const tipo = TIPO_EVENTO[e.tipo];
  const persone = e.personeIds.map(personaById).filter(Boolean);
  return (
    <Card onClick={onClick} style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{
        width: 4, height: 40, borderRadius: 2,
        background: `oklch(0.62 0.14 ${tipo?.hue})`,
      }}/>
      <div className="prox-mono" style={{ width: 42, fontSize: 11.5, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>
        <div>{e.oraInizio}</div>
        <div style={{ fontSize: 10 }}>{e.durataMin}m</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>
          {persone.length ? persone.map(p => p.soprannome || p.nome).join(', ') : tipo?.label}
        </div>
        <div style={{ fontSize: 11, color: proxColors.ink3, display: 'flex', gap: 5, alignItems: 'center' }}>
          <span>{tipo?.label}</span>
          {luogo && <><span>·</span><span>{luogo.nome}</span></>}
        </div>
      </div>
      {e.stato === 'in_corso' && <Tag tone="accent" size="sm">live</Tag>}
      {e.stato === 'completato' && <Icon name="check" size={14} color={proxColors.ok}/>}
    </Card>
  );
}

// — Form rapido (variante A): 1 schermata, flussi minimi
function NuovoEventoRapido({ onClose, onSave }) {
  const [tipo, setTipo] = React.useState('incontro');
  const [persone, setPersone] = React.useState(['p1']);
  const [luogo, setLuogo] = React.useState('l1');
  const [durata, setDurata] = React.useState(30);
  const [note, setNote] = React.useState('');
  const tipiRapidi = ['incontro','accompagnamento','colloquio','emergenza','spostamento','gruppo'];
  return (
    <div style={{ padding: '0 0 40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 14, color: proxColors.ink2, cursor: 'pointer', fontFamily: 'Inter' }}>Annulla</button>
        <div className="prox-display" style={{ fontSize: 16, fontWeight: 600 }}>Nuovo evento · rapido</div>
        <button onClick={onSave} style={{ background: 'transparent', border: 'none', fontSize: 14, color: proxColors.accent, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>Salva</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {/* Tipo — grid di icone grandi */}
        <FormLabel>Che cosa?</FormLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          {tipiRapidi.map(t => {
            const info = TIPO_EVENTO[t];
            const sel = tipo === t;
            return (
              <button key={t} onClick={()=>setTipo(t)} style={{
                padding: '14px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Inter',
                border: `1.5px solid ${sel ? `oklch(0.62 0.14 ${info.hue})` : proxColors.line}`,
                background: sel ? `oklch(0.96 0.04 ${info.hue})` : proxColors.surface,
                color: sel ? `oklch(0.35 0.12 ${info.hue})` : proxColors.ink2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: `oklch(0.62 0.14 ${info.hue})` }}/>
                <span style={{ fontSize: 12, fontWeight: sel ? 600 : 500 }}>{info.label}</span>
              </button>
            );
          })}
        </div>

        {/* Durata — chips */}
        <FormLabel>Durata</FormLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[15,30,45,60,90].map(d => (
            <button key={d} onClick={()=>setDurata(d)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${durata===d ? proxColors.accent : proxColors.line}`,
              background: durata===d ? proxColors.accentSoft : proxColors.surface, color: durata===d ? proxColors.accentInk : proxColors.ink2,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
            }}>{d}m</button>
          ))}
        </div>

        {/* Persone — chip selector */}
        <FormLabel>Con chi?</FormLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {PERSONE.filter(p=>p.ruolo==='utente').slice(0,5).map(p => {
            const sel = persone.includes(p.id);
            return (
              <button key={p.id} onClick={()=>setPersone(sel ? persone.filter(x=>x!==p.id) : [...persone, p.id])} style={{
                padding: '6px 10px 6px 6px', borderRadius: 999, border: `1px solid ${sel ? proxColors.accent : proxColors.line}`,
                background: sel ? proxColors.accentSoft : proxColors.surface,
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Inter',
              }}>
                <Avatar nome={p.nome} soprannome={p.soprannome} anonimo={p.anonimo} ruolo={p.ruolo} size={24}/>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: sel ? proxColors.accentInk : proxColors.ink2 }}>{p.soprannome || p.nome}</span>
              </button>
            );
          })}
          <button style={{
            padding: '6px 12px', borderRadius: 999, border: `1px dashed ${proxColors.line}`,
            background: 'transparent', fontSize: 12.5, color: proxColors.ink3, cursor: 'pointer', fontFamily: 'Inter',
          }}>+ altre</button>
        </div>

        {/* Luogo — dropdown-like row */}
        <FormLabel>Dove?</FormLabel>
        <Card style={{ padding: 0, marginBottom: 16 }}>
          {LUOGHI.slice(0,3).map((l,i) => {
            const sel = luogo === l.id;
            return (
              <button key={l.id} onClick={()=>setLuogo(l.id)} style={{
                width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderTop: i > 0 ? `1px solid ${proxColors.line2}` : 'none',
                display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter', textAlign: 'left',
              }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, border: `1.5px solid ${sel ? proxColors.accent : proxColors.line}`, background: sel ? proxColors.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#fff' }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{l.nome}</div>
                  <div style={{ fontSize: 11, color: proxColors.ink3 }}>{l.indirizzo}</div>
                </div>
              </button>
            );
          })}
        </Card>

        {/* Note veloci */}
        <FormLabel>Note <span style={{ color: proxColors.ink3, fontWeight: 400 }}>(opz.)</span></FormLabel>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Due parole su come è andata…" style={{
          width: '100%', minHeight: 64, padding: 12, borderRadius: 10, border: `1px solid ${proxColors.line}`,
          background: proxColors.surface, fontSize: 13.5, fontFamily: 'Inter', resize: 'none', outline: 'none',
          boxSizing: 'border-box',
        }}/>
      </div>
    </div>
  );
}

// — Form dettagliato (variante B): step guidati, più controllo
function NuovoEventoDettagliato({ onClose, onSave }) {
  const [step, setStep] = React.useState(1);
  const [tipo, setTipo] = React.useState('incontro');
  const [data, setData] = React.useState('2026-04-24');
  const [oraInizio, setOraInizio] = React.useState('14:00');
  const [durata, setDurata] = React.useState(45);
  const [persone, setPersone] = React.useState([]);
  const [luogo, setLuogo] = React.useState(null);
  const [note, setNote] = React.useState('');

  return (
    <div style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}>
          <Icon name="close" size={20} color={proxColors.ink2}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="prox-display" style={{ fontSize: 16, fontWeight: 600 }}>Nuovo evento · dettagliato</div>
          <div style={{ fontSize: 11, color: proxColors.ink3 }}>Passo {step} di 4</div>
        </div>
      </div>
      {/* progress */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 4 }}>
        {[1,2,3,4].map(n => (
          <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n<=step ? proxColors.accent : proxColors.line }}/>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px' }}>
        {step === 1 && <>
          <FormLabel>Tipologia di intervento</FormLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(TIPO_EVENTO).map(([k, info]) => {
              const sel = tipo === k;
              return (
                <button key={k} onClick={()=>setTipo(k)} style={{
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Inter',
                  border: `1.5px solid ${sel ? `oklch(0.62 0.14 ${info.hue})` : proxColors.line2}`,
                  background: sel ? `oklch(0.97 0.03 ${info.hue})` : proxColors.surface,
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: `oklch(0.62 0.14 ${info.hue})` }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sel ? `oklch(0.3 0.1 ${info.hue})` : proxColors.ink }}>{info.label}</div>
                  </div>
                  {sel && <Icon name="check" size={16} color={`oklch(0.5 0.14 ${info.hue})`}/>}
                </button>
              );
            })}
          </div>
        </>}

        {step === 2 && <>
          <FormLabel>Data e orario</FormLabel>
          <Card style={{ padding: 0, marginBottom: 12 }}>
            <FormRow label="Data" value={<span className="prox-mono">24 aprile 2026</span>}/>
            <FormRow label="Inizio" value={<span className="prox-mono">{oraInizio}</span>} divider/>
            <FormRow label="Durata" value={<span className="prox-mono">{durata} min</span>} divider/>
          </Card>
          <FormLabel>Durata</FormLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {[15,30,45,60,90,120].map(d => (
              <button key={d} onClick={()=>setDurata(d)} style={{
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${durata===d ? proxColors.accent : proxColors.line}`,
                background: durata===d ? proxColors.accentSoft : proxColors.surface,
                color: durata===d ? proxColors.accentInk : proxColors.ink2,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
              }}>{d}m</button>
            ))}
          </div>
        </>}

        {step === 3 && <>
          <FormLabel>Persone coinvolte <span style={{ color: proxColors.ink3, fontWeight: 400 }}>· {persone.length} selez.</span></FormLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PERSONE.filter(p=>p.ruolo==='utente').map(p => {
              const sel = persone.includes(p.id);
              return (
                <button key={p.id} onClick={()=>setPersone(sel ? persone.filter(x=>x!==p.id) : [...persone, p.id])}
                  style={{
                    padding: '8px 10px', borderRadius: 10,
                    border: `1px solid ${sel ? proxColors.accent : 'transparent'}`,
                    background: sel ? proxColors.accentSoft : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'Inter', textAlign: 'left',
                  }}>
                  <Avatar nome={p.nome} soprannome={p.soprannome} anonimo={p.anonimo} ruolo={p.ruolo} size={34}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.soprannome || p.nome}</div>
                    <div style={{ fontSize: 11, color: proxColors.ink3 }}>{p.tag.slice(0,2).join(' · ')}</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${sel ? proxColors.accent : proxColors.line}`, background: sel ? proxColors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <Icon name="check" size={12} color="#fff" strokeWidth={2.5}/>}
                  </div>
                </button>
              );
            })}
          </div>
        </>}

        {step === 4 && <>
          <FormLabel>Luogo</FormLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            {LUOGHI.slice(0,5).map(l => {
              const sel = luogo === l.id;
              return (
                <button key={l.id} onClick={()=>setLuogo(l.id)} style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: `1px solid ${sel ? proxColors.accent : 'transparent'}`,
                  background: sel ? proxColors.accentSoft : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'Inter', textAlign: 'left',
                }}>
                  <Icon name="pin" size={16} color={sel ? proxColors.accent : proxColors.ink3}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{l.nome}</div>
                    <div style={{ fontSize: 11, color: proxColors.ink3 }}>{l.indirizzo}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <FormLabel>Note di rendicontazione</FormLabel>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Cosa è successo, esiti, osservazioni…"
            style={{
              width: '100%', minHeight: 100, padding: 12, borderRadius: 10,
              border: `1px solid ${proxColors.line}`, background: proxColors.surface,
              fontSize: 13.5, fontFamily: 'Inter', resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}/>
        </>}
      </div>

      {/* footer */}
      <div style={{ padding: '10px 16px 20px', display: 'flex', gap: 8, borderTop: `1px solid ${proxColors.line2}`, background: proxColors.bg }}>
        {step > 1 && <Button tone="ghost" size="md" onClick={()=>setStep(step-1)}>Indietro</Button>}
        {step < 4 && <Button tone="primary" size="md" full onClick={()=>setStep(step+1)}>Continua</Button>}
        {step === 4 && <Button tone="primary" size="md" full icon="check" onClick={onSave}>Salva evento</Button>}
      </div>
    </div>
  );
}

function FormLabel({ children }) {
  return <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, margin: '8px 2px 8px' }}>{children}</div>;
}

function FormRow({ label, value, divider }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 14px',
      borderTop: divider ? `1px solid ${proxColors.line2}` : 'none',
    }}>
      <div style={{ flex: 1, fontSize: 13.5 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: proxColors.ink2 }}>{value}</div>
      <Icon name="chevron" size={14} color={proxColors.ink3} style={{ marginLeft: 8 }}/>
    </div>
  );
}

Object.assign(window, { EventiList, NuovoEventoRapido, NuovoEventoDettagliato });
