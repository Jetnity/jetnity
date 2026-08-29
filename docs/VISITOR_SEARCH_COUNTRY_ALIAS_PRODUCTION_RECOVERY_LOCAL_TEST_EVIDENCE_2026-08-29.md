# Jetnity – Visitor Search Country Alias Production Recovery – Local Evidence

Stand: 29. August 2026  
Implementation head before CI: see git; this stamp is the TL-`5057757711` country-universe retrieval fix.  
Baseline / merge-base: `2241e349f8b3b400963cf1de11e5a8617bdc8e44`

> Live-Evidence gewinnt. CI-/Vercel-IDs auf dem Stamp-Head müssen live neu gelesen werden.

## Live Production auf `main @ 2241e349`

Peru/China weiterhin Städte vor Land; Schweiz korrekt. Geteiltes Alias `Congo` auf CD/CG. Kurze Exact-Tokens existieren mehrfach; Substring-Kandidaten liegen weit über 12.

## Lokal auf diesem Recovery-Head

| Gate | Ergebnis |
| --- | --- |
| Gezielte Ortssuche + Route-Lauf + Suchliste | **41/41 pass** |
| `npm test` | **2587/2587 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors / 135 warnings |
| `check:dead` | pass |
| `check:exports` | pass |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass |
| `npm run build` | Next.js 16.3.3 Turbopack Production-Build pass |
| Browser / Real-Device / Mobile Safari | **nicht gelaufen** |
| Preview-GET | nach Exact-Head-Preview live prüfen; SSO kann den Public-GET verhindern |

Neutraler Retrieval-Beweis: 2-Zeichen-Alias hinter 15 Substring-Lärmländern, beide Exact-Länder vor der Stadt. Runtime ohne Allowlist.

## Kosten

Keine neuen laufenden Kosten. Zusätzlich eine bounded `typ = country`-Lesung bis 500 Zeilen pro Zielsuche.

## Exact-Head Automation

Dieser Stamp erzeugt einen neueren Head. CI/Vercel live am PR prüfen.
