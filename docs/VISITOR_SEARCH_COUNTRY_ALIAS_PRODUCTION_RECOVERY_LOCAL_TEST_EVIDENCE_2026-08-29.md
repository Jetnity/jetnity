# Jetnity – Visitor Search Country Alias Production Recovery – Local Evidence

Stand: 29. August 2026  
Implementation head before this stamp: see git; this file is committed with the typecheck-narrowing fix.  
Baseline / merge-base: `2241e349f8b3b400963cf1de11e5a8617bdc8e44`

> Live-Evidence gewinnt. CI-/Vercel-IDs auf dem Stamp-Head müssen live neu gelesen werden.

## Live Production auf `main @ 2241e349` – reproduziert

`GET https://jetnity-app.vercel.app/api/search/places` HTTP 200:

| q | index 0 | index 1 | index 2 |
| --- | --- | --- | --- |
| `Peru` | Peru (city) | Peru (city) | Republic of Peru (country) |
| `China` | China (city) | China (city) | People’s Republic of China (country) |
| `Schweiz` | Switzerland (country) | Schweizer-Reneke (city) | — |

Damit ist der vorherige TL-PASS von PR #172 weiterhin invalidiert.

## Lokal auf diesem Recovery-Head

| Gate | Ergebnis |
| --- | --- |
| Gezielte Ortssuche + Route-Lauf | 33/33 pass |
| `npm test` | **2581/2581 pass** |
| `npm run typecheck` | pass nach Narrowing von `schluesselwoerter` |
| `npm run lint` | 0 errors / 135 warnings |
| `check:dead` | pass (1 begründetes CookieConsent-Orphan) |
| `check:exports` | pass (0 unbenutzte Exporte) |
| `check:deps` | pass |
| `check:api-schutz` | pass (12 Admin-Routen) |
| `check:schema-bezug` | pass |
| `npm run build` | Next.js 16.3.3 Turbopack Production-Build pass |
| `npm ci` | nicht erneut; vorhandenes `node_modules` plus grüne Gates |
| Browser / Real-Device / Mobile Safari | **nicht gelaufen** |
| Preview-GET | nach Exact-Head-Preview live prüfen; SSO kann den Public-GET verhindern |

## Exact-Head Automation

Noch nicht auf diesem Stamp-Head. Vorheriger Push `99578638` wird durch diesen Stamp invalidiert. IDs live am PR #173 lesen.
