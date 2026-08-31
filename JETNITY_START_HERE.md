# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / ENTRY REQUIREMENTS E3 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E3_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← **verbindlicher Zielzustand für Entry Requirements + Travel Companion**
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_HANDOFF_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_OFFICIAL_ACTIONS_E2_HANDOFF_2026-08-31.md`
6. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
7. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
8. `JETNITY_HANDOFF.md`
9. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
10. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
11. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
12. `docs/JETNITY_BINDING_BUILD_ORDER.md`
13. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`

Danach GitHub/CI/Vercel und – nur bei betroffenem DB-/Security-/Storage-/Migration-Scope – Supabase **live** verifizieren.

Frühere Checkpoints bleiben historische Evidence, sind aber nicht der aktuelle Einstieg.

## 2. Aktueller Übergabe-Anker

Entry Requirements E3 ist auf `main` abgeschlossen.

Verifizierter Runtime-Merge:

`5be6863a7eec7fb6b02a9ab292897a8e34c55638`

Post-Merge-Evidence:

- finaler unabhängig geprüfter E3-Head `f6d477a7294fd53b48a3bea4d738c10291c5974c`;
- Draft-PR #312: **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** nur wegen des bekannten Draft→Ready-Connectorfehlers;
- Recovery-PR #313: **MERGED**;
- Recovery-CI #1455 / Run `33375229743`: **SUCCESS**;
- Main-CI #1456 / Run `33375592234`: **SUCCESS** exakt auf `5be6863a...`;
- Vercel Production `dpl_4ubMhAhTWVKvYJvt57bk8RPKafb3`: **READY** exakt auf `5be6863a...`;
- Issue #311: **CLOSED / completed**.

Der docs-only Closure-PR, der diesen Einstieg aktualisiert, bewegt `main` nach dem Runtime-Merge nochmals weiter. **Finalen `main` immer live lesen.**

## 3. Aktiver Agent / aktiver Slice

Es läuft derzeit **kein neuer Cursor-Runtime-Slice**.

Letzter Agent:

**`Jetnity entry requirements checklist 1`**, Generation 1  
Session: `bc-101a3978-c843-4ac5-8678-112eef039283`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / E3 MERGED**.

Kein E4, Provider- oder Deadline-Slice wurde automatisch gestartet.

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

Weiterhin **nicht** aktiv:

- `requirementsProviderAus()` bleibt `null`;
- kein echter Requirements-/Visa-/Entry-Provider;
- keine Provider-Secrets / paid calls / Verträge / Runtime-Aktivierung;
- keine Travel-Companion-/Deadline-/Reminder-/Notification-Runtime;
- keine neuen Hard-Truth-Felder für Gebühren, erlaubte Aufenthaltsdauer, konkrete Seitenzahl, Proof-of-Funds-Betrag oder Zeitfenster.

## 6. Bestätigte Entry-Requirements-/Travel-Companion-Zielarchitektur

Verbindlicher Zielzustand:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Issue **#294 – Entry Requirements Detail Architecture** bleibt als persistenter Product-Target-Tracker offen.

Die Zielarchitektur umfasst über E1–E3 hinaus insbesondere:

- vollständige belastbare Detailbedingungen;
- reale Official Requirements Truth über einen später separat gegateten Provider;
- proaktive Travel-Companion-/Deadline-Logik;
- belastbare Zeitfenster wie „frühestens 72 Stunden vor Ankunft“;
- Neuberechnung bei Reiseänderungen;
- priorisierte, deduplizierte In-App-/Push-/gegebenenfalls E-Mail-Begleitung.

Diese Zielarchitektur ist **kein automatischer Build-Auftrag**.

## 7. Andere relevante Grenzen

- TW-8 / TW-9 bleiben nach dem letzten unabhängigen Audit blockiert, solange keine reale belastbare Commercial Truth / Provider-Evidence vorliegt.
- GitHub Hygiene Phase 1+2 ist abgeschlossen; Issue #266 ist geschlossen.
- Historische offene Draft-PRs sind keine aktuelle Runtime-Wahrheit.
- Supabase wurde durch Requirements E1–E3 nicht verändert; vor migrations-/DB-/RLS-/Storage-/Security-nahen Slices live erneut prüfen und Drift reconciliieren.

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
- kein Force Push / keine Löschung von `main`;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` ist kein Jetnity-Codeproblem. Branch Protection deswegen niemals lockern.

Solange der Fehler besteht: TL reviewt den exakten Draft-Head; bei PASS folgt ein non-draft Recovery-PR auf exakt demselben Commit mit eigenen CI/Vercel/Mergeability/Thread-Gates.

## 9. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.**

Der Technical Lead:

1. liest den aktuellen Closure-Checkpoint vollständig;
2. verifiziert finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live;
3. liest Issue #294 + Entry-/Travel-Companion-Zielarchitektur gegen den aktuellen Code;
4. gleicht relevante Build-Order-/Produktabhängigkeiten live ab;
5. prüft Supabase nur bei relevantem Scope;
6. definiert erst danach den kleinsten verantwortbaren bounded Slice und respektiert besondere Product-Owner-Gates.

**Live-Evidence gewinnt immer.**
