// screens-luoghi.jsx — Luoghi + mappa + scheda dettaglio

function LuoghiList({ onApriLuogo }) {
  const [q, setQ] = React.useState('');
  const [vista, setVista] = React.useState('lista');
  const filtered = LUOGHI.filter(l => {
    if (!q) return true;
    const s = q.toLowerCase();
    return l.nome.toLowerCase().includes(s) || l.indirizzo.toLowerCase().includes(s);
  });
  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* toggle vista */}
      <div style={{ padding: '4px 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', flex: 1,
          borderRadius: 10, background: 'rgba(26,22,19,0.05)',
        }}>
          <Icon name="search" size={16} color={proxColors.ink3}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca luogo, indirizzo…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'Inter' }}/>
        </div>
        <div style={{ display: 'flex', background: 'rgba(26,22,19,0.05)', borderRadius: 8, padding: 2 }}>
          {['lista','mappa'].map(v => (
            <button key={v} onClick={()=>setVista(v)} style={{
              padding: '6px 10px', borderRadius: 6, border: 'none',
              background: vista===v ? proxColors.surface : 'transparent',
              color: vista===v ? proxColors.ink : proxColors.ink3,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter',
              boxShadow: vista===v ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>
              <Icon name={v==='lista'?'list':'map'} size={14}/>
            </button>
          ))}
        </div>
      </div>

      {vista === 'mappa' && (
        <div style={{ padding: '0 16px 16px' }}>
          <MapPlaceholder height={240} pins={[
            { id: 'l1', x: 30, y: 55, label: '12' },
            { id: 'l3', x: 18, y: 72, label: '7' },
            { id: 'l4', x: 58, y: 38, label: '60' },
            { id: 'l5', x: 72, y: 58, label: '0' },
            { id: 'l6', x: 82, y: 28, label: '25' },
            { id: 'l8', x: 50, y: 80, label: '8' },
          ]} active="l1"/>
          <div style={{ fontSize: 11, color: proxColors.ink3, marginTop: 8, textAlign: 'center' }}>
            {LUOGHI.length} luoghi · toc su un pin per aprirlo
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(l => <LuogoRow key={l.id} l={l} onClick={()=>onApriLuogo && onApriLuogo(l.id)}/>)}
      </div>
    </div>
  );
}

function LuogoRow({ l, onClick }) {
  const tipo = TIPO_LUOGO[l.tipo];
  const hue = l.tipo === 'strada' ? 45 : l.tipo === 'informale' ? 25 : l.tipo === 'diurno' ? 150 : l.tipo === 'sanitario' ? 200 : 280;
  return (
    <Card onClick={onClick} style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: `oklch(0.94 0.05 ${hue})`,
        color: `oklch(0.4 0.12 ${hue})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="pin" size={22}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{l.nome}</div>
        <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>{tipo?.label}</span>
          <span>·</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.indirizzo}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{l.persone}</div>
        <div style={{ fontSize: 10, color: proxColors.ink3 }}>pers./sett.</div>
      </div>
    </Card>
  );
}

function LuogoDetail({ luogoId, onBack, onApriEvento }) {
  const l = luogoById(luogoId) || LUOGHI[0];
  const eventiQui = EVENTI.filter(e => e.luogo === l.id).sort((a,b)=>b.data.localeCompare(a.data));
  const tipo = TIPO_LUOGO[l.tipo];
  return (
    <div style={{ padding: '0 0 120px' }}>
      <MapPlaceholder height={160} pins={[{ id: l.id, x: 50, y: 55, label: '●' }]} active={l.id}/>
      <div style={{ padding: '16px 16px 8px' }}>
        <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>{l.nome}</div>
        <div style={{ fontSize: 13, color: proxColors.ink3, marginTop: 4, display: 'flex', gap: 6 }}>
          <Tag size="sm">{tipo?.label}</Tag>
          <span>· {l.indirizzo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: proxColors.ink2 }}>
          <Icon name="clock" size={14} color={proxColors.ink3}/>
          <span>{l.orari}</span>
        </div>
      </div>

      <div style={{ padding: '4px 16px 8px', display: 'flex', gap: 8 }}>
        <Button tone="primary" size="sm" icon="plus" full>Nuovo evento qui</Button>
        <Button tone="ghost" size="sm" icon="map" style={{ aspectRatio: 1, padding: 0, width: 40 }}>{''}</Button>
      </div>

      {/* stats */}
      <Section title="Statistiche · ultimi 30 giorni">
        <Card style={{ padding: 14, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>{l.persone}</div>
            <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>persone</div>
          </div>
          <div style={{ width: 1, background: proxColors.line, margin: '0 8px' }}/>
          <div>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>{l.eventiSett}</div>
            <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>eventi/sett</div>
          </div>
          <div style={{ width: 1, background: proxColors.line, margin: '0 8px' }}/>
          <div>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>{eventiQui.length}</div>
            <div style={{ fontSize: 10.5, color: proxColors.ink3 }}>totali</div>
          </div>
        </Card>
      </Section>

      {l.note && (
        <Section title="Note">
          <Card style={{ padding: 12, fontSize: 13.5, lineHeight: 1.45, color: proxColors.ink2 }}>{l.note}</Card>
        </Section>
      )}

      <Section title="Eventi recenti">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eventiQui.slice(0,5).map(e => (
            <Card key={e.id} onClick={() => onApriEvento && onApriEvento(e.id)} style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <EventTypeDot tipo={e.tipo}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{TIPO_EVENTO[e.tipo]?.label}</div>
                <div style={{ fontSize: 11, color: proxColors.ink3 }}>{e.data} · {e.oraInizio} · {e.personeIds.length} pers.</div>
              </div>
              <span style={{ fontSize: 11, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{e.durataMin}m</span>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}

Object.assign(window, { LuoghiList, LuogoDetail });
