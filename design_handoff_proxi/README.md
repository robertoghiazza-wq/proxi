# Handoff: Proxi — App di rendicontazione per servizi di prossimità

## Overview

**Proxi** is a multi-tenant SaaS application for street outreach / proximity services ("servizi di prossimità"). Field educators ("educatori") who work on the street — often one-handed on a phone — use it to record their work. The product is sold to multiple social-service institutions across Ticino (Switzerland); each institution white-labels it with its own logo and accent color while the data of each remains fully isolated.

The whole design is organized around **three core pillars** that an outreach service needs to account for its work:

1. **Persone** (People) — an address book of *utenti* (service users, often anonymous/by-nickname), *dipendenti* (the institution's own staff/équipe) and *rete* (the contact network: doctors, volunteers, social workers).
2. **Luoghi & servizi** (Places & services) — streets/squares, informal meeting points, day centers, health services, offices.
3. **Eventi** (Events) — the bridge that joins People + Places, records the work done **and the hours worked**. Every event links 0..n people, an optional place, a type, a duration and notes.

On top of the three pillars the app grew several modules: expense/receipt tracking, vehicle mileage, operational objectives, weekly reporting dashboards, shift management for coordinators, an institution-admin console, and a Proxi super-admin platform console.

The UI language is **Italian**. Primary device is **mobile (iOS)** for field use, with **desktop web** views for coordinators and administrators.

## About the Design Files

The files in this bundle are **design references created in HTML/React (via inline Babel JSX)** — interactive prototypes showing the intended look and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's environment**, using its established patterns, component library and conventions. If no codebase exists yet, a sensible default stack would be **React + TypeScript + Vite** (the prototype is already React), with a real component library and a proper data layer — but treat that as a starting suggestion, not a requirement.

The prototype renders every screen as an **artboard on a pan/zoom design canvas** (the `DesignCanvas` component) and as one fully-interactive mobile prototype. In the real app there is **no canvas** — each artboard becomes a real route/screen.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, iconography and interaction patterns are all intentional and should be reproduced closely. Exact tokens are listed below. Where the prototype uses placeholders (maps, receipt photo, OCR result) those are explicitly called out as placeholders to be replaced with real integrations.

---

## Architecture & Roles

The app is **multi-tenant** with four privilege levels. Each renders a distinct surface:

| Role | Surface | Theme | Notes |
|---|---|---|---|
| **Super-admin Proxi** | Platform console — list of all client institutions, billing/MRR, service health, anonymized audit log | **Dark** (`#0e1015` / `#181b22`) | Internal Proxi team. Sees institutions as customers but **never** their operational data. |
| **Admin istituzione** | Institution dashboard — équipe, members, roles & permissions, brand, security/data, billing | Light, **tenant brand color** | e.g. Prometheus direction. |
| **Coordinatore équipe** | Shift planning, weekly reporting dashboard, objectives | Light, tenant brand | Manages one équipe. |
| **Educatore** | Mobile app — the 5-tab field tool + expenses/vehicles/objectives | Light, tenant brand | The street worker. |
| *(Stagista/volontario)* | Reduced read-mostly access | — | Defined in the permission matrix, not yet a separate surface. |

**Data isolation is a first-class design concern.** The "Sicurezza & dati" tab visualizes each tenant having an isolated DB schema (see `TenantDiagram`). Implement true tenant isolation server-side (separate schema or strict row-level security per `institution_id`). The dark super-admin theme is a deliberate signal that it is a different, internal context.

---

## Design Tokens

CSS variables are set on `:root` and consumed through a `proxColors` object. The accent is driven at runtime from the active institution's brand color.

### Colors — neutrals & surfaces (light theme)
```
--prox-bg:        #f1f2f4   /* app background — light warm-neutral gray */
--prox-surface:   #ffffff   /* cards, bars */
--prox-surface2:  #f7f8fa   /* table headers, insets */
--prox-ink:       #14171c   /* primary text */
--prox-ink2:      #444a55   /* secondary text */
--prox-ink3:      #858c97   /* tertiary text / captions */
--prox-line:      rgba(20,23,28,0.08)   /* borders */
--prox-line2:     rgba(20,23,28,0.04)   /* hairline dividers */
```

### Colors — accent (per-tenant, default = Prometheus red)
```
--prox-accent:      #dc1d27   /* Prometheus red */
--prox-accent-soft: #fdecec   /* tint (accent mixed 88% toward white) */
--prox-accent-ink:  #8a1218   /* deep (accent mixed 40% toward black) */
```
`accent-soft` and `accent-ink` are computed from any hex accent via `softOf(hex)` = mix toward white 0.88, `inkOf(hex)` = mix toward black 0.40. Reproduce with a small color-mix util (or CSS `color-mix(in srgb, …)`).

Tenant brand presets used in prototype: Prometheus `#dc1d27`, Ingrado `#0a7d6f`, Antenna Icaro `#1a4ea8`, Cura Domino `#7b4dbb`, Strada Aperta `#c45a18`, Centro Giovani Locarno `#0e8a4a`.

### Semantic colors
```
danger: oklch(0.58 0.18 25)    ok: oklch(0.60 0.12 155)    warn: oklch(0.70 0.14 70)
```
Category/type colors are generated as `oklch(0.62 0.14 <hue>)` with per-type hues (see event/expense/shift type tables in data).

### Dark theme (super-admin only)
```
bg:        #0e1015      panel:     #181b22
text:      #e6e8eb      text-mut:  rgba(255,255,255,0.5)
border:    rgba(255,255,255,0.08)
positive:  #5dd39e   warning: #ffb454   danger: #ff6f76
accent-bg: rgba(220,29,39,0.18)   accent-fg: #ff6f76
```

### Typography
- **Display / headings:** `'Inter Tight'`, weights 500/600/700, `letter-spacing: -0.02em` (tighter on large sizes, down to ~-0.6px). Class `.prox-display`.
- **Body / UI:** `'Inter'`, weights 400/500/600/700.
- **Numeric / mono:** `ui-monospace, Menlo, monospace` with `font-variant-numeric: tabular-nums` (class `.prox-mono`). Used for times, km, money, IDs.
- Both Inter & Inter Tight loaded from Google Fonts.
- Type scale in use (px): captions 10–11.5, body 12.5–14, list titles 14–15, card titles 15–18, section titles 22 (mobile top bar) / 32 (desktop page title), big metrics 22–30, hero numbers 56–64 (expense amount / km entry).
- Uppercase labels: 10.5–11px, `font-weight 600`, `letter-spacing 0.5–0.6`, `text-transform: uppercase`, color `ink3`.

### Spacing, radius, shadow
- Spacing rhythm: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22 / 24 / 28 px. Mobile screen gutter = 16px. Desktop page padding = 24–28px.
- Radius: chips/pills `999`, cards `14`, inner cards/inputs `10–12`, list rows `10–14`, tags `999`, small tiles `12`, buttons `999` (fully round).
- Card shadow (elev 1): `0 1px 2px rgba(20,15,10,0.04), 0 1px 0 rgba(20,15,10,0.02)`; (elev 2): `0 4px 16px rgba(20,15,10,0.08)`. Cards also have `1px solid var(--prox-line2)` border.
- Mobile hit targets ≥ 44px. Bottom tab bar + FAB float above content with a blurred gradient scrim.

### Iconography
Custom inline SVG icon set, stroke style, `stroke-width 1.75` (2+ when active), 24×24 grid, `round` line caps/joins. Names used: home, people, person, map, pin, calendar, plus, search, chevron, back, clock, check, close, edit, phone, timer, filter, more, tag, heart, bell, logout, stop, play, warn, sparkle, list, grid, export, doc, link. Reproduce with any equivalent stroke icon set (e.g. Lucide) matching weight.

---

## Screens / Views

> Mobile artboards are 390×844 (iPhone). Desktop artboards are 1280–1400 wide. In the real app these are routes, not fixed artboards.

### MOBILE — Educatore

**Tab bar (persistent):** 5 tabs — Oggi (home), Persone, Eventi, Luoghi, Io (profilo). Active tab uses accent color. A floating **FAB** (+) bottom-right opens "Nuovo evento".

1. **Home / Oggi** — three switchable variants (a product decision still open; exposed as a tweak):
   - *Lista cronologica*: greeting + date, a card with today's worked hours (`Xh YYm`) and closed/open event counts, then a chronological list of the day's events (time rail | type dot + label | people | place).
   - *Azioni rapide*: 2×2 grid of big quick-action tiles (Nuovo evento [primary], Nuova persona, Nuovo luogo, Cerca) + "prossimo/in corso" event card + condensed day list.
   - *Timeline verticale*: vertical line with node dots colored by event type; each node a compact event card.
2. **Persone (list)** — search field, role chips (Tutti / Utenti / Équipe / Rete with counts), grouped sections. Row = avatar (initials, or anonymous person glyph), name or `"soprannome"`, age · languages · tags, event count on the right. Vulnerable users (minore / senza fissa dimora / dipendenza) get a warn icon.
3. **Persona detail** — hero (accent-soft → bg gradient) with large avatar, name/nickname, age/sex/languages, tag chips; action row (Nuovo evento primary + phone/edit icon buttons); sections: *Bisogni attivi*, *Note*, *Rete di contatti*, *Storico eventi*. Anonymous variant uses nickname + person glyph.
4. **Luoghi (list + map)** — search + lista/mappa toggle. Map view = stylized `MapPlaceholder` (abstract streets + pins, **placeholder — replace with real maps provider**). Row = colored pin tile by place type, name, type · address, people/week stat.
5. **Luogo detail** — map header, name + type tag + address + hours, action row, stats (people / events-week / total), notes, recent events.
6. **Eventi (list)** — status filter chips (Tutti / Chiusi / Pianif. / In corso), events grouped by day with daily minute totals. Row = type color bar | time+duration | people or type | type · place | status (live tag / check).
7. **Nuovo evento — two form variants** (open product decision, tweakable):
   - *Rapido* (1 screen): Annulla/Salva header; type as a 3-col icon grid; duration chips (15/30/45/60/90); people as avatar chips; place as radio list; quick notes textarea.
   - *Dettagliato* (4 steps with progress bar): Step 1 type (full list), Step 2 date/time + duration, Step 3 people (checkbox list), Step 4 place + reporting notes. Footer Indietro / Continua / Salva.
8. **Spese (list)** — hero card: week total `CHF`, "da rimborsare" amount, voci count, Aggiungi button; category breakdown chips; expenses grouped by day with daily totals. Row = category icon tile, description, category · person, amount + reimbursed status.
9. **Nuova spesa** — big CHF amount display; 5-col category grid (pasti/trasporto/materiale/farmacia/altro); **receipt capture** ("Foto scontrino" vs "Senza scontrino") with a stylized receipt mockup + a faked OCR "✓ Riconosciuto · CHF 18.50" tag (**placeholder — replace with real camera + OCR**); payment method (contanti/carta/twint); linked person; description.
10. **Veicoli & km** — vehicle cards (model, plate, year, current km, next maintenance, status tag); "Registra viaggio" primary; recent trips list (date | motive | plate·driver | +km).
11. **Registra viaggio** — big km-delta display; vehicle radio; km start/end number inputs; motive textarea.
12. **Obiettivi (list)** — summary card (raggiunti / in corso / a rischio counts); objectives grouped by status; each card = title, description, big % , progress bar (green=raggiunto, red=a rischio, accent=in corso), `attuale/target`, responsible avatar + days-left.
13. **Ricerca globale** — single search field; grouped results across Persone / Luoghi / Eventi; "Recenti" empty state.
14. **Profilo educatore** — hero, hours worked (today/week/month) with "Esporta timesheet", settings list (notifiche, privacy & consensi, categorie & tag, modelli di rapporto, esci).

### DESKTOP — Coordinatore

15. **Cruscotto rendicontazione** (1280 wide) — topbar: Proxi wordmark | divider | institution logo+name | nav | avatar. 4 KPIs (ore / spese CHF / km / obiettivi). 3 charts (spese by category bars, km/day bar chart, objectives progress). Spese detail table (filterable, CSV/PDF export). Vehicles status + objectives table.
16. **Timesheet settimanale** (older variant, kept) — weekly hours bar chart + per-type breakdown + event detail table.
17. **Gestione turni** (1400 wide) — week grid: rows = educators, cols = 7 days, cells = colored shift blocks (mattino/pomeriggio/sera/notte/ferie/libero) by type hue, + hours column. A **reperibilità** (on-call) row with avatars per day. A **copertura** (coverage) row with proportional stacked bars + under-coverage warnings. KPIs (planned hours, street coverage %, pending requests, on leave, balance). Shift legend. Requests/swaps list with inline Approva/Rifiuta.

### DESKTOP — Admin istituzione (tenant brand)

18. **AdminIstituzione** (1400 wide) — tabbed dashboard. Tabs: Panoramica · Équipe · Membri · Ruoli & permessi · Brand · Sicurezza & dati · Fatturazione.
    - **Équipe**: CRUD table of teams (name/city, coordinator, operators, users, events/week, since, status, actions).
    - **Membri**: search + role filters; pending invites card (email, role, équipe, invited date, in_attesa/scaduto, re-invia/revoca); members table (operator, email, role tag, équipe, languages, status, gestisci).
    - **Ruoli & permessi**: 5 role cards + a permission **matrix** (Area rows × Role cols, cells RW / R / RW* / —, color-coded).
    - **Brand**: logo upload slot + accent color picker.
    - **Sicurezza & dati**: `TenantDiagram` (shared Proxi platform layer over isolated per-tenant DBs, active tenant highlighted, lock icons); compliance checklist (nLPD/GDPR/encryption/backup/2FA); privacy tools (export tenant data, delete user, consent register).
    - **Fatturazione**: current plan + feature list + invoices table.

### DESKTOP — Super-admin Proxi (DARK)

19. **SuperAdminPiattaforma** (1400 wide, dark) — platform console. KPIs (active institutions, MRR, field operators, tracked users, uptime). Status filters + list/grid toggle. Institutions table (brand logo, region, plan badge, équipe, members, users, events/month, last activity, status dot, ⋯). Grid = institution cards. Bottom: service health (uptime per subsystem) + platform audit log (anonymized, color-coded by type). **Never shows tenant operational data.**

### DESKTOP — Direzione (institution-wide, lighter admin)

20. **DesktopAdminEquipe** (1400 wide) — overview of all équipe of one institution across Ticino. Cards / Ticino-map / table views. Per-équipe: coordinator, member avatar stack, KPIs, coverage-vs-target bar. Horizontal comparisons (users per équipe, hours-vs-target). Stylized Ticino map with sized pins.

---

## Interactions & Behavior

- **Navigation (mobile prototype):** tab bar switches the 5 top-level screens; tapping a person/place row pushes a detail view (back chevron returns); FAB and "Nuovo evento" open the event form as a full-screen modal over the device frame.
- **Tabs (desktop admin):** in-page tab state swaps the content region; no route change in the prototype but should map to real routes.
- **Forms:** type/duration/person/place selections are immediate toggles with accent-soft selected state. Multi-step form has a progress bar and Indietro/Continua/Salva footer. No real validation in prototype — add required-field validation (amount, type, at least the mandatory fields) in production.
- **Shift grid:** clicking a cell selects it (accent-soft highlight) — wire to an edit popover in production. Coverage row recomputes from the grid.
- **Requests:** Approva/Rifiuta buttons inline — wire to state changes + notifications.
- **Hover:** buttons/rows have subtle background hover; ripple class on primary buttons (`:active` overlay at 8% opacity).
- **Transitions:** canvas-only smoothing aside, screen transitions are simple; use 120–200ms ease for selection/hover. Don't over-animate.
- **States to add for production:** empty lists (new institution / new équipe), no-search-results (a "Recenti" empty state exists for global search), loading skeletons, error/permission-denied, edit/delete existing event with conflict detection. (Offline was explicitly out of scope.)

## State Management

State that needs a real backing store:
- **Auth & tenant context:** current user, role, active `institution_id` and `équipe_id`; tenant switcher for multi-context users. Drives the accent color + which surface renders.
- **People / Places / Events** (the three pillars), each scoped to tenant + équipe. Events reference people[] + place + educator + type + date + start + durationMin + status (`completato` / `in_corso` / `pianificato`) + notes.
- **Expenses** (amount, category, method, receipt asset, linked person, reimbursed flag), **Vehicles** + **Trips** (km in/out), **Objectives** (target/current/period/deadline/status/owner).
- **Shifts** (per person × day × type), **on-call**, **shift requests/swaps**.
- **Institutions / équipe / members / invites / roles & permission matrix / billing / audit log** for the admin surfaces.
- Derived/computed: worked-minutes per day, weekly totals, coverage per day, objective %, KPI rollups. Compute server-side where possible.

The current accent is applied by writing `--prox-accent` / `-soft` / `-ink` CSS vars on `:root` from the active tenant — keep this approach (CSS variables) so white-labeling is a single source of truth.

## Assets

- **`prometheus-logo.svg`** — the real Prometheus mark (red `rgb(220,29,39)` flame shapes + gray ring). Provided by the client; included in this bundle. The prototype embeds its paths in the `OrgLogo` component (org="prometheus").
- **Other institution logos** are rendered as letter monograms on the brand color — placeholders until each institution uploads its own SVG.
- **`ProxiLogo`** — the product wordmark: a ringed dot ("o") + "Proxi" in Inter Tight. Simple, drawn in SVG; refine with a designer for production.
- **Maps** (`MapPlaceholder`, Ticino map) are **stylized placeholders** — integrate a real provider (Mapbox / Google / OSM) with the same pin visual language.
- **Receipt photo + OCR** in "Nuova spesa" are **mocked** — replace with real camera capture + OCR.
- **Avatars** are generated initials on a name-hashed pastel background (`Avatar` component) — keep as fallback; allow real photos with consent.
- Fonts: Inter + Inter Tight (Google Fonts).

## Files

The single source of truth is **`Proximity.html`** — a self-contained file with all components inlined (React 18 + Babel standalone). Everything renders inside a `DesignCanvas` (pan/zoom) wrapper; ignore the canvas itself when porting — each `DCArtboard` is a screen.

For easier reading, the same code is also split into per-module source files (pre-inline copies). Map of where things live:

| File | Contents |
|---|---|
| `Proximity.html` | **Canonical** — all of the below inlined + the `App`/`PrototypeShell`/`PhoneShell` composition, tweaks panel, canvas layout |
| `data.jsx` | Seed data + helpers: PERSONE, LUOGHI, EVENTI, TIPO_EVENTO, TIPO_LUOGO, `personaById`, `luogoById`, etc. |
| `ui.jsx` | Design system: `proxColors`, `Icon`, `Avatar`, `Tag`, `EventTypeDot`, `TabBar`, `TopBar`, `MapPlaceholder`, `Button`, `Card` + shared styles/fonts |
| `screens-home.jsx` | HomeLista / HomeAzioni / HomeTimeline + FAB |
| `screens-persone.jsx` | PersoneList, PersonaRow, PersonaDetail, Section |
| `screens-luoghi.jsx` | LuoghiList, LuogoRow, LuogoDetail |
| `screens-eventi.jsx` | EventiList, EventoRow, NuovoEventoRapido, NuovoEventoDettagliato |
| `screens-profilo-search.jsx` | Profilo, GlobalSearch |
| `screen-desktop.jsx` | DesktopReport (weekly timesheet) + KPI |
| `screens-extra.jsx` | Spese, Veicoli, Obiettivi (mobile) + DesktopCruscotto + data for those modules |
| `screens-turni-admin.jsx` | Shift data, DesktopTurni (shift management), DesktopAdminEquipe (institution-wide teams), Ticino map |
| `screens-superadmin.jsx` | Institutions data, roles & permission matrix, SuperAdminPiattaforma (dark), AdminIstituzione (tabbed) + TenantDiagram |
| `ios-frame.jsx`, `design-canvas.jsx`, `tweaks-panel.jsx`, `browser-window.jsx` | Prototype scaffolding only — **not part of the product**; do not port. |
| `prometheus-logo.svg` | Real client logo asset. |

> Note: the loose `.jsx` files are the readable pre-inline sources. If anything differs, **`Proximity.html` is authoritative.**

## Suggested implementation order

1. Auth + tenant context + role-based routing; CSS-variable theming from active tenant.
2. The three pillars (Persone, Luoghi, Eventi) + the event create form — the core loop.
3. Mobile shell (5 tabs + FAB) and the home variants (pick one as default, keep others behind a flag).
4. Rendicontazione modules (spese/veicoli/obiettivi) + coordinator dashboards.
5. Shift management.
6. Admin istituzione (équipe/membri/ruoli/brand/sicurezza/billing).
7. Super-admin Proxi console + true tenant isolation enforcement.
8. Replace placeholders: maps provider, receipt camera+OCR, real logos/photos.
