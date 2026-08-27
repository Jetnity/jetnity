# Jetnity – TW7-A Runtime Status

Stand: 27. August 2026  
Auftrag: GitHub Issue #103  
Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md` (ADR-0176)  
Status: **TW7-A Runtime integriert. PR #106 ist das Integrationsvehikel. Issue #103 ist CLOSED / completed.**

> Live-`main` immer live prüfen. Keine bewegliche Exact-Head-SHA als kanonische Live-Wahrheit.

## 1. Historische Start-Evidence

Ausdrücklich historisch, nicht aktueller Live-Stand:

| Fakt | Wert |
| --- | --- |
| Start-Baseline vor TW7-A | `963186f4ec75501efd253a287131f464a5fd0fdb` — `Merge PR #102: Admin AAL2 production apply gate closure` |
| Runtime-Branch | `cursor/tw7-a-hub-card-identity-a4c4` von genau dieser Start-Baseline |
| Alter Spec-Branch `cursor/tw7-hub-gap-slice-b13d` | historische PR-#100-Evidence, **nicht** Basis |

Ältere Sätze „TW7-A Runtime ist Draft-PR #106 / nicht auf `main` / live main bleibt `963186f4`“ sind **historische Pre-Merge-Evidence**.

Frühere Continuity-Zeilen mit `beaef64a` (PR #98) bleiben historische Evidence vor PR #102.

## 2. Kanonischer Endzustand

Nach Landung von PR #106:

- Hub-`Reisekarte` und Workspace-Übersicht teilen dieselbe geordnete Zielidentität.
- `TripSummary.stages` trägt `name` + `position` aus vorhandenem `trip_stages`.
- `reisenLaden()` liest `trip_stages(name, position)` über bestehendes `lese()` / Anon-Key / RLS.
- `stageCount` = Länge der gelesenen Menge.
- `reiseOrte()` ist die gemeinsame Presentation-Derivation.
- Gast-`tripAlsUebersicht` liefert dieselben Stages und `itemCount = days.items + ohneTag`.
- Sichtregel: `Ziel noch offen` / `Name · Name` / `… · ab {origin}`.

Issue #103 ist CLOSED / completed. Das ist kein automatischer Folgeslice.

## 3. Was dieser Slice nicht tut

Kein Schema, keine Migration, kein RLS-/Auth-/AAL-/Production-Write, keine Service Role.
Kein AP-3-/AP-4-/AP-7-Umbau. Kein Guest-One-Trip-/Create-/`/planen`-Umbau.
Kein Account-Übersicht-Klon. Kein Attention/Coverage/Preis/Commercial.
Keine Place-IDs, Koordinaten, Transit- oder Flight-Ziele in der Listenabfrage.
Kein Search, Homepage, Direction A, TW-8/TW-9, S5-B.

Wenn der embedded `trip_stages(name, position)`-Read unter bestehendem RLS zur Laufzeit scheitert: STOPP. Nicht umgehen.

## 4. AAL2-Wahrheit, unverändert

- PR #102 integriert.
- Production `20260827170000_admin_aal2_data_plane_alignment` angewendet und verifiziert, exakt einmal.
- `aktuelles_admin_aal2()` live.
- Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2.
- Kein zweiter Apply.
- Historische Dateien `20260826090000` und Development-`20260826052735` bleiben unangewendet.
- Ältere Sätze „Production-AAL2-Apply bleibt ein Gate“ sind Pre-Apply-Evidence.
