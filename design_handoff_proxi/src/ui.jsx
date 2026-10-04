// ui.jsx — Primitive UI components & iconography for Proximity
// Tokens are driven by CSS variables set on :root so the Tweaks panel
// can change the accent live without re-mounting.

const proxColors = {
  bg:       'var(--prox-bg,       #f5f2ed)',
  surface:  'var(--prox-surface,  #ffffff)',
  surface2: 'var(--prox-surface2, #faf7f2)',
  ink:      'var(--prox-ink,      #1a1613)',
  ink2:     'var(--prox-ink2,     #4a4540)',
  ink3:     'var(--prox-ink3,     #8a847c)',
  line:     'var(--prox-line,     rgba(26,22,19,0.08))',
  line2:    'var(--prox-line2,    rgba(26,22,19,0.04))',
  accent:   'var(--prox-accent,   oklch(0.62 0.14 40))',
  accentSoft:'var(--prox-accent-soft, oklch(0.94 0.04 40))',
  accentInk:'var(--prox-accent-ink, oklch(0.35 0.10 40))',
  danger:   'oklch(0.58 0.18 25)',
  warn:     'oklch(0.70 0.14 70)',
  ok:       'oklch(0.60 0.12 155)',
};

// Inject shared styles once
if (typeof document !== 'undefined' && !document.getElementById('prox-styles')) {
  const s = document.createElement('style');
  s.id = 'prox-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&display=swap');
    .prox { font-family: 'Inter', -apple-system, system-ui, sans-serif; -webkit-font-smoothing: antialiased; color: ${proxColors.ink}; }
    .prox-display { font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; letter-spacing: -0.02em; }
    .prox-mono    { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
    .prox *::-webkit-scrollbar { display: none; }
    .prox * { scrollbar-width: none; }
    .prox-ripple { position: relative; overflow: hidden; }
    .prox-ripple:active::after { content:''; position:absolute; inset:0; background: currentColor; opacity:.08; }
  `;
  document.head.appendChild(s);
}

// ──────────────────────────────────────────────────────────────
// Iconography — stroke outlines, 1.75 weight, 24px grid
// ──────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, style }) {
  const P = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home:    <><path {...P} d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z"/></>,
    people:  <><circle {...P} cx="9" cy="9" r="3.25"/><path {...P} d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle {...P} cx="16.5" cy="8" r="2.75"/><path {...P} d="M14.5 14.5c3 0 6.5 2 6.5 5.5"/></>,
    person:  <><circle {...P} cx="12" cy="8" r="3.5"/><path {...P} d="M5 21c0-3.8 3.1-7 7-7s7 3.2 7 7"/></>,
    map:     <><path {...P} d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path {...P} d="M9 4v14M15 6v14"/></>,
    pin:     <><path {...P} d="M12 21s7-7.3 7-12a7 7 0 10-14 0c0 4.7 7 12 7 12z"/><circle {...P} cx="12" cy="9" r="2.5"/></>,
    calendar:<><rect {...P} x="3.5" y="5" width="17" height="15" rx="2"/><path {...P} d="M3.5 10h17M8 3v4M16 3v4"/></>,
    plus:    <><path {...P} d="M12 5v14M5 12h14"/></>,
    search:  <><circle {...P} cx="11" cy="11" r="6.5"/><path {...P} d="M20 20l-4-4"/></>,
    chevron: <><path {...P} d="M9 5l7 7-7 7"/></>,
    back:    <><path {...P} d="M15 5l-7 7 7 7"/></>,
    clock:   <><circle {...P} cx="12" cy="12" r="8.5"/><path {...P} d="M12 7v5l3 2"/></>,
    check:   <><path {...P} d="M4 12.5l5 5L20 6.5"/></>,
    close:   <><path {...P} d="M6 6l12 12M18 6L6 18"/></>,
    edit:    <><path {...P} d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"/></>,
    phone:   <><path {...P} d="M5 4h3l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v3a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/></>,
    timer:   <><circle {...P} cx="12" cy="13" r="7.5"/><path {...P} d="M9 2h6M12 9v4.5l2.5 2.5"/></>,
    filter:  <><path {...P} d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/></>,
    more:    <><circle cx="5" cy="12" r="1.75" fill={color}/><circle cx="12" cy="12" r="1.75" fill={color}/><circle cx="19" cy="12" r="1.75" fill={color}/></>,
    tag:     <><path {...P} d="M3 11V4h7l11 11-7 7L3 11z"/><circle cx="8" cy="8" r="1.5" fill={color}/></>,
    heart:   <><path {...P} d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></>,
    bell:    <><path {...P} d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0"/></>,
    logout:  <><path {...P} d="M10 4H5v16h5M15 8l4 4-4 4M9 12h10"/></>,
    stop:    <><rect {...P} x="6" y="6" width="12" height="12" rx="1"/></>,
    play:    <><path {...P} d="M7 5l12 7-12 7V5z"/></>,
    warn:    <><path {...P} d="M12 4l10 16H2L12 4z"/><path {...P} d="M12 10v5M12 18v.5"/></>,
    sparkle: <><path {...P} d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"/></>,
    list:    <><path {...P} d="M4 6h16M4 12h16M4 18h16"/></>,
    grid:    <><rect {...P} x="4" y="4" width="7" height="7"/><rect {...P} x="13" y="4" width="7" height="7"/><rect {...P} x="4" y="13" width="7" height="7"/><rect {...P} x="13" y="13" width="7" height="7"/></>,
    export:  <><path {...P} d="M12 4v12M7 9l5-5 5 5M4 20h16"/></>,
    doc:     <><path {...P} d="M6 3h8l5 5v13H6V3z M14 3v5h5 M8 13h8M8 17h5"/></>,
    link:    <><path {...P} d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0, ...style }}>{paths[name]}</svg>
  );
}

// ──────────────────────────────────────────────────────────────
// Avatar — initials, mono bg derived from name hash
// ──────────────────────────────────────────────────────────────
function Avatar({ nome, soprannome, size = 40, anonimo = false, ruolo = 'utente' }) {
  const display = soprannome || nome || '—';
  const initials = display.replace(/[^A-Za-zÀ-ÿ ]/g,'').split(' ').filter(Boolean).slice(0,2).map(s => s[0]?.toUpperCase() || '').join('');
  const hash = [...display].reduce((h,c)=>h*31+c.charCodeAt(0),7) & 0xffff;
  const hue = hash % 360;
  const bg = ruolo === 'utente' ? `oklch(0.88 0.05 ${hue})` :
             ruolo === 'dipendente' ? `oklch(0.85 0.08 ${(hue+150)%360})` :
                                      `oklch(0.90 0.03 60)`;
  const ink = ruolo === 'utente' ? `oklch(0.35 0.09 ${hue})` :
              ruolo === 'dipendente' ? `oklch(0.35 0.10 ${(hue+150)%360})` :
                                       `oklch(0.40 0.04 60)`;
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2,
      background: bg, color: ink, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter Tight', system-ui", fontWeight: 600, fontSize: size * 0.36,
      letterSpacing: 0.2, position: 'relative',
    }}>
      {anonimo ? <Icon name="person" size={size*0.5} color={ink} strokeWidth={1.5}/> : initials}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Tag / Chip / Pill
// ──────────────────────────────────────────────────────────────
function Tag({ children, tone = 'neutral', size = 'md', style }) {
  const tones = {
    neutral: { bg: 'rgba(26,22,19,0.06)', fg: proxColors.ink2 },
    accent:  { bg: proxColors.accentSoft, fg: proxColors.accentInk },
    danger:  { bg: 'oklch(0.94 0.05 25)', fg: 'oklch(0.40 0.15 25)' },
    warn:    { bg: 'oklch(0.94 0.05 70)', fg: 'oklch(0.35 0.12 70)' },
    ok:      { bg: 'oklch(0.94 0.05 155)',fg: 'oklch(0.38 0.10 155)' },
    outline: { bg: 'transparent',         fg: proxColors.ink2, border: `1px solid ${proxColors.line}` },
  };
  const t = tones[tone] || tones.neutral;
  const pad = size === 'sm' ? '2px 7px' : '3px 9px';
  const fs  = size === 'sm' ? 11 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, borderRadius: 999, background: t.bg, color: t.fg,
      fontSize: fs, fontWeight: 500, letterSpacing: -0.1,
      border: t.border || 'none', whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
}

function EventTypeDot({ tipo, size = 8 }) {
  const hue = (TIPO_EVENTO[tipo]?.hue) ?? 40;
  return <span style={{ width: size, height: size, borderRadius: size/2, background: `oklch(0.62 0.14 ${hue})`, flexShrink: 0, display: 'inline-block' }}/>;
}

// ──────────────────────────────────────────────────────────────
// Mobile chrome: tab bar bottom, section header
// ──────────────────────────────────────────────────────────────
function TabBar({ active = 'home', onChange, accent }) {
  const tabs = [
    { id: 'home',     label: 'Oggi',    icon: 'home' },
    { id: 'persone',  label: 'Persone', icon: 'people' },
    { id: 'eventi',   label: 'Eventi',  icon: 'calendar' },
    { id: 'luoghi',   label: 'Luoghi',  icon: 'map' },
    { id: 'profilo',  label: 'Io',      icon: 'person' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      paddingBottom: 28, paddingTop: 8,
      background: 'linear-gradient(to bottom, transparent 0%, rgba(255,253,250,0.85) 30%, rgba(255,253,250,0.98) 60%)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 4px' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onChange && onChange(t.id)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              padding: '6px 2px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active === t.id ? (accent || proxColors.accent) : proxColors.ink3,
            }}>
            <Icon name={t.icon} size={22} strokeWidth={active === t.id ? 2 : 1.75}/>
            <span style={{ fontSize: 10.5, fontWeight: active === t.id ? 600 : 500, fontFamily: 'Inter' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopBar({ title, left, right, subtitle, style }) {
  return (
    <div style={{
      padding: '14px 16px 10px',
      borderBottom: `1px solid ${proxColors.line2}`,
      background: proxColors.bg,
      position: 'sticky', top: 0, zIndex: 10, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
        {left}
        <div style={{ flex: 1 }}>
          <div className="prox-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: proxColors.ink3, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

// Map placeholder — subtle grid + pins
function MapPlaceholder({ height = 180, pins = [], active }) {
  const bg = `
    linear-gradient(135deg, #e8e3da 0%, #ddd6c8 100%)
  `;
  return (
    <div style={{
      height, width: '100%', background: bg, position: 'relative', overflow: 'hidden',
      borderRadius: 12,
    }}>
      {/* abstract streets */}
      <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <g stroke="rgba(255,255,255,0.5)" strokeWidth="6" fill="none">
          <path d="M-20 60 L 320 90"/>
          <path d="M40 -10 L 120 220"/>
          <path d="M180 -10 L 240 220"/>
          <path d="M-20 140 L 320 160"/>
        </g>
        <g stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none">
          <path d="M-20 30 L 320 45"/>
          <path d="M-20 110 L 320 130"/>
          <path d="M80 -10 L 100 220"/>
          <path d="M210 -10 L 225 220"/>
        </g>
        {/* park */}
        <path d="M160 100 Q 195 85, 220 105 Q 230 130, 200 140 Q 170 135, 160 100 Z" fill="rgba(140,170,120,0.5)" />
      </svg>
      {pins.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -100%)',
        }}>
          <div style={{
            width: active === p.id ? 36 : 28, height: active === p.id ? 36 : 28, borderRadius: '50% 50% 50% 2px',
            background: active === p.id ? proxColors.accent : '#fff', border: `2px solid ${active === p.id ? proxColors.accent : proxColors.ink}`,
            transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(0,0,0,0.2)', transition: 'all .2s',
          }}>
            <div style={{ transform: 'rotate(45deg)', fontSize: 13, fontWeight: 700, color: active === p.id ? '#fff' : proxColors.ink }}>
              {p.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Button
function Button({ children, tone = 'primary', size = 'md', icon, onClick, style, type = 'button', full }) {
  const tones = {
    primary: { bg: proxColors.accent, fg: '#fff', border: 'none' },
    soft:    { bg: proxColors.accentSoft, fg: proxColors.accentInk, border: 'none' },
    ghost:   { bg: 'transparent', fg: proxColors.ink, border: `1px solid ${proxColors.line}` },
    danger:  { bg: 'oklch(0.96 0.03 25)', fg: proxColors.danger, border: 'none' },
  };
  const sz = { sm: { h: 32, pad: '0 12px', fs: 13 }, md: { h: 40, pad: '0 16px', fs: 14 }, lg: { h: 48, pad: '0 20px', fs: 15 } };
  const t = tones[tone]; const s = sz[size];
  return (
    <button type={type} onClick={onClick} className="prox-ripple"
      style={{
        height: s.h, padding: s.pad, borderRadius: 999, cursor: 'pointer',
        background: t.bg, color: t.fg, border: t.border,
        fontFamily: 'Inter', fontSize: s.fs, fontWeight: 600, letterSpacing: -0.1,
        display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        width: full ? '100%' : undefined, ...style,
      }}>
      {icon && <Icon name={icon} size={s.fs + 3} strokeWidth={2}/>}
      {children}
    </button>
  );
}

// Card
function Card({ children, style, onClick, elev = 1 }) {
  const shadow = elev === 0 ? 'none' : elev === 1 ? '0 1px 2px rgba(20,15,10,0.04), 0 1px 0 rgba(20,15,10,0.02)' : '0 4px 16px rgba(20,15,10,0.08)';
  return (
    <div onClick={onClick} style={{
      background: proxColors.surface, borderRadius: 14,
      border: `1px solid ${proxColors.line2}`,
      boxShadow: shadow, cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, {
  proxColors, Icon, Avatar, Tag, EventTypeDot,
  TabBar, TopBar, MapPlaceholder, Button, Card,
});
