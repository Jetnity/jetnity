# Jetnity – TW7-A Runtime Status

Stand: 27. August 2026  
Auftrag: GitHub Issue #103  
Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md` (ADR-0176)  
Status: **TW7-A Runtime in Draft-PR. Nicht auf `main`. Kein Ready. Kein Merge.**

> Live-`main` ist die Integrationswahrheit. Der Draft-Head dieses Runtime-PRs ist Evidence des offenen Slices, keine kanonische Live-Baseline.

## 1. Live-Baseline vor diesem Runtime-Slice

Live geprüft gegen `origin/main`, nicht gegen Chat-Erinnerung:

| Fakt | Wert |
| --- | --- |
| `origin/main` | `963186f4ec75501efd253a287131f464a5fd0fdb` — `Merge PR #102: Admin AAL2 production apply gate closure` |
| Branch dieses Slices | `cursor/tw7-a-hub-card-identity-a4c4` von genau diesem `origin/main` |
| Alter Spec-Branch `cursor/tw7-hub-gap-slice-b13d` | historische PR-#100-Evidence, **nicht** Basis |

Frühere Continuity-Zeilen mit `beaef64a` (PR #98) bleiben historische Evidence vor PR #102.

## 2. Was dieser Slice tut

Read-only Hub-Kartenidentität:

- `TripSummary.stages` trägt `name` + `position` aus vorhandenem `trip_stages`
- `reisenLaden()` liest `trip_stages(name, position)` über bestehendes `lese()` / Anon-Key / RLS
- `stageCount` = Länge der gelesenen Menge
- `reiseOrte()` ist die gemeinsame Presentation-Derivation für Hub-`Reisekarte` und Workspace-Übersicht
- Gast-`tripAlsUebersicht` liefert dieselben Stages und `itemCount = days.items + ohneTag`

Sichtregel unverändert: `Ziel noch offen` / `Name · Name` / `… · ab {origin}`.

## 3. Was dieser Slice nicht tut

Kein Schema, keine Migration, kein RLS-/Auth-/AAL-/Production-Write, keine Service Role.
Kein AP-3-/AP-4-/AP-7-Umbau. Kein Guest-One-Trip-/Create-/`/planen`-Umbau.
Kein Account-Übersicht-Klon. Kein Attention/Coverage/Preis/Commercial.
Keine Place-IDs, Koordinaten, Transit- oder Flight-Ziele in der Listenabfrage.
Kein Search, Homepage, Direction A, TW-8/TW-9, S5-B.
Kein Ready, kein Merge durch den Autoren-Agenten.

Wenn der embedded `trip_stages(name, position)`-Read unter bestehendem RLS zur Laufzeit scheitert: STOPP. Nicht umgehen.

## 4. Operativer Stand

- Issue #103: freigegebener Runtime-Slice
- Draft-PR: https://github.com/Jetnity/jetnity/pull/106
- Branch: `cursor/tw7-a-hub-card-identity-a4c4`
- Exact Head live am PR lesen; er ist keine kanonische Live-`main`-Wahrheit
- Autoren-Gates lokal: targeted Tests, `npm test` (2343), Typecheck, Lint, Hygiene, Production-Build
- Unabhängiger vollständiger Finalreview: ChatGPT / Technical Lead
- Nicht auf `main`, solange dieser Review nicht PASS und Merge ausdrücklich entscheidet
- Kein Ready/Merge durch den Autoren-Agenten
