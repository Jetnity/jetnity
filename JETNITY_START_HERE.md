# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-A CLOSED / E5-B1 BLOCKER CLOSED / E5-B1R PREPARED / AGENT NOT YET DISPATCHED / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md` ← **aktiver versionierter Auftrag**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
7. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_HANDOFF_2026-08-31.md`
8. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_HANDOFF_2026-08-31.md`
9. `docs/READINESS_WORKSPACE_INTEGRATION_R1_HANDOFF_2026-08-31.md`
10. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
11. `docs/JETNITY_BINDING_BUILD_ORDER.md`
12. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel und – bei DB-/Security-/Storage-/Migration-/Persistenzannahmen – Supabase live neu verifizieren.

## 2. Verifizierter Main vor E5-B1R

Baseline beim Task-Cut:

`main@7fdd06f983a47afbbb28313479adf4e81fb9a359`

Commit:

`Close E5-B1 trust-boundary blocker continuity (#329)`

Post-Merge Evidence:

- Main CI #1497 / Run `33409025821`: **SUCCESS**;
- Vercel Production: **SUCCESS** auf exakt diesem Main;
- Ruleset `Jetnity main protection` / ID `21875372`: **active**, strict Required Checks, Conversation Resolution, merge-only, bypass leer;
- E5-A Runtime und Continuity geschlossen;
- E5-B1 erster Versuch #327/#328 geschlossen und nicht gemergt;
- offene PRs #52/#50/#40/#39/#28 sind historische Drafts und kein aktueller Runtime-Workstream.

Finalen Main bei jeder Fortsetzung trotzdem live neu lesen.

## 3. Aktiver vorbereiteter Slice – E5-B1R

Issue:

**#330 – Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence**

Branch:

`feat/entry-requirements-ephemeral-timezone-evidence-e5b1r-2026-08-31`

Binding Task:

`docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`

Fresh logical Cursor Agent:

**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Agent-Session:

**noch nicht belegt / Dispatch pending** zum Zeitpunkt dieses Dokuments.

### Verbindliche E5-B1R-Grenze

Timezone wird **nicht** Teil von:

- `FlugSegment`;
- `FlugOption`;
- `BewerteteFlugOption`;
- Client-/Browser-Antwort;
- Route-Itinerary;
- Trip-/Route-Metadata;
- Account-Adoption / `flugNachweis`;
- Supabase.

Stattdessen darf nur der **aktive serverseitige FlightProvider-Port** eine separate flüchtige Companion-Evidence tragen, exakt gebunden an Option + Leg + Segment + Endpoint + IATA.

Duffel darf diese Evidence ausschließlich aus dem strukturierten Airport-Objekt und dessen explizitem `time_zone` minten.

Kein IATA-/Country-/City-/Name-/Offset-Fallback.

`fluegeSuchen()` muss die Evidence vor der Browser-Antwort bewusst verwerfen.

## 4. Warum E5-B1R anders ist als der verworfene PR #328

Issue #327:

- CLOSED / not_planned.

Draft PR #328:

- CLOSED / NOT MERGED;
- verworfener Head `fdf05f26928dfc556cc3b3b954eb3c61981b29c4`;
- Review-Evidence only;
- kein Cherry-Pick.

Agent der verworfenen Runde:

**`Jetnity entry requirements trusted event time 1`**, Generation 1  
Session `bc-c0a4c448-2029-4b3a-8746-53985c8ca2e0`  
Status: STOPPED / CLOSED / NOT MERGED.

Der materielle Blocker war die falsche Annahme, dass `trip_items.metadata` allein wegen DB-Herkunft Trusted Provider-Provenance sei.

Production-live bestätigt:

- `public.trip_items` RLS enabled;
- authenticated Owner-INSERT / Owner-UPDATE;
- authenticated INSERT/UPDATE/SELECT/DELETE-Grants;
- Route-Metadata-Guard kanonisiert ohne Timezone-Erhaltung.

Daraus bindend:

> **Persisted does not mean provider-proven.**

## 5. Bestehende Provenance-Architektur

Production-live existiert:

`public.trip_item_commercial_provenance`

mit interner kontrollierter Write-Naht:

`jetnity_internal.trip_item_commercial_provenance_schreiben(...)`.

Für `authenticated` ist diese Relation read-only: SELECT-Policy + SELECT-Grant.

Das zeigt das wiederzuverwendende Sicherheitsmuster **server-owned provenance beside user-owned trip item**, bleibt aber Commercial-Domain und darf nicht für Timezone missbraucht werden.

Persistente Timezone/Event-Provenance wäre ein eigener späterer DB-/Security-Slice mit Product-Owner-Gate.

## 6. Duplicate-/Integration-Precheck für E5-B1R

Live/current code geprüft:

- `lib/flights/provider.ts` = aktive Runtime-Provider-Naht;
- `lib/flights/duffel/adapter.ts` = aktiver Duffel-Adapter;
- `lib/flights/duffel/antwort.ts` = untrusted Provider-JSON Boundary;
- `lib/flights/duffel/mapping.ts` = Duffel → normale `FlugOption`;
- `lib/flights/suche.ts` = Server-Orchestrierung vor Client-Sanitization;
- `lib/flights/client-sicht.ts` = Browser-Contract;
- `lib/flights/domain.ts` / `schema.ts` = normale Flight Product Truth;
- Repository-Suche: keine bestehende IANA/timezone evidence engine vorhanden;
- `lib/providers/flights/*` = separate offline/provider-readiness fixture foundation, **nicht** die aktive Runtime-Naht; kein zweites Runtime-System bauen.

Entscheidung:

> Evidence bleibt Companion des `FlugProviderTreffer`, nicht Eigenschaft der `FlugOption`.

## 7. Produkt-/Traveller-Truth unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für die konkrete Reise.

Keine Default-/Primary-/Preferred-/Chosen-Citizenship oder Passport-Auswahl; Issuer Country ≠ Citizenship; keine Residence→Nationality-Inferenz; kein `documents[0]` / `evaluations[0]` als Product Truth.

## 8. Entry Requirements – vorhandener Unterbau

Provider-neutral vorhanden:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core.

E5-A bleibt:

> `OfficialTemporalRule + explizit gebundener absoluter Event-Instant → deterministische Projection`.

`requirementsProviderAus()` bleibt `null`.

## 9. Weiterhin nicht aktiv

- kein echter Requirements-/Visa-/Entry-Provider;
- keine neuen Providerverträge/Secrets/paid calls/Live-Aktivierung;
- keine persistente Trusted Airport-Timezone-Provenance;
- kein IATA/Airport→Timezone Lookup;
- kein Local-Time+IANA→UTC Resolver;
- kein DST Ambiguity/Gap Resolver;
- kein Trip/Route→E4 Event-Occurrence Resolver;
- keine E5-A Auto-Bindung;
- keine Workspace Deadline-/Urgency-Runtime;
- keine Task-Persistenz/Completion;
- keine Reminder/Push/E-Mail/Notifications;
- kein Credential-Ranking / automatische beste Pass-Auswahl.

## 10. Product-Owner-Gates

E5-B1R selbst löst **kein** besonderes PO-Gate aus: keine DB-/RLS-/Auth-/Secret-/Provideraktivierung, kein paid call, keine neue Infrastruktur und keine Persistenz.

Besondere Gates bleiben u. a. für:

- Providerwahl/Vertrag/DPA/Secrets/paid calls/Live-Aktivierung;
- Production-Migrationen, RLS, Ownership, Trigger/Grants/server-owned Write Authority mit realer Datenwirkung;
- fundamentale Auth/MFA/AAL-Änderungen;
- sensible Pass-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten;
- Payments;
- neue laufende Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversible externe Aktivierung.

## 11. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Cursor-Self-Review ist kein TL-PASS. Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 12. FIRST NEXT ACTION

1. Vorbereitungsbranch gegen `main@7fdd06f...` diffen;
2. sicherstellen, dass vor Agent-Dispatch nur Task + TL-Continuity geändert sind;
3. Draft-PR für #330 öffnen;
4. fresh Agent **`Jetnity entry requirements provider timezone evidence 1`** dispatchen;
5. Agent stoppt nach Runtime + Status/Handoff/Self-Review + Gates;
6. Technical Lead prüft finalen Exact Head unabhängig;
7. keine automatische Folgearbeit.

**Live-Evidence gewinnt immer.**
