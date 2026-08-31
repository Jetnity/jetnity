# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-A CLOSED / E5-B1 PREPARED / DRAFT PR #328 / AGENT DISPATCH PENDING / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den tatsächlichen Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Live evidence before assumptions.**

## 1. Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_TASK_2026-08-31.md` ← **aktiver versionierter Auftrag**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md` ← letzter vollständig geschlossener Runtime-/Continuity-Checkpoint
5. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← bindender Zielzustand Entry Requirements / Travel Companion
6. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_HANDOFF_2026-08-31.md`
7. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_HANDOFF_2026-08-31.md`
8. `docs/READINESS_WORKSPACE_INTEGRATION_R1_HANDOFF_2026-08-31.md`
9. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel und – **nur bei betroffenem DB-/Security-/Storage-/Migration-Scope** – Supabase live verifizieren.

Frühere Checkpoints, Agenten-Handoffs und PR-Bodies bleiben historische Evidence ihres jeweiligen Heads; sie ersetzen nie Live-Evidence.

## 2. Verifizierter Main vor E5-B1

Aktueller verifizierter Baseline-Main beim E5-B1-Task-Cut:

`main@6928ea637133ff91cfb207cfd5b1175fecbc9699`

Dieser Main enthält:

- E5-A Runtime über Recovery-PR #325;
- E5-A Runtime-Merge `a4c0c57e144e694435cfe2b1970a76239f1ef7d5`;
- E5-A Continuity-Closure über PR #326;
- finalen Continuity-Merge `6928ea637133ff91cfb207cfd5b1175fecbc9699`.

Post-Merge-Evidence auf `6928ea...`:

- Main CI #1491 / Run `33404116202`: **SUCCESS**;
- Vercel Production `dpl_9gLJih2vBvzKExiikYy9vrix7Cuc`: **READY** exakt auf diesem SHA;
- Ruleset `Jetnity main protection` / ID `21875372`: **active**, strict Required Checks, Conversation Resolution, merge-only, Bypass leer;
- Issue #323: **CLOSED / completed**;
- Issue #294: **OPEN** und weiterhin bindender Entry-Requirements-/Travel-Companion-Zieltracker.

Finalen `main` trotzdem bei jeder Fortsetzung live neu lesen.

## 3. Aktiver Slice – E5-B1

Aktiv vorbereitet:

**Entry Requirements E5-B1 – Trusted Airport Timezone Provenance**

- Issue: **#327**;
- Draft PR: **#328**;
- Branch: `feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`;
- Baseline: `main@6928ea637133ff91cfb207cfd5b1175fecbc9699`;
- Binding Task: `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_TASK_2026-08-31.md`;
- Logical Cursor agent: **`Jetnity entry requirements trusted event time 1`**, Generation 1;
- Agent-Session: **noch nicht belegt / Dispatch pending** zum Zeitpunkt dieses Dokuments.

### E5-B1 Truth-Grenze

> **Timezone Truth darf nur aus einer expliziten, validierten, serverseitig belegten Flight-Provider-Response für genau den Segment-Endpunkt stammen.**

E5-B1 soll ausschließlich:

- optionale Departure-/Arrival-Timezone-Provenance im provider-neutralen Flight-Segment tragen;
- Duffels bereits vorhandenes strukturiertes `time_zone` nur am bestehenden Adapter-Grenzpunkt validieren und erhalten;
- die Timezone lossless durch den server-proven FlightOption → Snapshot → Trusted Route Itinerary → `trip_items.metadata`-Pfad tragen;
- bestehende timezone-lose Itinerary-v1 kompatibel halten;
- Browser-/Local-Storage-/Guest-Input daran hindern, Trusted-Timezone zu behaupten;
- die bestehende `surfaceFromAirportCode` Trusted-/Untrusted-Grenze unverändert erhalten.

E5-B1 darf **noch nicht**:

- lokale Flugzeit + IANA-Zone in UTC/Offset umrechnen;
- DST-Lücken oder doppelte lokale Zeiten auflösen;
- Trip-/Route-Events für E4-Anker auswählen;
- E5-A automatisch binden;
- Deadline-/Urgency-/Task-/Reminder-/Notification-Runtime bauen;
- Airport-DB/Import um Timezone erweitern;
- Supabase/RLS/Auth/MFA/AAL ändern;
- neue Provider/Secrets/paid calls aktivieren;
- E5-B2 starten.

## 4. Warum E5-B1 vor einer Zeitumrechnung kommt

Der frische Duplicate-/Integration-Precheck hat bestätigt:

- `lib/readiness/temporal-projection.ts` besitzt bereits die exakte E5-A-Arithmetik für **explizit absolute** Instants;
- `lib/flights/domain.ts` definiert Segmentzeiten ausdrücklich als lokale Flughafenzeiten;
- `lib/flights/zeit.ts` verbietet das künstliche Anhängen von `Z` oder eine Server-Timezone-Interpretation;
- `lib/route/domain.ts`, `lib/route/schema.ts` und `lib/route/kontakte.ts` tragen heute keine IANA-/Offset-Wahrheit;
- `lib/flights/duffel/antwort.ts` / `mapping.ts` verwerfen heute Duffels vorhandenes `time_zone`;
- `public.airports` / Jetnitys aktueller Airport-Import führen keine Timezone-Truth;
- Repository-Code-Suche fand keinen bestehenden Timezone-/IANA-/Temporal-Resolver und keine Timezone-Library;
- der Account-Flight-Adoption-Pfad ist server-proofed; Browser liefert dort nur Identifier;
- Browser-/Local-Storage-/Guest-Route-Daten sind dagegen bewusst untrusted.

Darum zuerst Provenance erhalten, erst in einem später **neu vorzuprüfenden** Slice absolute Event-Instants berechnen.

## 5. Produkt-Nordstern / Traveller Truth

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, keine Residence→Nationality-Inferenz und kein `documents[0]` / `evaluations[0]` als Product Truth.

## 6. Entry Requirements / Readiness – bereits auf Main

Provider-neutral vorhanden und nicht neu zu bauen:

- **S4-R1 Truth Ops:** AbortSignal, 4s Timeout, fail-closed Failure, Kill-Switch, Production Requirements Provider hard off, checkedAt-Ceiling;
- **E1 Detail Contract:** u. a. `blank_passport_pages`, `financial_means`, strukturierte Visa-Modi;
- **E2 Official Actions:** Evidence vs Action getrennt;
- **E3 Visitor Checklist:** lossless `Traveller × Credential × Destination/Transit × Requirement Type`;
- **E4 Temporal Rules:** `before | at | after`, `availableFrom`, `dueBy`, `mandatory | recommended` auf geschlossenen Anchors;
- **R1 Workspace Integration:** Official Requirement Truth und User Readiness Truth dedupliziert, aber getrennt;
- **E5-A Temporal Projection:** reine Projektion bereits explizit gebundener absoluter Event-Instants.

`requirementsProviderAus()` bleibt `null`.

## 7. Weiterhin nicht aktiv

- kein echter Requirements-/Visa-/Entry-Provider;
- keine Provider-Secrets / paid calls / Verträge / Runtime-Aktivierung;
- kein Trip/Route→Event-Occurrence-Resolver;
- keine Country→first-match-Occurrence-Logik;
- keine IANA-/Airport-/Place-Timezone-Auflösung aus geratenen Daten;
- keine automatische Workspace-Deadline-Runtime;
- keine `too early / upcoming / actionable / overdue`-State-Machine;
- keine exact Official-Requirement Task-Persistenz / Completion-State;
- keine Reminder-/Push-/E-Mail-/Notification-Runtime;
- kein Credential-Ranking / automatische beste Pass-Auswahl.

## 8. Verbindlicher Precheck vor jedem weiteren Slice

Vor **jeder** neuen Funktion, jedem neuen Slice und jedem neuen Cursor-Agenten:

1. finalen `main`, CI/Vercel, offene PRs/Issues und Agenten live prüfen;
2. gleiche/ähnliche bestehende Funktionen, Types, APIs, Tabellen und Utilities suchen;
3. Reuse-/Integration statt Parallelarchitektur erzwingen;
4. Trip Workspace, Account/Traveller, Admin, Provider, Security/Privacy und Mobile/PWA auf Auswirkungen prüfen;
5. Multi-Citizenship/Multi-Document, Auth/RLS/Ownership und Product Truth auf Regressionen prüfen;
6. betroffene Tests/Invarianten bestimmen;
7. besonderen Product-Owner-Gate prüfen;
8. erst dann kleinsten bounded Slice schneiden.

**Bei Duplicate-/Integrationsrisiko zuerst reconciliieren, dann bauen.**

## 9. Product-Owner-Gates

Besondere PO-Gates bleiben insbesondere für:

- Providerwahl, Vertrag/DPA, Secrets, paid calls und Live-Aktivierung;
- Production-Migrationen / RLS / Ownership mit realen Datenwirkungen;
- fundamentale Auth-/MFA-/AAL-Änderungen;
- sensible Pass-/Dokument-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten;
- Payments / echte Geldbewegungen;
- neue laufende Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversible externe Aktivierung.

**E5-B1 löst aktuell keinen dieser Gates aus.** Falls der tatsächliche Implementierungsbedarf doch in einen Gate-Bereich driftet: STOPP und Product Owner / Technical Lead neu entscheiden.

Supabase wird für E5-B1 nicht verändert und deshalb nicht mutiert.

## 10. GitHub Governance

`main` bleibt über Ruleset `Jetnity main protection` / ID `21875372` geschützt:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Cursor-Agenten dürfen niemals Ready setzen oder mergen. Agent-Self-Review ist kein TL-PASS. Jeder Head-Wechsel invalidiert frühere Exact-Head-Gates.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`: Schutz niemals lockern. Falls er erneut auftritt, nur identischer non-draft Recovery-PR **nach** Exact-Head-TL-PASS und mit eigenen Gates.

## 11. FIRST NEXT ACTION

Aktueller nächster Schritt:

1. TL aktualisiert `docs/ACTIVE_WORK_STATUS.md` auf E5-B1 Prepared;
2. TL stößt auf Draft PR #328 exakt den Agenten **`Jetnity entry requirements trusted event time 1`** an;
3. tatsächliche Cursor-Session-Evidence wird erst nach sichtbarer Agent-Antwort dokumentiert – niemals erfunden;
4. Agent implementiert ausschließlich E5-B1, liefert Status/Handoff/Self-Review + Gates und stoppt;
5. TL prüft danach **jede geänderte Datei** und den exakten finalen Head unabhängig;
6. Findings → `CHANGES REQUIRED` im selben Agenten/Session-Kontext;
7. PASS nur nach vollständiger Exact-Head-Evidence;
8. Merge nur durch TL;
9. Post-Merge Main-CI + Vercel Production + Continuity erneut verifizieren;
10. **kein E5-B2 automatisch**.

**Live-Evidence gewinnt immer.**
