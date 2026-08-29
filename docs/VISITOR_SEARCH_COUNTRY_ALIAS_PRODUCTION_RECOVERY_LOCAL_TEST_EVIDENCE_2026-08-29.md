# Jetnity – Visitor Search Country Alias Production Recovery – Local Evidence

Stand: 29. August 2026  
This stamp is the TL-`5057811180` selective Exact-Token retrieval fix.  
Baseline / merge-base: `2241e349f8b3b400963cf1de11e5a8617bdc8e44`

| Gate | Ergebnis |
| --- | --- |
| Gezielte Ortssuche + Route-Lauf + Suchliste | **42/42 pass** |
| `npm test` | **2588/2588 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors / 135 warnings |
| Hygiene (dead/exports/deps/api-schutz/schema-bezug) | pass |
| `npm run build` | Next.js 16.3.3 pass |
| Browser / Real-Device / Mobile Safari | **nicht gelaufen** |
| Preview-GET | nach Exact-Head live prüfen; SSO kann blockieren |

Stadt-Query-Regression: 240 Länderzeilen im Pool, Exact-Filter überträgt 0. 2-Zeichen-Lärm-Test bleibt grün.

Kosten: keine laufenden. Extra-Read ist gefilterte Länder-Selektion.

Dieser Stamp erzeugt einen neueren Head. CI/Vercel live am PR prüfen.
