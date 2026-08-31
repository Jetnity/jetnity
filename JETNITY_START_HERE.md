# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3A PREPARED / REPOSITORY-ONLY PERSISTENCE FOUNDATION / NO PRODUCTION APPLY / AGENT NOT YET DISPATCHED / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md` ← **aktiver vorbereiteter Auftrag**
2. `docs/ACTIVE_WORK_STATUS.md`
3. Issue **#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
7. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
8. `docs/JETNITY_BINDING_BUILD_ORDER.md`
9. `lib/flights/domain.ts`
10. `lib/flights/provider.ts`
11. `lib/flights/nachweis.ts`
12. `lib/flights/airport-event-instant.ts`
13. `lib/readiness/temporal.ts`
14. `lib/readiness/temporal-projection.ts`
15. `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`
16. `lib/commercial-provenance/s5b-persistenz-vertrag.test.ts`
17. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Storage-/Migration-/Persistenzannahmen zusätzlich Supabase live prüfen.

## 2. Aktueller kanonischer `main`

`main@3df9af4d6c3da750d50777706bce03589007a58a`

Commit:
`Close Entry Requirements E5-B2A continuity (#337)`

Live verifiziert vor E5-B3A Task-Cut:

- Main CI #1517 / Run `33420869626`: **SUCCESS**;
- Vercel Production: **SUCCESS** auf exakt diesem SHA;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- PR-Pflicht + strict CI/Auth/Vercel + Conversation Resolution + merge-only + bypass empty;
- Issue #334: CLOSED / completed;
- Parent #294 bleibt OPEN als bindender Entry-Requirements-/Travel-Companion-Tracker.

## 3. Warum E5-B3A der nächste Slice ist

E5-A besitzt bereits den expliziten Vertrag:

> `OfficialTemporalAnchor -> eventRef + absolute instant -> projected action window`

Ein weiterer DB-freier Binder darum wäre eine unnötige Parallelabstraktion.

E5-B1R und E5-B2A liefern inzwischen während derselben serverseitigen Flight-Provider-Antwort:

- exakt provider-beobachtete Airport-IANA-Zone;
- daraus nur bei eindeutiger Civil-Time-Zuordnung einen absoluten UTC-Instant;
- exakte Option/Leg/Segment/Endpoint/IATA-Provenance.

Diese Evidence ist bewusst **ephemeral**. Für einen gespeicherten Trip fehlt weiterhin eine server-owned Occurrence-Truth, die ein späteres E5-A-/Travel-Companion-System sicher wiederverwenden dürfte.

`trip_items.metadata` darf diese Rolle nicht übernehmen, weil es owner-writable ist.

## 4. Production-live Trust-Precheck

Supabase Production wurde vor Task-Cut read-only erneut geprüft:

Projekt: `qscbgcdmivbbnzrcyegn`.

Bestätigt:

- `public.trip_items`: RLS aktiv, authenticated Owner hat weiterhin INSERT/UPDATE/DELETE/SELECT;
- Owner-RLS beweist Ownership, **nicht** Provider-Provenance;
- `public.trip_item_commercial_provenance`: authenticated SELECT-only;
- `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)`: SECURITY DEFINER;
- es existiert keine generische Flight-Event-/Timezone-Provenance-Relation;
- Commercial Provenance ist nur Sicherheitsmuster, kein Schema zum Überladen.

Binding rule:

> **Persisted does not mean provider-proven.**

## 5. Aktiver vorbereiteter Slice – E5-B3A

Issue:
**#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**

Branch:
`feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`

Binding Task:
`docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md`

Task-Commit:
`66b48e4266ccf18e450756fef981be0c0b38ddb4`

Vorgesehener frischer Cursor-Agent:
**`Jetnity entry requirements event provenance persistence 1`**, Generation 1

**Der Agent ist an diesem Checkpoint noch nicht dispatched.**

## 6. Scope von E5-B3A

Nur Repository-Persistence-/Security-Foundation:

- eigene Flight-Event-Provenance neben `trip_items`;
- exakte Occurrence-Identität pro Flight-Item × Leg × Segment × Departure/Arrival;
- lokale Airport-Uhrzeit, IANA-Zone und absoluter Instant bleiben getrennte Fakten;
- server-owned Provenance-Prinzip analog zum bewährten Commercial-Provenance-Sicherheitsmuster;
- Owner später nur lesend, kein Direct-Write als Provider-Truth;
- privater Write-Vertrag mit geschlossenem/unallocated Production-Runtime-Gate;
- atomare Current-Snapshot-Semantik, damit spätere Refreshes keine stale/orphan Occurrences hinterlassen;
- fokussierte Repository-Vertragstests.

## 7. Absolute Production-/Runtime-Grenze

E5-B3A darf **nicht**:

- eine Migration auf Production anwenden;
- live RLS/Grants/Roles/Functions ändern;
- einen Runtime-/Login-Principal aktivieren;
- Production-Daten backfillen oder mutieren;
- einen App-/API-Write-Pfad aktivieren;
- `flugNachweisAusUmgebung()` implementieren – bleibt `null`;
- Provider/Secrets/paid calls aktivieren;
- Timezone/Event-Felder in `FlugSegment`, `FlugOption`, Browser oder Route-Metadata einführen;
- Trip/Route -> OfficialTemporalAnchor auswählen;
- E5-A automatisch binden;
- Deadline/Urgency/Task/Reminder/Notification-Runtime bauen;
- `requirementsProviderAus()` aktivieren;
- Credential-/Pass-Ranking bauen.

GitHub-CI führt **keine** Supabase-Migrationen aus. Eine Migration im Repository verändert Production nicht.

## 8. Product-Owner-Gate

Der repository-only E5-B3A-Slice darf vorbereitet/implementiert/reviewed werden, weil Production unverändert bleibt.

**STOPP und ausdrückliche Product-Owner-Freigabe vor jeder späteren Aktion**, die:

- die neue Migration auf Production anwendet;
- Production-RLS/Grants/Roles/Functions ändert;
- einen Production-Runtime-Principal zuweist;
- einen realen Application-Write-Pfad aktiviert;
- reale Trip-Daten backfillt oder mutiert.

## 9. Flight-Proof-Grenze

`lib/flights/nachweis.ts` bleibt Production-fail-closed:

`flugNachweisAusUmgebung()` → `null`.

E5-B3A darf deshalb nur den Persistenzvertrag vorbereiten. Eine sichere Tabelle allein macht einen Browser-Flight nicht provider-belegt.

## 10. Entry Requirements Foundation

Vorhanden:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution.

Weiterhin inaktiv:

- Production-applied server-owned event provenance;
- Flight-proof/runtime invocation;
- Trip/Route -> OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- deadline/action-window/urgency runtime;
- task persistence/completion;
- reminder/push/email runtime;
- real Requirements provider;
- credential ranking.

## 11. Governance

- Versionierter Task vor Agent-Arbeit: erfüllt.
- Eigener Branch: erfüllt.
- Vor Agent-Dispatch muss ein Draft-PR erstellt werden.
- Agent darf `docs/ACTIVE_WORK_STATUS.md` nicht ändern.
- Agent darf nicht Ready setzen, mergen, Production ändern oder einen Folgeslice starten.
- Agent-Self-Review ist kein TL PASS.
- Jeder neue Head braucht unabhängigen TL-Review und eigene Gates.

## 12. FIRST NEXT ACTION

1. `docs/ACTIVE_WORK_STATUS.md` auf denselben vorbereiteten Zustand ziehen;
2. Branch gegen `main@3df9af4d...` vergleichen – vor Agent nur drei Docs-Dateien zulässig;
3. Draft-PR für #338 öffnen;
4. Pre-agent Exact Head festhalten;
5. frischen Cursor-Agenten `Jetnity entry requirements event provenance persistence 1`, Generation 1 dispatchen;
6. während der Agent arbeitet keine Branch-Mutation durch den TL;
7. nach Agent-Handoff vollständiger unabhängiger Exact-Head-Review;
8. **keine Production-Migration anwenden und keinen Folgeslice automatisch starten.**

**Live-Evidence wins always.**
