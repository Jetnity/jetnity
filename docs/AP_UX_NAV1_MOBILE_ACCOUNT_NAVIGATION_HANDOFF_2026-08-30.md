# Jetnity – AP-UX-NAV1 Mobile Account Navigation Rail Handoff

Stand: 30. August 2026  
Status: **AUTHORING COMPLETE / LOCAL GATES GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

## What is finished

AP-UX-NAV1 ersetzt das mobile 2×2-Account-Grid durch eine einzeilige native Tab-Leiste und hält die gemeinsame Account-Navigation auf authentifiziertem `/reisen` sichtbar, ohne die öffentliche Gästefläche zu verändern.

Binding bleibt:

> Dieselbe Route. Dieselbe `auth.getUser()`-Aussage. Keine zweite Account-Wahrheit.

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/229 |
| Branch | `feat/account-nav-rail-consistency-2026-08-30` |
| Baseline / `origin/main` | `0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9` |
| Behind `origin/main` | **0** zum Slice-Start |
| Cursor-Agent | `Account plattform audit vorbereitung 20` |
| Cloud-Run | https://cursor.com/agents/bc-c734aa63-1027-4fe3-b458-d0c24661b281 |
| Gated implementation head | `d23758f64d11ab3479294ac1a4b354a3d219d8f0` |
| Exact Head | live an PR #229 prüfen; Runtime/UI ist der gated head oben |

## Scope proof

Vorhanden:

- Rail-Markup ohne `grid-cols-2`
- Reihenfolge Übersicht → Reisen → Reisende → Einstellungen
- `/reisen` rendert `AccountNavigation` nur bei `angemeldet`
- Tests für Order, Active-State, Scroll-Delta, Markupvertrag, Auth-Reuse

Abwesend / nicht angefasst:

- Route-Migration
- Auth/Session/MFA/AAL/RLS/Schema
- TA-DL1 Lifecycle-Dateien
- globale Continuity-Dateien
- Country-Picker / neue Account-Ziele

## Tests / Build

Lokal verifiziert:

- `npm test` 2718/2718
- Typecheck, Lint (0 errors), Hygiene, Production Build
- Chromium: einzeilige Rail 280/360/1280; letzter Tab erreichbar; Gast-`/reisen` ohne Konto-Nav

Exact-head remote gates on `d23758f64d11ab3479294ac1a4b354a3d219d8f0`:

- GitHub Actions [`33281797775`](https://github.com/Jetnity/jetnity/actions/runs/33281797775) **SUCCESS**
- Vercel Preview **Ready / SUCCESS** (`9ymUnYwBAzUi9iT5vANXNsEoewPs`, deployment `6161374151`)
- Preview: https://jetnity-app-git-feat-account-nav-rail-c-e28a65-jetnity-e1b93c82.vercel.app

Nicht verifiziert:

- authentifizierter Browser-Durchlauf auf `/reisen`
- Real-Device-Swipe

## Review protocol

1. Exact Head / Diff / Merge-Base gegen aktuelles `origin/main` prüfen.
2. Nur die AP-UX-NAV1-Dateien reviewen; TA-DL1 nicht in diesen Slice ziehen.
3. GitHub Actions + Vercel Preview auf dem exact head prüfen.
4. 0 unresolved review threads.
5. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

Jeder neue Code-Commit invalidiert frühere exact-head gates.

## Residuals / Empfehlungen

1. Technical Lead oder Product Owner: einmal authentifiziert auf Preview `/reisen` klicken und prüfen, dass `Reisen` aktiv ist.
2. Optional Real-Device: horizontal wischen, ohne Seiten-Overflow und ohne Swipe-Navigation.
3. Kein Folgeslice aus diesem Agenten.
