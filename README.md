# zen-IT-trix 2.0 — Architecture

Single-page marketing/event site for the **zen-IT-trix 2.0** technical symposium, held by the
Information Technology department of Annapoorana Engineering College.

---

## 1. Overview

| Property | Value |
| --- | --- |
| Type | Static Single-Page Application (SPA) |
| Framework | React 19 (function components, JSX) |
| Build tool | Vite 8 (`@vitejs/plugin-react`) |
| Language | JavaScript (ESM, no TypeScript) |
| Styling | Plain CSS + CSS custom properties (no CSS framework) |
| Routing | None — single page, in-page anchor navigation |
| State | Local component state only (no store, no context, no server) |
| Data source | Static ES module (`src/data.js`) — no API calls, no backend |
| Lint | ESLint 10 flat config (`js`, `react-hooks`, `react-refresh`) |
| Delivery | Multi-stage Docker build → Nginx static hosting on port 80 |

There is **no backend**. The site is fully static: all content is either authored in JSX or
exported from a single data module, and the only outbound links are `mailto:`, `tel:`, and the
external Google Form registration link.

---

## 2. Directory layout

```
zen_it_trix_v2/
├── Dockerfile                 # Multi-stage: node:20-alpine build → nginx:alpine serve
├── index.html                 # Vite HTML entry, mounts #root, loads /src/main.jsx
├── vite.config.js             # Vite config (react plugin only)
├── eslint.config.js           # ESLint flat config
├── package.json               # Deps + scripts (dev / build / lint / preview)
├── public/                    # Copied verbatim into dist (no hashing, no processing)
│   ├── favicon.svg            # Referenced from index.html
│   └── icons.svg              # Sprite, currently unreferenced
├── dist/                      # Build output (git-ignored, generated)
└── src/
    ├── main.jsx               # Entry point: createRoot → StrictMode → <App/>
    ├── App.jsx                # Shell: composes the seven page sections
    ├── index.css              # Base/reset styles + light/dark tokens (template)
    ├── cyberpunk.css          # Design system + all component styles (917 lines)
    ├── App.css                # Legacy template styles — NOT imported anywhere
    ├── data.js                # Single source of truth for content
    ├── assets/
    │   ├── logo.png           # College logo (imported by Navbar + Footer)
    │   └── image.png          # Unused template asset
    └── components/
        ├── Navbar.jsx         # Sticky-ish header: brand, anchor nav, Register CTA
        ├── Hero.jsx           # Pointer-reactive hero, orbit/scanline layers, ticker
        ├── About.jsx          # Static editorial block + stats + marquee
        ├── Events.jsx         # Tabbed event catalogue (technical / non-technical)
        ├── Schedule.jsx       # Timeline of the day
        ├── Contact.jsx        # In-charge contacts + general email + address
        └── Footer.jsx         # Logo, anchor links, copyright
```

---

## 3. Runtime architecture

```
Browser
  │
  ├─ index.html  ──>  <div id="root">  ──>  /src/main.jsx (ES module)
  │                                            │
  │                                            └─ createRoot().render(
  │                                                 <StrictMode><App/></StrictMode>)
  │                                                          │
  │                                                          └─ div.site-shell
  │                                                               ├── <Navbar/>   #top
  │                                                               ├── <main>
  │                                                               │    ├── <Hero/>     #top
  │                                                               │    ├── <About/>    #about
  │                                                               │    ├── <Events/>   #events
  │                                                               │    ├── <Schedule/> #schedule
  │                                                               │    └── <Contact/>  #contact
  │                                                               └── <Footer/>
  │                                                                    │
  └─ CSS cascade ◀── index.css (tokens/base)  +  cyberpunk.css (design system & layout)
```

Key characteristics:

- **One mount point.** `main.jsx` is the only DOM entry; there is no hydration or SSR.
- **One render tree.** `App.jsx` is a pure composition root — it holds no state and no logic,
  only imports the theme stylesheet and lays out sections in reading order.
- **Anchor-based navigation.** Each section owns its `id`; the navbar and footer link to those
  ids, so navigation is native browser scrolling with no router or scroll library.
- **Props-down / state-up is unnecessary here** because there are no shared subtrees. The only
  two stateful components (`Hero`, `Events`) keep state local to themselves.

---

## 4. Component responsibilities

| Component | File | Inputs | State | Notes |
| --- | --- | --- | --- | --- |
| `App` | `src/App.jsx` | — | — | Composition root; imports `cyberpunk.css` |
| `Navbar` | `components/Navbar.jsx` | — | — | Static; imports `assets/logo.png`; CTA anchors to `#events` |
| `Hero` | `components/Hero.jsx` | — | `pointer: {x, y}` in % | `onPointerMove` on the section; writes `--pointer-x` / `--pointer-y` custom props that drive the glow follow-cursor effect purely in CSS |
| `About` | `components/About.jsx` | — | — | Fully static copy; stat row + marquee |
| `Events` | `components/Events.jsx` | — | `activeType: 'technical' \| 'nonTechnical'` | Tab switcher; `key={activeType}` on the grid to force a fresh mount/animation per tab |
| `Schedule` | `components/Schedule.jsx` | `schedule` from `data.js` | — | Destructures `[time, title, place]` tuples |
| `Contact` | `components/Contact.jsx` | first entry of each event list | — | Contains internal presentational helper `ContactGroup` |
| `Footer` | `components/Footer.jsx` | — | — | Static; imports `assets/logo.png` |

---

## 5. Data layer

`src/data.js` is the only data source. It exports four things:

| Export | Shape | Consumed by |
| --- | --- | --- |
| `technicalEvents` | `Array<Event>` (6 items) | `Events`, `Contact` |
| `nonTechnicalEvents` | `Array<Event>` (3 items) | `Events`, `Contact` |
| `schedule` | `Array<[time, title, place]>` tuples | `Schedule` |
| `register_link` | `string` (Google Form URL) | `Events` |

**Event record shape**

```js
{
  number: '01',
  name: 'Paper Presentation',
  description: '…',
  meta: 'Solo / duo · 8 min',
  contact: 'tech@zenittrix.in',
  phone: '8234353434',
  inCharge: 'Dr. Anika Rao',
  venue: 'Seminar Hall A',
  rules: ['…', '…'],   // card renders rules[0]; the rest are currently unused
  color: 'blue',        // 'blue' → technical, 'coral' → non-technical (CSS modifier class)
}
```

Because content is decoupled from markup, editing copy is a `data.js`-only change — no component
edits required. The single content gap to be aware of: `register_link` is still the placeholder
`https://forms.gle/your-registration-form-link`.

---

## 6. Styling architecture

Three stylesheets, loaded in cascade order:

1. **`src/index.css`** (imported by `main.jsx`) — base layer. CSS custom properties for text,
   background, border, accent and font stacks, plus `prefers-color-scheme: dark` overrides,
   element resets, and a `#root` frame. Uses native CSS nesting.
2. **`src/cyberpunk.css`** (imported by `App.jsx`) — the actual design system. Loaded after
   `index.css`, so it re-declares `:root` tokens (`--bg`, `--paper`, `--acid`, `--cyan`,
   `--orange`, `--mono`, …), resets `#root` back to full width / left aligned, and holds all
   component styles: navbar, hero, sections, event grid, timeline, contact, footer, plus
   keyframe animations (reveal, scanline, ticker, orbit).
3. **`src/App.css`** — dead file from the Vite template; not imported, safe to delete.

Class naming is plain semantic BEM-ish (`event-card`, `event-card.coral`, `section-kicker`,
`hero-title`, `timeline-row`). Section-level hooks (`.about-section`, `.events-section`, …)
provide scoping.

**Design token summary** (`cyberpunk.css :root`)

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#090b0d` | Page background (near-black) |
| `--paper` | `#eff4f4` | Primary text |
| `--muted` | `#849093` | Secondary text |
| `--line` | `#293034` | Hairline borders |
| `--acid` | `#d8ff3e` | Primary accent |
| `--cyan` | `#43f4dc` | Secondary accent |
| `--orange` | `#ff6846` | Alert / coral accent |

---

## 7. Build, dev, and deploy pipeline

```
npm run dev ────────> vite dev server (HMR, serves index.html + src/ as ES modules)
npm run build ──────> vite build ──> dist/
                       ├── index.html      (hashed asset refs)
                       ├── assets/*.js    (bundled + tree-shaken, content-hashed)
                       ├── assets/*.css   (concatenated: index.css + cyberpunk.css)
                       └── public/*       (favicon.svg, icons.svg copied as-is)
npm run preview ───> serve dist/ locally to validate a production build
npm run lint ───────> eslint .
```

**Docker (production)**

```
Stage 1  node:20-alpine   npm install → npm run build → /app/dist
Stage 2  nginx:alpine    COPY --from=builder /app/dist → /usr/share/nginx/html
                          EXPOSE 80 ; CMD ["nginx", "-g", "daemon off;"]
```

Because the output is a static SPA with no server routes, default Nginx static hosting is
sufficient — no `try_files` fallback or history rewrite is required. Any static host (Nginx,
Caddy, Netlify, Vercel, GitHub Pages) can serve `dist/` directly.

---

## 8. Conventions in use

- ESM everywhere (`"type": "module"`), extensionless relative imports.
- Named exports per component file (`export function Hero()`), default export only for `App`.
- CSS classes only — no inline styles except the two CSS-variable writes in `Hero`.
- External links always get `target="_blank" rel="noreferrer"`.
- Tabs use `role="tablist"` / `role="tab"` + `aria-selected`.
- Images are imported as ES modules so Vite fingerprints and bundles them.
- Event colors are driven by data (`event.color`), not hardcoded per component.

---

## 9. Extension points

| Goal | Where to change |
| --- | --- |
| Edit event / schedule / contact copy | `src/data.js` |
| Point registration at the real form | `register_link` in `src/data.js` |
| Add a page section | Create `src/components/X.jsx`, insert into `App.jsx`'s `<main>`, add `id` + matching anchor link |
| Change theme colors / type | `:root` blocks in `cyberpunk.css` (and `index.css` for the base layer) |
| Add build config (aliases, proxy, base path) | `vite.config.js` |
| Tighten lint rules | `eslint.config.js` |

---

## 10. Known cleanup items

- `src/App.css`, `src/assets/image.png`, and `public/icons.svg` are unused leftovers from the
  Vite starter template.
- `index.html` still has the placeholder `<title>zen_it_trix_v2</title>` — no meta description,
  Open Graph tags, or theme-color are set.
- `register_link` is still a placeholder URL.
- `data.js` stores full `rules[]` arrays but only `rules[0]` is rendered.
- No tests, no CI, and no router — expected for a static landing page, but add CI (build +
  lint) if this becomes a maintained product.