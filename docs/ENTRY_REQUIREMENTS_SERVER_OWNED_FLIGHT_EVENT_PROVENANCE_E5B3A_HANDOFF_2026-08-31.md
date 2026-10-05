# Entry Requirements E5-B3A – Server-owned Flight Event Provenance – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B3B / KEIN PRODUCTION APPLY**  
Cursor-Agent: **`Jetnity entry requirements event provenance persistence 1`**, Generation 1  
Session: `bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`  
Issue: [#338](https://github.com/Jetnity/jetnity/issues/338)  
Branch: `feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/340

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_STATUS_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_SELF_REVIEW_2026-08-31.md`
4. Issue #338 und Parent #294
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`

`docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` sind Technical-Lead-owned und wurden vom Agenten nicht geändert.

## Was ein neuer Chat wissen muss

E5-B3A aktiviert **keinen** Writer, persistiert **nichts auf Production** und bindet **nicht** an E5-A.

Harte Wahrheiten:

1. Die neue Relation heißt `public.trip_item_flight_event_provenance`. Sie steht neben `trip_items`, nicht in `trip_items.metadata`.
2. Commercial Provenance bleibt unberührt. Keine Commercial-Spalten wurden überladen.
3. Eine Zeile ist genau eine Occurrence: Item × `leg_index` × `segment_index` × `departure|arrival`.
4. `local_date` / `local_time`, `time_zone` und `event_instant` sind getrennte Fakten.
5. SQL rechnet keine Zone/DST und hängt kein `Z` an lokale Strings. Instant kommt nur als bereits expliziter RFC3339-`timestamptz` mit Offset/`Z`.
6. `occurrence_event_ref` wird im Writer erzeugt: `jetnity.flight_event.v1:{trip_item_id}:{leg}:{seg}:{endpoint}:{iata}`. Client-`eventRef` wird rejected. Das ist eine Jetnity-Occurrence-ID, **keine** Provider-Source-Referenz.
6a. `external_ref` ist verpflichtend (`NOT NULL`, nonblank 1–200). `provider_belegt=true` ohne konkrete Provider-Referenz ist unmöglich. Fehlendes/leeres `external_ref` wird mit `missing_external_ref` **vor** jedem Snapshot-DELETE abgelehnt.
7. Authenticated darf SELECT, wenn Owner + Flight-Item matchen. Kein INSERT/UPDATE/DELETE. Kein anon.
8. EXECUTE nur `jetnity_flight_event_writer` (NOLOGIN). Nicht `anon` / `authenticated` / `service_role`.
9. Runtime-Gate default `production_write_path_allocated=false` und `allocated_invoker_role=null`. Der Writer wirft `production write path unallocated`, solange das so bleibt.
10. Ein Write löscht zuerst alle Occurrences des Items und inseriert danach den neuen Satz. Leerer Satz ist gültig und hinterlässt keine stale Zeilen.
11. `types/supabase.ts` wurde absichtlich nicht aktualisiert. Die Relation existiert nicht live.
12. `flugNachweisAusUmgebung()` und `requirementsProviderAus()` bleiben `null`.
13. **Persisted does not mean provider-proven.**
14. Product-Owner-Gate vor jedem späteren Production-Apply, Principal-Grant, echten App-Write oder Backfill.

## Duplicate-/Integration-Entscheidung

| Baustein | Entscheidung |
| --- | --- |
| `public.trip_item_commercial_provenance` | Sicherheitsmuster wiederverwendet, Felder nicht überladen |
| `trip_items.metadata` | bleibt owner-writable und untrusted |
| `lib/flights/domain.ts` / `provider.ts` / `airport-event-instant.ts` | bewusst unverändert |
| `lib/flights/nachweis.ts` | `flugNachweisAusUmgebung()` bleibt `null` |
| `lib/readiness/temporal-projection.ts` | E5-A bleibt unverbunden |
| `types/supabase.ts` | nicht als Live-Relation vorgetäuscht |
| App/API/Workspace | keine Runtime-Integration |

## Dateien

Agent-Implementation:

- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`

Delivery-Docs:

- dieser Handoff
- Status
- Self-Review

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `lib/flights/*`, `lib/readiness/*`, `lib/route/*`, `lib/commercial-provenance/*`, `types/supabase.ts`, `package.json`, `scripts/db/*`.

Die Diffs von `JETNITY_START_HERE.md` / `docs/ACTIVE_WORK_STATUS.md` / Task gegen `main` stammen aus den TL-Vorbereitungscommits, nicht aus dieser Agenten-Session.

## origin/main vor Handoff

Erneut gelesen: `origin/main` = `3df9af4d6c3da750d50777706bce03589007a58a`.  
Merge-Base identisch. Behind: 0. Ahead vor diesem Docs-Commit: 6. P2-Fix-Head: `f918dc0e...`. Früherer Review-Head `79dda759...` ist historische Evidence.

Kompletter Diff gegen `origin/main` (Namen):

- `JETNITY_START_HERE.md` (TL)
- `docs/ACTIVE_WORK_STATUS.md` (TL)
- `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md` (TL)
- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`

plus die drei Agent-Delivery-Docs nach diesem Commit.

## Residuals

- Kein lokales PostgreSQL-Execute der Migration. Repository-Vertragstests beweisen den SQL-Text, nicht eine laufende Datenbank.
- SQL validiert IANA nur syntaktisch. Die spätere Mint-Schicht muss weiter `airportTimezoneIdentifierLesen` + E5-B2A-Instant-Resolution benutzen.
- Der Writer ist nach einem späteren Production-Apply immer noch geschlossen, bis Gate und Principal allokiert sind.
- Folgeslice nur nach TL-PASS, neuem versionierten Auftrag und – bei Production-Wirkung – Product-Owner-Gate.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review auf dem **neuen** Head. Nicht Ready. Nicht mergen. Keine Production-Migration. Kein E5-B3B.
