# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B1R CLOSED / E5-B2A PREPARED / AGENT NOT YET DISPATCHED / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md` ← **aktiver versionierter Auftrag**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_HANDOFF_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
7. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
8. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
9. `docs/JETNITY_BINDING_BUILD_ORDER.md`
10. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Storage-/Migration-/Persistenzannahmen zusätzlich Supabase live prüfen.

## 2. Canonical main beim E5-B2A Task-Cut

`main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222`

Commit:
`Close Entry Requirements E5-B1R continuity (#333)`

Live verifiziert:

- Main push CI #1507 / Run `33415587649`: **SUCCESS** auf exakt diesem Main;
- Vercel Production: **SUCCESS** auf exakt diesem Main;
- Ruleset `Jetnity main protection` / ID `21875372`: **active**;
- PR required, strict required checks, Conversation Resolution;
- required checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`;
- merge-only;
- bypass empty;
- Issue #330 E5-B1R: CLOSED / completed;
- offene #52/#50/#40/#39/#28 sind historische Drafts, kein konkurrierender Entry-Requirements Runtime-Slice.

Finalen Main bei jeder Fortsetzung trotzdem live neu lesen.

## 3. Aktiver vorbereiteter Slice – E5-B2A

Issue:
**#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**

Branch:
`feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`

Binding Task:
`docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md`

Fresh logical Cursor Agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1

Agent Session:
**noch nicht belegt / Dispatch pending** zum Zeitpunkt dieses Dokuments.

## 4. E5-B2A Ziel

E5-B1R liefert bereits flüchtige serverseitige Provider-Timezone-Evidence für einen exakten Flight-Endpoint.

E5-B2A darf daraus zusammen mit der exakt zugehörigen lokalen `FlugSegment`-Zeit nur folgendes erzeugen:

> **genau einen absoluten UTC-Instant oder einen expliziten fail-closed unresolved state.**

Bindung bleibt exakt über:

- option id;
- leg index;
- segment index;
- `departure | arrival`;
- IATA;
- provider-observed timezone;
- lokales Segmentdatum/-zeit.

DST-Regeln:

- nonexistent local time / spring gap → kein Instant;
- ambiguous local time / fall overlap → kein Instant;
- nie still earlier/later wählen.

Kein `Z` an lokale Wanduhrzeiten. Keine IATA/Country/City/Server-/Browser-Timezone-Inferenz.

## 5. Runtime-Grenze

E5-B2A bleibt ausschließlich **ephemeral server-side companion evidence** an der aktiven FlightProvider-Naht.

Timezone oder absolute Instants werden nicht Teil von:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- Client-/Browser-Antwort;
- Route Itinerary;
- Trip Metadata;
- Account Adoption / `flugNachweis`;
- Supabase.

`fluegeSuchen()` muss beide Evidence-Arten weiterhin vor Ranking/Client-Serialization ignorieren/verwerfen.

## 6. Duplicate-/Integration-Precheck

Fresh geprüft:

- `lib/flights/zeit.ts` schützt lokale Wall-Clock-Semantik und rechnet keine Zone;
- `lib/flights/airport-timezone.ts` validiert nur explizite provider-gelieferte Zonen;
- `lib/flights/provider.ts` ist aktive Runtime-Naht und trägt E5-B1R-Evidence;
- `lib/flights/duffel/mapping.ts` mintet diese Evidence passend zur normalisierten Option;
- `lib/readiness/temporal-projection.ts` projiziert nur bereits explizite absolute Instants;
- keine vorhandene Local-Time+IANA→Instant-Engine gefunden;
- keine Timezone-Library in `package.json`;
- daher kein bestehender Resolver zu duplizieren.

Keine neue npm-Dependency in diesem Slice. Falls robuste DST gap/overlap Semantik mit Plattform-APIs nicht beweisbar ist: Agent STOPP statt Scope-Widening.

## 7. Weiterhin nicht aktiv

- persistente trusted timezone/event provenance;
- Route/Trip Event Occurrence Resolver;
- E5-A automatic binding;
- Workspace Deadline-/Action-Window-/Urgency Runtime;
- Task Persistenz/Completion;
- Reminder/Push/E-Mail/Notifications;
- echter Requirements Provider;
- Credential-/Passport-Ranking.

`requirementsProviderAus()` bleibt `null`.

## 8. Binding provenance rule

Der verworfene erste E5-B1-Versuch bleibt invalid:

- Issue #327 CLOSED / not_planned;
- PR #328 CLOSED / NOT MERGED.

Bindend:

> **Persisted does not mean provider-proven.**

Owner-beschreibbare Trip-Metadaten sind keine Provider-Provenance.

Persistente server-owned Timezone/Event-Provenance erfordert später eine technisch erzwungene Write Authority und bei Production DB/RLS/Grant/Trigger-Änderungen ein Product-Owner-Gate.

## 9. Product / Traveller Truth unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine Default-/Primary-/Preferred-/Chosen-Citizenship oder Passport-Auswahl. Issuer Country != Citizenship. Keine Residence→Nationality-Inferenz. Kein `documents[0]` / `evaluations[0]` als Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = einzige Current Truth der konkreten Reise.

## 10. Product-Owner Gate Assessment

E5-B2A selbst löst **kein** besonderes PO-Gate aus:

- keine Production Migration/RLS/Ownership/Grant/Trigger;
- keine Persistenz;
- kein neuer Provider/Secret/paid call/live activation;
- keine Auth/MFA/AAL-Änderung;
- keine sensiblen neuen Daten;
- keine laufenden Infrastrukturkosten;
- kein Public Launch.

Wenn persistente Trusted Event/Timezone Provenance oder Production DB Security nötig wird: STOPP am PO-Gate.

## 11. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass empty.

Cursor Self-Review ist kein TL PASS. Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 12. FIRST NEXT ACTION

1. Preparationsbranch gegen `main@f7ccdc5b...` diffen;
2. vor Agent Dispatch nur Task + TL Continuity zulassen;
3. Draft PR für #334 öffnen;
4. fresh Agent **`Jetnity entry requirements airport event instant 1`** dispatchen;
5. Agent liefert Runtime + Status/Handoff/Self-Review + full gates;
6. Agent setzt nicht Ready und mergt nicht;
7. Technical Lead reviewed den finalen Exact Head unabhängig;
8. kein E5-B2B/Folgeslice automatisch.

**Live-Evidence gewinnt immer.**
