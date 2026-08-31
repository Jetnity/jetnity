# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3A CLOSED & POST-MERGE VERIFIED / PRODUCTION MIGRATION UNAPPLIED / NEXT SLICE REQUIRES FRESH PRECHECK / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Jeder neue Head invalidiert ältere Exact-Head-Gates.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md` ← **aktuellster Entry-Requirements Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_REVIEW_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_HANDOFF_2026-08-31.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
7. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
8. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
9. `docs/JETNITY_BINDING_BUILD_ORDER.md`
10. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Aktueller kanonischer Runtime-/Repository-main

Vor dieser docs-only Closure:

`main@73d580a53bd60be20e4f253fafe37f25111d4b0d`

Commit:
`Merge E5-B3A server-owned flight event provenance foundation (#341)`

Post-merge verified:

- Main CI #1527 / Run `33429685566`: **SUCCESS**;
- Vercel Production: **SUCCESS** auf exakt diesem SHA;
- Supabase Production: E5-B3A Migration weiterhin **UNAPPLIED**;
- Issue #338: **CLOSED / completed**;
- Parent #294: bleibt offen.

Nach Merge dieser docs-only Closure muss `main` live erneut gelesen werden, weil der kanonische SHA ohne Runtime-Änderung weiterläuft.

## 3. E5-B3A final history

Issue:
**#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**

Cursor-Agent:
**`Jetnity entry requirements event provenance persistence 1`**, Generation 1

Session:
`bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`

Initialer Agent-Head:
`79dda7593bb9fbb20c36dc54348920e994da6823`

TL dort:
**CHANGES REQUIRED / P2** – `provider_belegt=true` konnte ohne konkrete Provider-Source-Referenz persistiert werden.

Same-agent Fix:
`f918dc0ed58b4962389a860d5a1b6bf74513cd1b`

Finaler Agent-/Delivery-Head:
`d37b600f67537f4ccb816182009b6018a39f82a3`

Finaler Integrations-Head:
`9a839bfc2babec96ba983de0c6b1ff628da5a1f3`

TL Verdict:
**PASS / no open P0-P1-P2 findings.**

Original Draft PR #340:
**CLOSED / NOT MERGED** wegen bekanntem `Repository.fullDatabaseId` Ready-Connectorfehler.

Identischer non-draft Recovery-PR #341:
**MERGED** nach eigenen Gates.

Runtime-/Repository-Merge:
`73d580a53bd60be20e4f253fafe37f25111d4b0d`

## 4. Was jetzt im Repository vorhanden ist

- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`;
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`;
- dedicated `public.trip_item_flight_event_provenance` als Repository-Vertrag;
- exact Item × Leg × Segment × `departure|arrival` occurrence identity;
- getrennte lokale Wanduhr / IANA-Zone / absoluter Instant;
- verpflichtende konkrete Provider-Source-Referenz `external_ref`;
- server-generated `occurrence_event_ref`;
- Owner read-only / kein Direct-Write;
- private SECURITY-DEFINER-Write-Foundation;
- NOLOGIN writer/runtime roles;
- Runtime-Gate default false/unallocated;
- atomare Full-current-snapshot-Semantik;
- kein SQL-Timezone-/DST-Resolver.

## 5. Production ist weiterhin unverändert

Supabase Production Projekt:
`qscbgcdmivbbnzrcyegn`

Post-merge read-only bestätigt **nicht vorhanden**:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

**Repository-Migration vorhanden ≠ Production-Migration angewendet.**

## 6. Entry Requirements / Travel Companion foundation

Vorhanden im Repository/runtime:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A server-owned Flight Event Provenance **repository persistence/security foundation**.

Weiterhin inaktiv:

- Production-applied Flight Event Provenance;
- Runtime Principal / realer writer;
- `flugNachweisAusUmgebung()`;
- Trip/Route → OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency;
- task persistence/completion;
- reminders/push/email;
- real Requirements provider;
- credential/passport ranking.

`flugNachweisAusUmgebung()` bleibt `null`.  
`requirementsProviderAus()` bleibt `null`.

## 7. Product-Owner-Gates

Explizite Product-Owner-Freigabe bleibt erforderlich vor:

- Production-Apply der E5-B3A-Migration;
- Production-RLS/Grant/Role/Function-Änderungen;
- Runtime-/Login-Principal-Allokation;
- realem Application-Writer oder Backfill;
- Provider/Vertrag/DPA/Secret/paid-call/live activation;
- fundamentalen Auth/MFA/AAL-Änderungen;
- sensitiven Pass/MRZ/Scan/Biometrie-/Health-Daten;
- realen Payments;
- Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversibler externer Aktivierung.

## 8. P3 vor späterem Production-Apply

Die E5-B3A-Migration muss vor einem späteren Production-Apply zusätzlich gegen eine disposable PostgreSQL/Supabase-Testumgebung tatsächlich ausgeführt werden. Repository-Vertragstests ersetzen keinen beobachteten Live-Apply.

Ein späterer Trusted-Mint muss E5-B1R + E5-B2A wiederverwenden. SQL darf keine zweite Temporal-Truth-Engine werden.

## 9. Traveller-/Produktwahrheit unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

Kein Default-/Primary-/Preferred-/Chosen Passport oder Citizenship. Issuer Country != Citizenship. Keine Residence→Nationality-Inferenz. Kein `documents[0]` / `evaluations[0]` als Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 10. FIRST NEXT ACTION

Der Nutzer hat ausdrücklich den Start **eines nächsten Slices** autorisiert.

Vor dessen Cut trotzdem zwingend:

1. finalen `main` nach dieser Closure live rekonstruieren;
2. offene aktuelle PRs/Issues und Main-CI/Vercel prüfen;
3. Duplicate-/Integration-/Truth-/Security-/Persistence-Precheck gegen aktuellen Code durchführen;
4. kleinsten sicheren nächsten Entry-Requirements-/Travel-Companion-Baustein bestimmen;
5. **kein Production-Apply und kein anderes Product-Owner-Gate still überschreiten**;
6. eigenen versionierten Issue/Task/Branch/Draft-PR vorbereiten;
7. frischen Cursor-Agenten dispatchen;
8. nach Agent-Handoff unabhängig Exact-Head reviewen.

**Live-Evidence wins always.**
