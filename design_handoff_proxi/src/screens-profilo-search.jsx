// screens-profilo-search.jsx — Profilo educatore + ricerca globale

function Profilo() {
  const me = personaById('p6');
  const oggi = minutiLavoratiOggi('2026-04-24');
  const sett = EVENTI.filter(e => e.educatore === 'p6' && e.stato !== 'pianificato').reduce((s,e)=>s+e.durataMin, 0);
  return (
    <div style={{ padding: '0 0 120px' }}>
      <div style={{ padding: '16px 16px 20px', background: `linear-gradient(180deg, ${proxColors.accentSoft} 0%, ${proxColors.bg} 100%)` }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar nome={me.nome} ruolo={me.ruolo} size={64}/>
          <div style={{ flex: 1 }}>
            <div className="prox-display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>{me.nome}</div>
            <div style={{ fontSize: 13, color: proxColors.ink3, marginTop: 2 }}>Educatrice · Équipe A · Coordinatrice</div>
          </div>
          <button style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}>
            <Icon name="edit" size={18} color={proxColors.ink3}/>
          </button>
        </div>
      </div>

      <Section title="Ore lavorate">
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>{Math.floor(oggi/60)}h {String(oggi%60).padStart(2,'0')}'</div>
              <div style={{ fontSize: 11, color: proxColors.ink3 }}>oggi</div>
            </div>
            <div style={{ width: 1, background: proxColors.line, margin: '0 8px' }}/>
            <div>
              <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>{Math.floor(sett/60)}h {String(sett%60).padStart(2,'0')}'</div>
              <div style={{ fontSize: 11, color: proxColors.ink3 }}>settimana</div>
            </div>
            <div style={{ width: 1, background: proxColors.line, margin: '0 8px' }}/>
            <div>
              <div className="prox-display" style={{ fontSize: 22, fontWeight: 600 }}>38h</div>
              <div style={{ fontSize: 11, color: proxColors.ink3 }}>mese</div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${proxColors.line2}`, display: 'flex', gap: 8 }}>
            <Button size="sm" tone="ghost" icon="export" full>Esporta timesheet</Button>
          </div>
        </Card>
      </Section>

      <Section title="Impostazioni">
        <Card style={{ padding: 0 }}>
          {[
            { icon: 'bell',   label: 'Notifiche',          detail: 'Attive' },
            { icon: 'heart',  label: 'Privacy e consensi', detail: '' },
            { icon: 'tag',    label: 'Categorie e tag',     detail: '' },
            { icon: 'doc',    label: 'Modelli di rapporto', detail: '' },
            { icon: 'logout', label: 'Esci',                detail: '', danger: true },
          ].map((r,i,arr) => (
            <div key={r.label} style={{
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              borderTop: i>0 ? `1px solid ${proxColors.line2}` : 'none',
            }}>
              <Icon name={r.icon} size={18} color={r.danger ? proxColors.danger : proxColors.ink3}/>
              <div style={{ flex: 1, fontSize: 14, color: r.danger ? proxColors.danger : proxColors.ink }}>{r.label}</div>
              {r.detail && <span style={{ fontSize: 12, color: proxColors.ink3 }}>{r.detail}</span>}
              {!r.danger && <Icon name="chevron" size={14} color={proxColors.ink3}/>}
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

function GlobalSearch() {
  const [q, setQ] = React.useState('aïc');
  const match = (s) => (s || '').toLowerCase().includes(q.toLowerCase());
  const personeRes = PERSONE.filter(p => match(p.nome) || match(p.soprannome) || p.tag.some(match));
  const luoghiRes = LUOGHI.filter(l => match(l.nome) || match(l.indirizzo));
  const eventiRes = EVENTI.filter(e => personeRes.some(p => e.personeIds.includes(p.id)));
  return (
    <div style={{ padding: '0 0 120px' }}>
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 12, background: proxColors.surface, border: `1px solid ${proxColors.line}`,
        }}>
          <Icon name="search" size={18} color={proxColors.ink3}/>
          <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Cerca ovunque…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontFamily: 'Inter' }}/>
          {q && <button onClick={()=>setQ('')} style={{ background:'transparent', border:'none', cursor:'pointer', padding: 2 }}>
            <Icon name="close" size={16} color={proxColors.ink3}/>
          </button>}
        </div>
      </div>

      {q ? <>
        {personeRes.length > 0 && <>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '8px 20px 8px' }}>Persone · {personeRes.length}</div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {personeRes.slice(0,3).map(p => <PersonaRow key={p.id} p={p}/>)}
          </div>
        </>}
        {luoghiRes.length > 0 && <>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '8px 20px 8px' }}>Luoghi · {luoghiRes.length}</div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {luoghiRes.slice(0,2).map(l => <LuogoRow key={l.id} l={l}/>)}
          </div>
        </>}
        {eventiRes.length > 0 && <>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '8px 20px 8px' }}>Eventi correlati · {eventiRes.length}</div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {eventiRes.slice(0,3).map(e => <EventoRow key={e.id} e={e}/>)}
          </div>
        </>}
      </> : (
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, padding: '0 4px 10px' }}>Recenti</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Marco R.','Mensa Caritas','emergenza'].map(r => (
              <div key={r} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: proxColors.ink2 }}>
                <Icon name="clock" size={14} color={proxColors.ink3}/>
                <span style={{ flex: 1 }}>{r}</span>
                <Icon name="chevron" size={14} color={proxColors.ink3}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Profilo, GlobalSearch });
