# Jetnity – Visitor Search Country Alias Production Recovery – Local Evidence

Stand: 29. August 2026  
Implementation head before CI: see git; this stamp is the TL-`5057687985` disambiguation fix.  
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

Read-only Production `public.places` zeigt ausserdem, dass Token `Congo` auf CD und CG liegt. Zwei ununterscheidbare `Congo · Land`-Zeilen wären der Fund `5057687985`.

## Lokal auf diesem Recovery-Head

| Gate | Ergebnis |
| --- | --- |
| Gezielte Ortssuche + Route-Lauf + Suchliste | **40/40 pass** |
| `npm test` | **2586/2586 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors / 135 warnings |
| `check:dead` | pass |
| `check:exports` | pass |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass |
| `npm run build` | Next.js 16.3.3 Turbopack Production-Build pass |
| `npm ci` | nicht erneut; vorhandenes `node_modules` plus grüne Gates |
| Browser / Real-Device / Mobile Safari | **nicht gelaufen** |
| Preview-GET | nach Exact-Head-Preview live prüfen; SSO kann den Public-GET verhindern |

Neutraler Zwei-Länder-Beweis: `Sylvani` auf Northern Sylvani Federation (NS) und Southern Sylvani Republic (SS). Production-förmig: `Congo` CD/CG. Eindeutiges Alias bleibt `Land`. Runtime enthält keine Allowlist.

## Exact-Head Automation

Dieser Stamp erzeugt einen neueren Head. CI/Vercel/Threads live am PR prüfen. Prior PASS `5057668445` bleibt durch `5057687985` superseded.
