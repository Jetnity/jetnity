# Jetnity – D0-1 Index Boundary Contract – Status

Stand: 25. August 2026  
Status: **IMPLEMENTIERT / STOPP für unabhängigen ChatGPT-/Technical-Lead-Review**

Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-1-index-boundary-contract`  
Draft-PR: #70  
Task: `docs/GROWTH_DISCOVERABILITY_D0_1_TASK.md`

Kein Ready. Kein Merge. Kein D0-2/G0-1/D1/G1+.

## 1. Live-Baseline

`main @ 2bb6b8072fa04e8f6db2d989b84ada7b64745fd9`

Enthält PR #69 – D0/G0 Foundation Audit Evidence. Merge-Base gegen `origin/main` = diese Baseline. Behind: 0.

Parallele offene Drafts, nicht in diesem Slice: #52, #50, #40, #39, #28.

Review-Threads auf #70: 0. Reviews: 0. Draft bleibt Draft.

## 2. Root Cause

Der D0/G0-Audit (`docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`) hat bestätigt:

**D0-P1-01.** `/reisen` und `/reisen/[tripId]` liegen unter `(public)` und erbten `robots: { index: true, follow: true }`. Die Sitemap listete `/reisen`. Der Allow-Modus von `robots.ts` disallowte `/account/` und `/admin/`, aber nicht `/reisen`. Production war nur durch den ephemeral-Host-Kill-Switch (`*.vercel.app` → `Disallow: /`) gedämpft, nicht durch einen Index-Boundary-Contract.

**D0-P1-02.** `/planen?idee=` spiegelt Nutzer-/Intent-Text serverseitig ins HTML und war indexierbar. Jede Query-Variante wäre eine eigene öffentliche Seite.

**D0-P2-03.** `/admin/login` (Client-Page ohne Metadata) und `/unauthorized` erbten HTML-`index,follow`. `app/(admin)/admin/head.tsx` war ein totes Pages-Router-Relikt. Das `(admin)`-Gruppenlayout exportierte keine App-Router-Metadata.

Kein neuer Shared Contract war nötig. D0-1 härtet vorhandene Privacy-/SEO-Grenzen. Kein STOPP wegen Contract-Erweiterung.

## 3. Konkrete Änderungen

### Helper / Contract (testbar, keine neue Produkt-Policy)

- `lib/seo/index-grenze.ts`
  - `NICHT_INDEXIEREN = { index: false, follow: false }`
  - `PLANEN_INDEX_PARAMS = ['idee', 'ziel', 'zielId']` – genau die von der Route akzeptierten Params
  - `planenRobots()` setzt nur dann noindex, wenn ein relevanter Param einen nicht-leeren getrimmten Wert hat; sonst `undefined` (öffentliche Basis erben)
  - `SITEMAP_OEFFENTLICHE_PFADE = ['/', '/planen']`
- `lib/seo/robots-regeln.ts`
  - dieselbe Allow-Formel wie zuvor: Production **und** nicht-ephemeral Host **und** `NEXT_PUBLIC_ALLOW_INDEXING !== 'false'`
  - `ROBOTS_DISALLOW_ALLOW_MODUS` behält die alten Schutzpfade und ergänzt `/reisen`, `/reisen/`, `/auth/`, `/unauthorized`
  - localhost / `*.vercel.app` bleibt deny-all
  - Custom-Domain-Indexing wird **nicht** aktiviert

### Surfaces

- `app/(public)/reisen/page.tsx` – explizit `robots: NICHT_INDEXIEREN`
- `app/(public)/reisen/[tripId]/page.tsx` – dasselbe; `GastArbeitsbereich` / `KontoArbeitsbereich` / `istKontoKennung` / `reiseLaden` unverändert
- `app/(public)/planen/page.tsx` – `generateMetadata` setzt robots **nur** bei relevanten Params. Die Basisseite hängt `robots` nicht als `undefined` an, damit Next die geerbte öffentliche `index,follow`-Metadata nicht löscht. UI-`ersterWert` bleibt ohne Trim; sichtbarer Planungsflow unverändert
- `app/(public)/admin/login/layout.tsx` – neues Server-Layout, nur noindex; Client-Page unverändert
- `app/unauthorized/page.tsx` – noindex, nofollow
- `app/(admin)/layout.tsx` – App-Router-Metadata-Grenze `NICHT_INDEXIEREN`; Auth-Gate `requireAdminPage` unverändert
- `app/(admin)/admin/head.tsx` – totes Pages-Router-Relikt entfernt
- `app/sitemap.ts` – nur `/` und `/planen`
- `app/robots.ts` – dünner Wrapper über die Helper; Kill-Switch und Sitemap/Host-Werbung unverändert (D0-P2-01 bleibt D0-2)

## 4. Self-Review (adversarial)

Eingehalten:

- Kein `/privacy` / `/terms`, keine erfundenen Legal-Texte
- Kein Canonical-/Origin-Contract, kein hreflang, kein JSON-LD-Ausbau
- Kein G0 Event-/Attribution-/Consent-/Tracking-/Ads-/CRM
- Keine Homepage-Copy, keine neuen öffentlichen Claims
- Keine DB/Migration/RLS/Auth/MFA/Session/Guest→Account/Traveller/Route/Provider/Payment
- Keine Secrets, keine paid calls, kein Custom-Domain-/Public-Launch, kein TW-6
- Kein neuer Shared Contract

Bewusst offen / nicht überzogen:

- `/planen` bleibt als **Basis** öffentlich. D1 entscheidet später, ob die Fläche selbst indexierbar bleiben soll.
- `/planen?idee=` spiegelt den Text weiter ins HTML (Task: Flow nicht kaputtmachen). Geschlossen ist nur die Indexierbarkeit.
- `robots.ts` wirbt im deny-all weiter Sitemap/Host (D0-P2-01 / D0-2).
- Die Allow-Formel gibt für Production + Apex + nicht-`false` Kill-Switch weiterhin `true` zurück. Das ist die **bestehende** Formel, keine Cutover-Aktivierung. Live-Host bleibt `*.vercel.app` → deny-all.
- Tests sind Source-/Helper-Contracts plus lokale HTML-Emission. Vercel-Preview ist READY, aber Deployment Protection (SSO) blockiert anonyme HTML-Proben.

Lokaler HTML-Gegenbeweis auf `next start` (Production-Build, `http://127.0.0.1:3010`):

| Route | HTTP | robots |
| --- | --- | --- |
| `/reisen` | 200 | `noindex, nofollow` |
| `/reisen/00000000-0000-0000-0000-000000000001` | 200 | `noindex, nofollow` |
| `/` | 200 | `index, follow` |
| `/planen` | 200 | `index, follow` (geerbte öffentliche Basis, nach Inherit-Fix + Rebuild) |
| `/planen?idee=` | 200 | wie Basis (leer zählt nicht) |
| `/planen?idee=Bali+mit+Pass+CH` | 200 | `noindex, nofollow`; Nutzertext bleibt sichtbar |
| `/admin/login` | 200 | `noindex, nofollow` |
| `/unauthorized` | 200 | `noindex, nofollow` |
| `/robots.txt` | 200 | `Disallow: /` (localhost deny-all) |
| `/sitemap.xml` | 200 | nur `/` und `/planen`, kein `/reisen` |

Vor dem Inherit-Fix löschte `robots: undefined` auf `/planen` das geerbte `index, follow`. Geschlossen in `4cdb5612`. Nach Rebuild emittiert die Basisseite wieder `index, follow`.

## 5. Tests

Gezielte D0-1-Contracts: `lib/seo/index-grenze.test.ts`, `lib/seo/robots-regeln.test.ts` – 19/19.

Bewiesen:

1. `/reisen` und `/reisen/[tripId]` setzen `NICHT_INDEXIEREN`; Trip-Logik-Marker bleiben
2. Sitemap-Pfade sind `/`, `/planen`; `/reisen` fehlt in `sitemap.ts`
3. Allow-Modus enthält `/reisen`, `/reisen/`, `/auth/`, `/unauthorized` plus bisherige Schutzpfade
4. `/planen` ohne relevante Params: `planenRobots() === undefined`; mit `idee`/`ziel`/`zielId`: noindex
5. `/admin/login`, `/unauthorized`, `(admin)`-Layout noindex; toter `head.tsx` entfernt
6. localhost / `*.vercel.app` bleibt deny-all; `NEXT_PUBLIC_ALLOW_INDEXING=false` bleibt geschlossen
7. Auth-/Guest→Account-/Trip-Regression: bestehende `lib/auth/naechstes-ziel.test.ts`, `lib/auth/oeffentliche-navigation.test.ts`, `lib/trips/uebernahme.test.ts` plus volles `npm test`

## 6. Lokale Gates (Runtime-Head `873735c8`)

Ausgeführt vor dem Inherit-Fix, Exit 0:

| Command | Ergebnis |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, keine Warnings |
| `npm test` | 0, **2013/2013** (zuvor 1994; +19 D0-1) |
| `npm run check:setup:ci` | 0, 1 bekannte Warning: keine lokale `.env` |
| `npm run check:dead` | 0; 297 Starts, 703 erreichbar, 1 begründete Waise `CookieConsent.tsx` |
| `npm run check:exports` | 0; 596 Dateien, 0 unused |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0; 12/12 |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

Logs: `/opt/cursor/artifacts/d01_gates/`. Lokale HTML-Proben: `/opt/cursor/artifacts/d01_local_html/`.

## 6b. Lokale Gates auf Persist-Tree `04329e13` + Inherit-Fix

Erneut ausgeführt nach Inherit-Fix und Status-Persist, Exit 0:

| Command | Ergebnis |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, keine Warnings |
| `npm test` | 0, **2013/2013** |
| `npm run check:setup:ci` | 0, 1 bekannte Warning: keine lokale `.env` |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0; 12/12 |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

## 7. Exact-Head Evidence

Runtime `873735c8`:

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | Run `32894238716` **SUCCESS** |
| Vercel Preview | **SUCCESS / Ready** – `https://vercel.com/jetnity-e1b93c82/jetnity-app/Ac3GGtHt5iC96npg65ugcwb2h5ri` |
| Preview-URL | `https://jetnity-app-git-fix-d0-1-index-boundary-205908-jetnity-e1b93c82.vercel.app` – anonym SSO-geschützt |
| Ahead / Behind / Merge-Base | damals 3 / 0 / `2bb6b807` |
| Review-Threads | 0 |

Persist-Head dieses Dokuments vor dem letzten Evidence-Nachzug: `04329e13`. Inherit-Fix: `4cdb5612`. Technical Lead prüft den dann aktuellen HEAD live (Actions + Vercel). Ahead/Behind nach Status-Persist: 5 / 0, Merge-Base unverändert `2bb6b807`.

## 8. Geschlossene vs. offene Findings

Geschlossen durch D0-1 (Index-Boundary-Teil):

- D0-P1-01
- D0-P1-02
- D0-P2-03

Bewusst offen, nicht in diesem Slice:

- **D0-P1-03** – `/privacy` und `/terms` sind 404; keine Texte erfinden
- D0-P2-01 – deny-all wirbt weiter Sitemap/Host
- D0-P2-02 – Canonical / `APP_URL` vs `SITE_URL`
- D0-P2-04 – hreflang / Locale
- D0-P2-05 – JSON-LD Foundation
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02

## 9. Runtime / DB / Kosten / Security

- Keine DB-/Migration-/RLS-Änderung
- Keine Auth-/MFA-/Session-/Guest→Account-Änderung
- Keine Traveller-/Route-/Provider-/Payment-Änderung
- Keine Secrets, keine paid calls, keine neuen laufenden Kosten
- Security: HTML-noindex und robots-Disallow für private/sensitive Flächen; kein Credential- oder PII-SSR-Fix nötig (Audit: kein anonymer Account-Trip-Leak)

## 10. Nächster Schritt

**STOPP.**

ChatGPT / Technical Lead führt den vollständigen unabhängigen Review von Anfang an.

Kein Ready. Kein Merge. Kein nächster Slice aus diesem Auftrag.
