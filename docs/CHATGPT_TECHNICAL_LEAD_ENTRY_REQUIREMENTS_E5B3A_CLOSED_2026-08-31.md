# Jetnity Technical Lead – Entry Requirements E5-B3A CLOSED

Stand: 31. August 2026  
Status: **CLOSED / MERGED / POST-MERGE VERIFIED / REPOSITORY FOUNDATION ONLY / PRODUCTION MIGRATION UNAPPLIED**

## 1. Ergebnis

E5-B3A – **server-owned Flight Event Provenance persistence foundation** – ist vollständig unabhängig reviewed, integriert und post-merge verifiziert.

Binding rule bleibt:

> **Persisted does not mean provider-proven.**

Der Repository-Vertrag schafft eine sichere spätere Persistenznaht. Er aktiviert keine Production-Persistenz und keinen Runtime-Writer.

## 2. Issue / PR / Agent

- Issue: **#338** – CLOSED / completed
- Parent: **#294** – bleibt offen
- Original Draft PR: **#340 – CLOSED / NOT MERGED**
- Grund: bekannter GitHub Ready-Connectorfehler `Repository.fullDatabaseId`
- Identischer non-draft Recovery-PR: **#341 – MERGED**
- Branch: `feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`
- Cursor-Agent: **`Jetnity entry requirements event provenance persistence 1`**, Generation 1
- Session: `bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`

## 3. Review-Historie

Initialer Agent-Head:
`79dda7593bb9fbb20c36dc54348920e994da6823`

Technical-Lead Ergebnis dort:
**CHANGES REQUIRED / P2**.

Fund:
`provider_belegt=true` war ohne konkrete Provider-Source-Referenz zulässig.

Same-agent Fix:
`f918dc0ed58b4962389a860d5a1b6bf74513cd1b`

Finaler Agent-/Delivery-Head:
`d37b600f67537f4ccb816182009b6018a39f82a3`

Finaler Integrations-Head nach TL-Continuity:
`9a839bfc2babec96ba983de0c6b1ff628da5a1f3`

Der P2 ist geschlossen:

- `external_ref` ist `NOT NULL`;
- nonblank und bounded;
- Writer rejected missing/blank `external_ref` fail-closed;
- Reject erfolgt vor Snapshot-Replacement;
- `occurrence_event_ref` bleibt interne Jetnity-Occurrence-ID und ist keine Provider-Source-Referenz.

## 4. Integrierter Repository-Vertrag

Migration:
`supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`

Contract-Test:
`lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`

Kern:

- dedicated `public.trip_item_flight_event_provenance` neben `trip_items`;
- Current-Occurrence-Identität Item × Leg × Segment × `departure|arrival`;
- lokale Airport-Wanduhr, IANA-Zone und absoluter Instant bleiben getrennte Fakten;
- verpflichtende konkrete Provider-Source-Referenz `external_ref`;
- server-generated `occurrence_event_ref`;
- authenticated Owner: SELECT-only;
- kein anon/authenticated Direct-Write;
- private SECURITY-DEFINER-Funktion in `jetnity_internal`, `search_path=''`;
- dedizierte NOLOGIN Writer-/Runtime-Rollen;
- Runtime-Gate default false/unallocated;
- vollständige Validierung vor atomarem Current-Snapshot-Replacement;
- SQL ist kein zweiter Timezone-/DST-Resolver.

## 5. Merge / Gates

Original Draft #340 konnte trotz vollständig grüner Gates wegen des bekannten Ready-Connectorbugs nicht auf Ready gesetzt werden und wurde unmerged geschlossen. Protection wurde nicht geschwächt.

Recovery #341 verwendete exakt denselben Head:
`9a839bfc2babec96ba983de0c6b1ff628da5a1f3`

Recovery-eigene Gates:

- CI #1526 / Run `33429054395`: **SUCCESS**;
- Vercel Preview: **READY**;
- GitHub Reviewthreads: **0**;
- Vercel unresolved feedback: **0**;
- main hatte keinen Drift.

Merge mit Exact-Head-Guard:

`73d580a53bd60be20e4f253fafe37f25111d4b0d`

Commit:
`Merge E5-B3A server-owned flight event provenance foundation (#341)`

## 6. Post-Merge Verification

Auf exakt `main@73d580a53bd60be20e4f253fafe37f25111d4b0d`:

- Main CI #1527 / Run `33429685566`: **SUCCESS**;
- Auth: SUCCESS;
- Typecheck / Lint / Tests / Admin API / Schema / Dead Code / Exports / Dependencies / Production Build: SUCCESS;
- Vercel Production: **SUCCESS**.

## 7. Production Supabase bleibt unverändert

Projekt:
`qscbgcdmivbbnzrcyegn`

Post-merge read-only geprüft. Weiterhin **nicht vorhanden**:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

Damit ist die E5-B3A-Migration weiterhin **UNAPPLIED auf Production**.

Keine Production-Datenmutation, kein RLS-/Grant-/Role-/Function-Live-Change, kein Runtime-Principal, kein Backfill.

## 8. Weiterhin inaktiv

- `flugNachweisAusUmgebung()` bleibt `null`;
- `requirementsProviderAus()` bleibt `null`;
- kein realer Flight-Provenance-Writer;
- kein Trip/Route → OfficialTemporalAnchor Resolver;
- keine E5-A-Autobindung;
- keine Deadline-/Urgency-/Task-/Reminder-/Notification-Runtime;
- kein Requirements-Provider;
- kein Credential-/Passport-Ranking.

## 9. Product-Owner-Gate bleibt bestehen

Explizite Product-Owner-Freigabe ist weiterhin zwingend vor:

- Production-Apply der E5-B3A-Migration;
- Production-RLS/Grants/Roles/Functions;
- Runtime-/Login-Principal-Allokation;
- Aktivierung eines realen Application-Writers;
- Backfill/Mutation realer Trip-Daten.

## 10. P3 für späteren Production-Apply

Vor einem späteren Production-Apply muss die Migration zusätzlich gegen eine disposable PostgreSQL/Supabase-Testumgebung tatsächlich ausgeführt und ihr RLS-/Grant-/Function-Verhalten beobachtet werden.

Timezone-/DST-Resolution bleibt außerhalb SQL. Ein späterer Trusted-Mint muss E5-B1R + E5-B2A wiederverwenden.

## 11. Continuity

Nach Merge dieser Docs-Closure gilt E5-B3A vollständig als abgeschlossen. Der Nutzer hat ausdrücklich den Start **eines** nächsten Slices autorisiert. Dieser muss trotzdem frisch aus dem dann aktuellen `main` geschnitten werden, mit eigenem Duplicate-/Integration-/Truth-/Security-Precheck und ohne ein Production-Gate still zu überschreiten.

**Live-Evidence wins always.**
