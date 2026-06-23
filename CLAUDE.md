# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LEXA IA — a legislative intelligence dashboard for the Congreso del Estado de México (Edomex). It's a single-page React app, originally scaffolded and iterated on inside Google AI Studio, that lets users explore legislative "expedientes" (bills/initiatives), legislators, an interactive district map, and run Gemini-powered AI analysis (search summaries, vote-impact charts, a legislative drafting "copilot"). User accounts, history, saved items, and alert subscriptions are persisted to Firebase/Firestore.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server on port 3000 (`--host=0.0.0.0`)
- `npm run build` — production build (Vite)
- `npm run preview` — preview the production build
- `npm run lint` — type-check only (`tsc --noEmit`); there is no separate lint config (no ESLint)
- `npm run clean` — remove `dist/`

There is no test suite/runner configured in this repo.

### Environment

- `GEMINI_API_KEY` must be set in `.env.local` (gitignored; `.env.example` documents the expected vars). In AI Studio deployments this is injected automatically from the Secrets panel; locally you must set it yourself for Gemini calls to work.
- Vite's `vite.config.ts` reads `GEMINI_API_KEY` from the env and inlines it into the client bundle via `define: { 'process.env.GEMINI_API_KEY': ... }` — it is **not** a server-side secret, it ships to the browser. Don't move other secrets into this pattern.
- `firebase-applet-config.json` (repo root) holds the Firebase Web SDK config (apiKey, projectId, etc.) consumed by `src/firebase.ts`. These are public client identifiers by design (Firebase security is enforced by `firestore.rules`, not by hiding this file).

## Architecture

This is effectively a **monolithic single-file frontend**: almost all UI, view routing, and business logic lives in `src/App.tsx` (~3300 lines). There is no router library — navigation is a `currentView` state string (`'landing' | 'dashboard' | 'explorar' | 'copilot' | 'alertas' | 'mapa' | 'perfil'`) switched over near the bottom of the `App` component, with `selectedExpediente` / `selectedLegislator` used as a secondary "detail view" overlay on top of whatever view is active.

Key pieces inside `App.tsx`:
- **`LandingPage`** — static marketing/splash view shown before `onEnter` flips `currentView` to `'dashboard'`.
- **`CopilotTool`** — the "Copiloto Legislativo" AI tool (factibilidad / constitucionalidad / redacción modes), each mode building a different Gemini prompt.
- **`VoteChart` / `VoteResults`** — renders an SVG donut of vote outcomes; if real vote tallies are all zero, it falls back to a simulated "expected vote by party" projection (`calculateExpectedVoteByParty`) based on party affiliation of the bill's `Promovente`.
- **`MarkdownComponents`** — a custom `react-markdown` code-block renderer that intercepts fenced ` ```json ` blocks with `{"type": "vote_chart", ...}` and renders a `VoteChart` instead of a code block. AI responses are prompted to emit this exact JSON shape when discussing vote outcomes — if you change `VoteChart`'s props or this contract, update the Gemini prompts in `handleAiSearch` accordingly.
- **`exportSummaryToPDF`** — a substantial DOM-snapshot-to-PDF pipeline (`html2pdf.js` + `html2canvas` + `jspdf`) that clones the live DOM, strips unsupported CSS color functions (`oklch`/`oklab`/etc., which `html2canvas` can't parse — this is why Tailwind v4's default oklch colors get rewritten to rgb before rendering), injects print-specific CSS overrides, hides interactive chrome, and manually draws a paginated header/footer/logo onto the generated PDF. Any new view meant to be exportable needs to be inside the `contentRef` wrapper and may need additional selectors added to this sanitization step.
- **Auth & user data** — Firebase Auth (Google/GitHub popup sign-in) drives a `users/{uid}` Firestore document (schema documented in `firebase-blueprint.json` and enforced in `firestore.rules`). On first sign-in the app creates the doc; subsequent loads hydrate `userHistory`, `savedExpedientes`, `savedLegisladores`, `subscribedExpedientes`, `alertKeywords` into local state. All four of those "saved/subscribed" lists follow the same toggle pattern: optimistic local `setState` + `updateDoc` with the full new array (not `arrayUnion`/`arrayRemove`) — `trackHistory`/`trackInterest` use `arrayUnion` instead. Keep new user-data mutations consistent with whichever pattern fits, and remember `firestore.rules`' `isValidUser` allow-list of fields must be updated if you add a new top-level field to the user document.
- **AI calls** — all Gemini calls go through `@google/genai`'s `GoogleGenAI` client instantiated inline (`new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`) at the call site (`runAnalysis` in `CopilotTool`, `handleAiSearch`, and the initial-summary effect for a selected expediente), using `gemini-3-flash-preview`. There's no shared AI client/service module — prompts are large hard-coded Spanish-language strings built per call site.

Supporting modules (outside `App.tsx`):
- `src/firebase.ts` — initializes the Firebase app/Firestore/Auth singletons from `firebase-applet-config.json`.
- `src/components/EdomexMap.tsx` — Leaflet map of Edomex's electoral districts. Fetches `/edomex_distritos_simplified.json` (served from `public/`) at runtime, colors each district by its legislator's party color (`legisladores[districtId - 1]` — **district GeoJSON `district_id` is assumed to map 1:1 to index+1 in the `legisladores` mock array**, so the two data sources must stay in sync), and reports click/hover district selection up via callback props.
- `src/data/mockData.ts` — all "real" content is mock/demo data: `expedientes` (bills), `legisladores` (legislators), `alertas`, `kpis`, `votaciones`, `resumenesSemanales`. There is no backend API for this content; it's a static, hand-authored dataset checked into the repo. Treat this as the seam where a real legislative data API would eventually plug in.
- `src/data/legisladorFotos.ts` / `src/data/districtMunicipalities.ts` — auxiliary lookup data (legislator photos, district→municipality names) keyed to line up with `mockData.ts`'s `legisladores`.
- `src/assets/landing_image.ts` — base64-inlined images (`landingBase64`, `logoBase64`) used by `LandingPage`, avoiding extra network requests for the splash screen.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 uses CSS-based config; check `src/index.css` for `@theme`/custom utility definitions like `.card-3d`). Recharts and a hand-rolled inline SVG (in `VoteChart`) are both used for charts — recharts for `BarChart`/`PieChart` elsewhere in the dashboard, raw SVG for the donut vote gauge.

### Path aliases

`tsconfig.json` defines `@/*` → repo root, but it's not wired into `vite.config.ts`'s `resolve.alias`, so it currently has no effect on the actual build — don't rely on `@/` imports working at runtime unless you also add the matching Vite alias.

### Firebase/Firestore

- `firestore.rules` is the source of truth for what's writable: users can only read/write their own `users/{uid}` doc, `email`/`uid` are validated, and `hasOnlyAllowedFields` enforces a closed field list. Adding any new field to the user document requires updating this allow-list or writes will be rejected.
- `firebase-blueprint.json` documents the intended Firestore entity schema (AI-Studio-specific metadata, not enforced by anything at runtime — keep it in sync with `firestore.rules` manually).
