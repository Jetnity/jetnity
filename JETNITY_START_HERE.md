# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-A CLOSED / E5-B1 FIRST ATTEMPT BLOCKED & NOT MERGED / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_HANDOFF_2026-08-31.md`
7. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_HANDOFF_2026-08-31.md`
8. `docs/READINESS_WORKSPACE_INTEGRATION_R1_HANDOFF_2026-08-31.md`
9. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel und – bei DB-/Security-/Storage-/Migration-/Persistenzannahmen – Supabase live verifizieren.

## 2. Verifizierter Main

Aktueller Main beim Closure-Cut:

`main@6928ea637133ff91cfb207cfd5b1175fecbc9699`

Commit:

`Close Entry Requirements E5-A continuity (#326)`

Live-Evidence:

- CI #1491 / Run `33404116202`: **SUCCESS**;
- Ruleset `Jetnity main protection` / ID `21875372`: **active**, strict required checks, Conversation Resolution, merge-only, bypass leer;
- E5-A Runtime-Merge `a4c0c57e144e694435cfe2b1970a76239f1ef7d5` ist enthalten;
- E5-A Continuity ist geschlossen.

Finalen `main` bei jeder Fortsetzung trotzdem live neu lesen.

## 3. E5-B1 – erster Ansatz verworfen

Issue **#327**:

- `Entry Requirements E5-B1 – trusted airport timezone provenance`;
- **CLOSED / not_planned**.

Draft PR **#328**:

- **CLOSED / NOT MERGED**;
- Branch `feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`;
- verworfener Agent-Head `fdf05f26928dfc556cc3b3b954eb3c61981b29c4`;
- Review-Evidence only, niemals als Product Truth oder PASS behandeln.

Logical Cursor Agent:

**`Jetnity entry requirements trusted event time 1`**, Generation 1

Session:

`bc-c0a4c448-2029-4b3a-8746-53985c8ca2e0`

Status: **STOPPED / PR CLOSED / NOT MERGED**.

Es läuft aktuell **kein Cursor-Runtime-Slice**.

## 4. Warum #328 blockiert wurde

Der ursprüngliche Task wollte provider-belegte Airport-Timezone bis in `trip_items.metadata.routeItinerary` persistieren und beim DB-Read als Trusted Truth wiederherstellen.

Der unabhängige TL-Precheck und die anschließende Production-live Supabase-Prüfung haben bestätigt:

- `public.trip_items` hat RLS enabled;
- `authenticated` darf Owner-Items direkt INSERT und UPDATE schreiben;
- `authenticated` hat live INSERT/UPDATE/SELECT/DELETE-Table-Grants;
- Owner-RLS beweist Ownership, **nicht** Provider-Provenance einzelner Metadata-Felder;
- `public.trip_items_route_itinerary_schuetzen()` kanonisiert Flight-Metadata;
- `public.flug_route_itinerary_metadata(...)` erhält aktuell keine Timezone-Felder.

Daher gilt:

> **Ein Feld in owner-beschreibbarer `trip_items.metadata` darf nicht allein wegen seiner DB-Herkunft als server-/provider-belegte Timezone-Provenance gelesen werden.**

## 5. Neue bindende Trust-Regel

> **Persisted does not mean provider-proven.**

Trusted Provenance benötigt eine Write-Authority-Kette, die diese Herkunft technisch erzwingt.

- RLS Ownership ≠ Provider Provenance;
- kein Trusted Reader nur aufgrund des Speicherorts;
- DB-Trigger/Kanonisierung immer als Teil der Truth-Architektur prüfen;
- eine spätere persistente server-owned Timezone/Event-Provenance ist eigener DB-/Security-Scope und fällt bei Production-Migration/RLS/Ownership in ein Product-Owner-Gate.

Bestehendes Muster zur Wiederverwendung:

`public.trip_item_commercial_provenance` + interne kontrollierte Write-Naht zeigt das Architekturprinzip **server-owned provenance beside user-owned trip item**. Diese Commercial-Domain darf aber nicht fachfremd für Timezone überladen werden.

## 6. Produkt-/Traveller-Truth unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für eine konkrete Reise.

Keine Default-/Primary-/Preferred-/Chosen-Citizenship oder Passport-Auswahl; Issuer Country ≠ Citizenship; keine Residence→Nationality-Inferenz; kein `documents[0]` / `evaluations[0]` als Product Truth.

## 7. Entry Requirements – vorhandener Unterbau

Provider-neutral vorhanden:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core.

E5-A bleibt bewusst nur:

> `OfficialTemporalRule + explizit gebundener absoluter Event-Instant → deterministische Projection`.

Keine automatische Trip-/Route-Event-Auswahl und keine Timezone-Auflösung.

`requirementsProviderAus()` bleibt `null`.

## 8. Weiterhin nicht aktiv

- kein echter Requirements-/Visa-/Entry-Provider;
- keine Providerverträge/Secrets/paid calls/Live-Aktivierung;
- keine persistente Trusted Airport-Timezone-Provenance;
- kein Local-Time+IANA→UTC Resolver;
- kein DST Ambiguity/Gap Resolver;
- kein Trip/Route→E4 Event-Occurrence Resolver;
- keine E5-A Auto-Bindung;
- keine konkrete Workspace-Deadline-/Urgency-Runtime;
- keine Task-Persistenz/Completion;
- keine Reminder/Push/E-Mail/Notifications;
- kein Credential-Ranking / automatische beste Pass-Auswahl.

## 9. Product-Owner-Gates

Besondere PO-Gates bleiben u. a. für:

- Providerwahl/Vertrag/DPA/Secrets/paid calls/Live-Aktivierung;
- Production-Migrationen, RLS, Ownership und server-owned Write Authority mit realer Datenwirkung;
- fundamentale Auth/MFA/AAL-Änderungen;
- sensible Pass-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten;
- Payments / echte Geldbewegungen;
- neue laufende Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversible externe Aktivierung.

## 10. FIRST NEXT ACTION

**Kein Runtime-Slice ist automatisch freigegeben.**

Vor dem nächsten Build:

1. finalen `main`, PRs/Issues, CI/Vercel live prüfen;
2. aktuellen E5-B1-Blocker-Checkpoint lesen;
3. #328 nur als verworfene Review-Evidence verwenden;
4. Duplicate-/Integration-/Trust-Precheck gegen Flight/Route/Provider/DB erneut ausführen;
5. prüfen, ob der kleinste sichere Schritt ausschließlich **ephemeral provider-observed airport timezone evidence** im Flight-Adapter/Contract sein kann;
6. dabei keine owner-beschreibbare Persistenz als Trusted Provenance verwenden;
7. keine UTC/DST/Event-Resolver-Logik in denselben Slice ziehen;
8. falls persistente server-owned Provenance nötig wird: STOPP am PO-Gate.

**Live-Evidence gewinnt immer.**
