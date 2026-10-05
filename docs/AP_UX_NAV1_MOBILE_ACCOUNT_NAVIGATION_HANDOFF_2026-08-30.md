# Jetnity – AP-UX-NAV1 Mobile Account Navigation Rail Handoff

Stand: 30. August 2026  
Status: **REVIEW-FIX COMPLETE / LOCAL GATES GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

## What is finished

AP-UX-NAV1 bleibt die einzeilige native Account-Tab-Leiste plus `/reisen`-Konsistenz. Der TL-Review-Fix entfernt `touch-pan-x`, damit eine auf der Rail begonnene Geste die Seite auf iPhone weiter vertikal scrollen kann.

Die Branch ist auf `main @ 20c203f5bee950b43db611f220c7cc5b88699dcb` reconciled. Der PR-Diff enthält weiterhin nur AP-UX-NAV1.

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/229 |
| Branch | `feat/account-nav-rail-consistency-2026-08-30` |
| Reconciled `origin/main` | `20c203f5bee950b43db611f220c7cc5b88699dcb` |
| Behind `origin/main` | **0** |
| Cursor-Agent | `Account plattform audit vorbereitung 20` |
| Cloud-Run | https://cursor.com/agents/bc-c734aa63-1027-4fe3-b458-d0c24661b281 |
| Exact Head | live an PR #229 prüfen |

## Scope proof

Vorhanden: Rail ohne `grid-cols-2`, ohne `touch-pan-x`, ohne Sticky; `/reisen` nur bei `angemeldet`.

Abwesend: Route-Migration, Auth/MFA/AAL/RLS/Schema, TA-DL1-Dateien im PR-Diff, globale Continuity-Dateien.

## Tests / Build

Lokal nach Review-Fix + main-Reconcile:

- `npm test` 2741/2741
- Typecheck, Lint (0 errors), Hygiene, Production Build
- Chromium: `touch-action: auto`, einzeilig, letzter Tab erreichbar, Gast-`/reisen` ohne Konto-Nav

Exact-head CI/Vercel: nach finalem Push dieses Review-Fix-Stamps am live Head prüfen. `ce535668` ist nicht mehr der reviewbare Head.

## Review protocol

1. Exact Head gegen `origin/main @ 20c203f5` prüfen (0 behind, nur AP-UX-NAV1-Dateien).
2. `touch-pan-x` darf nicht zurückkommen.
3. GitHub Actions + Vercel Preview auf dem exact head.
4. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

## Residuals

1. Authentifizierter Preview-Klick auf `/reisen`.
2. Optional Real-Device: vertikal scrollen, wenn die Geste auf der Rail beginnt; horizontal nur natives Overflow.
3. Kein Folgeslice.
