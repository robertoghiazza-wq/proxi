// screen-desktop.jsx — Desktop web: riepilogo ore / report settimanale

function DesktopReport() {
  const settimana = ['2026-04-20','2026-04-21','2026-04-22','2026-04-23','2026-04-24','2026-04-25','2026-04-26'];
  const giorni = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  const datiGiorno = settimana.map(d => {
    const eventi = EVENTI.filter(e => e.data === d && e.educatore === 'p6');
    const minuti = eventi.reduce((s,e)=>s+e.durataMin,0);
    return { data: d, eventi, minuti };
  });
  const totMin = datiGiorno.reduce((s,d)=>s+d.minuti,0);
  const maxMin = Math.max(...datiGiorno.map(d=>d.minuti), 1);

  // Breakdown per tipologia
  const perTipo = {};
  EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6').forEach(e => {
    perTipo[e.tipo] = (perTipo[e.tipo]||0) + e.durataMin;
  });
  const tipiOrdinati = Object.entries(perTipo).sort((a,b)=>b[1]-a[1]);

  return (
    <div className="prox" style={{ background: proxColors.bg, minHeight: '100%', color: proxColors.ink }}>
      {/* Topbar */}
      <div style={{
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: `1px solid ${proxColors.line}`, background: proxColors.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: proxColors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'Inter Tight', fontSize: 15 }}>P</div>
          <div>
            <div className="prox-display" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}>Proximity</div>
            <div style={{ fontSize: 11, color: proxColors.ink3, marginTop: 1 }}>Prometheus · Servizio di prossimità</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Oggi','Persone','Luoghi','Eventi','Rendiconto'].map((t,i) => (
            <button key={t} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
              background: i===4 ? proxColors.accentSoft : 'transparent',
              color: i===4 ? proxColors.accentInk : proxColors.ink2,
              fontSize: 13, fontWeight: i===4 ? 600 : 500,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="bell" size={18} color={proxColors.ink3}/>
          <Avatar nome="Giulia Mazza" ruolo="dipendente" size={32}/>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: proxColors.ink3, fontWeight: 500, marginBottom: 4 }}>Rendicontazione</div>
            <div className="prox-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>Settimana 17 · 20–26 aprile</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: proxColors.surface, borderRadius: 8, border: `1px solid ${proxColors.line}`, padding: 2 }}>
              <button style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="back" size={14} color={proxColors.ink2}/>
              </button>
              <div style={{ padding: '0 12px', fontSize: 13, fontWeight: 500 }}>20–26 apr 2026</div>
              <button style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevron" size={14} color={proxColors.ink2}/>
              </button>
            </div>
            <Button tone="ghost" size="md" icon="export">Esporta PDF</Button>
            <Button tone="primary" size="md" icon="check">Invia timesheet</Button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <KPI label="Ore totali" value={`${Math.floor(totMin/60)}h ${String(totMin%60).padStart(2,'0')}'`} sub="su 38h contratto" accent="accent"/>
          <KPI label="Eventi" value={EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6').length} sub="questa settimana"/>
          <KPI label="Persone incontrate" value={[...new Set(EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6').flatMap(e=>e.personeIds.filter(id=>personaById(id)?.ruolo==='utente')))].length} sub="utenti unici"/>
          <KPI label="Luoghi attivi" value={[...new Set(EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6').map(e=>e.luogo).filter(Boolean))].length} sub="visitati"/>
        </div>

        {/* Chart ore/giorno */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 20 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <div>
                <div className="prox-display" style={{ fontSize: 18, fontWeight: 600 }}>Ore per giorno</div>
                <div style={{ fontSize: 12, color: proxColors.ink3, marginTop: 2 }}>Distribuzione della settimana</div>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: proxColors.ink3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: proxColors.accent }}/>Lavorate</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: proxColors.line }}/>Pianificate</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 180, paddingBottom: 20, borderBottom: `1px solid ${proxColors.line2}` }}>
              {datiGiorno.map((d, i) => {
                const h = Math.max(4, (d.minuti / maxMin) * 150);
                const label = giorni[i];
                const isOggi = d.data === '2026-04-24';
                return (
                  <div key={d.data} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(d.minuti/60)}h{d.minuti%60 ? ` ${d.minuti%60}'` : ''}</div>
                    <div style={{ height: 150, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{
                        width: '70%', height: h, background: isOggi ? proxColors.accent : `oklch(0.75 0.08 40)`,
                        borderRadius: 4,
                      }}/>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: isOggi ? 700 : 500, color: isOggi ? proxColors.accent : proxColors.ink2 }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div className="prox-display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Per tipologia</div>
            <div style={{ fontSize: 12, color: proxColors.ink3, marginBottom: 16 }}>Ripartizione delle ore</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tipiOrdinati.map(([k, min]) => {
                const info = TIPO_EVENTO[k];
                const pct = Math.round((min/totMin)*100);
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: `oklch(0.62 0.14 ${info.hue})` }}/>
                      <span style={{ fontSize: 12.5, flex: 1 }}>{info.label}</span>
                      <span style={{ fontSize: 12, color: proxColors.ink3, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(min/60)}h{min%60 ? ` ${min%60}'` : ''}</span>
                      <span style={{ fontSize: 11, color: proxColors.ink3, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: proxColors.line2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `oklch(0.62 0.14 ${info.hue})` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Dettaglio eventi settimana */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${proxColors.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="prox-display" style={{ fontSize: 17, fontWeight: 600 }}>Dettaglio eventi</div>
              <div style={{ fontSize: 12, color: proxColors.ink3, marginTop: 2 }}>{EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6').length} eventi registrati</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button tone="ghost" size="sm" icon="filter">Filtra</Button>
              <Button tone="ghost" size="sm" icon="export">CSV</Button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
            <thead>
              <tr style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: proxColors.ink3, textAlign: 'left', fontWeight: 600 }}>
                <th style={{ padding: '10px 20px 10px' }}>Data</th>
                <th style={{ padding: '10px 0' }}>Ora</th>
                <th style={{ padding: '10px 0' }}>Tipologia</th>
                <th style={{ padding: '10px 0' }}>Persone</th>
                <th style={{ padding: '10px 0' }}>Luogo</th>
                <th style={{ padding: '10px 20px 10px', textAlign: 'right' }}>Durata</th>
              </tr>
            </thead>
            <tbody>
              {EVENTI.filter(e => settimana.includes(e.data) && e.educatore === 'p6').sort((a,b)=>b.data.localeCompare(a.data) || b.oraInizio.localeCompare(a.oraInizio)).map(e => {
                const tipo = TIPO_EVENTO[e.tipo];
                const persone = e.personeIds.map(personaById).filter(Boolean);
                const luogo = luogoById(e.luogo);
                const dt = new Date(e.data+'T00:00:00');
                return (
                  <tr key={e.id} style={{ fontSize: 13, borderTop: `1px solid ${proxColors.line2}` }}>
                    <td style={{ padding: '12px 20px', color: proxColors.ink2 }}>{['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][dt.getDay()]} {dt.getDate()}/04</td>
                    <td style={{ padding: '12px 0', fontVariantNumeric: 'tabular-nums', color: proxColors.ink2 }}>{e.oraInizio}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: `oklch(0.62 0.14 ${tipo.hue})` }}/>
                        <span style={{ fontWeight: 500 }}>{tipo.label}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', color: proxColors.ink2 }}>
                      {persone.slice(0,2).map(p => p.soprannome || p.nome).join(', ')}
                      {persone.length > 2 && <span style={{ color: proxColors.ink3 }}> +{persone.length-2}</span>}
                      {persone.length === 0 && <span style={{ color: proxColors.ink3 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 0', color: proxColors.ink2 }}>{luogo?.nome || <span style={{ color: proxColors.ink3 }}>—</span>}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{e.durataMin}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, accent }) {
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, color: proxColors.ink3, marginBottom: 8 }}>{label}</div>
      <div className="prox-display" style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6, color: accent === 'accent' ? proxColors.accent : proxColors.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: proxColors.ink3, marginTop: 6 }}>{sub}</div>
    </Card>
  );
}

Object.assign(window, { DesktopReport });
