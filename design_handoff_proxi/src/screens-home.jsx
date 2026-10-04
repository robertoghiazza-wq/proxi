// screens-home.jsx — Home/Dashboard (3 varianti: lista/azioni/timeline)

function minToHM(m) { const h = Math.floor(m/60); const r = m%60; return `${h}h ${String(r).padStart(2,'0')}m`; }

function fmtOra(s) { return s; }

function greetingFor(nome) {
  const h = new Date().getHours();
  const base = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  return `${base}, ${nome}`;
}

// Variante 1 · Lista: giornata come lista cronologica densa
function HomeLista({ onNuovoEvento, onApriEvento, accent }) {
  const oggi = eventiDelGiorno('2026-04-24');
  const minuti = minutiLavoratiOggi('2026-04-24');
  const nomeUtente = 'Giulia';
  return (
    <div style={{ padding: '0 16px 120px' }}>
      <div style={{ padding: '8px 2px 16px' }}>
        <div style={{ fontSize: 13, color: proxColors.ink3, fontWeight: 500 }}>Venerdì 24 aprile</div>
        <div className="prox-display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>{greetingFor(nomeUtente)}</div>
      </div>

      {/* strip ore + eventi */}
      <Card style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: proxColors.ink3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Oggi</div>
            <div className="prox-display" style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>{minToHM(minuti)}</div>
          </div>
          <div style={{ display: 'flex', gap: 18, textAlign: 'right' }}>
            <div><div style={{ fontSize: 18, fontWeight: 600 }}>{oggi.filter(e=>e.stato==='completato').length}</div><div style={{ fontSize: 10.5, color: proxColors.ink3 }}>chiusi</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 600 }}>{oggi.filter(e=>e.stato==='pianificato'||e.stato==='in_corso').length}</div><div style={{ fontSize: 10.5, color: proxColors.ink3 }}>aperti</div></div>
          </div>
        </div>
      </Card>

      {/* lista eventi */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 2px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: proxColors.ink2, textTransform: 'uppercase', letterSpacing: 0.6 }}>Giornata</div>
        <span style={{ fontSize: 12, color: proxColors.ink3 }}>{oggi.length} eventi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {oggi.map((e) => <EventRowLista key={e.id} e={e} onClick={() => onApriEvento && onApriEvento(e.id)}/>)}
      </div>
    </div>
  );
}

function EventRowLista({ e, onClick }) {
  const luogo = luogoById(e.luogo);
  const tipo = TIPO_EVENTO[e.tipo];
  const persone = e.personeIds.map(personaById).filter(Boolean);
  const isLive = e.stato === 'in_corso';
  const isDone = e.stato === 'completato';
  return (
    <Card onClick={onClick} style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
      <div style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Inter Tight', letterSpacing: -0.3, color: isDone ? proxColors.ink3 : proxColors.ink }}>{fmtOra(e.oraInizio)}</div>
        <div style={{ fontSize: 10.5, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{e.durataMin}m</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: proxColors.line, marginTop: 2, marginBottom: 2 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <EventTypeDot tipo={e.tipo}/>
          <span style={{ fontSize: 11.5, color: proxColors.ink3, fontWeight: 500 }}>{tipo?.label}</span>
          {isLive && <Tag tone="accent" size="sm">in corso</Tag>}
          {isDone && <Icon name="check" size={12} color={proxColors.ok}/>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, textDecoration: isDone ? 'none' : 'none', color: proxColors.ink, lineHeight: 1.3 }}>
          {persone.length ? persone.map(p => p.soprannome || p.nome).join(', ') : (tipo?.label || 'Evento')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: proxColors.ink3 }}>
          {luogo && <><Icon name="pin" size={11} color={proxColors.ink3}/><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{luogo.nome}</span></>}
          {!luogo && <span style={{ fontStyle: 'italic' }}>nessun luogo</span>}
        </div>
      </div>
    </Card>
  );
}

// Variante 2 · Azioni rapide: grid di azioni grandi, poi prossimo evento
function HomeAzioni({ onNuovoEvento, onApriEvento, accent }) {
  const oggi = eventiDelGiorno('2026-04-24');
  const prossimo = oggi.find(e => e.stato === 'in_corso') || oggi.find(e => e.stato === 'pianificato');
  const nomeUtente = 'Giulia';
  return (
    <div style={{ padding: '4px 16px 120px' }}>
      <div style={{ padding: '8px 2px 18px' }}>
        <div style={{ fontSize: 13, color: proxColors.ink3, fontWeight: 500 }}>Venerdì 24 aprile · Ven</div>
        <div className="prox-display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>Ciao {nomeUtente}</div>
      </div>

      {/* 2x2 azioni */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <QuickAction icon="plus" label="Nuovo evento" sub="registra ora" primary onClick={onNuovoEvento}/>
        <QuickAction icon="person" label="Nuova persona" sub="anagrafica" />
        <QuickAction icon="pin" label="Nuovo luogo" sub="georeferenzia" />
        <QuickAction icon="search" label="Cerca" sub="tutto il DB" />
      </div>

      {/* prossimo */}
      {prossimo && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: proxColors.ink2, textTransform: 'uppercase', letterSpacing: 0.6, margin: '14px 2px 10px' }}>
            {prossimo.stato === 'in_corso' ? 'In corso' : 'Prossimo'}
          </div>
          <NextEventCard e={prossimo} onClick={() => onApriEvento && onApriEvento(prossimo.id)}/>
        </>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: proxColors.ink2, textTransform: 'uppercase', letterSpacing: 0.6, margin: '22px 2px 10px' }}>Giornata</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {oggi.slice(0,3).map(e => (
          <div key={e.id} onClick={() => onApriEvento && onApriEvento(e.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer', borderRadius: 10 }}>
            <div className="prox-mono" style={{ fontSize: 12, color: proxColors.ink3, width: 42, fontVariantNumeric: 'tabular-nums' }}>{e.oraInizio}</div>
            <EventTypeDot tipo={e.tipo}/>
            <div style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.personeIds.length ? e.personeIds.map(id => personaById(id)?.soprannome || personaById(id)?.nome).filter(Boolean).join(', ') : TIPO_EVENTO[e.tipo]?.label}
            </div>
            <Icon name="chevron" size={14} color={proxColors.ink3}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, sub, onClick, primary }) {
  return (
    <button onClick={onClick} className="prox-ripple" style={{
      aspectRatio: '1 / 0.78', borderRadius: 16, border: `1px solid ${proxColors.line}`,
      background: primary ? proxColors.accent : proxColors.surface,
      color: primary ? '#fff' : proxColors.ink, cursor: 'pointer',
      padding: '14px 14px 12px', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'left',
      fontFamily: 'Inter',
      boxShadow: primary ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.03)',
    }}>
      <Icon name={icon} size={22} strokeWidth={primary ? 2 : 1.75}/>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2 }}>{label}</div>
        <div style={{ fontSize: 11.5, opacity: primary ? 0.85 : 0.6, marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

function NextEventCard({ e, onClick }) {
  const luogo = luogoById(e.luogo);
  const tipo = TIPO_EVENTO[e.tipo];
  const persone = e.personeIds.map(personaById).filter(Boolean);
  const live = e.stato === 'in_corso';
  return (
    <Card onClick={onClick} style={{ padding: 14, background: live ? proxColors.accentSoft : proxColors.surface, border: live ? `1px solid ${proxColors.accent}` : `1px solid ${proxColors.line2}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <EventTypeDot tipo={e.tipo}/>
        <span style={{ fontSize: 12, fontWeight: 600, color: proxColors.ink2 }}>{tipo?.label}</span>
        <div style={{ flex: 1 }}/>
        <span className="prox-mono" style={{ fontSize: 13, color: proxColors.ink2, fontWeight: 500 }}>{e.oraInizio} · {e.durataMin}m</span>
      </div>
      <div className="prox-display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3, marginBottom: 6 }}>
        {persone.length ? persone.map(p => p.soprannome || p.nome).join(', ') : tipo?.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: proxColors.ink2, marginBottom: 12 }}>
        {luogo && <><Icon name="pin" size={13} color={proxColors.ink3}/><span>{luogo.nome}</span></>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {live ? <Button size="sm" icon="stop" tone="primary">Concludi</Button> : <Button size="sm" icon="play" tone="primary">Avvia</Button>}
        <Button size="sm" tone="ghost" icon="edit">Dettagli</Button>
      </div>
    </Card>
  );
}

// Variante 3 · Timeline: verticale con linea
function HomeTimeline({ onNuovoEvento, onApriEvento, accent }) {
  const oggi = eventiDelGiorno('2026-04-24');
  const minuti = minutiLavoratiOggi('2026-04-24');
  const nomeUtente = 'Giulia';
  return (
    <div style={{ padding: '4px 16px 120px' }}>
      <div style={{ padding: '8px 2px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: proxColors.ink3, fontWeight: 500 }}>Venerdì 24 aprile</div>
          <div className="prox-display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>{greetingFor(nomeUtente)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="prox-display" style={{ fontSize: 18, fontWeight: 600 }}>{minToHM(minuti)}</div>
          <div style={{ fontSize: 11, color: proxColors.ink3 }}>lavorate</div>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 60 }}>
        <div style={{ position: 'absolute', left: 52, top: 8, bottom: 8, width: 1.5, background: proxColors.line }}/>
        {oggi.map((e, i) => <TimelineItem key={e.id} e={e} onClick={() => onApriEvento && onApriEvento(e.id)}/>)}
      </div>
    </div>
  );
}

function TimelineItem({ e, onClick }) {
  const tipo = TIPO_EVENTO[e.tipo];
  const luogo = luogoById(e.luogo);
  const persone = e.personeIds.map(personaById).filter(Boolean);
  const isLive = e.stato === 'in_corso';
  const isDone = e.stato === 'completato';
  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      <div className="prox-mono" style={{ position: 'absolute', left: -60, top: 8, width: 42, fontSize: 11.5, color: proxColors.ink3, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{e.oraInizio}</div>
      <div style={{
        position: 'absolute', left: -14, top: 10,
        width: 14, height: 14, borderRadius: 7, background: isLive ? proxColors.accent : proxColors.bg,
        border: `2px solid ${isLive ? proxColors.accent : (isDone ? `oklch(0.62 0.14 ${tipo?.hue})` : proxColors.ink3)}`,
        boxShadow: `0 0 0 3px ${proxColors.bg}`,
      }}/>
      <Card onClick={onClick} style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <EventTypeDot tipo={e.tipo}/>
          <span style={{ fontSize: 11, color: proxColors.ink3, fontWeight: 500 }}>{tipo?.label} · {e.durataMin}m</span>
          {isLive && <Tag tone="accent" size="sm">in corso</Tag>}
          {isDone && <Tag tone="ok" size="sm">✓</Tag>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
          {persone.length ? persone.map(p => p.soprannome || p.nome).join(', ') : tipo?.label}
        </div>
        {luogo && <div style={{ fontSize: 12, color: proxColors.ink3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="pin" size={11} color={proxColors.ink3}/>{luogo.nome}
        </div>}
      </Card>
    </div>
  );
}

function FAB({ onClick, icon = 'plus' }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', right: 20, bottom: 100, zIndex: 45,
      width: 56, height: 56, borderRadius: 28, border: 'none',
      background: proxColors.accent, color: '#fff',
      boxShadow: '0 6px 24px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>
      <Icon name={icon} size={24} strokeWidth={2.25}/>
    </button>
  );
}

Object.assign(window, { HomeLista, HomeAzioni, HomeTimeline, FAB });
