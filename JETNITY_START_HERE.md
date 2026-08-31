# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3A CLOSED / E5-B3B PREPARED / SERVER-ONLY RETRIEVAL TIMESTAMP / NO PRODUCTION APPLY / AGENT NOT YET DISPATCHED / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_TASK_2026-08-31.md` ← **aktiver vorbereiteter Auftrag**
2. `docs/ACTIVE_WORK_STATUS.md`
3. Issue **#343 – E5-B3B server-observed Flight provider retrieval timestamp evidence**
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
6. E5-B1R Closure/Handoff/Task
7. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
8. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
9. `docs/JETNITY_BINDING_BUILD_ORDER.md`
10. `lib/flights/provider.ts`
11. `lib/flights/duffel/adapter.ts`
12. `lib/flights/suche.ts`
13. `lib/flights/airport-event-instant.ts`
14. `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`
15. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. DB-/Security-Annahmen zusätzlich Supabase Production read-only prüfen.

## 2. Aktueller kanonischer main

`main@ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`

Commit:
`Close Entry Requirements E5-B3A continuity (#342)`

Live verifiziert:

- Main CI #1529 / Run `33430799991`: **SUCCESS**;
- Vercel Production auf exakt `ad7fb1fa...`: **SUCCESS**;
- Issue #338: CLOSED / completed;
- Parent #294: OPEN;
- Production Supabase E5-B3A Migration: weiterhin **UNAPPLIED**.

## 3. E5-B3A ist abgeschlossen

Repository vorhanden:

- server-owned Flight Event Provenance persistence/security foundation;
- verpflichtende konkrete `external_ref`;
- exact occurrence identity;
- getrennte local wall clock / timezone / instant;
- private write-authority foundation;
- Runtime-Gate false/unallocated.

Production weiterhin ohne E5-B3A Relation/Function/Gate/Rollen.

## 4. Fresh Precheck für nächsten Slice

Live auf `main@ad7fb1fa...` geprüft:

- `FlugProviderTreffer` trägt `options`, E5-B1R timezone evidence, E5-B2A event-instant evidence/issues;
- es existiert **kein** server-observed Retrieval-/Observation-Timestamp im aktiven FlightProvider-Treffer;
- `lib/flights/duffel/adapter.ts` ist die aktive serverseitige Duffel-Seam und mintet bereits Companion-Evidence;
- `lib/flights/suche.ts` verwirft Companion-Evidence vor Ranking/Browser;
- `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot` existieren nur im E5-B3A SQL-/Test-/Docs-Vertrag, nicht als TypeScript-Mint;
- kein aktuelles offenes Entry-Requirements-Issue dupliziert diesen Retrieval-Zeitfakt.

Schlussfolgerung:

Ein Persistenz-Mint wäre noch zu früh, weil E5-B3A `retrieved_at/observed_at` verlangt. Ein späterer Mint darf diesen Zeitpunkt nicht nachträglich erfinden.

## 5. Aktiver vorbereiteter Slice – E5-B3B

Issue:
**#343 – Entry Requirements E5-B3B – server-observed Flight provider retrieval timestamp evidence**

Branch:
`feat/entry-requirements-provider-retrieval-time-e5b3b-2026-08-31`

Binding Task:
`docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_TASK_2026-08-31.md`

Task-Commit:
`963ddead23d899c57cc2610928081b4419708c3b`

Vorgesehener Cursor-Agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

**Agent an diesem Checkpoint noch nicht dispatched.**

## 6. Bindende E5-B3B-Architektur

`FlugProviderTreffer` erhält einen verpflichtenden server-only Snapshot-Zeitfakt, vorzugsweise `retrievedAt: string`.

Semantik:

- Jetnity-Serverzeit bei erfolgreichem Lesen der Provider-Antwort;
- canonical UTC ISO mit `Z`;
- genau einmal pro Provider-Treffer;
- nicht aus Provider-Payload, Browser oder Airportdaten;
- keine Freshness-/Availability-Garantie;
- nicht in `FlugOption` / `FlugSegment`;
- nicht in Ranking / Browser-Antwort / Route / Trip-Metadata.

Duffel darf einen kleinen injizierbaren Clock-Port für deterministische Tests erhalten. Production nutzt echte Serverzeit ohne neue Infrastruktur.

## 7. Hard non-scope

E5-B3B baut nicht:

- E5-B3A Production-Apply;
- DB-/RLS-/Grant-/Role-/Function-Änderungen;
- Runtime-Principal;
- realen Writer/Backfill;
- Flight Event Persistence TypeScript-Mint;
- `flugNachweisAusUmgebung()`;
- neuen Provider/Secret/paid call;
- `FlugOption`-/`FlugSegment`-Schemaänderungen;
- Browser-/Route-/Trip-Metadata-Timestamp;
- E5-A-Autobinding;
- Deadlines/Tasks/Reminder;
- Requirements-Provider;
- Credential-Ranking;
- Folgeslice.

## 8. Product-Owner-Gates

Für E5-B3B selbst kein besonderes PO-Gate, solange er rein in-memory/server-only bleibt.

Explizite Product-Owner-Freigabe bleibt erforderlich vor:

- Production-DB-/Security-Mutation;
- Runtime-Principal / realem Writer / Backfill;
- Provider-/Secret-/paid/live activation;
- neuen laufenden Kosten;
- sonstigen dokumentierten besonderen Gates.

## 9. Product-/Traveller-Truth unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

Kein Default Passport/Citizenship. Issuer Country != Citizenship. Keine Residence→Nationality-Inferenz.

`flugNachweisAusUmgebung()` bleibt `null`.  
`requirementsProviderAus()` bleibt `null`.

## 10. FIRST NEXT ACTION

1. `docs/ACTIVE_WORK_STATUS.md` auf denselben vorbereiteten E5-B3B-Zustand ziehen;
2. Branch gegen exakt `main@ad7fb1fa...` prüfen – vor Agent nur Task + TL-Continuity-Dokumente zulässig;
3. Draft-PR für #343 öffnen;
4. Pre-agent Exact Head festhalten;
5. frischen Cursor-Agenten `Jetnity entry requirements provider retrieval timestamp 1`, Generation 1 dispatchen;
6. während Agent-Arbeit keine TL-Branch-Mutation;
7. danach vollständiger unabhängiger Exact-Head-Review;
8. **kein Production-Apply und kein automatischer Folgeslice.**

**Live-Evidence wins always.**
