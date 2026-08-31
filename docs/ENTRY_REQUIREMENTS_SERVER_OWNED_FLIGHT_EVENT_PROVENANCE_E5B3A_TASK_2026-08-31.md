# Entry Requirements E5-B3A – server-owned Flight Event Provenance Persistence Foundation

Stand: 31. August 2026  
Status: **BINDING TASK / REPOSITORY-ONLY / NO PRODUCTION APPLY / NO RUNTIME WRITE / NO AUTO-FOLLOW-UP**

Issue: **#338**  
Parent: **#294**  
Baseline: `main@3df9af4d6c3da750d50777706bce03589007a58a`

Cursor-Agent: **`Jetnity entry requirements event provenance persistence 1`**, Generation 1

## Ziel

E5-B3A bereitet ausschließlich die Repository-Persistenzfoundation für server-owned, provider-belegte Flight-Event-Occurrences vor. Production bleibt unverändert.

Binding rule:

> **Persisted does not mean provider-proven.**

Die vollständige Scope-, Security-, Acceptance- und Gate-Spezifikation steht in Issue #338 und ist Teil dieses verbindlichen Auftrags.

## Vor Beginn lesen

1. `JETNITY_START_HERE.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
6. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `lib/flights/domain.ts`
9. `lib/flights/provider.ts`
10. `lib/flights/nachweis.ts`
11. `lib/flights/airport-event-instant.ts`
12. `lib/readiness/temporal.ts`
13. `lib/readiness/temporal-projection.ts`
14. `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`
15. `lib/commercial-provenance/s5b-persistenz-vertrag.test.ts`

PR #328 ist verworfene Review-Evidence. Kein Cherry-Pick.

## Verbindlicher Scope

- eigener Event-Provenance-Persistenzvertrag neben `trip_items`, nicht in `trip_items.metadata`;
- Sicherheitsprinzip des bestehenden Commercial-Provenance-Musters wiederverwenden, Commercial-Felder aber nicht fachfremd überladen;
- exakte Occurrence-Identität pro Flight-Item, Leg, Segment und Departure/Arrival-Endpunkt;
- lokale Airport-Zeit, explizite IANA-Zone und absoluter Instant bleiben getrennte Fakten;
- Current-Snapshot-Semantik muss spätere stale/orphan Occurrences verhindern können;
- Owner darf die neue Provenance später lesen, aber nicht selbst als Provider-Provenance schreiben;
- privilegierter Write-Vertrag bleibt privat und sein Production-Runtime-Gate bleibt geschlossen;
- keine App-/API-Runtime-Integration in diesem Slice;
- focused repository contract tests;
- vollständige Status-/Handoff-/Self-Review-Dokumentation.

## Harte Non-Scope-Grenzen

- **keine Production-Migration anwenden**;
- keine live RLS-/Grant-/Role-/Function-Änderung;
- kein Runtime-/Login-Principal aktivieren;
- kein Production-Backfill oder reale Datenänderung;
- `flugNachweisAusUmgebung()` bleibt `null`;
- keine Provider-/Secret-/paid-call-/Live-Aktivierung;
- keine Timezone/Event-Felder in `FlugSegment`, `FlugOption`, Browser oder Route-Metadata;
- keine Trip/Route→OfficialTemporalAnchor-Auswahl;
- keine E5-A-Autobindung;
- keine Deadline-/Urgency-/Task-/Reminder-/Notification-Runtime;
- `requirementsProviderAus()` bleibt `null`;
- kein Credential-Ranking;
- kein Folgeslice.

## Runtime-Dateien

Ohne STOP/Recut keine semantischen Änderungen an:

- `lib/flights/domain.ts`
- `lib/flights/provider.ts`
- `lib/flights/airport-event-instant.ts`
- `lib/flights/nachweis.ts`
- `lib/flights/suche.ts`
- `lib/flights/client-sicht.ts`
- `lib/route/*`
- `lib/readiness/temporal.ts`
- `lib/readiness/temporal-projection.ts`
- API-/Workspace-Runtime
- `types/supabase.ts` nur um eine nicht auf Production existierende Tabelle vorzutäuschen

`docs/ACTIVE_WORK_STATUS.md` ist TL-owned und darf vom Agenten nicht verändert werden.

## Acceptance

Der Agent muss insbesondere beweisen:

1. getrennte server-owned Event-Provenance statt owner-writable Metadata;
2. keine Kollision verschiedener Leg/Segment/Endpoint-Occurrences;
3. lokale Zeit, IANA-Zone und absoluter Instant bleiben getrennt;
4. Event-/Occurrence-Identität wird im Trusted-Write-Vertrag erzeugt, nicht durch Client-Behauptung geadelt;
5. Owner-Read ohne Direct-Write;
6. kein Browser-/anon-Write;
7. privilegierter Write bleibt nicht öffentlich exponiert und Production-Runtime bleibt unallocated/disabled;
8. Full-current-snapshot-Refresh kann keine alten Occurrences still stehen lassen;
9. SQL/Persistenz baut keinen zweiten DST-/Timezone-Resolver;
10. kein Production Apply und kein Runtime Write wurde ausgeführt;
11. bestehende Flight-/Readiness-/Route-Contracts bleiben semantisch unverändert;
12. vollständige Typecheck/Lint/Tests/Hygiene/Production-Build-Gates sind grün.

## Deliverables

- `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_STATUS_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_HANDOFF_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_SELF_REVIEW_2026-08-31.md`

Der Self-Review muss adversarial sein und alle geänderten Dateien, Exact Head, Gates, Direct-Write-Schutz, Snapshot-Replacement, Event-Ref-Provenance sowie den Nachweis enthalten, dass Production unverändert blieb.

## STOP

STOP statt Scope-Erweiterung, wenn eine sichere Lösung Änderungen an Production, `trip_items`-Ownership, Flight-Proof-Runtime, Route-Metadata, E5-A-Binding, Provider-Aktivierung oder anderen Shared Runtime Contracts erfordert.

## Governance

- nur eigener Draft-PR;
- do not mark Ready;
- do not merge;
- do not apply Production migration;
- do not start a follow-up;
- nach Implementierung + Docs + Gates STOP für unabhängigen Technical-Lead-Review.
