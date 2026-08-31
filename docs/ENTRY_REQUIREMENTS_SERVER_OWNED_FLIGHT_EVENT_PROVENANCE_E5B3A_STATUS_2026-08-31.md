# Entry Requirements E5-B3A – Server-owned Flight Event Provenance – Status

Stand: 31. August 2026  
Status: **IMPLEMENTATION DELIVERED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B3B / KEIN PRODUCTION APPLY**  
Cursor-Agent: **`Jetnity entry requirements event provenance persistence 1`**, Generation 1  
Session: `bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`  
Issue: [#338](https://github.com/Jetnity/jetnity/issues/338)  
Parent: [#294](https://github.com/Jetnity/jetnity/issues/294)  
Branch: `feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/340

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster sicherer Persistenz-/Security-Baustein nach geschlossenem E5-B2A:

1. Eigene server-owned Flight-Event-Provenance neben `trip_items`
2. Exakte Occurrence-Identität: Flight-Item × Leg × Segment × `departure|arrival`
3. Lokale Wanduhr, explizite IANA-Zone und absoluter Instant bleiben getrennte Fakten
4. Owner darf später lesen, aber nicht selbst als Provider-Truth schreiben
5. Privater SECURITY-DEFINER-Write mit geschlossenem/unallocated Production-Runtime-Gate
6. Atomarer Current-Snapshot, damit ein Refresh keine stale Occurrences hinterlässt
7. Event-Ref entsteht nur im Trusted-Write, nicht aus Browser-Input
8. Keine App-/API-Runtime, kein Production-Apply, kein `flugNachweis`

Bindende Regel:

> **Persisted does not mean provider-proven.**

Traveller-Context-Intelligence: **nicht relevant**. Der Slice speichert keine Citizenships, Dokumente oder Residence.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `main@3df9af4d6c3da750d50777706bce03589007a58a` |
| `origin/main` vor Docs-Handoff | `3df9af4d6c3da750d50777706bce03589007a58a` (0 behind) |
| Merge-Base | `3df9af4d6c3da750d50777706bce03589007a58a` |
| Pre-agent PR-Head | `8fec368c1c4d8738e1ffb215247bebe00463628a` |
| Implementation-Commit | `2115fe1703e47bf9d21aba463d5e52d29a71ff9a` |
| Ahead vor Docs-Commit | 4 Commits gegenüber `origin/main` (3 TL-Docs + 1 Implementation) |
| Draft-PR | #340 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR. Der Docs-Commit nach diesem Status verschiebt den Tip; jede frühere Exact-Head-Evidence gilt dann nur noch historisch.

## 3. Bereits umgesetzt

- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`
  - Relation `public.trip_item_flight_event_provenance`
  - Unique-Identität `(trip_item_id, leg_index, segment_index, endpoint)`
  - getrennte Spalten `local_date`, `local_time`, `time_zone`, `event_instant`
  - RLS Owner-SELECT, kein Direct-Write, kein anon
  - Rollen `jetnity_flight_event_writer` / `jetnity_flight_event_runtime` (NOLOGIN)
  - Gate `jetnity_internal.flight_event_write_runtime_gate` default `production_write_path_allocated=false`
  - Writer `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`
  - Vertrag `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot`
  - serverseitiges `occurrence_event_ref` = `jetnity.flight_event.v1:{item}:{leg}:{seg}:{endpoint}:{iata}`
  - atomarer DELETE-all + INSERT des Current-Snapshots
  - Writer lehnt Writes ab, solange das Runtime-Gate geschlossen/unallocated ist
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`: 15 Repository-Vertragsregressionen

Nicht angefasst: `lib/flights/*`, `lib/readiness/*`, `lib/route/*`, API/Workspace, `types/supabase.ts`, `package.json`, Commercial-Provenance-Relation, `trip_items.metadata`.

`flugNachweisAusUmgebung()` bleibt `null`.  
`requirementsProviderAus()` bleibt `null`.

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Production-Migration / live RLS / Grant / Role / Function
- Runtime-/Login-Principal
- App-/API-Writer, Backfill, echte Datenmutation
- `flugNachweisAusUmgebung()` / Provider-/Secret-/paid-call-Aktivierung
- Timezone/Event-Felder in `FlugSegment`, `FlugOption`, Browser oder Route-Metadata
- Trip/Route → OfficialTemporalAnchor
- E5-A-Autobindung
- Deadline / Task / Reminder / Notification
- Credential-Ranking
- erzeugte Supabase-Typen als Live-Vortäuschung
- lokales PostgreSQL-Execute der neuen Migration
- ADR/ARCHITECTURE/ROADMAP-Nachzug
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md`
- E5-B3B oder anderer Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieser Session auf Implementation-Head `2115fe17...` plus nachfolgendem Docs-Commit. Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts` | **15/15 pass** |
| `npm test` | **3004/3004 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine in den neuen Dateien) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI / Vercel Preview auf Docs-Head | ausstehend; nicht als Exact-Head-Evidence behauptet |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Scope) |
| Production Apply | **nicht ausgeführt** |
| Live Supabase-Mutation | **nicht ausgeführt** |

## 6. Production / Runtime-Beweis

Diese Session hat **nicht** ausgeführt:

- `supabase db push` / `apply_migration`
- `npm run db:anwenden`
- live GRANT/ROLE/FUNCTION/DML
- Runtime-Principal-Zuweisung
- App-/API-Aufruf des neuen Writers

Zusätzliche Repo-Evidence:

- `types/supabase.ts` enthält `trip_item_flight_event_provenance` nicht
- `supabase/config.toml` exponiert `jetnity_internal` nicht
- Diff gegen `main` für `lib/flights/*`, `lib/readiness/*`, `lib/route/*`, `package.json` ist leer
- GitHub CI wendet keine Supabase-Migrationen an

Eine Repository-Migration allein verändert Production nicht.

## 7. Risiken / Residuals

- Der Writer ist bewusst tot, solange das Gate geschlossen bleibt. Das ist Slice-Zweck, nicht ein Defekt.
- SQL prüft Zone nur syntaktisch und rechnet Instant nicht gegen lokale Wanduhr. Die spätere Trusted-Mint-Schicht muss E5-B2A weiter als einzige Resolution benutzen.
- Leerer Snapshot ist ein gültiger Current-Satz und löscht alte Zeilen. Ein zukünftiger Writer muss den vollständigen aktuellen Satz senden.
- Kein lokales PostgreSQL-Execute in dieser Session. Der Vertrag ist textlich/strukturell bewiesen, nicht gegen eine laufende Datenbank ausgeführt.
- Agent-Self-Review ≠ Technical-Lead-PASS.
- Production-Apply, Principal-Allokation, echter Writer und Backfill bleiben Product-Owner-Gates.

## 8. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #340 auf dem **finalen** Head. Nicht Ready. Nicht mergen. Keine Production-Migration. Kein E5-B3B/Folgeslice.
