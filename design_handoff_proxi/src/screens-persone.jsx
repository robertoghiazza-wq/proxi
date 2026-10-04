// screens-persone.jsx — Anagrafica Persone + scheda dettaglio

function PersoneList({ onApriPersona, accent }) {
  const [q, setQ] = React.useState('');
  const [ruolo, setRuolo] = React.useState('tutti');
  const ruoli = [
    { id: 'tutti',     label: 'Tutti',     count: PERSONE.length },
    { id: 'utente',    label: 'Utenti',    count: PERSONE.filter(p=>p.ruolo==='utente').length },
    { id: 'dipendente',label: 'Équipe',    count: PERSONE.filter(p=>p.ruolo==='dipendente').length },
    { id: 'rete',      label: 'Rete',      count: PERSONE.filter(p=>p.ruolo==='rete').length },
  ];
  const filtered = PERSONE.filter(p => {
    if (ruolo !== 'tutti' && p.ruolo !== ruolo) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (p.nome||'').toLowerCase().includes(s) ||
           (p.soprannome||'').toLowerCase().includes(s) ||
           p.tag.some(t=>t.toLowerCase().includes(s));
  });
  // group by ruolo when 'tutti'
  const groups = ruolo === 'tutti'
    ? [
        { id: 'utente', label: 'Utenti', items: filtered.filter(p=>p.ruolo==='utente') },
        { id: 'dipendente', label: 'Équipe Prometheus', items: filtered.filter(p=>p.ruolo==='dipendente') },
        { id: 'rete', label: 'Rete di contatti', items: filtered.filter(p=>p.ruolo==='rete') },
      ]
    : [{ id: ruolo, label: ruoli.find(r=>r.id===ruolo)?.label, items: filtered }];

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* search */}
      <div style={{ padding: '4px 16px 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          borderRadius: 10, background: 'rgba(26,22,19,0.05)',
        }}>
          <Icon name="search" size={16} color={proxColors.ink3}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca nome, soprannome, tag…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'Inter' }}/>
        </div>
      </div>
      {/* chips ruolo */}
      <div style={{ display: 'flex', gap: 6, padding: '2px 16px 12px', overflowX: 'auto' }}>
        {ruoli.map(r => (
          <button key={r.id} onClick={()=>setRuolo(r.id)} style={{
            padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: ruolo===r.id ? proxColors.ink : 'rgba(26,22,19,0.05)',
            color: ruolo===r.id ? proxColors.bg : proxColors.ink2,
            fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'Inter',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            {r.label}
            <span style={{ opacity: 0.6, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{r.count}</span>
          </button>
        ))}
      </div>

      {groups.map(g => g.items.length ? (
        <div key={g.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '4px 20px 8px' }}>
            {g.label} · {g.items.length}
          </div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {g.items.map(p => <PersonaRow key={p.id} p={p} onClick={()=>onApriPersona && onApriPersona(p.id)}/>)}
          </div>
        </div>
      ) : null)}
    </div>
  );
}

function PersonaRow({ p, onClick }) {
  const vulnerable = p.tag.some(t => /minore|senza fissa|dipendenza|emergenza/i.test(t));
  return (
    <Card onClick={onClick} style={{ padding: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar nome={p.nome} soprannome={p.soprannome} anonimo={p.anonimo && p.ruolo==='utente'} ruolo={p.ruolo} size={42}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2 }}>
            {p.soprannome ? `"${p.soprannome}"` : p.nome}
          </span>
          {p.soprannome && p.nome && p.nome !== '—' && <span style={{ fontSize: 12, color: proxColors.ink3 }}>· {p.nome}</span>}
          {vulnerable && p.ruolo==='utente' && <Icon name="warn" size={13} color={proxColors.warn}/>}
        </div>
        <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {p.eta && <span>{p.eta} a.</span>}
          {p.lingue.length > 0 && <span>· {p.lingue.join('/')}</span>}
          {p.tag.slice(0,2).map(t => <Tag key={t} tone={p.ruolo==='utente' ? 'neutral' : 'outline'} size="sm">{t}</Tag>)}
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.eventi}</span>
        <span style={{ fontSize: 10, color: proxColors.ink3 }}>eventi</span>
      </div>
    </Card>
  );
}

function PersonaDetail({ personaId, onBack, onApriEvento }) {
  const p = personaById(personaId) || PERSONE[0];
  const eventiPersona = EVENTI.filter(e => e.personeIds.includes(p.id)).sort((a,b)=>b.data.localeCompare(a.data) || b.oraInizio.localeCompare(a.oraInizio));
  const rete = p.ruolo === 'utente' ? PERSONE.filter(x => x.ruolo === 'rete').slice(0,2) : [];

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* hero */}
      <div style={{ padding: '8px 16px 16px', background: `linear-gradient(180deg, ${proxColors.accentSoft} 0%, ${proxColors.bg} 100%)` }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar nome={p.nome} soprannome={p.soprannome} anonimo={p.anonimo && p.ruolo==='utente'} ruolo={p.ruolo} size={64}/>
          <div style={{ flex: 1 }}>
            <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.15 }}>
              {p.soprannome ? `"${p.soprannome}"` : p.nome}
            </div>
            {p.soprannome && <div style={{ fontSize: 13, color: proxColors.ink3, marginTop: 2 }}>{p.nome}</div>}
            <div style={{ fontSize: 12, color: proxColors.ink3, marginTop: 4, display: 'flex', gap: 6 }}>
              {p.eta && <span>{p.eta} anni</span>}
              {p.sesso && <span>· {p.sesso}</span>}
              {p.lingue.length > 0 && <span>· {p.lingue.join('/')}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 12 }}>
          {p.tag.map(t => <Tag key={t} tone="outline" size="sm">{t}</Tag>)}
        </div>
      </div>

      {/* action row */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 8px' }}>
        <Button tone="primary" size="sm" icon="plus" full>Nuovo evento</Button>
        <Button tone="ghost" size="sm" icon="phone" style={{ aspectRatio: 1, padding: 0, width: 40 }}>{''}</Button>
        <Button tone="ghost" size="sm" icon="edit" style={{ aspectRatio: 1, padding: 0, width: 40 }}>{''}</Button>
      </div>

      {/* bisogni */}
      {p.bisogni && p.bisogni.length > 0 && (
        <Section title="Bisogni attivi">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.bisogni.map(b => (
              <Card key={b} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: proxColors.accent }}/>
                <div style={{ flex: 1, fontSize: 13.5 }}>{b}</div>
                <Icon name="chevron" size={14} color={proxColors.ink3}/>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* note */}
      {p.note && (
        <Section title="Note">
          <Card style={{ padding: 12, fontSize: 13.5, lineHeight: 1.45, color: proxColors.ink2 }}>
            {p.note}
          </Card>
        </Section>
      )}

      {/* rete */}
      {rete.length > 0 && (
        <Section title="Rete di contatti">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rete.map(c => (
              <Card key={c.id} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar nome={c.nome} ruolo={c.ruolo} size={32}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: proxColors.ink3 }}>{c.tag[0]}</div>
                </div>
                <Icon name="phone" size={16} color={proxColors.ink3}/>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* storico */}
      <Section title={`Storico eventi · ${eventiPersona.length}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eventiPersona.slice(0, 6).map(e => (
            <Card key={e.id} onClick={() => onApriEvento && onApriEvento(e.id)} style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <EventTypeDot tipo={e.tipo}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{TIPO_EVENTO[e.tipo]?.label}</div>
                <div style={{ fontSize: 11, color: proxColors.ink3 }}>{e.data} · {e.oraInizio} · {luogoById(e.luogo)?.nome || '—'}</div>
              </div>
              <span style={{ fontSize: 11, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{e.durataMin}m</span>
            </Card>
          ))}
          {eventiPersona.length > 6 && (
            <button style={{ marginTop: 4, padding: '10px', background: 'transparent', border: 'none', fontSize: 13, color: proxColors.accentInk, fontWeight: 500, cursor: 'pointer' }}>
              Vedi tutti ({eventiPersona.length})
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '16px 16px 2px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '0 4px 8px' }}>{title}</div>
      {children}
    </div>
  );
}

Object.assign(window, { PersoneList, PersonaDetail, Section });
