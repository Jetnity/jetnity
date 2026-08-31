# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / ENTRY REQUIREMENTS E5-A CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den tatsächlichen Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Live evidence before assumptions.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← **bindender Zielzustand Entry Requirements / Travel Companion**
5. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_HANDOFF_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_HANDOFF_2026-08-31.md`
7. `docs/READINESS_WORKSPACE_INTEGRATION_R1_HANDOFF_2026-08-31.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_READINESS_WORKSPACE_INTEGRATION_R1_CLOSED_2026-08-31.md`
9. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
10. `JETNITY_HANDOFF.md`
11. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
12. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
13. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
14. `docs/JETNITY_BINDING_BUILD_ORDER.md`

Danach GitHub/CI/Vercel und – **nur bei betroffenem DB-/Security-/Storage-/Migration-Scope** – Supabase live verifizieren.

Frühere Checkpoints und Agenten-Handoffs bleiben historische Evidence ihres jeweiligen Heads; sie ersetzen nie Live-Evidence.

## 2. Aktueller Übergabe-Anker

Entry Requirements E5-A ist abgeschlossen.

Verifizierter Runtime-Merge:

`a4c0c57e144e694435cfe2b1970a76239f1ef7d5`

Post-Merge-Evidence auf diesem Runtime-Merge:

- finaler unabhängig geprüfter E5-A-Head `82c2c268f26c5aa9ee73dfd8f9e0c179aa4376a2`;
- Draft-PR #324: **CLOSED / NOT MERGED / mechanically superseded** nur wegen des bekannten Draft→Ready-Connectorfehlers;
- Recovery-PR #325: **MERGED** auf exakt demselben geprüften Head;
- Exact-Head CI #1487 / Run `33399165391`: **SUCCESS**;
- Recovery-CI #1488 / Run `33399594912`: **SUCCESS**;
- Main Post-Merge CI #1489 / Run `33399900924`: **SUCCESS** exakt auf `a4c0c57e...`;
- Vercel Preview `dpl_B27uxXp9BQYmM6W2sb8bWWgUSaC6`: **READY** exakt auf `82c2c268...`;
- Vercel Production `dpl_BQxP84NVgxFDYwpziDpidvFEXpk8`: **READY** exakt auf `a4c0c57e...`;
- Issue #323: **CLOSED / completed**;
- Parent Issue #294: offen und weiterhin bindender Product-Target-Tracker.

Der docs-only Closure-PR, der diesen Einstieg aktualisiert, bewegt `main` nach dem Runtime-Merge nochmals weiter. **Finalen `main` immer live lesen.**

## 3. Aktiver Agent / aktiver Slice

Es läuft derzeit **kein Cursor-Runtime-Slice**.

Letzter Runtime-Agent:

**`Jetnity entry requirements temporal projection 1`**, Generation 1

Ursprüngliche Implementation-Session:

`bc-01a057e1-e45f-79d8-a828-97be0e060415`

Vom Technical Lead genehmigter mechanischer Review-Fix-Recovery-Carrier:

`bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`

Status: **STOPPED / DELIVERY COMPLETE / TL PASS / E5-A MERGED**.

Die Recovery-Session war keine neue Generation und kein neuer Slice; sie wurde nur eingesetzt, weil die abgeschlossene Original-Session technisch nicht wieder geöffnet werden konnte.

**Kein E5-B, Provider-, Resolver-, Workspace-Deadline-, Task-State- oder Reminder-Slice wurde automatisch gestartet.**

## 4. Produkt-Nordstern / Traveller Truth

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, keine Residence→Nationality-Inferenz und kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 5. Entry Requirements / Readiness – aktueller provider-neutraler Unterbau

### S4-R1 – Truth Ops

- Pflicht-`AbortSignal` am Requirements Provider Port;
- 4.000-ms Domain-Timeout mit Cancellation;
- fail-closed technische Failure-Semantik;
- Readiness-Kill-Switch `JETNITY_READINESS_AKTIV`;
- Production für Requirements Provider hart aus;
- Official-`checkedAt`-Ceiling 60 Minuten.

### E1 – Detail Contract

- First-Class `blank_passport_pages` und `financial_means`;
- strukturierte Visa-Modi;
- eTA eigener Requirement-Typ;
- widersprüchliche Result-/Visa-Mode-Paare fail-closed.

### E2 – Official Actions

- Evidence Source und konkrete Official Action getrennt;
- `application | form | appointment | information` strukturiert;
- riskante Actions nur aus expliziten validierten Metadaten;
- ungültige Action-Metadaten ändern keine Hard Truth.

### E3 – Visitor Checklist

- lossless Official-Evaluation-Scope **Traveller × Credential-Option × Destination/Transit × Requirement Type**;
- fail-closed Result-/Freshness-Copy;
- exakte Credential-Labels aus strukturierten Trip-/Traveller-Daten;
- Authority, checkedAt, Evidence/Freshness und purpose-spezifische Official Actions soweit vorhanden.

### E4 – Official Temporal Rules

- geschlossener provider-neutraler `relative_duration`-Contract;
- Anchors `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` + normalisierte Minuten;
- `availableFrom`, `dueBy`, `mandatory | recommended`;
- Timing nur aus expliziten strukturierten Official-Metadaten;
- Duplicate-Konflikte und unmögliche Same-Anchor-Fenster fail-closed.

### R1 – Workspace Integration / Deduplizierung

- Official Requirement Truth und User Readiness Truth bleiben getrennt;
- keine parallelen groben Entry-/Visa-/Document-/Insurance-Placeholder neben der Official Checklist;
- persistierte Legacy-User-Statusdaten bleiben erhalten;
- Ticket-/Booking-/Custom-Preparation bleiben sichtbar;
- sichtbare User-Counts entsprechen sichtbaren persönlichen Tasks;
- reine leere Placeholder werden pro Traveller/Credential/Destination/Transit kompakt verdichtet;
- current/stale/recheck/evidence-bearing/action/temporal/visa-spezifische Rows bleiben einzeln;
- Multi-Traveller, Multi-Credential und Transit bleiben getrennt.

### E5-A – Exact Event-Instant Projection Core

- reiner Next-freier Projektions-Core in `lib/readiness/temporal-projection.ts`;
- E4-Typen werden wiederverwendet;
- Input bindet benötigte Anchors explizit an `{ eventRef, instant }`;
- nur absolute RFC3339/ISO-Date-Time-Werte mit `Z` oder numerischem Offset;
- keine Trip-/Route-/Country-/first-match-Auswahl;
- keine IANA-/Airport-/Place-Zeitzonenheuristik;
- `before | at | after` deterministisch in UTC projiziert;
- `dueBy.semantics` und `eventRef`-Provenance bleiben erhalten;
- `missing_anchor`, `invalid_instant`, `invalid_projected_window` fail-closed;
- frische leere Projection pro Aufruf;
- whitespace-only `eventRef` fail-closed;
- explizite RFC3339 numeric offsets `HH 00..23` / `MM 00..59`, keine künstliche UTC−12/+14-Weltzonen-Hülle.

`requirementsProviderAus()` bleibt `null`.

## 6. Weiterhin nicht aktiv

- kein echter Requirements-/Visa-/Entry-Provider;
- keine Provider-Secrets / paid calls / Verträge / Runtime-Aktivierung;
- kein Trip/Route→Event-Occurrence-Resolver;
- keine Country→first-match-Occurrence-Logik;
- keine IANA-/Airport-/Place-Timezone-Auflösung;
- keine automatische Workspace-Deadline-Runtime aus Reiseevents;
- keine `too early / upcoming / actionable / overdue`-State-Machine;
- keine exact Official-Requirement Task-Persistenz;
- keine Travel-Companion Task-/Completion-State-Machine;
- keine Reminder-/Push-/E-Mail-/Notification-Runtime;
- kein Credential-Ranking / keine automatische beste Pass-Auswahl.

## 7. Verbindlicher Duplicate-/Integration-Precheck vor jedem neuen Slice

Vor **jeder** neuen Jetnity-Funktion, jedem neuen Slice und jedem neuen Cursor-Agenten:

1. finalen `main`, CI/Vercel, offene PRs/Issues und aktive Agenten live prüfen;
2. prüfen, ob gleiche/ähnliche Funktion schon ganz oder teilweise existiert;
3. Components, Types, APIs, Tabellen, Utilities, Truth-Domänen und Provider-/Transport-Bausteine prüfen;
4. Integration mit Trip Workspace, Account/Traveller, Admin, Provider, Security/Privacy und Mobile/PWA prüfen;
5. vorhandene Architektur wiederverwenden/integrieren statt zweite Engine, Statuslogik, Tabelle oder UI-Welt zu bauen;
6. Multi-Citizenship/Multi-Document, Auth/RLS/Ownership und Product Truth auf Regressionen prüfen;
7. betroffene Tests und Invarianten bestimmen.

**Bei Duplicate-/Integrationsrisiko zuerst reconciliieren, dann bauen.**

## 8. Persistente Zielanker / Product-Owner-Gates

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen und bindend. Die Zielarchitektur ist **kein automatischer Build-Auftrag**.

Besondere Product-Owner-Gates bleiben insbesondere für:

- Providerwahl, Vertrag/DPA, Secrets, paid calls und Live-Aktivierung;
- Production-Migrationen / RLS / Ownership mit realen Datenwirkungen;
- fundamentale Auth-/MFA-/AAL-Änderungen;
- sensible Pass-/Dokument-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten;
- Payments / echte Geldbewegungen;
- neue laufende Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversible externe Aktivierung.

TW-8 / TW-9 bleiben blockiert, solange reale belastbare Commercial Truth / Provider-Evidence fehlt.

Supabase wurde durch E5-A nicht verändert. Vor DB-/RLS-/Storage-/Security-/Migration-Scope live neu prüfen und Drift reconciliieren.

## 9. GitHub Governance

`main` bleibt über Ruleset `Jetnity main protection` / ID `21875372` geschützt.

Pflicht:

- PR vor Merge;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` ist kein Jetnity-Codeproblem. Schutz deswegen niemals lockern. Nach TL Exact-Head-PASS nur identischer non-draft Recovery-PR mit eigenen Gates.

Agent-Self-Review ist kein TL-PASS. Jeder Head-Wechsel invalidiert frühere Exact-Head-Gates.

## 10. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben. Kein E5-B wurde gestartet.**

Der Technical Lead:

1. liest den aktuellen E5-A-Closure-Checkpoint vollständig;
2. verifiziert finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live;
3. führt den verbindlichen Duplicate-/Integration-Precheck gegen den tatsächlichen Code durch;
4. liest Issue #294, Zielarchitektur und `docs/JETNITY_BINDING_BUILD_ORDER.md`;
5. prüft Supabase nur bei relevantem DB-/Security-Scope;
6. definiert erst danach den kleinsten verantwortbaren bounded Slice und respektiert besondere Product-Owner-Gates.

**Live-Evidence gewinnt immer.**
