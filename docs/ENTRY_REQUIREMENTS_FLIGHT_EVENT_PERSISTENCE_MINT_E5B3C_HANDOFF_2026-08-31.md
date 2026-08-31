# Entry Requirements E5-B3C – Server-only Flight Event Persistence Payload Mint – Handoff

Stand: 31. August 2026  
Status: **REVIEW-FIX DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity entry requirements flight event persistence mint 1`**, Generation 1  
Session: `bc-8579f2af-62df-45f3-b15b-d9a1d2d4c180`  
Issue: [#347](https://github.com/Jetnity/jetnity/issues/347)  
Branch: `feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/348

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_STATUS_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_SELF_REVIEW_2026-08-31.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_CLOSED_2026-08-31.md`
5. Issue #347 und Parent #294

`docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` sind Technical-Lead-owned und wurden vom Agenten nicht geändert.

## Was ein neuer Chat wissen muss

E5-B3C aktiviert **keinen** Writer, persistiert **keine** Zeile und bindet **nicht** an E5-A.

Harte Wahrheiten:

1. Der Mint lebt nur in `lib/flight-event-provenance/persistenz.ts`. Er trägt `import 'server-only'` und bleibt Next-/Supabase-/Provider-SDK-frei.
2. Primäre Eingabe ist ausschliesslich `{ tripItemId, optionId, treffer: FlugProviderTreffer }`. Eine freie Client-`FlugOption` plus separat gelieferte Provenance ist kein Beweis.
3. Die selected Option muss eindeutig in `treffer.options` liegen. 0 Treffer → `selected_option_missing`. >1 Treffer → `selected_option_ambiguous`. Kein first-match.
4. Occurrence-Identität ist `optionId + legIndex + segmentIndex + endpoint + IATA`. Country/City/IATA-only-Suche gibt es nicht.
5. `local_date` / `local_time` kommen vom selected Segment-Endpunkt. Departure liest origin+Abflug, Arrival liest destination+Ankunft.
6. `time_zone` kommt aus exakt passender E5-B1R-Evidence. `event_instant` kommt aus exakt passender E5-B2A-Evidence. Die beiden Zonen müssen identisch sein.
7. Duplicate/conflict Evidence fail-closed für die Occurrence und verhindert die ganze Nutzlast. Eine exakte Zeile plus sibling-Coordinate mit anderer IATA ist ebenfalls `ok: false`; der exakte Eintrag wird nicht still gewählt. Fehlende Evidence bleibt explizit `unresolved` und erzeugt keine Fake-Occurrence.
8. Leere proven `occurrences` sind gültig und bewusst kompatibel mit dem späteren Full-Current-Snapshot-Clear.
9. `retrieved_at === observed_at === treffer.retrievedAt`. Payload-Felder wie `retrieved_at` / `observedAt` auf Treffer oder Option ersetzen das nicht. Kein `Date.now()`.
10. `fresh_until` bleibt `null`. Observation ist keine Frischegarantie.
11. TypeScript mintet keine `occurrence_event_ref`. SQL erzeugt sie später serverseitig.
12. `flightEventPersistenzNutzlastIstRohclient()` folgt der E5-B3A SQL Deny-/Allow-List. CamelCase-Clientfelder sind kein Vertrag.
13. `provider_id` und `external_ref` kommen von der selected server-proven Option und folgen den SQL-Längen-/Deny-Grenzen. `leg_index`/`segment_index` bleiben 0..99; mehr als 200 proven Occurrences erzeugen keine Nutzlast. UTC-`event_instant` wird kalendarisch revalidiert, nicht über `Date.parse`-Normalisierung.
14. **Persisted does not mean provider-proven.** Es gibt keinen Write, kein `flugNachweis`, keine Provideraktivierung.
15. Keine neue npm-Dependency. `package.json` ist unverändert.
16. `flugNachweisAusUmgebung()` und `requirementsProviderAus()` bleiben `null`.

## Duplicate-/Integration-Entscheidung

| Baustein | Entscheidung |
| --- | --- |
| `lib/flight-event-provenance/persistenz.ts` | neuer Mint im bestehenden Event-Provenance-Domainordner |
| `lib/flights/provider.ts` | unverändert wiederverwendet; Treffer/B1R/B2A/B3B-Vertrag |
| `lib/flights/domain.ts` | unverändert; lokale Wanduhr bleibt auf dem Segment |
| `lib/flights/airport-event-instant.ts` | nicht importiert; kein zweiter Instant-Resolver |
| `lib/readiness/temporal-projection.ts` | nicht importiert; Abhängigkeit geht nicht rückwärts |
| `lib/commercial-provenance/persistenz.ts` | nur Pattern gelesen; kein Import, kein Commercial-Overload |
| `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql` | bindender Writer-Vertrag; unverändert, unapplied |
| UUID/ISO/IATA-Helfer anderer Domains | nicht importiert; Domain-Grenze bleibt sauber |

## Dateien

Runtime:

- `lib/flight-event-provenance/persistenz.ts`

Tests:

- `lib/flight-event-provenance/persistenz.test.ts`

Delivery-Docs:

- dieser Handoff
- Status
- Self-Review

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `lib/flights/*` ausser Testdaten-Import, `lib/route/*`, `lib/trips/*`, `lib/readiness/*`, `app/api/*`, `supabase/*`, `scripts/db/*`, `types/supabase.ts`, `lib/providers/*`, `lib/commercial-provenance/*`, `package.json`, `ARCHITECTURE.md`, `DECISIONS.md`.

Die Diffs von `JETNITY_START_HERE.md` / `docs/ACTIVE_WORK_STATUS.md` gegen `main` stammen aus den TL-Vorbereitungscommits, nicht aus dieser Agenten-Session.

## origin/main vor Handoff

Erneut gelesen: `origin/main` = `8868f91319f2747ca6f3dc8cb46ab0a40cba417b`.  
Merge-Base identisch. Behind: 0. Ahead vor Docs-Commit: 7.

Kompletter Diff gegen `origin/main` (Namen) vor Docs-Commit:

- `JETNITY_START_HERE.md` (TL)
- `docs/ACTIVE_WORK_STATUS.md` (TL)
- `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md` (TL)
- `lib/flight-event-provenance/persistenz.ts`
- `lib/flight-event-provenance/persistenz.test.ts`

plus die drei Agent-Delivery-Docs nach diesem Commit.

Agent-Diff gegen Pre-agent-Head `0175d156...` (ohne TL-Docs):

- `lib/flight-event-provenance/persistenz.ts`
- `lib/flight-event-provenance/persistenz.test.ts`

## Residuals

- Der Mint hat keinen App-/API-Caller und ruft den privaten Writer nicht auf.
- `ok: true` + partial/empty `occurrences` darf ein späterer Writer nicht automatisch als vollständigen Current-Snapshot behandeln.
- Host-Uhr bleibt die E5-B3B-Quelle; der Mint kopiert sie nur.
- Kein Browser-/Real-Device-Abnahmebeweis, weil keine UI.
- Lokale Gates auf Review-Fix-Head `2da9e758` waren grün; der Docs-Commit erzeugt einen neuen Head und invalidiert diese Exact-Head-Evidence.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review auf dem **neuen** Head. Nicht Ready. Nicht mergen. Kein Writer / Runtime-Principal / Production-Apply.
