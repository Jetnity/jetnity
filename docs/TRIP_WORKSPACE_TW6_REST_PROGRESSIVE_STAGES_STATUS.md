# Jetnity – TW6-B Runtime – Progressive Ziele + Day→Stage Truth Contract – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: `docs/TRIP_WORKSPACE_TW6_DAY_STAGE_TRUTH_CONTRACT_TASK.md`  
Status: **IMPLEMENTIERT / AWAITING TECHNICAL-LEAD FINALREVIEW**

Kein Ready. Kein Merge. Kein TW-7/TW-8/TW-9. Kein Folgeslice.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Live-Baseline

Live geprüft, nicht aus dem Prompt übernommen.

| Fakt | Wert |
| --- | --- |
| Live `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Merge-Base mit PR-Head | `9e1868ea2b78b714e1c2f3ea1e1e2fd8ed5b6ae6` |
| Exact Head | `e3300f75172f775b9da018290aa459ddec7eefea` |
| Task-Commit (Handoff) | `a2ccb51474613d0f937a5b05da5fd92f31cc3c30` |
| Ahead / Behind vs `origin/main` | **9 / 2** |
| Offene parallele Draft-PRs | #52, #50, #40, #39, #28 |
| Shared-Contract-Kollision | keine offenen PRs treffen `zuordnung`, `reise_anlegen`, Timeline, Day-Stage-Assignment oder Trip-Schema |

`main` ist nach dem Task-Commit um zwei **reine Dokument-Commits** weitergelaufen:

- `e1aea302` `docs: bind Cursor agent session rotation and naming`
- `1d558ef5` `docs: make agent rotation standard mandatory for future chats`

Betroffene Dateien: `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`, `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.  
Kein Runtime-, Schema- oder Shared-Contract-Konflikt. Dieser Slice wurde **nicht** auf den neuen `main` rebase't, damit Exact-Head-CI/Vercel auf `e3300f75` erhalten bleiben.

## 2. Finaler Assignment-Contract

Spalte: `public.trips.day_stage_assignment_source`  
Guest-Feld: `Trip.dayStageAssignmentSource`  
Ableitung: `lib/trips/day-stage-assignment.ts` + dieselbe Semantik in `public.reise_anlegen()`

| Wert | Bedeutung | Fallback | Wer setzt ihn |
| --- | --- | --- | --- |
| `legacy_fallback` | historischer Bestand / Legacy-Transfer mit bereits gesetzten Tagespositionen | ja, proportional | Migration-Default für Altbestand; Server nur wenn Positionen schon da sind |
| `unassigned` | mehrere bestätigte Ziele, keine Nutzerzuordnung | **nein** | Create bei >1 Stage; SQL wenn keine `stage_position` |
| `single_destination` | genau ein Ziel | Tage dürfen der einen Stage gehören | Create bei 1 Stage; SQL bei `stage_count <= 1` |
| `user` | reserviert für spätere explizite Bestätigung | nein | **in diesem Slice nicht setzbar** |

Fail-closed:

- Client-`user` wird ignoriert und nie persistiert.
- Client-`legacy_fallback` ohne gesetzte Tagespositionen wird zu `unassigned`.
- Client-`single_destination` bei mehreren Stages wird zu `unassigned`.
- Unbekannter Source-Wert in der RPC wird abgelehnt.
- `unassigned` übernimmt keine Client-`stage_position` und überspringt Datums-UPDATE plus proportionalen CTE.

Keine neue Stage-Tabelle. Keine Schattenpersistenz.

## 3. Warum Altbestand kompatibel bleibt

Bestehende Rows erhalten per Default `legacy_fallback`.  
Guest-JSON ohne das Feld liest `legacy_fallback`.  
`tageEtappenZuordnen()` wendet den proportionalen Fallback **nur** bei `legacy_fallback` (und Single-Destination bei genau einer Stage) an.  
Ein globales Abschalten des Fallbacks wurde nicht umgesetzt.

## 4. Guest / Account-Parität

| Pfad | Verhalten |
| --- | --- |
| Guest-Create | `createZieleGraph` setzt `unassigned` bzw. `single_destination`; Tage bei Multi-Ziel `stageId = null` |
| Guest-Load | `mitZuordnung` erfindet für `unassigned` keine Zuordnung |
| Account-Create | dieselbe Ableitung; SQL persistiert Source und überspringt den CTE |
| Account-Load | `reiseAus` liest die Spalte; fehlende Spalte (Production) gilt als `legacy_fallback` |
| Guest→Account | `alsNutzlast` sendet Source + `stage_position: null`; SQL leitet erneut fail-closed ab |

Pflichtfall Paris → Rom → Paris, 12.–17. September:

- 3 Stages in Eingabereihenfolge, nicht dedupliziert
- 6 Tage
- alle 6 Tage bleiben unassigned
- Timeline zeigt Ziele ohne Aufenthalt und die 6 Tage unter „Noch keinem Ziel zugeordnet“
- keine 2/2/2-Erfindung

## 5. Migration / Development-Evidence

Artefakt: `supabase/migrations/20260826220000_trip_day_stage_assignment_source.sql`

- ADD COLUMN + CHECK, Default `legacy_fallback`
- `CREATE OR REPLACE public.reise_anlegen(jsonb)`
- keine neue Tabelle, keine Policy-, Grant-, Auth- oder Trigger-Änderung ausser dem bestehenden Function-Replace

**Production-Migration wurde NICHT angewendet.**  
Production-RLS/Ownership wurden nicht geändert.  
Kein Production-SQL, kein `--produktion`.

Development:

- `npm run db:anwenden -- --probe` → `Ziel: entwicklung`
- `db:anwenden` ohne Filter wurde **nicht** ausgeführt, weil `20260826090000_admin_aal2_data_plane.sql` ebenfalls offen war (AAL out of scope)
- Nur `20260826220000_trip_day_stage_assignment_source.sql` gezielt auf Development angewendet
- Spalte existiert: `text not null default 'legacy_fallback'` + CHECK
- Bestehender Development-Trip: 1 Row, Source `legacy_fallback`
- `reise_anlegen` auf Development: überspringt Unassigned, CTE nur bei `legacy_fallback`, ignoriert Client-`user`
- `db:typen` wurde gegen Development ausgeführt; der regenerierte Diff enthielt fremde Traveller-/Foundation-E-Umsortierungen und wurde **nicht** committed
- `db:rechte` PASS, `db:rls` PASS
- `db:sicherheit` 192/223 — restliche Failures sind vorbestehende Admin/AAL-Capability-Proofs der älteren, hier nicht angewendeten AAL2-Datei; Trip-Ownership-Proofs sind PASS. Keine TW-6-B-Regression.

Rollback-Risiko: Function-Replace; Spalte ist additiv mit Default. Rückbau wäre ein späteres Artefakt, das die Spalte nicht droppt, solange Runtime sie liest.

Preview gegen Production-Supabase nutzt weiter die alte `reise_anlegen`, bis Production separat freigegeben wird. Der Guest-Pfad ist localStorage und bereits korrekt. Account-Wahrheit auf Development ist die angewendete Function plus TS/SQL-Contract, nicht ein authentifizierter Paris-Create gegen Production.

## 6. Changed Files

Gegen `origin/main` (`1d558ef5`), Merge-Base `9e1868ea`:

Runtime / Contract

- `lib/trips/day-stage-assignment.ts`
- `lib/trips/day-stage-assignment.test.ts`
- `lib/trips/day-stage-truth-contract.test.ts`
- `lib/trips/create-stages.ts`, `lib/trips/create-stages.test.ts`
- `lib/trips/zuordnung.ts`, `lib/trips/zuordnung.test.ts`
- `lib/trips/schema.ts`, `lib/trips/schema.test.ts`
- `lib/trips/gastspeicher.ts`, `lib/trips/gastspeicher.test.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/abbildung.ts`, `lib/trips/abbildung.test.ts`
- `lib/trips/timeline.ts`, `lib/trips/timeline.test.ts`
- `lib/trips/create-entry.test.ts`
- `lib/places/aktionen.ts`, `lib/places/reiseziele.ts`, `lib/places/reiseziele.test.ts`
- `lib/formular/feldfehler.ts`, `lib/formular/feldfehler.test.ts`
- `types/trips.ts`, `types/supabase.ts`
- `components/trips/TripPlanner.tsx`
- `components/trips/TripWorkspacePlan.tsx`

SQL

- `supabase/migrations/20260826220000_trip_day_stage_assignment_source.sql`

Dokumentation

- `docs/TRIP_WORKSPACE_TW6_DAY_STAGE_TRUTH_CONTRACT_TASK.md` (Task, unverändert seit TL)
- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_TASK.md`
- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md`
- `DECISIONS.md` ADR-0172
- `ARCHITECTURE.md` (Verweis auf ADR-0172)

Nicht geändert: Auth/MFA/AAL, Traveller, Route/Transit, Provider/Commercial, Payments, D0/D1/G0/G1, `ACTIVE_WORK_STATUS.md`, Production.

## 7. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine | — |
| TW6-B-P1-01 | P1 | Automatische 2/2/2-Day→Stage-Erfindung | **Runtime geschlossen, awaiting TL review.** Nicht mergefähig, bis der unabhängige Finalreview PASS sagt. |
| TW6-B-P2-02 | P2 | Guest-Load schrieb Erfindung in Guest→Account | Folge von P1; mit `unassigned` geschlossen |
| TW6-B-P3-01 | P3 | Kein Reorder | unverändert out of scope |
| TW6-B-P3-02 | P3 | `Reiseidee` erzeugt ein Ziel | unverändert out of scope |
| TW6-B-P3-03 | P3 | localStorage kann `legacy_fallback` nachträglich setzen | Gerät-eigenes Tampering; Server lehnt Claim ohne Positionen ab |

## 8. Tests / Gates / CI / Vercel

Lokale Gates auf Exact Head `e3300f75`:

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **2243/2243 PASS** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 warnings |
| `npm run check:dead` | PASS (1 begründetes CookieConsent) |
| `npm run check:exports` | PASS nach Entfernen des ungenutzten Exports |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS, 12 Admin-Routen |
| `npm run check:schema-bezug` | PASS |
| `npm run check:setup:ci` | PASS, 1 Warning: keine `.env` |
| `npm run build` | PASS, Next.js 14.2.32 Production-Build |

Pflichttests: Paris → Rom → Paris 12.–17. September, Single-Destination, Legacy-Fallback, fail-closed `user`/`legacy_fallback`, Timeline, Guest-Load, Guest→Account, Guest-One-Trip und `clientRef` liegen in `lib/trips/day-stage-truth-contract.test.ts` plus bestehender Guest-/Create-Suite.

CI-Historie dieses Slices:

- `7b1b6d43` Actions `33009930044` **FAIL** (`check:exports` wegen ungenutztem Export `istDayStageAssignmentSource`)
- Follow-up `e3300f75` macht den Helper modul-privat
- Exact-Head GitHub Actions **[33010327104](https://github.com/Jetnity/jetnity/actions/runs/33010327104)** **SUCCESS** auf `e3300f75` (Typecheck/Lint/Build + Auth)
- Exact-Head Vercel `8jsrRGp4ZCGwaNAtYR5epABRuiP1` **SUCCESS** / Preview („Deployment has completed“)

**Production-Migration wurde NICHT angewendet.** Kein `--produktion`, kein Production-SQL, keine Production-RLS-Änderung.

## 9. Offene Restpunkte

- Unabhängiger Technical-Lead-Finalreview
- Branch liegt 2 Commits hinter `origin/main` (nur Agent-Rotation-Docs; kein Contract-Konflikt; kein Rebase in diesem Slice)
- Production-Migration **nicht** in diesem Slice
- Preview-Account gegen Production-Supabase sieht weiter die alte RPC, bis Production separat freigegeben wird
- Direction A (explizite Aufenthalte) ist ein eigener späterer Slice

## 10. STOP

**IMPLEMENTIERT / NICHT READY / NICHT MERGEFÄHIG.**

Kein Ready. Kein Merge. Kein Folgeslice. Keine Production-Migration. Keine Aufenthalts-UX.
