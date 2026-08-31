# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / READINESS WORKSPACE INTEGRATION R1 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Live evidence before assumptions.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_READINESS_WORKSPACE_INTEGRATION_R1_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← **verbindlicher Zielzustand für Entry Requirements + Travel Companion**
4. `docs/READINESS_WORKSPACE_INTEGRATION_R1_HANDOFF_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_HANDOFF_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_HANDOFF_2026-08-31.md`
7. `docs/ENTRY_REQUIREMENTS_OFFICIAL_ACTIONS_E2_HANDOFF_2026-08-31.md`
8. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
9. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
10. `JETNITY_HANDOFF.md`
11. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
12. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
13. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
14. `docs/JETNITY_BINDING_BUILD_ORDER.md`

Danach GitHub/CI/Vercel und – nur bei betroffenem DB-/Security-/Storage-/Migration-Scope – Supabase **live** verifizieren.

Frühere Checkpoints bleiben historische Evidence, sind aber nicht der aktuelle Einstieg.

## 2. Aktueller Übergabe-Anker

Readiness Workspace Integration R1 ist auf `main` abgeschlossen.

Verifizierter Runtime-Merge:

`9cd5eaf472d6b55ba04d6661b12f086a0bf29d5f`

Post-Merge-Evidence:

- finaler unabhängig geprüfter R1-Head `247d473f7f0842965d9ac0cd6f0b79a276ed458f`;
- Draft-PR #320: **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** nur wegen des bekannten Draft→Ready-Connectorfehlers;
- Recovery-PR #321: **MERGED** auf exakt demselben geprüften Head;
- Exact-Head CI #1471 / Run `33388008908`: **SUCCESS**;
- Recovery-CI #1472 / Run `33389313330`: **SUCCESS**;
- Main-CI #1473 / Run `33389564305`: **SUCCESS** exakt auf `9cd5eaf4...`;
- Vercel Production `dpl_DRoFvG8xw2qDrYnrmSmmpazQezcC`: **READY** exakt auf `9cd5eaf4...`;
- Issue #319: **CLOSED / completed**.

Der docs-only Closure-PR, der diesen Einstieg aktualisiert, bewegt `main` nach dem Runtime-Merge nochmals weiter. **Finalen `main` immer live lesen.**

## 3. Aktiver Agent / aktiver Slice

Es läuft derzeit **kein Cursor-Runtime-Slice**.

Letzter Agent:

**`Jetnity readiness workspace integration 1`**, Generation 1  
Session: `bc-5bb53c9a-e6bf-4189-bd4f-bb2dc1f6eda3`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / R1 MERGED**.

Kein E5, Provider-, konkrete Deadline-Projektions-, Task-State- oder Reminder-Slice wurde automatisch gestartet.

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
- globales Official-`checkedAt`-Ceiling 60 Minuten.

### E1 – Detail Contract

- First-Class `blank_passport_pages` und `financial_means`;
- strukturierte Visa-Modi `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`;
- eTA bleibt `electronic_travel_authorization`;
- widersprüchliche `result ↔ visaMode`-Paare degradieren fail-closed.

### E2 – Official Actions

- Evidence Source und konkrete Official Action getrennt;
- `sourceUrl` nicht automatisch Antrag/Formular/Termin;
- `application | form | appointment | information` strukturierte Zwecke;
- riskante Actions nur aus expliziten validierten Metadaten;
- ungültige Action-Metadaten verändern keine Hard Truth.

### E3 – Visitor Checklist

- konkrete `OfficialEvaluation`-Zeilen im exakten Scope `Traveller × Credential-Option × Destination/Transit × Requirement Type`;
- fail-closed Result-/Freshness-Copy;
- verständliche Visa/eTA/Transit/First-Class-Typen;
- Credential-Labels nur aus exakten strukturierten Trip-/Traveller-Daten;
- Authority, Jetnity-`checkedAt`, Source/Freshness und purpose-spezifische Official Actions soweit vorhanden.

### E4 – Official Temporal Rules

- geschlossener provider-neutraler `relative_duration`-Contract;
- Anchors `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` + normalisierte Minuten;
- `availableFrom`, `dueBy`, `mandatory | recommended`;
- Timing nur aus expliziten strukturierten Official-Metadaten auf trusted/current `required | conditional`;
- Duplicate-Konflikte und unmögliche Same-Anchor-Fenster fail-closed;
- unterschiedliche Anchors ohne konkrete Event-Timestamps nicht geraten;
- nur relative Copy, noch keine konkrete Kalenderzeit.

### R1 – Workspace Integration / Deduplizierung

- Official Requirement Truth und User Readiness Truth bleiben zwei getrennte Wahrheiten;
- die primäre Workspace-UI rendert nicht länger parallel grobe `entry_check`, `visa_check`, `travel_document_check`, `insurance_check`-Karten neben der Official Checklist;
- persistierte Legacy-User-Statusdaten bleiben erhalten und werden nicht umgedeutet;
- Ticket-/Booking-/Custom-Preparation bleiben sichtbar und bedienbar;
- sichtbare User-Counts entsprechen sichtbaren persönlichen Tasks;
- nur reine leere fail-closed Placeholder werden pro Traveller/Credential/Destination/Transit zu **„Einreiseanforderungen noch nicht prüfbar“** verdichtet;
- current/stale/recheck/evidence-bearing/action/temporal/visa-spezifische Rows bleiben einzeln;
- Multi-Traveller, Multi-Credential und Transit bleiben getrennt.

Weiterhin **nicht** aktiv:

- `requirementsProviderAus()` bleibt `null`;
- kein echter Requirements-/Visa-/Entry-Provider;
- keine Provider-Secrets / paid calls / Verträge / Runtime-Aktivierung;
- keine konkrete Deadline-/Timestamp-Projektion;
- keine exact Official-Requirement Task-Persistenz;
- keine Travel-Companion Task-/Completion-State-Machine;
- keine Reminder-/Push-/E-Mail-/Notification-Runtime;
- kein Credential-Ranking / keine automatische beste Pass-Auswahl.

## 6. Verbindlicher Duplicate-/Integration-Precheck vor jedem neuen Slice

Vor **jeder** neuen Jetnity-Funktion, jedem neuen Slice und jedem neuen Cursor-Agenten muss zuerst geprüft werden:

1. aktueller `main`, CI/Vercel, offene PRs/Issues und aktive Agenten;
2. ob dieselbe oder eine ähnliche Funktion bereits ganz oder teilweise existiert;
3. vorhandene Components, Types, APIs, Tabellen, Utilities, Truth-Domänen und Provider-/Transport-Bausteine;
4. Integration mit Trip Workspace, Account/Traveller, Admin, Provider, Security/Privacy und Mobile/PWA;
5. ob vorhandene Architektur wiederverwendet oder zusammengeführt werden kann statt eine zweite Lösung zu bauen;
6. Multi-Citizenship/Multi-Document, Auth/RLS/Ownership und Product Truth auf mögliche Regressionen;
7. betroffene bestehende Tests und Invarianten.

**Keine zweite Engine, zweite Statuslogik, zweite Tabelle oder zweite UI-Welt bauen, wenn ein bestehender professioneller Baustein erweitert oder integriert werden kann.**

Bei Duplicate-/Integrationsrisiko zuerst reconciliieren, dann bauen.

## 7. Entry-Requirements-/Travel-Companion-Zielarchitektur

Verbindlicher Zielzustand:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Issue **#294 – Entry Requirements Detail Architecture** bleibt der persistente Product-Target-Tracker.

Die Zielarchitektur umfasst über den jetzigen Stand hinaus insbesondere:

- reale Official Requirements Truth über einen später separat gegateten Provider;
- konkrete Projektion belastbarer Temporal Rules auf echte Trip-/Route-Events;
- Zeitzonen-/DST-sichere Action-Fenster und Deadlines;
- Recalculation bei Reise-/Traveller-/Credential-/Evidence-Änderungen;
- konkrete Travel-Companion Task-/Completion-States;
- priorisierte und deduplizierte In-App-/Push-/gegebenenfalls E-Mail-Begleitung.

Diese Zielarchitektur ist **kein automatischer Build-Auftrag**.

## 8. Andere relevante Grenzen

- TW-8 / TW-9 bleiben blockiert, solange keine reale belastbare Commercial Truth / Provider-Evidence vorliegt.
- GitHub Hygiene Phase 1+2 ist abgeschlossen; Issue #266 ist geschlossen.
- Historische offene Draft-PRs sind keine aktuelle Runtime-Wahrheit; live verifizieren.
- Supabase wurde durch Requirements E1–E4 und R1 nicht verändert; vor DB-/RLS-/Storage-/Security-/Migration-Scope live neu prüfen und Drift reconciliieren.

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

## 10. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.**

Der Technical Lead:

1. liest den aktuellen R1-Closure-Checkpoint vollständig;
2. verifiziert finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live;
3. führt den verbindlichen Duplicate-/Integration-Precheck gegen den tatsächlichen Code durch;
4. liest Issue #294 und relevante Ziel-/Build-Order-Dokumente;
5. prüft Supabase nur bei relevantem Scope;
6. definiert erst danach den kleinsten verantwortbaren bounded Slice und respektiert besondere Product-Owner-Gates.

**Live-Evidence gewinnt immer.**
