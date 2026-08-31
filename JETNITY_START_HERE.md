# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / ENTRY REQUIREMENTS E4 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E4_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← **verbindlicher Zielzustand für Entry Requirements + Travel Companion**
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_HANDOFF_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_HANDOFF_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_OFFICIAL_ACTIONS_E2_HANDOFF_2026-08-31.md`
7. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
8. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
9. `JETNITY_HANDOFF.md`
10. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
11. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
12. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
13. `docs/JETNITY_BINDING_BUILD_ORDER.md`

Danach GitHub/CI/Vercel und – nur bei betroffenem DB-/Security-/Storage-/Migration-Scope – Supabase **live** verifizieren.

Frühere Checkpoints bleiben historische Evidence, sind aber nicht der aktuelle Einstieg.

## 2. Aktueller Übergabe-Anker

Entry Requirements E4 ist auf `main` abgeschlossen.

Verifizierter Runtime-Merge:

`08fe34c9a170262912ac0252d2272d49585f4cdf`

Post-Merge-Evidence:

- finaler unabhängig geprüfter E4-Head `86b568d2863b6abc9abacc1bd482bfb45e8884f3`;
- erster Agenten-Head wurde wegen eines vom TL gefundenen unmöglichen Same-Anchor-Zeitfensters nicht freigegeben;
- Fix erfolgte in derselben Agenten-Session;
- Draft-PR #316: **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** nur wegen des bekannten Draft→Ready-Connectorfehlers;
- Recovery-PR #317: **MERGED**;
- Recovery-CI #1465 / Run `33382654747`: **SUCCESS**;
- Main-CI #1466 / Run `33382895693`: **SUCCESS** exakt auf `08fe34c9...`;
- Vercel Production `dpl_AyDTo4xTWQEn5F3TBY4bzr5XS5FY`: **READY** exakt auf `08fe34c9...`;
- Issue #315: **CLOSED / completed**.

Der docs-only Closure-PR, der diesen Einstieg aktualisiert, bewegt `main` nach dem Runtime-Merge nochmals weiter. **Finalen `main` immer live lesen.**

## 3. Aktiver Agent / aktiver Slice

Es läuft derzeit **kein neuer Cursor-Runtime-Slice**.

Letzter Agent:

**`Jetnity entry requirements temporal rules 1`**, Generation 1  
Session: `bc-69084bbc-a7ab-4ed5-8418-754bea9ee241`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / E4 MERGED**.

Kein E5, Provider-, konkrete Deadline-Projektions- oder Reminder-Slice wurde automatisch gestartet.

## 4. Produkt-Nordstern / Traveller Truth

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 5. Entry Requirements – aktueller provider-neutraler Unterbau

### Truth-Ops S4-R1

- Pflicht-`AbortSignal` am Requirements Provider Port;
- 4.000-ms Domain-Timeout mit Cancellation;
- fail-closed technische Failure-Semantik;
- Readiness-Kill-Switch `JETNITY_READINESS_AKTIV`;
- Production für Requirements Provider hart aus;
- globales Official-`checkedAt`-Ceiling von 60 Minuten.

### E1 – Detail Contract

- First-Class `blank_passport_pages` und `financial_means`;
- strukturierter `visaMode`: `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`;
- eTA bleibt `electronic_travel_authorization`;
- widersprüchliche `result ↔ visaMode`-Paare degradieren fail-closed.

### E2 – Official Actions

- Evidence Source und konkrete Official Action sind getrennt;
- `sourceUrl` ist nicht automatisch Antrag/Formular/Termin;
- `application | form | appointment | information` als strukturierte Zwecke;
- riskante Actions nur aus expliziten, validierten Metadaten;
- ungültige Action-Metadaten verändern keine Hard Truth.

### E3 – Visitor Checklist

- jede `OfficialEvaluation` wird als eigene Besucherzeile im exakten Scope `Traveller × Credential-Option × Destination/Transit × Requirement Type` dargestellt;
- fail-closed Result-/Freshness-Copy;
- Visa/eTA/Transit/First-Class-Typen verständlich gruppiert;
- Credential-Labels nur aus exakten strukturierten Trip-/Traveller-Daten;
- Authority, Jetnity-`checkedAt`, Source/Freshness und purpose-spezifische Official Actions sichtbar, soweit strukturiert vorhanden.

### E4 – Official Temporal Rules

- geschlossener provider-neutraler `relative_duration`-Contract;
- Anchors: `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` mit normalisiertem Minuten-Offset;
- `availableFrom` und `dueBy`;
- `dueBy` unterscheidet `mandatory | recommended`;
- Timing nur aus expliziten strukturierten Official-Metadaten;
- Timing nur auf trusted/current `required | conditional`;
- stale/unknown/unavailable/not_required/Visa-Conflict tragen kein aktuelles Timing;
- malformed Timing zerstört keine ansonsten valide Requirement-Hard-Truth;
- Duplicate-Timing-Konflikte werden fail-closed ohne First-Row-Wins behandelt;
- deterministisch unmögliche Same-Anchor-Fenster werden verworfen;
- unterschiedliche Anchors werden ohne konkrete Event-Timestamps nicht geraten;
- relative Copy wie `Ab 72 Std. vor Ankunft möglich`, aber noch keine konkrete Datum-/Uhrzeit-Projektion.

Weiterhin **nicht** aktiv:

- `requirementsProviderAus()` bleibt `null`;
- kein echter Requirements-/Visa-/Entry-Provider;
- keine Provider-Secrets / paid calls / Verträge / Runtime-Aktivierung;
- keine konkrete Deadline-/Timestamp-Projektion;
- keine Travel-Companion Task-/Completion-State-Machine;
- keine Reminder-/Push-/E-Mail-/Notification-Runtime.

## 6. Bestätigte Entry-Requirements-/Travel-Companion-Zielarchitektur

Verbindlicher Zielzustand:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Issue **#294 – Entry Requirements Detail Architecture** bleibt als persistenter Product-Target-Tracker offen.

Die Zielarchitektur umfasst über E1–E4 hinaus insbesondere:

- reale Official Requirements Truth über einen später separat gegateten Provider;
- konkrete Projektion belastbarer Temporal Rules auf echte Trip-/Route-Events;
- Zeitzonen-/DST-sichere Deadline-/Action-Fenster;
- Recalculation bei Reiseänderungen;
- Travel-Companion Task-/Completion-State;
- priorisierte, deduplizierte In-App-/Push-/gegebenenfalls E-Mail-Begleitung.

Diese Zielarchitektur ist **kein automatischer Build-Auftrag**.

## 7. Andere relevante Grenzen

- TW-8 / TW-9 bleiben nach dem letzten unabhängigen Audit blockiert, solange keine reale belastbare Commercial Truth / Provider-Evidence vorliegt.
- GitHub Hygiene Phase 1+2 ist abgeschlossen; Issue #266 ist geschlossen.
- Historische offene Draft-PRs sind keine aktuelle Runtime-Wahrheit.
- Supabase wurde durch Requirements E1–E4 nicht verändert; vor migrations-/DB-/RLS-/Storage-/Security-nahen Slices live erneut prüfen und Drift reconciliieren.

## 8. GitHub Governance

`main` bleibt über Ruleset `Jetnity main protection` / ID `21875372` geschützt.

Pflicht:

- PR vor Merge;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- nur Merge;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` ist kein Jetnity-Codeproblem. Branch Protection deswegen niemals lockern.

Solange der Fehler besteht: TL reviewt den exakten Draft-Head; bei PASS folgt ein non-draft Recovery-PR auf exakt demselben Commit mit eigenen CI/Vercel/Mergeability/Thread-Gates.

## 9. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.**

Der Technical Lead:

1. liest den aktuellen E4-Closure-Checkpoint vollständig;
2. verifiziert finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live;
3. liest Issue #294 + Entry-/Travel-Companion-Zielarchitektur gegen den aktuellen Code;
4. gleicht relevante Build-Order-/Produktabhängigkeiten und Truth-Grenzen live ab;
5. prüft Supabase nur bei relevantem Scope;
6. definiert erst danach den kleinsten verantwortbaren bounded Slice und respektiert besondere Product-Owner-Gates.

**Live-Evidence gewinnt immer.**
