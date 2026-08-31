# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / READINESS WORKSPACE INTEGRATION R1 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter aktueller Runtime-Stand

Readiness Workspace Integration R1 ist vollständig abgeschlossen.

Verifizierter Runtime-Main:

`main@9cd5eaf472d6b55ba04d6661b12f086a0bf29d5f`

Post-Merge-Evidence:

- Issue **#319 CLOSED / completed**;
- final unabhängig geprüfter R1-Head `247d473f7f0842965d9ac0cd6f0b79a276ed458f`;
- Draft-PR **#320 CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** nur wegen `Repository.fullDatabaseId`;
- Recovery-PR **#321 MERGED**;
- Exact-Head CI **#1471 / Run `33388008908`: SUCCESS**;
- Recovery-CI **#1472 / Run `33389313330`: SUCCESS**;
- Main-CI **#1473 / Run `33389564305`: SUCCESS** exakt auf `9cd5eaf4...`;
- Vercel Production **`dpl_DRoFvG8xw2qDrYnrmSmmpazQezcC`: READY** exakt auf `9cd5eaf4...`.

Aktuellster Closure-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_READINESS_WORKSPACE_INTEGRATION_R1_CLOSED_2026-08-31.md`

## 2. Aktiver Slice / Agent

Es läuft derzeit **kein Cursor-Runtime-Slice**.

Letzter Agent:

**`Jetnity readiness workspace integration 1`**  
Generation: **1**  
Session: `bc-5bb53c9a-e6bf-4189-bd4f-bb2dc1f6eda3`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / R1 MERGED**.

Kein E5, Provider-, Deadline-Projektions-, Task-State- oder Reminder-Slice wurde automatisch gestartet.

## 3. Readiness / Entry Requirements aktueller provider-neutraler Gesamtstand

### S4-R1 – Truth Ops

- Pflicht-`AbortSignal` am Requirements Provider Port;
- harter 4.000-ms Domain-Timeout mit Cancellation;
- technische Fehler bleiben fail-closed;
- `JETNITY_READINESS_AKTIV` + Production hard off;
- Official `checkedAt` global maximal 60 Minuten;
- `requirementsProviderAus()` bleibt `null`.

### E1 – Detail Contract

- First-Class `blank_passport_pages` und `financial_means`;
- strukturierter `visaMode`: `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`;
- eTA bleibt eigener Requirement-Typ;
- widersprüchliche `result ↔ visaMode`-Paare degradieren fail-closed.

### E2 – Official Actions

- `sourceUrl` = Evidence-/Informationsquelle;
- `application | form | appointment | information` als strukturierte Action-Zwecke;
- riskante Actions nur mit explizitem validem Purpose + HTTPS-URL;
- ungültige Action-Metadaten verändern keine Hard Truth.

### E3 – Visitor Checklist

Official Evaluations werden lossless im Scope

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

angezeigt, mit fail-closed Result-/Freshness-Copy, Credential-Auflösung, Authority, `checkedAt`, Source und purpose-spezifischen Actions.

### E4 – Official Temporal Rules

- provider-neutraler `relative_duration`-Contract;
- Anchors `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` + normalisierte Minuten;
- `availableFrom`;
- `dueBy` + `mandatory | recommended`;
- Timing nur aus expliziten strukturierten Official-Metadaten und nur auf trusted/current `required | conditional`;
- Duplicate-Timing-Konflikte und unmögliche Same-Anchor-Fenster fail-closed;
- unterschiedliche Anchors werden ohne konkrete Event-Timestamps nicht geraten.

### R1 – Workspace Integration / Deduplizierung

- Official Requirement Truth und User Readiness Truth bleiben getrennt;
- primäre Workspace-UI zeigt keine parallelen groben `entry_check`, `visa_check`, `travel_document_check`, `insurance_check`-Karten mehr neben Official Requirements;
- persistierte Legacy-Readiness-Items bleiben erhalten und unverändert;
- Ticket-/Booking-/Custom-Preparation bleiben sichtbar und bedienbar;
- sichtbare persönliche Counts zählen nur sichtbare persönliche Tasks;
- reine leere fail-closed Placeholder werden pro Traveller/Credential/Destination/Transit kompakt als **„Einreiseanforderungen noch nicht prüfbar“** dargestellt;
- current/stale/recheck/evidence-bearing/action/temporal/visa-spezifische Rows bleiben einzeln sichtbar;
- Multi-Traveller, Multi-Credential und Transit bleiben getrennt.

## 4. Traveller Truth

Kanonisches Invariant:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für die konkrete Reise.

Issuer Country ≠ Citizenship. Keine Residence→Nationality-Inferenz. Kein Default-/Primary-/Preferred-/Chosen-Pass und kein `documents[0]` / `evaluations[0]` als Product Truth.

## 5. Verbindlicher Anti-Blind-Build-Precheck

Vor **jedem** neuen Jetnity-Slice gilt:

> **Audit first. Reuse before add. Integrate before duplicate. Live evidence before assumptions.**

Pflicht vor neuem Code oder neuem Agenten:

1. finalen `main`, CI/Vercel, offene PRs/Issues und aktive Agenten live prüfen;
2. prüfen, ob gleiche/ähnliche Funktion bereits vollständig oder teilweise existiert;
3. relevante Komponenten, Types, APIs, Tabellen, Utilities, Truth-Domänen und Provider-/Transport-Bausteine prüfen;
4. Architektur- und UX-Integration mit Trip Workspace, Account/Traveller, Admin, Provider, Security/Privacy und Mobile/PWA prüfen;
5. vorhandene Architektur wiederverwenden bzw. integrieren statt zweite Engine, zweite Statuslogik, zweite Tabelle oder zweite UI-Welt zu bauen;
6. Multi-Citizenship/Multi-Document, Auth/RLS/Ownership und Product Truth gegen Regressionen prüfen;
7. betroffene Tests und Invarianten bestimmen.

Bei Duplicate-/Integrations- oder Architekturkonflikt zuerst reconciliieren, dann bauen.

## 6. Weiterhin nicht aktiv / Product-Owner-Gates

Weiterhin **nicht** aktiviert:

- echter Requirements-/Visa-/Entry-Provider;
- Providerwahl / Vendorvertrag / DPA;
- Secrets / API Keys / paid calls;
- konkrete Deadline-/Timestamp-Projektion aus Trip-/Route-Events;
- Zeitzonen-/DST-Auflösung;
- exact Official-Requirement Task-Persistenz;
- Travel-Companion Task-/Completion-State;
- Reminder-/Push-/E-Mail-/Notification-Runtime;
- Credential-Ranking / automatische beste Pass-Auswahl;
- sensible Pass-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten.

Provider-Aktivierung/Verträge/Secrets/paid calls, Production-Migrationen/RLS/Ownership, sensible Daten, Payments, > USD 100 monatliche neue Kosten, Public Launch und fundamentale Auth/MFA/AAL-Änderungen bleiben Product-Owner-Gates.

## 7. Persistente Zielanker / andere Workstreams

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

TW-8 / TW-9 bleiben blockiert, solange keine reale belastbare Commercial Truth / Provider-Evidence vorhanden ist.

GitHub Hygiene Phase 1+2 ist abgeschlossen; Issue #266 ist geschlossen.

Historische offene Draft-PRs sind keine aktuelle Runtime-Wahrheit und dürfen nie blind als aktiver Stand interpretiert werden.

Supabase wurde durch E1–E4 und R1 nicht verändert. Vor DB-/RLS-/Storage-/Security-/Migration-Scope live neu prüfen und Drift reconciliieren.

## 8. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`: ausschließlich identischer non-draft Recovery-PR nach TL Exact-Head-PASS und mit eigenen Gates. Schutzregeln niemals lockern.

## 9. FIRST NEXT ACTION

**Kein Folgeslice ist automatisch freigegeben.**

Vor dem nächsten Slice:

1. aktuellen R1-Closure-Checkpoint vollständig lesen;
2. finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live prüfen;
3. den verbindlichen Duplicate-/Integration-Precheck durchführen;
4. Issue #294 und relevante Ziel-/Build-Order-Dokumente gegen den aktuellen Code abgleichen;
5. Supabase nur bei relevantem Scope live prüfen;
6. erst dann den kleinsten verantwortbaren bounded Slice definieren und besondere Product-Owner-Gates respektieren.

**Live-Evidence gewinnt immer.**
